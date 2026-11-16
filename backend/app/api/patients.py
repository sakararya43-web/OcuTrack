from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.connection import get_db
from app.db.models import PatientModel, ConsentModel, AssessmentModel, utc_now
from app.schemas.patients import (
    CreatePatientPayload,
    PatientResponse,
    AssessmentSummary,
)
from app.core.errors import NotFoundError, ConflictError

router = APIRouter(prefix="/patients", tags=["Patients"])


def _build_patient_response(patient: PatientModel) -> PatientResponse:
    latest_consent = patient.consents[0] if patient.consents else None
    latest_assessment = patient.assessments[0] if patient.assessments else None

    # Check whether any longitudinal comparison recorded a feature change
    has_change = None
    for a in (patient.assessments or []):
        for c in (a.comparisons or []):
            if c.comparable and c.feature_deltas:
                for f_info in c.feature_deltas.values():
                    if isinstance(f_info, dict) and f_info.get("direction") in ["increased", "decreased"]:
                        has_change = True
                        break
        if has_change is True:
            break
    if has_change is None and len(patient.assessments or []) > 1:
        has_change = False

    return PatientResponse(
        patient_id=patient.id,
        pseudonymous_code=patient.pseudonymous_code,
        age_band=patient.age_band,
        context_notes=patient.context_notes,
        consent_status=latest_consent.consent_status if latest_consent else "not_recorded",
        consent_purpose=latest_consent.purpose if latest_consent else None,
        created_at=patient.created_at,
        last_assessment_date=latest_assessment.assessment_at if latest_assessment else None,
        last_quality_status=latest_assessment.quality_status if latest_assessment else None,
        feature_change_recorded=has_change,
        assessment_count=len(patient.assessments),
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, summary="Create pseudonymous patient")
def create_patient(
    payload: CreatePatientPayload,
    db: Session = Depends(get_db),
):
    """
    Registers a new pseudonymous participant and records consent.
    Enforces uniqueness of pseudonymous_code and links consent record.
    """
    # Check if pseudonymous_code already exists
    existing = db.query(PatientModel).filter(
        PatientModel.pseudonymous_code == payload.pseudonymous_code
    ).first()
    if existing:
        raise ConflictError(f"A patient with pseudonymous code '{payload.pseudonymous_code}' already exists.")

    patient = PatientModel(
        pseudonymous_code=payload.pseudonymous_code,
        age_band=payload.age_band,
        context_notes=payload.context_notes,
        created_at=utc_now(),
    )
    db.add(patient)

    try:
        db.flush()  # Generate patient.id
    except IntegrityError:
        db.rollback()
        raise ConflictError(f"A patient with pseudonymous code '{payload.pseudonymous_code}' already exists.")

    consent = ConsentModel(
        patient_id=patient.id,
        consent_status=payload.consent.consent_status,
        purpose=payload.consent.purpose,
        recorded_at=payload.consent.granted_at or utc_now(),
    )
    db.add(consent)

    try:
        db.commit()
        db.refresh(patient)
    except IntegrityError:
        db.rollback()
        raise ConflictError(f"Failed to persist patient due to a database constraint violation.")

    return _build_patient_response(patient)


@router.get("", response_model=List[PatientResponse], summary="List pseudonymous patients")
def list_patients(db: Session = Depends(get_db)):
    """
    Retrieves all registered pseudonymous patients ordered by registration date descending.
    """
    patients = db.query(PatientModel).order_by(PatientModel.created_at.desc()).all()
    return [_build_patient_response(p) for p in patients]


@router.get("/{patient_id}", response_model=PatientResponse, summary="Get patient profile")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    """
    Retrieves individual patient profile and metadata by patient_id.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise NotFoundError(f"Patient with ID '{patient_id}' not found.")
    return _build_patient_response(patient)


@router.get("/{patient_id}/history", response_model=List[AssessmentSummary], summary="Get patient assessment history")
def get_patient_history(patient_id: str, db: Session = Depends(get_db)):
    """
    Retrieves longitudinal assessment history for across-visit trend plotting.
    Returns 404 if the patient does not exist.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise NotFoundError(f"Patient with ID '{patient_id}' not found.")

    assessments = db.query(AssessmentModel).filter(
        AssessmentModel.patient_id == patient_id
    ).order_by(AssessmentModel.assessment_at.desc()).all()

    summaries = []
    for a in assessments:
        features_dict = {}
        for m in (a.measurements or []):
            if m.feature_name in ["constriction_latency", "latency_ms"]:
                features_dict["latency_ms"] = m.feature_value
            elif m.feature_name == "constriction_velocity":
                features_dict["constriction_velocity"] = m.feature_value
            elif m.feature_name == "tracking_gain":
                features_dict["tracking_gain"] = m.feature_value
            features_dict[m.feature_name] = m.feature_value

        summaries.append(
            AssessmentSummary(
                assessment_id=a.id,
                patient_id=a.patient_id,
                status=a.status,
                quality_status=a.quality_status,
                assessment_at=a.assessment_at,
                protocol_version=a.protocol_version,
                warnings=a.warnings or [],
                review_message=a.review_message,
                features=features_dict if features_dict else None,
            )
        )

    return summaries
