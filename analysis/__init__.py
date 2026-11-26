"""OcuTrack Analysis Engine.

Ocular computer vision, signal processing, and recording quality assessment.
"""

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import (
    EyeSide,
    FaceLocalizationResult,
    ModelStatus,
    PupilMeasurement,
    PursuitMeasurement,
    QualityResult,
    QualityStatus,
    SampledFrame,
    TestStatus,
    VideoMetadata,
)
from analysis.eye_region import EyeRegionExtractor
from analysis.face_localization import FaceLocalizer, GeometricFaceLocalizer
from analysis.ml.inference import TemporalModelRunner
from analysis.pipeline import analyze_assessment
from analysis.pupil_features import extract_pupil_features
from analysis.pupil_segmentation import PupilSegmenter
from analysis.pupil_tracking import PupilTracker
from analysis.pursuit_tracking import PursuitTracker
from analysis.quality import assess_video_quality
from analysis.video_io import VideoReader, VideoValidationError

# Optional ML training / visualization exports (require sklearn, torch, matplotlib)
try:
    from analysis.ml.baseline import StatisticalBaseline
except ImportError:  # pragma: no cover - optional ML dependency
    StatisticalBaseline = None  # type: ignore[assignment,misc]

try:
    from analysis.ml.tcn import TemporalConvNet
except ImportError:  # pragma: no cover - optional ML dependency
    TemporalConvNet = None  # type: ignore[assignment,misc]

try:
    from analysis.visualization import plot_pupil_response, plot_pursuit_tracking
except ImportError:  # pragma: no cover - optional plotting dependency
    plot_pupil_response = None  # type: ignore[assignment]
    plot_pursuit_tracking = None  # type: ignore[assignment]

__version__ = "0.4.0"

__all__ = [
    "AnalysisConfig",
    "DEFAULT_CONFIG",
    "EyeRegionExtractor",
    "EyeSide",
    "FaceLocalizationResult",
    "FaceLocalizer",
    "GeometricFaceLocalizer",
    "ModelStatus",
    "PupilMeasurement",
    "PupilSegmenter",
    "PupilTracker",
    "PursuitMeasurement",
    "PursuitTracker",
    "QualityResult",
    "QualityStatus",
    "SampledFrame",
    "StatisticalBaseline",
    "TemporalConvNet",
    "TemporalModelRunner",
    "TestStatus",
    "VideoMetadata",
    "VideoReader",
    "VideoValidationError",
    "analyze_assessment",
    "assess_video_quality",
    "extract_pupil_features",
    "plot_pupil_response",
    "plot_pursuit_tracking",
]
