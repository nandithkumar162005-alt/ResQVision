"""
app/geo/zone_clustering.py — Collapse raw damage points into clustered critical zones.

The ML inference pipeline (real or mock) produces potentially hundreds of
individual DamagePoint objects. Stream 3 and Stream 4 need a manageable set
of representative zones (≤ 25) for map visualisation and emergency dispatch.

We use DBSCAN (Density-Based Spatial Clustering) rather than K-Means because:
- DBSCAN doesn't require pre-specifying the number of clusters.
- DBSCAN handles arbitrary cluster shapes (real disaster damage is irregular).
- DBSCAN naturally handles noise/outliers (isolated damaged buildings far from
  the main damage zone).
- Outlier points (DBSCAN label -1) are still included as individual zones if
  they are destroyed or major_damage classified, so no critical data is lost.

Architecture note:
    This module only surfaces 'destroyed' and 'major_damage' zones to Stream 3.
    'minor_damage' and 'no_damage' points are filtered out before clustering
    to keep Stream 4's map uncluttered and emergency dispatch focused on the
    genuinely critical areas.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import TYPE_CHECKING

import numpy as np
from loguru import logger
from sklearn.cluster import DBSCAN

from app.schemas import BoundingBox, CriticalZone

if TYPE_CHECKING:
    from app.ml.infer import DamagePoint


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

CRITICAL_CLASSES: frozenset[str] = frozenset({"destroyed", "major_damage"})

# DBSCAN neighbourhood radius in degrees.
# At the equator: 0.005° ≈ 556 m. Appropriate for building-level clustering.
DBSCAN_EPS_DEGREES: float = 0.005

# DBSCAN minimum samples to form a core point.
# 2 means even pairs of buildings form a cluster (conservative for disasters).
DBSCAN_MIN_SAMPLES: int = 2


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────


def _severity_rank(damage_classification: str) -> int:
    """Return a numeric rank for sorting: higher = more severe."""
    return {"destroyed": 2, "major_damage": 1}.get(damage_classification, 0)


def _dominant_class(classes: list[str]) -> str:
    """
    Return the most severe damage class in a collection.

    'destroyed' always wins over 'major_damage' — even a single destroyed
    building in a cluster makes the whole zone a destroyed zone for dispatch.
    """
    if "destroyed" in classes:
        return "destroyed"
    return "major_damage"


def _clamp_to_bbox(lat: float, lng: float, bbox: BoundingBox) -> tuple[float, float]:
    """Clamp a coordinate to the bounding box extent."""
    return (
        max(bbox.min_lat, min(bbox.max_lat, lat)),
        max(bbox.min_lng, min(bbox.max_lng, lng)),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────


def cluster_damage_points(
    damage_points: list["DamagePoint"],
    bbox: BoundingBox,
    max_zones: int = 25,
) -> list[CriticalZone]:
    """
    Collapse raw damage points into a bounded set of critical zone centroids.

    Only 'destroyed' and 'major_damage' points are included in the output.
    'minor_damage' and 'no_damage' are deliberately excluded — they are not
    critical enough to drive emergency dispatch or clutter the map.

    Args:
        damage_points: Raw list of DamagePoint objects from inference pipeline.
        bbox:          Geographic bounding box of the assessed area.
        max_zones:     Maximum number of CriticalZone objects to return (≤ 25
                       per the Stream 3/4 output contract).

    Returns:
        List of CriticalZone objects, each representing a clustered region
        of critical damage. Always ≤ max_zones entries.
    """
    # ── Step 1: Filter to critical classes only ───────────────────────────────
    critical = [p for p in damage_points if p.damage_class in CRITICAL_CLASSES]

    logger.info(
        "Zone clustering: {} total damage points, {} critical (destroyed/major_damage)",
        len(damage_points),
        len(critical),
    )

    if not critical:
        logger.warning(
            "No critical damage zones detected — assessment area may be low-severity."
        )
        return []

    # ── Step 2: Trivial case — single point ──────────────────────────────────
    if len(critical) == 1:
        p = critical[0]
        lat, lng = _clamp_to_bbox(p.lat, p.lng, bbox)
        logger.info("Single critical point — returning as one zone.")
        return [
            CriticalZone(
                lat=lat,
                lng=lng,
                damage_classification=p.damage_class,  # type: ignore[arg-type]
            )
        ]

    # ── Step 3: DBSCAN clustering ─────────────────────────────────────────────
    coords = np.array([[p.lat, p.lng] for p in critical])

    # Haversine-aware epsilon: adjust for latitude compression of longitude.
    # At higher latitudes, longitude degrees are shorter — we compensate so
    # the effective clustering radius stays ≈ 500m regardless of latitude.
    center_lat = (bbox.min_lat + bbox.max_lat) / 2
    lat_correction = math.cos(math.radians(center_lat))
    eps = DBSCAN_EPS_DEGREES / max(lat_correction, 0.01)  # avoid div/0 at poles

    labels = DBSCAN(eps=eps, min_samples=DBSCAN_MIN_SAMPLES).fit_predict(coords)

    unique_labels = set(labels)
    n_clusters = sum(1 for lb in unique_labels if lb >= 0)
    n_noise = (labels == -1).sum()

    logger.info(
        "DBSCAN result: {} clusters, {} noise points (eps={:.5f}°)",
        n_clusters,
        n_noise,
        eps,
    )

    # ── Step 4: Build zone list from clusters ─────────────────────────────────
    zones: list[tuple[CriticalZone, int, str]] = []  # (zone, size, class)

    for cluster_id in sorted(unique_labels):
        mask = labels == cluster_id
        cluster_points = [p for p, m in zip(critical, mask) if m]
        cluster_size = len(cluster_points)

        centroid_lat = float(np.mean([p.lat for p in cluster_points]))
        centroid_lng = float(np.mean([p.lng for p in cluster_points]))
        centroid_lat, centroid_lng = _clamp_to_bbox(centroid_lat, centroid_lng, bbox)

        dominant = _dominant_class([p.damage_class for p in cluster_points])

        zone = CriticalZone(
            lat=centroid_lat,
            lng=centroid_lng,
            damage_classification=dominant,  # type: ignore[arg-type]
        )
        zones.append((zone, cluster_size, dominant))

    # ── Step 5: Cap to max_zones — prioritise by severity then cluster size ────
    if len(zones) > max_zones:
        zones.sort(
            key=lambda t: (_severity_rank(t[2]), t[1]),
            reverse=True,
        )
        zones = zones[:max_zones]
        logger.info(
            "Capped zones from {} to {} (max_zones={})",
            len(zones) + (len(zones) - max_zones),  # total before cap
            max_zones,
            max_zones,
        )

    result = [z for z, _, _ in zones]

    # ── Step 6: Sanity assertions ─────────────────────────────────────────────
    for zone in result:
        assert bbox.min_lat <= zone.lat <= bbox.max_lat, (
            f"Zone lat {zone.lat} outside bbox [{bbox.min_lat}, {bbox.max_lat}]"
        )
        assert bbox.min_lng <= zone.lng <= bbox.max_lng, (
            f"Zone lng {zone.lng} outside bbox [{bbox.min_lng}, {bbox.max_lng}]"
        )
        assert zone.damage_classification in ("destroyed", "major_damage"), (
            f"Invalid classification in output: {zone.damage_classification}"
        )

    logger.info(
        "Zone clustering complete: {} zones produced (destroyed={}, major_damage={})",
        len(result),
        sum(1 for z in result if z.damage_classification == "destroyed"),
        sum(1 for z in result if z.damage_classification == "major_damage"),
    )

    return result
