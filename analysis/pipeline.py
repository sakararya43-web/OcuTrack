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
from analysis.frame_sampling import sample_frames
from analysis.ml.inference import TemporalModelRunner
from analysis.pupil_features import extract_pupil_features
from analysis.pupil_tracking import PupilTracker
from analysis.pursuit_tracking import PursuitTracker
from analysis.quality import assess_video_quality
from analysis.video_io import VideoReader


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

    Validates files, decodes frames, performs eye localization and OpenCV pupil segmentation,
    and returns a structured schema report. Never fabricates physiological measurements.
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
            # Phase 2: Execute actual eye localization & pupil tracking
            try:
                with VideoReader(pupil_video_path, cfg) as reader:
                    sampled_frames, total_read, _ = sample_frames(reader, cfg)
                    preferred_eye = (pupil_metadata or {}).get("preferred_eye", "auto")
                    tracker = PupilTracker(preferred_eye_side=preferred_eye)
                    measurements = tracker.track_sequence(sampled_frames)

                    series_data = [m.to_series_point() for m in measurements]
                    valid_count = sum(1 for m in measurements if m.valid)
                    total_pts = len(measurements)
                    continuity = (valid_count / total_pts) if total_pts > 0 else 0.0

                    quality_details["pupil"]["tracked_eye_side"] = tracker.tracked_eye_side
                    quality_details["pupil"]["valid_pupil_frames"] = valid_count
                    quality_details["pupil"]["total_pupil_frames"] = total_pts
                    quality_details["pupil"]["pupil_tracking_continuity"] = round(continuity, 4)

                    if valid_count == 0:
                        pupil_result = {
                            "status": TestStatus.INSUFFICIENT_QUALITY.value,
                            "features": _empty_pupil_features(),
                            "series": series_data,
                        }
                        warnings.append("[Pupil] Pupil localization failed across all sampled frames.")
                    else:
                        if continuity < 0.50:
                            warnings.append(
                                f"[Pupil] Low pupil tracking continuity: {continuity * 100:.1f}% valid frames."
                            )

                        # Phase 3: Extract physiological pupil features
                        pupil_feats, feat_warnings = extract_pupil_features(
                            measurements=measurements,
                            metadata=pupil_metadata,
                            config=cfg,
                        )
                        warnings.extend(feat_warnings)

                        pupil_result = {
                            "status": TestStatus.COMPLETE.value,
                            "features": pupil_feats,
                            "series": series_data,
                        }
            except Exception as e:
                pupil_result = {
                    "status": TestStatus.FAILED.value,
                    "features": _empty_pupil_features(),
                    "series": [],
                }
                warnings.append(f"[Pupil] Pupil tracking pipeline error: {str(e)}")
    else:
        pupil_result = {
            "status": TestStatus.NOT_PROVIDED.value,
            "features": None,
            "series": None,
        }

    # Handle Pursuit Video (Phase 3: Smooth-pursuit tracking & target alignment)
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
            try:
                with VideoReader(pursuit_video_path, cfg) as reader:
                    sampled_frames, _, _ = sample_frames(reader, cfg)
                    preferred_eye = (pursuit_metadata or {}).get("preferred_eye", "auto")
                    tracker = PursuitTracker(preferred_eye_side=preferred_eye)
                    raw_measurements = tracker.track_sequence(sampled_frames)

                    pursuit_feats, aligned_measurements, pursuit_warnings = (
                        PursuitTracker.align_and_extract_features(
                            measurements=raw_measurements,
                            metadata=pursuit_metadata,
                            config=cfg,
                        )
                    )
                    warnings.extend(pursuit_warnings)

                    series_data = [m.to_series_point() for m in aligned_measurements]
                    valid_count = sum(1 for m in aligned_measurements if m.valid and m.eye_x is not None)
                    total_pts = len(aligned_measurements)
                    continuity = (valid_count / total_pts) if total_pts > 0 else 0.0

                    quality_details["pursuit"]["tracked_eye_side"] = tracker.tracked_eye_side
                    quality_details["pursuit"]["valid_pursuit_frames"] = valid_count
                    quality_details["pursuit"]["total_pursuit_frames"] = total_pts
                    quality_details["pursuit"]["pursuit_tracking_continuity"] = round(continuity, 4)

                    if valid_count == 0:
                        pursuit_result = {
                            "status": TestStatus.INSUFFICIENT_QUALITY.value,
                            "features": _empty_pursuit_features(),
                            "series": series_data,
                        }
                        warnings.append("[Pursuit] Eye localization failed across all sampled frames.")
                    else:
                        if continuity < 0.50:
                            warnings.append(
                                f"[Pursuit] Low pursuit tracking continuity: {continuity * 100:.1f}% valid frames."
                            )

                        pursuit_result = {
                            "status": TestStatus.COMPLETE.value,
                            "features": pursuit_feats,
                            "series": series_data,
                        }
            except Exception as e:
                pursuit_result = {
                    "status": TestStatus.FAILED.value,
                    "features": _empty_pursuit_features(),
                    "series": [],
                }
                warnings.append(f"[Pursuit] Pursuit tracking pipeline error: {str(e)}")
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

    # Phase 4: Temporal Model Inference (Data-Gated)
    weights_path = (model_config or {}).get("weights_path") if model_config else None
    is_exp = bool((model_config or {}).get("enable_experimental_tcn", False)) if model_config else False
    model_runner = TemporalModelRunner(weights_path=weights_path, is_experimental=is_exp)
    temporal_model_result = model_runner.run_inference(
        pupil_series=pupil_result.get("series"),
        pursuit_series=pursuit_result.get("series"),
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
        "temporal_model": temporal_model_result,
        "warnings": warnings,
    }

    return to_json_serializable(output)
