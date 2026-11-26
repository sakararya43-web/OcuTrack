"""Recording quality assessment for OcuTrack analysis engine.

Computes technical video quality metrics, bounds, and warnings without fabricating physiological conclusions.
"""

from pathlib import Path
from typing import Optional, List, Dict, Any

from analysis.config import AnalysisConfig, DEFAULT_CONFIG
from analysis.contracts import QualityStatus, QualityResult, to_json_serializable
from analysis.video_io import VideoReader, VideoValidationError, validate_video_file
from analysis.frame_sampling import sample_frames


def assess_video_quality(
    video_path: Path | str,
    config: Optional[AnalysisConfig] = None,
) -> QualityResult:
    """Evaluates recording quality for a single video file against protocol engineering bounds.

    Returns a structured QualityResult with status ('acceptable' | 'insufficient'),
    usable_frame_ratio, human-readable warnings, and granular technical details.
    """
    cfg = config or DEFAULT_CONFIG
    path = Path(video_path)
    warnings: List[str] = []

    # 1. File system validation
    is_valid_file, file_err, file_size = validate_video_file(path, cfg)
    if not is_valid_file:
        return QualityResult(
            status=QualityStatus.INSUFFICIENT,
            usable_frame_ratio=0.0,
            warnings=[file_err or "Video file validation failed."],
            details={
                "path": str(path),
                "file_size_bytes": file_size,
                "file_exists": path.exists(),
            },
        )

    # 2. Decoder initialization
    try:
        reader = VideoReader(path, cfg)
        with reader:
            try:
                meta = reader.probe_metadata()
            except Exception as e:
                return QualityResult(
                    status=QualityStatus.INSUFFICIENT,
                    usable_frame_ratio=0.0,
                    warnings=[f"Failed to probe video stream metadata: {str(e)}"],
                    details={"path": str(path), "file_size_bytes": file_size},
                )

            # 3. Sample frames and detect corruption/dropped frames
            try:
                sampled, total_read, corrupt_count = sample_frames(reader, cfg)
            except Exception as e:
                return QualityResult(
                    status=QualityStatus.INSUFFICIENT,
                    usable_frame_ratio=0.0,
                    warnings=[f"Error occurred during frame decoding: {str(e)}"],
                    details=meta.to_dict(),
                )
    except VideoValidationError as e:
        return QualityResult(
            status=QualityStatus.INSUFFICIENT,
            usable_frame_ratio=0.0,
            warnings=[f"Failed to initialize video decoder: {str(e)}"],
            details={"path": str(path), "file_size_bytes": file_size},
        )
    except Exception as e:
        return QualityResult(
            status=QualityStatus.INSUFFICIENT,
            usable_frame_ratio=0.0,
            warnings=[f"Failed to initialize video decoder: {str(e)}"],
            details={"path": str(path), "file_size_bytes": file_size},
        )

    # 4. Compute usable frame ratio
    if total_read > 0:
        usable_ratio = max(0.0, min(1.0, (total_read - corrupt_count) / total_read))
    else:
        usable_ratio = 0.0

    # 5. Evaluate engineering bounds and assemble warnings
    critical_failure = False

    # Compute effective FPS & duration (supports VFR WebM where container FPS header is 0 or 1000)
    effective_fps = meta.fps
    if (effective_fps <= 0.0 or effective_fps > 240.0) and len(sampled) >= 2:
        ts_span_sec = (sampled[-1].timestamp_ms - sampled[0].timestamp_ms) / 1000.0
        if ts_span_sec > 0.0 and total_read > 1:
            effective_fps = (total_read - 1) / ts_span_sec

    # Frame count check
    if total_read < cfg.min_frames:
        warnings.append(
            f"Insufficient frame count ({total_read} frames read; minimum required: {cfg.min_frames})."
        )
        critical_failure = True

    # FPS check (rural clinic devices in dim light often drop to 8-14 FPS)
    if effective_fps < cfg.min_fps:
        warnings.append(
            f"Low frame rate ({effective_fps:.1f} FPS is below technical minimum of {cfg.min_fps:.1f} FPS)."
        )
        critical_failure = True
    elif effective_fps < cfg.recommended_fps:
        frame_window_ms = 1000.0 / max(effective_fps, 1.0)
        warnings.append(
            f"Low-FPS clinic device detected ({effective_fps:.1f} FPS; standard is {cfg.recommended_fps:.1f} FPS). "
            f"Accepted for rural-clinic screening; latency precision has a ~{frame_window_ms:.0f}ms frame window."
        )

    # Duration check (prefer hardware timestamp span when available, else frames / effective_fps)
    if len(sampled) >= 2 and sampled[-1].timestamp_ms > sampled[0].timestamp_ms and (
        meta.timestamp_source == "hardware" or meta.fps <= 0.0
    ):
        actual_duration = (sampled[-1].timestamp_ms - sampled[0].timestamp_ms) / 1000.0
    else:
        actual_duration = (total_read / effective_fps) if effective_fps > 0 else 0.0

    if actual_duration < cfg.min_duration_sec:
        warnings.append(
            f"Video duration ({actual_duration:.2f}s) is shorter than protocol minimum ({cfg.min_duration_sec:.1f}s)."
        )
        critical_failure = True
    elif actual_duration > cfg.max_duration_sec:
        warnings.append(
            f"Video duration ({actual_duration:.2f}s) exceeds maximum protocol threshold ({cfg.max_duration_sec:.1f}s)."
        )
        critical_failure = True

    # Resolution check (orientation-agnostic non-critical warning for portrait mobile & QVGA webcams)
    short_side = min(meta.width, meta.height)
    long_side = max(meta.width, meta.height)
    min_short = min(cfg.min_width, cfg.min_height)
    min_long = max(cfg.min_width, cfg.min_height)
    if meta.width > 0 and meta.height > 0 and (short_side < min_short or long_side < min_long):
        warnings.append(
            f"Video resolution ({meta.width}x{meta.height}) is lower than recommended minimum ({cfg.min_width}x{cfg.min_height})."
        )

    # Usable frame ratio check
    if corrupt_count > 0:
        warnings.append(f"{corrupt_count} dropped or unreadable frames detected during decode.")

    if usable_ratio < cfg.min_usable_frame_ratio:
        warnings.append(
            f"Usable frame ratio ({usable_ratio * 100:.1f}%) is below minimum threshold ({cfg.min_usable_frame_ratio * 100:.1f}%)."
        )
        critical_failure = True
    elif usable_ratio < cfg.recommended_usable_frame_ratio:
        warnings.append(
            f"Moderate frame drop detected ({usable_ratio * 100:.1f}% usable; ideal >= {cfg.recommended_usable_frame_ratio * 100:.0f}%). "
            "Accepted under low-resource clinic tolerance."
        )

    # Timestamp source info
    if meta.timestamp_source == "estimated":
        warnings.append(
            "Hardware frame timestamps unavailable from container; timestamps estimated from stream FPS."
        )

    # Determine status
    status = QualityStatus.INSUFFICIENT if critical_failure else QualityStatus.ACCEPTABLE

    details: Dict[str, Any] = {
        "path": str(path),
        "file_size_bytes": file_size,
        "duration_seconds": round(actual_duration, 3),
        "frame_count": total_read,
        "sampled_count": len(sampled),
        "fps": round(effective_fps, 2),
        "width": meta.width,
        "height": meta.height,
        "codec": meta.codec,
        "timestamp_source": meta.timestamp_source,
        "corrupt_frames_count": corrupt_count,
        "usable_frame_ratio": round(usable_ratio, 4),
    }

    return QualityResult(
        status=status,
        usable_frame_ratio=round(usable_ratio, 4),
        warnings=warnings,
        details=details,
    )

