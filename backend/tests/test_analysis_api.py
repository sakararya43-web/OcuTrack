import io
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import AssessmentModel, MeasurementModel, ModelRunModel
from app.services.analysis_orchestrator import (
    set_analysis_engine,
    reset_analysis_engine,
    ANALYSIS_ENGINE_AVAILABLE,
)
from tests.test_assessments import generate_test_video_bytes


@pytest.fixture(autouse=True)
def cleanup_engine():
    yield
    reset_analysis_engine()


@pytest.fixture
def uploaded_assessment(client: TestClient) -> dict:
    """Fixture creating a consented patient, assessment session, and uploaded videos."""
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-ANALYSIS-01",
        "age_band": "50-59",
        "consent": {"consent_status": "granted", "purpose": "hackathon_demo"}
    })
    patient_id = p_res.json()["patient_id"]

    a_res = client.post("/api/assessments", json={
        "patient_id": patient_id,
        "protocol_version": "ocutrack-protocol-0.1",
        "test_type": "both",
    })
    assessment_id = a_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    files1 = {"file": ("pupil.mp4", io.BytesIO(video_bytes), "video/mp4")}
    data1 = {"metadata_json": json.dumps({"test_type": "pupil_reflex", "duration_ms": 1000})}
    client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files1, data=data1)

    files2 = {"file": ("pursuit.mp4", io.BytesIO(video_bytes), "video/mp4")}
    data2 = {"metadata_json": json.dumps({
        "test_type": "smooth_pursuit",
        "target_path": {"coordinates_normalized": [{"t_ms": 0, "x": 0.5, "y": 0.5}]}
    })}
    client.post(f"/api/assessments/{assessment_id}/pursuit-video", files=files2, data=data2)

    return {"patient_id": patient_id, "assessment_id": assessment_id}


def test_analyze_when_engine_unavailable_returns_503(
    client: TestClient,
    uploaded_assessment: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    from app.services import analysis_orchestrator

    # Ensure no engine injected and simulate unavailable analysis package
    reset_analysis_engine()
    monkeypatch.setattr(analysis_orchestrator, "ANALYSIS_ENGINE_AVAILABLE", False)

    asm_id = uploaded_assessment["assessment_id"]
    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 503
    error_data = response.json()
    assert error_data["error"]["code"] == "ANALYSIS_ENGINE_UNAVAILABLE"


def test_analyze_without_uploads_rejected(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-NO-UPLOADS",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    a_res = client.post("/api/assessments", json={"patient_id": patient_id})
    asm_id = a_res.json()["assessment_id"]

    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 422
    assert "no video recordings" in response.json()["detail"]


def test_analyze_success_and_persistence(
    client: TestClient,
    db_session: Session,
    uploaded_assessment: dict,
):
    asm_id = uploaded_assessment["assessment_id"]

    # Verify video file paths exist before analysis
    asm_before = db_session.query(AssessmentModel).filter_by(id=asm_id).first()
    pupil_file = asm_before.pupil_video_path
    pursuit_file = asm_before.pursuit_video_path
    assert pupil_file is not None and Path(pupil_file).exists()
    assert pursuit_file is not None and Path(pursuit_file).exists()

    # Create deterministic mock analysis engine conforming to docs/integration-contract.md Section 5
    captured_args = {}

    def mock_engine(pupil_video_path, pursuit_video_path, pupil_metadata, pursuit_metadata, model_config):
        captured_args["pupil_path"] = pupil_video_path
        captured_args["pursuit_path"] = pursuit_video_path
        captured_args["pupil_meta"] = pupil_metadata
        captured_args["pursuit_meta"] = pursuit_metadata

        return {
            "quality": {
                "status": "acceptable",
                "usable_frame_ratio": 0.942,
                "warnings": []
            },
            "pupil": {
                "status": "complete",
                "features": {
                    "baseline_diameter": {"value": 4.62, "unit": "mm", "label": "Baseline Pupil Diameter"},
                    "constriction_latency": {"value": 248.0, "unit": "ms", "label": "Constriction Latency"},
                    "constriction_velocity": {"value": 4.85, "unit": "mm/s", "label": "Max Constriction Velocity"},
                    "constriction_amplitude": {"value": 32.4, "unit": "%", "label": "Constriction Amplitude"},
                    "dilation_velocity": {"value": 2.15, "unit": "mm/s", "label": "Average Dilation Velocity"}
                },
                "series": [
                    {"t_ms": 0, "value": 4.62, "valid": True},
                    {"t_ms": 50, "value": 4.61, "valid": True}
                ]
            },
            "pursuit": {
                "status": "complete",
                "features": {
                    "tracking_gain": {"value": 0.94, "unit": "ratio", "label": "Smooth Pursuit Gain"},
                    "rmse_error": {"value": 0.042, "unit": "norm", "label": "Gaze Tracking RMSE"},
                    "saccadic_intrusions": {"value": 2.0, "unit": "count", "label": "Catch-up Saccades"}
                },
                "series": [
                    {"t_ms": 0, "target_x": 0.5, "eye_x": 0.498, "valid": True}
                ]
            },
            "temporal_model": {
                "status": "experimental",
                "model_name": "TCN-Temporal-Evaluator-v0.1",
                "model_version": "1.0.0",
                "output": {
                    "sequence_embedding_variance": 0.082,
                    "temporal_smoothness_index": 0.91
                },
                "notes": "Experimental model output; not clinically validated."
            },
            "warnings": []
        }

    set_analysis_engine(mock_engine)

    # Trigger analysis endpoint
    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 200
    data = response.json()

    # 1. Verify schema response
    assert data["assessment_id"] == asm_id
    assert data["status"] == "complete"
    assert data["quality_status"] == "acceptable"
    assert data["quality"]["status"] == "acceptable"
    assert data["quality"]["usable_frame_ratio"] == 0.942
    assert "Baseline established" in data["review_message"]
    assert "not a diagnostic device" in data["non_diagnostic_notice"].lower()

    # Verify features in response
    assert data["pupil"]["status"] == "complete"
    assert data["pupil"]["features"]["baseline_diameter"]["value"] == 4.62
    assert data["pupil"]["features"]["baseline_diameter"]["unit"] == "mm"
    assert data["pupil"]["features"]["constriction_latency"]["value"] == 248.0
    assert len(data["pupil"]["series"]) == 2

    assert data["pursuit"]["status"] == "complete"
    assert data["pursuit"]["features"]["tracking_gain"]["value"] == 0.94
    assert data["pursuit"]["features"]["saccadic_intrusions"]["value"] == 2.0

    assert data["temporal_model"]["status"] == "experimental"
    assert data["temporal_model"]["model_name"] == "TCN-Temporal-Evaluator-v0.1"

    # 2. Verify engine received valid temporary file paths and metadata
    assert captured_args["pupil_path"] is not None
    assert captured_args["pursuit_path"] is not None
    assert captured_args["pupil_meta"]["test_type"] == "pupil_reflex"

    # 3. Verify real database persistence
    db_measurements = db_session.query(MeasurementModel).filter_by(assessment_id=asm_id).all()
    assert len(db_measurements) == 8  # 5 pupil features + 3 pursuit features
    meas_names = {m.feature_name: m.feature_value for m in db_measurements}
    assert meas_names["constriction_latency"] == 248.0
    assert meas_names["tracking_gain"] == 0.94

    db_model_runs = db_session.query(ModelRunModel).filter_by(assessment_id=asm_id).all()
    assert len(db_model_runs) == 1
    assert db_model_runs[0].model_name == "TCN-Temporal-Evaluator-v0.1"
    assert db_model_runs[0].status == "experimental"

    # 4. Verify temporary video files were deleted in finally block
    assert not Path(pupil_file).exists()
    assert not Path(pursuit_file).exists()


def test_analyze_pipeline_exception_sets_failed_and_cleans_up(
    client: TestClient,
    db_session: Session,
    uploaded_assessment: dict,
):
    asm_id = uploaded_assessment["assessment_id"]

    asm_before = db_session.query(AssessmentModel).filter_by(id=asm_id).first()
    pupil_file = asm_before.pupil_video_path
    pursuit_file = asm_before.pursuit_video_path

    def failing_engine(*args, **kwargs):
        raise RuntimeError("MediaPipe FaceMesh iris landmark localization failure")

    set_analysis_engine(failing_engine)

    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "ANALYSIS_PIPELINE_ERROR"

    # Verify assessment status is marked 'failed'
    get_res = client.get(f"/api/assessments/{asm_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "failed"
    assert get_res.json()["review_message"] == "Analysis failed — repeat test."

    # Verify temporary video files are cleaned up even on exception
    assert not Path(pupil_file).exists()
    assert not Path(pursuit_file).exists()


@pytest.mark.skipif(
    not ANALYSIS_ENGINE_AVAILABLE,
    reason="Aditya's analysis package not yet installed or merged into main",
)
def test_aditya_real_analysis_engine_integration(client: TestClient, uploaded_assessment: dict):
    """
    Direct integration test against Aditya's actual analysis package.
    Automatically activates when Aditya's package is installed/merged.
    """
    asm_id = uploaded_assessment["assessment_id"]
    reset_analysis_engine()

    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert data["assessment_id"] == asm_id
    assert data["status"] in ["complete", "failed"]


def test_analyze_persists_analysis_engine_series_and_normalizes_diameter(
    client: TestClient,
    uploaded_assessment: dict,
):
    asm_id = uploaded_assessment["assessment_id"]

    def engine_like_aditya(*args, **kwargs):
        return {
            "quality": {"status": "acceptable", "usable_frame_ratio": 0.95, "warnings": []},
            "pupil": {
                "status": "complete",
                "features": {
                    "baseline_diameter": {"value": 28.4, "unit": "px_or_normalized", "label": "Baseline pupil size"},
                },
                "series": [{"t_ms": 0, "diameter": 28.4, "valid": True}],
            },
            "pursuit": {
                "status": "complete",
                "features": {
                    "mean_tracking_error": {"value": 0.04, "unit": "normalized_screen_units", "label": "Mean tracking error"},
                    "tracking_continuity": {"value": 0.96, "unit": "ratio", "label": "Tracking continuity"},
                },
                "series": [{"t_ms": 0, "target_x": 0.5, "eye_x": 0.49, "valid": True}],
            },
        }

    set_analysis_engine(engine_like_aditya)
    response = client.post(f"/api/assessments/{asm_id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert data["pupil"]["series"] is not None
    assert data["pupil"]["series"][0]["value"] == pytest.approx(28.4)
    assert data["pursuit"]["series"] is not None
    assert data["pursuit"]["series"][0]["eye_x"] == pytest.approx(0.49)
