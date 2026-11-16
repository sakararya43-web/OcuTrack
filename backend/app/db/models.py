import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.connection import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PatientModel(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    pseudonymous_code = Column(String(100), unique=True, nullable=False, index=True)
    age_band = Column(String(50), nullable=True)
    context_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    consents = relationship(
        "ConsentModel",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(ConsentModel.recorded_at)",
    )
    assessments = relationship(
        "AssessmentModel",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(AssessmentModel.assessment_at)",
    )


class ConsentModel(Base):
    __tablename__ = "consents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_status = Column(String(50), nullable=False, default="granted")
    purpose = Column(String(200), nullable=False, default="hackathon_demo")
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("PatientModel", back_populates="consents")


class AssessmentModel(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="created")
    protocol_version = Column(String(100), nullable=False, default="ocutrack-protocol-0.1")
    device_metadata = Column(JSON, nullable=True)
    lighting_metadata = Column(JSON, nullable=True)
    quality_status = Column(String(50), nullable=False, default="pending")
    is_baseline = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("PatientModel", back_populates="assessments")
