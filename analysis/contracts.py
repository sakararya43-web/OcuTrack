"""Data contracts and schemas for OcuTrack analysis engine.

Adheres strictly to adityaImplementation.md Section 5 and docs/integration-contract.md.
"""

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
import math
import numpy as np


class QualityStatus(str, Enum):
    ACCEPTABLE = "acceptable"
    INSUFFICIENT = "insufficient"
    PENDING = "pending"


class TestStatus(str, Enum):
    __test__ = False
    COMPLETE = "complete"
    INSUFFICIENT_QUALITY = "insufficient_quality"
    FAILED = "failed"
    NOT_PROVIDED = "not_provided"


class ModelStatus(str, Enum):
    NOT_CONFIGURED = "not_configured"
    EXPERIMENTAL = "experimental"
    EVALUATED = "evaluated"
    FAILED = "failed"


class EyeSide(str, Enum):
    LEFT = "left"
    RIGHT = "right"
    AUTO = "auto"


@dataclass
class FaceLocalizationResult:
    """Localized facial and ocular boundaries extracted from a frame."""

    face_detected: bool
    face_count: int = 0
    face_bbox: Optional[tuple[int, int, int, int]] = None  # (x, y, w, h)
    left_eye_bbox: Optional[tuple[int, int, int, int]] = None
    right_eye_bbox: Optional[tuple[int, int, int, int]] = None
    left_eye_open_ratio: Optional[float] = None
    right_eye_open_ratio: Optional[float] = None
    head_yaw: Optional[float] = None
    head_pitch: Optional[float] = None
    landmarks_count: int = 0
    detector_backend: str = "mediapipe"


@dataclass
class PupilMeasurement:
    """Per-frame pupil localization and metric estimation."""

    frame_index: int
    t_ms: int
    eye_side: str
    center_x: Optional[float] = None
    center_y: Optional[float] = None
    crop_center_x: Optional[float] = None
    crop_center_y: Optional[float] = None
    diameter: Optional[float] = None
    confidence: float = 0.0
    valid: bool = True
    error_reason: Optional[str] = None

    def to_series_point(self) -> Dict[str, Any]:
        """Converts to the schema series point for integration output."""
        return {
            "t_ms": int(self.t_ms),
            "diameter": round(float(self.diameter), 2) if (self.valid and self.diameter is not None) else None,
            "valid": bool(self.valid),
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_index": int(self.frame_index),
            "t_ms": int(self.t_ms),
            "eye_side": self.eye_side,
            "center_x": round(float(self.center_x), 2) if self.center_x is not None else None,
            "center_y": round(float(self.center_y), 2) if self.center_y is not None else None,
            "diameter": round(float(self.diameter), 2) if self.diameter is not None else None,
            "confidence": round(float(self.confidence), 4),
            "valid": bool(self.valid),
            "error_reason": self.error_reason,
        }


@dataclass
class PursuitMeasurement:
    """Per-frame eye position, target alignment, and tracking error."""

    frame_index: int
    t_ms: int
    eye_x: Optional[float] = None
    eye_y: Optional[float] = None
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    tracking_error: Optional[float] = None
    head_yaw: Optional[float] = None
    head_pitch: Optional[float] = None
    valid: bool = True
    error_reason: Optional[str] = None

    def to_series_point(self) -> Dict[str, Any]:
        """Converts to the schema series point for integration output."""
        return {
            "t_ms": int(self.t_ms),
            "eye_x": round(float(self.eye_x), 4) if (self.valid and self.eye_x is not None) else None,
            "eye_y": round(float(self.eye_y), 4) if (self.valid and self.eye_y is not None) else None,
            "target_x": round(float(self.target_x), 4) if self.target_x is not None else None,
            "target_y": round(float(self.target_y), 4) if self.target_y is not None else None,
            "tracking_error": round(float(self.tracking_error), 4) if (self.valid and self.tracking_error is not None) else None,
            "valid": bool(self.valid),
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_index": int(self.frame_index),
            "t_ms": int(self.t_ms),
            "eye_x": round(float(self.eye_x), 4) if self.eye_x is not None else None,
            "eye_y": round(float(self.eye_y), 4) if self.eye_y is not None else None,
            "target_x": round(float(self.target_x), 4) if self.target_x is not None else None,
            "target_y": round(float(self.target_y), 4) if self.target_y is not None else None,
            "tracking_error": round(float(self.tracking_error), 4) if self.tracking_error is not None else None,
            "head_yaw": round(float(self.head_yaw), 1) if self.head_yaw is not None else None,
            "head_pitch": round(float(self.head_pitch), 1) if self.head_pitch is not None else None,
            "valid": bool(self.valid),
            "error_reason": self.error_reason,
        }


@dataclass
class VideoMetadata:
    """Metadata extracted during video decoding and probing."""

    path: str
    file_size_bytes: int
    duration_seconds: float
    frame_count: int
    fps: float
    width: int
    height: int
    codec: str
    timestamp_source: str  # "hardware" or "estimated"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "file_size_bytes": int(self.file_size_bytes),
            "duration_seconds": round(float(self.duration_seconds), 3),
            "frame_count": int(self.frame_count),
            "fps": round(float(self.fps), 2),
            "width": int(self.width),
            "height": int(self.height),
            "codec": self.codec,
            "timestamp_source": self.timestamp_source,
        }


@dataclass
class SampledFrame:
    """A sampled video frame along with original temporal and validity metadata."""

    frame_index: int
    timestamp_ms: float
    frame: Optional[np.ndarray] = None
    is_valid: bool = True
    error_reason: Optional[str] = None


@dataclass
class QualityResult:
    """Structured quality assessment report."""

    status: QualityStatus
    usable_frame_ratio: float
    warnings: List[str] = field(default_factory=list)
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value if isinstance(self.status, QualityStatus) else str(self.status),
            "usable_frame_ratio": round(float(self.usable_frame_ratio), 4),
            "warnings": list(self.warnings),
            "details": to_json_serializable(self.details),
        }


def to_json_serializable(val: Any) -> Any:
    """Convert numpy types, paths, floats (handling NaN/Inf), and dataclasses to native JSON types."""
    if val is None:
        return None
    if isinstance(val, (str, bool)):
        return val
    if isinstance(val, (int, np.integer)):
        return int(val)
    if isinstance(val, (float, np.floating)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    if isinstance(val, (Path,)):
        return str(val)
    if isinstance(val, Enum):
        return val.value
    if isinstance(val, (list, tuple, set)):
        return [to_json_serializable(item) for item in val]
    if isinstance(val, dict):
        return {str(k): to_json_serializable(v) for k, v in val.items()}
    if hasattr(val, "to_dict") and callable(val.to_dict):
        return val.to_dict()
    if isinstance(val, np.ndarray):
        return [to_json_serializable(x) for x in val.tolist()]
    return str(val)

