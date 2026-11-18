# OcuTrack — Shared Integration Contract

**Document Version:** 1.0.0  
**Protocol Version:** `ocutrack-protocol-0.1`  
**Status:** Locked & Approved (Phase 0)  
**Owners:** Sakar (Frontend & Capture), Aditya (Analysis Engine & TCN), Parth (FastAPI Backend, Persistence & Longitudinal Comparison)  
**Assigned Branch for Contract Source:** `main`

---

## 1. Scope & Architectural Boundaries

OcuTrack is a browser-based research prototype for quantitative ocular measurement review and longitudinal observation across visits. It captures pupil-response and smooth-pursuit eye movements via a laptop webcam, transmits recordings and synchronized trajectory metadata to a Python FastAPI backend, executes MediaPipe computer vision segmentation and experimental Temporal Convolutional Network (TCN) dynamics, and presents longitudinal comparisons.

### 1.1 Non-Diagnostic Regulatory Guardrails
- OcuTrack is **not** a certified medical device and does **not** diagnose Parkinson's disease, concussion, diabetic neuropathy, or any neurological pathology.
- Allowed review messages:
  - `Recording quality acceptable`
  - `Insufficient recording quality — repeat test`
  - `No notable change detected in measured features`
  - `Change detected — consider repeat measurement and clinical review`
  - `Experimental model output`
- Disallowed language: Never output `Disease detected`, `Neurologically healthy`, disease probabilities, or clinical urgency classifications solely from unvalidated model scores.

### 1.2 Ownership Boundaries
| Owner | Module / Domain | Responsibilities |
|---|---|---|
| **Sakar** | `frontend/` | React + Vite + TypeScript application, UI visual system (Tailwind CSS), browser MediaDevices camera preview and MediaRecorder, smooth pursuit moving stimulus, upload orchestration, clinical reporting views, and client-side error handling. |
| **Aditya** | `analysis/` | MediaPipe FaceMesh iris/pupil localization, pupil constriction feature extraction, pursuit gaze kinematics, TCN sequence dynamics model, frame usability / quality checks, and benchmark validation suite. |
| **Parth** | `backend/`, `database/` | FastAPI REST endpoints, Pydantic data schemas, Supabase PostgreSQL persistence, temporary video retention/cleanup, longitudinal comparison engine, and server deployment. |

---

## 2. Common Status Enums

All three layers (Frontend TypeScript, Backend Pydantic, Analysis Python) must strictly adhere to these exact string values:

### 2.1 AssessmentStatus
```text
created | uploaded | processing | complete | failed
```
- `created`: Session initialized; awaiting video uploads.
- `uploaded`: Both pupil and pursuit video recordings received.
- `processing`: Analysis pipeline and longitudinal comparison currently executing.
- `complete`: Analysis finished; reports and series data persisted and available.
- `failed`: Pipeline terminated due to unrecoverable decoding, processing, or persistence error.

### 2.2 TestStatus (Per-Test Execution)
```text
complete | insufficient_quality | failed | not_provided
```
- `complete`: Test captured and biometric features successfully extracted.
- `insufficient_quality`: Video recorded, but frame usability, lighting, or motion artifacts precluded valid feature extraction.
- `failed`: Decoding or segmentation error occurred during processing.
- `not_provided`: Test skipped or omitted in a single-test protocol session.

### 2.3 QualityStatus
```text
pending | acceptable | insufficient
```
- `pending`: Video uploaded but quality validation has not finished.
- `acceptable`: Usable frame ratio >= 70%, illumination adequate, head motion within allowable bounds.
- `insufficient`: Usable frame ratio < 70%, severe occlusions, excessive head movement, or erratic lighting.

### 2.4 ModelStatus (TCN Experimental Engine)
```text
not_configured | experimental | evaluated | failed
```
- `not_configured`: Temporal model weights or configuration not provided.
- `experimental`: Model evaluated for research sequence dynamics; clearly flagged as unvalidated.
- `evaluated`: Benchmark run completed against reference sequence.
- `failed`: Sequence length invalid or tensor shape mismatch.

### 2.5 ComparisonStatus (Longitudinal Across-Visit Engine)
```text
not_available | comparable | not_comparable
```
- `not_available`: No prior accepted assessment found for this patient (first-visit baseline).
- `comparable`: Prior baseline and current assessment share identical protocol, acceptable quality, and valid features.
- `not_comparable`: Prior assessment exists but lighting, protocol version, or quality prevents valid comparison.

---

## 3. REST API Endpoints Specification

Base URL default: `http://localhost:8000` (configurable via `VITE_API_BASE_URL`).

### 3.1 Patient Management

#### `POST /api/patients`
Registers a new pseudonymous participant and records consent.
- **Request Body:**
  ```json
  {
    "pseudonymous_code": "OT-0001",
    "age_band": "40-49",
    "context_notes": "Baseline research session; diffuse ambient lighting",
    "consent": {
      "consent_status": "granted",
      "purpose": "hackathon_demo",
      "granted_at": "2026-11-16T03:00:00Z"
    }
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "patient_id": "p-98234-abcd",
    "pseudonymous_code": "OT-0001",
    "age_band": "40-49",
    "context_notes": "Baseline research session; diffuse ambient lighting",
    "consent_status": "granted",
    "consent_purpose": "hackathon_demo",
    "created_at": "2026-11-16T03:00:00Z",
    "last_assessment_date": null,
    "last_quality_status": null,
    "feature_change_recorded": null,
    "assessment_count": 0
  }
  ```

#### `GET /api/patients`
Retrieves list of registered pseudonymous patients.
- **Response (`200 OK`):** `Patient[]`

#### `GET /api/patients/{patient_id}`
Retrieves individual patient profile and metadata.
- **Response (`200 OK`):** `Patient`

#### `GET /api/patients/{patient_id}/history`
Retrieves longitudinal assessment history for across-visit trend plotting.
- **Response (`200 OK`):** `AssessmentSummary[]`

---

### 3.2 Assessment Lifecycle

#### `POST /api/assessments`
Initializes an assessment session before video capture.
- **Request Body:**
  ```json
  {
    "patient_id": "p-98234-abcd",
    "protocol_version": "ocutrack-protocol-0.1",
    "test_type": "both",
    "device_metadata": {
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "screen_width": 1920,
      "screen_height": 1080
    },
    "lighting_metadata": {
      "method": "controlled_ambient",
      "notes": "Standard room lighting, participant facing screen evenly"
    }
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "assessment_id": "a-54321-efgh",
    "patient_id": "p-98234-abcd",
    "status": "created",
    "quality_status": "pending",
    "assessment_at": "2026-11-16T03:05:00Z",
    "protocol_version": "ocutrack-protocol-0.1"
  }
  ```

#### `POST /api/assessments/{assessment_id}/pupil-video`
Uploads the pupil light reflex recording.
- **Request:** `multipart/form-data`
  - `file`: Video binary (`video/webm` or `video/mp4`, max 50MB)
  - `metadata_json`:
    ```json
    {
      "protocol_version": "ocutrack-protocol-0.1",
      "test_type": "pupil_reflex",
      "captured_at": "2026-11-16T03:06:15Z",
      "duration_ms": 15020,
      "mime_type": "video/webm",
      "is_fallback": false,
      "device_metadata": {
        "user_agent": "Mozilla/5.0 ...",
        "width": 1280,
        "height": 720,
        "frame_rate": 30
      },
      "lighting_metadata": {
        "method": "controlled_ambient_screen_flash",
        "notes": "Standard diffuse screen flash stimulus at 5.0s"
      }
    }
    ```
- **Response (`200 OK`):** `AssessmentDetail` (status: `created` or `uploaded`)

#### `POST /api/assessments/{assessment_id}/pursuit-video`
Uploads the smooth-pursuit recording synchronized with target coordinates.
- **Request:** `multipart/form-data`
  - `file`: Video binary (`video/webm` or `video/mp4`, max 50MB)
  - `metadata_json`:
    ```json
    {
      "protocol_version": "ocutrack-protocol-0.1",
      "test_type": "smooth_pursuit",
      "captured_at": "2026-11-16T03:07:30Z",
      "duration_ms": 10040,
      "mime_type": "video/webm",
      "is_fallback": false,
      "target_path": {
        "path_version": "horizontal-sweep-v1",
        "duration_ms": 10000,
        "coordinates_normalized": [
          {"t_ms": 0, "x": 0.5000, "y": 0.5000},
          {"t_ms": 50, "x": 0.5339, "y": 0.5000},
          {"t_ms": 100, "x": 0.5673, "y": 0.5000}
        ]
      },
      "device_metadata": {
        "user_agent": "Mozilla/5.0 ...",
        "width": 1280,
        "height": 720,
        "frame_rate": 30
      }
    }
    ```
- **Response (`200 OK`):** `AssessmentDetail` (status: `uploaded`)

#### `POST /api/assessments/{assessment_id}/analyze`
Triggers the asynchronous analysis orchestrator.
- **Response (`202 Accepted`):**
  ```json
  {
    "assessment_id": "a-54321-efgh",
    "status": "processing",
    "message": "Analysis pipeline successfully triggered"
  }
  ```

#### `GET /api/assessments/{assessment_id}`
Retrieves full assessment status, extracted biometrics, charts series, and longitudinal comparison.
- **Response (`200 OK`):** `AssessmentDetail` (schema below)

#### `POST /api/assessments/{assessment_id}/compare`
Forces or re-evaluates longitudinal comparison against a specific baseline.
- **Request Body:**
  ```json
  {
    "baseline_id": "a-11111-baseline"
  }
  ```
- **Response (`200 OK`):** `AssessmentDetail`

#### `GET /api/health`
Monitors backend application and database connectivity.
- **Response (`200 OK`):**
  ```json
  {
    "status": "healthy",
    "app": "ocutrack-backend",
    "version": "0.1.0",
    "database": "connected"
  }
  ```

---

## 4. Assessment Response Schema (`AssessmentDetail`)

```json
{
  "assessment_id": "a-54321-efgh",
  "patient_id": "p-98234-abcd",
  "status": "complete",
  "quality_status": "acceptable",
  "assessment_at": "2026-11-16T03:05:00Z",
  "protocol_version": "ocutrack-protocol-0.1",
  "warnings": [],
  "review_message": "No notable change detected in measured features",
  "non_diagnostic_notice": "Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative ocular measurements for research and clinical review. It does not diagnose Parkinson’s disease, concussion, diabetic neuropathy, or any neurological condition.",
  
  "quality": {
    "status": "acceptable",
    "usable_frame_ratio": 0.942,
    "warnings": []
  },

  "pupil": {
    "status": "complete",
    "features": {
      "baseline_diameter": {
        "value": 4.62,
        "unit": "mm",
        "label": "Baseline Pupil Diameter"
      },
      "constriction_latency": {
        "value": 248.0,
        "unit": "ms",
        "label": "Constriction Latency"
      },
      "constriction_velocity": {
        "value": 4.85,
        "unit": "mm/s",
        "label": "Max Constriction Velocity"
      },
      "constriction_amplitude": {
        "value": 32.4,
        "unit": "%",
        "label": "Constriction Amplitude"
      },
      "dilation_velocity": {
        "value": 2.15,
        "unit": "mm/s",
        "label": "Average Dilation Velocity"
      }
    },
    "series": [
      {"t_ms": 0, "value": 4.62, "valid": true},
      {"t_ms": 50, "value": 4.61, "valid": true},
      {"t_ms": 5000, "value": 4.60, "valid": true},
      {"t_ms": 5250, "value": 4.45, "valid": true},
      {"t_ms": 5500, "value": 3.12, "valid": true}
    ]
  },

  "pursuit": {
    "status": "complete",
    "features": {
      "tracking_gain": {
        "value": 0.94,
        "unit": "ratio",
        "label": "Smooth Pursuit Gain"
      },
      "rmse_error": {
        "value": 0.042,
        "unit": "norm",
        "label": "Gaze Tracking RMSE"
      },
      "saccadic_intrusions": {
        "value": 2,
        "unit": "count",
        "label": "Catch-up Saccades"
      }
    },
    "series": [
      {"t_ms": 0, "target_x": 0.500, "eye_x": 0.498, "valid": true},
      {"t_ms": 100, "target_x": 0.567, "eye_x": 0.561, "valid": true}
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
    "notes": "Experimental model output; not clinically validated. Temporal convolutional network evaluated for sequence trajectory consistency."
  },

  "longitudinal_comparison": {
    "status": "comparable",
    "baseline_id": "a-11111-baseline",
    "comparability_reason": "Matching protocol version and acceptable lighting conditions",
    "feature_deltas": {
      "constriction_latency": {
        "delta": 8.0,
        "unit": "ms",
        "direction": "increased"
      },
      "constriction_velocity": {
        "delta": -0.15,
        "unit": "mm/s",
        "direction": "decreased"
      },
      "tracking_gain": {
        "delta": -0.02,
        "unit": "ratio",
        "direction": "stable"
      }
    }
  }
}
```

---

## 5. Aditya Analysis Engine Interface

Aditya's `analysis` package exposes the following entry point callable:

```python
from pathlib import Path
from typing import Dict, Any, Optional

def analyze_assessment(
    pupil_video_path: Optional[Path],
    pursuit_video_path: Optional[Path],
    pupil_metadata: Optional[Dict[str, Any]] = None,
    pursuit_metadata: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes ocular CV feature extraction and experimental TCN dynamics.
    Returns dictionary conforming exactly to AssessmentDetail fields:
    - quality: Dict[str, Any]
    - pupil: Dict[str, Any]
    - pursuit: Dict[str, Any]
    - temporal_model: Dict[str, Any]
    - warnings: List[str]
    """
```

### 5.1 Units & Calibrations
- **Pupil Diameter:** Reported in `mm` when iris diameter reference is calibrated (standard adult iris $\approx 11.7\text{ mm}$); otherwise clearly designated as uncalibrated arbitrary units or pixels.
- **Latency:** Milliseconds (`ms`) from detected or declared stimulus onset timestamp to onset of constriction ($> 5\%$ drop from baseline).
- **Constriction Velocity:** Millimetres per second (`mm/s`).
- **Pursuit Gain:** Ratio of eye velocity to target velocity (dimensionless ratio, ideal $\approx 1.0$).
- **Missing Values:** Values that cannot be calculated reliably MUST be `null`, never converted to `0`.

---

## 6. Video Capture & Fallback Specifications

1. **Primary Format:** `video/webm` (codecs VP8/VP9, browser default) or `video/mp4`.
2. **Resolution Target:** 1280x720 (720p). Minimum acceptable: 640x480.
3. **Frame Rate:** Target 30 FPS. Minimum acceptable: 20 FPS.
4. **Pupil Test Duration:** 15.0 seconds nominal. Diffuse screen stimulus at 5.0s (duration 1.5s).
5. **Pursuit Test Duration:** 10.0 seconds nominal. Path version: `horizontal-sweep-v1`.
6. **Sample Video Fallback:** If camera is unavailable or browser permissions are denied, an explicitly labelled benchmark sample video may be loaded. It must be clearly identified with `is_fallback: true` in metadata and `"Fallback Benchmark Sample"` in the UI.

---

## 7. Change Control & Sign-off

Any modification to endpoint paths, parameter names, JSON payload structures, status enums, or measurement units requires prior notification and mutual agreement among Sakar, Aditya, and Parth before being committed to `main`.
