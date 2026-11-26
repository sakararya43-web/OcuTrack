from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import QualityStatus, AssessmentStatus


class ConsentPayload(BaseModel):
    consent_status: Literal["granted", "denied", "withdrawn", "not_recorded"] = Field(
        default="granted",
        description="Patient consent status"
    )
    purpose: str = Field(
        default="hackathon_demo",
        description="Consent purpose"
    )
    granted_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when consent was recorded"
    )


class CreatePatientPayload(BaseModel):
    pseudonymous_code: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique pseudonymous code identifying the patient, e.g. OT-0001"
    )
    age_band: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Broad age bracket, e.g. '40-49'"
    )
    context_notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Non-identifiable contextual notes"
    )
    consent: ConsentPayload = Field(
        ...,
        description="Patient consent record"
    )

    @field_validator("pseudonymous_code")
    @classmethod
    def validate_pseudonymous_code(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("pseudonymous_code cannot be empty or whitespace only")
        return trimmed


class PatientResponse(BaseModel):
    patient_id: str
    pseudonymous_code: str
    age_band: Optional[str] = None
    context_notes: Optional[str] = None
    consent_status: str
    consent_purpose: Optional[str] = None
    created_at: datetime
    last_assessment_date: Optional[datetime] = None
    last_quality_status: Optional[str] = None
    feature_change_recorded: Optional[bool] = None
    assessment_count: int = 0
    latest_assessment_id: Optional[str] = None
    latest_assessment_status: Optional[str] = None
    latest_completed_assessment_id: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


class AssessmentSummary(BaseModel):
    assessment_id: str
    patient_id: str
    pseudonymous_code: Optional[str] = None
    test_type: Optional[str] = None
    is_baseline: bool = False
    status: AssessmentStatus
    quality_status: QualityStatus
    assessment_at: datetime
    protocol_version: str
    warnings: List[str] = []
    review_message: Optional[str] = None
    features: Optional[Dict[str, Any]] = None

    model_config = {
        "from_attributes": True
    }
