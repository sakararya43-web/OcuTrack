"""Unit and integration tests for Phase 3: Feature extraction and smooth pursuit tracking.

Verifies:
- Physiological pupil feature extraction (baseline, minimum, amplitude, latency, velocity)
- Missing stimulus onset handling (latency is null, explicit warning)
- Smooth-pursuit eye position estimation and target interpolation
- Target-to-eye tracking error, continuity, and corrective saccade candidate detection
- Missing target trajectory handling (tracking error is null, explicit warning)
- End-to-end analyze_assessment() integration with both pupil and pursuit recordings
- CLI execution and formatted JSON output
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
    EyeSide,
    PupilMeasurement,
    PursuitMeasurement,
    QualityStatus,
    TestStatus,
)
from analysis.pipeline import analyze_assessment
from analysis.pupil_features import extract_pupil_features
from analysis.pursuit_tracking import PursuitTracker
from analysis.tests.test_phase2_pupil_tracking import (
    create_synthetic_pupil_video,
    generate_synthetic_face_frame,
)


def create_synthetic_pursuit_video(
    output_path: Path,
    duration_sec: float = 3.0,
    fps: float = 30.0,
    width: int = 640,
    height: int = 480,
) -> Path:
    """Generates a synthetic recording where stylized eyes follow a horizontal target."""
    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    try:
        for i in range(total_frames):
            frame = np.full((height, width, 3), 240, dtype=np.uint8)

            # Move face horizontally slightly to simulate smooth pursuit tracking
            # t: 0.0 to 1.0
            t_norm = i / float(total_frames)
            # Center of face shifts horizontally from 0.40 to 0.60
            center_x_norm = 0.35 + (0.30 * t_norm)
            fx = int((center_x_norm - 0.25) * width)
            fy = int(height * 0.15)
            fw = int(width * 0.5)
            fh = int(height * 0.7)

            cv2.ellipse(
                frame,
                (fx + fw // 2, fy + fh // 2),
                (fw // 2, fh // 2),
                0,
                0,
                360,
                (200, 180, 160),
                -1,
            )

            # Left eye position inside face
            lx, ly = fx + int(fw * 0.18), fy + int(fh * 0.28)
            ew, eh = 80, 50

            # Draw eye background
            frame[ly : ly + eh, lx : lx + ew] = 220

            # Pupil shifts inside eye based on tracking position
            pupil_offset_x = int(ew * (0.2 + 0.6 * t_norm))
            cv2.circle(frame, (lx + pupil_offset_x, ly + eh // 2), 12, (20, 20, 20), -1)

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
    vid_p = temp_dir / "pupil_test.mp4"
    return create_synthetic_pupil_video(vid_p, duration_sec=3.0, fps=30.0)


@pytest.fixture
def synthetic_pursuit_video(temp_dir: Path) -> Path:
    vid_p = temp_dir / "pursuit_test.mp4"
    return create_synthetic_pursuit_video(vid_p, duration_sec=3.0, fps=30.0)


# =========================================================================
# Pupil Feature Extraction Unit Tests
# =========================================================================


def test_extract_pupil_features_with_stimulus_onset():
    """Verifies baseline, min diameter, amplitude, latency, and velocity calculation."""
    # Create 90 synthetic pupil measurements (3 seconds at 30 fps)
    measurements = []
    # Baseline for 1000ms: diameter ~ 30px
    # Constriction from 1000ms to 1800ms: drops to ~ 18px
    # Post-constriction: stays ~ 18px
    for i in range(90):
        t_ms = int(i * (1000.0 / 30.0))
        if t_ms < 1000:
            d = 30.0 + np.sin(i) * 0.2
        elif t_ms < 1800:
            progress = (t_ms - 1000) / 800.0
            d = 30.0 - (progress * 12.0)
        else:
            d = 18.0 + np.sin(i) * 0.2

        m = PupilMeasurement(
            frame_index=i,
            t_ms=t_ms,
            eye_side="left",
            center_x=320.0,
            center_y=240.0,
            diameter=d,
            confidence=0.9,
            valid=True,
        )
        measurements.append(m)

    metadata = {"stimulus_onset_ms": 1000}
    features, warnings = extract_pupil_features(measurements, metadata)

    assert features["baseline_diameter"]["value"] == pytest.approx(30.0, abs=0.5)
    assert features["minimum_diameter"]["value"] == pytest.approx(18.0, abs=0.5)
    assert features["constriction_amplitude"]["value"] == pytest.approx(12.0, abs=0.8)
    assert features["response_latency_seconds"]["value"] is not None
    # Latency should be roughly the time until diameter drops by 1.2px (10% of 12px)
    assert 0.05 <= features["response_latency_seconds"]["value"] <= 0.30
    assert features["constriction_velocity"]["value"] is not None
    assert features["constriction_velocity"]["value"] > 5.0  # ~15 px/s


def test_extract_pupil_features_missing_stimulus_onset_returns_null_latency():
    """Verifies that missing stimulus_onset_ms results in null response latency and warning."""
    measurements = [
        PupilMeasurement(
            frame_index=i,
            t_ms=i * 33,
            eye_side="left",
            diameter=25.0 - (5.0 * (i / 60.0)),
            confidence=0.85,
            valid=True,
        )
        for i in range(60)
    ]

    features, warnings = extract_pupil_features(measurements, metadata={})

    assert features["baseline_diameter"]["value"] is not None
    assert features["minimum_diameter"]["value"] is not None
    assert features["response_latency_seconds"]["value"] is None
    assert any("stimulus_onset_ms not provided" in w for w in warnings)


def test_extract_pupil_features_insufficient_valid_frames():
    """Verifies that sequences with fewer than 5 valid frames return null with warning."""
    measurements = [
        PupilMeasurement(
            frame_index=i,
            t_ms=i * 33,
            eye_side="left",
            diameter=20.0,
            valid=(i < 3),  # Only 3 valid frames
        )
        for i in range(30)
    ]

    features, warnings = extract_pupil_features(measurements)

    assert features["baseline_diameter"]["value"] is None
    assert features["minimum_diameter"]["value"] is None
    assert any("Insufficient valid pupil measurements" in w for w in warnings)


def test_extract_pupil_features_skips_large_time_gaps():
    """Verifies that velocity derivatives are not computed across gaps > 250ms."""
    measurements = [
        PupilMeasurement(frame_index=0, t_ms=0, eye_side="left", diameter=30.0, valid=True),
        PupilMeasurement(frame_index=1, t_ms=33, eye_side="left", diameter=29.0, valid=True),
        PupilMeasurement(frame_index=2, t_ms=66, eye_side="left", diameter=28.0, valid=True),
        # Gap of 500ms
        PupilMeasurement(frame_index=3, t_ms=566, eye_side="left", diameter=20.0, valid=True),
        PupilMeasurement(frame_index=4, t_ms=600, eye_side="left", diameter=19.5, valid=True),
        PupilMeasurement(frame_index=5, t_ms=633, eye_side="left", diameter=19.0, valid=True),
    ]

    features, warnings = extract_pupil_features(measurements, {"stimulus_onset_ms": 0})
    assert features["constriction_velocity"]["value"] is not None
    # Velocity should reflect local contraction (~30 px/s), not jump across the 500ms gap
    assert features["constriction_velocity"]["value"] < 50.0


# =========================================================================
# Smooth Pursuit Tracking Unit Tests
# =========================================================================


def test_parse_target_trajectory():
    meta = {
        "trajectory": [
            {"t_ms": 100, "x": 0.2, "y": 0.5},
            {"t_ms": 0, "x": 0.1, "y": 0.5},
            {"t_ms": 200, "x": 0.3, "y": 0.5},
        ]
    }
    ts, xs, ys = PursuitTracker._parse_target_trajectory(meta)
    assert ts is not None and xs is not None and ys is not None
    assert ts[0] == 0.0
    assert ts[1] == 100.0
    assert ts[2] == 200.0
    assert xs[0] == 0.1


def test_pursuit_alignment_with_valid_target_trajectory():
    """Verifies error calculation, continuity, and corrective saccade detection."""
    measurements = []
    target_traj = []

    # Simulate 60 frames (2 seconds)
    for i in range(60):
        t_ms = i * 33
        tgt_x = 0.2 + 0.6 * (i / 60.0)
        target_traj.append({"t_ms": t_ms, "x": tgt_x, "y": 0.5})

        # Eye closely following target with slight offset + 1 saccadic jump at frame 30
        if i == 30:
            eye_x = tgt_x + 0.15  # Rapid jump
        else:
            eye_x = tgt_x + 0.01

        measurements.append(
            PursuitMeasurement(
                frame_index=i,
                t_ms=t_ms,
                eye_x=eye_x,
                eye_y=0.50,
                valid=True,
            )
        )

    metadata = {"trajectory": target_traj}
    features, aligned, warnings = PursuitTracker.align_and_extract_features(measurements, metadata)

    assert features["mean_tracking_error"]["value"] is not None
    assert features["mean_tracking_error"]["value"] < 0.05
    assert features["tracking_continuity"]["value"] == 1.0
    assert features["corrective_movement_count"]["value"] is not None
    assert features["corrective_movement_count"]["value"] >= 1


def test_pursuit_alignment_missing_target_trajectory():
    """Verifies that missing target trajectory metadata outputs null error with clear warning."""
    measurements = [
        PursuitMeasurement(frame_index=i, t_ms=i * 33, eye_x=0.5, eye_y=0.5, valid=True)
        for i in range(30)
    ]

    features, aligned, warnings = PursuitTracker.align_and_extract_features(measurements, metadata={})

    assert features["mean_tracking_error"]["value"] is None
    assert features["tracking_continuity"]["value"] == 1.0
    assert any("Target trajectory metadata missing" in w for w in warnings)


def test_pursuit_head_movement_flagging():
    """Verifies that extreme head yaw or pitch flags the measurement."""
    tracker = PursuitTracker()
    frame = np.full((480, 640, 3), 200, dtype=np.uint8)

    # Mock face result with excessive yaw
    from analysis.contracts import FaceLocalizationResult

    mock_face = FaceLocalizationResult(
        face_detected=True,
        head_yaw=35.0,  # > 30 deg threshold
        face_bbox=(100, 100, 200, 200),
        left_eye_bbox=(120, 130, 40, 30),
        right_eye_bbox=(220, 130, 40, 30),
    )
    tracker.face_localizer.localize = lambda f: mock_face

    m, _, _ = tracker.process_frame(frame, frame_index=0, timestamp_ms=0)
    assert m.valid is False
    assert "excessive_head_yaw" in str(m.error_reason)


# =========================================================================
# End-to-End Pipeline Integration Tests
# =========================================================================


def test_analyze_assessment_both_videos(
    synthetic_pupil_video: Path,
    synthetic_pursuit_video: Path,
):
    """Verifies analyze_assessment runs both videos and returns schema-compliant JSON."""
    pupil_meta = {"stimulus_onset_ms": 1000}
    pursuit_meta = {
        "trajectory": [
            {"t_ms": 0, "x": 0.2, "y": 0.5},
            {"t_ms": 1500, "x": 0.5, "y": 0.5},
            {"t_ms": 3000, "x": 0.8, "y": 0.5},
        ]
    }

    result = analyze_assessment(
        pupil_video_path=synthetic_pupil_video,
        pursuit_video_path=synthetic_pursuit_video,
        pupil_metadata=pupil_meta,
        pursuit_metadata=pursuit_meta,
    )

    # 1. Structure verification
    assert result["pipeline_version"] == "0.1.0"
    assert result["quality"]["status"] == "acceptable"
    assert result["quality"]["usable_frame_ratio"] >= 0.80

    # 2. Pupil verification
    assert result["pupil"]["status"] == "complete"
    p_feats = result["pupil"]["features"]
    assert "baseline_diameter" in p_feats
    assert "minimum_diameter" in p_feats
    assert "constriction_amplitude" in p_feats
    assert "response_latency_seconds" in p_feats
    assert "constriction_velocity" in p_feats
    assert len(result["pupil"]["series"]) > 0

    # 3. Pursuit verification
    assert result["pursuit"]["status"] == "complete"
    pu_feats = result["pursuit"]["features"]
    assert "mean_tracking_error" in pu_feats
    assert "tracking_continuity" in pu_feats
    assert "corrective_movement_count" in pu_feats
    assert len(result["pursuit"]["series"]) > 0

    # 4. Temporal Model honest status
    assert result["temporal_model"]["status"] == "not_configured"

    # 5. JSON serializability verification
    json_str = json.dumps(result)
    assert len(json_str) > 0


def test_analyze_assessment_pupil_only(synthetic_pupil_video: Path):
    """Verifies that providing only pupil video sets pursuit status to not_provided."""
    result = analyze_assessment(
        pupil_video_path=synthetic_pupil_video,
        pursuit_video_path=None,
    )

    assert result["pupil"]["status"] == "complete"
    assert result["pursuit"]["status"] == "not_provided"
    assert result["pursuit"]["features"] is None
    assert result["pursuit"]["series"] is None


def test_analyze_assessment_pursuit_only(synthetic_pursuit_video: Path):
    """Verifies that providing only pursuit video sets pupil status to not_provided."""
    result = analyze_assessment(
        pupil_video_path=None,
        pursuit_video_path=synthetic_pursuit_video,
    )

    assert result["pupil"]["status"] == "not_provided"
    assert result["pursuit"]["status"] == "complete"
    assert result["pupil"]["features"] is None
    assert result["pupil"]["series"] is None


# =========================================================================
# CLI Integration Tests
# =========================================================================


def test_cli_assessment_mode_json(
    synthetic_pupil_video: Path,
    synthetic_pursuit_video: Path,
    temp_dir: Path,
):
    """Executes CLI with --pupil, --pursuit, and metadata flags and verifies valid JSON output."""
    pupil_meta_path = temp_dir / "pupil_meta.json"
    pupil_meta_path.write_text(json.dumps({"stimulus_onset_ms": 1000}))

    pursuit_meta_path = temp_dir / "pursuit_meta.json"
    pursuit_meta_path.write_text(
        json.dumps(
            {
                "trajectory": [
                    {"t_ms": 0, "x": 0.2, "y": 0.5},
                    {"t_ms": 3000, "x": 0.8, "y": 0.5},
                ]
            }
        )
    )

    cmd = [
        sys.executable,
        "-m",
        "analysis.cli",
        "--pupil",
        str(synthetic_pupil_video),
        "--pursuit",
        str(synthetic_pursuit_video),
        "--pupil-metadata",
        str(pupil_meta_path),
        "--pursuit-metadata",
        str(pursuit_meta_path),
        "--json",
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    out_json = json.loads(proc.stdout)

    assert out_json["quality"]["status"] == "acceptable"
    assert out_json["pupil"]["status"] == "complete"
    assert out_json["pupil"]["features"]["baseline_diameter"]["value"] is not None
    assert out_json["pursuit"]["status"] == "complete"
    assert out_json["pursuit"]["features"]["mean_tracking_error"]["value"] is not None


def test_parse_dict_wrapped_target_trajectory_from_frontend():
    meta = {
        "trajectory": {
            "path_version": "horizontal-sweep-v1",
            "duration_ms": 10000,
            "coordinates_normalized": [
                {"t_ms": 0, "x": 0.5, "y": 0.5},
                {"t_ms": 100, "x": 0.6, "y": 0.5},
            ],
        }
    }
    ts, xs, ys = PursuitTracker._parse_target_trajectory(meta)
    assert ts is not None and len(ts) == 2
    assert xs[1] == pytest.approx(0.6)


def test_extract_pupil_features_supports_stimulus_onset_seconds():
    measurements = [
        PupilMeasurement(
            frame_index=i,
            t_ms=i * 100,
            eye_side="left",
            diameter=30.0 if i < 20 else 20.0,
            confidence=0.9,
            valid=True,
        )
        for i in range(40)
    ]
    features, _ = extract_pupil_features(measurements, metadata={"stimulus_onset_seconds": 2.0})
    assert features["baseline_diameter"]["value"] == pytest.approx(30.0, abs=0.5)
    assert features["response_latency_seconds"]["value"] is not None
