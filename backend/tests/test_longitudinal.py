import io
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import AssessmentModel, MeasurementModel, ComparisonModel, utc_now
from app.services.analysis_orchestrator import set_analysis_engine, reset_analysis_engine
from tests.test_assessments import generate_test_video_bytes


@pytest.fixture(autouse=True)
def cleanup():
    yield
    reset_analysis_engine()


def _create_and_analyze_assessment(
    client: TestClient,
    patient_id: str,
    latency: float = 248.0,
    velocity: float = 4.85,
    gain: float = 0.94,
    protocol_version: str = "ocutrack-protocol-0.1",
    quality_status: str = "acceptable",
) -> str:
    """Helper creating and analyzing an assessment session with custom biometric values."""
    a_res = client.post("/api/assessments", json={
        "patient_id": patient_id,
        "protocol_version": protocol_version,
        "test_type": "both",
    })
    asm_id = a_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    files1 = {"file": ("pupil.mp4", io.BytesIO(video_bytes), "video/mp4")}
    client.post(f"/api/assessments/{asm_id}/pupil-video", files=files1)

    files2 = {"file": ("pursuit.mp4", io.BytesIO(video_bytes), "video/mp4")}
    client.post(f"/api/assessments/{asm_id}/pursuit-video", files=files2)

    def engine_fn(*args, **kwargs):
        return {
            "quality": {
                "status": quality_status,
                "usable_frame_ratio": 0.95 if quality_status == "acceptable" else 0.45,
                "warnings": []
            },
            "pupil": {
                "status": "complete" if quality_status == "acceptable" else "insufficient_quality",
                "features": {
                    "constriction_latency": {"value": latency, "unit": "ms", "label": "Constriction Latency"},
                    "constriction_velocity": {"value": velocity, "unit": "mm/s", "label": "Max Constriction Velocity"},
                },
                "series": []
            },
            "pursuit": {
                "status": "complete" if quality_status == "acceptable" else "insufficient_quality",
                "features": {
                    "tracking_gain": {"value": gain, "unit": "ratio", "label": "Smooth Pursuit Gain"},
                },
                "series": []
            },
            "temporal_model": {
                "status": "experimental",
                "model_name": "TCN-Temporal-Evaluator-v0.1",
                "output": {"temporal_smoothness_index": 0.92}
            },
            "warnings": []
        }

    set_analysis_engine(engine_fn)
    client.post(f"/api/assessments/{asm_id}/analyze")
    return asm_id


def test_first_visit_establishes_baseline(client: TestClient, db_session: Session):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-01",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    asm_id = _create_and_analyze_assessment(client, patient_id)

    res = client.get(f"/api/assessments/{asm_id}")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "complete"
    assert "Baseline established" in data["review_message"]
    assert data["longitudinal_comparison"]["status"] == "not_available"
    assert data["longitudinal_comparison"]["baseline_id"] == asm_id

    # Verify is_baseline flag in database
    db_asm = db_session.query(AssessmentModel).filter_by(id=asm_id).first()
    assert db_asm.is_baseline is True


def test_second_visit_comparable_no_change(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-02",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    # Visit 1 (Baseline)
    asm1_id = _create_and_analyze_assessment(client, patient_id, latency=248.0, velocity=4.85, gain=0.94)

    # Visit 2 (Stable follow-up: subtle difference within tolerance)
    asm2_id = _create_and_analyze_assessment(client, patient_id, latency=250.0, velocity=4.82, gain=0.93)

    res2 = client.get(f"/api/assessments/{asm2_id}")
    assert res2.status_code == 200
    data2 = res2.json()

    assert data2["longitudinal_comparison"]["status"] == "comparable"
    assert data2["longitudinal_comparison"]["baseline_id"] == asm1_id

    deltas = data2["longitudinal_comparison"]["feature_deltas"]
    assert deltas["constriction_latency"]["direction"] == "stable"
    assert deltas["constriction_velocity"]["direction"] == "stable"
    assert deltas["tracking_gain"]["direction"] == "stable"

    assert "No notable change detected in measured features" in data2["review_message"]


def test_second_visit_comparable_with_significant_changes(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-03",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    # Visit 1 (Baseline)
    asm1_id = _create_and_analyze_assessment(client, patient_id, latency=240.0, velocity=4.80, gain=0.95)

    # Visit 2 (Change detected: latency increased +35ms, gain dropped -0.15)
    asm2_id = _create_and_analyze_assessment(client, patient_id, latency=275.0, velocity=4.75, gain=0.80)

    res2 = client.get(f"/api/assessments/{asm2_id}")
    data2 = res2.json()

    assert data2["longitudinal_comparison"]["status"] == "comparable"
    deltas = data2["longitudinal_comparison"]["feature_deltas"]

    assert deltas["constriction_latency"]["delta"] == 35.0
    assert deltas["constriction_latency"]["direction"] == "increased"

    assert deltas["tracking_gain"]["delta"] == -0.15
    assert deltas["tracking_gain"]["direction"] == "decreased"

    assert "Change detected in constriction latency, smooth pursuit gain" in data2["review_message"]
    assert "clinical review" in data2["review_message"]

    # Verify patient registry reflects feature change recorded
    p_detail = client.get(f"/api/patients/{patient_id}").json()
    assert p_detail["feature_change_recorded"] is True


def test_non_comparable_protocol_version_mismatch(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-04",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    # Baseline with protocol 0.1
    asm1_id = _create_and_analyze_assessment(
        client, patient_id, protocol_version="ocutrack-protocol-0.1"
    )

    # Visit 2 with protocol 0.2
    asm2_id = _create_and_analyze_assessment(
        client, patient_id, protocol_version="ocutrack-protocol-0.2"
    )

    res2 = client.get(f"/api/assessments/{asm2_id}")
    data2 = res2.json()

    assert data2["longitudinal_comparison"]["status"] == "not_comparable"
    assert "Protocol version mismatch" in data2["longitudinal_comparison"]["comparability_reason"]
    assert "Comparison unavailable" in data2["review_message"]


def test_non_comparable_insufficient_recording_quality(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-05",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    # Baseline
    _create_and_analyze_assessment(client, patient_id, quality_status="acceptable")

    # Visit 2 has poor quality
    asm2_id = _create_and_analyze_assessment(client, patient_id, quality_status="insufficient")

    res2 = client.get(f"/api/assessments/{asm2_id}")
    data2 = res2.json()

    assert data2["quality_status"] == "insufficient"
    assert "Insufficient recording quality" in data2["review_message"]


def test_compare_endpoint_explicit_baseline_selection(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-06",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    asm1_id = _create_and_analyze_assessment(client, patient_id, latency=240.0)
    asm2_id = _create_and_analyze_assessment(client, patient_id, latency=260.0)
    asm3_id = _create_and_analyze_assessment(client, patient_id, latency=270.0)

    # Force compare asm3 against asm2 instead of default baseline asm1
    compare_res = client.post(
        f"/api/assessments/{asm3_id}/compare",
        json={"baseline_id": asm2_id}
    )
    assert compare_res.status_code == 200
    comp_data = compare_res.json()["longitudinal_comparison"]
    assert comp_data["status"] == "comparable"
    assert comp_data["baseline_id"] == asm2_id
    assert comp_data["feature_deltas"]["constriction_latency"]["delta"] == 10.0


def test_history_endpoint_populates_features_for_trends(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-LONG-07",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    _create_and_analyze_assessment(client, patient_id, latency=245.0, velocity=4.80, gain=0.92)
    _create_and_analyze_assessment(client, patient_id, latency=255.0, velocity=4.70, gain=0.90)

    hist_res = client.get(f"/api/patients/{patient_id}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()

    assert len(history) == 2
    for item in history:
        assert "features" in item
        assert "latency_ms" in item["features"]
        assert "constriction_velocity" in item["features"]
        assert "tracking_gain" in item["features"]
        assert item["features"]["latency_ms"] in [245.0, 255.0]
