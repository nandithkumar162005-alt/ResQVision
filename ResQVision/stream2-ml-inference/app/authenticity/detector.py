"""Combines metadata, pixel-forensics and (optional) model signals into one verdict."""
from __future__ import annotations

import io
from dataclasses import dataclass, field, asdict

from PIL import Image

from app.authenticity import forensics, model_layer

DISCLAIMER = ("Indicative result, not proof. Metadata can be stripped or faked and pixel statistics are weaker on "
              "small or heavily compressed images. Treat 'uncertain' as: get a human to verify, and use NDRF "
              "ground confirmation before dispatch.")
MAX_BYTES = 15 * 1024 * 1024


@dataclass
class AuthenticityReport:
    verdict: str                  # AI_GENERATED | LIKELY_AI | UNCERTAIN | LIKELY_REAL
    label: str                    # human-readable
    ai_probability: int           # 0..100
    confidence: str               # high | medium | low
    reasons: list = field(default_factory=list)
    signals: list = field(default_factory=list)
    methods_used: list = field(default_factory=list)
    image: dict = field(default_factory=dict)
    disclaimer: str = DISCLAIMER

    def to_dict(self) -> dict:
        return asdict(self)


def analyze_image(raw: bytes) -> AuthenticityReport:
    if not raw:
        raise ValueError("Empty file.")
    if len(raw) > MAX_BYTES:
        raise ValueError("Image is larger than 15 MB.")
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:
        raise ValueError("Could not read this file as an image.") from exc

    fmt = img.format or "unknown"
    meta_sigs, facts = forensics.metadata_signals(raw, img)
    sigs = list(meta_sigs)
    sigs.append(forensics.noise_signal(img))
    sigs.append(forensics.spectrum_signal(img))
    ela = forensics.ela_signal(raw, img)
    tamper = [ela] if ela else []
    model_sig = model_layer.classify(raw)
    if model_sig:
        sigs.append(model_sig)

    scored = [s for s in sigs if s["ai_score"] is not None and s["weight"] > 0]
    # A clean edit check is not evidence about AI generation, so only metadata/pixel/model signals count here.
    total_w = sum(s["weight"] for s in scored) or 1.0
    prob = sum(s["ai_score"] * s["weight"] for s in scored) / total_w

    if facts["declared_ai"]:
        prob = max(prob, 0.97)
        verdict, label, conf = "AI_GENERATED", "AI-generated (declared in the file's own metadata)", "high"
    else:
        if facts["camera_evidence"]:
            prob = min(prob, 0.45)  # camera metadata caps the pixel-only score, but cannot make it certain
        strong = bool(model_sig) or facts["camera_evidence"]   # evidence that is more than weak pixel hints
        if prob >= 0.65 and strong:
            verdict, label = "LIKELY_AI", "Likely AI-generated"
        elif prob < 0.42 and strong:
            verdict, label = "LIKELY_REAL", "Likely a real photograph"
        else:
            verdict, label = "UNCERTAIN", "Cannot tell - needs human review"
        conf = "medium" if model_sig else "low"
        if abs(prob - 0.5) > 0.3 and model_sig:
            conf = "high"

    reasons = [s["detail"] for s in sorted(scored, key=lambda s: -abs(s["ai_score"] - 0.5) * s["weight"])[:4]]

    all_sigs = [{"name": s["name"], "kind": s["kind"], "ai_score": s["ai_score"], "detail": s["detail"]}
                for s in sigs + tamper]
    methods = ["File metadata / C2PA / EXIF", "Sensor-noise analysis (weak)",
               "Frequency-spectrum analysis (experimental, not scored)"]
    if ela:
        methods.append("Edit/splice check (ELA, experimental, not scored)")
    methods.append("Pretrained AI-image classifier" if model_sig else
                   "Pretrained classifier: not installed or model not downloaded (forensics only)")
    return AuthenticityReport(
        verdict=verdict, label=label, ai_probability=int(round(prob * 100)), confidence=conf,
        reasons=reasons, signals=all_sigs, methods_used=methods,
        image={"format": fmt, "width": img.width, "height": img.height, "size_kb": round(len(raw) / 1024, 1)},
    )
