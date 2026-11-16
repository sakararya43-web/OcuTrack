"""Video validation, probing, decoding, and frame timestamp extraction.

Handles missing, corrupt, truncated, unsupported, or low-frame-rate videos deterministically.
"""

from pathlib import Path
from typing import Iterator, Optional, Tuple
import cv2
import numpy as np

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import VideoMetadata, SampledFrame


class VideoValidationError(Exception):
    """Raised when a video file fails basic filesystem or header validation."""

    def __init__(self, message: str, code: str = "INVALID_VIDEO"):
        super().__init__(message)
        self.code = code


def fourcc_to_string(fourcc_code: float) -> str:
    """Converts a cv2 FOURCC integer/float code into a human-readable 4-character string."""
    try:
        fourcc_int = int(fourcc_code)
        chars = [chr((fourcc_int >> (8 * i)) & 0xFF) for i in range(4)]
        return "".join(chars).strip() or "UNKNOWN"
    except Exception:
        return "UNKNOWN"


def validate_video_file(
    file_path: Path | str,
    config: AnalysisConfig = DEFAULT_CONFIG,
) -> Tuple[bool, Optional[str], int]:
    """Validates existence, file type, and file size before opening video decoder.

    Returns:
        (is_valid, error_message, file_size_bytes)
    """
    path = Path(file_path)

    if not path.exists():
        return False, f"Video file not found at path: {path}", 0

    if not path.is_file():
        return False, f"Specified path is a directory, not a video file: {path}", 0

    size_bytes = path.stat().st_size
    if size_bytes == 0:
        return False, f"Video file is empty (0 bytes): {path.name}", 0

    if size_bytes > config.max_file_size_bytes:
        max_mb = config.max_file_size_bytes / (1024 * 1024)
        curr_mb = size_bytes / (1024 * 1024)
        return (
            False,
            f"Video file size ({curr_mb:.1f} MB) exceeds maximum allowed limit ({max_mb:.1f} MB).",
            size_bytes,
        )

    suffix = path.suffix.lower()
    if suffix not in config.allowed_extensions:
        allowed = ", ".join(config.allowed_extensions)
        return (
            False,
            f"Unsupported video file extension '{suffix}'. Allowed: {allowed}.",
            size_bytes,
        )

    return True, None, size_bytes


class VideoReader:
    """Manages OpenCV VideoCapture lifecycle, metadata extraction, and safe frame streaming."""

    def __init__(self, file_path: Path | str, config: AnalysisConfig = DEFAULT_CONFIG):
        self.path = Path(file_path)
        self.config = config
        self._cap: Optional[cv2.VideoCapture] = None
        self._metadata: Optional[VideoMetadata] = None

        is_valid, err_msg, self.file_size_bytes = validate_video_file(self.path, self.config)
        if not is_valid:
            raise VideoValidationError(err_msg or "Video file validation failed.")

    def __enter__(self) -> "VideoReader":
        self.open()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def open(self) -> None:
        """Opens video capture stream."""
        if self._cap is None or not self._cap.isOpened():
            self._cap = cv2.VideoCapture(str(self.path))
            if not self._cap.isOpened():
                raise VideoValidationError(
                    f"OpenCV could not open or decode video stream: {self.path.name}",
                    code="DECODE_STREAM_FAILED",
                )

    def close(self) -> None:
        """Releases video capture resources."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def probe_metadata(self) -> VideoMetadata:
        """Probes video stream properties including frame count, FPS, and dimensions."""
        if self._metadata is not None:
            return self._metadata

        self.open()
        assert self._cap is not None

        raw_frame_count = int(self._cap.get(cv2.CAP_PROP_FRAME_COUNT))
        raw_fps = float(self._cap.get(cv2.CAP_PROP_FPS))
        width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = fourcc_to_string(self._cap.get(cv2.CAP_PROP_FOURCC))

        # Handle zero or invalid FPS
        fps = raw_fps if raw_fps > 0.0 else 0.0
        frame_count = max(0, raw_frame_count)

        # Check timestamp capability on the first frame
        timestamp_source = "hardware"
        ret, _ = self._cap.read()
        if ret:
            msec = self._cap.get(cv2.CAP_PROP_POS_MSEC)
            if msec <= 0.0:
                timestamp_source = "estimated"
            # Rewind back to beginning
            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        else:
            timestamp_source = "estimated"

        # Calculate estimated duration
        duration_seconds = (frame_count / fps) if (fps > 0 and frame_count > 0) else 0.0

        self._metadata = VideoMetadata(
            path=str(self.path),
            file_size_bytes=self.file_size_bytes,
            duration_seconds=duration_seconds,
            frame_count=frame_count,
            fps=fps,
            width=width,
            height=height,
            codec=fourcc,
            timestamp_source=timestamp_source,
        )
        return self._metadata

    def read_frames(self) -> Iterator[SampledFrame]:
        """Safely reads and yields every frame from the stream up to max_frames bound.

        Yields SampledFrame with index, timestamp in ms, validity status, and optional reason.
        """
        self.open()
        assert self._cap is not None

        meta = self.probe_metadata()
        fps = meta.fps if meta.fps > 0 else self.config.target_fps
        frame_time_step_ms = 1000.0 / fps

        frame_idx = 0
        while frame_idx < self.config.max_frames:
            ret, frame = self._cap.read()
            if not ret:
                break

            # Extract hardware pos_msec or fall back to frame_idx * dt
            pos_msec = self._cap.get(cv2.CAP_PROP_POS_MSEC)
            if pos_msec > 0.0 and meta.timestamp_source == "hardware":
                timestamp_ms = float(pos_msec)
            else:
                timestamp_ms = float(frame_idx * frame_time_step_ms)

            if frame is None or frame.size == 0:
                yield SampledFrame(
                    frame_index=frame_idx,
                    timestamp_ms=timestamp_ms,
                    frame=None,
                    is_valid=False,
                    error_reason="empty_frame_buffer",
                )
            else:
                yield SampledFrame(
                    frame_index=frame_idx,
                    timestamp_ms=timestamp_ms,
                    frame=frame,
                    is_valid=True,
                    error_reason=None,
                )

            frame_idx += 1

