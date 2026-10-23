"""
tests/test_zone_clustering.py — Unit tests for DBSCAN-based critical zone clustering.

Validates that raw DamagePoint outputs from the inference pipeline are correctly
collapsed into <= 25 critical zone centroids for Stream 3 and Stream 4 dispatch.
Tests filtering of non-critical classes (minor_damage, no_damage), priority sorting
(destroyed > major_damage), preservation of isolated outliers, and max_zones bounds.

Note:
    Root `conftest.py` adds the project root to `sys.path`.
"""

from __future__ import annotations

import math
import random

import pytest

from app.geo.zone_clustering import cluster_damage_points
from app.ml.infer import DamagePoint
from app.schemas import BoundingBox, CriticalZone


# ─────────────────────────────────────────────────────────────────────────────
# Test Helpers
# ─────────────────────────────────────────────────────────────────────────────


def make_bbox() -> BoundingBox:
    """Return a standard test bounding box around Mumbai region."""
    return BoundingBox(min_lat=18.9, max_lat=19.2, min_lng=72.7, max_lng=73.0)


def make_damage_point(lat: float, lng: float, cls: str = "destroyed") -> DamagePoint:
    """Instantiate a DamagePoint with default confidence."""
    return DamagePoint(lat=lat, lng=lng, damage_class=cls, confidence=0.9)


def random_critical_points(n: int, bbox: BoundingBox, seed: int = 42) -> list[DamagePoint]:
    """Generate n pseudo-random points within bbox classified as destroyed or major_damage."""
    rng = random.Random(seed)
    points = []
    classes = ["destroyed", "major_damage"]
    for _ in range(n):
        lat = rng.uniform(bbox.min_lat, bbox.max_lat)
        lng = rng.uniform(bbox.min_lng, bbox.max_lng)
        cls = rng.choice(classes)
        points.append(make_damage_point(lat, lng, cls))
    return points


# ─────────────────────────────────────────────────────────────────────────────
# Clustering Tests
# ─────────────────────────────────────────────────────────────────────────────


def test_200_points_collapse_to_max_25() -> None:
    """
    Test that 200 random critical points within the bounding box collapse
    to <= 25 representative zones (and at least 1).
    """
    bbox = make_bbox()
    points = random_critical_points(200, bbox, seed=123)

    result = cluster_damage_points(points, bbox, max_zones=25)

    assert len(result) <= 25, (
        f"Expected at most 25 zones, but received {len(result)}"
    )
    assert len(result) >= 1, (
        f"Expected at least 1 zone from 200 critical points, but received {len(result)}"
    )


def test_empty_input_returns_empty() -> None:
    """Test that an empty list of damage points returns an empty list of zones."""
    bbox = make_bbox()
    result = cluster_damage_points([], bbox, max_zones=25)
    assert result == [], f"Expected empty list for empty input, got {result}"


def test_single_point_returns_single_zone() -> None:
    """Test that a single critical point returns a single zone with identical coordinates."""
    bbox = make_bbox()
    pt = make_damage_point(19.05, 72.85, "destroyed")

    result = cluster_damage_points([pt], bbox, max_zones=25)

    assert len(result) == 1, f"Expected exactly 1 zone, got {len(result)}"
    zone = result[0]
    assert math.isclose(zone.lat, 19.05, abs_tol=1e-5), (
        f"Expected lat 19.05, got {zone.lat}"
    )
    assert math.isclose(zone.lng, 72.85, abs_tol=1e-5), (
        f"Expected lng 72.85, got {zone.lng}"
    )
    assert zone.damage_classification == "destroyed", (
        f"Expected classification 'destroyed', got {zone.damage_classification}"
    )


def test_only_minor_damage_returns_empty() -> None:
    """
    Test that points with damage_class='minor_damage' are filtered out,
    returning an empty list.
    """
    bbox = make_bbox()
    points = [
        make_damage_point(19.01, 72.81, "minor_damage"),
        make_damage_point(19.02, 72.82, "minor_damage"),
        make_damage_point(19.03, 72.83, "minor_damage"),
    ]
    result = cluster_damage_points(points, bbox, max_zones=25)
    assert result == [], (
        f"Expected empty list since minor_damage is not critical, got {result}"
    )


def test_only_no_damage_returns_empty() -> None:
    """
    Test that points with damage_class='no_damage' are filtered out,
    returning an empty list.
    """
    bbox = make_bbox()
    points = [
        make_damage_point(19.01, 72.81, "no_damage"),
        make_damage_point(19.02, 72.82, "no_damage"),
    ]
    result = cluster_damage_points(points, bbox, max_zones=25)
    assert result == [], (
        f"Expected empty list since no_damage is not critical, got {result}"
    )


def test_mixed_classes_only_critical_in_output() -> None:
    """
    Test that across mixed classes ('no_damage', 'minor_damage', 'major_damage', 'destroyed'),
    only 'destroyed' and 'major_damage' appear in output critical zones.
    """
    bbox = make_bbox()
    points = [
        make_damage_point(19.01, 72.81, "no_damage"),
        make_damage_point(19.02, 72.82, "minor_damage"),
        make_damage_point(19.05, 72.85, "major_damage"),
        make_damage_point(19.10, 72.90, "destroyed"),
    ]
    result = cluster_damage_points(points, bbox, max_zones=25)

    assert len(result) >= 1, f"Expected at least 1 critical zone, got {len(result)}"
    for zone in result:
        assert zone.damage_classification in ("destroyed", "major_damage"), (
            f"Found non-critical damage classification in output: {zone.damage_classification}"
        )


def test_output_zones_within_bbox() -> None:
    """Test that all output zones from 50 random critical points fall within bbox bounds."""
    bbox = make_bbox()
    points = random_critical_points(50, bbox, seed=999)

    result = cluster_damage_points(points, bbox, max_zones=25)

    for zone in result:
        assert bbox.contains(zone.lat, zone.lng), (
            f"Zone ({zone.lat}, {zone.lng}) is outside bounding box {bbox}"
        )


def test_output_damage_classifications_valid() -> None:
    """Test that every output zone's damage_classification is strictly 'destroyed' or 'major_damage'."""
    bbox = make_bbox()
    points = random_critical_points(100, bbox, seed=777)

    result = cluster_damage_points(points, bbox, max_zones=25)

    for zone in result:
        assert zone.damage_classification in ("destroyed", "major_damage"), (
            f"Expected classification 'destroyed' or 'major_damage', got {zone.damage_classification}"
        )


def test_destroyed_takes_priority_in_cluster() -> None:
    """
    Test that within a tight spatial cluster containing both 'major_damage'
    and 'destroyed' points, 'destroyed' takes priority as the cluster's classification.
    """
    bbox = make_bbox()
    # 5 major_damage points + 1 destroyed point within DBSCAN_EPS_DEGREES
    cluster = [
        make_damage_point(19.0500, 72.8500, "major_damage"),
        make_damage_point(19.0501, 72.8501, "major_damage"),
        make_damage_point(19.0502, 72.8502, "major_damage"),
        make_damage_point(19.0501, 72.8499, "major_damage"),
        make_damage_point(19.0499, 72.8501, "major_damage"),
        make_damage_point(19.0500, 72.8502, "destroyed"),
    ]

    result = cluster_damage_points(cluster, bbox, max_zones=25)

    assert len(result) == 1, (
        f"Expected exactly 1 combined cluster zone, got {len(result)}"
    )
    assert result[0].damage_classification == "destroyed", (
        f"Expected cluster classification 'destroyed' to dominate, got '{result[0].damage_classification}'"
    )


def test_max_zones_parameter_respected() -> None:
    """Test that the max_zones parameter strictly caps the returned zone count."""
    bbox = make_bbox()
    points = random_critical_points(200, bbox, seed=333)

    result_10 = cluster_damage_points(points, bbox, max_zones=10)
    assert len(result_10) <= 10, (
        f"Expected <= 10 zones, got {len(result_10)}"
    )
    assert len(result_10) >= 1, (
        f"Expected >= 1 zone, got {len(result_10)}"
    )

    result_5 = cluster_damage_points(points, bbox, max_zones=5)
    assert len(result_5) <= 5, (
        f"Expected <= 5 zones, got {len(result_5)}"
    )
    assert len(result_5) >= 1, (
        f"Expected >= 1 zone, got {len(result_5)}"
    )


def test_far_outlier_still_included_if_critical() -> None:
    """
    Test that an isolated critical point far from other clusters (labeled as noise -1
    by DBSCAN) is preserved as an individual zone in the final output.
    """
    bbox = make_bbox()
    # 20 points tightly clustered around (19.00, 72.80)
    points = [
        make_damage_point(19.00 + (i * 0.0001), 72.80 + (i * 0.0001), "major_damage")
        for i in range(20)
    ]
    # Far outlier at (19.15, 72.85) — > 15 km away, classified 'destroyed'
    outlier = make_damage_point(19.15, 72.85, "destroyed")
    points.append(outlier)

    zones = cluster_damage_points(points, bbox, max_zones=25)

    assert len(zones) >= 2, (
        f"Expected at least 2 zones (main cluster + outlier), got {len(zones)}"
    )
    outlier_found = any(
        math.isclose(z.lat, 19.15, abs_tol=0.01) and math.isclose(z.lng, 72.85, abs_tol=0.01)
        for z in zones
    )
    assert outlier_found, (
        f"Expected outlier near (19.15, 72.85) to be preserved in critical zones: {zones}"
    )
