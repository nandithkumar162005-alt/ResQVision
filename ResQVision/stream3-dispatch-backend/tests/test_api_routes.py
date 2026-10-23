"""Integration tests for FastAPI REST routes, schemas, and contracts."""

import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.db.models import DisasterEvent, DispatchLog


@pytest.fixture(autouse=True)
def setup_test_database():
    """Recreate tables before each API test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_receive_assessment_valid_contract(client):
    """Verifies POST /api/assessments with valid Stream 2 payload."""
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "damage_score_out_of_100": 72,
        "affected_population_estimate": 8300,
        "disaster_type": "Flood Anomaly",
        "critical_zones": [
            {"lat": 19.0761, "lng": 72.8780, "damage_classification": "destroyed"},
            {"lat": 19.0790, "lng": 72.8750, "damage_classification": "major_damage"}
        ]
    }

    resp = client.post("/api/assessments", json=payload)
    assert resp.status_code == 201
    json_data = resp.json()
    assert json_data["status"] == "success"
    assert json_data["data"]["event_id"] == event_id
    assert json_data["data"]["dispatch_status"] == "ndrf_notified"
    assert json_data["data"]["damage_score_out_of_100"] == 72
    assert json_data["data"]["affected_population_estimate"] == 8300


def test_receive_assessment_invalid_payload_rejected(client):
    """Verifies that invalid payloads are strictly rejected with 422."""
    # Missing event_id
    bad_payload_1 = {
        "damage_score_out_of_100": 72,
        "affected_population_estimate": 8300,
        "critical_zones": [{"lat": 19.0, "lng": 72.0, "damage_classification": "destroyed"}]
    }
    resp1 = client.post("/api/assessments", json=bad_payload_1)
    assert resp1.status_code == 422

    # Non-numeric damage score
    bad_payload_2 = {
        "event_id": str(uuid.uuid4()),
        "damage_score_out_of_100": "very_high",
        "affected_population_estimate": 8300,
        "critical_zones": []
    }
    resp2 = client.post("/api/assessments", json=bad_payload_2)
    assert resp2.status_code == 422

    # Invalid latitude out of range
    bad_payload_3 = {
        "event_id": str(uuid.uuid4()),
        "damage_score_out_of_100": 80,
        "affected_population_estimate": 500,
        "critical_zones": [{"lat": 190.0, "lng": 72.0, "damage_classification": "destroyed"}]
    }
    resp3 = client.post("/api/assessments", json=bad_payload_3)
    assert resp3.status_code == 422


def test_verify_endpoint_flow(client):
    """Tests the full verification flow and idempotency via API."""
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "damage_score_out_of_100": 60,
        "affected_population_estimate": 4000,
        "critical_zones": [{"lat": 19.0761, "lng": 72.8780, "damage_classification": "destroyed"}]
    }
    # 1. Ingest
    client.post("/api/assessments", json=payload)

    # 2. Verify with confirmation and adjusted severity
    verify_resp = client.post(
        f"/api/assessments/{event_id}/verify",
        json={"confirmed": True, "adjusted_severity": 75}
    )
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert v_data["status"] == "success"
    assert v_data["data"]["dispatch_status"] == "fully_dispatched"
    assert v_data["data"]["damage_score_out_of_100"] == 75
    assert v_data["idempotent"] is False

    # 3. Idempotent repeat call
    repeat_resp = client.post(
        f"/api/assessments/{event_id}/verify",
        json={"confirmed": True}
    )
    assert repeat_resp.status_code == 200
    r_data = repeat_resp.json()
    assert r_data["idempotent"] is True

    # 4. Check active disasters output contract for Stream 4
    active_resp = client.get("/api/active-disasters")
    assert active_resp.status_code == 200
    act_data = active_resp.json()
    assert act_data["status"] == "success"
    assert len(act_data["data"]) >= 1
    found_item = next(item for item in act_data["data"] if item["event_id"] == event_id)
    assert found_item["dispatch_status"] == "fully_dispatched"
    assert found_item["damage_score_out_of_100"] == 75
    assert found_item["affected_population_estimate"] == 4000
    assert len(found_item["critical_zones"]) == 1

    # 5. Check dispatch log timeline
    log_resp = client.get(f"/api/assessments/{event_id}/dispatch-log")
    assert log_resp.status_code == 200
    log_data = log_resp.json()
    assert log_data["status"] == "success"
    assert len(log_data["data"]) == 5
    waves = [l["wave_number"] for l in log_data["data"]]
    assert waves == [1, 2, 3, 4, 5]


def test_verify_denial_flow(client):
    """Tests the false alarm denial path via API."""
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "damage_score_out_of_100": 30,
        "affected_population_estimate": 200,
        "critical_zones": [{"lat": 19.0, "lng": 72.0, "damage_classification": "minor_damage"}]
    }
    client.post("/api/assessments", json=payload)

    # Deny
    deny_resp = client.post(
        f"/api/assessments/{event_id}/verify",
        json={"confirmed": False}
    )
    assert deny_resp.status_code == 200
    assert deny_resp.json()["data"]["dispatch_status"] == "ndrf_denied"

    # Verify timeline has only wave 1 + denial log
    log_resp = client.get(f"/api/assessments/{event_id}/dispatch-log")
    assert len(log_resp.json()["data"]) == 2


def test_verify_nonexistent_event_returns_404(client):
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/api/assessments/{fake_id}/verify", json={"confirmed": True})
    assert resp.status_code == 404
    assert fake_id in resp.json()["detail"]
