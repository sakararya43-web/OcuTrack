# OcuTrack — Sakar Implementation Plan

**Owner:** Sakar  
**Git branch:** `main`  
**Branch rule:** Sakar works directly on `main` and commits only frontend/shared integration-coordination work owned by Sakar. Do not create a separate Sakar feature branch.  
**Workstream:** Web frontend, browser-based recording, user workflow, visualizations, and frontend integration  
**Document type:** Individual implementation specification  
**Parent specification:** `PRD.md` v1.0  
**Target:** Hackathon MVP — browser-based software prototype; no native mobile application

---

## Team-wide branch policy

- `main` — Sakar commits directly here.
- `aditya` — Aditya commits only here; submit a PR to `main`.
- `parth` — Parth commits only here; submit a PR to `main`.
- There is no `integration` branch and no extra feature branch in this workflow.
- Keep ownership isolated and keep each branch synchronized with the latest `main` before submitting a PR.

## 1. Mission and ownership

Sakar owns the complete browser experience through which a healthcare worker or hackathon evaluator uses OcuTrack. This includes the React interface, patient and assessment screens, browser camera access, the pupil-response and smooth-pursuit test flows, upload handling, results presentation, and frontend-to-backend integration.

The deliverable is a responsive website that works on a laptop browser with a webcam. It may also work on a compatible smartphone browser, but it must not depend on a native Android/iOS application.

### Sakar owns

- React + Vite + TypeScript frontend.
- Tailwind CSS and shadcn/ui setup and visual system.
- Patient list, patient profile, assessment flow, test instructions, report, and history screens.
- Camera permissions and preview through browser APIs.
- Browser video recording through `MediaRecorder`.
- Moving target animation for smooth-pursuit recording.
- Uploading recordings and metadata to Parth's FastAPI endpoints.
- Rendering CV series, TCN experimental status, longitudinal comparisons, and quality warnings returned by the API.
- Frontend loading, empty, permission-denied, upload-failure, and analysis-failure states.
- Responsive layout and the final browser-based judge demonstration.

### Sakar does not own

- Python video decoding, MediaPipe processing, pupil segmentation, feature extraction, or TCN implementation (Aditya).
- FastAPI routes, Pydantic backend schemas, Supabase schema, database access, longitudinal comparison engine, or server deployment (Parth).
- Clinical interpretation, disease diagnosis, or unvalidated medical thresholds.

Do not create frontend-only medical calculations to imitate backend results. The UI must display measurements and comparison values returned by the backend, except for purely presentational calculations such as formatting a percentage already supplied by the API.

---

## 2. Product context and non-negotiable constraints

OcuTrack is a browser-based ocular measurement and longitudinal change-monitoring prototype. It captures pupil-response and smooth-pursuit videos, sends them to a Python analysis backend, and presents measured features and across-visit changes.

The product must never claim to diagnose Parkinson's disease, concussion, diabetic neuropathy, or any other condition. The application supports measurement review and referral consideration; a qualified clinician makes clinical decisions.

### Required language

Use neutral terms such as:

- `Recording quality acceptable`
- `Insufficient recording quality — repeat test`
- `No notable change detected in measured features`
- `Change detected — consider repeat measurement and clinical review`
- `Experimental model output`

Never display `Disease detected`, `Neurologically healthy`, a disease probability, or `Urgent` solely from an unvalidated model score.

### Capture constraints

- Camera access uses `navigator.mediaDevices.getUserMedia()` and must be requested after a clear user action.
- Browser camera access requires HTTPS in deployed environments; localhost is acceptable for local development.
- Do not assume browser access to the flashlight/torch. The pupil test must show the documented controlled-lighting instructions and an optional torch capability only if the browser/device explicitly supports it.
- Do not instruct users to shine a high-intensity light into an eye. Use the team's agreed, clinically reviewed demonstration protocol or a prepared recording.
- Laptop webcam is the primary live-demo target. A compatible smartphone browser is optional.
- If live capture or light stimulus cannot be performed reliably, allow an explicitly labelled sample-video fallback. Never label prerecorded content as a live recording.

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
| Frontend | React + Vite + TypeScript | Single-page web application |
| Styling | Tailwind CSS + shadcn/ui | Consistent responsive interface |
| Charts | Recharts | Pupil, pursuit, and longitudinal graphs |
| Camera | Browser MediaDevices API | Webcam access and preview |
| Recording | MediaRecorder API | Create browser video files |
| API client | Native `fetch` or Axios | Communicate with FastAPI |
| Hosting | Vercel | Frontend deployment |

Do not introduce Next.js, native mobile frameworks, a second backend, or an LLM feature for this MVP.

---

## 4. Frontend ownership map (create incrementally)

The layout below is a target ownership map, not a command to pre-create files. Create each module only when implementing its complete behavior in the relevant phase. You may add files inside `frontend/`, but do not put Python/backend files there.

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/
    │   └── index.tsx
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── PatientsPage.tsx
    │   ├── PatientDetailPage.tsx
    │   ├── NewAssessmentPage.tsx
    │   ├── PupilTestPage.tsx
    │   ├── PursuitTestPage.tsx
    │   ├── ProcessingPage.tsx
    │   ├── AssessmentReportPage.tsx
    │   └── AboutLimitationsPage.tsx
    ├── components/
    │   ├── layout/
    │   ├── patients/
    │   ├── capture/
    │   ├── charts/
    │   ├── assessments/
    │   └── ui/
    ├── hooks/
    │   ├── useCamera.ts
    │   ├── useMediaRecorder.ts
    │   └── useRecordingQuality.ts
    ├── services/
    │   ├── apiClient.ts
    │   ├── patientService.ts
    │   └── assessmentService.ts
    ├── types/
    │   ├── api.ts
    │   └── domain.ts
    └── lib/
        ├── formatters.ts
        └── constants.ts
```

The exact routing library may be selected by Sakar, but keep page and API boundaries modular. Do not place the entire application in one component.

---

## 5. Screens and required behavior

### 5.1 Workspace / dashboard

Show:

- OcuTrack name and one-sentence purpose.
- Persistent prototype/non-diagnostic notice.
- Number of demo patient records, recent assessments, and assessments requiring review (based on returned statuses, not invented scores).
- A clear action to open patient records or create a new patient.
- A compact recent-assessments list.

Do not show a single large AI risk score as the main dashboard focus.

### 5.2 Patient list

- List pseudonymous patient codes only (for example `OT-0001`).
- Show last assessment date, quality status, and whether a feature-level change was recorded.
- Provide search by pseudonymous code.
- Include clear empty/loading/error states.
- Do not require a patient's real name, phone number, or date of birth for the hackathon demo.

### 5.3 Patient profile

- Display pseudonymous code and optional non-identifying context.
- Show assessment history in date order.
- Identify the currently selected baseline.
- Show an across-visit trend chart for selected features.
- Allow the user to open an assessment report or begin a new assessment.
- Make clear that a stable result does not establish that the patient is healthy.

### 5.4 New assessment and consent

- Select/create patient.
- Show the purpose and non-diagnostic disclaimer before capture.
- Require a consent confirmation before recording.
- Record the consent purpose/status using Parth's agreed API contract.
- Capture protocol version, test type, and device/browser metadata where available.

### 5.5 Pupil-response test

The page must include:

1. Plain-language instruction and safety notice.
2. Live camera preview.
3. Positioning guide so the eye is visible and the participant is stable.
4. Agreed controlled-lighting instructions.
5. A visible countdown and recording state.
6. Record, stop, discard, and retake controls.
7. Duration and basic capture-quality feedback.
8. Upload progress and retry after upload failure.

Initial target duration is approximately 15 seconds, but it must be configurable and must match the agreed test protocol. Store the actual duration in metadata.

Do not implement medical light-intensity control in the browser. Torch use is optional and must be capability-checked; fallback instructions must remain available.

### 5.6 Smooth-pursuit test

- Display a simple, high-contrast moving target.
- Use a repeatable path and a fixed, documented duration.
- Synchronize the target path with the recording start time as closely as possible.
- Record target path metadata (path version, duration, start timestamp, and normalized target coordinates) so Aditya can align the target with recorded frames.
- Keep the target within the visible screen area.
- Explain that the participant should follow the target with their eyes while minimizing head movement.
- Allow retake if capture fails.

**Important integration requirement:** The target trajectory must be sent to the backend as assessment metadata or uploaded in the agreed metadata JSON. Aditya must not have to infer the exact target path from the video alone.

### 5.7 Processing state

Show honest pipeline stages such as:

- Validating video
- Checking recording quality
- Locating eye region
- Extracting measurements
- Running experimental temporal analysis (only if configured)
- Comparing with previous visit

Do not display a fake percentage or claim that analysis is complete before the backend confirms it. Provide a timeout/error state and a retry or return-to-report option.

### 5.8 Assessment report

Display:

- Patient pseudonymous ID and assessment timestamp.
- Test protocol/device/lighting context where available.
- Recording-quality status and warnings.
- Pupil-size curve and extracted pupil features with units.
- Target-vs-eye movement chart and pursuit features.
- Baseline/current comparison and feature-level deltas if comparable historical data exists.
- TCN model name/version/status and output only when provided by the backend.
- Neutral review message.
- Visible non-diagnostic disclaimer.

If measurements cannot be computed, display `Not available` with the reason. Never substitute fabricated sample values in a live analysis report.

---

## 6. Browser camera and recording implementation

### 6.1 Camera hook

Implement a reusable `useCamera` hook that:

- Requests camera access only after an explicit action.
- Exposes stream, permission/error state, supported constraints, and `startCamera`/`stopCamera` operations.
- Attaches the stream to a `<video>` preview using `srcObject`.
- Stops all media tracks when the capture view unmounts or the user ends the session.
- Handles permission denied, no camera, camera already in use, and unsupported browser errors.
- Tries reasonable resolution/frame-rate constraints but records the actual settings when available.

Do not assume the browser honored requested width, height, or frame rate; record observed settings.

### 6.2 Recording hook

Implement a reusable `useMediaRecorder` hook that:

- Uses `MediaRecorder` with a supported MIME type selected at runtime.
- Captures start/end timestamps and actual duration.
- Handles `dataavailable`, `stop`, and recorder errors.
- Returns a `Blob` and a preview URL for review.
- Revokes object URLs when no longer needed.
- Enforces maximum recording duration and file size.
- Allows discard/retake before upload.

Do not hardcode a single codec/MIME type without checking `MediaRecorder.isTypeSupported()`.

### 6.3 Capture metadata

For each video, capture as much of the following as is available:

```json
{
  "protocol_version": "ocutrack-protocol-0.1",
  "test_type": "pupil_reflex",
  "captured_at": "ISO-8601 timestamp",
  "duration_ms": 15000,
  "mime_type": "video/webm",
  "device_metadata": {
    "user_agent": "browser user agent",
    "width": 1280,
    "height": 720,
    "frame_rate": 30
  },
  "lighting_metadata": {
    "method": "controlled_ambient_or_external_source",
    "notes": "documented demo setup"
  }
}
```

The values above are illustrative. Do not claim a measurement is calibrated merely because a camera resolution is known.

For the pursuit test, include target-path metadata:

```json
{
  "target_path": {
    "path_version": "horizontal-sweep-v1",
    "duration_ms": 10000,
    "coordinates_normalized": [
      {"t_ms": 0, "x": 0.1, "y": 0.5},
      {"t_ms": 500, "x": 0.2, "y": 0.5},
      {"t_ms": 1000, "x": 0.3, "y": 0.5}
    ]
  }
}
```

Use the exact full target trajectory generated by the application, not only the abbreviated sample above.

---

## 7. Frontend-to-backend API contract

Parth owns the FastAPI routes and final Pydantic schemas. Sakar owns the frontend API client. All three members must agree on the request/response field names before parallel implementation. Do not independently rename fields.

### 7.1 Required endpoints

| Method | Endpoint | Frontend use |
|---|---|---|
| `POST` | `/api/patients` | Create pseudonymous patient and consent record (or use the final agreed consent endpoint). |
| `GET` | `/api/patients` | Load patient list. |
| `GET` | `/api/patients/{patient_id}` | Load profile. |
| `POST` | `/api/assessments` | Create an assessment with protocol/device/lighting metadata. |
| `POST` | `/api/assessments/{assessment_id}/pupil-video` | Upload pupil-response video as multipart form data. |
| `POST` | `/api/assessments/{assessment_id}/pursuit-video` | Upload pursuit video and target path metadata. |
| `POST` | `/api/assessments/{assessment_id}/analyze` | Start the analysis pipeline. |
| `GET` | `/api/assessments/{assessment_id}` | Poll/read analysis result. |
| `GET` | `/api/patients/{patient_id}/history` | Load visit history and longitudinal series. |
| `POST` | `/api/assessments/{assessment_id}/compare` | Request comparison with baseline/prior visit. |
| `GET` | `/api/health` | Check backend availability. |

If Parth makes a small endpoint adjustment, update the shared API contract first and then update `assessmentService.ts`.

### 7.2 API client requirements

- Read backend URL from `VITE_API_BASE_URL`.
- Centralize HTTP requests in `apiClient.ts`.
- Keep API calls out of page components; use patient/assessment service modules.
- Add request timeout and human-readable error mapping.
- Send videos using `FormData`; do not manually set the multipart `Content-Type` boundary.
- Keep Supabase service credentials and database secrets out of all `VITE_` variables.
- Never connect to Supabase directly from the browser for this MVP; call the FastAPI backend.

### 7.3 Shared response handling

Use these status values consistently:

- Assessment state: `created`, `uploaded`, `processing`, `complete`, `failed`.
- Quality state: `pending`, `acceptable`, `insufficient`.
- Model state: `not_configured`, `experimental`, `evaluated`, `failed`.
- Comparison state: `not_available`, `comparable`, `not_comparable`.

The actual JSON contract is finalized in the shared integration document by Parth. Do not silently convert missing numeric fields to zero; `null` means unavailable.

---

## 8. Frontend data types

Create TypeScript interfaces matching the agreed Pydantic response. Start with the following conceptual types and revise only through a coordinated contract change:

```ts
export type AssessmentStatus =
  | "created" | "uploaded" | "processing" | "complete" | "failed";

export type QualityStatus =
  | "pending" | "acceptable" | "insufficient";

export type ModelStatus =
  | "not_configured" | "experimental" | "evaluated" | "failed";

export interface FeatureValue {
  value: number | null;
  unit: string;
  label: string;
}

export interface TimeSeriesPoint {
  t_ms: number;
  value: number | null;
  valid: boolean;
}

export interface AssessmentSummary {
  assessment_id: string;
  patient_id: string;
  status: AssessmentStatus;
  quality_status: QualityStatus;
  warnings: string[];
  review_message: string;
}
```

Do not create a separate frontend-only definition of pupil features or model status that contradicts the backend contract.

---

## 9. Visual design and UX quality bar

- Build a calm clinical interface, not a generic AI analytics template.
- Prefer white/neutral surfaces, restrained accent colors, readable typography, and consistent spacing.
- Use status colors only when they communicate a real state; never use green to imply that a patient is disease-free.
- Keep graphs labeled with feature name, units, time axis, and data-quality context.
- Use tooltips or short explanations for latency, constriction velocity, tracking error, and baseline delta.
- Make the recording instructions readable on a laptop and smaller viewport.
- Include keyboard focus states and accessible labels for camera controls.
- Use a visible banner: `Hackathon prototype — not a diagnostic device`.

### Essential visualizations

1. Pupil diameter versus time.
2. Target horizontal position versus estimated eye horizontal position.
3. Longitudinal feature trend across assessment dates.
4. Baseline/current feature comparison.

Charts must plot backend data. Synthetic sample data is allowed only in a clearly labelled demo/sample mode.

---

## 10. Privacy and user safety in the frontend

- Use pseudonymous patient IDs.
- Request camera permission only after the user understands the test and gives consent.
- Do not store raw videos in browser local storage, IndexedDB, analytics services, or an uncontrolled public bucket.
- Allow the user to discard a recording before upload.
- Clearly explain whether the video is uploaded and whether it is retained; default to temporary processing and deletion after analysis.
- Do not send sensitive video or patient context to third-party analytics.
- Never show a disease diagnosis or unvalidated urgency label.
- If the recording is poor, show `Insufficient recording quality — repeat test` rather than interpreting it.

---

## 11. Testing responsibilities

Sakar owns frontend tests and browser-capture verification.

### Unit/component tests

- Camera permission denied state.
- No camera available state.
- Camera stream stops on unmount.
- MediaRecorder supported/unsupported MIME type handling.
- Stop/discard/retake behavior.
- Upload error and retry behavior.
- Missing/null measurement display.
- Neutral result copy and visible disclaimer.

### End-to-end smoke test

Using a prepared sample patient and supported browser:

1. Open OcuTrack.
2. Create/select a pseudonymous patient.
3. Confirm consent.
4. Start camera preview.
5. Capture or load a pupil-response sample.
6. Complete or load the pursuit sample.
7. Upload both files.
8. Start analysis.
9. Open report.
10. Open a second assessment and display baseline comparison.

At least one run must use the real browser camera. A second repeatable run may use prepared recordings as fallback.

### Browser/device matrix

Test the agreed primary browser on the demo laptop. Record browser version, camera resolution, observed frame rate, and whether the capture/recording path succeeded. Do not claim broad mobile compatibility based on a single device.

---

## 12. Phased implementation plan

Work in the order below. A phase is complete only when its acceptance checks pass; do not start by generating every page/component as empty placeholders.

### Phase 0 — Contract lock and repository alignment

**Goal:** Make all three workstreams agree on the boundaries before parallel implementation.

- Sakar coordinates a short contract review with Aditya and Parth.
- Confirm and record the API endpoints, request/response field names, status enums, measurement units, video MIME/container support, pursuit target metadata, protocol version, and error response shape in `docs/integration-contract.md`.
- Sakar commits that real, reviewed document to `main`; it must contain the agreed contract, not TODOs or blank templates.
- Confirm that the root project is a browser-based web prototype. No native Android/iOS project is created.
- Confirm the primary demo browser/device and the clearly labelled sample-video fallback.

**Exit criteria:** All three members approve the same contract. Aditya and Parth have based their work branches on the latest `main` commit.

### Phase 1 — Working frontend core

**Goal:** Deliver a usable browser interface, not a static mockup.

- Implement the real Vite/React/TypeScript entry point, routing, layout, responsive navigation, and non-diagnostic notice.
- Implement patient list, patient detail, assessment creation, and consent flow against the agreed API contract.
- Implement API loading, empty, unavailable, validation-error, and retry states. Until Parth's endpoints are available, show a clear service-unavailable state; do not ship fake patient records or fake measurement responses.
- Add only the components needed by these completed flows. Do not create empty screen files for later phases.

**Exit criteria:** Frontend starts from documented commands; routes render; real API requests are issued; unavailable API responses are handled without crashing; no fabricated clinical content appears.

### Phase 2 — Browser capture and test experience

**Goal:** Capture valid recordings and all metadata required by Aditya.

- Implement browser camera permission, preview, cleanup, and recording using `MediaDevices` and `MediaRecorder`.
- Implement the pupil-response recording flow with the team's agreed controlled-lighting protocol and safety instructions. Do not assume torch/flashlight access.
- Implement the smooth-pursuit moving target with a deterministic path, timing, normalized coordinates, and protocol version.
- Attach timestamps, test type, actual duration, browser/device metadata, recording MIME type, and pursuit target trajectory to the corresponding upload.
- Add review, discard, retake, progress, and capture-failure flows.
- Provide sample-video fallback only as an explicitly labelled demonstration path; never label it as a live capture.

**Exit criteria:** Both capture flows produce decodable files and contract-compliant metadata on the agreed demo browser, or the unsupported capture case is clearly reported and the labelled fallback works.

### Phase 3 — Real API integration

**Goal:** Connect all frontend actions to Parth's working backend.

- Connect patient create/list/detail, assessment creation, video uploads, analysis trigger, report retrieval, and history endpoints.
- Use the exact shared TypeScript types and status enums from the locked contract.
- Show backend processing states and distinguish failed, insufficient-quality, and completed tests.
- Never compute medical features in the browser. Display Aditya's measurements and Parth's comparison results from API responses only.

**Exit criteria:** A user can complete the whole browser flow against the real backend without manual database edits or hardcoded response data.

### Phase 4 — Results, longitudinal view, and demo hardening

**Goal:** Make results understandable and the end-to-end demo repeatable.

- Implement pupil time-series, pursuit tracking, and across-visit feature comparison charts using returned values and units.
- Show null/unavailable values as `Not available`; never convert them to zero.
- Display quality warnings, model status/version, comparison status, and the non-diagnostic notice.
- Test first-visit baseline creation and a later visit comparison.
- Verify loading, no-history, non-comparable recordings, poor-quality recordings, API failure, and retake paths.
- Capture a repeatable demo script and screenshots for the final presentation.

**Exit criteria:** The complete demo is repeatable from patient creation through the second-visit comparison; all values shown come from actual analysis/API output or are explicitly labelled synthetic test fixtures.

### Definition of done

- The frontend runs using documented commands and the agreed environment variable(s).
- Browser camera and recording work on the target demo device, with a clearly labelled fallback.
- Patient, consent, assessment, upload, analysis, report, and history flows use the real API.
- Pursuit target trajectory metadata matches the analysis contract.
- Charts render actual backend series and units.
- No disease diagnosis, hardcoded measurements, fabricated model output, empty placeholder screens, or unused scaffold files remain.
- Primary-browser end-to-end smoke test passes.

## 13. Git and integration rules

**Assigned branch: `main`**

Sakar is the only team member assigned to work directly on `main`.

- Commit Sakar-owned frontend work directly to `main` in small, meaningful commits.
- Sakar also commits the reviewed `docs/integration-contract.md` and any shared integration decisions that the team explicitly assigns to Sakar.
- Do not create or use a separate `integration` branch or a Sakar feature branch.
- Do not commit Aditya's `analysis/` code or Parth's `backend/`/`database/` implementation on their behalf.
- Keep `main` runnable after each commit. Do not commit a half-built feature that breaks the frontend start/build command.
- Pull/fetch before starting a work session and resolve incoming PRs with the team before changing shared contracts.
- Review and merge Aditya's and Parth's pull requests into `main` only after their phase acceptance checks and integration tests pass.

### Team branch and merge sequence

| Member | Work branch | Where commits go | Final merge target |
|---|---|---|---|
| Sakar | `main` | Direct commits to `main` | Already on `main` |
| Aditya | `aditya` | Only `aditya` | PR: `aditya` → `main` |
| Parth | `parth` | Only `parth` | PR: `parth` → `main` |

- Aditya and Parth must create their assigned branches from the latest agreed `main` and commit all their work to their own branch.
- Aditya and Parth must not push directly to `main`.
- Aditya's analysis package is a dependency of Parth's orchestration. Merge Aditya's completed PR first, then merge Parth's completed PR after backend integration tests pass.
- Before each PR, Aditya and Parth must merge or rebase the latest `main` into their own branch and resolve conflicts there.
- Do not create an additional shared integration branch. Use PRs into `main` for review and merge history.
- Keep ownership isolated: Sakar owns `frontend/`; Aditya owns `analysis/` and ML experiment code; Parth owns `backend/` and `database/`.
- Any contract change requires agreement from all affected owners and an accompanying update to the contract, types/tests, and implementation in the same coordinated change.
- Never commit `.env`, access tokens, service-role keys, private videos, or unapproved datasets.

### Commit format

Use concise, descriptive commits, for example:

- `feat(frontend): add patient assessment flow`
- `feat(capture): record pupil response video`
- `fix(frontend): handle camera permission denial`
- `docs(integration): lock analysis upload contract`

Do not make empty commits or commit generated build output, dependency folders, or unfinished scaffolding.

## 14. Dependencies and questions to resolve early

Sakar needs the following from the team before final integration:

1. Parth's final API endpoint paths, request fields, response JSON, and status enums.
2. Aditya's exact time-series response shape, units, and quality warnings.
3. The agreed pursuit target path and protocol version.
4. The selected browser and camera setup for the live demo.
5. The team's approved controlled-lighting instructions and fallback sample video.

Resolve these in one shared `docs/integration-contract.md` before the frontend and backend are independently completed.

---

## 15. Final handoff checklist

- [x] Frontend runs with documented commands.
- [x] `.env.example` contains only public frontend configuration such as `VITE_API_BASE_URL`.
- [x] Patient and assessment pages are complete.
- [x] Consent is required before recording.
- [x] Camera permission and cleanup work correctly.
- [x] Both recording flows generate valid video blobs.
- [x] Pursuit target trajectory metadata is included.
- [x] Uploads match the agreed FastAPI contract.
- [x] Report charts use backend outputs.
- [x] Missing values remain `null`/`Not available`, not zero.
- [x] Poor-quality recordings are not presented as valid physiological results.
- [x] No diagnostic or unsupported urgency claims appear.
- [x] Primary-browser end-to-end smoke test passes.
