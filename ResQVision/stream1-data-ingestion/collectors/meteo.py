"""
ResQVision Stream 1 — Open-Meteo Weather Collector
Fetches recent hourly weather data (precipitation, temperature, wind)
for the configured monitoring coordinates via the Open-Meteo API.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from schemas import RawWeatherReading
from config import settings

log = structlog.get_logger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class MeteoCollector:
    """Fetch hourly weather observations from Open-Meteo."""

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
    async def fetch(self) -> List[RawWeatherReading]:
        """
        Pull the last 24 hours of hourly weather data for the
        configured lat/lon and return readings with non-zero precipitation.
        """
        client = await self._get_client()

        params = {
            "latitude": settings.MONITOR_LATITUDE,
            "longitude": settings.MONITOR_LONGITUDE,
            "hourly": "temperature_2m,precipitation,rain,windspeed_10m,weathercode",
            "past_hours": 24,
            "forecast_days": 0,
            "timezone": "UTC",
        }

        log.info("meteo_fetch_start", lat=settings.MONITOR_LATITUDE, lon=settings.MONITOR_LONGITUDE)
        resp = await client.get(OPEN_METEO_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        readings: List[RawWeatherReading] = []

        for i, time_str in enumerate(times):
            raw_precip = _safe_index(hourly.get("precipitation"), i)
            raw_rain = _safe_index(hourly.get("rain"), i)

            precip = float(raw_precip) if raw_precip is not None else 0.0
            rain = float(raw_rain) if raw_rain is not None else 0.0

            # Only keep readings with meaningful precipitation
            if precip <= 0 and rain <= 0:
                continue

            try:
                dt = datetime.fromisoformat(time_str)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                dt = datetime.now(timezone.utc)

            reading = RawWeatherReading(
                time=dt,
                latitude=settings.MONITOR_LATITUDE,
                longitude=settings.MONITOR_LONGITUDE,
                temperature_2m=_safe_index(hourly.get("temperature_2m"), i),
                precipitation_mm=precip,
                rain_mm=rain,
                windspeed_10m=_safe_index(hourly.get("windspeed_10m"), i),
                weathercode=_safe_index(hourly.get("weathercode"), i),
            )
            readings.append(reading)

        log.info("meteo_fetch_done", total_hours=len(times), rainy_hours=len(readings))
        return readings


def _safe_index(lst: list | None, idx: int):
    """Return lst[idx] if available, else None."""
    if lst is None:
        return None
    try:
        return lst[idx]
    except (IndexError, TypeError):
        return None
