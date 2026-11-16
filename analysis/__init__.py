"""OcuTrack Analysis Engine.

Ocular computer vision, signal processing, and recording quality assessment.
"""

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import (
    ModelStatus,
    QualityResult,
    QualityStatus,
    SampledFrame,
    TestStatus,
    VideoMetadata,
)
from analysis.pipeline import analyze_assessment
from analysis.quality import assess_video_quality
from analysis.video_io import VideoReader, VideoValidationError

__version__ = "0.1.0"

__all__ = [
    "AnalysisConfig",
    "DEFAULT_CONFIG",
    "ModelStatus",
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
