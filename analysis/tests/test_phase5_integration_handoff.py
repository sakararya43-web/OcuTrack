"""Integration and handoff tests for Phase 5: Backend integration and reproducible handoff.

Verifies:
- Public analysis package imports and cleanliness (no FastAPI or DB dependencies)
- analyze_assessment() signature, keyword arguments, and path type flexibility
- Strict compliance with Section 5 JSON schema
- Robustness across edge cases (missing files, corrupt files, null inputs)
- CLI invocation producing schema-identical JSON output
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path
import pytest

from analysis import (
    AnalysisConfig,
    ModelStatus,
    QualityStatus,
    TestStatus,
    analyze_assessment,
)
from analysis.tests.test_phase3_features_and_pursuit import (
    create_synthetic_pupil_video,
    create_synthetic_pursuit_video,
)


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


@pytest.fixture
def pupil_video(temp_dir: Path) -> Path:
    return create_synthetic_pupil_video(temp_dir / "pupil_handoff.mp4", duration_sec=3.0, fps=30.0)


@pytest.fixture
def pursuit_video(temp_dir: Path) -> Path:
    return create_synthetic_pursuit_video(temp_dir / "pursuit_handoff.mp4", duration_sec=3.0, fps=30.0)


# =========================================================================
# Package Isolation & Architectural Boundary Tests
# =========================================================================


def test_package_has_no_fastapi_or_database_dependencies():
    """Verifies that the analysis engine is completely isolated from HTTP and DB frameworks."""
    import analysis
    import analysis.contracts
    import analysis.pipeline
    import analysis.quality
    import analysis.video_io

    modules = sys.modules.keys()
    # Confirm no fastapi, starlette, or database connections were imported by the analysis engine
    forbidden = ["fastapi", "starlette", "supabase", "sqlalchemy"]
    for mod in forbidden:
        assert not any(m == mod or m.startswith(f"{mod}.") for m in modules), (
            f"Forbidden dependency '{mod}' detected in analysis package modules!"
        )


# =========================================================================
# Keyword Argument & Path Type Compatibility Tests
# =========================================================================


def test_analyze_assessment_keyword_signature_and_path_types(
    pupil_video: Path,
    pursuit_video: Path,
):
    """Verifies analyze_assessment accepts strict keyword arguments with either Path or str paths."""
    # Test with string paths
    res_str = analyze_assessment(
        pupil_video_path=str(pupil_video),
        pursuit_video_path=str(pursuit_video),
        pupil_metadata={"stimulus_onset_ms": 1000},
        pursuit_metadata={"trajectory": [{"t_ms": 0, "x": 0.2, "y": 0.5}, {"t_ms": 3000, "x": 0.8, "y": 0.5}]},
        model_config=None,
    )
    assert res_str["quality"]["status"] == QualityStatus.ACCEPTABLE.value

    # Test with Path instances
    res_path = analyze_assessment(
        pupil_video_path=pupil_video,
        pursuit_video_path=pursuit_video,
        pupil_metadata={"stimulus_onset_ms": 1000},
        pursuit_metadata={"trajectory": [{"t_ms": 0, "x": 0.2, "y": 0.5}, {"t_ms": 3000, "x": 0.8, "y": 0.5}]},
    )
    assert res_path["quality"]["status"] == QualityStatus.ACCEPTABLE.value


# =========================================================================
# Exact Output Schema Verification
# =========================================================================


def test_output_schema_structure_and_json_serializability(
    pupil_video: Path,
    pursuit_video: Path,
):
    """Verifies exact schema keys, types, and error-free JSON serialization."""
    res = analyze_assessment(
        pupil_video_path=pupil_video,
        pursuit_video_path=pursuit_video,
        pupil_metadata={"stimulus_onset_ms": 1000},
        pursuit_metadata={"trajectory": [{"t_ms": 0, "x": 0.2, "y": 0.5}, {"t_ms": 3000, "x": 0.8, "y": 0.5}]},
    )

    # 1. Top-Level Keys
    expected_top_keys = {"pipeline_version", "quality", "pupil", "pursuit", "temporal_model", "warnings"}
    assert set(res.keys()) == expected_top_keys
    assert isinstance(res["pipeline_version"], str)
    assert isinstance(res["warnings"], list)

    # 2. Quality Object Schema
    q = res["quality"]
    assert set(q.keys()) == {"status", "usable_frame_ratio", "warnings", "details"}
    assert q["status"] in {QualityStatus.ACCEPTABLE.value, QualityStatus.INSUFFICIENT.value, QualityStatus.PENDING.value}
    assert isinstance(q["usable_frame_ratio"], float)
    assert isinstance(q["warnings"], list)
    assert isinstance(q["details"], dict)

    # 3. Pupil Object Schema
    pupil = res["pupil"]
    assert set(pupil.keys()) == {"status", "features", "series"}
    assert pupil["status"] in {TestStatus.COMPLETE.value, TestStatus.INSUFFICIENT_QUALITY.value, TestStatus.FAILED.value, TestStatus.NOT_PROVIDED.value}
    expected_pupil_features = {
        "baseline_diameter",
        "minimum_diameter",
        "constriction_amplitude",
        "response_latency_seconds",
        "constriction_velocity",
    }
    assert set(pupil["features"].keys()) == expected_pupil_features
    for fk, fv in pupil["features"].items():
        assert set(fv.keys()) == {"value", "unit", "label"}

    for pt in pupil["series"]:
        assert set(pt.keys()) == {"t_ms", "diameter", "valid"}
        assert isinstance(pt["t_ms"], int)
        assert isinstance(pt["valid"], bool)

    # 4. Pursuit Object Schema
    pursuit = res["pursuit"]
    assert set(pursuit.keys()) == {"status", "features", "series"}
    expected_pursuit_features = {
        "mean_tracking_error",
        "tracking_continuity",
        "corrective_movement_count",
    }
    assert set(pursuit["features"].keys()) == expected_pursuit_features
    for fk, fv in pursuit["features"].items():
        assert set(fv.keys()) == {"value", "unit", "label"}

    for pt in pursuit["series"]:
        assert set(pt.keys()) == {"t_ms", "eye_x", "eye_y", "target_x", "target_y", "tracking_error", "valid"}
        assert isinstance(pt["t_ms"], int)
        assert isinstance(pt["valid"], bool)

    # 5. Temporal Model Object Schema
    tm = res["temporal_model"]
    assert set(tm.keys()) == {"status", "model_name", "model_version", "output", "notes"}
    assert tm["status"] in {ModelStatus.NOT_CONFIGURED.value, ModelStatus.EXPERIMENTAL.value, ModelStatus.EVALUATED.value, ModelStatus.FAILED.value}
    assert isinstance(tm["model_name"], str)
    assert isinstance(tm["notes"], list)

    # 6. Full JSON-serializability check
    serialized = json.dumps(res)
    assert len(serialized) > 0


# =========================================================================
# Robustness & Edge Cases
# =========================================================================


def test_missing_and_corrupt_files_handled_gracefully(temp_dir: Path):
    """Verifies that non-existent or corrupt files do not crash the engine."""
    fake_path = temp_dir / "does_not_exist.mp4"
    corrupt_file = temp_dir / "corrupt.mp4"
    corrupt_file.write_text("not a real video file content")

    # 1. Non-existent file
    res_missing = analyze_assessment(pupil_video_path=fake_path)
    assert res_missing["quality"]["status"] == QualityStatus.INSUFFICIENT.value
    assert res_missing["pupil"]["status"] == TestStatus.INSUFFICIENT_QUALITY.value
    assert any("not found" in w.lower() or "does not exist" in w.lower() for w in res_missing["quality"]["warnings"])

    # 2. Corrupt file
    res_corrupt = analyze_assessment(pupil_video_path=corrupt_file)
    assert res_corrupt["quality"]["status"] == QualityStatus.INSUFFICIENT.value
    assert res_corrupt["pupil"]["status"] == TestStatus.INSUFFICIENT_QUALITY.value

    # 3. Neither video supplied
    res_none = analyze_assessment()
    assert res_none["quality"]["status"] == QualityStatus.INSUFFICIENT.value
    assert res_none["pupil"]["status"] == TestStatus.NOT_PROVIDED.value
    assert res_none["pursuit"]["status"] == TestStatus.NOT_PROVIDED.value


# =========================================================================
# CLI and Backend Equivalence Test
# =========================================================================


def test_cli_produces_identical_schema_to_direct_python_call(
    pupil_video: Path,
    pursuit_video: Path,
    temp_dir: Path,
):
    """Verifies that running CLI with --json outputs schema identical to direct analyze_assessment call."""
    pupil_meta_path = temp_dir / "p_meta.json"
    pupil_meta_path.write_text(json.dumps({"stimulus_onset_ms": 1000}))

    cmd = [
        sys.executable,
        "-m",
        "analysis.cli",
        "--pupil",
        str(pupil_video),
        "--pursuit",
        str(pursuit_video),
        "--pupil-metadata",
        str(pupil_meta_path),
        "--json",
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    cli_out = json.loads(proc.stdout)

    direct_out = analyze_assessment(
        pupil_video_path=pupil_video,
        pursuit_video_path=pursuit_video,
        pupil_metadata={"stimulus_onset_ms": 1000},
    )

    assert cli_out.keys() == direct_out.keys()
    assert cli_out["pipeline_version"] == direct_out["pipeline_version"]
    assert cli_out["quality"]["status"] == direct_out["quality"]["status"]
    assert cli_out["pupil"]["status"] == direct_out["pupil"]["status"]
    assert cli_out["pursuit"]["status"] == direct_out["pursuit"]["status"]
    assert cli_out["temporal_model"]["status"] == direct_out["temporal_model"]["status"]
