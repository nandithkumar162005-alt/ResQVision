"""
ResQVision Stream 1 — Processing Pipeline
Transforms raw collector outputs into canonical DisasterEvent objects,
applies deduplication, and enriches events with news corroboration.
"""

from __future__ import annotations

from typing import List

import structlog

from schemas import (
    DisasterEvent,
    RawEarthquake,
    RawNewsArticle,
    RawWeatherReading,
    make_event_id,
)
from cache import is_duplicate_event
from config import settings

log = structlog.get_logger(__name__)


class AlertPipeline:
    """
    Takes raw data from collectors, deduplicates, and produces
    canonical DisasterEvent objects for dispatch to Stream 2.
    """

    def __init__(self):
        # News headline buffer — used for corroboration, not dispatched
        self._news_headlines: List[RawNewsArticle] = []

    # ── News headline buffer (for corroboration) ─────────────

    def update_news_buffer(self, articles: List[RawNewsArticle]) -> None:
        """Store the latest batch of news articles for corroboration lookups."""
        self._news_headlines = articles
        log.info("pipeline_news_buffer_updated", count=len(articles))

    def _is_corroborated(self, keywords: List[str]) -> bool:
        """
        Check whether any buffered headline mentions one of the
        supplied keywords (case-insensitive).
        """
        valid_keywords = [kw.lower().strip() for kw in keywords if kw and kw.strip()]
        if not valid_keywords:
            return False

        for article in self._news_headlines:
            text = f"{article.title or ''} {article.description or ''}".lower()
            if any(kw in text for kw in valid_keywords):
                return True
        return False

    # ── Earthquake processing ────────────────────────────────

    def process_earthquakes(self, quakes: List[RawEarthquake]) -> List[DisasterEvent]:
        events: List[DisasterEvent] = []

        for eq in quakes:
            if is_duplicate_event("USGS", eq.id):
                continue

            event_id = make_event_id("USGS", eq.id)

            place_kw = (eq.place or "").split(",")[0].strip()
            keywords = ["earthquake"]
            if place_kw:
                keywords.append(place_kw)

            corroborated = self._is_corroborated(keywords)

            event = DisasterEvent(
                event_id=event_id,
                source="USGS",
                source_event_id=eq.id,
                event_type="earthquake",
                severity=eq.magnitude,
                latitude=eq.latitude,
                longitude=eq.longitude,
                location_name=eq.place,
                timestamp_utc=eq.time,
                corroborated_by_news=corroborated,
                metadata={
                    "depth_km": eq.depth_km,
                    "felt": eq.felt,
                    "tsunami": eq.tsunami,
                    "url": eq.url,
                },
            )
            events.append(event)
            log.info(
                "pipeline_earthquake_event",
                event_id=event_id,
                mag=eq.magnitude,
                corroborated=corroborated,
            )

        return events

    # ── Weather / rainfall processing ────────────────────────

    def process_weather(self, readings: List[RawWeatherReading]) -> List[DisasterEvent]:
        events: List[DisasterEvent] = []

        for reading in readings:
            # Only produce events when precipitation exceeds the threshold
            if reading.precipitation_mm < settings.RAINFALL_THRESHOLD_MM:
                continue

            source_event_id = (
                f"{reading.time.isoformat()}_{reading.latitude}_{reading.longitude}"
            )

            if is_duplicate_event("Open-Meteo", source_event_id):
                continue

            event_id = make_event_id("Open-Meteo", source_event_id)

            corroborated = self._is_corroborated(["flood", "rain", "rainfall", "deluge"])

            event = DisasterEvent(
                event_id=event_id,
                source="Open-Meteo",
                source_event_id=source_event_id,
                event_type="rainfall",
                severity=reading.precipitation_mm,
                latitude=reading.latitude,
                longitude=reading.longitude,
                location_name=f"({reading.latitude}, {reading.longitude})",
                timestamp_utc=reading.time,
                corroborated_by_news=corroborated,
                metadata={
                    "rain_mm": reading.rain_mm,
                    "temperature_2m": reading.temperature_2m,
                    "windspeed_10m": reading.windspeed_10m,
                    "weathercode": reading.weathercode,
                },
            )
            events.append(event)
            log.info(
                "pipeline_rainfall_event",
                event_id=event_id,
                precip=reading.precipitation_mm,
                corroborated=corroborated,
            )

        return events
