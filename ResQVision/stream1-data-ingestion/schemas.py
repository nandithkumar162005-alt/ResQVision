"""
ResQVision Stream 1 — Data Schemas
Pydantic models for raw collector outputs and the canonical
DisasterEvent envelope dispatched to Stream 2.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Raw collector payloads
# ──────────────────────────────────────────────

class RawEarthquake(BaseModel):
    """Single earthquake feature from the USGS GeoJSON feed."""
    id: str
    magnitude: float
    place: str
    time: datetime
    longitude: float
    latitude: float
    depth_km: float
    url: str
    felt: Optional[int] = None
    tsunami: int = 0


class RawWeatherReading(BaseModel):
    """Hourly weather reading from Open-Meteo."""
    time: datetime
    latitude: float
    longitude: float
    temperature_2m: Optional[float] = None
    precipitation_mm: float = 0.0
    rain_mm: float = 0.0
    windspeed_10m: Optional[float] = None
    weathercode: Optional[int] = None


class RawNewsArticle(BaseModel):
    """Single article from NewsAPI / ReliefWeb."""
    source_name: str
    title: str
    description: Optional[str] = None
    url: str
    published_at: datetime
    content_snippet: Optional[str] = None


# ──────────────────────────────────────────────
# Canonical event model (passed to Stream 2)
# ──────────────────────────────────────────────

class DisasterEvent(BaseModel):
    """Canonical event model passed to Stream 2."""
    event_id: str = Field(..., description="Deterministic hash ID")
    source: str = Field(..., description="USGS, Open-Meteo, or ReliefWeb")
    source_event_id: str = Field(..., description="Unique ID provided by the raw source")
    event_type: str = Field(..., description="earthquake or rainfall")
    severity: float = Field(..., description="Magnitude or precipitation depth in mm")
    latitude: float
    longitude: float
    location_name: str
    timestamp_utc: datetime
    corroborated_by_news: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ──────────────────────────────────────────────
# Helper: deterministic event ID
# ──────────────────────────────────────────────

def make_event_id(source: str, source_event_id: str) -> str:
    """
    Produce a deterministic, collision-resistant hash from
    the data source name and its native event key.
    """
    raw = f"{source}:{source_event_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
