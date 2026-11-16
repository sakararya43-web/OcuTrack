from typing import Dict, Any, Optional
from app.db.models import AssessmentModel
from app.schemas.common import (
    AssessmentStatus,
    QualityStatus,
    TestStatus,
    ModelStatus,
    ComparisonStatus,
)
from app.schemas.assessments import (
    AssessmentDetail,
    QualityMetrics,
    PupilTestResult,
    PursuitTestResult,
    TemporalModelResult,
    LongitudinalComparisonResult,
    FeatureValue,
    FeatureDelta,
)
from app.schemas.patients import AssessmentSummary

FEATURE_LABELS = {
    "baseline_diameter": "Baseline Pupil Diameter",
    "constriction_latency": "Constriction Latency",
    "constriction_velocity": "Max Constriction Velocity",
    "constriction_amplitude": "Constriction Amplitude",
    "dilation_velocity": "Average Dilation Velocity",
    "tracking_gain": "Smooth Pursuit Gain",
    "rmse_error": "Gaze Tracking RMSE",
    "saccadic_intrusions": "Catch-up Saccades",
}

NON_DIAGNOSTIC_NOTICE = (
    "Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative "
    "ocular measurements for research and clinical review. It does not diagnose "
    "Parkinson’s disease, concussion, diabetic neuropathy, or any neurological condition."
)


def build_assessment_detail(assessment: AssessmentModel) -> AssessmentDetail:
    """
    Converts structured database measurements, model runs, and comparison states
    into frontend-ready data with neutral review copy.
    """
    pupil_features: Dict[str, FeatureValue] = {}
    pursuit_features: Dict[str, FeatureValue] = {}
    features_summary: Dict[str, Any] = {}
    pupil_series = None
    pursuit_series = None

    for m in (assessment.measurements or []):
        feat_label = FEATURE_LABELS.get(m.feature_name, m.feature_name.replace("_", " ").title())
        feat_obj = FeatureValue(
            value=m.feature_value,
            unit=m.unit,
            label=feat_label,
        )
        features_summary[m.feature_name] = m.feature_value
        if m.test_type == "pupil_reflex":
            pupil_features[m.feature_name] = feat_obj
            if m.series_data:
                pupil_series = m.series_data
        elif m.test_type == "smooth_pursuit":
            pursuit_features[m.feature_name] = feat_obj
            if m.series_data:
                pursuit_series = m.series_data

    # Determine per-test statuses
    if assessment.status == AssessmentStatus.COMPLETE.value:
        pupil_status = TestStatus.COMPLETE if pupil_features else TestStatus.NOT_PROVIDED
        pursuit_status = TestStatus.COMPLETE if pursuit_features else TestStatus.NOT_PROVIDED
    elif assessment.status == AssessmentStatus.FAILED.value:
        pupil_status = TestStatus.FAILED
        pursuit_status = TestStatus.FAILED
    else:
        pupil_status = TestStatus.COMPLETE if assessment.pupil_video_path else TestStatus.NOT_PROVIDED
        pursuit_status = TestStatus.COMPLETE if assessment.pursuit_video_path else TestStatus.NOT_PROVIDED

    # Model run mapping
    tm_result = TemporalModelResult(status=ModelStatus.NOT_CONFIGURED)
    if assessment.model_runs:
        latest_run = assessment.model_runs[0]
        run_status = (
            ModelStatus(latest_run.status)
            if latest_run.status in ModelStatus._value2member_map_
            else ModelStatus.EXPERIMENTAL
        )
        tm_result = TemporalModelResult(
            status=run_status,
            model_name=latest_run.model_name,
            model_version=latest_run.model_version,
            output=latest_run.output,
            notes="Experimental model output; not clinically validated.",
        )

    # Longitudinal comparison mapping
    longitudinal_res = LongitudinalComparisonResult(status=ComparisonStatus.NOT_AVAILABLE)
    if assessment.comparisons:
        latest_comp = assessment.comparisons[0]
        comp_status = (
            ComparisonStatus.COMPARABLE
            if latest_comp.comparable
            else ComparisonStatus.NOT_COMPARABLE
        )
        deltas = {}
        for feat_name, d_val in (latest_comp.feature_deltas or {}).items():
            deltas[feat_name] = FeatureDelta(
                delta=d_val.get("delta"),
                percentage_delta=d_val.get("percentage_delta"),
                unit=d_val.get("unit", ""),
                direction=d_val.get("direction"),
            )
        longitudinal_res = LongitudinalComparisonResult(
            status=comp_status,
            baseline_id=latest_comp.baseline_assessment_id,
            comparability_reason=latest_comp.reason,
            feature_deltas=deltas,
        )
    elif assessment.is_baseline:
        longitudinal_res = LongitudinalComparisonResult(
            status=ComparisonStatus.NOT_AVAILABLE,
            baseline_id=assessment.id,
            comparability_reason="First visit: baseline established.",
            feature_deltas={},
        )

    return AssessmentDetail(
        assessment_id=assessment.id,
        patient_id=assessment.patient_id,
        status=AssessmentStatus(assessment.status),
        quality_status=QualityStatus(assessment.quality_status),
        assessment_at=assessment.assessment_at,
        protocol_version=assessment.protocol_version,
        warnings=assessment.warnings or [],
        review_message=assessment.review_message,
        non_diagnostic_notice=NON_DIAGNOSTIC_NOTICE,
        features=features_summary if features_summary else None,
        quality=QualityMetrics(
            status=QualityStatus(assessment.quality_status),
            usable_frame_ratio=None,
            warnings=[],
        ),
        pupil=PupilTestResult(
            status=pupil_status,
            features=pupil_features if pupil_features else None,
            series=pupil_series,
        ),
        pursuit=PursuitTestResult(
            status=pursuit_status,
            features=pursuit_features if pursuit_features else None,
            series=pursuit_series,
        ),
        temporal_model=tm_result,
        longitudinal_comparison=longitudinal_res,
    )


def build_patient_history_summary(assessment: AssessmentModel) -> AssessmentSummary:
    """Builds a trend-compatible AssessmentSummary item for the longitudinal patient history."""
    features_dict = {}
    for m in (assessment.measurements or []):
        if m.feature_name in ["constriction_latency", "latency_ms"]:
            features_dict["latency_ms"] = m.feature_value
        elif m.feature_name == "constriction_velocity":
            features_dict["constriction_velocity"] = m.feature_value
        elif m.feature_name == "tracking_gain":
            features_dict["tracking_gain"] = m.feature_value
        features_dict[m.feature_name] = m.feature_value

    return AssessmentSummary(
        assessment_id=assessment.id,
        patient_id=assessment.patient_id,
        status=AssessmentStatus(assessment.status),
        quality_status=QualityStatus(assessment.quality_status),
        assessment_at=assessment.assessment_at,
        protocol_version=assessment.protocol_version,
        warnings=assessment.warnings or [],
        review_message=assessment.review_message,
        features=features_dict if features_dict else None,
    )
