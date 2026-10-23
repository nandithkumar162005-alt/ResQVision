"""
tests/test_mock_infer.py — Unit tests for MockInferenceEngine.

Validates synthetic damage generation under mock mode:
- Output adheres to InferenceResult schema (damage_score, model_mode, damage_points, pixel_counts).
- Damage score scales monotonically with severity metrics (Richter magnitude, rainfall mm/hr).
- Gaussian spatial gradient concentrates critical damage (destroyed, major_damage) near epicenter.
- Deterministic reproducibility using event_id seed.
- Bounding box geographic constraint compliance.
- Fallback handling for unknown disaster types.

Note:
    Root `conftest.py` adds the project root to `sys.path`.
"""

from __future__ import annotations

import datetime
import math
import uuid

import pytest

from app.ml.infer import DamagePoint, InferenceResult
from app.ml.mock_infer import MockInferenceEngine
from app.satellite.cdse_client import build_bounding_box
from app.schemas import (
    BoundingBox,
    CriticalZone,
    DamageAssessment,
    DisasterEvent,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures and Helpers
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def engine() -> MockInferenceEngine:
    """Fixture providing an instance of MockInferenceEngine."""
    return MockInferenceEngine()


def make_earthquake_event(
    magnitude: float,
    event_id: str | None = None,
) -> DisasterEvent:
    """Helper to create a valid earthquake DisasterEvent."""
    return DisasterEvent(
        event_id=event_id or str(uuid.uuid4()),
        disaster_type="earthquake",
        coordinates={"lat": 19.076, "lng": 72.8777},
        severity_metric=magnitude,
        timestamp_utc="2026-10-10T14:23:01Z",
    )


def make_flood_event(
    mmhr: float,
    event_id: str | None = None,
) -> DisasterEvent:
    """Helper to create a valid flood DisasterEvent."""
    return DisasterEvent(
        event_id=event_id or str(uuid.uuid4()),
        disaster_type="flood",
        coordinates={"lat": 19.076, "lng": 72.8777},
        severity_metric=mmhr,
        timestamp_utc="2026-10-10T14:23:01Z",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Mock Inference Tests
# ─────────────────────────────────────────────────────────────────────────────


def test_earthquake_mild_output_valid(engine: MockInferenceEngine) -> None:
    """
    Test mild earthquake (magnitude 6.0) inference result structure and
    compatibility with DamageAssessment model.
    """
    event = make_earthquake_event(magnitude=6.0)
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    assert isinstance(result, InferenceResult), (
        f"Expected InferenceResult instance, got {type(result)}"
    )
    assert 0 <= result.damage_score <= 100, (
        f"Expected damage_score between 0 and 100, got {result.damage_score}"
    )
    assert result.model_mode == "mock", (
        f"Expected model_mode 'mock', got '{result.model_mode}'"
    )
    assert len(result.damage_points) >= 1, (
        f"Expected >= 1 damage point, got {len(result.damage_points)}"
    )

    # Build DamageAssessment from result (dummy zone clustering) — assert it validates without error
    critical_points = [
        p for p in result.damage_points
        if p.damage_class in ("destroyed", "major_damage")
    ]
    dummy_zones = [
        CriticalZone(
            lat=p.lat,
            lng=p.lng,
            damage_classification=p.damage_class,  # type: ignore[arg-type]
        )
        for p in critical_points[:25]
    ]
    assessment = DamageAssessment(
        event_id=event.event_id,
        damage_score_out_of_100=result.damage_score,
        affected_population_estimate=1500,
        critical_zones=dummy_zones,
    )
    assert assessment.damage_score_out_of_100 == result.damage_score, (
        f"Expected score {result.damage_score}, got {assessment.damage_score_out_of_100}"
    )


def test_earthquake_severe_output_valid(engine: MockInferenceEngine) -> None:
    """
    Test severe earthquake (magnitude 8.5) producing higher damage score
    and point count than mild earthquake (magnitude 6.0).
    """
    mild_event = make_earthquake_event(
        magnitude=6.0,
        event_id="11111111-1111-4111-8111-111111111111",
    )
    severe_event = make_earthquake_event(
        magnitude=8.5,
        event_id="22222222-2222-4222-8222-222222222222",
    )
    bbox = build_bounding_box(mild_event.coordinates.lat, mild_event.coordinates.lng)

    mild_result = engine.generate_assessment(mild_event, bbox)
    severe_result = engine.generate_assessment(severe_event, bbox)

    assert isinstance(severe_result, InferenceResult)
    assert 0 <= severe_result.damage_score <= 100
    assert severe_result.model_mode == "mock"
    assert len(severe_result.damage_points) >= 1

    assert severe_result.damage_score > mild_result.damage_score, (
        f"Expected severe damage_score ({severe_result.damage_score}) > mild ({mild_result.damage_score})"
    )
    assert len(severe_result.damage_points) > len(mild_result.damage_points), (
        f"Expected more damage points for severe ({len(severe_result.damage_points)}) "
        f"than mild ({len(mild_result.damage_points)})"
    )

    # Validate that severe result can also form a valid DamageAssessment
    critical_points = [
        p for p in severe_result.damage_points
        if p.damage_class in ("destroyed", "major_damage")
    ]
    dummy_zones = [
        CriticalZone(
            lat=p.lat,
            lng=p.lng,
            damage_classification=p.damage_class,  # type: ignore[arg-type]
        )
        for p in critical_points[:25]
    ]
    assessment = DamageAssessment(
        event_id=severe_event.event_id,
        damage_score_out_of_100=severe_result.damage_score,
        affected_population_estimate=15000,
        critical_zones=dummy_zones,
    )
    assert assessment.event_id == severe_event.event_id


def test_flood_mild_output_valid(engine: MockInferenceEngine) -> None:
    """Test mild flood (51 mm/hr) generates valid InferenceResult in mock mode."""
    event = make_flood_event(mmhr=51.0)
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    assert isinstance(result, InferenceResult), (
        f"Expected InferenceResult, got {type(result)}"
    )
    assert 0 <= result.damage_score <= 100, (
        f"Expected damage_score between 0 and 100, got {result.damage_score}"
    )
    assert result.model_mode == "mock", (
        f"Expected model_mode 'mock', got '{result.model_mode}'"
    )


def test_flood_severe_output_valid(engine: MockInferenceEngine) -> None:
    """Test severe flood (150 mm/hr) produces higher damage score than mild flood (51 mm/hr)."""
    mild_event = make_flood_event(
        mmhr=51.0,
        event_id="33333333-3333-4333-8333-333333333333",
    )
    severe_event = make_flood_event(
        mmhr=150.0,
        event_id="44444444-4444-4444-8444-444444444444",
    )
    bbox = build_bounding_box(mild_event.coordinates.lat, mild_event.coordinates.lng)

    mild_result = engine.generate_assessment(mild_event, bbox)
    severe_result = engine.generate_assessment(severe_event, bbox)

    assert isinstance(severe_result, InferenceResult)
    assert 0 <= severe_result.damage_score <= 100
    assert severe_result.damage_score > mild_result.damage_score, (
        f"Expected severe flood score ({severe_result.damage_score}) > mild ({mild_result.damage_score})"
    )


def test_damage_points_within_bbox(engine: MockInferenceEngine) -> None:
    """Test that all generated damage points fall strictly within the given bounding box."""
    event = make_earthquake_event(magnitude=7.0)
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    assert len(result.damage_points) > 0, "Expected non-empty damage points"
    for pt in result.damage_points:
        assert bbox.min_lat <= pt.lat <= bbox.max_lat, (
            f"Point lat {pt.lat} outside bbox [{bbox.min_lat}, {bbox.max_lat}]"
        )
        assert bbox.min_lng <= pt.lng <= bbox.max_lng, (
            f"Point lng {pt.lng} outside bbox [{bbox.min_lng}, {bbox.max_lng}]"
        )


def test_critical_classes_dominate_center(engine: MockInferenceEngine) -> None:
    """
    Test Gaussian spatial gradient: points within 20% of bbox radius
    from event epicenter should be dominated by 'destroyed' + 'major_damage' (> 50%).
    """
    event = make_earthquake_event(magnitude=8.0)
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    center_lat = event.coordinates.lat
    center_lng = event.coordinates.lng

    bbox_radius = math.hypot(
        (bbox.max_lat - bbox.min_lat) / 2,
        (bbox.max_lng - bbox.min_lng) / 2,
    )
    center_threshold = 0.20 * bbox_radius

    center_points = [
        p for p in result.damage_points
        if math.hypot(p.lat - center_lat, p.lng - center_lng) <= center_threshold
    ]

    assert len(center_points) > 0, (
        f"Expected damage points within {center_threshold:.4f} degrees of center"
    )
    critical_center = [
        p for p in center_points
        if p.damage_class in ("destroyed", "major_damage")
    ]
    fraction = len(critical_center) / len(center_points)
    assert fraction > 0.5, (
        f"Expected critical classes fraction > 0.5 at center, got {fraction:.2f} "
        f"({len(critical_center)}/{len(center_points)})"
    )


def test_damage_score_is_int_0_to_100(engine: MockInferenceEngine) -> None:
    """Test that damage_score is an integer between 0 and 100 across a range of magnitudes."""
    magnitudes = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
    for mag in magnitudes:
        event = make_earthquake_event(magnitude=mag)
        bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)
        result = engine.generate_assessment(event, bbox)

        assert isinstance(result.damage_score, int), (
            f"Expected int damage_score for magnitude {mag}, got {type(result.damage_score)}"
        )
        assert 0 <= result.damage_score <= 100, (
            f"Expected damage_score between 0 and 100 for magnitude {mag}, got {result.damage_score}"
        )


def test_pixel_counts_sum_matches_total(engine: MockInferenceEngine) -> None:
    """Test that the sum of class pixel counts exactly equals total damage_points count."""
    event = make_earthquake_event(magnitude=7.0)
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    total_pixels = sum(result.pixel_counts.values())
    assert total_pixels == len(result.damage_points), (
        f"Expected pixel_counts sum {total_pixels} to match len(damage_points) {len(result.damage_points)}"
    )


def test_reproducibility_same_event_id(engine: MockInferenceEngine) -> None:
    """Test that identical event_ids produce identical scores and damage points (seeded RNG)."""
    fixed_id = "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab"
    event1 = make_earthquake_event(magnitude=7.2, event_id=fixed_id)
    event2 = make_earthquake_event(magnitude=7.2, event_id=fixed_id)
    bbox = build_bounding_box(event1.coordinates.lat, event1.coordinates.lng)

    result1 = engine.generate_assessment(event1, bbox)
    result2 = engine.generate_assessment(event2, bbox)

    assert result1.damage_score == result2.damage_score, (
        f"Expected reproducible damage_score {result1.damage_score}, got {result2.damage_score}"
    )
    assert len(result1.damage_points) == len(result2.damage_points), (
        f"Expected identical point count {len(result1.damage_points)}, got {len(result2.damage_points)}"
    )
    assert result1.pixel_counts == result2.pixel_counts, (
        f"Expected identical pixel_counts, got {result1.pixel_counts} vs {result2.pixel_counts}"
    )


def test_unknown_disaster_type_fallback(engine: MockInferenceEngine) -> None:
    """Test that unrecognized disaster types fallback cleanly without raising exceptions."""
    event = DisasterEvent(
        event_id=str(uuid.uuid4()),
        disaster_type="tsunami",
        coordinates={"lat": 19.076, "lng": 72.8777},
        severity_metric=50.0,
        timestamp_utc="2026-10-10T14:23:01Z",
    )
    bbox = build_bounding_box(event.coordinates.lat, event.coordinates.lng)

    result = engine.generate_assessment(event, bbox)

    assert isinstance(result, InferenceResult), (
        f"Expected valid InferenceResult fallback for 'tsunami', got {type(result)}"
    )
    assert 0 <= result.damage_score <= 100, (
        f"Expected damage_score between 0 and 100, got {result.damage_score}"
    )
    assert result.model_mode == "mock", (
        f"Expected model_mode 'mock', got '{result.model_mode}'"
    )
    assert len(result.damage_points) >= 1, (
        f"Expected >= 1 damage point, got {len(result.damage_points)}"
    )
