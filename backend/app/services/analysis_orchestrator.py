import sys
from pathlib import Path
from typing import Optional, Dict, Any, Callable, List
from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppException, NotFoundError, ValidationError
from app.db.models import AssessmentModel, MeasurementModel, ModelRunModel, utc_now
from app.schemas.common import AssessmentStatus, QualityStatus, ModelStatus
from app.services.upload_service import cleanup_file
from app.longitudinal.comparison import evaluate_longitudinal_comparison

# Ensure repository root is importable so the sibling `analysis` package resolves from any CWD
_REPO_ROOT = str(Path(__file__).resolve().parents[3])
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

# Check for Aditya's analysis package
try:
    from analysis import analyze_assessment as _default_analyze_assessment
    ANALYSIS_ENGINE_AVAILABLE = True
except ImportError:
    try:
        from analysis.engine import analyze_assessment as _default_analyze_assessment
        ANALYSIS_ENGINE_AVAILABLE = True
    except ImportError:
        _default_analyze_assessment = None
        ANALYSIS_ENGINE_AVAILABLE = False

_injected_engine: Optional[Callable] = None


def set_analysis_engine(engine_fn: Optional[Callable]) -> None:
    """Injects an analysis engine callable for testing or runtime customization."""
    global _injected_engine
    _injected_engine = engine_fn


def reset_analysis_engine() -> None:
    """Resets injected analysis engine."""
    global _injected_engine
    _injected_engine = None


def get_analysis_engine() -> Callable:
    """Retrieves the active analysis engine callable or raises 503 if unavailable."""
    if _injected_engine is not None:
        return _injected_engine
    if ANALYSIS_ENGINE_AVAILABLE and _default_analyze_assessment is not None:
        return _default_analyze_assessment
    raise AppException(
        message="Analysis engine unavailable. Aditya's analysis package is not installed or accessible.",
        code="ANALYSIS_ENGINE_UNAVAILABLE",
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def validate_analysis_output(output: Any) -> Dict[str, Any]:
    """Validates structure and enum types of analysis output before persistence."""
    if not isinstance(output, dict):
        raise ValidationError("Analysis engine returned invalid output: expected dictionary.")

    required_keys = ["quality", "pupil", "pursuit"]
    for key in required_keys:
        if key not in output or not isinstance(output[key], dict):
            raise ValidationError(f"Analysis engine output missing required '{key}' section.")

    return output


def orchestrate_analysis(
    assessment_id: str,
    db: Session,
    engine_override: Optional[Callable] = None,
) -> AssessmentModel:
    """
    Executes the analysis orchestration workflow:
    1. Validates assessment state and uploaded files.
    2. Marks status as 'processing'.
    3. Invokes the analysis engine.
    4. Validates output and persists biometric measurements and model run metadata.
    5. Cleans up temporary video files in a finally block.
    6. Marks assessment as 'complete' or 'failed'.
    """
    assessment = db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()
    if not assessment:
        raise NotFoundError(f"Assessment with ID '{assessment_id}' not found.")

    if not assessment.pupil_video_path and not assessment.pursuit_video_path:
        raise ValidationError("Assessment cannot be analyzed: no video recordings have been uploaded.")

    # Mark as processing
    assessment.status = AssessmentStatus.PROCESSING.value
    db.commit()
    db.refresh(assessment)

    engine = engine_override or get_analysis_engine()

    pupil_path = Path(assessment.pupil_video_path) if assessment.pupil_video_path else None
    pursuit_path = Path(assessment.pursuit_video_path) if assessment.pursuit_video_path else None

    # Track temporary paths for guaranteed cleanup
    paths_to_cleanup = [assessment.pupil_video_path, assessment.pursuit_video_path]

    try:
        pupil_meta_for_engine = dict(assessment.pupil_metadata or {})
        if (
            "stimulus_onset_ms" not in pupil_meta_for_engine
            and pupil_meta_for_engine.get("stimulus_onset_seconds") is not None
        ):
            try:
                pupil_meta_for_engine["stimulus_onset_ms"] = (
                    float(pupil_meta_for_engine["stimulus_onset_seconds"]) * 1000.0
                )
            except (TypeError, ValueError):
                pass

        pursuit_meta_for_engine = dict(assessment.pursuit_metadata or {})
        raw_traj = pursuit_meta_for_engine.get("trajectory")
        if isinstance(raw_traj, dict) and isinstance(raw_traj.get("coordinates_normalized"), list):
            pursuit_meta_for_engine["trajectory"] = raw_traj["coordinates_normalized"]
        elif not raw_traj and isinstance(pursuit_meta_for_engine.get("target_path"), dict):
            coords = pursuit_meta_for_engine["target_path"].get("coordinates_normalized")
            if isinstance(coords, list):
                pursuit_meta_for_engine["trajectory"] = coords

        raw_output = engine(
            pupil_video_path=pupil_path,
            pursuit_video_path=pursuit_path,
            pupil_metadata=pupil_meta_for_engine,
            pursuit_metadata=pursuit_meta_for_engine,
            model_config=None,
        )

        validated = validate_analysis_output(raw_output)

        # 1. Process Quality
        quality_data = validated.get("quality", {})
        q_status_str = quality_data.get("status", QualityStatus.PENDING.value)
        assessment.quality_status = (
            q_status_str if q_status_str in QualityStatus._value2member_map_ else QualityStatus.PENDING.value
        )
        if quality_data.get("usable_frame_ratio") is not None:
            curr_pupil_meta = dict(assessment.pupil_metadata or {})
            curr_pupil_meta["usable_frame_ratio"] = quality_data.get("usable_frame_ratio")
            assessment.pupil_metadata = curr_pupil_meta

        # 2. Clear old measurements and persist new
        db.query(MeasurementModel).filter(MeasurementModel.assessment_id == assessment.id).delete()

        # Persist pupil features (normalize `diameter` -> `value` for chart compatibility)
        pupil_data = validated.get("pupil", {})
        pupil_features = pupil_data.get("features") or {}
        raw_pupil_series = pupil_data.get("series") or []
        pupil_series: List[Dict[str, Any]] = []
        for pt in raw_pupil_series:
            if isinstance(pt, dict):
                val = pt.get("value") if pt.get("value") is not None else pt.get("diameter")
                pupil_series.append({
                    "t_ms": int(pt.get("t_ms", 0)),
                    "value": val,
                    "valid": bool(pt.get("valid", True)),
                })

        pupil_series_anchor = (
            "baseline_diameter"
            if "baseline_diameter" in pupil_features
            else next(iter(pupil_features), None)
        )
        for feat_name, feat_obj in pupil_features.items():
            if isinstance(feat_obj, dict):
                measurement = MeasurementModel(
                    assessment_id=assessment.id,
                    test_type="pupil_reflex",
                    feature_name=feat_name,
                    feature_value=feat_obj.get("value"),
                    unit=feat_obj.get("unit", "a.u."),
                    series_data=pupil_series if feat_name == pupil_series_anchor else None,
                    created_at=utc_now(),
                )
                db.add(measurement)

        # Persist pursuit features (attach series to tracking_gain, mean_tracking_error, or first feature)
        pursuit_data = validated.get("pursuit", {})
        pursuit_features = pursuit_data.get("features") or {}
        pursuit_series = pursuit_data.get("series") or []
        pursuit_series_anchor = (
            "tracking_gain"
            if "tracking_gain" in pursuit_features
            else (
                "mean_tracking_error"
                if "mean_tracking_error" in pursuit_features
                else next(iter(pursuit_features), None)
            )
        )
        for feat_name, feat_obj in pursuit_features.items():
            if isinstance(feat_obj, dict):
                measurement = MeasurementModel(
                    assessment_id=assessment.id,
                    test_type="smooth_pursuit",
                    feature_name=feat_name,
                    feature_value=feat_obj.get("value"),
                    unit=feat_obj.get("unit", "a.u."),
                    series_data=pursuit_series if feat_name == pursuit_series_anchor else None,
                    created_at=utc_now(),
                )
                db.add(measurement)

        # 3. Persist Model Run
        temporal_data = validated.get("temporal_model", {})
        if temporal_data:
            db.query(ModelRunModel).filter(ModelRunModel.assessment_id == assessment.id).delete()
            model_run = ModelRunModel(
                assessment_id=assessment.id,
                model_name=temporal_data.get("model_name", "TCN-Temporal-Evaluator-v0.1"),
                model_version=temporal_data.get("model_version"),
                input_schema_version="v1",
                status=temporal_data.get("status", ModelStatus.NOT_CONFIGURED.value),
                output=temporal_data.get("output"),
                evaluation_context=None,
                created_at=utc_now(),
            )
            db.add(model_run)

        # 4. Warnings and neutral review message
        combined_warnings = list(assessment.warnings or [])
        combined_warnings.extend(validated.get("warnings", []))
        combined_warnings.extend(quality_data.get("warnings", []))
        assessment.warnings = list(dict.fromkeys(combined_warnings))  # Deduplicate

        if assessment.quality_status == QualityStatus.INSUFFICIENT.value:
            assessment.review_message = "Insufficient recording quality — repeat test."
        else:
            assessment.review_message = "Recording quality acceptable."

        assessment.status = AssessmentStatus.COMPLETE.value

        db.commit()
        db.refresh(assessment)

        # 5. Longitudinal comparison against patient's baseline
        evaluate_longitudinal_comparison(assessment, db)

        db.refresh(assessment)
        return assessment

    except Exception as exc:
        assessment.status = AssessmentStatus.FAILED.value
        assessment.warnings = list(assessment.warnings or []) + [f"Analysis pipeline error: {str(exc)}"]
        assessment.review_message = "Analysis failed — repeat test."
        db.commit()
        db.refresh(assessment)
        if isinstance(exc, (AppException, ValidationError)):
            raise
        raise AppException(
            message=f"Analysis pipeline execution failed: {str(exc)}",
            code="ANALYSIS_PIPELINE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    finally:
        # Step 11: Delete temporary videos in finally block
        for p in paths_to_cleanup:
            if p:
                cleanup_file(p)
        assessment.pupil_video_path = None
        assessment.pursuit_video_path = None
        db.commit()
