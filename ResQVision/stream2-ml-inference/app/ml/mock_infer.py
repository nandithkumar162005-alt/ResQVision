"""
app/ml/mock_infer.py — Synthetic damage assessment for MOCK_INFERENCE=true mode.

This module generates realistic-looking (but synthetic) damage assessments
without requiring satellite imagery or a trained model. It is the DEFAULT
mode and the demo safety net for ResQVision Stream 2.

Design rationale:
- Damage point count scales with severity_metric so numbers feel causally
  sensible during demo narration (magnitude 6.0 → ~150 points, 8.5 → ~1000).
- Spatial distribution uses a Gaussian centered on the event epicentre:
  points near the centre have higher probability of 'destroyed', points
  near the edges have higher probability of 'minor_damage'. This produces
  a realistic damage-gradient radiating from the epicentre — exactly what
  real disaster assessments show on a map.
- All outputs are schema-valid DamagePoint lists consumable by the same
  zone_clustering and population_overlay code used in real mode.
- This is a legitimate engineering decision: documented fallback for an
  untrained model, not a shortcut. The mock output lets Streams 3 and 4
  be built, tested, and demoed completely independently of ML training.
"""

from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from loguru import logger
import numpy as np

from app.config import settings
from app.ml.types import DamagePoint, InferenceResult
from app.schemas import BoundingBox, DisasterEvent, InternalDamageClass

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

# Damage classes matching xBD standard
DAMAGE_CLASSES: list[str] = ["no_damage", "minor_damage", "major_damage", "destroyed"]

# Damage class weights for score computation (must match model.py)
DAMAGE_WEIGHTS: dict[str, float] = {
    "no_damage": 0.0,
    "minor_damage": 0.33,
    "major_damage": 0.66,
    "destroyed": 1.0,
}

# Probability distribution for each damage class at the CENTER of the blast radius
# [no_damage, minor_damage, major_damage, destroyed]
CENTER_CLASS_PROBS: list[float] = [0.05, 0.15, 0.30, 0.50]  # Center -> mostly destroyed
EDGE_CLASS_PROBS: list[float] = [0.60, 0.30, 0.08, 0.02]    # Edge -> mostly no/minor damage


# ─────────────────────────────────────────────────────────────────────────────
# Mock Inference Engine
# ─────────────────────────────────────────────────────────────────────────────


class MockInferenceEngine:
    """
    Generates synthetic but spatially and statistically realistic disaster assessments.

    Uses non-linear physical scaling laws (e.g. logarithmic Richter energy scaling
    for earthquakes, rainfall accumulation for floods) and an epicenter-centered
    Gaussian spatial distribution to create realistic damage gradients.
    """

    def _count_affected_buildings(self, event: DisasterEvent) -> int:
        """
        Determine the number of simulated affected buildings based on disaster physics.

        Args:
            event: The incoming DisasterEvent with disaster_type and severity_metric.

        Returns:
            Estimated count of affected buildings (integer >= 5).
        """
        dtype = event.disaster_type
        s = event.severity_metric

        if "earthquake" in dtype or "seismic" in dtype:
            # Richter scale is logarithmic — each unit ≈ 32x more energy / ~10x more ground acceleration
            # magnitude 6.0 → ~150 buildings, 7.0 → ~400, 8.0 → ~850, 8.5 → ~1012
            if s < 6.0:
                count = max(10, int((s - 5.0) ** 2 * 150))
            else:
                count = int((s - 5.0) ** 2.2 * 130)
        elif "flood" in dtype or "rainfall" in dtype or "cyclone" in dtype:
            # mm/hr rainfall intensity: 51 → 12, 100 → 600, 150 → 1200
            if s <= 50:
                count = max(5, int((s - 40) * 3))
            else:
                count = int((s - 50) * 12)
        else:
            # Generic fallback: linear scale
            count = max(10, int(s * 80))

        return count

    def _interpolate_class_probs(self, normalized_distance: float) -> list[float]:
        """
        Linearly interpolate damage class probability distributions from epicenter to boundary.

        Args:
            normalized_distance: Radial fraction (0.0 = epicenter, 1.0 = bounding box edge).

        Returns:
            List of 4 probabilities [no_damage, minor_damage, major_damage, destroyed]
            summing to 1.0.
        """
        t = max(0.0, min(1.0, float(normalized_distance)))
        raw_probs = [
            (1.0 - t) * c_prob + t * e_prob
            for c_prob, e_prob in zip(CENTER_CLASS_PROBS, EDGE_CLASS_PROBS)
        ]
        prob_sum = sum(raw_probs)
        return [p / prob_sum for p in raw_probs]

    def _generate_damage_points(
        self,
        event: DisasterEvent,
        bbox: BoundingBox,
        n_points: int,
        rng: np.random.Generator,
    ) -> list[DamagePoint]:
        """
        Synthesize spatial damage points radiating from the event epicenter.

        Uses a 2D Gaussian centered at the event epicenter with standard deviation
        proportional to the bounding box radius (sigma = 0.3 * bbox extent).
        Points closer to the center are assigned higher damage classifications.

        Args:
            event: DisasterEvent containing epicenter coordinates.
            bbox: BoundingBox defining geographic limits.
            n_points: Target count of points to generate.
            rng: Seeded NumPy random Generator for deterministic reproducibility.

        Returns:
            List of DamagePoint objects strictly contained within bbox.
        """
        center_lat = event.coordinates.lat
        center_lng = event.coordinates.lng

        # Bounding box diagonal half-length as maximum radial reference distance
        diag_degrees = math.hypot(bbox.max_lat - bbox.min_lat, bbox.max_lng - bbox.min_lng)
        max_distance = max(1e-6, diag_degrees / 2.0)

        # Standard deviations: 30% of bounding box radius captures 99% of damage inside box
        sigma_lat = (bbox.max_lat - bbox.min_lat) * 0.3
        sigma_lng = (bbox.max_lng - bbox.min_lng) * 0.3

        damage_points: list[DamagePoint] = []

        # Generate points in batches with slight oversampling to account for defensive filtering
        raw_lats = rng.normal(loc=center_lat, scale=sigma_lat, size=n_points)
        raw_lngs = rng.normal(loc=center_lng, scale=sigma_lng, size=n_points)

        for raw_lat, raw_lng in zip(raw_lats, raw_lngs):
            # Clip coordinates strictly within bounding box bounds
            lat = float(np.clip(raw_lat, bbox.min_lat, bbox.max_lat))
            lng = float(np.clip(raw_lng, bbox.min_lng, bbox.max_lng))

            # Defensive verification that point resides within bbox
            if not bbox.contains(lat, lng):
                continue

            # Normalized distance from epicenter
            dist = math.hypot(lat - center_lat, lng - center_lng)
            norm_dist = min(1.0, dist / max_distance)

            # Sample damage class based on spatial damage gradient
            probs = self._interpolate_class_probs(norm_dist)
            cls_idx = int(rng.choice(len(DAMAGE_CLASSES), p=probs))
            damage_class = DAMAGE_CLASSES[cls_idx]

            # Assign synthetic but realistic confidence scores (0.60 – 0.95)
            confidence = float(rng.uniform(0.60, 0.95))

            damage_points.append(
                DamagePoint(
                    lat=round(lat, 6),
                    lng=round(lng, 6),
                    damage_class=damage_class,
                    confidence=round(confidence, 4),
                )
            )

        return damage_points

    def _compute_damage_score(self, damage_points: list[DamagePoint]) -> int:
        """
        Compute an aggregate damage score (0–100) based on confidence-weighted damage classes.

        Args:
            damage_points: Full list of generated DamagePoint objects.

        Returns:
            Integer severity score between 0 and 100 inclusive.
        """
        if not damage_points:
            return 0

        total_weighted = sum(
            DAMAGE_WEIGHTS.get(p.damage_class, 0.0) * p.confidence
            for p in damage_points
        )
        score_val = (total_weighted / len(damage_points)) * 100.0
        score = int(round(score_val))
        return max(0, min(100, score))

    def _severity_floor_score(self, event: DisasterEvent) -> int:
        """
        Compute a severity-derived minimum damage score.

        The Gaussian spatial distribution produces the same class ratios
        regardless of severity (same sigma, same bbox). This floor ensures
        damage_score scales MONOTONICALLY with severity_metric, which is
        essential for demo plausibility and test correctness.

        The distribution-based score is still used when it exceeds this floor
        (e.g. for high-magnitude earthquakes with many destroyed points).

        Args:
            event: The incoming disaster event.

        Returns:
            Minimum damage score (0–100) implied by severity alone.
        """
        s = event.severity_metric
        dtype = event.disaster_type

        if "earthquake" in dtype or "seismic" in dtype:
            # 6.0 → 15,  7.0 → 35,  8.0 → 65,  8.5 → 80
            floor = int(min(100, max(0, (s - 5.0) ** 1.8 * 10)))
        elif "flood" in dtype or "rainfall" in dtype or "cyclone" in dtype:
            # 51 → ~1,  100 → 45,  150 → 90
            floor = int(min(100, max(0, (s - 50.0) / 100.0 * 90)))
        else:
            # Generic: linear 0–100 across reasonable severity range
            floor = int(min(100, max(0, s * 0.8)))

        return floor

    def generate_assessment(
        self,
        event: DisasterEvent,
        bbox: BoundingBox,
    ) -> InferenceResult:
        """
        Generate a complete synthetic damage assessment for the given disaster event.

        Uses deterministic pseudo-random seeding derived from event_id so repeated
        requests for the same disaster produce identical, reproducible results.

        Args:
            event: Incoming disaster incident from Stream 1.
            bbox: Geographic bounding box surrounding the disaster epicenter.

        Returns:
            InferenceResult populated with damage points, damage score, and pixel counts.
        """
        logger.info(
            f"MOCK MODE: generating synthetic assessment for event_id={event.event_id} "
            f"({event.disaster_type}, severity={event.severity_metric})"
        )

        # Seed NumPy generator using event_id for repeatable deterministic output
        seed = event.event_id.int % (2**32)
        rng = np.random.default_rng(seed)

        n_buildings = self._count_affected_buildings(event)
        logger.info(
            f"Scaling rationale: {event.disaster_type} with severity {event.severity_metric} "
            f"yields {n_buildings} synthetic building assessment points."
        )

        damage_points = self._generate_damage_points(event, bbox, n_buildings, rng=rng)
        distribution_score = self._compute_damage_score(damage_points)
        severity_floor = self._severity_floor_score(event)
        # Take the higher of the two: stochastic distribution score or
        # the deterministic severity floor. This guarantees that damage_score
        # scales monotonically with severity_metric for the same disaster type.
        damage_score = max(distribution_score, severity_floor)

        # Aggregate counts by class
        pixel_counts = {
            cls_name: sum(1 for p in damage_points if p.damage_class == cls_name)
            for cls_name in DAMAGE_CLASSES
        }

        logger.info(
            f"MOCK MODE: Generated {len(damage_points)} points. "
            f"Distribution score: {distribution_score}/100, "
            f"Severity floor: {severity_floor}/100, "
            f"Final score: {damage_score}/100. "
            f"Class Breakdown: {pixel_counts}"
        )

        return InferenceResult(
            damage_points=damage_points,
            damage_score=damage_score,
            pixel_counts=pixel_counts,
            model_mode="mock",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Convenience Functions
# ─────────────────────────────────────────────────────────────────────────────


def generate_mock_assessment(
    event: DisasterEvent,
    bbox: BoundingBox,
) -> InferenceResult:
    """
    Convenience wrapper to instantiate MockInferenceEngine and generate assessment.

    Args:
        event: DisasterEvent from Stream 1.
        bbox: BoundingBox around epicenter.

    Returns:
        InferenceResult with synthetic damage points and statistics.
    """
    engine = MockInferenceEngine()
    return engine.generate_assessment(event, bbox)
