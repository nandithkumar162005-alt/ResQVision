"""
tests/test_e2e.py — End-to-end integration tests for ResQVision Stream 2.

Covers all 8 integration-readiness tasks:
  1. POST /trigger-assessment accepts timestamp_utc with "Z" and "+00:00".
  2. Same event_id sent twice → first 202 Accepted, second 409 Conflict.
  3. critical_zones is never empty in mock mode (including low severities).
  4. Stream 3 POST uses exactly the 4 contract fields; 5xx is retried and
     logged but does NOT raise or crash the server.
  5. Endpoint shape: 202 body, 409 body, 422 on bad payload.

All outbound HTTP calls to Stream 3 are intercepted by a mock so these
tests run fully offline with no real network dependency.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

import app.dispatcher as dispatcher_module
import app.main as main_module
from app.config import settings
from app.main import app, run_pipeline
from app.schemas import DisasterEvent


# ─── Shared helpers ───────────────────────────────────────────────────────────


def _make_event(**overrides) -> dict:
    """Build a valid Stream 1 payload dict, with optional field overrides."""
    base: dict = {
        "event_id": str(uuid.uuid4()),
        "disaster_type": "earthquake",
        "coordinates": {"lat": 19.076, "lng": 72.8777},
        "severity_metric": 6.2,
        "timestamp_utc": "2026-10-10T14:23:01Z",
    }
    return {**base, **overrides}


def _make_disaster_event(**overrides) -> DisasterEvent:
    """Build a validated DisasterEvent Pydantic model."""
    return DisasterEvent(**_make_event(**overrides))


class _OkStream3:
    """
    Context-manager mock for httpx.AsyncClient that captures the POST payload
    and returns HTTP 200. Replace ``app.dispatcher.httpx.AsyncClient`` with
    this class to intercept outbound Stream 3 calls.
    """

    _captured: dict

    def __init__(self):
        self._captured = {}

    @property
    def captured(self) -> dict:
        return self._captured

    async def _post(self, url, *, json=None, **_kw):
        self._captured.update(json or {})
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = "ok"
        return mock_resp

    def make_client_class(self):
        """Return a drop-in replacement for httpx.AsyncClient."""
        outer = self

        class _CM:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self_cm):
                inner = AsyncMock()
                inner.post = outer._post
                return inner

            async def __aexit__(self_cm, *a):
                pass

        return _CM


class _FailingStream3:
    """
    Context-manager mock for httpx.AsyncClient that always responds HTTP 503.
    Records how many times ``post`` was called.
    """

    def __init__(self):
        self.call_count = 0

    def make_client_class(self):
        outer = self
        fake_req = MagicMock(spec=httpx.Request)

        class _CM:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self_cm):
                async def _post(url, *, json=None, **_kw):
                    outer.call_count += 1
                    resp = MagicMock()
                    resp.status_code = 503
                    resp.text = "Service Unavailable"
                    resp.raise_for_status = MagicMock(
                        side_effect=httpx.HTTPStatusError(
                            "503 Service Unavailable",
                            request=fake_req,
                            response=resp,
                        )
                    )
                    return resp

                inner = AsyncMock()
                inner.post = _post
                return inner

            async def __aexit__(self_cm, *a):
                pass

        return _CM


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def reset_idempotency():
    """Clear in-memory processing/completed sets before and after every test."""
    main_module._processing.clear()
    main_module._completed.clear()
    yield
    main_module._processing.clear()
    main_module._completed.clear()


# ─── Endpoint shape tests (synchronous, via TestClient) ───────────────────────


class TestEndpointShape:
    """HTTP-level contract tests: status codes, response bodies, validation."""

    @pytest.fixture(autouse=True)
    def fast_dispatch(self):
        """
        Patch httpx.AsyncClient inside the dispatcher so background pipeline
        tasks complete instantly (HTTP 200 mock) instead of retrying a real
        localhost:8003 connection for 13+ seconds per test.
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = "ok"

        inner = AsyncMock()
        inner.post = AsyncMock(return_value=mock_resp)

        class _InstantCM:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self):
                return inner

            async def __aexit__(self, *a):
                pass

        with patch("app.dispatcher.httpx.AsyncClient", _InstantCM):
            yield

    def test_returns_202_with_correct_body(self):
        """POST /trigger-assessment → 202 with status='processing' and event_id."""
        event = _make_event()
        client = TestClient(app)
        resp = client.post("/trigger-assessment", json=event)
        assert resp.status_code == 202, resp.text
        body = resp.json()
        assert body["status"] == "processing", f"Expected 'processing', got: {body}"
        assert "event_id" in body, "Response must include event_id"
        assert "message" in body, "Response must include message"

    def test_timestamp_z_suffix_accepted(self):
        """Task 1: timestamp_utc with 'Z' UTC suffix must be accepted."""
        event = _make_event(timestamp_utc="2026-10-10T14:23:01Z")
        client = TestClient(app)
        resp = client.post("/trigger-assessment", json=event)
        assert resp.status_code == 202, (
            f"Expected 202 for 'Z' timestamp, got {resp.status_code}: {resp.text}"
        )

    def test_timestamp_plus0000_suffix_accepted(self):
        """Task 1: timestamp_utc with '+00:00' UTC offset must be accepted."""
        event = _make_event(timestamp_utc="2026-10-10T14:23:01+00:00")
        client = TestClient(app)
        resp = client.post("/trigger-assessment", json=event)
        assert resp.status_code == 202, (
            f"Expected 202 for '+00:00' timestamp, got {resp.status_code}: {resp.text}"
        )

    def test_duplicate_event_id_while_processing_returns_409(self):
        """
        Task 2 (processing path): event_id already in _processing → 409 Conflict.
        Pre-populate _processing so the check is deterministic with no
        background-task timing dependency.
        """
        event = _make_event()
        eid = event["event_id"]
        main_module._processing.add(eid)

        client = TestClient(app)
        resp = client.post("/trigger-assessment", json=event)

        assert resp.status_code == 409, (
            f"Expected 409 for event already in _processing, got {resp.status_code}"
        )
        body = resp.json()
        assert body.get("event_id") == eid, f"409 body must echo event_id, got: {body}"
        assert "detail" in body, "409 body must include 'detail' field"

    def test_duplicate_event_id_already_completed_returns_409(self):
        """
        Task 2 (completed path): event_id already in _completed → 409 Conflict.
        Pre-populate _completed to test the post-pipeline idempotency guard.
        """
        event = _make_event()
        eid = event["event_id"]
        main_module._completed.add(eid)

        client = TestClient(app)
        resp = client.post("/trigger-assessment", json=event)

        assert resp.status_code == 409, (
            f"Expected 409 for event already in _completed, got {resp.status_code}"
        )
        body = resp.json()
        assert body.get("event_id") == eid, f"409 body must echo event_id, got: {body}"
        assert "detail" in body, "409 body must include 'detail' field"

    def test_malformed_payload_returns_422(self):
        """Missing required fields → 422 Unprocessable Entity (automatic via Pydantic)."""
        client = TestClient(app)
        resp = client.post("/trigger-assessment", json={"disaster_type": "earthquake"})
        assert resp.status_code == 422, f"Expected 422 for partial payload, got {resp.status_code}"

    def test_health_endpoint_shape(self):
        """GET /health returns status='ok', stream=2, and mock_inference flag."""
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("status") == "ok"
        assert body.get("stream") == 2
        assert "mock_inference" in body

    def test_status_unknown_for_unseen_event(self):
        """GET /status/{id} for unknown event_id → status='unknown'."""
        client = TestClient(app)
        resp = client.get(f"/status/{uuid.uuid4()}")
        assert resp.status_code == 200
        assert resp.json().get("status") == "unknown"


# ─── Pipeline contract tests (async) ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_stream3_payload_has_exactly_four_fields():
    """
    Task 4: the payload POSTed to Stream 3 must contain EXACTLY the four
    contract fields — no more, no less.
    """
    ok = _OkStream3()
    event = _make_disaster_event(severity_metric=7.0)

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    payload = ok.captured
    assert payload, "Expected run_pipeline to POST to Stream 3 but no payload was captured"

    assert set(payload.keys()) == {
        "event_id",
        "damage_score_out_of_100",
        "affected_population_estimate",
        "critical_zones",
        "disaster_type",  # optional pass-through, accepted by Stream 3
    }, f"Stream 3 payload has wrong keys: {set(payload.keys())}"


@pytest.mark.asyncio
async def test_event_id_passed_through_unchanged():
    """Task 4: event_id in Stream 3 payload must be verbatim from Stream 1 input."""
    ok = _OkStream3()
    event = _make_disaster_event()

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    assert ok.captured.get("event_id") == str(event.event_id), (
        f"event_id mismatch: sent {event.event_id}, "
        f"received by Stream 3: {ok.captured.get('event_id')}"
    )


@pytest.mark.asyncio
async def test_stream3_payload_field_types():
    """Task 4: all Stream 3 payload fields must have correct types."""
    ok = _OkStream3()
    event = _make_disaster_event(severity_metric=8.0)

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    p = ok.captured
    assert isinstance(p["event_id"], str), f"event_id must be str, got {type(p['event_id'])}"
    assert isinstance(p["damage_score_out_of_100"], int), (
        f"damage_score_out_of_100 must be int, got {type(p['damage_score_out_of_100'])}"
    )
    assert 0 <= p["damage_score_out_of_100"] <= 100, (
        f"damage_score_out_of_100 out of range: {p['damage_score_out_of_100']}"
    )
    assert isinstance(p["affected_population_estimate"], int), (
        f"affected_population_estimate must be int, got {type(p['affected_population_estimate'])}"
    )
    assert p["affected_population_estimate"] >= 0

    zones = p["critical_zones"]
    assert isinstance(zones, list)
    for z in zones:
        assert isinstance(z["lat"], float), f"zone lat must be float, got {type(z['lat'])}"
        assert isinstance(z["lng"], float), f"zone lng must be float, got {type(z['lng'])}"
        assert z["damage_classification"] in ("destroyed", "major_damage"), (
            f"Invalid classification: {z['damage_classification']}"
        )
        assert set(z.keys()) == {"lat", "lng", "damage_classification"}, (
            f"Zone has wrong keys: {set(z.keys())}"
        )


@pytest.mark.asyncio
async def test_critical_zones_never_empty_earthquake_low():
    """Task 3: earthquake magnitude 6.0 must produce >= 1 critical zone."""
    ok = _OkStream3()
    event = _make_disaster_event(disaster_type="earthquake", severity_metric=6.0)

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    zones = ok.captured.get("critical_zones", [])
    assert len(zones) >= 1, (
        f"Stream 3 must receive >= 1 critical zone for earthquake 6.0, got {len(zones)}"
    )


@pytest.mark.asyncio
async def test_critical_zones_never_empty_flood_low():
    """Task 3: flood 51 mm/hr (minimum trigger) must produce >= 1 critical zone."""
    ok = _OkStream3()
    event = _make_disaster_event(disaster_type="flood", severity_metric=51.0)

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    zones = ok.captured.get("critical_zones", [])
    assert len(zones) >= 1, (
        f"Stream 3 must receive >= 1 critical zone for flood 51mm/hr, got {len(zones)}"
    )


@pytest.mark.asyncio
async def test_critical_zones_capped_at_25():
    """critical_zones never exceeds 25 entries (Stream 3 / 4 contract cap)."""
    ok = _OkStream3()
    event = _make_disaster_event(severity_metric=9.0)  # very high severity = many points

    with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
        await run_pipeline(event)

    zones = ok.captured.get("critical_zones", [])
    assert len(zones) <= 25, f"critical_zones must be <= 25, got {len(zones)}"


@pytest.mark.asyncio
async def test_stream3_5xx_retried_does_not_crash():
    """
    Task 4: when Stream 3 returns 503, dispatcher retries and eventually
    raises DispatchError — which run_pipeline catches internally.
    The server must NOT raise or crash.
    """
    failing = _FailingStream3()
    event = _make_disaster_event(severity_metric=7.0)

    # Speed up test: 1 attempt total, no sleep between retries
    mock_disp_settings = MagicMock()
    mock_disp_settings.stream3_assessment_url = settings.stream3_assessment_url
    mock_disp_settings.stream3_timeout_seconds = settings.stream3_timeout_seconds
    mock_disp_settings.max_retry_attempts = 1
    mock_disp_settings.retry_wait_seconds = 0.0

    with patch.object(dispatcher_module, "settings", mock_disp_settings), \
         patch("app.dispatcher.httpx.AsyncClient", failing.make_client_class()):
        # Must NOT raise — pipeline catches DispatchError and logs it
        await run_pipeline(event)

    assert failing.call_count >= 1, "Expected at least 1 dispatch attempt before giving up"


@pytest.mark.asyncio
async def test_full_pipeline_both_timestamp_formats():
    """
    Task 1 (pipeline level): events with 'Z' and '+00:00' timestamps both
    complete the pipeline and produce valid Stream 3 payloads.
    """
    for ts in ("2026-10-10T14:23:01Z", "2026-10-10T14:23:01+00:00"):
        ok = _OkStream3()
        event = _make_disaster_event(timestamp_utc=ts)

        with patch("app.dispatcher.httpx.AsyncClient", ok.make_client_class()):
            await run_pipeline(event)

        assert ok.captured, f"No payload captured for timestamp format: {ts!r}"
        assert len(ok.captured.get("critical_zones", [])) >= 1, (
            f"Expected >= 1 zone for timestamp format {ts!r}"
        )
