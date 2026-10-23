"""
Training pipeline for the Siamese U-Net on the xBD dataset.

PREREQUISITE: Download the xBD dataset manually from https://xview2.org/
(free registration required — cannot be automated due to registration wall).
Place the downloaded data at ./xbd/ with the standard xBD directory structure:
  xbd/
    train/images/     (pre/post GeoTIFF pairs)
    train/labels/     (JSON annotation files)
    tier3/images/
    tier3/labels/
    hold/images/
    hold/labels/

Training command:
    python -m app.ml.train --epochs 50 --batch-size 4 --lr 1e-4

The model uses transfer learning: ImageNet-pretrained ResNet34 encoder,
only decoder + last encoder block fine-tuned initially.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Optional, Union

import albumentations as A
from loguru import logger
import numpy as np
import rasterio
import rasterio.features
from shapely import wkt
from sklearn.metrics import f1_score
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader, Dataset

from app.ml.model import (
    CLASS_TO_IDX,
    DAMAGE_CLASSES,
    IDX_TO_CLASS,
    NUM_CLASSES,
    SiameseUNet,
)

# ─────────────────────────────────────────────────────────────────────────────
# Subtype Mapping for xBD Challenge
# ─────────────────────────────────────────────────────────────────────────────

XBD_SUBTYPE_MAP: dict[str, int] = {
    "no-damage": 0,
    "no_damage": 0,
    "un-classified": 0,
    "unclassified": 0,
    "minor-damage": 1,
    "minor_damage": 1,
    "major-damage": 2,
    "major_damage": 2,
    "destroyed": 3,
}

# ImageNet normalization parameters
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


# ─────────────────────────────────────────────────────────────────────────────
# Dataset Loader
# ─────────────────────────────────────────────────────────────────────────────


class XBDDataset(Dataset):
    """
    PyTorch Dataset loader for the xBD (xView2) building damage dataset.

    Pairs pre-disaster and post-disaster satellite images, loads polygon
    annotations from JSON metadata, rasterizes them into a multi-class
    segmentation target mask, and applies albumentations transforms.
    """

    def __init__(
        self,
        data_dir: Union[str, Path],
        split: str = "train",
        augment: bool = True,
        crop_size: int = 256,
    ) -> None:
        """
        Initialize the xBD dataset split.

        Args:
            data_dir: Root directory of the xBD dataset (e.g. Path('./xbd')).
            split: Data split directory name ('train', 'tier3', 'hold').
            augment: Whether to apply spatial/color augmentations (train vs val).
            crop_size: Height and width of the square image crops (default: 256).
        """
        self.data_dir = Path(data_dir)
        self.split = split
        self.augment = augment
        self.crop_size = crop_size

        self.samples: list[tuple[Path, Path, Path]] = []
        self._discover_samples()

        # Build spatial augmentation pipeline (applied jointly to pre, post, and mask)
        if self.augment:
            self.spatial_transform = A.Compose(
                [
                    A.RandomCrop(crop_size, crop_size),
                    A.HorizontalFlip(p=0.5),
                    A.VerticalFlip(p=0.5),
                    A.RandomRotate90(p=0.5),
                ],
                additional_targets={"post_image": "image"},
            )
            # Photometric augmentation (applied only to optical imagery, never to label mask)
            self.color_transform = A.Compose(
                [
                    A.ColorJitter(brightness=0.2, contrast=0.2, p=0.5),
                ]
            )
        else:
            self.spatial_transform = A.Compose(
                [
                    A.CenterCrop(crop_size, crop_size),
                ],
                additional_targets={"post_image": "image"},
            )
            self.color_transform = None

        # Normalization with standard ImageNet statistics
        self.norm_transform = A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)

    def _discover_samples(self) -> None:
        """Scan data_dir / split / labels for matching post/pre pairs."""
        labels_dir = self.data_dir / self.split / "labels"
        images_dir = self.data_dir / self.split / "images"

        if not labels_dir.is_dir():
            logger.warning(
                f"xBD labels directory not found: {labels_dir}. "
                f"Ensure the xBD dataset is downloaded to '{self.data_dir}' per instructions."
            )
            return

        image_extensions = [".png", ".tif", ".tiff", ".jpg", ".jpeg"]
        post_json_files = sorted(labels_dir.glob("*_post_disaster.json"))

        for post_json_path in post_json_files:
            base_post_name = post_json_path.stem
            base_pre_name = base_post_name.replace("_post_disaster", "_pre_disaster")

            # Resolve post image path
            post_img_path: Optional[Path] = None
            for ext in image_extensions:
                cand = images_dir / f"{base_post_name}{ext}"
                if cand.is_file():
                    post_img_path = cand
                    break

            # Resolve pre image path
            pre_img_path: Optional[Path] = None
            for ext in image_extensions:
                cand = images_dir / f"{base_pre_name}{ext}"
                if cand.is_file():
                    pre_img_path = cand
                    break

            if post_img_path and pre_img_path:
                self.samples.append((pre_img_path, post_img_path, post_json_path))
            else:
                logger.debug(
                    f"Skipping incomplete sample pair for '{base_post_name}' in split '{self.split}'"
                )

        logger.info(
            f"xBD split '{self.split}': indexed {len(self.samples)} valid pre/post pairs."
        )

    def __len__(self) -> int:
        return len(self.samples)

    @staticmethod
    def _rasterize_labels(
        label_json: dict[str, Any],
        height: int,
        width: int,
        transform: Optional[Any] = None,
    ) -> np.ndarray:
        """
        Parse xBD label JSON format and rasterize building polygon annotations.

        xBD JSON files store building polygons under features -> xy.
        Each feature has a WKT string in pixel coordinates and a subtype property
        ('no-damage', 'minor-damage', 'major-damage', 'destroyed', 'un-classified').

        Returns:
            np.ndarray: Integer mask of shape (height, width) with class indices 0..3.
        """
        shapes = []
        features_xy = label_json.get("features", {}).get("xy", [])

        # Sort features so higher damage classes overwrite lower ones on overlapping boundaries
        sorted_features = sorted(
            features_xy,
            key=lambda f: XBD_SUBTYPE_MAP.get(
                str(f.get("properties", {}).get("subtype", "no-damage")).strip().lower(), 0
            ),
        )

        for feat in sorted_features:
            wkt_str = feat.get("wkt")
            if not wkt_str:
                continue
            try:
                geom = wkt.loads(wkt_str)
                subtype = str(feat.get("properties", {}).get("subtype", "no-damage")).strip().lower()
                val = XBD_SUBTYPE_MAP.get(subtype, 0)
                shapes.append((geom, val))
            except Exception as exc:
                logger.debug(f"Failed to parse building WKT: {exc}")
                continue

        if not shapes:
            return np.zeros((height, width), dtype=np.int64)

        raster_transform = transform if transform is not None else rasterio.Affine.identity()
        mask = rasterio.features.rasterize(
            shapes=shapes,
            out_shape=(height, width),
            fill=0,
            transform=raster_transform,
            dtype=np.int64,
        )
        return mask

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Load, rasterize, augment, and return a single pre/post/mask sample.

        Returns:
            pre_tensor: (3, H, W) float32 normalized image tensor.
            post_tensor: (3, H, W) float32 normalized image tensor.
            mask_tensor: (H, W) int64 target damage class index mask.
        """
        if idx >= len(self.samples):
            raise IndexError(f"Index {idx} out of range for dataset with {len(self.samples)} items.")

        pre_path, post_path, label_path = self.samples[idx]

        # 1. Load optical pre-disaster image
        with rasterio.open(pre_path) as src:
            pre_img = src.read([1, 2, 3])  # Read first 3 channels (RGB)
            height, width = src.height, src.width
        pre_img = np.moveaxis(pre_img, 0, -1)  # (3, H, W) -> (H, W, 3)
        if pre_img.dtype != np.uint8:
            pre_img = np.clip(pre_img, 0, 255).astype(np.uint8)

        # 2. Load optical post-disaster image
        with rasterio.open(post_path) as src:
            post_img = src.read([1, 2, 3])
        post_img = np.moveaxis(post_img, 0, -1)
        if post_img.dtype != np.uint8:
            post_img = np.clip(post_img, 0, 255).astype(np.uint8)

        # 3. Load & rasterize building damage annotations
        with open(label_path, "r", encoding="utf-8") as f:
            label_data = json.load(f)
        mask = self._rasterize_labels(label_data, height=height, width=width)

        # 4. Joint spatial transforms
        transformed = self.spatial_transform(
            image=pre_img,
            post_image=post_img,
            mask=mask,
        )
        pre_aug = transformed["image"]
        post_aug = transformed["post_image"]
        mask_aug = transformed["mask"]

        # 5. Photometric augmentations (images only)
        if self.color_transform is not None:
            pre_aug = self.color_transform(image=pre_aug)["image"]
            post_aug = self.color_transform(image=post_aug)["image"]

        # 6. ImageNet normalization
        pre_norm = self.norm_transform(image=pre_aug)["image"]
        post_norm = self.norm_transform(image=post_aug)["image"]

        # 7. Convert to PyTorch tensors
        # (H, W, 3) -> (3, H, W) float32
        pre_tensor = torch.from_numpy(pre_norm).permute(2, 0, 1).float()
        post_tensor = torch.from_numpy(post_norm).permute(2, 0, 1).float()
        mask_tensor = torch.from_numpy(mask_aug).long()

        return pre_tensor, post_tensor, mask_tensor


# ─────────────────────────────────────────────────────────────────────────────
# Training Pipeline
# ─────────────────────────────────────────────────────────────────────────────


class XBDTrainer:
    """
    Manages the training, validation, metric evaluation, and checkpointing
    for the SiameseUNet architecture on xBD building damage data.
    """

    def __init__(
        self,
        model: SiameseUNet,
        train_loader: DataLoader,
        val_loader: DataLoader,
        device: torch.device,
        lr: float = 1e-4,
        checkpoint_dir: Union[str, Path] = "checkpoints",
    ) -> None:
        """
        Initialize the trainer.

        Args:
            model: SiameseUNet model instance.
            train_loader: DataLoader for the training set.
            val_loader: DataLoader for the validation / holdout set.
            device: Target torch device (cuda or cpu).
            lr: Initial learning rate (default: 1e-4).
            checkpoint_dir: Output directory for saving model checkpoints.
        """
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.lr = lr
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.optimizer = AdamW(self.model.parameters(), lr=lr, weight_decay=1e-4)
        self.scheduler = CosineAnnealingLR(self.optimizer, T_max=50, eta_min=1e-6)

        # Inverse-frequency class weights for cross-entropy loss:
        # In xBD, undamaged background is abundant while destroyed/major-damage buildings are rare.
        class_weights = torch.tensor([0.5, 2.5, 3.5, 4.0], dtype=torch.float32, device=device)
        self.criterion = nn.CrossEntropyLoss(weight=class_weights)

        self.best_f1: float = 0.0

    def train_epoch(self, epoch: int) -> dict[str, float]:
        """
        Execute a single training epoch across all batches.

        Args:
            epoch: Current 1-based epoch index.

        Returns:
            Dictionary with training summary metrics (e.g. average loss).
        """
        self.model.train()
        total_loss = 0.0
        n_batches = 0

        for batch_idx, (pre, post, mask) in enumerate(self.train_loader):
            pre = pre.to(self.device, non_blocking=True)
            post = post.to(self.device, non_blocking=True)
            mask = mask.to(self.device, non_blocking=True)

            self.optimizer.zero_grad()
            logits = self.model(pre, post)
            loss = self.criterion(logits, mask)
            loss.backward()

            # Gradient clipping to stabilize training
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item()
            n_batches += 1

            if (batch_idx + 1) % 25 == 0 or (batch_idx + 1) == len(self.train_loader):
                logger.debug(
                    f"Epoch [{epoch}] Batch [{batch_idx + 1}/{len(self.train_loader)}] — "
                    f"Batch Loss: {loss.item():.4f}"
                )

        self.scheduler.step()
        avg_loss = total_loss / max(1, n_batches)
        current_lr = self.optimizer.param_groups[0]["lr"]
        logger.info(
            f"Epoch [{epoch}] Train Complete — Avg Loss: {avg_loss:.4f}, LR: {current_lr:.2e}"
        )
        return {"loss": avg_loss, "lr": current_lr}

    def validate(self, epoch: int) -> dict[str, Any]:
        """
        Run validation and evaluate per-class and macro F1 scores.

        Args:
            epoch: Current 1-based epoch index.

        Returns:
            Dictionary containing validation loss, macro F1, and per-class F1 scores.
        """
        self.model.eval()
        total_loss = 0.0
        n_batches = 0

        all_preds: list[np.ndarray] = []
        all_targets: list[np.ndarray] = []

        with torch.no_grad():
            for pre, post, mask in self.val_loader:
                pre = pre.to(self.device, non_blocking=True)
                post = post.to(self.device, non_blocking=True)
                mask = mask.to(self.device, non_blocking=True)

                logits = self.model(pre, post)
                loss = self.criterion(logits, mask)
                total_loss += loss.item()
                n_batches += 1

                preds = torch.argmax(logits, dim=1)
                all_preds.append(preds.cpu().numpy().ravel())
                all_targets.append(mask.cpu().numpy().ravel())

        avg_loss = total_loss / max(1, n_batches) if n_batches > 0 else 0.0

        if not all_preds:
            logger.warning("Validation loader was empty — returning 0.0 F1 scores.")
            return {"val_loss": avg_loss, "macro_f1": 0.0, "f1_per_class": {}}

        flat_preds = np.concatenate(all_preds)
        flat_targets = np.concatenate(all_targets)

        # Compute per-class F1 scores (average=None)
        per_class_f1 = f1_score(
            flat_targets,
            flat_preds,
            average=None,
            labels=[0, 1, 2, 3],
            zero_division=0,
        )

        macro_f1 = float(np.mean(per_class_f1))
        # Damage-specific harmonic/macro mean (excluding class 0: no_damage)
        damage_f1 = float(np.mean(per_class_f1[1:]))

        f1_dict = {IDX_TO_CLASS[i]: float(per_class_f1[i]) for i in range(NUM_CLASSES)}

        logger.info(
            f"Epoch [{epoch}] Validation — Val Loss: {avg_loss:.4f}, "
            f"Macro F1: {macro_f1:.4f}, Damage F1: {damage_f1:.4f}"
        )
        for cls_name, score in f1_dict.items():
            logger.info(f"  └─ Class '{cls_name}' F1: {score:.4f}")

        return {
            "val_loss": avg_loss,
            "macro_f1": macro_f1,
            "damage_f1": damage_f1,
            "f1_per_class": f1_dict,
        }

    def run(self, num_epochs: int) -> None:
        """
        Execute full training loop over the specified number of epochs.

        Args:
            num_epochs: Total number of training epochs to execute.
        """
        logger.info(
            f"Starting SiameseUNet training for {num_epochs} epochs on device '{self.device}'."
        )

        for epoch in range(1, num_epochs + 1):
            train_metrics = self.train_epoch(epoch)
            val_metrics = self.validate(epoch)

            current_f1 = val_metrics.get("macro_f1", 0.0)

            # Checkpoint whenever validation macro F1 improves
            if current_f1 > self.best_f1:
                logger.success(
                    f"Macro F1 improved from {self.best_f1:.4f} to {current_f1:.4f}. "
                    f"Saving best checkpoint..."
                )
                self.best_f1 = current_f1
                best_path = self.checkpoint_dir / "siamese_unet_best.pth"
                self.model.save_checkpoint(
                    best_path,
                    epoch=epoch,
                    optimizer_state=self.optimizer.state_dict(),
                    metrics={**train_metrics, **val_metrics},
                )

            # Also maintain latest checkpoint for crash recovery
            latest_path = self.checkpoint_dir / "siamese_unet_latest.pth"
            self.model.save_checkpoint(
                latest_path,
                epoch=epoch,
                optimizer_state=self.optimizer.state_dict(),
                metrics={**train_metrics, **val_metrics},
            )

        logger.info(
            f"Training complete. Best Validation Macro F1: {self.best_f1:.4f}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# CLI Entrypoint
# ─────────────────────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for training configuration."""
    parser = argparse.ArgumentParser(
        description="Train Siamese U-Net on the xBD building damage dataset."
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs (default: 50).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="DataLoader batch size (default: 4).",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=1e-4,
        help="Learning rate for AdamW optimizer (default: 1e-4).",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="./xbd",
        help="Root path to the xBD dataset directory (default: ./xbd).",
    )
    parser.add_argument(
        "--checkpoint-dir",
        type=str,
        default="checkpoints",
        help="Directory to save model checkpoints (default: checkpoints).",
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Path to an existing .pth checkpoint to resume training from.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training hardware accelerator: {device}")

    # Initialize or resume model
    if args.resume:
        logger.info(f"Resuming training from checkpoint: {args.resume}")
        model = SiameseUNet.load_checkpoint(Path(args.resume), device=device)
    else:
        logger.info("Instantiating fresh SiameseUNet with ImageNet-pretrained ResNet34 backbone.")
        model = SiameseUNet(
            encoder_name="resnet34",
            encoder_weights="imagenet",
            in_channels=3,
            num_classes=NUM_CLASSES,
        )
        model.to(device)

    # Prepare datasets and loaders
    data_dir = Path(args.data_dir)
    train_dataset = XBDDataset(data_dir=data_dir, split="train", augment=True)
    val_dataset = XBDDataset(data_dir=data_dir, split="hold", augment=False)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )

    trainer = XBDTrainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        device=device,
        lr=args.lr,
        checkpoint_dir=args.checkpoint_dir,
    )

    trainer.run(num_epochs=args.epochs)
