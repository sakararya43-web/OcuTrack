from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
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
    FeatureDelta,
)
from app.schemas.patients import AssessmentSummary
from app.core.errors import NotFoundError, ValidationError
from app.services.upload_service import (
    save_and_validate_video,
    validate_metadata_json,
    cleanup_file,
)
from app.services.analysis_orchestrator import orchestrate_analysis
from app.services.report_service import build_assessment_detail, build_patient_history_summary
from app.longitudinal.comparison import evaluate_longitudinal_comparison

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("", response_model=List[AssessmentSummary], summary="List all assessments and reports")
def list_assessments(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by assessment status"),
    db: Session = Depends(get_db),
):
    """
    Retrieves all assessments across patients ordered by assessment timestamp descending.
    """
    query = db.query(AssessmentModel)
    if patient_id:
        query = query.filter(AssessmentModel.patient_id == patient_id)
    if status_filter:
        query = query.filter(AssessmentModel.status == status_filter)
    assessments = query.order_by(AssessmentModel.assessment_at.desc()).all()
    return [build_patient_history_summary(a) for a in assessments]




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


class CompareAssessmentPayload(BaseModel):
    baseline_id: Optional[str] = None


@router.post("/{assessment_id}/compare", response_model=AssessmentDetail, summary="Trigger longitudinal comparison")
def compare_assessment_endpoint(
    assessment_id: str,
    payload: Optional[CompareAssessmentPayload] = None,
    db: Session = Depends(get_db),
):
    """
    Evaluates or re-evaluates longitudinal comparison against a baseline.
    """
    assessment = db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()
    if not assessment:
        raise NotFoundError(f"Assessment with ID '{assessment_id}' not found.")

    preferred_baseline_id = payload.baseline_id if payload else None
    evaluate_longitudinal_comparison(assessment, db, preferred_baseline_id=preferred_baseline_id)
    return build_assessment_detail(assessment)


