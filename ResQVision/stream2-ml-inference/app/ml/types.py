"""
app/ml/types.py — Shared dataclasses for the ML inference pipeline.

These types are intentionally kept in a zero-dependency module so that
zone_clustering.py, population_overlay.py, mock_infer.py, and the test
suite can import DamagePoint and InferenceResult without triggering the
heavy torch / PIL / segmentation_models_pytorch import chain inside infer.py.

Import from here whenever you only need the data structures, not the real
inference logic.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class DamagePoint:
    """
    A single geographical point with predicted damage classification and confidence.

    Produced by both the real inference path (infer.py) and the mock path
    (mock_infer.py). Consumed directly by zone_clustering.py and
    population_overlay.py.

    Attributes:
        lat:          Latitude in decimal degrees (-90 to 90).
        lng:          Longitude in decimal degrees (-180 to 180).
        damage_class: One of 'no_damage', 'minor_damage', 'major_damage', 'destroyed'.
        confidence:   Softmax probability of the predicted class (0.0–1.0).
    """

    lat: float
    lng: float
    damage_class: str  # InternalDamageClass
    confidence: float  # 0.0–1.0


@dataclass
class InferenceResult:
    """
    Output payload produced by either the real or mock inference pipeline.

    Both infer.py (real mode) and mock_infer.py (mock mode) return this same
    type, so all downstream code (zone_clustering, population_overlay,
    main.py pipeline) is pipeline-mode agnostic.

    Attributes:
        damage_points: Georeferenced damage assessment points.
        damage_score:  Overall severity score 0–100 (int).
        pixel_counts:  Per-class counts {'no_damage': N, 'minor_damage': N, ...}.
        model_mode:    'real' or 'mock' — for logging and audit trail.
    """

    damage_points: list[DamagePoint]
    damage_score: int  # 0–100
    pixel_counts: dict[str, int]
    model_mode: str = "real"
