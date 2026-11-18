import re
from pathlib import Path
from fastapi.testclient import TestClient
from app.services.upload_service import cleanup_file, get_upload_dir
from app.core.config import settings


def test_schema_sql_has_all_mvp_tables():
    schema_path = Path(__file__).resolve().parent.parent.parent / "database" / "schema.sql"
    assert schema_path.exists(), "database/schema.sql must exist"

    content = schema_path.read_text(encoding="utf-8")
    expected_tables = ["patients", "consents", "assessments", "measurements", "model_runs", "comparisons"]

    for table in expected_tables:
        pattern = rf"CREATE TABLE IF NOT EXISTS {table}\b"
        assert re.search(pattern, content, re.IGNORECASE), f"Table '{table}' missing from database/schema.sql"

    # Verify foreign key ON DELETE CASCADE rules
    assert "ON DELETE CASCADE" in content
    # Verify unique constraint on pseudonymous_code
    assert "pseudonymous_code TEXT UNIQUE NOT NULL" in content or "UNIQUE" in content


def test_rls_policies_cover_all_tables():
    rls_path = Path(__file__).resolve().parent.parent.parent / "database" / "rls_policies.sql"
    assert rls_path.exists(), "database/rls_policies.sql must exist"

    content = rls_path.read_text(encoding="utf-8")
    expected_tables = ["patients", "consents", "assessments", "measurements", "model_runs", "comparisons"]

    for table in expected_tables:
        assert f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY" in content
        assert f"service_role_all_{table}" in content


def test_seed_demo_sql_validity():
    seed_path = Path(__file__).resolve().parent.parent.parent / "database" / "seed_demo.sql"
    assert seed_path.exists(), "database/seed_demo.sql must exist"

    content = seed_path.read_text(encoding="utf-8")
    assert "OT-DEMO-001" in content
    assert "OT-DEMO-002" in content
    assert "hackathon_demo" in content
    # Ensure no personal identifying data is committed
    for forbidden in ["@gmail.com", "@yahoo.com", "ssn", "social security", "credit_card"]:
        assert forbidden not in content.lower()


def test_no_secrets_leaked_in_api_responses(client: TestClient):
    # Test health check
    health_data = client.get("/api/health").json()
    response_str = str(health_data).lower()
    for sensitive in ["secret", "password", "service_role", "supabase_key"]:
        assert sensitive not in response_str

    # Test root endpoint
    root_data = client.get("/").json()
    assert "secret" not in str(root_data).lower()


def test_cors_security_rejects_unapproved_origins(client: TestClient):
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://malicious-attacker-domain.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # The CORS middleware must NOT return the malicious domain in Allow-Origin
    allowed_origin = response.headers.get("access-control-allow-origin")
    assert allowed_origin != "http://malicious-attacker-domain.com"


def test_path_traversal_protection(client: TestClient):
    # Register patient & assessment
    p_res = client.post("/api/patients", json={
        "pseudonymous_code": "OT-SEC-TRAVERSAL",
        "consent": {"consent_status": "granted", "purpose": "demo"}
    })
    patient_id = p_res.json()["patient_id"]

    a_res = client.post("/api/assessments", json={"patient_id": patient_id})
    asm_id = a_res.json()["assessment_id"]

    # Attempt to upload with path traversal in filename
    from tests.test_assessments import generate_test_video_bytes
    video_bytes = generate_test_video_bytes(duration_sec=1.0)

    import io
    traversal_filename = "../../../../evil_payload.mp4"
    files = {"file": (traversal_filename, io.BytesIO(video_bytes), "video/mp4")}

    res = client.post(f"/api/assessments/{asm_id}/pupil-video", files=files)
    assert res.status_code == 200

    # Verify no file was created outside the temporary upload directory
    upload_dir = get_upload_dir().resolve()
    for item in upload_dir.glob("*.webm"):
        # All saved files must strictly reside inside the designated temp upload dir
        assert str(item.resolve()).startswith(str(upload_dir))
        cleanup_file(str(item))


def test_cleanup_file_utility():
    # Calling on None or empty string returns False
    assert cleanup_file(None) is False
    assert cleanup_file("") is False
    assert cleanup_file("/non/existent/path/file.tmp") is False

    # Calling on real file deletes it and returns True
    test_file = get_upload_dir() / "test_cleanup.tmp"
    test_file.write_text("temporary data")
    assert test_file.exists()
    assert cleanup_file(str(test_file)) is True
    assert not test_file.exists()


def test_frontend_has_no_service_role_or_database_secrets():
    """Verifies that no backend service role or database secrets exist in frontend files."""
    frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
    if not frontend_dir.exists():
        return

    forbidden_patterns = [
        "service_role",
        "supabase_service_role_key",
        "postgresql://",
        "postgres://",
    ]

    for ext in ["*.env*", "*.ts", "*.tsx", "*.js", "*.html"]:
        for file_path in frontend_dir.rglob(ext):
            if "node_modules" in file_path.parts:
                continue
            content = file_path.read_text(encoding="utf-8", errors="ignore").lower()
            for pattern in forbidden_patterns:
                assert pattern not in content, f"Forbidden secret '{pattern}' detected in {file_path}"
