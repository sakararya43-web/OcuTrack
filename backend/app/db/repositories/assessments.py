from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import AssessmentModel, utc_now
from app.schemas.assessments import CreateAssessmentPayload
from app.schemas.common import AssessmentStatus, QualityStatus


class AssessmentRepository:
    @staticmethod
    def get_by_id(db: Session, assessment_id: str) -> Optional[AssessmentModel]:
        return db.query(AssessmentModel).filter(AssessmentModel.id == assessment_id).first()

    @staticmethod
    def list_by_patient(db: Session, patient_id: str) -> List[AssessmentModel]:
        return (
            db.query(AssessmentModel)
            .filter(AssessmentModel.patient_id == patient_id)
            .order_by(AssessmentModel.assessment_at.desc())
            .all()
        )

    @staticmethod
    def create(db: Session, payload: CreateAssessmentPayload) -> AssessmentModel:
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
        return assessment
