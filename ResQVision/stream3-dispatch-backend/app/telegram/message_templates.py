"""Role-specific message templates for ResQVision emergency dispatch waves."""

from typing import List, Dict, Any, Tuple
import os


def calculate_primary_location(critical_zones: List[Dict[str, Any]]) -> Tuple[float, float, str]:
    """
    Computes primary coordinates and severity description.
    Prioritizes 'destroyed' or 'major_damage' zones, or falls back to the first zone or centroid.
    """
    if not critical_zones:
        return 0.0, 0.0, "Unknown Coordinates"

    # Hierarchy of damage severity
    severity_rank = {
        "destroyed": 3,
        "major_damage": 2,
        "moderate_damage": 1,
        "minor_damage": 0,
    }

    sorted_zones = sorted(
        critical_zones,
        key=lambda z: severity_rank.get(str(z.get("damage_classification", "")).lower(), -1),
        reverse=True,
    )
    top_zone = sorted_zones[0]
    lat = float(top_zone.get("lat", 0.0))
    lng = float(top_zone.get("lng", 0.0))
    classification = str(top_zone.get("damage_classification", "assessed")).replace("_", " ").title()

    return lat, lng, f"{lat:.4f}°N, {lng:.4f}°E ({classification})"


def format_zone_coordinates(critical_zones: List[Dict[str, Any]], limit: int = 3) -> str:
    """Formats a concise list of critical zone coordinates for dispatch briefs."""
    if not critical_zones:
        return "N/A"
    coords = [
        f"[{z.get('lat', 0.0):.4f}, {z.get('lng', 0.0):.4f}] ({z.get('damage_classification', 'zone')})"
        for z in critical_zones[:limit]
    ]
    if len(critical_zones) > limit:
        coords.append(f"+{len(critical_zones) - limit} more")
    return ", ".join(coords)


def render_wave1_ndrf(
    event_id: str,
    disaster_type: str,
    damage_score: int,
    affected_population: int,
    critical_zones: List[Dict[str, Any]],
    verify_url: str = None,
) -> str:
    """Wave 1 — NDRF (Verification Request)"""
    lat, lng, loc_desc = calculate_primary_location(critical_zones)
    dtype = disaster_type or "Disaster Anomaly"
    base_url = verify_url or f"{os.getenv('PUBLIC_BASE_URL', 'http://localhost:8000')}/demo?event_id={event_id}"

    return (
        f"🚨 [ACTION REQUIRED] Potential {dtype} detected near {loc_desc}.\n\n"
        f"• AI Damage Score: {damage_score}/100\n"
        f"• Est. Affected Population: {affected_population:,}\n"
        f"• Critical Zones Identified: {len(critical_zones)}\n"
        f"• Primary Coordinates: {lat:.4f}, {lng:.4f}\n\n"
        f"Please verify on-ground and confirm response via command protocol or click here: {base_url}"
    )


def render_wave2_medical(
    event_id: str,
    disaster_type: str,
    damage_score: int,
    affected_population: int,
    critical_zones: List[Dict[str, Any]],
) -> str:
    """Wave 2 — Medical Team (Triage & Trauma Mobilization)"""
    lat, lng, loc_desc = calculate_primary_location(critical_zones)
    dtype = disaster_type or "Disaster Anomaly"
    zones_brief = format_zone_coordinates(critical_zones, limit=3)

    return (
        f"🚑 [MEDICAL DISPATCH] CONFIRMED {dtype} near {loc_desc}.\n\n"
        f"• Estimated {affected_population:,} people affected.\n"
        f"• Damage Severity: {damage_score}/100\n"
        f"• Priority Deployment Sectors: {zones_brief}\n\n"
        f"Deploy medical response — prioritize most severe critical zones. Mobilize trauma teams, "
        f"triage centers, and prepare local casualty clearing stations immediately."
    )


def render_wave3_police(
    event_id: str,
    disaster_type: str,
    damage_score: int,
    affected_population: int,
    critical_zones: List[Dict[str, Any]],
) -> str:
    """Wave 3 — Police / Law Enforcement (Cordon & Evacuation)"""
    lat, lng, loc_desc = calculate_primary_location(critical_zones)
    dtype = disaster_type or "Disaster Anomaly"
    zones_brief = format_zone_coordinates(critical_zones, limit=4)

    return (
        f"🚓 [LAW ENFORCEMENT DISPATCH] CONFIRMED {dtype} near {loc_desc}.\n\n"
        f"• Establish perimeter/cordon around affected zone: {zones_brief}\n"
        f"• Estimated Civilians in Sector: {affected_population:,}\n\n"
        f"Coordinate emergency evacuation routes, secure ingress corridors for NDRF/Medical, "
        f"and enforce perimeter access control."
    )


def render_wave4_fire(
    event_id: str,
    disaster_type: str,
    damage_score: int,
    affected_population: int,
    critical_zones: List[Dict[str, Any]],
) -> str:
    """Wave 4 — Fire & Rescue Service (Hazmat & Structural Response)"""
    lat, lng, loc_desc = calculate_primary_location(critical_zones)
    dtype = disaster_type or "Disaster Anomaly"
    zones_brief = format_zone_coordinates(critical_zones, limit=3)

    return (
        f"🚒 [FIRE & RESCUE DISPATCH] CONFIRMED {dtype} near {loc_desc}.\n\n"
        f"• Structural damage severity: {damage_score}/100\n"
        f"• High-Risk Target Sectors: {zones_brief}\n\n"
        f"Dispatch for potential fire/gas-leak risk in zones: {zones_brief}. Deploy heavy rescue vehicles, "
        f"hazmat containment, and collapse search teams."
    )


def render_wave5_command(
    event_id: str,
    disaster_type: str,
    damage_score: int,
    affected_population: int,
    critical_zones: List[Dict[str, Any]],
    dashboard_url: str = None,
) -> str:
    """Wave 5 — Command Authority / Senior Disaster Management Officials (Consolidated SITREP)"""
    lat, lng, loc_desc = calculate_primary_location(critical_zones)
    dtype = disaster_type or "Disaster Anomaly"
    dash = dashboard_url or os.getenv("DASHBOARD_URL", "http://localhost:3000")

    return (
        f"🎖️ [SITUATION REPORT — WAVE 5 CONSOLIDATED BRIEFING]\n\n"
        f"• Event ID: {event_id}\n"
        f"• Incident Type: {dtype}\n"
        f"• Location: {loc_desc} (Lat: {lat:.4f}, Lng: {lng:.4f})\n"
        f"• Damage Score: {damage_score}/100\n"
        f"• Est. Affected Population: {affected_population:,}\n"
        f"• Critical Zones Monitored: {len(critical_zones)}\n"
        f"• Ground Verification: CONFIRMED by NDRF Field Unit\n"
        f"• Coordinated Wave Mobilization:\n"
        f"   - Wave 1: NDRF (Ground Verified)\n"
        f"   - Wave 2: Medical Corps (Dispatched)\n"
        f"   - Wave 3: Police & Traffic Control (Dispatched)\n"
        f"   - Wave 4: Fire & Rescue Services (Dispatched)\n\n"
        f"Live Command Dashboard: {dash}"
    )
