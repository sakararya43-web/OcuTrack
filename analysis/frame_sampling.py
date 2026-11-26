"""Deterministic frame sampling for ocular analysis.

Ensures repeatable frame selection, downsampling when appropriate, and timestamp preservation.
"""

from typing import List, Tuple
from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import SampledFrame
from analysis.video_io import VideoReader


def determine_sampling_stride(recorded_fps: float, target_fps: float) -> int:
    """Computes deterministic integer stride based on recorded and target frame rates.

    Ensures that high-frame-rate videos (e.g. 60 FPS) are downsampled to target (e.g. 30 FPS),
    while videos at or below target FPS preserve all frames (stride = 1).
    """
    if recorded_fps <= 0 or target_fps <= 0:
        return 1

    ratio = recorded_fps / target_fps
    if ratio >= 1.75:
        return max(1, int(round(ratio)))
    return 1


def sample_frames(
    reader: VideoReader,
    config: AnalysisConfig = DEFAULT_CONFIG,
) -> Tuple[List[SampledFrame], int, int]:
    """Deterministically samples frames from VideoReader.

    Returns:
        (sampled_frames, total_frames_read, dropped_or_corrupt_count)
    """
    meta = reader.probe_metadata()
    has_reliable_fps = 1.0 <= meta.fps <= 240.0
    stride = determine_sampling_stride(meta.fps, config.target_fps) if has_reliable_fps else 1
    min_interval_ms = (1000.0 / config.target_fps) if config.target_fps > 0 else 33.33

    sampled: List[SampledFrame] = []
    total_read = 0
    corrupt_count = 0
    last_sampled_ts: float | None = None

    for frame_info in reader.read_frames():
        total_read += 1

        if not frame_info.is_valid:
            corrupt_count += 1

        if has_reliable_fps:
            should_take = frame_info.frame_index % stride == 0
        else:
            # For VFR WebM containers lacking reliable FPS headers, sample via hardware timestamps
            should_take = (
                last_sampled_ts is None
                or (frame_info.timestamp_ms - last_sampled_ts) >= (min_interval_ms * 0.85)
            )

        if should_take:
            sampled.append(frame_info)
            last_sampled_ts = frame_info.timestamp_ms
            if len(sampled) >= config.max_frames:
                break

    return sampled, total_read, corrupt_count

