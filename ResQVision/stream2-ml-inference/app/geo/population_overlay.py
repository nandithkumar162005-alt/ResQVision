"""
app/geo/population_overlay.py — Estimate affected population using WorldPop data.

WorldPop provides free, open, gridded population data at ~100m resolution.
API documentation: https://www.worldpop.org/

We estimate the population living within the *critical damage zones*
(major_damage + destroyed areas only — NOT the full search bounding box).
This reflects the people most likely to need emergency assistance.

Integration approach:
    Primary:   WorldPop REST API (requires WORLDPOP_API_KEY in .env)
    Fallback:  Formula estimate using area × population density × severity
               multiplier. Used when API key is absent or API is unavailable.

    In MOCK_INFERENCE mode, always use the mock estimate (avoids any
    external network calls during development and demos).

Formula fallback rationale:
    Base density: ~6,000 people/km² (typical Indian urban area, suitable
    default for the demo disaster locations around Mumbai/19°N 72°E).
    Severity multiplier: scales 0.5–3.0 based on event severity_metric.
    This keeps demo numbers in a plausible range without requiring real data.
"""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

import httpx
from loguru import logger

from app.config import settings
from app.schemas import BoundingBox, DisasterEvent

if TYPE_CHECKING:
    from app.ml.infer import DamagePoint


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

CRITICAL_CLASSES: frozenset[str] = frozenset({"destroyed", "major_damage"})

# Base urban population density (people per km²).
# Source: India urban average, suitable for default demo location (Mumbai area).
BASE_DENSITY_PER_KM2: float = 6_000.0

# Minimum area attributed to a single damaged building (100m × 100m).
MIN_AREA_KM2: float = 0.01

WORLDPOP_API_BASE = "https://api.worldpop.org/v1"


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────


def _compute_critical_area_km2(
    damage_points: list["DamagePoint"],
    bbox: BoundingBox,
) -> float:
    """
    Compute the approximate area (km²) covered by critical damage points.

    We take the bounding box of all critical-class points (major_damage +
    destroyed) and convert degree extents to km using the Haversine-derived
    approximation.

    Args:
        damage_points: Full list of DamagePoints from the inference pipeline.
        bbox:          Bounding box of the assessed area (for reference).

    Returns:
        Area in km² covered by critical zones. Minimum MIN_AREA_KM2.
    """
    critical = [p for p in damage_points if p.damage_class in CRITICAL_CLASSES]

    if not critical:
        return 0.0

    lats = [p.lat for p in critical]
    lngs = [p.lng for p in critical]

    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    center_lat = (min_lat + max_lat) / 2
    lat_rad = math.radians(center_lat)

    # 1 degree latitude ≈ 111.32 km (constant)
    # 1 degree longitude ≈ 111.32 × cos(lat) km
    delta_lat_km = (max_lat - min_lat) * 111.32
    delta_lng_km = (max_lng - min_lng) * 111.32 * math.cos(lat_rad)

    area_km2 = max(MIN_AREA_KM2, delta_lat_km * delta_lng_km)

    logger.debug(
        "Critical area: {:.4f}° lat × {:.4f}° lng → {:.3f} km²",
        max_lat - min_lat,
        max_lng - min_lng,
        area_km2,
    )
    return area_km2


def _severity_multiplier(event: DisasterEvent) -> float:
    """
    Compute a severity-based multiplier for population density scaling.

    Multiplier range: 0.5 (low-end) to 3.0 (catastrophic).

    Earthquake: based on Richter magnitude (logarithmic scale compressed to linear).
    Flood/Cyclone: based on mm/hr rainfall intensity.
    Other: constant 1.0.
    """
    s = event.severity_metric
    dtype = event.disaster_type

    if "earthquake" in dtype or "seismic" in dtype:
        # magnitude 5.0 → 0.5x, 7.0 → 1.5x, 9.0 → 3.0x
        multiplier = (s - 5.0) / 4.0 * 2.5 + 0.5
    elif "flood" in dtype or "rainfall" in dtype or "cyclone" in dtype:
        # 50 mm/hr → 0.5x, 100 mm/hr → 1.5x, 150+ mm/hr → 3.0x
        multiplier = (s - 50.0) / 50.0 * 1.25 + 0.5 if s > 50 else 0.5
    else:
        multiplier = 1.0

    return max(0.5, min(3.0, multiplier))


def _formula_estimate(event: DisasterEvent, critical_area_km2: float) -> int:
    """
    Formula-based population estimate used as fallback when WorldPop API
    is unavailable or not configured.

    Formula: population ≈ area_km² × base_density × severity_multiplier

    Args:
        event:              The incoming disaster event (for severity_metric).
        critical_area_km2:  Area covered by critical damage zones.

    Returns:
        Estimated affected population (non-negative integer).
    """
    multiplier = _severity_multiplier(event)
    population = int(critical_area_km2 * BASE_DENSITY_PER_KM2 * multiplier)
    population = max(0, population)

    logger.info(
        "Formula population estimate: {:.3f} km² × {:.0f}/km² × {:.2f} multiplier = {} people",
        critical_area_km2,
        BASE_DENSITY_PER_KM2,
        multiplier,
        population,
    )
    return population


def _mock_estimate(event: DisasterEvent) -> int:
    """
    Synthetic population estimate for MOCK_INFERENCE mode.

    Scales directly with severity_metric so demo numbers feel causally
    sensible during narration. No external API calls.

    Args:
        event: The incoming disaster event.

    Returns:
        Estimated affected population (non-negative integer).
    """
    s = event.severity_metric
    dtype = event.disaster_type

    if "earthquake" in dtype or "seismic" in dtype:
        # 6.0 → ~1,300, 7.0 → ~5,200, 8.0 → ~11,700, 8.5 → ~17,225
        population = int(max(100, (s - 5.0) ** 2 * 1_300))
    elif "flood" in dtype or "rainfall" in dtype or "cyclone" in dtype:
        # 51 mm/hr → ~120, 100 mm/hr → ~6,000, 150 mm/hr → ~12,000
        population = int(max(50, (s - 50) * 120)) if s > 50 else 50
    else:
        population = int(max(100, s * 800))

    logger.info(
        "Mock population estimate for {!r} severity={}: {} people",
        dtype,
        s,
        population,
    )
    return population


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────


async def estimate_population(
    damage_points: list["DamagePoint"],
    bbox: BoundingBox,
    event: DisasterEvent,
    mock_mode: bool = True,
) -> int:
    """
    Estimate the number of people affected within critical damage zones.

    Resolution order:
      1. Mock estimate (if mock_mode=True) — immediate, no network calls.
      2. WorldPop REST API (if WORLDPOP_API_KEY is configured and reachable).
      3. Formula estimate fallback (if API unavailable or key missing).

    Args:
        damage_points: Full list from inference pipeline (all classes).
        bbox:          Geographic bounding box of the assessed area.
        event:         Original disaster event (for severity_metric, type).
        mock_mode:     If True, skip all external calls and use mock estimate.

    Returns:
        Non-negative integer population estimate.
    """
    # ── Mock mode: instant synthetic estimate ─────────────────────────────────
    if mock_mode:
        logger.info("MOCK MODE: using synthetic population estimate.")
        return _mock_estimate(event)

    # ── Compute critical area ─────────────────────────────────────────────────
    critical_area_km2 = _compute_critical_area_km2(damage_points, bbox)

    if critical_area_km2 == 0.0:
        logger.info("No critical damage zones detected — population estimate is 0.")
        return 0

    # ── Try WorldPop API ──────────────────────────────────────────────────────
    if not settings.worldpop_api_key:
        logger.warning(
            "WORLDPOP_API_KEY not configured — using formula estimate. "
            "Set WORLDPOP_API_KEY in .env for real population data."
        )
        return _formula_estimate(event, critical_area_km2)

    try:
        population = await _query_worldpop_api(damage_points, bbox, event)
        return population
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "WorldPop API call failed ({}): {} — falling back to formula estimate.",
            type(exc).__name__,
            exc,
        )
        return _formula_estimate(event, critical_area_km2)


async def _query_worldpop_api(
    damage_points: list["DamagePoint"],
    bbox: BoundingBox,
    event: DisasterEvent,
) -> int:
    """
    Query the WorldPop REST API for population within the critical zone extent.

    Uses the /v1/wopr/pointinpolygon endpoint with the bounding box of
    critical damage points as the query polygon.

    Args:
        damage_points: Full list of DamagePoints (filtered internally).
        bbox:          Full assessed bounding box.
        event:         Original disaster event (for logging).

    Returns:
        Integer population count from WorldPop API.

    Raises:
        httpx.HTTPError:    On network or HTTP errors.
        ValueError:         If API response is malformed.
    """
    # Compute the critical-only bbox for the API query
    critical = [p for p in damage_points if p.damage_class in CRITICAL_CLASSES]
    if not critical:
        return 0

    lats = [p.lat for p in critical]
    lngs = [p.lng for p in critical]

    # Build a simple GeoJSON polygon from the critical zone bbox
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    # WorldPop API: GET /v1/wopr/pointinpolygon
    # Docs: https://wopr.worldpop.org/
    params = {
        "iso3": _guess_country_iso3(event.coordinates.lat, event.coordinates.lng),
        "ver": "1.0",
        "year": "2020",
        "bbox": f"{min_lng},{min_lat},{max_lng},{max_lat}",
        "apikey": settings.worldpop_api_key,
    }

    url = f"{WORLDPOP_API_BASE}/wopr/pointinpolygon"

    async with httpx.AsyncClient(timeout=settings.worldpop_timeout_seconds) as client:
        logger.info("Querying WorldPop API for population in critical zone bbox.")
        response = await client.get(url, params=params)
        response.raise_for_status()

    data = response.json()

    # WorldPop response structure varies by endpoint version — handle gracefully
    if "data" in data and "total_population" in data["data"]:
        population = int(data["data"]["total_population"])
    elif "total_population" in data:
        population = int(data["total_population"])
    else:
        raise ValueError(
            f"Unexpected WorldPop API response structure: {list(data.keys())}"
        )

    logger.info(
        "WorldPop API: {} people in critical zone (event_id={}).",
        population,
        event.event_id,
    )
    return population


def _guess_country_iso3(lat: float, lng: float) -> str:
    """
    Heuristic country ISO3 code lookup based on coordinates.

    This is a simple bounding-box approach for the most common demo
    disaster locations. For production, use a proper reverse geocoder
    (e.g., geopy or a PostGIS lookup in Stream 3's database).
    """
    # India: roughly 8°N–37°N, 68°E–97°E
    if 8 <= lat <= 37 and 68 <= lng <= 97:
        return "IND"
    # Nepal (common earthquake demo location): 26°N–31°N, 80°E–88°E
    if 26 <= lat <= 31 and 80 <= lng <= 88:
        return "NPL"
    # Default: India (matches demo coordinates in the spec)
    return "IND"
