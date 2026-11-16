from enum import Enum


class AssessmentStatus(str, Enum):
    CREATED = "created"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class TestStatus(str, Enum):
    COMPLETE = "complete"
    INSUFFICIENT_QUALITY = "insufficient_quality"
    FAILED = "failed"
    NOT_PROVIDED = "not_provided"


class QualityStatus(str, Enum):
    PENDING = "pending"
    ACCEPTABLE = "acceptable"
    INSUFFICIENT = "insufficient"


class ModelStatus(str, Enum):
    NOT_CONFIGURED = "not_configured"
    EXPERIMENTAL = "experimental"
    EVALUATED = "evaluated"
    FAILED = "failed"


class ComparisonStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    COMPARABLE = "comparable"
    NOT_COMPARABLE = "not_comparable"
