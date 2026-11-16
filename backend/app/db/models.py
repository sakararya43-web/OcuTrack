import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Boolean,
    Float,
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
    test_type = Column(String(50), nullable=False, default="both")
    protocol_version = Column(String(100), nullable=False, default="ocutrack-protocol-0.1")
    device_metadata = Column(JSON, nullable=True)
    lighting_metadata = Column(JSON, nullable=True)
    quality_status = Column(String(50), nullable=False, default="pending")
    is_baseline = Column(Boolean, nullable=False, default=False)
    
    # Upload tracking and temporary file paths
    pupil_video_path = Column(String(500), nullable=True)
    pursuit_video_path = Column(String(500), nullable=True)
    pupil_metadata = Column(JSON, nullable=True)
    pursuit_metadata = Column(JSON, nullable=True)
    
    # Analysis & report summary fields
    warnings = Column(JSON, nullable=True, default=list)
    review_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("PatientModel", back_populates="assessments")
    measurements = relationship(
        "MeasurementModel",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="MeasurementModel.created_at",
    )
    model_runs = relationship(
        "ModelRunModel",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="desc(ModelRunModel.created_at)",
    )
    comparisons = relationship(
        "ComparisonModel",
        foreign_keys="ComparisonModel.current_assessment_id",
        back_populates="current_assessment",
        cascade="all, delete-orphan",
        order_by="desc(ComparisonModel.created_at)",
    )


class MeasurementModel(Base):
    __tablename__ = "measurements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    test_type = Column(String(50), nullable=False)
    feature_name = Column(String(100), nullable=False)
    feature_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    series_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assessment = relationship("AssessmentModel", back_populates="measurements")


class ModelRunModel(Base):
    __tablename__ = "model_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    input_schema_version = Column(String(50), nullable=False, default="v1")
    status = Column(String(50), nullable=False)
    output = Column(JSON, nullable=True)
    evaluation_context = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assessment = relationship("AssessmentModel", back_populates="model_runs")


class ComparisonModel(Base):
    __tablename__ = "comparisons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    current_assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    baseline_assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    comparable = Column(Boolean, nullable=False, default=False)
    feature_deltas = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    review_message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("PatientModel")
    current_assessment = relationship("AssessmentModel", foreign_keys=[current_assessment_id], back_populates="comparisons")
    baseline_assessment = relationship("AssessmentModel", foreign_keys=[baseline_assessment_id])


