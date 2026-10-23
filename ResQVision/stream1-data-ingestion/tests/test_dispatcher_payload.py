"""The payload Stream 1 sends must match the Stream 2 contract exactly."""
import uuid
from datetime import datetime, timezone
import pytest
from dispatcher import build_stream2_payload
from schemas import DisasterEvent, make_event_id


def ev(event_type="earthquake", severity=6.5, ts=None):
    return DisasterEvent(
        event_id=make_event_id("USGS", "abc"), source="USGS", source_event_id="abc",
        event_type=event_type, severity=severity, latitude=19.07, longitude=72.87,
        location_name="x", timestamp_utc=ts or datetime(2026, 10, 23, 10, 0, tzinfo=timezone.utc),
        metadata={"extra": 1}, corroborated_by_news=True)


def test_exact_keys_only():
    p = build_stream2_payload(ev())
    assert set(p) == {"event_id", "disaster_type", "coordinates", "severity_metric", "timestamp_utc"}
    assert set(p["coordinates"]) == {"lat", "lng"}


def test_event_id_is_valid_and_deterministic_uuid():
    a, b = build_stream2_payload(ev()), build_stream2_payload(ev())
    uuid.UUID(a["event_id"])
    assert a["event_id"] == b["event_id"]


def test_rainfall_maps_to_flood_and_quake_stays():
    assert build_stream2_payload(ev("rainfall", 55))["disaster_type"] == "flood"
    assert build_stream2_payload(ev("earthquake"))["disaster_type"] == "earthquake"


def test_severity_is_float():
    assert isinstance(build_stream2_payload(ev(severity=6))["severity_metric"], float)


def test_naive_datetime_treated_as_utc():
    p = build_stream2_payload(ev(ts=datetime(2026, 10, 23, 10, 0)))
    assert p["timestamp_utc"].endswith("+00:00")


def test_unsupported_type_raises():
    with pytest.raises(ValueError):
        build_stream2_payload(ev("tornado"))
