import pytest
from app.authenticity.message_verifier import analyze_message


def test_genuine_emergency_message():
    text = "Water level rising fast, 4 feet deep inside living room. 3 family members trapped on terrace near city hospital."
    res = analyze_message(text=text, emergency_type="flood", people_count=3)
    assert res["verdict"] in ("GENUINE_EMERGENCY", "PROBABLE_GENUINE")
    assert res["authenticity_score"] >= 60
    assert res["is_genuine"] is True
    assert res["urgency"] in ("HIGH", "CRITICAL")


def test_ai_generated_synthetic_message():
    text = "In this unprecedented and perilous hour of calamity, we urgently implore the authorities to mobilize relief resources as the tumultuous deluge surges forward."
    res = analyze_message(text=text, emergency_type="flood")
    assert res["verdict"] in ("AI_GENERATED", "SUSPICIOUS_UNVERIFIED")
    assert res["authenticity_score"] < 50
    assert any("AI" in s["name"] for s in res["signals"])


def test_prank_or_hoax_message():
    text = "lol test 123 godzilla is attacking the building just kidding"
    res = analyze_message(text=text, emergency_type="earthquake")
    assert res["verdict"] == "PROBABLE_HOAX"
    assert res["authenticity_score"] <= 35
    assert res["is_genuine"] is False


def test_short_invalid_message():
    res = analyze_message(text="help")
    assert res["verdict"] == "SUSPICIOUS_UNVERIFIED"
    assert res["authenticity_score"] <= 30
