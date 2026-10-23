"""
app/satellite/coregistration.py — Pre/post disaster satellite image co-registration.

Why Co-registration Matters:
In satellite-based disaster damage assessment and change detection, pre-event and
post-event acquisitions are compared at the pixel level (e.g., via Siamese U-Net
feature subtraction, cross-attention, or spectral differencing).
Pixel misalignment is the single most common cause of false-positive damage predictions.
Even a subtle shift of 1–2 pixels (10–20 meters in Sentinel-2) produces severe artificial
edge artifacts along building contours, coastlines, and transport networks, falsely
indicating widespread destruction.

This module guarantees that pre- and post-event satellite images:
1. Are projected into the identical target Coordinate Reference System (CRS).
2. Share identical pixel ground sampling distance (GSD / resolution).
3. Are cropped to the exact spatial intersection of the two scenes.
4. Align pixel-for-pixel into identical (H, W, C) arrays normalized to [0, 1] float32.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
import zipfile

from loguru import logger
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, transform_bounds


# ─────────────────────────────────────────────────────────────────────────────
# Custom Exception
# ─────────────────────────────────────────────────────────────────────────────


class CoregistrationError(Exception):
    """Raised when satellite image co-registration or reprojection fails."""


# ─────────────────────────────────────────────────────────────────────────────
# Path Resolver Helper
# ─────────────────────────────────────────────────────────────────────────────


def _resolve_raster_uri(path: Path) -> str:
    """
    Resolve a given path to a rasterio-readable dataset URI.

    Handles:
    - Standard GeoTIFF, JPEG2000, or raster files (.tif, .tiff, .jp2, .vrt, etc.).
    - ZIP archives downloaded from Copernicus Data Space Ecosystem (CDSE) Zipper,
      inspecting archive members and using GDAL /vsizip/ virtual filesystem syntax.
    - Unpacked SAFE directories or folders containing raster files.

    Args:
        path: Path to the raster file, archive, or directory.

    Returns:
        URI string suitable for passing directly to rasterio.open().

    Raises:
        CoregistrationError: If the path does not exist or no valid raster is found.
    """
    if not path.exists():
        raise CoregistrationError(f"Raster source path does not exist: {path}")

    # Case 1: ZIP Archive (e.g. from CDSE Zipper download)
    if path.is_file() and path.suffix.lower() == ".zip":
        try:
            with zipfile.ZipFile(path, "r") as z:
                namelist = z.namelist()

                # Priority 1: Sentinel-2 True Color Image (TCI) at 10m
                tci_files = [
                    n for n in namelist
                    if ("TCI_10m" in n or "TCI" in n) and n.lower().endswith((".jp2", ".tif", ".tiff"))
                ]
                if tci_files:
                    selected = tci_files[0]
                    logger.debug("Resolved ZIP archive {} to TCI raster: {}", path.name, selected)
                    return f"/vsizip/{path.as_posix()}/{selected}"

                # Priority 2: Any GeoTIFF file
                tif_files = [n for n in namelist if n.lower().endswith((".tif", ".tiff"))]
                if tif_files:
                    selected = tif_files[0]
                    logger.debug("Resolved ZIP archive {} to GeoTIFF raster: {}", path.name, selected)
                    return f"/vsizip/{path.as_posix()}/{selected}"

                # Priority 3: Any JPEG2000 raster band
                jp2_files = [n for n in namelist if n.lower().endswith(".jp2")]
                if jp2_files:
                    selected = jp2_files[0]
                    logger.debug("Resolved ZIP archive {} to JP2 raster: {}", path.name, selected)
                    return f"/vsizip/{path.as_posix()}/{selected}"

                raise CoregistrationError(f"No GeoTIFF or JP2 rasters found within ZIP archive: {path}")
        except zipfile.BadZipFile as exc:
            raise CoregistrationError(f"Corrupt or invalid ZIP archive at {path}: {exc}") from exc

    # Case 2: Directory (e.g. unzipped SAFE package)
    if path.is_dir():
        # Look for TCI or any GeoTIFF / JP2
        tci_candidates = list(path.glob("**/*TCI*10m*.jp2")) or list(path.glob("**/*TCI*.jp2"))
        if tci_candidates:
            return tci_candidates[0].as_posix()

        tif_candidates = list(path.glob("**/*.tif")) or list(path.glob("**/*.tiff"))
        if tif_candidates:
            return tif_candidates[0].as_posix()

        jp2_candidates = list(path.glob("**/*.jp2"))
        if jp2_candidates:
            return jp2_candidates[0].as_posix()

        raise CoregistrationError(f"No valid raster files found within directory: {path}")

    # Case 3: Direct raster file
    return path.as_posix()


# ─────────────────────────────────────────────────────────────────────────────
# Normalization Helper
# ─────────────────────────────────────────────────────────────────────────────


def _normalize_to_float32(arr: np.ndarray) -> np.ndarray:
    """
    Normalize pixel values to [0.0, 1.0] float32.

    Handles:
    - Arrays already within [0.0, 1.0].
    - Standard 8-bit unsigned integer data [0, 255] (scaled by 1 / 255.0).
    - Sentinel-2 Level-2A surface reflectance scaled by 10,000 (DN / 10000.0).
    - 16-bit integers and general float data via min-max scaling with NaN protection.

    Args:
        arr: Input numpy array of arbitrary numeric dtype.

    Returns:
        Numpy array of shape arr.shape with float32 values in range [0.0, 1.0].
    """
    out = arr.astype(np.float32)
    # Replace non-finite values (NaN, Inf) with 0.0
    np.nan_to_num(out, copy=False, nan=0.0, posinf=1.0, neginf=0.0)

    min_val = float(np.min(out))
    max_val = float(np.max(out))

    # Constant array check
    if max_val <= min_val:
        return np.zeros_like(out, dtype=np.float32)

    # Already within [0.0, 1.0]
    if min_val >= 0.0 and max_val <= 1.0:
        return out

    # Standard 8-bit imagery [0, 255]
    if min_val >= 0.0 and max_val <= 255.0:
        return np.clip(out / 255.0, 0.0, 1.0)

    # Sentinel-2 L2A BOA reflectance (nominal range 0–10,000 with occasional specular highlights)
    if min_val >= 0.0 and max_val <= 10000.0:
        return np.clip(out / 10000.0, 0.0, 1.0)

    # Arbitrary range / SAR / 16-bit min-max scaling
    scaled = (out - min_val) / (max_val - min_val)
    return np.clip(scaled, 0.0, 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# Main Co-registration Function
# ─────────────────────────────────────────────────────────────────────────────


def coregister_pair(
    pre_path: Path,
    post_path: Path,
    target_crs: str = "EPSG:4326",
) -> tuple[np.ndarray, np.ndarray]:
    """
    Co-register and align pre-disaster and post-disaster satellite imagery.

    Steps performed:
    1. Open both images with rasterio.
    2. Reproject both into `target_crs` using `rasterio.warp.reproject` and
       `rasterio.warp.calculate_default_transform`.
    3. Compute the geographic intersection bounding box of the two images.
    4. Resample both images to the finer of the two pixel resolutions using bilinear interpolation.
    5. Clip both scenes to the intersection bounding box on the aligned grid.
    6. Read both as numpy arrays of shape (H, W, C) where C = number of bands.
    7. Assert that array shapes match exactly; raise `CoregistrationError` if they do not.
    8. Normalize pixel values to [0.0, 1.0] float32.
    9. Log original CRS, target CRS, and shapes before and after alignment.
    10. Return (pre_array, post_array) as float32 numpy arrays.

    Args:
        pre_path: Path to pre-event raster file or CDSE ZIP download.
        post_path: Path to post-event raster file or CDSE ZIP download.
        target_crs: Coordinate Reference System string for alignment (default: 'EPSG:4326').

    Returns:
        Tuple of (pre_array, post_array), each a numpy ndarray of shape (H, W, C)
        with float32 values in range [0.0, 1.0].

    Raises:
        CoregistrationError: If rasters cannot be opened, do not overlap, or shape alignment fails.
    """
    pre_uri = _resolve_raster_uri(pre_path)
    post_uri = _resolve_raster_uri(post_path)

    try:
        with rasterio.open(pre_uri) as pre_src, rasterio.open(post_uri) as post_src:
            # Validate coordinate reference systems
            if pre_src.crs is None:
                raise CoregistrationError(f"Pre-event raster {pre_path} has undefined CRS.")
            if post_src.crs is None:
                raise CoregistrationError(f"Post-event raster {post_path} has undefined CRS.")

            # Step 9 (part 1): Log original CRS and input shapes
            logger.info("Co-registration input metadata:")
            logger.info("  Pre-event source: '{}' | CRS: {}", pre_path.name, pre_src.crs)
            logger.info("  Post-event source: '{}' | CRS: {}", post_path.name, post_src.crs)
            logger.info("  Target CRS: {}", target_crs)
            logger.info(
                "  Pre shape before alignment: (H={}, W={}, C={})",
                pre_src.height,
                pre_src.width,
                pre_src.count,
            )
            logger.info(
                "  Post shape before alignment: (H={}, W={}, C={})",
                post_src.height,
                post_src.width,
                post_src.count,
            )

            # Step 2: Transform bounds of both rasters to target_crs
            pre_bounds = transform_bounds(
                pre_src.crs,
                target_crs,
                pre_src.bounds.left,
                pre_src.bounds.bottom,
                pre_src.bounds.right,
                pre_src.bounds.top,
            )
            post_bounds = transform_bounds(
                post_src.crs,
                target_crs,
                post_src.bounds.left,
                post_src.bounds.bottom,
                post_src.bounds.right,
                post_src.bounds.top,
            )

            # Step 3: Find intersection bounding box [min_x, min_y, max_x, max_y]
            inter_min_x = max(pre_bounds[0], post_bounds[0])
            inter_min_y = max(pre_bounds[1], post_bounds[1])
            inter_max_x = min(pre_bounds[2], post_bounds[2])
            inter_max_y = min(pre_bounds[3], post_bounds[3])

            if inter_min_x >= inter_max_x or inter_min_y >= inter_max_y:
                raise CoregistrationError(
                    f"Images do not spatially overlap in target CRS '{target_crs}'. "
                    f"Pre-event bounds: {pre_bounds}, Post-event bounds: {post_bounds}"
                )

            # Step 4: Resample both to identical pixel resolution (use the finer of the two)
            pre_t, pre_w, pre_h = calculate_default_transform(
                pre_src.crs,
                target_crs,
                pre_src.width,
                pre_src.height,
                *pre_src.bounds,
            )
            post_t, post_w, post_h = calculate_default_transform(
                post_src.crs,
                target_crs,
                post_src.width,
                post_src.height,
                *post_src.bounds,
            )

            # In affine transforms, 'a' is pixel width (dx) and 'e' is pixel height (dy, negative)
            # Finer resolution corresponds to the smaller pixel delta
            res_x = min(abs(pre_t.a), abs(post_t.a))
            res_y = min(abs(pre_t.e), abs(post_t.e))

            if res_x <= 0 or res_y <= 0:
                raise CoregistrationError(f"Calculated invalid pixel resolution: ({res_x}, {res_y})")

            # Step 5: Clip both to intersection bounding box on the unified grid
            out_width = int(round((inter_max_x - inter_min_x) / res_x))
            out_height = int(round((inter_max_y - inter_min_y) / res_y))

            if out_width <= 0 or out_height <= 0:
                raise CoregistrationError(
                    f"Computed non-positive intersection dimensions: width={out_width}, height={out_height}"
                )

            dst_transform = from_bounds(
                inter_min_x,
                inter_min_y,
                inter_max_x,
                inter_max_y,
                out_width,
                out_height,
            )

            # Reproject pre-event bands into intersection array
            pre_aligned = np.zeros((pre_src.count, out_height, out_width), dtype=np.float32)
            for b in range(1, pre_src.count + 1):
                reproject(
                    source=rasterio.band(pre_src, b),
                    destination=pre_aligned[b - 1],
                    src_transform=pre_src.transform,
                    src_crs=pre_src.crs,
                    dst_transform=dst_transform,
                    dst_crs=target_crs,
                    resampling=Resampling.bilinear,
                )

            # Reproject post-event bands into intersection array
            post_aligned = np.zeros((post_src.count, out_height, out_width), dtype=np.float32)
            for b in range(1, post_src.count + 1):
                reproject(
                    source=rasterio.band(post_src, b),
                    destination=post_aligned[b - 1],
                    src_transform=post_src.transform,
                    src_crs=post_src.crs,
                    dst_transform=dst_transform,
                    dst_crs=target_crs,
                    resampling=Resampling.bilinear,
                )

    except rasterio.RasterioIOError as exc:
        raise CoregistrationError(f"Rasterio I/O error during co-registration: {exc}") from exc

    # Step 6: Convert from (C, H, W) to (H, W, C)
    pre_hwc = np.transpose(pre_aligned, (1, 2, 0))
    post_hwc = np.transpose(post_aligned, (1, 2, 0))

    # Step 7: Assert shapes match
    if pre_hwc.shape != post_hwc.shape:
        raise CoregistrationError(
            f"Aligned array shape mismatch: pre-event shape is {pre_hwc.shape}, "
            f"whereas post-event shape is {post_hwc.shape}. "
            f"Images must have identical spatial dimensions and band count."
        )

    # Step 8: Normalize pixel values to [0, 1] float32
    pre_norm = _normalize_to_float32(pre_hwc)
    post_norm = _normalize_to_float32(post_hwc)

    # Step 9 (part 2): Log post-alignment status
    logger.info("Co-registration successfully aligned image pair:")
    logger.info("  Aligned output shape: {} (H, W, C)", pre_norm.shape)
    logger.info("  Value ranges — pre: [{:.3f}, {:.3f}], post: [{:.3f}, {:.3f}]",
                float(pre_norm.min()), float(pre_norm.max()),
                float(post_norm.min()), float(post_norm.max()))

    # Step 10: Return pre and post arrays as float32
    return pre_norm, post_norm


# ─────────────────────────────────────────────────────────────────────────────
# Helper: RGB Band Extraction
# ─────────────────────────────────────────────────────────────────────────────


def extract_rgb_bands(array: np.ndarray, sensor: str = "sentinel2") -> np.ndarray:
    """
    Extract a standard 3-channel (H, W, 3) RGB representation from multi-spectral or SAR data.

    Channel mappings:
    - Sentinel-2 ('sentinel2' or 's2'):
      Standard L2A product band order has Red = Band 4 (index 3), Green = Band 3 (index 2),
      Blue = Band 2 (index 1). If the input array already has 3 channels (e.g. from a TCI
      True Color Image), channels [0, 1, 2] are preserved.
    - Sentinel-1 ('sentinel1' or 's1'):
      Single VV polarization channel is replicated across 3 channels to create a 3-channel
      grayscale RGB representation compatible with standard 3-channel convolutional backbones.

    Args:
        array: Input numpy array of shape (H, W, C) or (H, W).
        sensor: Sensor name ('sentinel2' or 'sentinel1', case-insensitive).

    Returns:
        Numpy array of shape (H, W, 3) with float32 values.

    Raises:
        ValueError: If input dimensions are invalid or the sensor is not recognized.
    """
    sensor_key = sensor.lower().replace("-", "").replace("_", "")

    if sensor_key in ("sentinel2", "s2"):
        if array.ndim != 3:
            raise ValueError(
                f"Sentinel-2 array must have 3 dimensions (H, W, C), got shape {array.shape}"
            )
        num_channels = array.shape[2]
        if num_channels >= 4:
            # Extract Band 4 (Red), Band 3 (Green), Band 2 (Blue) -> indices 3, 2, 1
            rgb = array[:, :, [3, 2, 1]]
        elif num_channels == 3:
            # Already 3-channel True Color Image
            rgb = array[:, :, :3]
        else:
            raise ValueError(
                f"Sentinel-2 array has only {num_channels} bands. At least 4 bands "
                f"(or 3 for TCI) are required for RGB extraction."
            )
        return rgb.astype(np.float32)

    elif sensor_key in ("sentinel1", "s1"):
        # Replicate single VV band across 3 channels (grayscale RGB)
        if array.ndim == 3:
            vv = array[:, :, 0]
        elif array.ndim == 2:
            vv = array
        else:
            raise ValueError(
                f"Sentinel-1 array must have 2 or 3 dimensions, got shape {array.shape}"
            )
        rgb = np.stack([vv, vv, vv], axis=-1)
        return rgb.astype(np.float32)

    else:
        raise ValueError(
            f"Unsupported sensor '{sensor}'. Expected 'sentinel2' (optical) or 'sentinel1' (SAR)."
        )
