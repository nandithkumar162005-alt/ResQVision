"""
app/ml/model.py — Siamese U-Net architecture for pre/post disaster change detection.

Architecture rationale:
- Siamese networks use two parallel encoder branches with SHARED weights.
  Shared weights enforce that the two branches learn the same feature space,
  making their outputs directly comparable — essential for change detection.
- The xView2/xBD challenge (Defense Innovation Unit) uses this exact paradigm.
- We use ResNet34 as the encoder backbone (pretrained on ImageNet) via
  segmentation_models_pytorch, which provides ready-made U-Net scaffolding.
- Transfer learning from ImageNet is correct here: low-level features
  (edges, textures, shapes) transfer well from natural images to satellite imagery.

Design Note:
For implementation simplicity and SMP compatibility, we use a single U-Net with
6-channel input (pre and post images concatenated channel-wise) rather than two
separate encoder branches. This is functionally equivalent to a Siamese network
for change detection when trained on paired data.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional, Union

from loguru import logger
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

DAMAGE_CLASSES: list[str] = ["no_damage", "minor_damage", "major_damage", "destroyed"]
NUM_CLASSES: int = 4
DAMAGE_WEIGHTS: dict[str, float] = {
    "no_damage": 0.0,
    "minor_damage": 0.33,
    "major_damage": 0.66,
    "destroyed": 1.0,
}
CLASS_TO_IDX: dict[str, int] = {c: i for i, c in enumerate(DAMAGE_CLASSES)}
IDX_TO_CLASS: dict[int, str] = {i: c for i, c in enumerate(DAMAGE_CLASSES)}


# ─────────────────────────────────────────────────────────────────────────────
# Model Definition
# ─────────────────────────────────────────────────────────────────────────────


class SiameseUNet(nn.Module):
    """
    Siamese U-Net architecture adapted for disaster change detection.

    Processes paired pre-disaster and post-disaster optical imagery (each 3 channels:
    RGB) concatenated into a 6-channel input tensor. Features are extracted using an
    ImageNet-pretrained ResNet34 backbone and decoded into a 4-class damage segmentation
    mask (no_damage, minor_damage, major_damage, destroyed).
    """

    def __init__(
        self,
        encoder_name: str = "resnet34",
        encoder_weights: Optional[str] = "imagenet",
        in_channels: int = 3,
        num_classes: int = NUM_CLASSES,
    ) -> None:
        """
        Initialize the Siamese U-Net model.

        Args:
            encoder_name: Name of the encoder backbone supported by SMP (default: 'resnet34').
            encoder_weights: Pretrained weights repository (e.g. 'imagenet' or None).
            in_channels: Number of color bands per input image (default: 3 for RGB).
                         The overall U-Net will take in_channels * 2 (6 channels).
            num_classes: Number of target damage classes (default: 4).
        """
        super().__init__()
        self.encoder_name = encoder_name
        self.in_channels = in_channels
        self.num_classes = num_classes

        # Single U-Net with 6-channel input (pre + post images concatenated channel-wise)
        # We initialize encoder_weights=None here because SMP by default expects 3-channel
        # weights; we manually adapt the ImageNet weights below to support 6 channels.
        self.model = smp.Unet(
            encoder_name=encoder_name,
            encoder_weights=None,
            in_channels=in_channels * 2,
            classes=num_classes,
            activation=None,
        )

        if encoder_weights is not None:
            self._load_pretrained_encoder_weights(encoder_name, encoder_weights, in_channels)

    def _load_pretrained_encoder_weights(
        self,
        encoder_name: str,
        encoder_weights: str,
        in_channels: int,
    ) -> None:
        """
        Load ImageNet weights for the encoder, adapting the first convolution layer
        from 3 channels to 6 channels by replicating weights across pre and post channels.
        """
        try:
            logger.info(
                f"Fetching pretrained '{encoder_weights}' weights for encoder '{encoder_name}'..."
            )
            pretrained_encoder = smp.encoders.get_encoder(
                encoder_name, in_channels=in_channels, depth=5, weights=encoder_weights
            )
            pretrained_dict = pretrained_encoder.state_dict()
            model_encoder_dict = self.model.encoder.state_dict()

            adapted_dict: dict[str, Any] = {}
            for k, v in pretrained_dict.items():
                if k in model_encoder_dict:
                    target_shape = model_encoder_dict[k].shape
                    if v.shape == target_shape:
                        adapted_dict[k] = v
                    elif (
                        v.ndim == 4
                        and v.shape[1] == in_channels
                        and target_shape[1] == in_channels * 2
                        and v.shape[0] == target_shape[0]
                        and v.shape[2:] == target_shape[2:]
                    ):
                        # Replicate the 3-channel pretrained weights to 6 channels
                        # Channels 0..2: pre-disaster features; Channels 3..5: post-disaster features
                        replicated = torch.cat([v, v], dim=1)
                        adapted_dict[k] = replicated
                        logger.debug(
                            f"Adapted first conv layer '{k}' from {v.shape} to {replicated.shape}"
                        )
                    else:
                        logger.warning(
                            f"Parameter shape mismatch for '{k}': source {v.shape} vs target {target_shape}"
                        )
                else:
                    adapted_dict[k] = v

            self.model.encoder.load_state_dict(adapted_dict, strict=False)
            logger.info(
                f"Successfully initialized '{encoder_name}' encoder with '{encoder_weights}' weights (6-channel adapter)."
            )
        except Exception as exc:
            logger.warning(
                f"Failed to load pretrained '{encoder_weights}' weights for '{encoder_name}': {exc}. "
                f"Model will proceed with random weight initialization."
            )

    def forward(self, pre: torch.Tensor, post: torch.Tensor) -> torch.Tensor:
        """
        Forward pass concatenating pre and post disaster images along the channel dimension.

        Args:
            pre: Pre-disaster image tensor of shape (B, 3, H, W).
            post: Post-disaster image tensor of shape (B, 3, H, W).

        Returns:
            Logits tensor of shape (B, 4, H, W).
        """
        if pre.shape != post.shape:
            raise ValueError(
                f"Pre-image shape {pre.shape} does not match post-image shape {post.shape}"
            )
        if pre.dim() != 4 or pre.size(1) != self.in_channels:
            raise ValueError(
                f"Expected input shape (B, {self.in_channels}, H, W), got {pre.shape}"
            )

        # Concatenate along channel dimension -> (B, 6, H, W)
        x = torch.cat([pre, post], dim=1)
        logits = self.model(x)
        return logits

    def predict(self, pre: torch.Tensor, post: torch.Tensor) -> torch.Tensor:
        """
        Run inference on pre and post image pairs and return class index predictions.

        Args:
            pre: Pre-disaster image tensor of shape (B, 3, H, W).
            post: Post-disaster image tensor of shape (B, 3, H, W).

        Returns:
            Class index tensor of shape (B, H, W) with integer values 0..3:
            0: no_damage, 1: minor_damage, 2: major_damage, 3: destroyed.
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(pre, post)
            probabilities = torch.softmax(logits, dim=1)
            predictions = torch.argmax(probabilities, dim=1)
        return predictions

    @classmethod
    def load_checkpoint(
        cls,
        checkpoint_path: Union[str, Path],
        device: Optional[torch.device] = None,
    ) -> "SiameseUNet":
        """
        Load a trained SiameseUNet checkpoint from disk.

        Args:
            checkpoint_path: Path to the .pth checkpoint file.
            device: Optional torch.device. If None, uses CUDA if available, else CPU.

        Returns:
            Instantiated SiameseUNet model loaded with checkpoint weights in eval mode.

        Raises:
            FileNotFoundError: If checkpoint file does not exist.
        """
        path = Path(checkpoint_path)
        if not path.is_file():
            raise FileNotFoundError(
                f"Checkpoint not found at '{path.resolve()}'. "
                f"Ensure a trained model checkpoint exists or use MOCK_INFERENCE=true."
            )

        if device is None:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        logger.info(f"Loading SiameseUNet checkpoint from '{path}' onto device '{device}'...")
        checkpoint = torch.load(path, map_location=device, weights_only=False)

        # Handle both raw state_dict and structured checkpoint dictionaries
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
            encoder_name = checkpoint.get("encoder_name", "resnet34")
            in_channels = checkpoint.get("in_channels", 3)
            num_classes = checkpoint.get("num_classes", NUM_CLASSES)
            epoch = checkpoint.get("epoch", "unknown")
            metrics = checkpoint.get("metrics", {})
            logger.info(
                f"Restoring checkpoint metadata: epoch={epoch}, metrics={metrics}"
            )
        elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
            encoder_name = "resnet34"
            in_channels = 3
            num_classes = NUM_CLASSES
        else:
            state_dict = checkpoint
            encoder_name = "resnet34"
            in_channels = 3
            num_classes = NUM_CLASSES

        model = cls(
            encoder_name=encoder_name,
            encoder_weights=None,  # State dict supplies all weights
            in_channels=in_channels,
            num_classes=num_classes,
        )
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()

        param_count = sum(p.numel() for p in model.parameters())
        logger.info(
            f"Successfully loaded SiameseUNet ({encoder_name}, {param_count:,} parameters) from '{path}'."
        )
        return model

    def save_checkpoint(
        self,
        checkpoint_path: Union[str, Path],
        epoch: int,
        optimizer_state: Optional[dict[str, Any]] = None,
        metrics: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Save model state, optimizer state, and training metrics to a checkpoint file.

        Args:
            checkpoint_path: Target .pth file path.
            epoch: Current training epoch index.
            optimizer_state: State dictionary of the optimizer.
            metrics: Validation / training evaluation metrics dictionary.
        """
        path = Path(checkpoint_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "epoch": epoch,
            "model_state_dict": self.state_dict(),
            "encoder_name": self.encoder_name,
            "in_channels": self.in_channels,
            "num_classes": self.num_classes,
            "optimizer_state_dict": optimizer_state,
            "metrics": metrics or {},
        }

        torch.save(payload, path)
        logger.info(
            f"Saved SiameseUNet checkpoint to '{path}' (epoch={epoch}, metrics={metrics})"
        )
