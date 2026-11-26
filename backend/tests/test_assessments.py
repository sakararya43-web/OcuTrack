import os
import io
import json
import tempfile
from pathlib import Path
import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import AssessmentModel


def generate_test_video_bytes(duration_sec: float = 1.0, fps: int = 30) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(tmp_path, fourcc, float(fps), (320, 240))
        num_frames = int(duration_sec * fps)
        for _ in range(num_frames):
            frame = np.zeros((240, 320, 3), dtype=np.uint8)
            out.write(frame)
        out.release()

        with open(tmp_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@pytest.fixture
def consented_patient_id(client: TestClient) -> str:
    res = client.post("/api/patients", json={
        "pseudonymous_code": f"OT-TEST-{np.random.randint(1000, 9999)}",
        "age_band": "40-49",
        "consent": {"consent_status": "granted", "purpose": "hackathon_demo"}
    })
    return res.json()["patient_id"]


def test_create_assessment_success(client: TestClient, consented_patient_id: str):
    payload = {
        "patient_id": consented_patient_id,
        "protocol_version": "ocutrack-protocol-0.1",
        "test_type": "both",
        "device_metadata": {
            "user_agent": "TestBrowser/1.0",
            "screen_width": 1920,
            "screen_height": 1080
        },
        "lighting_metadata": {
            "method": "controlled_ambient",
            "notes": "Even office lighting"
        }
    }
    response = client.post("/api/assessments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "assessment_id" in data
    assert data["patient_id"] == consented_patient_id
    assert data["status"] == "created"
    assert data["quality_status"] == "pending"
    assert data["protocol_version"] == "ocutrack-protocol-0.1"
    assert data["pupil"]["status"] == "not_provided"
    assert data["pursuit"]["status"] == "not_provided"


def test_create_assessment_patient_not_found(client: TestClient):
    payload = {
        "patient_id": "non-existent-patient-id",
        "protocol_version": "ocutrack-protocol-0.1"
    }
    response = client.post("/api/assessments", json=payload)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_create_assessment_denied_consent_rejected(client: TestClient):
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-NO-CONSENT-01",
        "consent": {"consent_status": "denied", "purpose": "demo"}
    })
    denied_patient_id = p_res.json()["patient_id"]

    response = client.post("/api/assessments", json={"patient_id": denied_patient_id})
    assert response.status_code == 422
    assert "consent has not been granted" in response.json()["detail"]


def test_upload_pupil_video_success(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    metadata = {
        "protocol_version": "ocutrack-protocol-0.1",
        "test_type": "pupil_reflex",
        "duration_ms": 1000,
        "is_fallback": False
    }

    files = {"file": ("pupil_test.mp4", io.BytesIO(video_bytes), "video/mp4")}
    data = {"metadata_json": json.dumps(metadata)}

    response = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["assessment_id"] == assessment_id
    assert res_data["pupil"]["status"] == "complete"
    assert res_data["status"] == "created"  # Still waiting for pursuit in a "both" test


def test_upload_both_videos_transitions_to_uploaded(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id, "test_type": "both"})
    assessment_id = create_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)

    # 1. Upload Pupil Video
    files1 = {"file": ("pupil_test.mp4", io.BytesIO(video_bytes), "video/mp4")}
    res1 = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files1)
    assert res1.status_code == 200
    assert res1.json()["status"] == "created"

    # 2. Upload Pursuit Video
    pursuit_metadata = {
        "target_path": {
            "path_version": "horizontal-sweep-v1",
            "coordinates_normalized": [{"t_ms": 0, "x": 0.5, "y": 0.5}]
        }
    }
    files2 = {"file": ("pursuit_test.mp4", io.BytesIO(video_bytes), "video/mp4")}
    data2 = {"metadata_json": json.dumps(pursuit_metadata)}
    res2 = client.post(f"/api/assessments/{assessment_id}/pursuit-video", files=files2, data=data2)

    assert res2.status_code == 200
    res2_data = res2.json()
    assert res2_data["pupil"]["status"] == "complete"
    assert res2_data["pursuit"]["status"] == "complete"
    assert res2_data["status"] == "uploaded"


def test_upload_corrupt_video_rejected(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    corrupt_bytes = b"not a valid video container stream"
    files = {"file": ("broken.mp4", io.BytesIO(corrupt_bytes), "video/mp4")}

    response = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_upload_unsupported_extension_rejected(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    files = {"file": ("script.sh", io.BytesIO(b"echo hello"), "text/plain")}
    response = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files)
    assert response.status_code == 422


def test_upload_malformed_metadata_rejected(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    files = {"file": ("pupil.mp4", io.BytesIO(video_bytes), "video/mp4")}
    data = {"metadata_json": "{not valid json"}

    response = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files, data=data)
    assert response.status_code == 422


def test_get_assessment_by_id(client: TestClient, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    get_res = client.get(f"/api/assessments/{assessment_id}")
    assert get_res.status_code == 200
    assert get_res.json()["assessment_id"] == assessment_id


def test_get_nonexistent_assessment_returns_404(client: TestClient):
    response = client.get("/api/assessments/unknown-asm-id")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_reupload_cleans_up_previous_file(client: TestClient, db_session: Session, consented_patient_id: str):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    files1 = {"file": ("pupil1.mp4", io.BytesIO(video_bytes), "video/mp4")}
    res1 = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files1)
    assert res1.status_code == 200

    asm1 = db_session.query(AssessmentModel).filter_by(id=assessment_id).first()
    first_path = asm1.pupil_video_path
    assert first_path is not None
    assert Path(first_path).exists()

    # Upload second video replacing the first
    files2 = {"file": ("pupil2.mp4", io.BytesIO(video_bytes), "video/mp4")}
    res2 = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files2)
    assert res2.status_code == 200

    # Verify first file was cleaned up from filesystem
    assert not Path(first_path).exists()

    asm2 = db_session.query(AssessmentModel).filter_by(id=assessment_id).first()
    second_path = asm2.pupil_video_path
    assert second_path != first_path
    assert Path(second_path).exists()

    # Clean up second file after test
    Path(second_path).unlink(missing_ok=True)


def test_upload_accepts_mime_type_with_codec_parameters(
    client: TestClient,
    db_session: Session,
    consented_patient_id: str,
):
    create_res = client.post("/api/assessments", json={"patient_id": consented_patient_id})
    assessment_id = create_res.json()["assessment_id"]

    video_bytes = generate_test_video_bytes(duration_sec=1.0)
    files = {"file": ("pupil_recording.webm", io.BytesIO(video_bytes), "video/webm;codecs=vp9")}

    response = client.post(f"/api/assessments/{assessment_id}/pupil-video", files=files)
    assert response.status_code == 200
    assert response.json()["pupil"]["status"] == "complete"

    asm = db_session.query(AssessmentModel).filter_by(id=assessment_id).first()
    if asm and asm.pupil_video_path:
        Path(asm.pupil_video_path).unlink(missing_ok=True)
