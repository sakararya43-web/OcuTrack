from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.schemas.common import (
    AssessmentStatus,
    QualityStatus,
    TestStatus,
    ModelStatus,
    ComparisonStatus,
)


class DeviceMetadata(BaseModel):
    user_agent: str = Field(default="unknown")
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    camera_width: Optional[int] = None
    camera_height: Optional[int] = None
    frame_rate: Optional[float] = None


class LightingMetadata(BaseModel):
    method: str = Field(default="controlled_ambient")
    notes: Optional[str] = None


class CreateAssessmentPayload(BaseModel):
    patient_id: str = Field(..., description="ID of the consented patient")
    protocol_version: str = Field(default="ocutrack-protocol-0.1")
    test_type: Literal["pupil_reflex", "smooth_pursuit", "both"] = Field(
        default="both",
        description="Type of test included in this assessment session"
    )
    device_metadata: Optional[Dict[str, Any]] = None
    lighting_metadata: Optional[Dict[str, Any]] = None


# Import and re-export analysis models
from app.schemas.analysis import (
    FeatureValue,
    TimeSeriesPoint,
    PursuitSeriesPoint,
    QualityMetrics,
    PupilTestResult,
    PursuitTestResult,
    TemporalModelResult,
    FeatureDelta,
    LongitudinalComparisonResult,
)


class AssessmentDetail(BaseModel):
    assessment_id: str
    patient_id: str
    status: AssessmentStatus
    quality_status: QualityStatus
    assessment_at: datetime
    protocol_version: str
    warnings: List[str] = Field(default_factory=list)
    review_message: Optional[str] = None
    non_diagnostic_notice: Optional[str] = (
        "Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative "
        "ocular measurements for research and clinical review. It does not diagnose "
        "Parkinson’s disease, concussion, diabetic neuropathy, or any neurological condition."
    )
    features: Optional[Dict[str, Any]] = None
    quality: Optional[QualityMetrics] = None
    pupil: Optional[PupilTestResult] = None
    pursuit: Optional[PursuitTestResult] = None
    temporal_model: Optional[TemporalModelResult] = None
    longitudinal_comparison: Optional[LongitudinalComparisonResult] = None

    model_config = {
        "from_attributes": True
    }


class TargetCoordinate(BaseModel):
    t_ms: int
    x: float
    y: float


class TargetPathMetadata(BaseModel):
    path_version: str = "horizontal-sweep-v1"
    duration_ms: int = 10000
    coordinates_normalized: Optional[List[TargetCoordinate]] = None


class PupilUploadMetadata(BaseModel):
    protocol_version: str = "ocutrack-protocol-0.1"
    test_type: str = "pupil_reflex"
    captured_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    mime_type: Optional[str] = "video/webm"
    is_fallback: bool = False
    device_metadata: Optional[Dict[str, Any]] = None
    lighting_metadata: Optional[Dict[str, Any]] = None


class PursuitUploadMetadata(BaseModel):
    protocol_version: str = "ocutrack-protocol-0.1"
    test_type: str = "smooth_pursuit"
    captured_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    mime_type: Optional[str] = "video/webm"
    is_fallback: bool = False
    target_path: Optional[TargetPathMetadata] = None
    device_metadata: Optional[Dict[str, Any]] = None
