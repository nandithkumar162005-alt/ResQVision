"""
app/schemas.py — Pydantic models for Stream 2's inbound and outbound contracts.

CRITICAL: Do not rename any field without coordinating with Stream 1 (input)
and Stream 3 (output). Field names are the integration contract.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# Inbound contract — what Stream 1 sends us
# ─────────────────────────────────────────────────────────────────────────────


class Coordinates(BaseModel):
    """Geographical coordinates from Stream 1."""

    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees.")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees.")


class DisasterEvent(BaseModel):
    """
    Exact shape sent by Stream 1 to POST /trigger-assessment.

    Validation failures produce HTTP 422 automatically (FastAPI + Pydantic v2).
    Do NOT add extra fields — Stream 1 only sends these exact keys.
    """

    event_id: UUID = Field(
        ...,
        description=(
            "Unique incident identifier. MUST be carried unchanged through "
            "the entire pipeline and sent verbatim to Stream 3."
        ),
    )
    disaster_type: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Type of disaster, e.g. 'earthquake', 'flood', 'cyclone'.",
    )
    coordinates: Coordinates = Field(..., description="Epicentre / event location.")
    severity_metric: float = Field(
        ...,
        gt=0.0,
        description=(
            "Severity measure. Meaning depends on disaster_type: "
            "Richter magnitude for earthquakes; mm/hr for rainfall/floods."
        ),
    )
    timestamp_utc: datetime = Field(
        ...,
        description="ISO-8601 UTC timestamp when the disaster was detected.",
    )

    @field_validator("disaster_type")
    @classmethod
    def normalise_disaster_type(cls, v: str) -> str:
        """Lowercase and strip so downstream comparisons are consistent."""
        return v.strip().lower()

    model_config = {"json_schema_extra": {
        "example": {
            "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
            "disaster_type": "earthquake",
            "coordinates": {"lat": 19.0760, "lng": 72.8777},
            "severity_metric": 6.2,
            "timestamp_utc": "2026-10-10T14:23:01Z",
        }
    }}


# ─────────────────────────────────────────────────────────────────────────────
# Outbound contract — what we send to Stream 3
# ─────────────────────────────────────────────────────────────────────────────

DamageClassification = Literal["destroyed", "major_damage"]
"""
Only these two classifications appear in critical_zones sent to Stream 3.
minor_damage and no_damage exist internally but are NOT forwarded — they are
not critical enough to clutter Stream 4's map or drive emergency dispatch.
"""

InternalDamageClass = Literal["no_damage", "minor_damage", "major_damage", "destroyed"]
"""
Full four-class schema matching xBD/xView2 challenge labels.
Used internally in model output and mock_infer; NOT sent to Stream 3 directly.
"""


class CriticalZone(BaseModel):
    """
    A single high-severity geographic zone included in the assessment output.
    Only destroyed and major_damage zones are surfaced here.
    """

    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    damage_classification: DamageClassification


class DamageAssessment(BaseModel):
    """
    Exact JSON shape POSTed to Stream 3's /api/assessments endpoint.

    Field rules (DO NOT CHANGE without cross-stream coordination):
    - event_id:   verbatim from DisasterEvent.event_id (UUID string in payload)
    - damage_score_out_of_100: integer 0–100
    - affected_population_estimate: integer ≥ 0
    - critical_zones: list of CriticalZone, max 25, only destroyed/major_damage
    """

    event_id: UUID = Field(..., description="Pass-through from Stream 1 — never regenerate.")
    damage_score_out_of_100: int = Field(
        ...,
        ge=0,
        le=100,
        description="Overall damage severity, 0 (none) to 100 (catastrophic).",
    )
    affected_population_estimate: int = Field(
        ...,
        ge=0,
        description="Estimated number of people within major_damage + destroyed zones.",
    )
    critical_zones: list[CriticalZone] = Field(
        default_factory=list,
        max_length=25,
        description="Up to 25 critical zone centroids for map visualisation.",
    )
    disaster_type: str | None = Field(
        default=None,
        description="Optional pass-through (earthquake/flood) so Stream 3 / the dashboard can label the incident.",
    )

    @model_validator(mode="after")
    def validate_zones_count(self) -> "DamageAssessment":
        if len(self.critical_zones) > 25:
            raise ValueError(
                f"critical_zones must contain at most 25 entries, "
                f"got {len(self.critical_zones)}. Cluster before sending."
            )
        return self

    def to_stream3_dict(self) -> dict:
        """
        Serialise to the exact dict shape Stream 3 expects.
        UUID is converted to str, matching JSON schema.
        """
        payload = {
            "event_id": str(self.event_id),
            "damage_score_out_of_100": self.damage_score_out_of_100,
            "affected_population_estimate": self.affected_population_estimate,
            "critical_zones": [
                {
                    "lat": z.lat,
                    "lng": z.lng,
                    "damage_classification": z.damage_classification,
                }
                for z in self.critical_zones
            ],
        }
        if self.disaster_type:
            payload["disaster_type"] = self.disaster_type
        return payload

    model_config = {"json_schema_extra": {
        "example": {
            "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
            "damage_score_out_of_100": 72,
            "affected_population_estimate": 8300,
            "critical_zones": [
                {"lat": 19.0761, "lng": 72.8780, "damage_classification": "destroyed"},
                {"lat": 19.0790, "lng": 72.8750, "damage_classification": "major_damage"},
            ],
        }
    }}


# ─────────────────────────────────────────────────────────────────────────────
# Internal types shared between pipeline stages
# ─────────────────────────────────────────────────────────────────────────────


class BoundingBox(BaseModel):
    """Axis-aligned geographic bounding box used throughout the pipeline."""

    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float

    @model_validator(mode="after")
    def validate_ordering(self) -> "BoundingBox":
        if self.min_lat >= self.max_lat:
            raise ValueError("min_lat must be less than max_lat")
        if self.min_lng >= self.max_lng:
            raise ValueError("min_lng must be less than max_lng")
        return self

    def contains(self, lat: float, lng: float) -> bool:
        return (
            self.min_lat <= lat <= self.max_lat
            and self.min_lng <= lng <= self.max_lng
        )

    def center(self) -> tuple[float, float]:
        return (
            (self.min_lat + self.max_lat) / 2,
            (self.min_lng + self.max_lng) / 2,
        )


class TriggerResponse(BaseModel):
    """Immediate 202 Accepted response sent back to Stream 1."""

    status: Literal["processing"] = "processing"
    event_id: UUID
    message: str = "Assessment pipeline started. Results will be dispatched to Stream 3."
