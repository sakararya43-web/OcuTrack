"""OcuTrack Analysis Engine.

Ocular computer vision, signal processing, and recording quality assessment.
"""

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import (
    EyeSide,
    FaceLocalizationResult,
    ModelStatus,
    PupilMeasurement,
    QualityResult,
    QualityStatus,
    SampledFrame,
    TestStatus,
    VideoMetadata,
)
from analysis.eye_region import EyeRegionExtractor
from analysis.face_localization import FaceLocalizer, GeometricFaceLocalizer
from analysis.pipeline import analyze_assessment
from analysis.pupil_segmentation import PupilSegmenter
from analysis.pupil_tracking import PupilTracker
from analysis.quality import assess_video_quality
from analysis.video_io import VideoReader, VideoValidationError

__version__ = "0.2.0"

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
    "QualityResult",
    "QualityStatus",
    "SampledFrame",
    "TestStatus",
    "VideoMetadata",
    "VideoReader",
    "VideoValidationError",
    "analyze_assessment",
    "assess_video_quality",
]
