# OcuTrack

**Browser-Based Ocular Measurement & Longitudinal Monitoring Prototype**

> **Clinical Regulatory Notice:** Hackathon prototype — not a diagnostic device. OcuTrack provides quantitative ocular measurements for research and clinical review. It does not diagnose Parkinson's disease, concussion, diabetic neuropathy, or any neurological condition.

---

## Architecture & Workstreams

| Workstream | Owner | Responsibility | Target |
|---|---|---|---|
| **Frontend & Capture** | Sakar | React + Vite + TypeScript web app, camera preview, browser recording (`MediaRecorder`), smooth pursuit stimulus, report visualizations, and client integration | `frontend/` (Branch: `main`) |
| **Analysis & Modeling** | Aditya | MediaPipe iris/pupil localization, biometric feature extraction, gaze kinematics, and experimental Temporal Convolutional Network (TCN) | `analysis/` (Branch: `aditya`) |
| **Backend & Storage** | Parth | FastAPI REST services, Supabase PostgreSQL, temporary video retention, and longitudinal comparison engine | `backend/` (Branch: `parth`) |

---

## Quick Start (Frontend)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run local dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in Chrome.

3. **Run automated test suite:**
   ```bash
   npm test
   ```

4. **Build production bundle:**
   ```bash
   npm run build
   ```

---

## Documentation

- [Shared Integration Contract](file:///docs/integration-contract.md) — Locked API schemas, status enums, units, and video contracts.
- [Hackathon Demo Guide](file:///docs/demo-guide.md) — Step-by-step presentation script for evaluators and judges.
- [Product Requirements Document (PRD)](file:///PRD.md) — Complete product and functional requirements specification.
- [Sakar Implementation Plan](file:///sakarImplementation.md) — Individual implementation plan and task checklist.
