"""Unit and integration tests for Phase 1: Video ingestion, decoding, and quality assessment.

Verifies deterministic frame sampling, error handling, quality evaluation, and schema contract.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path
import cv2
import numpy as np
import pytest

from analysis.config import AnalysisConfig
from analysis.contracts import (
    ModelStatus,
    QualityStatus,
    TestStatus,
    to_json_serializable,
)
from analysis.frame_sampling import determine_sampling_stride, sample_frames
from analysis.pipeline import analyze_assessment
from analysis.quality import assess_video_quality
from analysis.video_io import (
    VideoReader,
    VideoValidationError,
    fourcc_to_string,
    validate_video_file,
)


def create_synthetic_video(
    output_path: Path,
    duration_sec: float = 3.0,
    fps: float = 30.0,
    width: int = 640,
    height: int = 480,
    fourcc: str = "mp4v",
) -> Path:
    """Helper creating a deterministic synthetic video with moving pattern for testing."""
    total_frames = int(duration_sec * fps)
    fourcc_code = cv2.VideoWriter_fourcc(*fourcc)
    writer = cv2.VideoWriter(str(output_path), fourcc_code, fps, (width, height))

    try:
        for i in range(total_frames):
            frame = np.full((height, width, 3), 230, dtype=np.uint8)
            # Draw face oval
            fx, fy, fw, fh = int(width * 0.25), int(height * 0.15), int(width * 0.5), int(height * 0.7)
            cv2.ellipse(frame, (fx + fw // 2, fy + fh // 2), (fw // 2, fh // 2), 0, 0, 360, (200, 180, 160), -1)
            # Draw eyes with dark pupils
            cv2.circle(frame, (fx + int(fw * 0.3), fy + int(fh * 0.35)), 12, (20, 20, 20), -1)
            cv2.circle(frame, (fx + int(fw * 0.7), fy + int(fh * 0.35)), 12, (20, 20, 20), -1)
            writer.write(frame)
    finally:
        writer.release()

    return output_path


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


@pytest.fixture
def valid_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "valid_30fps.mp4"
    return create_synthetic_video(vid_path, duration_sec=3.0, fps=30.0)


@pytest.fixture
def too_short_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "short_0_5s.mp4"
    return create_synthetic_video(vid_path, duration_sec=0.5, fps=30.0)


@pytest.fixture
def low_fps_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "low_5fps.mp4"
    return create_synthetic_video(vid_path, duration_sec=3.5, fps=5.0)


@pytest.fixture
def rural_10fps_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "rural_10fps_qvga.mp4"
    return create_synthetic_video(vid_path, duration_sec=3.0, fps=10.0, width=320, height=240)


@pytest.fixture
def high_fps_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "high_60fps.mp4"
    return create_synthetic_video(vid_path, duration_sec=2.0, fps=60.0)


@pytest.fixture
def zero_byte_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "zero_byte.mp4"
    vid_path.touch()
    return vid_path


@pytest.fixture
def corrupt_video(temp_dir: Path) -> Path:
    vid_path = temp_dir / "corrupted.mp4"
    vid_path.write_bytes(b"\x00\x00\x00\x18ftypmp42fakecorruptedstreamheader" * 50)
    return vid_path


# =========================================================================
# Video IO & Validation Tests
# =========================================================================

def test_validate_video_file_nonexistent(temp_dir: Path):
    non_existent = temp_dir / "missing.mp4"
    is_valid, msg, size = validate_video_file(non_existent)
    assert not is_valid
    assert "not found" in msg.lower()
    assert size == 0


def test_validate_video_file_zero_byte(zero_byte_video: Path):
    is_valid, msg, size = validate_video_file(zero_byte_video)
    assert not is_valid
    assert "0 bytes" in msg
    assert size == 0


def test_validate_video_file_unsupported_extension(temp_dir: Path):
    bad_ext = temp_dir / "recording.txt"
    bad_ext.write_text("not a video")
    is_valid, msg, size = validate_video_file(bad_ext)
    assert not is_valid
    assert "unsupported video file extension" in msg.lower()


def test_validate_video_file_oversized(temp_dir: Path):
    cfg = AnalysisConfig(max_file_size_bytes=100)
    oversized = temp_dir / "large.mp4"
    oversized.write_bytes(b"x" * 200)
    is_valid, msg, size = validate_video_file(oversized, config=cfg)
    assert not is_valid
    assert "exceeds maximum allowed limit" in msg.lower()


def test_video_reader_metadata_probing(valid_video: Path):
    with VideoReader(valid_video) as reader:
        meta = reader.probe_metadata()
        assert meta.frame_count >= 85
        assert meta.fps >= 29.0
        assert meta.width == 640
        assert meta.height == 480
        assert meta.duration_seconds >= 2.8
        assert meta.timestamp_source in ("hardware", "estimated")


def test_video_reader_corrupt_file_raises_validation_error(corrupt_video: Path):
    with pytest.raises(VideoValidationError) as exc_info:
        with VideoReader(corrupt_video) as reader:
            list(reader.read_frames())
    assert "decode stream failed" in str(exc_info.value).lower() or "could not open" in str(exc_info.value).lower()


# =========================================================================
# Deterministic Frame Sampling Tests
# =========================================================================

def test_determine_sampling_stride():
    assert determine_sampling_stride(60.0, 30.0) == 2
    assert determine_sampling_stride(30.0, 30.0) == 1
    assert determine_sampling_stride(15.0, 30.0) == 1
    assert determine_sampling_stride(0.0, 30.0) == 1


def test_deterministic_sampling_reproducibility(valid_video: Path):
    with VideoReader(valid_video) as reader1:
        sampled1, total1, corrupt1 = sample_frames(reader1)

    with VideoReader(valid_video) as reader2:
        sampled2, total2, corrupt2 = sample_frames(reader2)

    assert total1 == total2
    assert corrupt1 == corrupt2 == 0
    assert len(sampled1) == len(sampled2)

    # Check timestamps and indices are exactly identical
    for f1, f2 in zip(sampled1, sampled2):
        assert f1.frame_index == f2.frame_index
        assert f1.timestamp_ms == pytest.approx(f2.timestamp_ms)
        assert f1.is_valid == f2.is_valid


def test_sampling_downsamples_high_fps(high_fps_video: Path):
    with VideoReader(high_fps_video) as reader:
        sampled, total, corrupt = sample_frames(reader, AnalysisConfig(target_fps=30.0))
        # 60fps downsampled with stride 2
        assert total >= 110
        assert len(sampled) == pytest.approx(total / 2, abs=2)


# =========================================================================
# Quality Assessment Tests
# =========================================================================

def test_assess_video_quality_valid_video(valid_video: Path):
    res = assess_video_quality(valid_video)
    assert res.status == QualityStatus.ACCEPTABLE
    assert res.usable_frame_ratio >= 0.95
    assert res.details["frame_count"] >= 85
    assert res.details["fps"] >= 29.0


def test_assess_video_quality_too_short(too_short_video: Path):
    res = assess_video_quality(too_short_video)
    assert res.status == QualityStatus.INSUFFICIENT
    warning_texts = " ".join(res.warnings).lower()
    assert "shorter than protocol minimum" in warning_texts or "insufficient frame count" in warning_texts


def test_assess_video_quality_low_fps(low_fps_video: Path):
    res = assess_video_quality(low_fps_video)
    assert res.status == QualityStatus.INSUFFICIENT
    warning_texts = " ".join(res.warnings).lower()
    assert "low frame rate" in warning_texts


def test_assess_video_quality_rural_low_fps_and_qvga_accepted(rural_10fps_video: Path):
    res = assess_video_quality(rural_10fps_video)
    assert res.status == QualityStatus.ACCEPTABLE
    assert res.details["frame_count"] >= 28
    warning_texts = " ".join(res.warnings).lower()
    assert "low-fps clinic device" in warning_texts


def test_video_reader_preserves_all_frames_without_seek(valid_video: Path):
    with VideoReader(valid_video) as reader:
        meta = reader.probe_metadata()
        frames_first_pass = list(reader.read_frames())
        frames_second_pass = list(reader.read_frames())

    assert len(frames_first_pass) == meta.frame_count
    assert len(frames_second_pass) == meta.frame_count
    assert frames_first_pass[0].frame_index == 0
    assert frames_first_pass[1].frame_index == 1


def test_assess_video_quality_missing_file(temp_dir: Path):
    missing_file = temp_dir / "does_not_exist.mp4"
    res = assess_video_quality(missing_file)
    assert res.status == QualityStatus.INSUFFICIENT
    assert res.usable_frame_ratio == 0.0
    assert any("not found" in w.lower() for w in res.warnings)


def test_assess_video_quality_zero_byte(zero_byte_video: Path):
    res = assess_video_quality(zero_byte_video)
    assert res.status == QualityStatus.INSUFFICIENT
    assert res.usable_frame_ratio == 0.0
    assert any("0 bytes" in w.lower() for w in res.warnings)


# =========================================================================
# Top-level Analysis Assessment Pipeline Tests
# =========================================================================

def test_analyze_assessment_both_valid(valid_video: Path):
    output = analyze_assessment(
        pupil_video_path=valid_video,
        pursuit_video_path=valid_video,
        pupil_metadata={"test_type": "pupil_reflex"},
        pursuit_metadata={"test_type": "smooth_pursuit"},
    )
    assert output["pipeline_version"] == "0.1.0"
    assert output["quality"]["status"] == "acceptable"
    assert output["quality"]["usable_frame_ratio"] >= 0.95
    assert output["pupil"]["status"] == "complete"
    assert output["pursuit"]["status"] == "complete"
    assert output["temporal_model"]["status"] == "not_configured"

    # Verify schema compliance and units
    for feat_name, feat_obj in output["pupil"]["features"].items():
        assert "unit" in feat_obj
        assert "label" in feat_obj
        assert feat_obj["value"] is None or isinstance(feat_obj["value"], (int, float))

    for feat_name, feat_obj in output["pursuit"]["features"].items():
        assert "unit" in feat_obj
        assert "label" in feat_obj
        assert feat_obj["value"] is None or isinstance(feat_obj["value"], (int, float))


def test_analyze_assessment_pupil_only_valid(valid_video: Path):
    output = analyze_assessment(pupil_video_path=valid_video)
    assert output["quality"]["status"] == "acceptable"
    assert output["pupil"]["status"] == "complete"
    assert output["pursuit"]["status"] == "not_provided"
    assert output["pursuit"]["features"] is None


def test_analyze_assessment_insufficient_quality_sets_appropriate_statuses(too_short_video: Path):
    output = analyze_assessment(pupil_video_path=too_short_video)
    assert output["quality"]["status"] == "insufficient"
    assert output["pupil"]["status"] == "insufficient_quality"
    assert len(output["quality"]["warnings"]) > 0


def test_analyze_assessment_no_videos_provided():
    output = analyze_assessment()
    assert output["quality"]["status"] == "insufficient"
    assert output["pupil"]["status"] == "not_provided"
    assert output["pursuit"]["status"] == "not_provided"


def test_to_json_serializable_handles_all_types():
    raw = {
        "float_nan": float("nan"),
        "float_inf": float("inf"),
        "np_int": np.int64(42),
        "np_float": np.float64(3.14),
        "np_arr": np.array([1, 2, 3]),
        "path": Path("some/video.mp4"),
        "status": QualityStatus.ACCEPTABLE,
    }
    serializable = to_json_serializable(raw)
    json_str = json.dumps(serializable)
    decoded = json.loads(json_str)

    assert decoded["float_nan"] is None
    assert decoded["float_inf"] is None
    assert decoded["np_int"] == 42
    assert decoded["np_float"] == pytest.approx(3.14)
    assert decoded["np_arr"] == [1, 2, 3]
    assert decoded["status"] == "acceptable"


# =========================================================================
# CLI Integration Tests
# =========================================================================

def test_cli_single_video_inspection(valid_video: Path):
    cmd = [sys.executable, "-m", "analysis.cli", str(valid_video), "--json"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 0
    data = json.loads(proc.stdout)
    assert data["status"] == "acceptable"
    assert data["usable_frame_ratio"] >= 0.95


def test_cli_insufficient_quality_exits_with_code_1(too_short_video: Path):
    cmd = [sys.executable, "-m", "analysis.cli", str(too_short_video), "--json"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 1
    data = json.loads(proc.stdout)
    assert data["status"] == "insufficient"


def test_cli_assessment_mode(valid_video: Path):
    cmd = [
        sys.executable,
        "-m",
        "analysis.cli",
        "--pupil",
        str(valid_video),
        "--pursuit",
        str(valid_video),
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 0
    data = json.loads(proc.stdout)
    assert data["pipeline_version"] == "0.1.0"
    assert data["quality"]["status"] == "acceptable"

