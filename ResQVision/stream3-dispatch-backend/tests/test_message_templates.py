"""Unit tests for role-specific message templates (Section 11 testing requirement)."""

import pytest
from app.telegram.message_templates import (
    render_wave1_ndrf,
    render_wave2_medical,
    render_wave3_police,
    render_wave4_fire,
    render_wave5_command,
    calculate_primary_location,
    format_zone_coordinates,
)

SAMPLE_ZONES = [
    {"lat": 19.0761, "lng": 72.8780, "damage_classification": "destroyed"},
    {"lat": 19.0790, "lng": 72.8750, "damage_classification": "major_damage"},
]


def test_primary_location_selection():
    lat, lng, desc = calculate_primary_location(SAMPLE_ZONES)
    assert lat == 19.0761
    assert lng == 72.8780
    assert "Destroyed" in desc


def test_format_zone_coordinates():
    formatted = format_zone_coordinates(SAMPLE_ZONES)
    assert "19.0761" in formatted
    assert "72.8780" in formatted
    assert "destroyed" in formatted


def test_wave1_ndrf_template_contains_verification_instructions():
    msg = render_wave1_ndrf(
        event_id="test-event-uuid-1",
        disaster_type="Flood",
        damage_score=85,
        affected_population=12500,
        critical_zones=SAMPLE_ZONES,
        verify_url="http://localhost:8000/demo?event_id=test-event-uuid-1",
    )
    assert "Potential Flood detected" in msg
    assert "85/100" in msg
    assert "12,500" in msg
    assert "Please verify on-ground" in msg
    assert "http://localhost:8000/demo?event_id=test-event-uuid-1" in msg


def test_wave2_medical_template_focuses_on_triage_and_trauma():
    msg = render_wave2_medical(
        event_id="test-event-uuid-1",
        disaster_type="Earthquake",
        damage_score=78,
        affected_population=6400,
        critical_zones=SAMPLE_ZONES,
    )
    assert "CONFIRMED Earthquake" in msg
    assert "Deploy medical response" in msg
    assert "trauma teams" in msg
    assert "6,400 people affected" in msg


def test_wave3_police_template_focuses_on_cordon_and_evacuation():
    msg = render_wave3_police(
        event_id="test-event-uuid-1",
        disaster_type="Cyclone",
        damage_score=65,
        affected_population=4200,
        critical_zones=SAMPLE_ZONES,
    )
    assert "CONFIRMED Cyclone" in msg
    assert "perimeter/cordon" in msg
    assert "evacuation routes" in msg
    assert "access control" in msg


def test_wave4_fire_template_focuses_on_hazmat_and_structural_collapse():
    msg = render_wave4_fire(
        event_id="test-event-uuid-1",
        disaster_type="Industrial Explosion",
        damage_score=92,
        affected_population=3100,
        critical_zones=SAMPLE_ZONES,
    )
    assert "CONFIRMED Industrial Explosion" in msg
    assert "Structural damage severity: 92/100" in msg
    assert "fire/gas-leak risk" in msg
    assert "heavy rescue" in msg


def test_wave5_command_template_provides_consolidated_sitrep():
    msg = render_wave5_command(
        event_id="test-event-uuid-1",
        disaster_type="Urban Earthquake",
        damage_score=88,
        affected_population=15000,
        critical_zones=SAMPLE_ZONES,
        dashboard_url="http://localhost:3000",
    )
    assert "SITUATION REPORT" in msg
    assert "test-event-uuid-1" in msg
    assert "CONFIRMED by NDRF" in msg
    assert "Wave 1: NDRF" in msg
    assert "Wave 2: Medical Corps" in msg
    assert "Wave 3: Police" in msg
    assert "Wave 4: Fire & Rescue" in msg
    assert "http://localhost:3000" in msg


def test_all_templates_are_distinct_and_role_specific():
    """Confirms no two templates are identical copies with only name swapped."""
    m1 = render_wave1_ndrf("e1", "Disaster", 50, 1000, SAMPLE_ZONES)
    m2 = render_wave2_medical("e1", "Disaster", 50, 1000, SAMPLE_ZONES)
    m3 = render_wave3_police("e1", "Disaster", 50, 1000, SAMPLE_ZONES)
    m4 = render_wave4_fire("e1", "Disaster", 50, 1000, SAMPLE_ZONES)
    m5 = render_wave5_command("e1", "Disaster", 50, 1000, SAMPLE_ZONES)

    messages = [m1, m2, m3, m4, m5]
    # Check that each message has distinct keywords and lengths
    assert len(set(messages)) == 5
    assert "verify on-ground" in m1 and "verify on-ground" not in m2
    assert "trauma teams" in m2 and "trauma teams" not in m3
    assert "cordon" in m3 and "cordon" not in m4
    assert "gas-leak" in m4 and "gas-leak" not in m5
    assert "SITUATION REPORT" in m5 and "SITUATION REPORT" not in m1
