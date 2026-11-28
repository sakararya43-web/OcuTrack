# OcuTrack Changelog

All notable changes to this project are documented here in reverse-chronological order.

---

## [Unreleased] — 2026-11-28

### Added — Feature: Reusable 5-Point Pre-Test Calibration Check (All Tests)

**Task Source:** Uploaded specification (`Feature: Reusable 5-Point Pre-Test Calibration Check (All Tests)`)

#### New Files
- `frontend/src/components/capture/CalibrationCheck.tsx`
  — Reusable 5-second **Quick 5-Point Calibration Check** component accepting `videoRef`,
    `onCalibrationComplete(result)`, and optional `onSkipForDemo`. Animates a medical crosshair
    target across 5 coordinates (`50%, 50%` -> `20%, 22%` -> `80%, 22%` -> `80%, 78%` ->
    `20%, 78%`, 1s each) using Framer Motion spring physics with `useReducedMotion()` support.
    Samples live camera frames onto an off-screen `160x120` `<canvas>` at ~15 FPS
    (`67ms` interval), computes frame-to-frame pixel luminance MAD (`extractLuminanceSamples`,
    `computeFrameJitterMetrics`), ambient brightness drift, and a live monospaced `tabular-nums`
    **Calibration Stability Score (0%–100%)** + **Jitter Meter**.
    - Pass gate (`score >= 75%`): displays `CALIBRATION STABLE`, rectangular `Proceed to Capture`
      button, and 1.5s auto-unlock.
    - High-jitter gate (`score < 75%`): displays amber warning banner (`High tracking jitter
      detected. Steady the device or rest it on a stable surface before capturing.`), rectangular
      `Recalibrate (5s)` button, and rectangular `Override & Proceed` button logging
      `low_calibration_stability`.
  — Also exports `CalibrationStatusBadge` (compact `rounded-sm` header badge + `Recalibrate`
    button) and `buildCalibrationUploadMetadata()` shared by both test pages without duplication.

- `frontend/src/test/CalibrationCheck.test.tsx`
  — 6 unit & integration tests covering real luminance/MAD jitter scoring, 5-coordinate sweep
    & 1.5s auto-unlock, high-jitter warning + `Recalibrate (5s)` + `Override & Proceed`
    (`low_calibration_stability`), integration gating on `PupilTestPage` & `PursuitTestPage`,
    header badge + `Recalibrate`, unblocked `SampleVideoFallback`, and EN/HI/ES/FR i18n parity.

#### Modified Files
- `frontend/src/pages/PupilTestPage.tsx`
  — Automatically runs `CalibrationCheck` once live webcam activates before unlocking
    `Start 15s Recording`; renders `CalibrationStatusBadge` (`Calibration: XX% (Passed)` /
    `(Override)`) + `Recalibrate` button in header; forwards calibration metadata +
    `low_calibration_stability` note without altering backend schemas; keeps `SampleVideoFallback`
    completely unblocked.
- `frontend/src/pages/PursuitTestPage.tsx`
  — Same calibration gate in the top full-width target arena before `SmoothPursuitTarget` and
    `Start Pursuit Recording (10s)` unlock, keeping `<CameraPreview>` live underneath, plus
    header `CalibrationStatusBadge` and unblocked `SampleVideoFallback`.
- `frontend/src/i18n/locales/{en,hi,es,fr}/pages.ts`
  — Added `capture.calibration` translations (`title`, `subtitle`, `stabilityLabel`,
    `jitterMeterLabel`, `stableBadge`, `highJitterWarning`, `recalibrate5sBtn`, `overrideBtn`,
    `headerPassed`, `headerOverride`, `recalibrateShort`, `unlockHint`, etc.) across all 4 locales.

#### Verification & Scaffolding Audit
- Audited `CalibrationCheck.tsx`, `PupilTestPage.tsx`, `PursuitTestPage.tsx`, and existing
  sources: zero `TODO`/`FIXME`/`stub`/scaffolding markers, zero `rounded-full` buttons/badges,
  zero gradients, zero emoji icons, zero em dashes.
- `frontend`: `npm run build` passed (`tsc -b && vite build`, zero errors).
- `frontend`: `npm run test -- --run` passed (**17 test files, 68 tests passed**).

---

### Added — Feature: One-Click Clinical Handoff Report (Monochrome PDF Export)

**Task Source:** Uploaded specification (`Feature: One-Click Clinical Handoff Report (Monochrome PDF Export)`)

#### New Files
- `frontend/src/components/reports/ClinicalHandoffTemplate.tsx`
  — Off-screen, print-optimised React component (794 px wide = A4 at 96 DPI) rendered
    exclusively for `html2canvas` PDF capture. Enforces explicit hex colors only (`#FFFFFF`,
    `#000000`, `#111827`, `#4B5563`, `#6B7280`, `#D1D5DB`, `#F9FAFB`), zero Tailwind `oklch()`
    utilities, zero gradients, zero pill badges, zero emoji icons, and zero em dashes.
    Includes all 5 sections:
    1. Clinical Header Bar with OcuTrack wordmark, Protocol Version, Local/UTC generation
       timestamps, Facility/Ward & Staff ID (from `AuthContext`), and bordered box
       `NON-DIAGNOSTIC SCREENING SUMMARY - FOR CLINICAL REVIEW ONLY`.
    2. Pseudonymous Patient & Session Metadata table (Patient ID, Age Band, Visit Date/Time,
       Test Type, Capture Quality Score with usable frame % and FPS).
    3. Neutral Longitudinal Baseline Comparison table (`Metric`, `Personal Baseline`,
       `Current Visit`, `Delta (%)`, `Status`) computed from real extracted features,
       prior baseline visit values / deltas, and neutral status strings.
    4. Fixed-width (`714x180`) animation-disabled (`isAnimationActive={false}`) monochrome
       Recharts graphs (PLR curve with stimulus marker + baseline reference, Smooth-Pursuit
       Target vs. Gaze, and Longitudinal Visit Latency Trend when >= 2 accepted visits exist),
       using `#000000` solid for Current Visit and `#6B7280` dashed for Personal Baseline.
    5. Clinician Handoff & Sign-Off Footer (`Referring Health Worker Notes`,
       `Receiving Specialist Review`, `Date`, `Date / Signature`, and non-diagnostic notice).

- `frontend/src/lib/exportClinicalPdf.ts`
  — Async `exportClinicalSummaryPdf(element, patientId, visitDate)` using `html2canvas`
    (`scale: 2`, `backgroundColor: '#ffffff'`, `useCORS: true`) and A4 portrait `jsPDF`
    (`unit: 'mm'`, `format: 'a4'`). Handles multi-page slicing with white canvas fill and
    stamps accurate `Page X of Y` footers on every page. Downloads as
    `OcuTrack_Clinical_Summary_{patientId}_{YYYYMMDD}.pdf`.

- `frontend/src/test/ClinicalHandoffReport.test.tsx`
  — Unit tests verifying all 5 sections of `ClinicalHandoffTemplate`, real baseline/delta
    calculations, monochrome SVG rendering, and multi-page slicing + filename generation in
    `exportClinicalSummaryPdf`.

#### Modified Files
- `frontend/src/pages/AssessmentReportPage.tsx`
  — Added rectangular (`rounded-md`) `TactileButton` **"Export Clinical Summary (PDF)"**
    with `FileDown` icon and Framer Motion press physics, `Generating PDF...` loading state,
    inline `ErrorAlert` error handling, `useOptionalAuth` wiring for Ward/Staff ID, and
    on-demand off-screen `ClinicalHandoffTemplate` mounting (positioned off-screen with
    visible rendering for reliable `html2canvas` capture).
- `frontend/src/context/AuthContext.tsx` — Added `useOptionalAuth()` helper so report
  components safely read Facility/Ward and Staff ID when `AuthProvider` is mounted.
- `frontend/src/types/api.ts` — Added `fps_estimate` to `QualityMetrics` and
  `percentage_delta` to `FeatureDelta` matching backend schema.
- `frontend/src/i18n/locales/{en,hi,es,fr}/pages.ts` — Added `exportClinicalPdf`,
  `pdfGenerating`, and `pdfExportError` translations across all 4 locales.
- `frontend/src/test/AssessmentReportPage.test.tsx` — Added integration test covering PDF
  export trigger, `AuthContext` metadata propagation, and inline export error handling.

#### Dependencies
- `frontend/`: Installed `jspdf` (`^4.2.1`) and `html2canvas` (`^1.4.1`).

#### Verification & Scaffolding Audit
- Scanned `frontend/src`, `backend/app`, `analysis` for `TODO`/`FIXME`/stub/scaffolding
  markers — zero unimplemented scaffolding found; replaced earlier `visibility: hidden`,
  `facilityId={undefined}`, `staffId={undefined}`, hardcoded `'Prior baseline'` strings,
  and `as any` casts with full typed implementations.
- `frontend`: `npm run build` passed (`tsc -b && vite build`, zero errors).
- `frontend`: `npm run test -- --run` passed (**16 test files, 62 tests passed**).
- `backend`: `pytest -q` (with local writable `TEMP_UPLOAD_DIR`) passed (**46 tests passed**).

---

## Previous Work (from git history)

### 2496638 — docs: update README with staff login, protocol assistant, multilingual i18n, and clinic triage overview
### 557727e — Merge remote-tracking branch 'origin/main'
### 5d41df2 — fix(reports,pipeline): unify db, fix capture/analysis series persistence, and add universal report access
### c5a64fb — feat: optimize rural clinic capture, stabilize pupil tracking, and simplify interactive report UI
### e04771f — fix(i18n): translate all landing sections, console pages, and components across EN/HI/ES/FR
### 03307ed — fix(i18n): wire runtime translations into Header, Notice Banner, and Hero components
### 1251aa6 — fix(ui): eliminate header overflow collision, enforce shrink-0 and specific gaps across all nav headings
### 6f5cea8 — fix(ui): adjust header spacing and right padding to keep Initiate Trial button cleanly in view
### c9a05dc — feat(ui): integrate staff login, protocol guide assistant, regional i18n, and clinic overview into refined UI
### af70c75 — Save Sakar refined UI
### c163181 — Merge pull request #2
### bb65e65 — feat(analysis): implement time-series visualization and CLI plot export
### 6f4bba8 — feat(analysis): implement Phase 5 backend integration and reproducible handoff
