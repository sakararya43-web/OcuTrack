from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.db.models import PatientModel, ConsentModel


def test_create_patient_success(client: TestClient, db_session: Session):
    payload = {
        "pseudonymous_code": "OT-0001",
        "age_band": "40-49",
        "context_notes": "Baseline screening participant",
        "consent": {
            "consent_status": "granted",
            "purpose": "hackathon_demo"
        }
    }

    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["pseudonymous_code"] == "OT-0001"
    assert data["age_band"] == "40-49"
    assert data["context_notes"] == "Baseline screening participant"
    assert data["consent_status"] == "granted"
    assert data["consent_purpose"] == "hackathon_demo"
    assert "patient_id" in data
    assert data["assessment_count"] == 0

    # Verify real database persistence
    db_patient = db_session.query(PatientModel).filter_by(pseudonymous_code="OT-0001").first()
    assert db_patient is not None
    assert db_patient.id == data["patient_id"]
    assert len(db_patient.consents) == 1
    assert db_patient.consents[0].consent_status == "granted"


def test_create_patient_duplicate_code_conflict(client: TestClient):
    payload = {
        "pseudonymous_code": "OT-DUPLICATE",
        "age_band": "30-39",
        "consent": {
            "consent_status": "granted",
            "purpose": "hackathon_demo"
        }
    }

    # First creation succeeds
    res1 = client.post("/api/patients", json=payload)
    assert res1.status_code == 201

    # Second creation with identical pseudonymous_code returns 409 Conflict
    res2 = client.post("/api/patients", json=payload)
    assert res2.status_code == 409
    error_data = res2.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "CONFLICT"
    assert "already exists" in error_data["detail"]


def test_create_patient_empty_code_validation_error(client: TestClient):
    payload = {
        "pseudonymous_code": "   ",
        "consent": {
            "consent_status": "granted",
            "purpose": "hackathon_demo"
        }
    }

    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    error_data = response.json()
    assert "error" in error_data
    assert error_data["error"]["code"] == "VALIDATION_ERROR"


def test_list_patients(client: TestClient):
    # Register two patients
    client.post("/api/patients", json={
        "pseudonymous_code": "OT-0002",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    client.post("/api/patients", json={
        "pseudonymous_code": "OT-0003",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })

    response = client.get("/api/patients")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    codes = [p["pseudonymous_code"] for p in data]
    assert "OT-0002" in codes
    assert "OT-0003" in codes


def test_get_patient_by_id(client: TestClient):
    create_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-0004",
        "age_band": "60-69",
        "context_notes": "Follow-up group",
        "consent": {"consent_status": "granted", "purpose": "research"}
    })
    patient_id = create_res.json()["patient_id"]

    get_res = client.get(f"/api/patients/{patient_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["patient_id"] == patient_id
    assert data["pseudonymous_code"] == "OT-0004"
    assert data["age_band"] == "60-69"


def test_get_nonexistent_patient_returns_404(client: TestClient):
    response = client.get("/api/patients/non-existent-id")
    assert response.status_code == 404
    error_data = response.json()
    assert error_data["error"]["code"] == "NOT_FOUND"


def test_get_patient_history_empty_for_new_patient(client: TestClient):
    create_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-0005",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = create_res.json()["patient_id"]

    history_res = client.get(f"/api/patients/{patient_id}/history")
    assert history_res.status_code == 200
    assert history_res.json() == []


def test_get_history_for_nonexistent_patient_returns_404(client: TestClient):
    response = client.get("/api/patients/non-existent-id/history")
    assert response.status_code == 404


def test_create_patient_denied_consent(client: TestClient, db_session: Session):
    payload = {
        "pseudonymous_code": "OT-DENIED-1",
        "consent": {
            "consent_status": "denied",
            "purpose": "demo"
        }
    }
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    assert response.json()["consent_status"] == "denied"


def test_create_patient_invalid_consent_status(client: TestClient):
    payload = {
        "pseudonymous_code": "OT-INVALID-CONSENT",
        "consent": {
            "consent_status": "invalid_status",
            "purpose": "demo"
        }
    }
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422

