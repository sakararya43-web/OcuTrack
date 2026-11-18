"""Configuration settings and quality thresholds for OcuTrack analysis engine.

Thresholds are engineering bounds based on web-based ocular tracking protocol requirements.
"""

from dataclasses import dataclass
from typing import Any, Dict, Tuple


@dataclass(frozen=True)
class AnalysisConfig:
    """Configurable quality thresholds, bounds, and sampling parameters."""

    # Duration bounds (in seconds)
    min_duration_sec: float = 2.0
    max_duration_sec: float = 60.0

    # Frame rate thresholds (in FPS)
    min_fps: float = 15.0
    target_fps: float = 30.0

    # Frame count limits
    min_frames: int = 30
    max_frames: int = 1800

    # Quality ratio threshold: minimum proportion of successfully decoded frames
    min_usable_frame_ratio: float = 0.80

    # Dimension bounds
    min_width: int = 320
    min_height: int = 240
    recommended_width: int = 1280
    recommended_height: int = 720

    # File size limits (50 MB default to prevent resource exhaustion)
    max_file_size_bytes: int = 50 * 1024 * 1024

    # Supported video container formats
    allowed_extensions: Tuple[str, ...] = (
        ".mp4",
        ".webm",
        ".mov",
        ".avi",
        ".mkv",
    )

    @classmethod
    def from_dict(cls, data: Dict[str, Any] | None) -> "AnalysisConfig":
        """Build an AnalysisConfig from an optional dictionary, ignoring unknown keys."""
        if not data:
            return cls()

        valid_keys = {
            "min_duration_sec",
            "max_duration_sec",
            "min_fps",
            "target_fps",
            "min_frames",
            "max_frames",
            "min_usable_frame_ratio",
            "min_width",
            "min_height",
            "recommended_width",
            "recommended_height",
            "max_file_size_bytes",
        }
        filtered = {k: v for k, v in data.items() if k in valid_keys and v is not None}
        return cls(**filtered)


DEFAULT_CONFIG = AnalysisConfig()
