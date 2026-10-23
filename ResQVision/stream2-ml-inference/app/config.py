"""
app/config.py — Typed environment configuration via Pydantic BaseSettings.

All other modules import `settings` from here — single source of truth
for every configurable value in Stream 2.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application-wide settings loaded from environment variables / .env file.
    Every field has a sensible default so the server starts in mock mode
    with zero configuration.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Run mode ──────────────────────────────────────────────────────────────
    mock_inference: bool = Field(
        default=True,
        description=(
            "When True (default), skip satellite fetch + PyTorch and use "
            "synthetic damage outputs. Safe to demo without CDSE credentials "
            "or a trained model checkpoint."
        ),
    )

    # ── Inter-stream routing ──────────────────────────────────────────────────
    stream3_assessment_url: str = Field(
        default="http://localhost:8003/api/assessments",
        description="Stream 3 endpoint that receives completed DamageAssessment payloads.",
    )

    # ── Server ────────────────────────────────────────────────────────────────
    port: int = Field(default=8002)
    log_level: str = Field(default="INFO")

    # ── Copernicus Data Space Ecosystem (CDSE) ────────────────────────────────
    cdse_client_id: str = Field(
        default="",
        description="OAuth2 client ID from https://dataspace.copernicus.eu/",
    )
    cdse_client_secret: str = Field(
        default="",
        description="OAuth2 client secret from CDSE account dashboard.",
    )

    # ── WorldPop ──────────────────────────────────────────────────────────────
    worldpop_api_key: str = Field(
        default="",
        description="Optional WorldPop REST API key for population overlay.",
    )

    # ── Model checkpoint ──────────────────────────────────────────────────────
    model_checkpoint_path: Path = Field(
        default=Path("checkpoints/siamese_unet_best.pth"),
        description=(
            "Path to trained Siamese U-Net checkpoint (.pth). "
            "Only used when mock_inference=False."
        ),
    )

    # ── Retry configuration ───────────────────────────────────────────────────
    max_retry_attempts: int = Field(default=3)
    retry_wait_seconds: float = Field(default=2.0)

    # ── Satellite fetch tuning ────────────────────────────────────────────────
    bbox_half_km: float = Field(
        default=5.0,
        description="Half-size (km) of the bounding box centred on event coordinates.",
    )
    max_cloud_cover: int = Field(
        default=20,
        description="Max acceptable Sentinel-2 cloud cover percentage (0–100).",
    )
    post_image_poll_interval_hours: float = Field(
        default=2.0,
        description="Hours between retries when waiting for post-event imagery.",
    )
    post_image_max_wait_hours: float = Field(
        default=12.0,
        description="Give up waiting for post-event imagery after this many hours.",
    )

    # ── HTTP timeouts (seconds) ───────────────────────────────────────────────
    cdse_timeout_seconds: float = Field(default=60.0)
    worldpop_timeout_seconds: float = Field(default=30.0)
    stream3_timeout_seconds: float = Field(default=30.0)

    # ── Zone clustering ───────────────────────────────────────────────────────
    max_critical_zones: int = Field(
        default=25,
        description="Cap on the number of critical_zones sent to Stream 3.",
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"log_level must be one of {allowed}, got {v!r}")
        return upper

    @field_validator("max_cloud_cover")
    @classmethod
    def validate_cloud_cover(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("max_cloud_cover must be between 0 and 100")
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached singleton Settings instance.
    Use this everywhere instead of instantiating Settings directly,
    so environment variables are only parsed once.
    """
    return Settings()


# Convenience alias — most modules do `from app.config import settings`
settings: Settings = get_settings()
