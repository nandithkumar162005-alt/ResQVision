"""
AI Message Genuineness and Distress Verification Engine.
Analyzes emergency text reports, citizen SOS distress claims, and disaster descriptions
to determine whether they are genuine, AI-generated, pranks, or conflicting with physical reality.
"""
from __future__ import annotations

import re
from datetime import date
from typing import Optional
from app.authenticity import context as _ctx

# Clichés and formal stylistic patterns typical of AI-generated distress text (e.g. ChatGPT, LLMs)
AI_MARKERS = [
    r"\bin this (?:unprecedented|perilous|critical|dire) (?:hour|juncture|moment)\b",
    r"\bit is (?:of the utmost importance|imperative|crucial) that\b",
    r"\bas an affected citizen\b",
    r"\bthe (?:tumultuous|raging|unrelenting) (?:deluge|maelstrom|tempest|elements)\b",
    r"\bsituation remains (?:fraught with|deeply concerning|grim)\b",
    r"\bwe urgently implore the authorities\b",
    r"\bharrowing (?:plight|scenario|spectacle)\b",
    r"\bprompt mobilization of (?:humanitarian|relief) resources\b",
    r"\bfurthermore|moreover|in conclusion|notwithstanding\b",
    r"\bwe are experiencing what can only be described as\b",
]

# Prank, joke, or test keywords
PRANK_MARKERS = [
    r"\blol\b|\brofl\b|\blmao\b|\bjust kidding\b|\bjk\b|\bprank\b|\bsike\b",
    r"\btest(?:ing)?\s*(?:123|test)?\b",
    r"\basdf[a-z]*\b|\bqwert[a-z]*\b",
    r"\balien(?:s)?\b|\bufo\b|\bzombie(?:s)?\b|\bgodzilla\b|\billuminati\b",
    r"\bnuke|nuclear explosion\b",
]

# Natural human emergency markers (immediacy, physical details, emotional distress, family/vulnerabilities)
GENUINE_DISTRESS_MARKERS = [
    r"\bwater (?:level|inside|entered|rising|up to|neck|waist|chest|knee|roof)\b",
    r"\btrapped|stranded|stuck|cannot get out|no way out\b",
    r"\bchild(?:ren)?|baby|infant|elderly|old (?:people|parents|mother|father)|grand(?:mother|father)\b",
    r"\bdiabetic|insulin|heart patient|oxygen|wheelchair|pregnant|sick\b",
    r"\bpower (?:cut|out|off)|electricity gone|no lights|dark\b",
    r"\broof|terrace|first floor|second floor|balcony\b",
    r"\bfood|drinking water|milk|batteries|flashlight\b",
    r"\bwall collapsed|cracks in ceiling|house shaking|debris|rubble\b",
    r"\bhelp us|please hurry|send boat|sos|rescue\b",
    r"\bnear (?:temple|mosque|church|school|hospital|petrol pump|station|bridge|market)\b",
]


def analyze_message(
    text: str,
    emergency_type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    location_text: Optional[str] = None,
    people_count: Optional[int] = None,
    taken_at_date: Optional[date] = None,
) -> dict:
    """
    Evaluates message sincerity, style, plausibility, and physical environmental correlation.
    """
    if not text or len(text.strip()) < 5:
        return {
            "verdict": "SUSPICIOUS_UNVERIFIED",
            "authenticity_score": 20,
            "confidence": "high",
            "is_genuine": False,
            "label": "Insufficient Text / Empty Message",
            "reasons": ["Message is too short to establish emergency veracity."],
            "signals": [],
            "urgency": "LOW",
            "summary": "Message lacks actionable details or emergency description."
        }

    raw = text.strip()
    lower = raw.lower()
    signals = []
    score = 70.0  # baseline neutral starting score

    # 1. Prank / Test / Spam Heuristics
    prank_hits = []
    for pattern in PRANK_MARKERS:
        m = re.findall(pattern, lower, re.IGNORECASE)
        if m:
            prank_hits.extend(m)
    if prank_hits:
        score -= 55.0
        signals.append({
            "name": "Prank or Test Language",
            "impact": "critical_negative",
            "detail": f"Contains suspicious keywords or test tokens: {', '.join(prank_hits[:3])}"
        })

    # 2. Synthetic / AI-Generated Stylistic Markers
    ai_hits = []
    for pattern in AI_MARKERS:
        m = re.findall(pattern, lower, re.IGNORECASE)
        if m:
            ai_hits.extend(m)
    if ai_hits:
        penalty = min(40.0, len(ai_hits) * 15.0)
        score -= penalty
        signals.append({
            "name": "Synthetic / AI Text Patterns",
            "impact": "high_negative",
            "detail": f"Contains formal AI-style phrasing uncharacteristic of urgent human distress: {len(ai_hits)} stylistic match(es)."
        })

    # Check for Markdown bullet structure often output by LLMs
    if bool(re.search(r"^\s*[-*•]\s+", raw, re.MULTILINE)):
        score -= 15.0
        signals.append({
            "name": "Structured Formatting",
            "impact": "negative",
            "detail": "Message contains structured bulleted points typical of LLM output rather than quick human distress typing."
        })

    # 3. Genuine Distress & Grounded Detail Markers
    genuine_hits = []
    for pattern in GENUINE_DISTRESS_MARKERS:
        m = re.findall(pattern, lower, re.IGNORECASE)
        if m:
            genuine_hits.extend(m)
    if genuine_hits:
        boost = min(25.0, len(genuine_hits) * 5.0)
        score += boost
        signals.append({
            "name": "Urgent Situational Details",
            "impact": "positive",
            "detail": f"Contains authentic emergency distress markers ({len(genuine_hits)} cues): vulnerability, location, or immediate hazards."
        })

    # 4. Plausibility / Numbers check
    if people_count is not None:
        if people_count > 300 and ("family" in lower or "my house" in lower or "apartment" in lower):
            score -= 20.0
            signals.append({
                "name": "Disproportionate Claim",
                "impact": "negative",
                "detail": f"Claimed {people_count} individuals stranded in a residential location."
            })
        elif 1 <= people_count <= 20:
            score += 5.0
            signals.append({
                "name": "Realistic Group Size",
                "impact": "positive",
                "detail": f"Reported group size ({people_count} persons) fits normal household/neighborhood cluster."
            })

    # 5. Environmental & Meteorologic Cross-Check
    weather_info = None
    quake_info = None
    if lat is not None and lng is not None:
        check_day = taken_at_date or date.today()
        # Weather check
        try:
            w = _ctx.weather_for(lat, lng, check_day)
            rain = w.get("rain_3day_mm") or 0.0
            gust = w.get("gust_max_kmh") or 0.0
            weather_info = {
                "rain_3day_mm": rain,
                "gust_max_kmh": gust,
                "location": f"{lat:.2f}, {lng:.2f}"
            }
            if emergency_type and "flood" in emergency_type.lower():
                if rain >= 40.0:
                    score += 15.0
                    signals.append({
                        "name": "Meteorological Corroboration",
                        "impact": "strong_positive",
                        "detail": f"Live Open-Meteo confirms {rain}mm rainfall over recent days, strongly supporting a flood event."
                    })
                elif rain < 2.0:
                    score -= 25.0
                    signals.append({
                        "name": "Weather Inconsistency",
                        "impact": "strong_negative",
                        "detail": f"Open-Meteo recorded zero significant rainfall ({rain}mm) at these coordinates recently."
                    })
            elif emergency_type and "cyclone" in emergency_type.lower() or "storm" in (emergency_type or "").lower():
                if gust >= 50.0:
                    score += 15.0
                    signals.append({
                        "name": "Wind Speed Corroboration",
                        "impact": "strong_positive",
                        "detail": f"Live Open-Meteo confirms heavy wind gusts of {gust} km/h."
                    })
                else:
                    score -= 15.0
                    signals.append({
                        "name": "Calm Weather Anomaly",
                        "impact": "negative",
                        "detail": f"Open-Meteo recorded calm conditions (max gust {gust} km/h)."
                    })
        except Exception:
            weather_info = {"status": "Service unavailable"}

        # Earthquake check
        if emergency_type and "earthquake" in emergency_type.lower():
            try:
                quakes = _ctx.quakes_near(lat, lng, check_day)
                if quakes:
                    top = quakes[0]
                    score += 20.0
                    signals.append({
                        "name": "Seismic Corroboration",
                        "impact": "strong_positive",
                        "detail": f"USGS seismic monitor confirms M{top['mag']} earthquake {top['distance_km']} km away."
                    })
                else:
                    score -= 30.0
                    signals.append({
                        "name": "No Seismic Activity",
                        "impact": "critical_negative",
                        "detail": "USGS global earthquake feed confirms no recorded seismic event in this region."
                    })
            except Exception:
                pass

    # Normalize score
    final_score = int(round(max(0.0, min(100.0, score))))

    # Determine Verdict
    if len(ai_hits) >= 2 and final_score < 50:
        verdict = "AI_GENERATED"
        label = "Likely AI-Generated Synthetic Distress Text"
        conf = "high"
    elif prank_hits or final_score < 35:
        verdict = "PROBABLE_HOAX"
        label = "High Risk: Probable Hoax or Prank Report"
        conf = "high" if prank_hits else "medium"
    elif final_score >= 75:
        verdict = "GENUINE_EMERGENCY"
        label = "Verified Genuine Distress Message"
        conf = "high"
    elif final_score >= 55:
        verdict = "PROBABLE_GENUINE"
        label = "Plausible Emergency Distress Message"
        conf = "medium"
    else:
        verdict = "SUSPICIOUS_UNVERIFIED"
        label = "Suspicious: Inconsistencies Detected"
        conf = "medium"

    # Urgency determination
    urgency = "HIGH"
    if verdict in ("PROBABLE_HOAX", "AI_GENERATED"):
        urgency = "LOW"
    elif any("critical" in s.get("detail", "").lower() for s in signals) or (people_count and people_count >= 10):
        urgency = "CRITICAL"
    elif final_score >= 70:
        urgency = "HIGH"
    else:
        urgency = "MEDIUM"

    reasons = [s["detail"] for s in signals if s["impact"] in ("critical_negative", "strong_positive", "high_negative", "strong_negative")]
    if not reasons:
        reasons = [s["detail"] for s in signals[:3]]

    summary = (
        f"{label} (Authenticity score: {final_score}%). "
        + ("Ground environmental data supports this claim. " if final_score >= 70 else "Officer should exercise caution and verify coordinates before dispatch.")
    )

    return {
        "verdict": verdict,
        "authenticity_score": final_score,
        "is_genuine": final_score >= 55,
        "confidence": conf,
        "urgency": urgency,
        "label": label,
        "reasons": reasons,
        "signals": signals,
        "environmental_data": {
            "weather": weather_info,
            "earthquake": quake_info
        },
        "summary": summary,
        "disclaimer": "AI text credibility evaluation is a decision support tool and should be used alongside field officer dispatch protocol."
    }
