# OcuTrack — Parth Implementation Plan

**Owner:** Parth  
**Git branch:** `parth`  
**Branch rule:** Parth commits all backend, database, and deployment work only to branch `parth`; changes reach `main` through a reviewed pull request.  
**Workstream:** FastAPI backend, API contracts, Supabase/PostgreSQL, longitudinal comparison, orchestration, security, and deployment  
**Document type:** Individual implementation specification  
**Parent specification:** `PRD.md` v1.0  
**Target:** Hackathon MVP — backend services for a browser-based prototype

---

## Team-wide branch policy

- `main` — Sakar commits directly here.
- `aditya` — Aditya commits only here; submit a PR to `main`.
- `parth` — Parth commits only here; submit a PR to `main`.
- There is no `integration` branch and no extra feature branch in this workflow.
- Keep ownership isolated and keep each branch synchronized with the latest `main` before submitting a PR.

## 1. Mission and ownership

Parth owns the integration backbone between Sakar's React frontend and Aditya's Python analysis engine. This includes FastAPI endpoints, Pydantic request/response schemas, Supabase PostgreSQL persistence, analysis orchestration, across-visit longitudinal comparison, security controls, backend tests, and backend deployment.

The backend must make the overall workflow predictable: create a pseudonymous patient, create an assessment, receive the pupil and pursuit recordings, call Aditya's analysis package, save the extracted values, compare them with a previous accepted assessment when appropriate, and return a stable result to the frontend.

### Parth owns

- FastAPI project and application startup.
- Pydantic request/response models and versioned API contract.
- Patient, consent, assessment, measurement, model-run, and comparison persistence.
- Supabase PostgreSQL connection and SQL schema/migrations.
- Row Level Security and secret management configuration.
- Upload validation, temporary file management, and automatic cleanup.
- Orchestration that invokes Aditya's analysis engine.
- Longitudinal comparison across separate assessment dates.
- Comparability checks using protocol/device/lighting/quality metadata.
- Neutral review messages based on documented rules.
- Report/history API responses.
- Backend tests, integration tests, and error handling.
- Render backend deployment and Supabase configuration.

### Parth does not own

- React pages, browser camera capture, MediaRecorder, or charts (Sakar).
- MediaPipe/OpenCV pupil segmentation, tracking features, TCN architecture/training, or core model evaluation (Aditya).
- Clinical diagnoses or disease-specific risk thresholds.

Parth may write small adapters around Aditya's engine, but must not duplicate its image processing or ML implementation.

---

## 2. Product and safety context

OcuTrack is a hackathon prototype for browser-based ocular measurement and longitudinal change monitoring. It is not a native mobile application, validated medical device, or disease-diagnosis system.

The backend stores measurements and comparison history and returns neutral messages. It must not infer that a patient has or does not have a disease. It must not assign emergency urgency using an unvalidated ML output.

### Allowed backend result messages

- `Insufficient recording quality — repeat test.`
- `No notable change detected in measured features.`
- `Change detected — consider repeat measurement and clinical review.`
- `Comparison unavailable — recordings are not sufficiently comparable.`
- `Experimental model output; not clinically validated.`

A clinician is responsible for interpretation. The backend's output is decision support for a prototype, not a medical decision.

---

## No-scaffolding rule — applies to the whole project

This is an implementation plan, not a request to generate empty project scaffolding. Build working features phase by phase.

- Do **not** pre-create the entire directory tree, empty components, empty modules, placeholder routes, stub functions, unused configuration, or TODO-only files.
- Create a file or directory only when its first real implementation is being written in the active phase.
- Every committed module must perform its stated responsibility, be imported/called by a real path, or be a meaningful test/documentation asset. Remove dead files and unused dependencies.
- Do not ship fake API responses, hardcoded physiological measurements, fabricated model predictions, or mock analysis in the demo path.
- Synthetic fixtures are allowed only in automated tests or a clearly labelled demo-data mode. They must never be presented as real patient measurements or clinical evidence.
- Do not create speculative features outside the PRD. Prefer a small, end-to-end working vertical slice over many incomplete screens or services.
- At the end of every phase, the owned part must run and have a test or repeatable verification procedure. Do not leave the branch in a knowingly broken state.

## 3. Technology stack

| Layer | Required technology | Usage |
|---|---|---|
| Backend | Python + FastAPI | REST API and orchestration |
| Validation | Pydantic | Request/response contracts |
| Database | Supabase PostgreSQL | Patient and assessment persistence |
| DB access | PostgreSQL driver / SQLAlchemy or Supabase server-side client | Backend-only database access |
| File handling | Python tempfile/pathlib | Temporary video processing |
| ML integration | Import Aditya's `analysis` package | Run CV and TCN pipeline |
| Testing | Pytest + HTTPX | Unit and API integration tests |
| Deployment | Render | FastAPI service |
| Secrets | Render environment variables + Supabase secrets | Database/API configuration |

Keep one FastAPI service for the MVP. Do not add microservices, a message broker, Kubernetes, or a second database unless there is a demonstrated need.

---

## 4. Backend ownership map (create incrementally)

The layout below is an ownership map, not a command to pre-create empty files. Create each path only when implementing a working responsibility. Keep backend and database ownership within these paths. Do not edit Sakar's frontend or Aditya's analysis package.

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── router.py
│   │   ├── patients.py
│   │   ├── assessments.py
│   │   └── health.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── errors.py
│   ├── db/
│   │   ├── connection.py
│   │   └── repositories/
│   │       ├── patients.py
│   │       ├── assessments.py
│   │       └── comparisons.py
│   ├── schemas/
│   │   ├── common.py
│   │   ├── patients.py
│   │   ├── assessments.py
│   │   └── analysis.py
│   ├── services/
│   │   ├── upload_service.py
│   │   ├── analysis_orchestrator.py
│   │   └── report_service.py
│   └── longitudinal/
│       ├── comparability.py
│       └── comparison.py
├── tests/
│   ├── test_patients.py
│   ├── test_assessments.py
│   ├── test_analysis_api.py
│   └── test_longitudinal.py
├── requirements.txt
└── README.md

database/
├── schema.sql
├── seed_demo.sql
└── rls_policies.sql
```

If the team prefers a `backend/analysis/` package location, coordinate with Aditya first. The default integration plan is that Aditya's `analysis/` package sits at the repository root and is imported by the backend service.

---

## 5. Shared integration contract — lock this early

This section is the backend source of truth for API contracts. Before implementation proceeds independently, share the final version with Sakar and Aditya and record any agreed changes in `docs/integration-contract.md`.

### 5.1 Common status enums

```text
AssessmentStatus:
  created | uploaded | processing | complete | failed

TestStatus:
  complete | insufficient_quality | failed | not_provided

QualityStatus:
  pending | acceptable | insufficient

ModelStatus:
  not_configured | experimental | evaluated | failed

ComparisonStatus:
  not_available | comparable | not_comparable
```

Use these exact strings throughout API, database, and frontend unless the team coordinates a versioned change.

### 5.2 Patient endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/patients` | Create pseudonymous patient and consent record. |
| `GET` | `/api/patients` | List patients. |
| `GET` | `/api/patients/{patient_id}` | Retrieve patient detail. |

Suggested create request:

```json
{
  "pseudonymous_code": "OT-0001",
  "age_band": "40-49",
  "context_notes": null,
  "consent": {
    "consent_status": "granted",
    "purpose": "hackathon_demo"
  }
}
```

The values are examples. Real identity details are not required for the hackathon MVP.

### 5.3 Assessment endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/assessments` | Create assessment and capture protocol/device/lighting metadata. |
| `POST` | `/api/assessments/{assessment_id}/pupil-video` | Upload pupil-response video. |
| `POST` | `/api/assessments/{assessment_id}/pursuit-video` | Upload smooth-pursuit video and target trajectory metadata. |
| `POST` | `/api/assessments/{assessment_id}/analyze` | Run analysis and persist outputs. |
| `GET` | `/api/assessments/{assessment_id}` | Retrieve assessment and report result. |
| `GET` | `/api/patients/{patient_id}/history` | Retrieve prior accepted assessments. |
| `POST` | `/api/assessments/{assessment_id}/compare` | Compare selected assessment with baseline/prior assessment. |
| `GET` | `/api/health` | Service health. |

For video upload, use `multipart/form-data` with a `file` field and a `metadata_json` field. Validate MIME type and actual decodability; do not trust file extension alone.

### 5.4 Analysis-engine interface

Aditya will implement a Python package entry point similar to:

```python
analyze_assessment(
    pupil_video_path=Path(...),
    pursuit_video_path=Path(...) | None,
    pupil_metadata={...},
    pursuit_metadata={...} | None,
    model_config={...} | None,
) -> dict
```

Parth's `analysis_orchestrator.py` must call this entry point, validate its output against the agreed schema, store the results, then call the longitudinal component. Do not reimplement image processing or TCN logic in the backend.

### 5.5 Result response shape

The assessment response must include:

- `assessment_id`, `patient_id`, `status`, `assessment_at`.
- `quality.status`, `quality.usable_frame_ratio`, and `quality.warnings`.
- `pupil.status`, `pupil.features`, and `pupil.series`.
- `pursuit.status`, `pursuit.features`, and `pursuit.series`.
- `temporal_model.status`, `model_name`, `model_version`, `output`, and `notes`.
- `longitudinal_comparison.status`, selected baseline ID, comparability reason, and feature deltas.
- `review_message` and an explicit non-diagnostic notice.

Values that cannot be computed must remain `null` and include a warning where appropriate. Never convert missing values to zero.

---

## 6. FastAPI implementation

### 6.1 Application setup

- Create `FastAPI` app with title/version and `/api` router.
- Configure CORS for the deployed Vercel frontend origin and localhost development origin only.
- Use environment-based configuration; no secrets in source code.
- Add `/api/health` returning application and database readiness separately.
- Add consistent error response shape, request validation, and structured server logs.

### 6.2 Patient service

- Create patient with unique pseudonymous code.
- Persist consent status and purpose.
- Retrieve list/detail.
- Validate unknown IDs and duplicate codes.
- Avoid collecting unnecessary direct identifiers.

### 6.3 Assessment service

- Create a new assessment linked to a patient.
- Store protocol version, device metadata, lighting metadata, and timestamp.
- Store separate file-upload state for pupil and pursuit recordings.
- Do not mark an assessment complete before analysis and persistence succeed.
- Handle a missing pursuit file as `not_provided` if the MVP permits a pupil-only test; otherwise reject it according to the final product decision.

### 6.4 Upload service

- Enforce maximum upload size and duration.
- Validate extension, declared MIME type, and successful decode.
- Save to a unique temporary directory with non-guessable names.
- Never use a user-provided filename as a server path.
- Avoid logging file contents or sensitive identifiers.
- Delete files after analysis by default, including on exceptions.
- If temporary files must survive a request boundary, use a private temporary storage path and cleanup job; do not use a public bucket.

### 6.5 Analysis orchestration

`analysis_orchestrator.py` should:

1. Confirm the assessment exists and has required uploads.
2. Mark state `processing`.
3. Resolve temporary paths and metadata.
4. Call Aditya's analysis package.
5. Validate the returned structure and enum values.
6. Persist feature values, series data, quality metrics, and model-run metadata.
7. Run comparability checks against the selected prior assessment/baseline.
8. Persist longitudinal comparison if comparable.
9. Generate a neutral review message.
10. Mark assessment `complete`, or `failed` with a safe error summary.
11. Delete temporary videos in a `finally` block.

If Aditya’s analysis package is not yet merged, keep the orchestration dependency behind the agreed callable interface and return a clear `analysis_engine_unavailable` service error in the application path. A fake callable may be injected only in isolated automated tests; never return mock measurements or predictions through the demo API.

---

## 7. Supabase PostgreSQL database

### 7.1 Required tables

#### `patients`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Internal patient key. |
| `pseudonymous_code` | TEXT unique not null | Example `OT-0001`. |
| `age_band` | TEXT nullable | Optional broad age band. |
| `context_notes` | TEXT nullable | Avoid identifiable information. |
| `created_at` | TIMESTAMPTZ | Server default. |

#### `consents`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Consent record. |
| `patient_id` | UUID FK | Related patient. |
| `consent_status` | TEXT | `granted`, `withdrawn`, `not_recorded`. |
| `purpose` | TEXT | `hackathon_demo`, `technical_testing`, etc. |
| `recorded_at` | TIMESTAMPTZ | Server timestamp. |

#### `assessments`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Assessment key. |
| `patient_id` | UUID FK | Related patient. |
| `assessment_at` | TIMESTAMPTZ | Assessment time. |
| `status` | TEXT | Assessment enum. |
| `protocol_version` | TEXT | Test protocol. |
| `device_metadata` | JSONB | Browser/camera properties where available. |
| `lighting_metadata` | JSONB | Controlled light procedure details. |
| `quality_status` | TEXT | Quality enum. |
| `is_baseline` | BOOLEAN | Selected baseline flag. |
| `created_at` | TIMESTAMPTZ | Server timestamp. |

#### `measurements`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Measurement key. |
| `assessment_id` | UUID FK | Related assessment. |
| `test_type` | TEXT | `pupil_reflex` or `smooth_pursuit`. |
| `feature_name` | TEXT | Stable feature identifier. |
| `feature_value` | DOUBLE PRECISION nullable | Null if unavailable. |
| `unit` | TEXT | Required measurement unit. |
| `series_data` | JSONB nullable | Timestamped data when needed. |
| `created_at` | TIMESTAMPTZ | Server timestamp. |

#### `model_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Model run. |
| `assessment_id` | UUID FK | Related assessment. |
| `model_name` | TEXT | Model identifier. |
| `model_version` | TEXT nullable | Version/commit. |
| `input_schema_version` | TEXT | Feature schema version. |
| `status` | TEXT | Model status enum. |
| `output` | JSONB nullable | Experimental/non-diagnostic output. |
| `evaluation_context` | JSONB | Dataset/evaluation notes. |
| `created_at` | TIMESTAMPTZ | Server timestamp. |

#### `comparisons`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID primary key | Comparison key. |
| `patient_id` | UUID FK | Related patient. |
| `current_assessment_id` | UUID FK | Current assessment. |
| `baseline_assessment_id` | UUID FK | Comparison assessment. |
| `comparable` | BOOLEAN | Whether comparison is valid. |
| `feature_deltas` | JSONB | Absolute and relative differences. |
| `reason` | TEXT nullable | Comparability explanation. |
| `review_message` | TEXT | Neutral result language. |
| `created_at` | TIMESTAMPTZ | Server timestamp. |

Add indexes for `patients.pseudonymous_code`, `assessments.patient_id`, `assessments.assessment_at`, `measurements.assessment_id`, and comparison foreign keys.

### 7.2 Database design rules

- Use UUID primary keys and foreign keys.
- Use `TIMESTAMPTZ` and UTC timestamps in storage; frontend may localize display.
- Store feature names and units consistently with Aditya's feature dictionary.
- Keep raw videos out of PostgreSQL.
- Store short JSONB series only when reasonable for the demo. If series become large, store compact summaries or a private object reference with strict retention.
- Do not store `NaN`/`Infinity` as numeric results; normalize unavailable values to SQL `NULL`.
- Add unique constraints and foreign-key cascades deliberately; avoid deleting a patient without understanding assessment retention.

### 7.3 Supabase security

- Enable RLS on all exposed tables.
- Prefer all database access through FastAPI for this MVP.
- Keep the service-role key and direct database credentials only in backend environment variables.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, DB password, or connection string in a `VITE_` frontend variable.
- If the frontend later uses Supabase client directly, use only the anon key with tested RLS policies; that is not required for the MVP.
- Use a private database/storage configuration and avoid public video buckets.
- Use pseudonymous data and minimum necessary metadata.

---

## 8. Longitudinal comparison engine

Implement this separately from Aditya's within-recording TCN.

### 8.1 Responsibilities

- Select the patient's approved baseline or most recent comparable accepted assessment.
- Compare current feature values with the selected previous values.
- Calculate absolute delta and percentage delta when mathematically valid.
- Preserve units and feature names.
- Determine whether the two assessments are sufficiently comparable.
- Return the exact features that changed and a clear reason.
- Never infer a disease from the delta.

### 8.2 Comparability checks

At minimum, consider:

- Both assessments passed quality checks.
- Same test protocol version or a documented compatible protocol mapping.
- Same test type and same feature definitions.
- Units/normalization method match.
- Device/camera or calibration differences are known and acceptable.
- Lighting method and stimulus procedure are sufficiently consistent.
- Time series and required metadata are available.

If key conditions differ, set `comparable=false` and return a reason such as `Different protocol version` or `Lighting metadata missing`. Do not silently compare incompatible measurements.

### 8.3 Delta calculation

For a numeric feature:

```text
absolute_delta = current_value - baseline_value
percentage_delta = (absolute_delta / abs(baseline_value)) * 100
```

Only calculate percentage delta when the baseline value is non-null and non-zero. If baseline is zero or a ratio is not meaningful for the feature, return `null` and explain why. Do not round away meaningful values in stored data; round only for display.

### 8.4 Change flags

- Use documented, configurable prototype thresholds only for demo/technical change highlighting.
- Store threshold configuration/version with the comparison.
- Label thresholds as experimental, not clinical cutoffs.
- Do not create `low`, `medium`, `high`, or `urgent` medical risk categories from unvalidated thresholds.
- A feature-level change message must state which feature changed, by how much, and whether the recordings were comparable.

### 8.5 Baseline management

- First accepted assessment may be marked baseline.
- Failed/insufficient-quality recordings cannot become baseline.
- Changing a baseline must be explicit and recorded.
- Preserve prior comparisons for traceability.

---

## 9. Neutral report generation

Build a report service that converts structured features and comparison state into frontend-ready data.

Examples:

- Insufficient quality: `Insufficient recording quality — repeat test. The pupil region was not reliably visible.`
- First accepted visit: `Baseline established. Future assessments can be compared when recording conditions are sufficiently similar.`
- Comparable, no configured feature change: `No notable change detected in the measured features compared with the selected baseline. This does not rule out a medical condition.`
- Comparable with changes: `Change detected in [feature list] compared with [date]. Consider repeat measurement and clinical review.`
- Not comparable: `Comparison unavailable because [reason]. Repeat under matching conditions before interpreting a trend.`

These messages are product copy, not medical advice. Never include a disease name as an inferred result.

---

## 10. API response example

The final Pydantic models should follow the shared contract. Example only:

```json
{
  "assessment_id": "uuid",
  "patient_id": "uuid",
  "status": "complete",
  "assessment_at": "2026-11-15T12:00:00Z",
  "quality": {
    "status": "acceptable",
    "usable_frame_ratio": 0.94,
    "warnings": []
  },
  "pupil": {
    "status": "complete",
    "features": {
      "minimum_diameter": {
        "value": null,
        "unit": "px_or_normalized",
        "label": "Minimum pupil size"
      }
    },
    "series": []
  },
  "pursuit": {
    "status": "complete",
    "features": {},
    "series": []
  },
  "temporal_model": {
    "status": "not_configured",
    "model_name": "ocutrack-tcn-experimental",
    "model_version": null,
    "output": null,
    "notes": []
  },
  "longitudinal_comparison": {
    "status": "not_available",
    "baseline_assessment_id": null,
    "comparable": null,
    "reason": "No prior accepted baseline",
    "feature_deltas": {}
  },
  "review_message": "Baseline established. This prototype does not provide a medical diagnosis.",
  "disclaimer": "OcuTrack is a hackathon screening-support prototype, not a diagnostic device."
}
```

Do not replace null placeholders with invented values. The backend response must only expose computed values.

---

## 11. Security, privacy, and retention

- Use pseudonymous patient identifiers.
- Consent must be recorded before accepting recordings.
- Do not require direct identifiers for the demo.
- Validate upload size, type, duration, and content.
- Store uploads temporarily and delete after analysis by default.
- Use private temp paths and ensure cleanup in normal and error paths.
- Never log video bytes, raw patient records, credentials, or access tokens.
- Configure CORS to only the frontend origins needed for development and deployment.
- Keep database credentials, Supabase service key, and secret values in environment variables.
- Enable RLS and verify it, even if all database access uses the backend.
- Avoid publicly accessible video storage.
- Document that this prototype is not approved for real clinical deployment.

---

## 12. Error handling and reliability

Return consistent error bodies, for example:

```json
{
  "error": {
    "code": "INVALID_VIDEO",
    "message": "The uploaded video could not be decoded.",
    "details": null,
    "request_id": "request-id"
  }
}
```

Handle at least:

- Unknown patient/assessment ID.
- Duplicate pseudonymous code.
- Missing consent.
- Unsupported MIME/container/codec.
- File too large or too long.
- Corrupt/unreadable video.
- Missing required pupil recording.
- Missing pursuit video/target metadata where the flow requires it.
- Analysis package exception or timeout.
- Invalid analysis output schema.
- Database unavailable.
- Supabase connectivity failure.
- Non-comparable historical assessments.

Do not leave an assessment stuck in `processing` after an exception. Mark it failed with a safe error summary and clean temporary files.

---

## 13. Testing responsibilities

Parth owns backend, database, longitudinal, and end-to-end API tests.

### Unit tests

- Pydantic request/response validation.
- Patient creation and duplicate code rejection.
- Consent validation.
- Assessment state transitions.
- Upload file size/type validation.
- Temporary file cleanup on success and exception.
- Analysis output schema validation.
- Null and unit persistence.
- Longitudinal absolute/percentage delta calculations.
- Zero/null baseline handling.
- Protocol/device/lighting comparability rules.
- Baseline selection excludes failed/insufficient assessments.
- Neutral review message generation.

### Integration tests

Using a deterministic fake analysis adapter for tests only:

1. Create patient.
2. Create consented assessment.
3. Upload fixture videos.
4. Call analysis endpoint.
5. Verify analysis adapter called with correct paths and metadata.
6. Verify data is stored in database.
7. Create second assessment.
8. Run comparison and verify delta values/status.
9. Verify temporary files are removed.

Then run one additional integration test against Aditya's actual analysis package with a valid sample recording.

### Database tests

- Apply schema from an empty database.
- Apply seed script.
- Verify constraints and indexes.
- Verify RLS behavior for any public/exposed role.
- Ensure service-role key is not present in frontend build artifacts.

---

## 14. Deployment and environment setup

### Environment variables

Create `.env.example` with key names only, never actual secrets:

```env
APP_ENV=development
FRONTEND_ORIGINS=http://localhost:5173
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MAX_UPLOAD_MB=50
MAX_VIDEO_SECONDS=30
TEMP_UPLOAD_DIR=/tmp/ocutrack
MODEL_CONFIG_PATH=
```

Use only the variables actually needed by the selected DB library. Do not duplicate secrets unnecessarily. The service-role key must remain backend-only.

### Deployment checklist

- Deploy FastAPI to Render.
- Configure environment variables through the Render dashboard.
- Configure Vercel origin in CORS.
- Verify HTTPS frontend camera capture.
- Verify frontend can call FastAPI.
- Verify backend can reach Supabase.
- Verify Aditya's OpenCV/MediaPipe/Torch dependencies install and run in the Render environment.
- Test actual video codec compatibility in the deployed container.
- Confirm memory/runtime limits using the target demo videos.
- Provide a local fallback and prepared sample recordings if hosted services are unavailable.

Do not promise that Supabase or Render will be reachable in every network environment. The final demo must have a tested local or sample-data fallback.

---

## 15. Phased implementation plan

Implement a working backend vertical slice in each phase. Do not create placeholder routers, empty services, unused database tables, or fake analysis responses.

### Phase 0 — Contract lock and branch preparation

- Create/use the exact branch name `parth` from the latest agreed `main`.
- Review and agree with Sakar and Aditya on API paths, request/response schemas, status enums, analysis-engine function signature, measurement units, video formats, and pursuit metadata.
- Ensure the agreed API and analysis contract is recorded in `docs/integration-contract.md` on `main` by Sakar. If a technical change is needed, propose it before changing code.
- Confirm Supabase project access, region, environment variables, and use of synthetic/consented non-identifying demo data.
- Define temporary video retention: process from a private temporary location and delete by default after analysis.

**Exit criteria:** Branch `parth` is based on the current `main`; the shared contract is approved; required secrets are available through environment configuration and not committed.

### Phase 1 — Runnable API and persistent patient workflow

- Implement a real FastAPI app, versioned `/api` router, CORS allowlist, configuration, structured errors, and health/readiness endpoint.
- Implement Supabase PostgreSQL schema/migrations for the tables actually used by the MVP.
- Implement patient create/list/detail and consent persistence with validation and uniqueness constraints.
- Add tests against a test database or isolated test setup.
- Return persisted records, not hardcoded demo responses.

**Exit criteria:** Sakar can create, list, and retrieve a pseudonymous patient through the real API; records persist in Supabase; tests pass.

### Phase 2 — Assessment creation and safe video upload

- Implement assessment creation with protocol, device, browser, lighting, test, and timestamp metadata.
- Implement pupil-video and pursuit-video upload endpoints using the agreed `multipart/form-data` contract.
- Validate file size, MIME type, actual decodeability, duration, and supported codec; never trust the extension alone.
- Use server-generated temporary paths, prevent path traversal, limit resource use, and clean up files on success and failure.
- Track assessment and per-test status transitions accurately.

**Exit criteria:** A contract-compliant assessment and both video types can be uploaded; invalid files fail with stable errors; temporary files are cleaned up.

### Phase 3 — Real analysis orchestration and persistence

- Import Aditya's actual `analysis` package and call the agreed `analyze_assessment()` entry point.
- Validate the analysis JSON shape, units, statuses, quality fields, series, and model metadata before persistence.
- Persist computed features, time series, quality warnings, and model version/run metadata.
- If Aditya's package is unavailable at runtime, return a clear service error. Do not fabricate values or silently mark an assessment complete.
- Add an end-to-end backend test using a consented/non-identifying fixture and the real analysis pipeline.

**Exit criteria:** The API can process a real supported recording using Aditya's implementation and return the persisted, schema-valid analysis result.

### Phase 4 — Longitudinal comparison and report API

- Implement selection of a prior accepted assessment/baseline.
- Check comparability before comparing values: test type, protocol version, units/calibration, device/camera metadata, lighting metadata, quality status, and valid-feature availability.
- Calculate feature deltas only for compatible, non-null values with matching units.
- Store comparison provenance, baseline assessment ID, compared assessment ID, feature deltas, and reasons a comparison was skipped.
- Return neutral review messages; never convert feature deltas or model outputs into disease diagnosis or unvalidated urgency.
- Implement patient history and assessment report responses consumed by Sakar.

**Exit criteria:** First visit creates a baseline; second comparable visit produces documented feature changes; non-comparable visits produce a clear explanation and no misleading comparison.

### Phase 5 — Security, testing, and deployment

- Complete unit, API, database, upload, orchestration, and longitudinal tests.
- Enable and verify appropriate Supabase Row Level Security and backend-only privileged credentials.
- Configure Render environment variables, CORS, upload limits, logging, and health checks.
- Verify deployed frontend-to-backend flow and document local fallback instructions.
- Review retention/deletion behavior and remove temporary files even when analysis fails.

**Exit criteria:** Backend deployment or documented local demo works end-to-end; tests pass; no secrets or private videos are committed; error and fallback behavior is repeatable.

### Definition of done

- FastAPI runs with documented commands and actual implemented routes.
- Patient, consent, assessment, and upload records persist correctly.
- The backend invokes Aditya's real package; no mock result is exposed in the app path.
- Longitudinal comparisons enforce comparability and preserve units/nulls.
- Temporary videos are validated and deleted according to policy.
- RLS, secret handling, API tests, and local/deployed demo instructions are complete.
- No disease diagnosis, unsupported urgency, placeholder endpoints, empty services, or unused scaffold files remain.

## 16. Git and integration rules

**Assigned branch: `parth`**

- Create/use the exact branch name `parth` from the latest agreed `main`.
- Commit all Parth-owned backend, database, tests, and deployment work only to `parth`; never push directly to `main` or create a substitute feature/integration branch.
- Own `backend/`, `database/`, backend environment examples, and backend tests only.
- Do not edit Sakar's `frontend/` or Aditya's `analysis/` package.
- Commit in small phase-based increments. Every commit must leave the backend importable and its implemented routes/tests runnable.
- Keep `parth` updated by merging or rebasing the latest `main` into `parth`; resolve conflicts on `parth`.
- Open a pull request from `parth` into `main` after the API, database, analysis orchestration, comparison, and test criteria pass.
- Aditya's analysis package is a runtime dependency. Sakar should merge Aditya's completed PR first; Parth then rebases/merges the latest `main` into `parth`, runs the real integration tests, and submits the backend PR.
- Do not change API or analysis field names without agreement from Sakar and Aditya and an update to the shared contract, schemas, and tests.
- Never commit `.env`, database passwords, Supabase service-role keys, private videos, or unapproved datasets.

### Commit format

Examples:

- `feat(api): persist pseudonymous patient records`
- `feat(uploads): validate and process assessment videos`
- `feat(analysis): integrate ocular analysis pipeline`
- `feat(longitudinal): compare compatible assessments`
- `test(backend): cover upload cleanup failures`

Do not commit empty routers, stub endpoints, fake analysis outputs, unused tables, or generated build artifacts.

## 17. Dependencies and questions to resolve early

1. Sakar needs final route paths, request payloads, error format, response shape, and status enums.
2. Aditya needs the agreed video path/metadata adapter and must return the shared analysis JSON shape.
3. The team must decide whether pursuit video is mandatory in the MVP or can be marked `not_provided`.
4. The team must decide how baseline is selected and whether a user can explicitly change it.
5. The team must finalize the video retention policy; default is temporary processing and deletion.
6. Team must verify whether the chosen Supabase project region and hosting configuration meet the data-handling needs of the demo. Use synthetic or consented non-identifying data only.

---

## 18. Final handoff checklist

- [x] FastAPI runs locally with documented commands.
- [x] Pydantic schemas match the shared integration contract.
- [x] Supabase schema and indexes are reproducible from SQL/migrations.
- [ ] RLS is enabled and tested.
- [x] No database/service-role secrets are exposed to frontend.
- [x] Patient and consent endpoints work.
- [ ] Assessment creation and video upload endpoints work.
- [ ] Video validation and cleanup work on both success and error.
- [ ] Analysis orchestrator calls Aditya's package, not a duplicate implementation.
- [ ] Analysis results, feature units, quality warnings, and model status persist.
- [ ] Longitudinal comparisons check protocol and measurement comparability.
- [ ] Baseline feature deltas are calculated safely, including null/zero handling.
- [ ] Response language remains neutral and non-diagnostic.
- [ ] Unit, API integration, database, and longitudinal tests pass.
- [ ] Render deployment and local fallback instructions are documented.
