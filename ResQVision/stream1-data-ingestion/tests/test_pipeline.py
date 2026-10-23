"""
ResQVision Stream 1 — Pipeline Unit Tests
Tests deduplication, DisasterEvent production, deterministic IDs,
and news corroboration using synthetic fixtures (no network calls).
"""

from __future__ import annotations

import sys
import os
from datetime import datetime, timezone

import pytest

# Ensure the project root is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from schemas import (
    DisasterEvent,
    RawEarthquake,
    RawNewsArticle,
    RawWeatherReading,
    make_event_id,
)
from cache import is_duplicate_event, DEDUP_CACHE
from pipeline import AlertPipeline


# ── Fixtures ─────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_dedup_cache():
    """Ensure each test starts with a clean dedup cache."""
    DEDUP_CACHE.clear()
    yield
    DEDUP_CACHE.clear()


@pytest.fixture
def pipeline():
    return AlertPipeline()


@pytest.fixture
def sample_earthquake():
    return RawEarthquake(
        id="us7000test",
        magnitude=6.5,
        place="42 km NNW of TestCity",
        time=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
        longitude=78.49,
        latitude=17.39,
        depth_km=10.0,
        url="https://earthquake.usgs.gov/earthquakes/eventpage/us7000test",
        felt=150,
        tsunami=0,
    )


@pytest.fixture
def sample_weather_extreme():
    return RawWeatherReading(
        time=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        latitude=17.385,
        longitude=78.487,
        temperature_2m=28.0,
        precipitation_mm=85.0,
        rain_mm=80.0,
        windspeed_10m=45.0,
        weathercode=95,
    )


@pytest.fixture
def sample_weather_light():
    return RawWeatherReading(
        time=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        latitude=17.385,
        longitude=78.487,
        temperature_2m=25.0,
        precipitation_mm=5.0,
        rain_mm=3.0,
        windspeed_10m=10.0,
        weathercode=61,
    )


@pytest.fixture
def sample_article():
    return RawNewsArticle(
        source_name="TestWire",
        title="Major earthquake strikes TestCity region",
        description="A 6.5 magnitude earthquake was reported near TestCity.",
        url="https://testwire.example.com/article/12345",
        published_at=datetime(2026, 1, 15, 12, 30, tzinfo=timezone.utc),
    )


# ── Deterministic ID tests ──────────────────────────────────

class TestEventId:
    def test_deterministic_hash(self):
        id1 = make_event_id("USGS", "us7000test")
        id2 = make_event_id("USGS", "us7000test")
        assert id1 == id2

    def test_different_inputs_differ(self):
        id1 = make_event_id("USGS", "us7000test")
        id2 = make_event_id("USGS", "us8000other")
        assert id1 != id2

    def test_id_length(self):
        eid = make_event_id("Open-Meteo", "2026-01-15T14:00:00_17.385_78.487")
        assert len(eid) == 16


# ── Deduplication tests ─────────────────────────────────────

class TestDeduplication:
    def test_fresh_event_returns_false(self):
        assert is_duplicate_event("USGS", "new_event") is False

    def test_repeat_event_returns_true(self):
        is_duplicate_event("USGS", "seen_event")
        assert is_duplicate_event("USGS", "seen_event") is True

    def test_different_sources_not_duplicate(self):
        is_duplicate_event("USGS", "shared_id")
        assert is_duplicate_event("Open-Meteo", "shared_id") is False

    def test_clear_resets(self):
        is_duplicate_event("USGS", "temp")
        DEDUP_CACHE.clear()
        assert is_duplicate_event("USGS", "temp") is False


# ── Earthquake tests ────────────────────────────────────────

class TestEarthquakeProcessing:
    def test_produces_disaster_event(self, pipeline, sample_earthquake):
        events = pipeline.process_earthquakes([sample_earthquake])
        assert len(events) == 1
        ev = events[0]
        assert isinstance(ev, DisasterEvent)
        assert ev.event_type == "earthquake"
        assert ev.source == "USGS"
        assert ev.source_event_id == "us7000test"
        assert ev.severity == 6.5

    def test_coordinates_are_flat(self, pipeline, sample_earthquake):
        events = pipeline.process_earthquakes([sample_earthquake])
        ev = events[0]
        assert ev.latitude == pytest.approx(17.39)
        assert ev.longitude == pytest.approx(78.49)

    def test_location_name_from_place(self, pipeline, sample_earthquake):
        events = pipeline.process_earthquakes([sample_earthquake])
        assert events[0].location_name == "42 km NNW of TestCity"

    def test_deduplication_blocks_repeats(self, pipeline, sample_earthquake):
        first = pipeline.process_earthquakes([sample_earthquake])
        second = pipeline.process_earthquakes([sample_earthquake])
        assert len(first) == 1
        assert len(second) == 0

    def test_metadata_has_depth(self, pipeline, sample_earthquake):
        events = pipeline.process_earthquakes([sample_earthquake])
        assert events[0].metadata["depth_km"] == 10.0


# ── Weather / rainfall tests ────────────────────────────────

class TestWeatherProcessing:
    def test_extreme_precipitation_creates_event(self, pipeline, sample_weather_extreme):
        events = pipeline.process_weather([sample_weather_extreme])
        assert len(events) == 1
        ev = events[0]
        assert ev.event_type == "rainfall"
        assert ev.source == "Open-Meteo"
        assert ev.severity == 85.0

    def test_light_rain_below_threshold_no_event(self, pipeline, sample_weather_light):
        events = pipeline.process_weather([sample_weather_light])
        assert len(events) == 0

    def test_weather_deduplication(self, pipeline, sample_weather_extreme):
        first = pipeline.process_weather([sample_weather_extreme])
        second = pipeline.process_weather([sample_weather_extreme])
        assert len(first) == 1
        assert len(second) == 0


# ── News corroboration tests ────────────────────────────────

class TestNewsCorroboration:
    def test_corroboration_flag_set_when_headline_matches(
        self, pipeline, sample_earthquake, sample_article
    ):
        pipeline.update_news_buffer([sample_article])
        events = pipeline.process_earthquakes([sample_earthquake])
        assert events[0].corroborated_by_news is True

    def test_corroboration_flag_false_without_news(self, pipeline, sample_earthquake):
        events = pipeline.process_earthquakes([sample_earthquake])
        assert events[0].corroborated_by_news is False

    def test_rainfall_corroboration(self, pipeline, sample_weather_extreme):
        flood_article = RawNewsArticle(
            source_name="FloodWatch",
            title="Severe flooding reported across the region",
            description="Heavy rainfall causes flood warnings.",
            url="https://example.com/flood",
            published_at=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        )
        pipeline.update_news_buffer([flood_article])
        events = pipeline.process_weather([sample_weather_extreme])
        assert events[0].corroborated_by_news is True
