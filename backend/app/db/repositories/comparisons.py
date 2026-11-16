from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import ComparisonModel


class ComparisonRepository:
    @staticmethod
    def get_by_assessment(db: Session, assessment_id: str) -> Optional[ComparisonModel]:
        return (
            db.query(ComparisonModel)
            .filter(ComparisonModel.current_assessment_id == assessment_id)
            .order_by(ComparisonModel.created_at.desc())
            .first()
        )

    @staticmethod
    def list_by_patient(db: Session, patient_id: str) -> List[ComparisonModel]:
        return (
            db.query(ComparisonModel)
            .filter(ComparisonModel.patient_id == patient_id)
            .order_by(ComparisonModel.created_at.desc())
            .all()
        )
