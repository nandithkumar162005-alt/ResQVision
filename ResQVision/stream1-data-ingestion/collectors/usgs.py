"""
ResQVision Stream 1 — USGS Earthquake Collector
Polls the USGS Earthquake Hazards GeoJSON feed for
significant earthquakes above the configured magnitude threshold.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from schemas import RawEarthquake
from config import settings

log = structlog.get_logger(__name__)

# USGS "all earthquakes, past hour" GeoJSON summary feed
USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"


class USGSCollector:
    """Fetch recent earthquakes from the USGS GeoJSON feed."""

    def __init__(self, client: httpx.AsyncClient | None = None):
        self._client = client

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30)
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client session."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TransportError)),
        reraise=True,
    )
    async def fetch(self) -> List[RawEarthquake]:
        """
        Fetch and parse the feed.  Returns only quakes ≥ EARTHQUAKE_MIN_MAGNITUDE.
        """
        client = await self._get_client()
        log.info("usgs_fetch_start", url=USGS_FEED_URL)

        resp = await client.get(USGS_FEED_URL)
        resp.raise_for_status()
        data = resp.json()

        features = data.get("features", [])
        earthquakes: List[RawEarthquake] = []

        for feature in features:
            props = feature.get("properties") or {}
            geom = feature.get("geometry") or {}
            coords = geom.get("coordinates") or []

            mag = props.get("mag")
            if mag is None:
                continue

            try:
                mag_float = float(mag)
            except (ValueError, TypeError):
                continue

            if mag_float < settings.EARTHQUAKE_MIN_MAGNITUDE:
                continue

            time_val = props.get("time")
            if time_val is not None:
                try:
                    eq_time = datetime.fromtimestamp(float(time_val) / 1000, tz=timezone.utc)
                except (ValueError, OSError, OverflowError, TypeError):
                    eq_time = datetime.now(timezone.utc)
            else:
                eq_time = datetime.now(timezone.utc)

            lon = float(coords[0]) if len(coords) > 0 and coords[0] is not None else 0.0
            lat = float(coords[1]) if len(coords) > 1 and coords[1] is not None else 0.0
            depth = float(coords[2]) if len(coords) > 2 and coords[2] is not None else 0.0

            felt_val = props.get("felt")
            try:
                felt_int = int(felt_val) if felt_val is not None else None
            except (ValueError, TypeError):
                felt_int = None

            tsunami_val = props.get("tsunami")
            try:
                tsunami_int = int(tsunami_val) if tsunami_val is not None else 0
            except (ValueError, TypeError):
                tsunami_int = 0

            eq = RawEarthquake(
                id=str(feature.get("id") or ""),
                magnitude=mag_float,
                place=props.get("place") or "Unknown",
                time=eq_time,
                longitude=lon,
                latitude=lat,
                depth_km=depth,
                url=props.get("url") or "",
                felt=felt_int,
                tsunami=tsunami_int,
            )
            earthquakes.append(eq)

        log.info("usgs_fetch_done", total_features=len(features), matched=len(earthquakes))
        return earthquakes
