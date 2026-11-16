from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.schemas.common import (
    QualityStatus,
    TestStatus,
    ModelStatus,
    ComparisonStatus,
)


class FeatureValue(BaseModel):
    value: Optional[float] = None
    unit: str
    label: str


class TimeSeriesPoint(BaseModel):
    t_ms: int
    value: Optional[float] = None
    valid: bool = True


class PursuitSeriesPoint(BaseModel):
    t_ms: int
    target_x: Optional[float] = None
    eye_x: Optional[float] = None
    valid: bool = True


class QualityMetrics(BaseModel):
    status: QualityStatus = QualityStatus.PENDING
    usable_frame_ratio: Optional[float] = None
    warnings: List[str] = Field(default_factory=list)


class PupilTestResult(BaseModel):
    status: TestStatus = TestStatus.NOT_PROVIDED
    features: Optional[Dict[str, FeatureValue]] = None
    series: Optional[List[TimeSeriesPoint]] = None


class PursuitTestResult(BaseModel):
    status: TestStatus = TestStatus.NOT_PROVIDED
    features: Optional[Dict[str, FeatureValue]] = None
    series: Optional[List[PursuitSeriesPoint]] = None


class TemporalModelResult(BaseModel):
    status: ModelStatus = ModelStatus.NOT_CONFIGURED
    model_name: Optional[str] = "TCN-Temporal-Evaluator-v0.1"
    model_version: Optional[str] = None
    output: Optional[Dict[str, Any]] = None
    notes: Optional[str] = "Experimental model output; not clinically validated."


class FeatureDelta(BaseModel):
    delta: Optional[float] = None
    percentage_delta: Optional[float] = None
    unit: str
    direction: Optional[Literal["increased", "decreased", "stable", "unknown"]] = None


class LongitudinalComparisonResult(BaseModel):
    status: ComparisonStatus = ComparisonStatus.NOT_AVAILABLE
    baseline_id: Optional[str] = None
    comparability_reason: Optional[str] = None
    feature_deltas: Optional[Dict[str, FeatureDelta]] = None
