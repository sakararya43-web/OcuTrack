from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from app.db.connection import get_db
from app.db.models import PatientModel, AssessmentModel, utc_now
from app.schemas.common import (
    AssessmentStatus,
    QualityStatus,
    TestStatus,
    ModelStatus,
    ComparisonStatus,
)
from app.schemas.assessments import (
    CreateAssessmentPayload,
    AssessmentDetail,
    QualityMetrics,
    PupilTestResult,
    PursuitTestResult,
    TemporalModelResult,
    LongitudinalComparisonResult,
    FeatureValue,
)
from app.core.errors import NotFoundError, ValidationError
from app.services.upload_service import (
    save_and_validate_video,
    validate_metadata_json,
    cleanup_file,
)
from app.services.analysis_orchestrator import orchestrate_analysis

router = APIRouter(prefix="/assessments", tags=["Assessments"])

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


def build_assessment_detail(assessment: AssessmentModel) -> AssessmentDetail:
    """Builds a contract-compliant AssessmentDetail response populated from persistence."""
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

    return AssessmentDetail(
        assessment_id=assessment.id,
        patient_id=assessment.patient_id,
        status=AssessmentStatus(assessment.status),
        quality_status=QualityStatus(assessment.quality_status),
        assessment_at=assessment.assessment_at,
        protocol_version=assessment.protocol_version,
        warnings=assessment.warnings or [],
        review_message=assessment.review_message,
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
        longitudinal_comparison=LongitudinalComparisonResult(status=ComparisonStatus.NOT_AVAILABLE),
    )



@router.post("", response_model=AssessmentDetail, status_code=status.HTTP_201_CREATED, summary="Initialize assessment session")
def create_assessment(
    payload: CreateAssessmentPayload,
    db: Session = Depends(get_db),
):
    """
    Initializes a new assessment session for a consented patient.
    Captures protocol, device, and lighting metadata.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == payload.patient_id).first()
    if not patient:
        raise NotFoundError(f"Patient with ID '{payload.patient_id}' not found.")

    # Check consent status
    latest_consent = patient.consents[0] if patient.consents else None
    if not latest_consent or latest_consent.consent_status != "granted":
        raise ValidationError("Assessment cannot be created: patient consent has not been granted.")

    assessment = AssessmentModel(
        patient_id=payload.patient_id,
        assessment_at=utc_now(),
        status=AssessmentStatus.CREATED.value,
        test_type=payload.test_type,
        protocol_version=payload.protocol_version,
        device_metadata=payload.device_metadata,
        lighting_metadata=payload.lighting_metadata,
        quality_status=QualityStatus.PENDING.value,
        is_baseline=False,
        created_at=utc_now(),
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return build_assessment_detail(assessment)


@router.post("/{assessment_id}/pupil-video", response_model=AssessmentDetail, summary="Upload pupil light reflex video")
async def upload_pupil_video(
    assessment_id: str,
    file: UploadFile = File(...),
    metadata_json: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Uploads and validates pupil light reflex recording.
    Enforces format, decodeability, duration, and safe server-side temporary storage.
    """
    assessment = db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()
    if not assessment:
        raise NotFoundError(f"Assessment with ID '{assessment_id}' not found.")

    parsed_metadata = validate_metadata_json(metadata_json)

    # Clean up previous temporary recording if re-uploading
    if assessment.pupil_video_path:
        cleanup_file(assessment.pupil_video_path)

    # Save and validate incoming video
    temp_path = await save_and_validate_video(file, "pupil", assessment_id)

    assessment.pupil_video_path = str(temp_path)
    assessment.pupil_metadata = parsed_metadata

    # If pursuit is already uploaded or if this is a pupil-only test, transition to uploaded
    if assessment.pursuit_video_path or assessment.test_type == "pupil_reflex":
        assessment.status = AssessmentStatus.UPLOADED.value

    db.commit()
    db.refresh(assessment)

    return build_assessment_detail(assessment)


@router.post("/{assessment_id}/pursuit-video", response_model=AssessmentDetail, summary="Upload smooth pursuit video")
async def upload_pursuit_video(
    assessment_id: str,
    file: UploadFile = File(...),
    metadata_json: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Uploads and validates smooth-pursuit recording and synchronized target path metadata.
    Enforces format, decodeability, duration, and safe server-side temporary storage.
    """
    assessment = db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()
    if not assessment:
        raise NotFoundError(f"Assessment with ID '{assessment_id}' not found.")

    parsed_metadata = validate_metadata_json(metadata_json)

    # Clean up previous temporary recording if re-uploading
    if assessment.pursuit_video_path:
        cleanup_file(assessment.pursuit_video_path)

    # Save and validate incoming video
    temp_path = await save_and_validate_video(file, "pursuit", assessment_id)

    assessment.pursuit_video_path = str(temp_path)
    assessment.pursuit_metadata = parsed_metadata

    # If pupil is already uploaded or if this is a pursuit-only test, transition to uploaded
    if assessment.pupil_video_path or assessment.test_type == "smooth_pursuit":
        assessment.status = AssessmentStatus.UPLOADED.value

    db.commit()
    db.refresh(assessment)

    return build_assessment_detail(assessment)


@router.get("/{assessment_id}", response_model=AssessmentDetail, summary="Retrieve assessment details")
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves full assessment status, upload states, and report metadata.
    """
    assessment = db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()
    if not assessment:
        raise NotFoundError(f"Assessment with ID '{assessment_id}' not found.")

    return build_assessment_detail(assessment)


@router.post("/{assessment_id}/analyze", response_model=AssessmentDetail, summary="Trigger analysis pipeline")
def analyze_assessment_endpoint(
    assessment_id: str,
    db: Session = Depends(get_db),
):
    """
    Triggers analysis orchestration: calls the analysis engine, validates output,
    persists biometric measurements and model run metadata, and cleans up temporary video files.
    """
    updated_assessment = orchestrate_analysis(assessment_id, db)
    return build_assessment_detail(updated_assessment)

