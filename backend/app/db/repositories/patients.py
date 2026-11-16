from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import PatientModel, ConsentModel, utc_now
from app.schemas.patients import CreatePatientPayload


class PatientRepository:
    @staticmethod
    def get_by_id(db: Session, patient_id: str) -> Optional[PatientModel]:
        return db.query(PatientModel).filter(PatientModel.id == patient_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[PatientModel]:
        return db.query(PatientModel).filter(PatientModel.pseudonymous_code == code).first()

    @staticmethod
    def list_all(db: Session) -> List[PatientModel]:
        return db.query(PatientModel).order_by(PatientModel.created_at.desc()).all()

    @staticmethod
    def create(db: Session, payload: CreatePatientPayload) -> PatientModel:
        patient = PatientModel(
            pseudonymous_code=payload.pseudonymous_code,
            age_band=payload.age_band,
            context_notes=payload.context_notes,
            created_at=utc_now(),
        )
        db.add(patient)
        db.flush()

        consent = ConsentModel(
            patient_id=patient.id,
            consent_status=payload.consent.consent_status,
            purpose=payload.consent.purpose,
            recorded_at=payload.consent.granted_at or utc_now(),
        )
        db.add(consent)
        db.commit()
        db.refresh(patient)
        return patient
