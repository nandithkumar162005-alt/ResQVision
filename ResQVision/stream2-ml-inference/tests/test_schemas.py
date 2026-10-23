"""
tests/test_schemas.py — Comprehensive tests for Stream 2 Pydantic schemas.

Validates all inbound contracts (DisasterEvent, Coordinates), outbound contracts
(DamageAssessment, CriticalZone), and internal data models (BoundingBox, TriggerResponse).
Ensures validation constraints, type coercions, boundary conditions, and serialisation
to Stream 3 formats behave strictly according to cross-stream contracts.

Note:
    Root `conftest.py` adds the project root to `sys.path` so that imports
    such as `from app.schemas import ...` work directly under pytest.
"""

from __future__ import annotations

import datetime
import uuid

import pytest
from pydantic import ValidationError

from app.schemas import (
    BoundingBox,
    Coordinates,
    CriticalZone,
    DamageAssessment,
    DisasterEvent,
    TriggerResponse,
)


# ─────────────────────────────────────────────────────────────────────────────
# Inbound Contract Tests: DisasterEvent & Coordinates
# ─────────────────────────────────────────────────────────────────────────────


def test_disaster_event_valid() -> None:
    """
    Test parsing the exact example DisasterEvent payload from the Stream 2 specification.

    Verifies UUID casting, disaster type normalisation, coordinate coordinates,
    and severity metric validation.
    """
    payload = {
        "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
        "disaster_type": "earthquake",
        "coordinates": {"lat": 19.076, "lng": 72.8777},
        "severity_metric": 6.2,
        "timestamp_utc": "2026-10-10T14:23:01Z",
    }
    event = DisasterEvent.model_validate(payload)

    assert isinstance(event.event_id, uuid.UUID), (
        f"Expected event_id to be UUID, got {type(event.event_id)}"
    )
    assert str(event.event_id) == "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab", (
        f"Expected UUID 'a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab', got {event.event_id}"
    )
    assert event.disaster_type == "earthquake", (
        f"Expected disaster_type 'earthquake', got '{event.disaster_type}'"
    )
    assert event.coordinates.lat == 19.076, (
        f"Expected lat 19.076, got {event.coordinates.lat}"
    )
    assert event.coordinates.lng == 72.8777, (
        f"Expected lng 72.8777, got {event.coordinates.lng}"
    )
    assert event.severity_metric == 6.2, (
        f"Expected severity_metric 6.2, got {event.severity_metric}"
    )
    assert isinstance(event.timestamp_utc, datetime.datetime), (
        f"Expected datetime timestamp_utc, got {type(event.timestamp_utc)}"
    )


def test_disaster_event_normalises_disaster_type() -> None:
    """Test that disaster_type strings are stripped and converted to lowercase."""
    event1 = DisasterEvent(
        event_id=uuid.uuid4(),
        disaster_type="EARTHQUAKE",
        coordinates=Coordinates(lat=19.076, lng=72.8777),
        severity_metric=6.0,
        timestamp_utc=datetime.datetime.now(datetime.timezone.utc),
    )
    assert event1.disaster_type == "earthquake", (
        f"Expected 'earthquake', got '{event1.disaster_type}'"
    )

    event2 = DisasterEvent(
        event_id=uuid.uuid4(),
        disaster_type="Flood ",
        coordinates=Coordinates(lat=19.076, lng=72.8777),
        severity_metric=55.0,
        timestamp_utc=datetime.datetime.now(datetime.timezone.utc),
    )
    assert event2.disaster_type == "flood", (
        f"Expected 'flood', got '{event2.disaster_type}'"
    )


def test_disaster_event_missing_event_id_raises() -> None:
    """Test that omitting event_id raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "disaster_type": "earthquake",
            "coordinates": {"lat": 19.076, "lng": 72.8777},
            "severity_metric": 6.2,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        })


def test_disaster_event_missing_coordinates_raises() -> None:
    """Test that omitting coordinates raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "event_id": str(uuid.uuid4()),
            "disaster_type": "earthquake",
            "severity_metric": 6.2,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        })


def test_disaster_event_invalid_lat_raises() -> None:
    """Test that latitude out of [-90, 90] bounds raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "event_id": str(uuid.uuid4()),
            "disaster_type": "earthquake",
            "coordinates": {"lat": 91.0, "lng": 72.8777},
            "severity_metric": 6.2,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        })


def test_disaster_event_invalid_lng_raises() -> None:
    """Test that longitude out of [-180, 180] bounds raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "event_id": str(uuid.uuid4()),
            "disaster_type": "earthquake",
            "coordinates": {"lat": 19.076, "lng": 200.0},
            "severity_metric": 6.2,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        })


def test_disaster_event_zero_severity_raises() -> None:
    """Test that non-positive severity_metric (severity_metric <= 0) raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "event_id": str(uuid.uuid4()),
            "disaster_type": "earthquake",
            "coordinates": {"lat": 19.076, "lng": 72.8777},
            "severity_metric": 0.0,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        })


def test_disaster_event_invalid_timestamp_raises() -> None:
    """Test that an unparseable timestamp string raises ValidationError."""
    with pytest.raises(ValidationError):
        DisasterEvent.model_validate({
            "event_id": str(uuid.uuid4()),
            "disaster_type": "earthquake",
            "coordinates": {"lat": 19.076, "lng": 72.8777},
            "severity_metric": 6.2,
            "timestamp_utc": "not-a-date",
        })


# ─────────────────────────────────────────────────────────────────────────────
# Outbound Contract Tests: DamageAssessment & CriticalZone
# ─────────────────────────────────────────────────────────────────────────────


def test_damage_assessment_valid() -> None:
    """Test building a valid DamageAssessment model with 2 critical zones."""
    event_id = uuid.uuid4()
    zones = [
        CriticalZone(lat=19.0761, lng=72.8780, damage_classification="destroyed"),
        CriticalZone(lat=19.0790, lng=72.8750, damage_classification="major_damage"),
    ]
    assessment = DamageAssessment(
        event_id=event_id,
        damage_score_out_of_100=72,
        affected_population_estimate=8300,
        critical_zones=zones,
    )

    assert assessment.event_id == event_id, (
        f"Expected event_id {event_id}, got {assessment.event_id}"
    )
    assert assessment.damage_score_out_of_100 == 72, (
        f"Expected damage_score_out_of_100 72, got {assessment.damage_score_out_of_100}"
    )
    assert assessment.affected_population_estimate == 8300, (
        f"Expected affected_population_estimate 8300, got {assessment.affected_population_estimate}"
    )
    assert len(assessment.critical_zones) == 2, (
        f"Expected 2 critical zones, got {len(assessment.critical_zones)}"
    )
    assert assessment.critical_zones[0].damage_classification == "destroyed"
    assert assessment.critical_zones[1].damage_classification == "major_damage"


def test_damage_assessment_score_must_be_int() -> None:
    """
    Test behaviour when passing float to damage_score_out_of_100.

    In Pydantic v2, passing a float with fractional part (e.g. 72.5) to an int field
    is either rejected via ValidationError (in strict mode or float-fraction check)
    or coerced to int 72. Test verifies that it satisfies the schema intent (integer).
    """
    try:
        assessment = DamageAssessment(
            event_id=uuid.uuid4(),
            damage_score_out_of_100=72.5,  # type: ignore[arg-type]
            affected_population_estimate=500,
            critical_zones=[],
        )
        assert isinstance(assessment.damage_score_out_of_100, int), (
            f"Expected int, got {type(assessment.damage_score_out_of_100)}"
        )
        assert assessment.damage_score_out_of_100 == 72, (
            f"Expected coerced score 72, got {assessment.damage_score_out_of_100}"
        )
    except ValidationError:
        # Pydantic v2 rejecting float with fractional part is also valid and expected
        pass


def test_damage_assessment_score_out_of_range_raises() -> None:
    """Test damage_score_out_of_100 > 100 raises ValidationError."""
    with pytest.raises(ValidationError):
        DamageAssessment(
            event_id=uuid.uuid4(),
            damage_score_out_of_100=101,
            affected_population_estimate=500,
            critical_zones=[],
        )


def test_damage_assessment_negative_score_raises() -> None:
    """Test damage_score_out_of_100 < 0 raises ValidationError."""
    with pytest.raises(ValidationError):
        DamageAssessment(
            event_id=uuid.uuid4(),
            damage_score_out_of_100=-1,
            affected_population_estimate=500,
            critical_zones=[],
        )


def test_damage_assessment_too_many_zones_raises() -> None:
    """Test that providing > 25 CriticalZone instances raises ValidationError."""
    zones = [
        CriticalZone(lat=19.0 + i * 0.001, lng=72.0 + i * 0.001, damage_classification="destroyed")
        for i in range(26)
    ]
    with pytest.raises(ValidationError):
        DamageAssessment(
            event_id=uuid.uuid4(),
            damage_score_out_of_100=50,
            affected_population_estimate=1000,
            critical_zones=zones,
        )


def test_critical_zone_invalid_classification_raises() -> None:
    """Test that classifications outside ('destroyed', 'major_damage') raise ValidationError."""
    with pytest.raises(ValidationError):
        CriticalZone(
            lat=19.076,
            lng=72.878,
            damage_classification="minor_damage",  # type: ignore[arg-type]
        )


def test_critical_zone_destroyed_valid() -> None:
    """Test that 'destroyed' is a valid CriticalZone classification."""
    zone = CriticalZone(lat=19.076, lng=72.878, damage_classification="destroyed")
    assert zone.damage_classification == "destroyed", (
        f"Expected 'destroyed', got '{zone.damage_classification}'"
    )


def test_critical_zone_major_damage_valid() -> None:
    """Test that 'major_damage' is a valid CriticalZone classification."""
    zone = CriticalZone(lat=19.076, lng=72.878, damage_classification="major_damage")
    assert zone.damage_classification == "major_damage", (
        f"Expected 'major_damage', got '{zone.damage_classification}'"
    )


def test_damage_assessment_to_stream3_dict() -> None:
    """
    Test serialisation to the exact dict shape Stream 3 expects.

    Verifies:
    - 'event_id' is a string (not UUID instance)
    - 'damage_score_out_of_100' is int
    - 'critical_zones' is a list of plain dicts
    - Each zone dict has exactly 'lat', 'lng', 'damage_classification' keys
    """
    event_id = uuid.uuid4()
    assessment = DamageAssessment(
        event_id=event_id,
        damage_score_out_of_100=72,
        affected_population_estimate=8300,
        critical_zones=[
            CriticalZone(lat=19.0761, lng=72.8780, damage_classification="destroyed"),
            CriticalZone(lat=19.0790, lng=72.8750, damage_classification="major_damage"),
        ],
    )
    result = assessment.to_stream3_dict()

    assert isinstance(result["event_id"], str), (
        f"Expected str event_id, got {type(result['event_id'])}"
    )
    assert result["event_id"] == str(event_id), (
        f"Expected event_id '{event_id}', got '{result['event_id']}'"
    )
    assert isinstance(result["damage_score_out_of_100"], int), (
        f"Expected int damage_score, got {type(result['damage_score_out_of_100'])}"
    )
    assert result["damage_score_out_of_100"] == 72
    assert isinstance(result["affected_population_estimate"], int), (
        f"Expected int affected_population_estimate, got {type(result['affected_population_estimate'])}"
    )
    assert result["affected_population_estimate"] == 8300

    assert isinstance(result["critical_zones"], list), (
        f"Expected list for critical_zones, got {type(result['critical_zones'])}"
    )
    assert len(result["critical_zones"]) == 2

    expected_keys = {"lat", "lng", "damage_classification"}
    for idx, zone_dict in enumerate(result["critical_zones"]):
        assert isinstance(zone_dict, dict), (
            f"Zone {idx} expected dict, got {type(zone_dict)}"
        )
        assert set(zone_dict.keys()) == expected_keys, (
            f"Zone {idx} expected exact keys {expected_keys}, got {set(zone_dict.keys())}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Internal Model Tests: BoundingBox & TriggerResponse
# ─────────────────────────────────────────────────────────────────────────────


def test_bounding_box_valid() -> None:
    """Test valid BoundingBox instantiation and contains method."""
    bbox = BoundingBox(min_lat=18.0, max_lat=20.0, min_lng=72.0, max_lng=74.0)
    assert bbox.contains(19.0, 73.0) is True, "Expected point (19, 73) to be within bbox"
    assert bbox.contains(17.9, 73.0) is False, "Expected point (17.9, 73) outside bbox"
    assert bbox.contains(19.0, 74.5) is False, "Expected point (19, 74.5) outside bbox"


def test_bounding_box_invalid_ordering_raises() -> None:
    """Test that min_lat >= max_lat or min_lng >= max_lng raises ValidationError."""
    with pytest.raises(ValidationError):
        BoundingBox(min_lat=20.0, max_lat=18.0, min_lng=72.0, max_lng=74.0)

    with pytest.raises(ValidationError):
        BoundingBox(min_lat=18.0, max_lat=20.0, min_lng=74.0, max_lng=72.0)


def test_bounding_box_center() -> None:
    """Test center calculation of BoundingBox."""
    bbox = BoundingBox(min_lat=18.0, max_lat=20.0, min_lng=72.0, max_lng=74.0)
    center = bbox.center()
    assert center == (19.0, 73.0), f"Expected center (19.0, 73.0), got {center}"


def test_trigger_response_valid() -> None:
    """Test default instantiation and fields of TriggerResponse."""
    ev_id = uuid.uuid4()
    resp = TriggerResponse(event_id=ev_id)
    assert resp.status == "processing", f"Expected 'processing', got '{resp.status}'"
    assert resp.event_id == ev_id, f"Expected event_id {ev_id}, got {resp.event_id}"
    assert "Assessment pipeline started" in resp.message
