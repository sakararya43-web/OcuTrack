# OcuTrack — Repeatable Hackathon Demo Guide

This document outlines the step-by-step procedure to execute a repeatable, compliant judge presentation for OcuTrack.

## 1. Safety & Compliance Rules

- **Non-Diagnostic Notice**: OcuTrack is a research prototype for quantitative ocular measurement review and longitudinal observation. Never claim it diagnoses Parkinson's, concussion, or diabetic neuropathy.
- **Privacy Assurance**: All participant files use de-identified pseudonymous codes (e.g., `OT-0001`). Never input real personal health information (PHI) or personal identifiable information (PII).
- **Light Safety**: Never direct high-intensity light or laser into an eye. Use the standardized diffuse screen flash stimulus or the calibrated benchmark fallback.
- **Labelled Fallback**: If presenting on a laptop without an active webcam or controlled ambient illumination, use the explicitly labelled **"Demo Sample Video Fallback"**. Never present prerecorded videos as live recordings.

---

## 2. Walkthrough Steps

### Step 1: Launch Services
1. Start Parth's FastAPI backend:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
2. In another terminal, start Sakar's React frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:3000` in Google Chrome.

### Step 2: Dashboard Inspection
- Observe the top persistent non-diagnostic disclaimer:
  *"Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative ocular measurements for research and clinical review..."*
- Verify the backend health indicator in the header displays **"Connected"** (or offline guidance if backend is disconnected).
- View registered patient counts and review flags.

### Step 3: Register Pseudonymous Participant
1. Click **"+ New Pseudonymous Patient"**.
2. Select or generate a code (e.g., `OT-1042`).
3. Select an age band (e.g., `40-49`).
4. Enter optional de-identified notes: `Baseline screening session; controlled diffuse ambient lighting`.
5. Confirm participant consent and submit.

### Step 4: Initiate Assessment
1. Click **"Start Assessment"** or navigate to `/assessments/new`.
2. Select the created patient code.
3. Choose **"Complete Protocol"** (Pupil reflex + Smooth pursuit).
4. Verify lighting method and check the informed consent confirmation.
5. Click **"Initialize Assessment Session"**.

### Step 5: Test 1 — Pupil Light Reflex Recording
1. Click **"Proceed to Pupil Reflex Test"**.
2. Review the controlled-lighting instructions.
3. Click **"Enable Webcam"** (or select **"Use Calibrated Synthetic Benchmark"** if webcam is unavailable).
4. Position eyes within the elliptical reticle guide.
5. Click **"Start 15s Recording"**.
6. At the 5-second mark, observe the diffuse light stimulus flash banner.
7. Review the captured video, duration (~15.0s), and container specs.
8. Click **"Upload & Continue to Pursuit"**.

### Step 6: Test 2 — Smooth-Pursuit Eye Movement Test
1. Click **"Start Pursuit Recording (10s)"**.
2. Follow the high-contrast cyan target as it sweeps horizontally across the arena (`horizontal-sweep-v1`).
3. At 10 seconds, the target finishes and synchronizes with the video recording.
4. Review the logged coordinate count (~200 coordinates) and video preview.
5. Click **"Upload & Trigger Analysis"**.

### Step 7: Analysis Pipeline Execution
1. The app navigates to `/assessments/:id/processing`.
2. Observe the honest pipeline stages:
   - Video Validation & Codec Decoding
   - Frame Usability & Quality Check
   - Ocular Landmark & Iris Segmentation
   - Quantitative Biometric Extraction
   - Experimental Temporal Convolutional Network (TCN)
   - Longitudinal Baseline Comparison
3. When complete, view the summary card with usable frame ratio and click **"Open Full Assessment Report"**.

### Step 8: Assessment Report & Longitudinal Review
1. Review the full clinical document:
   - Extracted pupil features: Latency (ms), Constriction Velocity (mm/s), Baseline Diameter (mm).
   - Pupil Constriction Curve chart with highlighted stimulus window.
   - Smooth-Pursuit Kinematics: Tracking gain, RMSE, target vs. gaze displacement chart.
   - Baseline Comparison Table: Feature deltas ($\Delta$) with units and direction.
   - Experimental TCN sequence dynamics card.
   - Automated review guidance message.
2. Click **"Print Report"** to demonstrate clinical documentation export.
