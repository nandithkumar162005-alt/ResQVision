"""
app/ml/infer.py — Real inference path using trained SiameseUNet checkpoint.

This module is only used when MOCK_INFERENCE=false AND a trained checkpoint
exists at settings.model_checkpoint_path. For development and demos,
use MOCK_INFERENCE=true (app/ml/mock_infer.py) instead.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Optional, Union

import numpy as np
from loguru import logger

# ── Lightweight types — zero heavy-dependency imports ─────────────────────────
# DamagePoint and InferenceResult live in types.py so that mock_infer.py,
# zone_clustering.py, population_overlay.py, and the test suite can import
# them without triggering the torch / PIL / SMP import chain.
from app.ml.types import DamagePoint, InferenceResult  # noqa: F401  (re-exported)

from app.schemas import BoundingBox

if TYPE_CHECKING:
    # Only used for type annotations — never executed at runtime in test envs.
    from app.ml.model import SiameseUNet

# ─────────────────────────────────────────────────────────────────────────────
# Dataclasses
# ─────────────────────────────────────────────────────────────────────────────


# DamagePoint and InferenceResult are defined in app.ml.types and re-exported
# above. This section is intentionally empty — do not re-define them here.


# ─────────────────────────────────────────────────────────────────────────────
# Model Loading & Preprocessing
# ─────────────────────────────────────────────────────────────────────────────


def load_model(checkpoint_path: Union[str, Path]) -> "SiameseUNet":
    """
    Load a trained SiameseUNet model from disk.

    Args:
        checkpoint_path: Path to the .pth weights file.

    Returns:
        SiameseUNet model instance in evaluation mode on the target device.

    Raises:
        FileNotFoundError: If the checkpoint file is not found on disk.
    """
    # Lazy import — torch and SiameseUNet are only needed when actually loading
    # a real model checkpoint (i.e. MOCK_INFERENCE=false).
    import torch  # noqa: PLC0415
    from app.ml.model import SiameseUNet  # noqa: PLC0415

    path = Path(checkpoint_path)
    if not path.is_file():
        raise FileNotFoundError(
            f"Model checkpoint not found at '{path.resolve()}'. "
            f"Train a model first using 'python -m app.ml.train' or set "
            f"MOCK_INFERENCE=true in your .env configuration."
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SiameseUNet.load_checkpoint(path, device=device)

    total_params = sum(p.numel() for p in model.parameters())
    logger.info(
        f"Initialized SiameseUNet from '{path}' on device '{device}' with {total_params:,} parameters."
    )
    return model


def preprocess_for_model(
    array: np.ndarray,
    target_size: tuple[int, int] = (512, 512),
    device: Optional["torch.device"] = None,
) -> "torch.Tensor":
    """
    Prepare a raw optical raster array for input into the SiameseUNet.

    Ensures the array has 3 channels (RGB), resizes to the model's required
    input resolution (512x512), scales intensities to [0, 1], applies standard
    ImageNet normalization, and adds a batch dimension.

    Args:
        array: Input numpy array of shape (H, W, 3) or (3, H, W).
        target_size: Desired (height, width) dimensions for model input.
        device: Target torch device. If None, resolves to CUDA if available, else CPU.

    Returns:
        Tensor of shape (1, 3, target_size[0], target_size[1]) on the specified device.
    """
    # Lazy imports — PIL and torch only needed during real inference.
    import torch  # noqa: PLC0415
    from PIL import Image  # noqa: PLC0415

    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Standardize channel layout to (H, W, C)
    if array.ndim == 3 and array.shape[0] == 3 and array.shape[2] != 3:
        array = np.transpose(array, (1, 2, 0))

    if array.ndim != 3 or array.shape[2] < 3:
        raise ValueError(
            f"Expected image with at least 3 channels, got shape {array.shape}"
        )

    # Use first 3 channels (RGB)
    img = array[:, :, :3]

    # Convert to uint8 in range [0, 255] for PIL resizing
    if img.dtype != np.uint8:
        if np.max(img) <= 1.0:
            img_uint8 = np.clip(img * 255.0, 0, 255).astype(np.uint8)
        else:
            img_uint8 = np.clip(img, 0, 255).astype(np.uint8)
    else:
        img_uint8 = img

    # Resize to target square dimensions if needed
    h, w = img_uint8.shape[:2]
    if (h, w) != target_size:
        pil_img = Image.fromarray(img_uint8)
        pil_img = pil_img.resize(target_size, resample=Image.Resampling.BILINEAR)
        img_uint8 = np.array(pil_img)

    # Convert to float32 [0.0, 1.0]
    img_float = img_uint8.astype(np.float32) / 255.0

    # ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (img_float - mean) / std

    # (H, W, 3) -> (1, 3, H, W)
    tensor = torch.from_numpy(norm).permute(2, 0, 1).unsqueeze(0).float()
    return tensor.to(device)


# ─────────────────────────────────────────────────────────────────────────────
# Inference Execution
# ─────────────────────────────────────────────────────────────────────────────


def run_inference(
    model: SiameseUNet,
    pre_array: np.ndarray,
    post_array: np.ndarray,
    bbox: BoundingBox,
) -> InferenceResult:
    """
    Run real SiameseUNet inference on pre- and post-disaster satellite imagery.

    Performs:
    1. Preprocessing and ImageNet normalization.
    2. Forward pass through SiameseUNet to generate class logits.
    3. Softmax probability and argmax class index computation.
    4. Per-class pixel counting across the full assessment extent.
    5. Overall damage score calculation (0–100) weighted across all pixels.
    6. Extraction and georeferencing of damaged building points (excluding 'no_damage').

    Args:
        model: Loaded SiameseUNet in eval mode.
        pre_array: Pre-disaster optical raster array (RGB).
        post_array: Post-disaster optical raster array (RGB).
        bbox: Geographic bounding box of the imagery extent.

    Returns:
        InferenceResult containing damage points, damage score, and pixel counts.
    """
    # Lazy imports — torch and model constants only needed during real inference.
    import torch  # noqa: PLC0415
    from app.ml.model import (  # noqa: PLC0415
        CLASS_TO_IDX,
        DAMAGE_CLASSES,
        DAMAGE_WEIGHTS,
        IDX_TO_CLASS,
    )

    device = next(model.parameters()).device
    model.eval()

    pre_tensor = preprocess_for_model(pre_array, device=device)
    post_tensor = preprocess_for_model(post_array, device=device)

    with torch.no_grad():
        logits = model(pre_tensor, post_tensor)  # (1, 4, H, W)
        probs = torch.softmax(logits, dim=1)      # (1, 4, H, W)
        preds = torch.argmax(probs, dim=1)       # (1, H, W)

    preds_np = preds.squeeze(0).cpu().numpy()     # (H, W)
    probs_np = probs.squeeze(0).cpu().numpy()     # (4, H, W)
    h, w = preds_np.shape
    total_pixels = h * w

    # Compute pixel counts per class across the entire raster
    pixel_counts = {
        cls_name: int(np.sum(preds_np == idx))
        for cls_name, idx in CLASS_TO_IDX.items()
    }

    # Compute weighted damage score across all pixels (0 to 100)
    total_weighted = sum(
        pixel_counts[cls_name] * DAMAGE_WEIGHTS[cls_name]
        for cls_name in DAMAGE_CLASSES
    )
    raw_score = (total_weighted / max(1, total_pixels)) * 100.0
    damage_score = int(np.clip(round(raw_score), 0, 100))

    # Convert damaged pixels (class != 'no_damage') to georeferenced DamagePoints
    # To prevent generating tens of thousands of individual points, sample systematically
    # up to ~500 points from the damaged pixel set.
    damaged_rows, damaged_cols = np.where(preds_np > 0)
    num_damaged = len(damaged_rows)

    damage_points: list[DamagePoint] = []

    if num_damaged > 0:
        # Sample step to cap extracted points at around 500
        step = max(1, num_damaged // 500)
        for i in range(0, num_damaged, step):
            r = int(damaged_rows[i])
            c = int(damaged_cols[i])
            cls_idx = int(preds_np[r, c])
            cls_name = IDX_TO_CLASS[cls_idx]
            conf = float(probs_np[cls_idx, r, c])

            # Bilinear interpolation of pixel coordinates to latitude/longitude
            # Row 0 is at max_lat (North), Row h-1 is at min_lat (South)
            # Col 0 is at min_lng (West), Col w-1 is at max_lng (East)
            lat = bbox.max_lat - (r / max(1, h - 1)) * (bbox.max_lat - bbox.min_lat)
            lng = bbox.min_lng + (c / max(1, w - 1)) * (bbox.max_lng - bbox.min_lng)

            # Defensive clamp to bounding box
            lat = max(bbox.min_lat, min(bbox.max_lat, lat))
            lng = max(bbox.min_lng, min(bbox.max_lng, lng))

            damage_points.append(
                DamagePoint(
                    lat=round(lat, 6),
                    lng=round(lng, 6),
                    damage_class=cls_name,
                    confidence=round(conf, 4),
                )
            )

    logger.info(
        f"Real inference complete: {len(damage_points)} damage points sampled "
        f"from {num_damaged} damaged pixels. Overall damage score: {damage_score}/100."
    )

    return InferenceResult(
        damage_points=damage_points,
        damage_score=damage_score,
        pixel_counts=pixel_counts,
        model_mode="real",
    )
