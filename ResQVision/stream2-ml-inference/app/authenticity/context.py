"""Context check: does the photo's own data (EXIF GPS / time) and the user's claim (where, when, what)
match real public data (Open-Meteo weather, USGS earthquakes)?

This cannot prove a photo is genuine. It answers a narrower, honest question:
"is this claim physically plausible for that place and day, according to public records?"
"""
from __future__ import annotations

import math
import os
from datetime import date, datetime, timedelta, timezone
from typing import Callable, Optional

import httpx
from PIL import Image

# Overridable only so tests can point at a local stand-in; defaults are the real public services.
FORECAST_URL = os.getenv("OPEN_METEO_FORECAST_URL", "https://api.open-meteo.com/v1/forecast")
ARCHIVE_URL = os.getenv("OPEN_METEO_ARCHIVE_URL", "https://archive-api.open-meteo.com/v1/archive")
USGS_URL = os.getenv("USGS_QUERY_URL", "https://earthquake.usgs.gov/fdsnws/event/1/query")
EDITORS = ("photoshop", "gimp", "canva", "lightroom", "snapseed", "pixlr", "affinity", "picsart", "facetune")

FloodMM = 50.0   # same rainfall threshold the ingestion stream uses for "extreme rainfall"


def _http_json(url: str, params: dict) -> dict:
    r = httpx.get(url, params=params, timeout=8.0)
    r.raise_for_status()
    return r.json()


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(a))


def _dms(v, ref):
    d, m, s = (float(x) for x in v)
    out = d + m / 60 + s / 3600
    return -out if ref in ("S", "W") else out


def exif_facts(img: Image.Image) -> dict:
    """Camera make/model, editing software, capture time and GPS, if the file still has them."""
    out = {"make": None, "model": None, "software": None, "taken_at": None, "gps": None}
    try:
        ex = img.getexif()
    except Exception:
        return out
    out["make"], out["model"], out["software"] = ex.get(271), ex.get(272), ex.get(305)
    raw_dt = None
    try:
        raw_dt = ex.get_ifd(0x8769).get(36867) or ex.get(306)
    except Exception:
        raw_dt = ex.get(306)
    if raw_dt:
        try:
            out["taken_at"] = datetime.strptime(str(raw_dt).strip()[:19], "%Y:%m:%d %H:%M:%S")
        except ValueError:
            pass
    try:
        g = ex.get_ifd(0x8825)
        if g.get(2) and g.get(4):
            out["gps"] = (_dms(g[2], g.get(1, "N")), _dms(g[4], g.get(3, "E")))
    except Exception:
        pass
    return out


def _check(cid, title, status, detail):
    return {"id": cid, "title": title, "status": status, "detail": detail}


def _parse_when(v) -> Optional[datetime]:
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    s = str(v).strip().replace("Z", "")
    for f in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, f)
        except ValueError:
            continue
    return None


def weather_for(lat: float, lng: float, day: date, fetch: Callable = _http_json) -> dict:
    start, end = day - timedelta(days=2), day
    use_forecast = (date.today() - day).days <= 80
    url = FORECAST_URL if use_forecast else ARCHIVE_URL
    data = fetch(url, {"latitude": lat, "longitude": lng, "start_date": start.isoformat(),
                       "end_date": end.isoformat(), "daily": "precipitation_sum,wind_gusts_10m_max",
                       "timezone": "auto"})
    d = data.get("daily") or {}
    rain = [x for x in (d.get("precipitation_sum") or []) if x is not None]
    gust = [x for x in (d.get("wind_gusts_10m_max") or []) if x is not None]
    if not rain and not gust:
        raise ValueError("no daily values returned")
    return {"rain_max_day_mm": max(rain) if rain else None, "rain_3day_mm": round(sum(rain), 1) if rain else None,
            "gust_max_kmh": max(gust) if gust else None, "from": start.isoformat(), "to": end.isoformat()}


def quakes_near(lat: float, lng: float, day: date, fetch: Callable = _http_json, radius_km: int = 300) -> list:
    data = fetch(USGS_URL, {"format": "geojson", "starttime": (day - timedelta(days=1)).isoformat(),
                            "endtime": (day + timedelta(days=2)).isoformat(), "latitude": lat, "longitude": lng,
                            "maxradiuskm": radius_km, "minmagnitude": 3.0, "orderby": "magnitude", "limit": 5})
    out = []
    for f in data.get("features", []):
        p, c = f.get("properties", {}), f.get("geometry", {}).get("coordinates", [None, None])
        if c[0] is None:
            continue
        out.append({"mag": p.get("mag"), "place": p.get("place"),
                    "time": datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                    "distance_km": round(haversine_km(lat, lng, c[1], c[0]))})
    return out


def build_context(img: Image.Image, claim: dict, fetch: Callable = _http_json) -> dict:
    """claim keys (all optional): lat, lng, taken_at, claimed_type (flood|earthquake|storm|other)."""
    ex = exif_facts(img)
    checks: list = []
    ctype = (claim.get("claimed_type") or "").lower() or None
    clat, clng = claim.get("lat"), claim.get("lng")
    claim_loc = (float(clat), float(clng)) if clat not in (None, "") and clng not in (None, "") else None
    claim_when = _parse_when(claim.get("taken_at"))

    # 1. what the file itself says
    cam = " ".join(x for x in (str(ex["make"] or "").strip(), str(ex["model"] or "").strip()) if x)
    sw = str(ex["software"] or "")
    if any(e in sw.lower() for e in EDITORS):
        checks.append(_check("edit", "Editing software", "warn", f"File was last saved by '{sw}'. The picture may have been edited."))
    elif cam:
        checks.append(_check("camera", "Camera information", "info", f"File says it was taken with {cam}."))
    else:
        checks.append(_check("camera", "Camera information", "info", "No camera make/model in the file (common for screenshots, messaging apps and AI images)."))

    # 2. place and time to use
    loc, loc_src = (claim_loc, "your entered location") if claim_loc else ((ex["gps"], "the photo's GPS tag") if ex["gps"] else (None, None))
    when, when_src = (claim_when, "your entered date") if claim_when else ((ex["taken_at"], "the photo's capture time") if ex["taken_at"] else (None, None))

    if claim_loc and ex["gps"]:
        d = haversine_km(*claim_loc, *ex["gps"])
        checks.append(_check("loc", "Location match", "pass" if d <= 50 else "fail",
                             f"Photo GPS is {d:.0f} km from the location you entered." + ("" if d <= 50 else " The photo was not taken where it is claimed.")))
    elif ex["gps"] and not claim_loc:
        checks.append(_check("loc", "Location in file", "info", f"Photo carries GPS {ex['gps'][0]:.4f}, {ex['gps'][1]:.4f}."))
    if claim_when and ex["taken_at"]:
        gap = abs((claim_when.date() - ex["taken_at"].date()).days)
        checks.append(_check("date", "Date match", "pass" if gap <= 1 else "fail",
                             f"Photo was captured on {ex['taken_at'].date()}, {gap} day(s) from the date you entered."))
    elif ex["taken_at"] and not claim_when:
        checks.append(_check("date", "Date in file", "info", f"Photo says it was captured on {ex['taken_at']:%Y-%m-%d %H:%M}."))
    if when and when.date() > date.today() + timedelta(days=1):
        checks.append(_check("future", "Date sanity", "fail", "The date is in the future."))

    # 3. public data cross-check
    day = when.date() if when else None
    if not (loc and day):
        checks.append(_check("need", "Weather / earthquake cross-check", "unavailable",
                             "Needs a location and a date. This photo has no GPS/time, so enter where and when it was taken to check it against public records."))
    else:
        try:
            w = weather_for(*loc, day, fetch)
            rain, gust = w["rain_3day_mm"], w["gust_max_kmh"]
            txt = f"Open-Meteo, {w['from']} to {w['to']} near {loc[0]:.2f}, {loc[1]:.2f} (from {loc_src}): rain {rain} mm over 3 days (max {w['rain_max_day_mm']} mm in a day), strongest gust {gust} km/h."
            if ctype == "flood":
                st = "pass" if (rain or 0) >= FloodMM else "warn" if (rain or 0) >= 20 else "fail"
                note = {"pass": " Heavy rain is recorded, so a flood is plausible.",
                        "warn": " Moderate rain only; a flood is possible but not strongly supported.",
                        "fail": " No heavy rain recorded locally. A flood here is not supported (river or dam floods can come from rain upstream)."}[st]
                checks.append(_check("weather", "Weather supports the claim", st, txt + note))
            elif ctype == "storm":
                st = "pass" if (gust or 0) >= 60 or (rain or 0) >= 50 else "fail"
                checks.append(_check("weather", "Weather supports the claim", st, txt + (" Strong wind or heavy rain recorded." if st == "pass" else " No storm-level wind or rain recorded.")))
            else:
                checks.append(_check("weather", "Weather on that day", "info", txt))
        except Exception as exc:
            checks.append(_check("weather", "Weather cross-check", "unavailable", f"Could not reach Open-Meteo ({type(exc).__name__}). Check the internet connection."))
        try:
            q = quakes_near(*loc, day, fetch)
            if q:
                top = q[0]
                txt = f"USGS: M{top['mag']} {top['place']} at {top['time']}, {top['distance_km']} km away" + (f" (+{len(q)-1} more)." if len(q) > 1 else ".")
                checks.append(_check("quake", "Earthquake records", "pass" if ctype == "earthquake" else "info", txt))
            else:
                txt = f"USGS shows no earthquake of M3.0+ within 300 km between {day - timedelta(days=1)} and {day + timedelta(days=2)}."
                checks.append(_check("quake", "Earthquake records", "fail" if ctype == "earthquake" else "info",
                                     txt + (" An earthquake claim is not supported." if ctype == "earthquake" else "")))
        except Exception as exc:
            checks.append(_check("quake", "Earthquake cross-check", "unavailable", f"Could not reach USGS ({type(exc).__name__}). Check the internet connection."))

    fails = [c for c in checks if c["status"] == "fail"]
    passes = [c for c in checks if c["status"] == "pass"]
    if fails:
        overall, label = "NOT_SUPPORTED", "Claim is NOT supported by the data"
    elif passes:
        overall, label = "SUPPORTED", "Claim is consistent with public records"
    else:
        overall, label = "INSUFFICIENT_DATA", "Not enough data to cross-check"
    return {"overall": overall, "label": label, "checks": checks,
            "used": {"location": list(loc) if loc else None, "location_source": loc_src,
                     "date": day.isoformat() if day else None, "date_source": when_src, "claimed_type": ctype},
            "note": "Weather and earthquake records can show a claim is implausible or consistent. They can never prove a photo is genuine."}


def combine(auth: dict, ctx: dict) -> dict:
    """One plain-language bottom line from the authenticity verdict and the context check."""
    v, o = auth["verdict"], ctx["overall"]
    if v == "AI_GENERATED":
        level, head = "red", "Do not trust this image: the file itself says it is AI-generated."
    elif o == "NOT_SUPPORTED" and v in ("LIKELY_AI", "UNCERTAIN"):
        level, head = "red", "Treat as unverified: image authenticity is uncertain and the claim is not supported by public data."
    elif o == "NOT_SUPPORTED":
        level, head = "amber", "Image may be real, but the claim does not match public data. Ask for ground verification."
    elif v == "LIKELY_AI":
        level, head = "amber", "Likely AI-generated. Do not use as evidence without ground verification."
    elif v == "LIKELY_REAL" and o == "SUPPORTED":
        level, head = "green", "Looks like a real photo and the claim is consistent with public data. Still confirm on the ground."
    elif o == "SUPPORTED":
        level, head = "amber", "Claim is consistent with public data, but image authenticity could not be confirmed."
    else:
        level, head = "grey", "Cannot tell. Needs human review and NDRF ground confirmation."
    return {"level": level, "headline": head,
            "next_step": "Use NDRF ground confirmation before any dispatch. This tool gives evidence, not proof."}
