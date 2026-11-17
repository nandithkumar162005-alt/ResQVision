"""
Optional pretrained-classifier layer.

If `torch` + `transformers` are installed AND the model can be downloaded from Hugging Face, an
image-classification model trained on real vs AI-generated images is added to the verdict.
If not, this layer is silently skipped and the forensic signals still work offline.

Set AUTHENTICITY_HF_MODEL to change the model (default below). Set AUTHENTICITY_USE_MODEL=false to disable.
"""
from __future__ import annotations

import io
import os

from PIL import Image

_PIPE = None
_FAILED = False
DEFAULT_MODEL = "umm-maybe/AI-image-detector"
AI_WORDS = ("artificial", "ai", "fake", "generated", "synthetic")


def available() -> bool:
    return _PIPE is not None


def _load():
    global _PIPE, _FAILED
    if _PIPE is not None or _FAILED:
        return _PIPE
    if os.getenv("AUTHENTICITY_USE_MODEL", "true").lower() in ("0", "false", "no"):
        _FAILED = True
        return None
    try:
        from transformers import pipeline  # noqa: WPS433

        _PIPE = pipeline("image-classification", model=os.getenv("AUTHENTICITY_HF_MODEL", DEFAULT_MODEL))
    except Exception:
        _FAILED = True
    return _PIPE


def classify(raw: bytes) -> dict | None:
    """Returns a signal dict, or None if no model is available."""
    pipe = _load()
    if pipe is None:
        return None
    try:
        preds = pipe(Image.open(io.BytesIO(raw)).convert("RGB"))
        ai = 0.0
        for p in preds:
            if any(w == str(p["label"]).lower() or w in str(p["label"]).lower() for w in AI_WORDS) and \
               not str(p["label"]).lower().startswith(("human", "real", "natural")):
                ai = max(ai, float(p["score"]))
        if ai == 0.0 and preds:  # model only returned the "real" class
            ai = 1.0 - max(float(p["score"]) for p in preds)
        return {"name": "Pretrained AI-image classifier", "ai_score": ai, "weight": 3.0, "kind": "model",
                "detail": f"Classifier trained on real vs AI images gives {ai*100:.0f}% AI-generated."}
    except Exception:
        return None
