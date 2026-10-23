from typing import List, Optional
import datetime
from pydantic import BaseModel, Field, field_validator
import uuid


class CriticalZone(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")
    damage_classification: str = Field(..., min_length=1, description="Classification such as destroyed, major_damage, moderate_damage")

    model_config = {"extra": "forbid"}


class AssessmentCreate(BaseModel):
    event_id: str = Field(..., description="UUID carried from Stream 1 through Stream 2")
    damage_score_out_of_100: int = Field(..., ge=0, le=100, description="Damage score between 0 and 100")
    affected_population_estimate: int = Field(..., ge=0, description="Estimated affected population count")
    critical_zones: List[CriticalZone] = Field(..., min_length=1, description="List of critical geographic zones")
    disaster_type: Optional[str] = Field(default=None, description="Optional disaster type if forwarded from earlier streams")

    @field_validator("event_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        try:
            val = uuid.UUID(str(v).strip())
            return str(val)
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid UUID string format for event_id: '{v}'")

    model_config = {
        "extra": "ignore",
        "json_schema_extra": {
            "example": {
                "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
                "damage_score_out_of_100": 72,
                "affected_population_estimate": 8300,
                "critical_zones": [
                    {
                        "lat": 19.0761,
                        "lng": 72.8780,
                        "damage_classification": "destroyed"
                    },
                    {
                        "lat": 19.0790,
                        "lng": 72.8750,
                        "damage_classification": "major_damage"
                    }
                ]
            }
        }
    }


class VerificationRequest(BaseModel):
    confirmed: bool = Field(..., description="True if NDRF verifies ground truth, False if denied/false positive")
    adjusted_severity: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
        description="Optional adjusted severity score reported by ground team (0-100)"
    )

    model_config = {
        "extra": "ignore",
        "json_schema_extra": {
            "example": {
                "confirmed": True,
                "adjusted_severity": 80
            }
        }
    }


class DispatchLogItem(BaseModel):
    id: int
    event_id: str
    wave_number: int
    team_name: str
    status: str
    sent_at: datetime.datetime
    message_content: str

    model_config = {"from_attributes": True}


class DisasterEventItem(BaseModel):
    event_id: str
    dispatch_status: str
    damage_score_out_of_100: int
    # Safely included per blueprint Section 7 recommendation
    affected_population_estimate: int
    critical_zones: List[CriticalZone]
    disaster_type: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class ActiveDisastersResponse(BaseModel):
    status: str = "success"
    data: List[DisasterEventItem]


class AssessmentDetailResponse(BaseModel):
    status: str = "success"
    data: DisasterEventItem
    dispatch_logs: List[DispatchLogItem] = []


class DispatchLogListResponse(BaseModel):
    status: str = "success"
    event_id: str
    data: List[DispatchLogItem]
