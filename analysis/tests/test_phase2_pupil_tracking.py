"""Unit and integration tests for Phase 2: Eye localization and pupil segmentation/tracking.

Verifies face/eye localization, OpenCV pupil segmentation accuracy against ground truth,
blink detection, temporal continuity, and pipeline series output.
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
from analysis.contracts import EyeSide, FaceLocalizationResult, QualityStatus, TestStatus
from analysis.eye_region import EyeRegionExtractor
from analysis.face_localization import FaceLocalizer, GeometricFaceLocalizer, compute_eye_aspect_ratio
from analysis.pipeline import analyze_assessment
from analysis.pupil_segmentation import PupilSegmenter
from analysis.pupil_tracking import PupilTracker
from analysis.tests.test_phase1_video_quality import create_synthetic_video


def generate_synthetic_eye_crop(
    width: int = 120,
    height: int = 80,
    pupil_center: tuple[int, int] = (60, 40),
    pupil_radius: int = 14,
    add_glare: bool = False,
    eye_closed: bool = False,
) -> np.ndarray:
    """Creates a synthetic eye crop with iris, pupil, and optional specular glare."""
    # Sclera base (light beige/white)
    crop = np.full((height, width, 3), 220, dtype=np.uint8)

    if eye_closed:
        # Draw a horizontal line simulating a closed eyelid slit
        cv2.line(crop, (10, height // 2), (width - 10, height // 2), (100, 100, 100), 2)
        return crop

    # Iris (medium gray / brown ring)
    iris_radius = int(pupil_radius * 2.1)
    cv2.circle(crop, pupil_center, iris_radius, (110, 110, 110), -1)

    # Pupil (dark circular region)
    cv2.circle(crop, pupil_center, pupil_radius, (20, 20, 20), -1)

    # Optional specular glint inside pupil
    if add_glare:
        glint_center = (pupil_center[0] - 3, pupil_center[1] - 3)
        cv2.circle(crop, glint_center, 2, (255, 255, 255), -1)

    return crop


def generate_synthetic_face_frame(
    width: int = 640,
    height: int = 480,
    pupil_radius: int = 12,
    blink: bool = False,
) -> np.ndarray:
    """Creates a synthetic frame containing a stylized face and both eyes."""
    frame = np.full((height, width, 3), 240, dtype=np.uint8)

    # Face oval
    fx, fy, fw, fh = int(width * 0.25), int(height * 0.15), int(width * 0.5), int(height * 0.7)
    cv2.ellipse(frame, (fx + fw // 2, fy + fh // 2), (fw // 2, fh // 2), 0, 0, 360, (200, 180, 160), -1)

    # Left eye crop position
    lx, ly = fx + int(fw * 0.18), fy + int(fh * 0.28)
    ew, eh = 80, 50

    # Right eye crop position
    rx, ry = fx + int(fw * 0.58), fy + int(fh * 0.28)

    left_crop = generate_synthetic_eye_crop(width=ew, height=eh, pupil_center=(40, 25), pupil_radius=pupil_radius, eye_closed=blink)
    right_crop = generate_synthetic_eye_crop(width=ew, height=eh, pupil_center=(40, 25), pupil_radius=pupil_radius, eye_closed=blink)

    frame[ly:ly + eh, lx:lx + ew] = left_crop
    frame[ry:ry + eh, rx:rx + ew] = right_crop

    return frame


def create_synthetic_pupil_video(
    output_path: Path,
    duration_sec: float = 3.0,
    fps: float = 30.0,
    initial_radius: int = 15,
    min_radius: int = 9,
) -> Path:
    """Generates a synthetic recording with face and pupil constricting over time."""
    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (640, 480))

    try:
        for i in range(total_frames):
            # Simulate constriction starting around frame 30
            if i < 30:
                rad = initial_radius
            elif i < 60:
                progress = (i - 30) / 30.0
                rad = int(initial_radius - progress * (initial_radius - min_radius))
            else:
                rad = min_radius

            frame = generate_synthetic_face_frame(640, 480, pupil_radius=rad, blink=(i == 45))
            writer.write(frame)
    finally:
        writer.release()

    return output_path


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


@pytest.fixture
def synthetic_pupil_video(temp_dir: Path) -> Path:
    vid_p = temp_dir / "pupil_test_video.mp4"
    return create_synthetic_pupil_video(vid_p)


# =========================================================================
# Face & Eye Localization Tests
# =========================================================================

def test_face_localizer_detects_synthetic_face():
    frame = generate_synthetic_face_frame()
    localizer = FaceLocalizer(force_fallback=True)
    res = localizer.localize(frame)

    assert res.face_detected is True
    assert res.face_count >= 1
    assert res.left_eye_bbox is not None
    assert res.right_eye_bbox is not None
    assert res.left_eye_open_ratio is not None


def test_face_localizer_no_face_blank_frame():
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    localizer = FaceLocalizer(force_fallback=True)
    res = localizer.localize(blank)

    assert res.face_detected is False
    assert res.face_count == 0


def test_compute_eye_aspect_ratio():
    # Canonical open eye landmarks (6 points normalized)
    open_pts = [(0.1, 0.5), (0.2, 0.4), (0.3, 0.4), (0.4, 0.5), (0.3, 0.6), (0.2, 0.6)]
    ear_open = compute_eye_aspect_ratio(open_pts, 100, 100)
    assert ear_open > 0.20

    # Closed eye landmarks (upper and lower points coincide)
    closed_pts = [(0.1, 0.5), (0.2, 0.5), (0.3, 0.5), (0.4, 0.5), (0.3, 0.5), (0.2, 0.5)]
    ear_closed = compute_eye_aspect_ratio(closed_pts, 100, 100)
    assert ear_closed == pytest.approx(0.0)


# =========================================================================
# Eye Region Extractor Tests
# =========================================================================

def test_eye_region_extractor_locks_side():
    frame = generate_synthetic_face_frame()
    localizer = FaceLocalizer(force_fallback=True)
    loc_res = localizer.localize(frame)

    extractor = EyeRegionExtractor(preferred_side="auto")
    locked = extractor.select_and_lock_side(loc_res)
    assert locked in ("left", "right")

    # Second call should return identical locked side
    assert extractor.select_and_lock_side(loc_res) == locked


def test_eye_region_extractor_extracts_valid_crop():
    frame = generate_synthetic_face_frame()
    localizer = FaceLocalizer(force_fallback=True)
    loc_res = localizer.localize(frame)

    extractor = EyeRegionExtractor(preferred_side="left")
    crop, bbox, is_open, err = extractor.extract_crop(frame, loc_res)

    assert is_open is True
    assert err is None
    assert crop is not None
    assert crop.shape[0] == bbox[3]
    assert crop.shape[1] == bbox[2]


def test_eye_region_extractor_detects_closed_eye():
    frame = generate_synthetic_face_frame()
    loc_res = FaceLocalizationResult(
        face_detected=True,
        face_count=1,
        left_eye_bbox=(100, 100, 80, 50),
        right_eye_bbox=(200, 100, 80, 50),
        left_eye_open_ratio=0.10,  # Below threshold
        right_eye_open_ratio=0.10,
    )
    extractor = EyeRegionExtractor(preferred_side="left")
    crop, bbox, is_open, err = extractor.extract_crop(frame, loc_res)

    assert is_open is False
    assert err == "eye_closed_or_blink"


def test_crop_to_frame_coordinate_mapping():
    bbox = (150, 200, 80, 60)
    fx, fy = EyeRegionExtractor.crop_to_frame_coordinates(40.0, 30.0, bbox)
    assert fx == 190.0
    assert fy == 230.0


# =========================================================================
# OpenCV Pupil Segmentation Accuracy Tests
# =========================================================================

def test_pupil_segmenter_accuracy_against_ground_truth():
    target_radius = 16
    expected_diameter = target_radius * 2  # 32 px
    eye_crop = generate_synthetic_eye_crop(width=140, height=90, pupil_center=(70, 45), pupil_radius=target_radius)

    segmenter = PupilSegmenter()
    cx, cy, diameter, conf, is_valid, err = segmenter.segment(eye_crop)

    assert is_valid is True
    assert err is None
    assert cx == pytest.approx(70.0, abs=2.5)
    assert cy == pytest.approx(45.0, abs=2.5)
    assert diameter == pytest.approx(expected_diameter, abs=3.0)
    assert conf > 0.50


def test_pupil_segmenter_with_specular_glare():
    target_radius = 14
    eye_crop = generate_synthetic_eye_crop(
        width=120, height=80, pupil_center=(60, 40), pupil_radius=target_radius, add_glare=True
    )

    segmenter = PupilSegmenter()
    cx, cy, diameter, conf, is_valid, err = segmenter.segment(eye_crop)

    assert is_valid is True
    assert cx == pytest.approx(60.0, abs=3.0)
    assert cy == pytest.approx(40.0, abs=3.0)
    assert diameter == pytest.approx(target_radius * 2, abs=3.5)


def test_pupil_segmenter_rejects_empty_or_uniform():
    uniform = np.full((80, 120, 3), 200, dtype=np.uint8)
    segmenter = PupilSegmenter()
    cx, cy, diameter, conf, is_valid, err = segmenter.segment(uniform)

    assert is_valid is False
    assert err == "no_valid_pupil_contour"


# =========================================================================
# Pupil Temporal Tracking Tests
# =========================================================================

def test_pupil_tracker_sequence(synthetic_pupil_video: Path):
    from analysis.video_io import VideoReader
    from analysis.frame_sampling import sample_frames

    cfg = AnalysisConfig(target_fps=30.0)
    with VideoReader(synthetic_pupil_video, cfg) as reader:
        sampled_frames, total, _ = sample_frames(reader, cfg)

    tracker = PupilTracker(face_localizer=FaceLocalizer(force_fallback=True))
    measurements = tracker.track_sequence(sampled_frames)

    assert len(measurements) == len(sampled_frames)
    valid_ms = [m for m in measurements if m.valid]
    assert len(valid_ms) > (len(measurements) * 0.70)

    # Check timestamps increase monotonically
    timestamps = [m.t_ms for m in measurements]
    assert timestamps == sorted(timestamps)

    # Verify blink was detected as invalid
    invalid_ms = [m for m in measurements if not m.valid]
    assert len(invalid_ms) >= 1


def test_render_debug_overlay():
    frame = generate_synthetic_face_frame()
    tracker = PupilTracker(face_localizer=FaceLocalizer(force_fallback=True))
    m, face_res, eye_bbox = tracker.process_frame(frame, frame_index=0, timestamp_ms=0.0)

    overlay = PupilTracker.render_debug_overlay(frame, m, eye_bbox, face_res)
    assert overlay.shape == frame.shape
    assert overlay.dtype == np.uint8


# =========================================================================
# Integration with analyze_assessment Pipeline
# =========================================================================

def test_analyze_assessment_phase2_populates_pupil_series(synthetic_pupil_video: Path):
    output = analyze_assessment(
        pupil_video_path=synthetic_pupil_video,
        pupil_metadata={"preferred_eye": "left"},
    )
    assert output["pipeline_version"] == "0.1.0"
    assert output["quality"]["status"] == "acceptable"
    assert output["pupil"]["status"] == "complete"

    series = output["pupil"]["series"]
    assert len(series) >= 80

    # Ensure format strictly matches {"t_ms": int, "diameter": Optional[float], "valid": bool}
    for pt in series:
        assert isinstance(pt["t_ms"], int)
        assert isinstance(pt["valid"], bool)
        if pt["valid"]:
            assert isinstance(pt["diameter"], (int, float))
            assert pt["diameter"] > 0
        else:
            assert pt["diameter"] is None


# =========================================================================
# CLI Phase 2 Inspection Tests
# =========================================================================

def test_cli_track_pupil_json(synthetic_pupil_video: Path):
    cmd = [
        sys.executable,
        "-m",
        "analysis.cli",
        str(synthetic_pupil_video),
        "--track-pupil",
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 0
    data = json.loads(proc.stdout)

    assert data["total_frames"] >= 80
    assert data["valid_frames"] >= 40
    assert data["mean_diameter_px"] is not None
    assert data["tracked_eye"] in ("left", "right")


def test_cli_saves_debug_frames(synthetic_pupil_video: Path, temp_dir: Path):
    debug_dir = temp_dir / "debug_overlays"
    cmd = [
        sys.executable,
        "-m",
        "analysis.cli",
        str(synthetic_pupil_video),
        "--track-pupil",
        "--debug-frames-dir",
        str(debug_dir),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 0
    saved_frames = list(debug_dir.glob("*.jpg"))
    assert len(saved_frames) >= 80


def test_face_localizer_detects_skin_toned_webcam_face_and_iris():
    """Verifies GeometricFaceLocalizer finds off-center skin-toned face, eyes, and iris centers against bright background."""
    frame = np.full((480, 640, 3), 235, dtype=np.uint8)
    # Off-center face with realistic BGR skin tone (Cr ~ 152, Cb ~ 105)
    fx, fy, fw, fh = 180, 90, 220, 280
    cv2.ellipse(frame, (fx + fw // 2, fy + fh // 2), (fw // 2, fh // 2), 0, 0, 360, (145, 175, 220), -1)

    # Left and right eyes with sclera, iris, and pupil
    for ex in (fx + 55, fx + 165):
        ey = fy + 95
        cv2.ellipse(frame, (ex, ey), (28, 14), 0, 0, 360, (235, 235, 235), -1)
        cv2.circle(frame, (ex, ey), 11, (95, 85, 80), -1)
        cv2.circle(frame, (ex, ey), 5, (35, 35, 35), -1)

    res = GeometricFaceLocalizer.localize(frame)
    assert res.face_detected is True
    assert res.left_iris_center is not None
    assert res.right_iris_center is not None
    assert abs(res.left_iris_center[0] - (fx + 55)) <= 12
    assert abs(res.right_iris_center[0] - (fx + 165)) <= 12


def test_pupil_segmenter_handles_auto_exposed_webcam_brightness():
    """Verifies PupilSegmenter segments pupils whose pixel intensity exceeds 90 due to webcam auto-exposure."""
    crop = np.full((80, 120, 3), 210, dtype=np.uint8)
    cv2.circle(crop, (60, 40), 28, (145, 145, 145), -1)  # Iris
    cv2.circle(crop, (60, 40), 12, (95, 95, 95), -1)     # Auto-exposed pupil (>90 intensity)

    segmenter = PupilSegmenter()
    cx, cy, diameter, conf, is_valid, err = segmenter.segment(crop)
    assert is_valid is True
    assert err is None
    assert cx == pytest.approx(60.0, abs=3.0)
    assert cy == pytest.approx(40.0, abs=3.0)
    assert diameter == pytest.approx(24.0, abs=4.0)


def test_pupil_segmenter_handles_dim_low_res_rural_crop():
    """Verifies PupilSegmenter segments small dim eye crops from 320x240 low-light rural webcams."""
    crop = np.full((24, 36, 3), 65, dtype=np.uint8)  # Dim indoor illumination
    cv2.circle(crop, (18, 12), 8, (45, 45, 45), -1)  # Low-contrast iris
    cv2.circle(crop, (18, 12), 4, (14, 14, 14), -1)  # Small pupil (8px diameter)

    segmenter = PupilSegmenter()
    cx, cy, diameter, conf, is_valid, err = segmenter.segment(crop)
    assert is_valid is True
    assert err is None
    assert cx == pytest.approx(18.0, abs=2.5)
    assert cy == pytest.approx(12.0, abs=2.5)
    assert diameter == pytest.approx(8.0, abs=2.5)


def test_pupil_tracker_recovers_from_initial_outlier_and_rejects_isolated_spike():
    """Verifies PupilTracker unlocks after consecutive rejections and strips isolated spikes."""
    from analysis.contracts import SampledFrame

    tracker = PupilTracker(face_localizer=FaceLocalizer(force_fallback=True))

    # Build a synthetic sequence where frame 0 has an oversized iris-like outlier,
    # frames 1-7 have steady 20px pupil diameter, frame 4 has a 1-frame spike (would break without filter).
    base_frame = generate_synthetic_face_frame(width=640, height=480, pupil_radius=10)
    outlier_frame = generate_synthetic_face_frame(width=640, height=480, pupil_radius=20)
    spike_frame = generate_synthetic_face_frame(width=640, height=480, pupil_radius=18)

    sampled = []
    for idx in range(8):
        if idx == 0:
            img = outlier_frame
        elif idx == 4:
            img = spike_frame
        else:
            img = base_frame
        sampled.append(SampledFrame(frame_index=idx, timestamp_ms=idx * 33.3, frame=img, is_valid=True))

    results = tracker.track_sequence(sampled)
    valid_after_recovery = [m for m in results[3:] if m.valid]
    assert len(valid_after_recovery) >= 3
    # Isolated frame-4 spike should be invalidated or stabilized close to the ~20px pupil stream
    diams = [m.diameter for m in valid_after_recovery if m.diameter is not None]
    assert max(diams) - min(diams) < 8.0
