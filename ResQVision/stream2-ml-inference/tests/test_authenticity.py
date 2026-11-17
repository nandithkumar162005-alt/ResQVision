"""Tests for the image authenticity checker (offline, no model download needed)."""
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from PIL.PngImagePlugin import PngInfo

from app.authenticity import analyze_image
from app.main import app


def _noise_jpeg(exif: bool = False) -> bytes:
    import numpy as np
    rng = np.random.default_rng(1)
    arr = (rng.normal(128, 40, (300, 400, 3))).clip(0, 255).astype("uint8")
    im = Image.fromarray(arr)
    buf = io.BytesIO()
    if exif:
        ex = Image.Exif()
        ex[271] = "Canon"; ex[272] = "EOS 5D"; ex[0x8769] = {33434: (1, 250), 33437: (2.8,), 34855: 200}
        im.save(buf, "JPEG", exif=ex)
    else:
        im.save(buf, "JPEG")
    return buf.getvalue()


def _png(text: dict | None = None) -> bytes:
    im = Image.new("RGB", (512, 512), (90, 120, 200))
    info = PngInfo()
    for k, v in (text or {}).items():
        info.add_text(k, v)
    buf = io.BytesIO(); im.save(buf, "PNG", pnginfo=info)
    return buf.getvalue()


def test_png_with_stable_diffusion_chunk_is_declared_ai():
    r = analyze_image(_png({"parameters": "a flooded city, Steps: 20, Sampler: Euler, Model: stable diffusion"}))
    assert r.verdict == "AI_GENERATED" and r.ai_probability >= 90 and r.confidence == "high"


def test_plain_png_is_not_declared_ai_and_not_overconfident():
    r = analyze_image(_png())
    assert r.verdict == "UNCERTAIN"          # no model + no camera data -> never claims certainty from pixels


def test_camera_exif_marks_likely_real():
    r = analyze_image(_noise_jpeg(exif=True))
    assert r.verdict == "LIKELY_REAL" and r.ai_probability < 50


def test_random_bytes_in_pixels_do_not_trigger_ai_marker():
    # compressed pixel data must never be searched for generator names
    from app.authenticity.forensics import metadata_text
    raw = _noise_jpeg() + b"midjourney flux imagen"        # appended after the image end
    assert "midjourney" not in metadata_text(raw)


def test_corrupt_and_empty_files_rejected():
    with pytest.raises(ValueError):
        analyze_image(b"")
    with pytest.raises(ValueError):
        analyze_image(b"not an image at all")


def test_api_endpoint_returns_report_and_rejects_garbage():
    c = TestClient(app)
    ok = c.post("/verify-image", files={"file": ("a.png", _png({"prompt": "midjourney"}), "image/png")})
    assert ok.status_code == 200 and ok.json()["data"]["verdict"] == "AI_GENERATED"
    assert "disclaimer" in ok.json()["data"]
    bad = c.post("/verify-image", files={"file": ("a.txt", b"hello", "text/plain")})
    assert bad.status_code == 422


def test_cors_header_present_for_dashboard():
    c = TestClient(app)
    r = c.options("/verify-image", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") in ("*", "http://localhost:5173")


# ---------------- context check (weather / earthquake cross-check) ----------------
from datetime import date, timedelta

from app.authenticity import context as ctxmod


def _fake_fetch(rain, quakes=()):
    def f(url, params):
        if "usgs" in url:
            return {"features": [{"properties": {"mag": m, "place": "test", "time": 1_700_000_000_000},
                                  "geometry": {"coordinates": [lng, lat, 10]}} for (m, lat, lng) in quakes]}
        return {"daily": {"precipitation_sum": rain, "wind_gusts_10m_max": [20, 25, 30]}}
    return f


def _plain():
    return Image.new("RGB", (64, 64), (10, 20, 30))


def test_flood_claim_supported_by_heavy_rain():
    d = (date.today() - timedelta(days=3)).isoformat()
    r = ctxmod.build_context(_plain(), {"lat": 17.4, "lng": 78.5, "taken_at": d, "claimed_type": "flood"},
                             _fake_fetch([20, 40, 15]))
    assert r["overall"] == "SUPPORTED"


def test_flood_claim_rejected_when_dry():
    d = (date.today() - timedelta(days=3)).isoformat()
    r = ctxmod.build_context(_plain(), {"lat": 17.4, "lng": 78.5, "taken_at": d, "claimed_type": "flood"},
                             _fake_fetch([0, 1, 0]))
    assert r["overall"] == "NOT_SUPPORTED"


def test_earthquake_claim_needs_a_real_quake():
    d = (date.today() - timedelta(days=3)).isoformat()
    base = {"lat": 19.0, "lng": 72.8, "taken_at": d, "claimed_type": "earthquake"}
    assert ctxmod.build_context(_plain(), base, _fake_fetch([0, 0, 0]))["overall"] == "NOT_SUPPORTED"
    assert ctxmod.build_context(_plain(), base, _fake_fetch([0, 0, 0], [(5.1, 19.2, 72.9)]))["overall"] == "SUPPORTED"


def test_no_place_or_time_means_insufficient_data():
    r = ctxmod.build_context(_plain(), {})
    assert r["overall"] == "INSUFFICIENT_DATA"


def test_network_failure_is_reported_not_guessed():
    def boom(url, params):
        raise RuntimeError("offline")
    d = (date.today() - timedelta(days=3)).isoformat()
    r = ctxmod.build_context(_plain(), {"lat": 17.4, "lng": 78.5, "taken_at": d, "claimed_type": "flood"}, boom)
    assert r["overall"] == "INSUFFICIENT_DATA"
    assert any(c["status"] == "unavailable" for c in r["checks"])


def test_gps_far_from_claim_fails():
    im = Image.new("RGB", (64, 64))
    ex = Image.Exif()
    ex[0x8825] = {1: "N", 2: (28.0, 36.0, 0.0), 3: "E", 4: (77.0, 12.0, 0.0)}   # Delhi
    buf = io.BytesIO(); im.save(buf, "JPEG", exif=ex)
    img = Image.open(io.BytesIO(buf.getvalue()))
    d = (date.today() - timedelta(days=3)).isoformat()
    r = ctxmod.build_context(img, {"lat": 17.4, "lng": 78.5, "taken_at": d, "claimed_type": "flood"}, _fake_fetch([50, 50, 50]))
    assert r["overall"] == "NOT_SUPPORTED" and any(c["id"] == "loc" and c["status"] == "fail" for c in r["checks"])


def test_endpoint_returns_context_and_summary():
    c = TestClient(app)
    r = c.post("/verify-image", files={"file": ("a.jpg", _noise_jpeg(True), "image/jpeg")})
    assert r.status_code == 200
    data = r.json()["data"]
    assert "context" in data and "summary" in data and data["summary"]["level"] in ("red", "amber", "green", "grey")
