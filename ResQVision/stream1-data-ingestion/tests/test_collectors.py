"""
ResQVision Stream 1 — Collector and Dispatcher Unit Tests
Mocks network requests using httpx mock transports to test error handling,
edge case parsing (e.g. NoneType in arrays), and retry logic.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
import pytest
import httpx

from collectors import MeteoCollector, USGSCollector, NewsCollector
from dispatcher import Dispatcher
from schemas import DisasterEvent, make_event_id
from config import settings


@pytest.mark.anyio
async def test_meteo_handles_none_precipitation():
    """Verify MeteoCollector does not crash when Open-Meteo returns None for precipitation."""
    fake_response = {
        "hourly": {
            "time": ["2026-10-16T00:00", "2026-10-16T01:00", "2026-10-16T02:00"],
            "temperature_2m": [25.0, None, 24.5],
            "precipitation": [None, 12.5, 0.0],
            "rain": [None, 10.0, None],
            "windspeed_10m": [5.0, 6.0, None],
            "weathercode": [0, 61, None],
        }
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=fake_response)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        collector = MeteoCollector(client=client)
        readings = await collector.fetch()
        await collector.close()

    assert len(readings) == 1
    assert readings[0].precipitation_mm == 12.5
    assert readings[0].rain_mm == 10.0
    assert readings[0].temperature_2m is None


@pytest.mark.anyio
async def test_usgs_handles_short_coords_and_none_fields():
    """Verify USGSCollector handles features with 2D coordinates and missing fields."""
    fake_response = {
        "features": [
            {
                "id": "eq_test_1",
                "properties": {
                    "mag": 5.2,
                    "place": "10 km N of City",
                    "time": 1776300000000,
                    "url": None,
                    "felt": None,
                    "tsunami": None,
                },
                "geometry": {
                    "coordinates": [78.5, 17.4],  # Only 2 elements
                },
            },
            {
                "id": "eq_low_mag",
                "properties": {
                    "mag": 2.1,  # Below threshold
                    "place": "Small Tremor",
                    "time": 1776300000000,
                },
                "geometry": {
                    "coordinates": [78.5, 17.4, 5.0],
                },
            },
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=fake_response)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        collector = USGSCollector(client=client)
        quakes = await collector.fetch()
        await collector.close()

    assert len(quakes) == 1
    assert quakes[0].id == "eq_test_1"
    assert quakes[0].magnitude == 5.2
    assert quakes[0].depth_km == 0.0
    assert quakes[0].url == ""
    assert quakes[0].tsunami == 0


@pytest.mark.anyio
async def test_news_collector_no_key():
    """NewsCollector returns empty list when API key is missing."""
    collector = NewsCollector()
    original_key = settings.NEWS_API_KEY
    try:
        settings.NEWS_API_KEY = ""
        articles = await collector.fetch()
        assert articles == []
    finally:
        settings.NEWS_API_KEY = original_key


@pytest.mark.anyio
async def test_news_collector_handles_none_values():
    """NewsCollector parses articles safely even with None fields."""
    fake_response = {
        "articles": [
            {
                "source": {"id": None, "name": None},
                "title": None,
                "description": None,
                "url": None,
                "publishedAt": None,
                "content": None,
            },
            {
                "source": {"id": "reuters", "name": "Reuters"},
                "title": "Flood warning issued",
                "description": "Heavy rains forecast",
                "url": "https://example.com/flood",
                "publishedAt": "2026-10-16T08:00:00Z",
                "content": "Full text",
            },
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=fake_response)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        collector = NewsCollector(client=client)
        original_key = settings.NEWS_API_KEY
        try:
            settings.NEWS_API_KEY = "test_key"
            articles = await collector.fetch()
            await collector.close()
        finally:
            settings.NEWS_API_KEY = original_key

    assert len(articles) == 2
    assert articles[0].source_name == "Unknown"
    assert articles[0].title == ""
    assert articles[1].source_name == "Reuters"
    assert articles[1].title == "Flood warning issued"


@pytest.mark.anyio
async def test_dispatcher_handles_failures():
    """Dispatcher catches and logs failures gracefully, reporting sent and failed counts."""
    ev = DisasterEvent(
        event_id=make_event_id("USGS", "disp_test"),
        source="USGS",
        source_event_id="disp_test",
        event_type="earthquake",
        severity=5.5,
        latitude=10.0,
        longitude=20.0,
        location_name="Fault Zone",
        timestamp_utc=datetime.now(timezone.utc),
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="Internal Server Error")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        dispatcher = Dispatcher(client=client, webhook_url="https://mock.example/webhook")
        results = await dispatcher.dispatch([ev])
        await dispatcher.close()

    assert results["sent"] == 0
    assert results["failed"] == 1
    assert len(results["errors"]) == 1


@pytest.mark.anyio
async def test_dispatcher_does_not_retry_400_bad_request():
    """Dispatcher immediately fails on 400 Bad Request without wasting retry cycles."""
    call_count = 0
    ev = DisasterEvent(
        event_id=make_event_id("USGS", "disp_400"),
        source="USGS",
        source_event_id="disp_400",
        event_type="earthquake",
        severity=5.5,
        latitude=10.0,
        longitude=20.0,
        location_name="Fault Zone",
        timestamp_utc=datetime.now(timezone.utc),
    )

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(400, text="Bad Request")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        dispatcher = Dispatcher(client=client, webhook_url="https://mock.example/webhook")
        results = await dispatcher.dispatch([ev])
        await dispatcher.close()

    assert results["failed"] == 1
    assert call_count == 1  # Exactly 1 call, no retries on client error!


def test_cache_evict_allows_reprocessing():
    """Evicting an event from dedup cache allows it to be seen as fresh again."""
    from cache import is_duplicate_event, evict_event, DEDUP_CACHE
    DEDUP_CACHE.clear()

    # First check: fresh
    assert is_duplicate_event("USGS", "evict_test_1") is False
    # Second check: duplicate
    assert is_duplicate_event("USGS", "evict_test_1") is True

    # Evict failed event
    assert evict_event("USGS", "evict_test_1") is True

    # Third check: fresh again!
    assert is_duplicate_event("USGS", "evict_test_1") is False

    # Evicting nonexistent returns False
    assert evict_event("USGS", "nonexistent") is False

