"""Top-level analysis pipeline entry point for OcuTrack.

Exposes analyze_assessment() conforming strictly to adityaImplementation.md Section 5
and docs/integration-contract.md.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import (
    ModelStatus,
    QualityStatus,
    TestStatus,
    to_json_serializable,
)
from analysis.quality import assess_video_quality


PIPELINE_VERSION = "0.1.0"


def _empty_pupil_features() -> Dict[str, Any]:
    """Returns uncomputed pupil features with null values and documented units."""
    return {
        "baseline_diameter": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Baseline pupil size",
        },
        "minimum_diameter": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Minimum pupil size",
        },
        "constriction_amplitude": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Constriction amplitude",
        },
        "response_latency_seconds": {
            "value": None,
            "unit": "s",
            "label": "Pupil response latency",
        },
        "constriction_velocity": {
            "value": None,
            "unit": "px_or_normalized per second",
            "label": "Constriction velocity",
        },
    }


def _empty_pursuit_features() -> Dict[str, Any]:
    """Returns uncomputed pursuit features with null values and documented units."""
    return {
        "mean_tracking_error": {
            "value": None,
            "unit": "normalized_screen_units",
            "label": "Mean tracking error",
        },
        "tracking_continuity": {
            "value": None,
            "unit": "ratio",
            "label": "Tracking continuity",
        },
        "corrective_movement_count": {
            "value": None,
            "unit": "count",
            "label": "Corrective movement candidates",
        },
    }


def analyze_assessment(
    pupil_video_path: Optional[Path | str] = None,
    pursuit_video_path: Optional[Path | str] = None,
    pupil_metadata: Optional[Dict[str, Any]] = None,
    pursuit_metadata: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
    *,
    config: Optional[AnalysisConfig] = None,
) -> Dict[str, Any]:
    """Top-level callable entry point for OcuTrack analysis engine.

    Validates files, performs deterministic video decoding, frame sampling,
    and recording-quality assessment. Never fabricates physiological measurements.
    """
    cfg = config or (
        AnalysisConfig.from_dict(model_config) if model_config else DEFAULT_CONFIG
    )

    warnings: List[str] = []
    quality_details: Dict[str, Any] = {}
    usable_ratios: List[float] = []

    # Track individual test results
    pupil_result: Dict[str, Any]
    pursuit_result: Dict[str, Any]

    # Handle Pupil Video
    pupil_quality_status = QualityStatus.ACCEPTABLE
    if pupil_video_path is not None:
        p_res = assess_video_quality(pupil_video_path, cfg)
        quality_details["pupil"] = p_res.details
        warnings.extend([f"[Pupil] {w}" for w in p_res.warnings])
        usable_ratios.append(p_res.usable_frame_ratio)
        pupil_quality_status = p_res.status

        if p_res.status == QualityStatus.INSUFFICIENT:
            pupil_result = {
                "status": TestStatus.INSUFFICIENT_QUALITY.value,
                "features": _empty_pupil_features(),
                "series": [],
            }
        else:
            pupil_result = {
                "status": TestStatus.COMPLETE.value,
                "features": _empty_pupil_features(),
                "series": [],
            }
    else:
        pupil_result = {
            "status": TestStatus.NOT_PROVIDED.value,
            "features": None,
            "series": None,
        }

    # Handle Pursuit Video
    pursuit_quality_status = QualityStatus.ACCEPTABLE
    if pursuit_video_path is not None:
        pu_res = assess_video_quality(pursuit_video_path, cfg)
        quality_details["pursuit"] = pu_res.details
        warnings.extend([f"[Pursuit] {w}" for w in pu_res.warnings])
        usable_ratios.append(pu_res.usable_frame_ratio)
        pursuit_quality_status = pu_res.status

        if pu_res.status == QualityStatus.INSUFFICIENT:
            pursuit_result = {
                "status": TestStatus.INSUFFICIENT_QUALITY.value,
                "features": _empty_pursuit_features(),
                "series": [],
            }
        else:
            pursuit_result = {
                "status": TestStatus.COMPLETE.value,
                "features": _empty_pursuit_features(),
                "series": [],
            }
    else:
        pursuit_result = {
            "status": TestStatus.NOT_PROVIDED.value,
            "features": None,
            "series": None,
        }

    # Determine overall quality
    if pupil_video_path is None and pursuit_video_path is None:
        overall_status = QualityStatus.INSUFFICIENT
        warnings.append("No video recordings provided for analysis.")
        avg_usable_ratio = 0.0
    else:
        if (
            pupil_quality_status == QualityStatus.INSUFFICIENT
            or pursuit_quality_status == QualityStatus.INSUFFICIENT
        ):
            overall_status = QualityStatus.INSUFFICIENT
        else:
            overall_status = QualityStatus.ACCEPTABLE

        avg_usable_ratio = (
            sum(usable_ratios) / len(usable_ratios) if usable_ratios else 0.0
        )

    output = {
        "pipeline_version": PIPELINE_VERSION,
        "quality": {
            "status": overall_status.value,
            "usable_frame_ratio": round(avg_usable_ratio, 4),
            "warnings": warnings,
            "details": quality_details,
        },
        "pupil": pupil_result,
        "pursuit": pursuit_result,
        "temporal_model": {
            "status": ModelStatus.NOT_CONFIGURED.value,
            "model_name": "ocutrack-tcn-experimental",
            "model_version": None,
            "output": None,
            "notes": "Temporal TCN model not configured; video quality and frame ingestion active.",
        },
        "warnings": warnings,
    }

    return to_json_serializable(output)
