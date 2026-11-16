# OcuTrack — Aditya Implementation Plan

**Owner:** Aditya  
**Git branch:** `aditya`  
**Branch rule:** Aditya commits all computer-vision and ML work only to branch `aditya`; changes reach `main` through a reviewed pull request.  
**Workstream:** Computer vision, signal processing, feature extraction, recording quality, and experimental temporal ML  
**Document type:** Individual implementation specification  
**Parent specification:** `PRD.md` v1.0  
**Target:** Hackathon MVP — Python analysis engine called by a browser-based application

---

## Team-wide branch policy

- `main` — Sakar commits directly here.
- `aditya` — Aditya commits only here; submit a PR to `main`.
- `parth` — Parth commits only here; submit a PR to `main`.
- There is no `integration` branch and no extra feature branch in this workflow.
- Keep ownership isolated and keep each branch synchronized with the latest `main` before submitting a PR.

## 1. Mission and ownership

Aditya owns the Python analysis engine that transforms uploaded pupil-response and smooth-pursuit videos into inspectable measurements, time-series features, recording-quality indicators, and (only when supported by appropriate data) an experimental TCN output.

The engine must be reusable from FastAPI and runnable independently from command line/notebooks for debugging. It must not contain frontend code, database access, or clinical decision logic.

### Aditya owns

- Video decoding, frame sampling, timestamp handling, and format validation used by the analysis engine.
- MediaPipe Face Landmarker integration for face/eye-region localization.
- OpenCV-based eye cropping and pupil-region segmentation/tracking.
- Pupil-response time-series and feature extraction.
- Smooth-pursuit eye-position tracking and target-versus-eye comparison.
- Recording quality indicators and clear failure reasons.
- Annotated-frame and feature-plot outputs for engineering evaluation.
- Time-series preparation and input feature schema for a TCN.
- PyTorch TCN architecture, training scripts, inference wrapper, and experimental evaluation when suitable labelled data exists.
- A transparent non-deep-learning baseline for comparison where data permits.
- Documentation of test protocol assumptions, feature definitions, units, data sources, model limitations, and evaluation.

### Aditya does not own

- React/Vite screens, browser camera capture, or dashboard charts (Sakar).
- FastAPI route definitions, Supabase schema/database access, longitudinal across-visit storage/comparison, or hosting (Parth).
- Medical diagnosis, disease-specific risk estimates, or clinical thresholds.

The analysis engine returns measurements and technical/model metadata. It must not make a clinical referral decision or generate a disease label.

---

## 2. Product context and scientific constraints

OcuTrack is a browser-based prototype, not a native mobile app or a validated medical device. The browser uploads short videos to FastAPI. Your Python package processes those videos.

The project studies two separate tasks:

1. **Pupil-response recording:** estimate the pupil region and track its apparent size through a documented light-stimulus recording.
2. **Smooth-pursuit recording:** estimate eye position while the participant follows a moving screen target, then compare the eye trace with the target trajectory supplied by Sakar.

Pupil and eye-movement measurements are non-specific. Results can be affected by medication, fatigue, age, ocular conditions, contact lenses, head movement, lighting, frame rate, focus, exposure, and device differences. Never claim a finding identifies Parkinson's disease, concussion, diabetic neuropathy, or any other condition.

### Critical measurement rules

- MediaPipe Face Landmarker provides facial landmarks/eye localization; it is not a validated pupil-boundary segmentation model.
- Implement a separate pupil-region segmentation/estimation step in OpenCV.
- Report pixel or normalized pupil size unless a valid calibration method is available. Never label pixels as millimetres.
- Latency requires a reliable stimulus-onset timestamp. If not available, return `null` with a warning.
- Constriction velocity requires valid pupil measurements and time deltas. Do not calculate through long gaps or dropped frames.
- Smooth-pursuit tracking requires the target trajectory and timestamps from the frontend. Do not infer an assumed path if metadata is missing.
- Reject or flag recordings where the eye is not visible or quality is insufficient.
- Never return a valid-looking physiological result for a video that failed quality checks.

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

| Layer | Technology | Usage |
|---|---|---|
| Language | Python 3.11+ (team locks exact version) | Analysis engine |
| Video processing | OpenCV | Decode frames, crop, threshold/segment, track |
| Eye localization | MediaPipe Face Landmarker | Detect face/eye landmarks |
| Numerical processing | NumPy, SciPy, Pandas | Filtering, derivatives, time-series features |
| Model development | PyTorch | TCN architecture and training |
| Baseline/evaluation | Scikit-learn | Preprocessing, baselines, metrics, splits |
| Visualization | Matplotlib | Debug plots and experiment reports |
| API integration | Plain Python package/functions | Imported by Parth's FastAPI orchestration layer |

Do not build a separate API server. Parth owns FastAPI and will call your package.

---

## 4. Analysis ownership map (create incrementally)

The layout below is an ownership map, not a command to pre-create empty modules. Create each path only when implementing its real behavior in the active phase. Keep your files within the following boundaries. Coordinate any shared type/schema changes with Parth before changing them.

```text
analysis/
├── __init__.py
├── contracts.py
├── config.py
├── video_io.py
├── frame_sampling.py
├── face_localization.py
├── eye_region.py
├── pupil_segmentation.py
├── pupil_tracking.py
├── pupil_features.py
├── pursuit_tracking.py
├── quality.py
├── pipeline.py
├── visualization.py
└── ml/
    ├── __init__.py
    ├── dataset.py
    ├── preprocessing.py
    ├── tcn.py
    ├── train.py
    ├── inference.py
    ├── baseline.py
    ├── evaluation.py
    └── model_card.md

ml-experiments/
├── notebooks/
├── configs/
├── reports/
└── data-card.md

docs/
├── test-protocol.md
├── feature-dictionary.md
└── cv-evaluation.md
```

Do not edit `frontend/`, `backend/app/api/`, `backend/app/db/`, or `database/schema.sql`.

---

## 5. Analysis-engine contract

Parth's FastAPI layer needs a stable Python entry point. Implement the following callable interface in `analysis/pipeline.py` (names can change only through team agreement):

```python
from pathlib import Path
from typing import Any


def analyze_assessment(
    *,
    pupil_video_path: Path,
    pursuit_video_path: Path | None = None,
    pupil_metadata: dict[str, Any],
    pursuit_metadata: dict[str, Any] | None = None,
    model_config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return JSON-serializable measurements, quality, and model metadata."""
```

The function must:

- Validate that the files exist and can be decoded.
- Process pupil and pursuit videos independently so one failed test can be reported without corrupting the other result.
- Return a structured quality status and warnings.
- Return values as JSON-serializable Python primitives; convert NumPy values to native `float`, `int`, `bool`, and lists.
- Return `None` for a feature that cannot be computed, not `0`.
- Include feature units, method/version metadata, and series timestamps.
- Never write to Supabase or make HTTP calls.
- Avoid retaining raw videos; processing paths are temporary and Parth will manage cleanup.

### Required top-level output shape

Use this contract as the first integration target:

```json
{
  "pipeline_version": "0.1.0",
  "quality": {
    "status": "acceptable",
    "usable_frame_ratio": 0.0,
    "warnings": [],
    "details": {}
  },
  "pupil": {
    "status": "complete",
    "features": {
      "baseline_diameter": {"value": null, "unit": "px_or_normalized", "label": "Baseline pupil size"},
      "minimum_diameter": {"value": null, "unit": "px_or_normalized", "label": "Minimum pupil size"},
      "constriction_amplitude": {"value": null, "unit": "px_or_normalized", "label": "Constriction amplitude"},
      "response_latency_seconds": {"value": null, "unit": "s", "label": "Pupil response latency"},
      "constriction_velocity": {"value": null, "unit": "px_or_normalized per second", "label": "Constriction velocity"}
    },
    "series": [
      {"t_ms": 0, "diameter": null, "valid": false}
    ]
  },
  "pursuit": {
    "status": "complete",
    "features": {
      "mean_tracking_error": {"value": null, "unit": "normalized_screen_units", "label": "Mean tracking error"},
      "tracking_continuity": {"value": null, "unit": "ratio", "label": "Tracking continuity"},
      "corrective_movement_count": {"value": null, "unit": "count", "label": "Corrective movement candidates"}
    },
    "series": [
      {"t_ms": 0, "eye_x": null, "eye_y": null, "target_x": null, "target_y": null, "tracking_error": null, "valid": false}
    ]
  },
  "temporal_model": {
    "status": "not_configured",
    "model_name": "ocutrack-tcn-experimental",
    "model_version": null,
    "output": null,
    "notes": []
  }
}
```

This is a schema example, not a source of expected measurements. Runtime responses must contain only computed values. If a test is not supplied, set its status to `not_provided` and return empty series/features rather than failing the whole assessment.

### Status values

- Test status: `complete`, `insufficient_quality`, `failed`, `not_provided`.
- Overall quality: `acceptable`, `insufficient`, `pending`.
- Model status: `not_configured`, `experimental`, `evaluated`, `failed`.

Parth may wrap this result in an API response with assessment IDs and database metadata, but should preserve the analysis field names.

---

## 6. Video decoding and frame sampling

Implement `video_io.py` and `frame_sampling.py`.

Requirements:

- Accept the browser-produced video format agreed by the team (verify OpenCV/FFmpeg support for the chosen MIME/codec on the Render environment).
- Validate file readability, duration, frame count, width, height, and reported FPS.
- Extract actual frame timestamps where available; if timestamps are estimated from FPS, disclose that in metadata.
- Detect zero/invalid FPS and corrupt streams.
- Avoid processing every frame if it is unnecessary, but do not sample so sparsely that pupil response timing becomes unusable.
- Keep the original frame timestamp associated with every measurement.
- Record dropped/unreadable frame counts.
- Bound maximum duration and frame count to prevent resource exhaustion.

Deliver a deterministic function that accepts the same video and configuration and produces the same sampled frame sequence.

---

## 7. Face and eye localization

Use MediaPipe Face Landmarker for face/eye landmarks and eye-region localization.

Requirements:

- Initialize the model once per worker/process where possible rather than once per frame.
- Handle no-face and multiple-face cases explicitly. For the MVP, require one dominant face and return a clear warning otherwise.
- Track which eye is being processed; do not silently switch between eyes mid-recording.
- Use facial landmarks to crop a stable eye region with margin.
- Track head movement/pose where possible to identify recordings where eye displacement may be caused by head movement.
- Provide debug overlays (landmarks, crop, frame timestamp) for sample recordings.

Do not assume MediaPipe's iris/facial landmarks are exact pupil boundaries. The pupil segmentation stage must estimate the pupil independently.

---

## 8. Pupil segmentation and tracking

Implement a modular OpenCV pipeline in `pupil_segmentation.py` and `pupil_tracking.py`.

A reasonable first prototype may explore:

1. Convert the eye crop to grayscale.
2. Apply controlled denoising/contrast normalization.
3. Estimate candidate dark pupil regions using adaptive thresholding or another documented technique.
4. Filter candidates by plausible shape, size, and position within the eye region.
5. Use temporal continuity to avoid jumping between unrelated dark regions.
6. Return an estimated boundary/center and a confidence/validity flag.

Do not hardcode one threshold as universally valid across all cameras and lighting conditions. Expose configurable parameters and document them.

### Required per-frame output

- Timestamp in milliseconds.
- Eye identity.
- Pupil center (`x`, `y`) in crop/frame pixels.
- Estimated pupil width/diameter in pixels or normalized units.
- Validity flag.
- Segmentation confidence/quality indicator if implemented.
- Optional annotated frame path or debug representation.

If pupil detection fails, mark that frame invalid. Do not interpolate across large gaps or hide missing data.

---

## 9. Pupil-response feature extraction

Implement `pupil_features.py`.

Potential outputs:

| Feature | Definition | Conditions |
|---|---|---|
| Baseline diameter | Robust pupil-size estimate before/at stimulus onset | Requires stimulus timing and enough pre-response samples. |
| Minimum diameter | Minimum valid pupil-size estimate within defined response window | Requires enough valid post-stimulus samples. |
| Constriction amplitude | Baseline minus minimum size | Only if both baseline and minimum are valid. |
| Response latency | Time from recorded light onset to defined onset of constriction | Requires synchronized stimulus-onset timestamp and sufficient frame rate. Otherwise `null`. |
| Constriction velocity | Rate of pupil-size change over a defined contraction interval | Use timestamp-aware derivatives and disclose smoothing method. |
| Recovery behavior | Return toward baseline after constriction | Only if recording duration supports it. |

### Signal processing rules

- Use timestamp-aware derivatives rather than assuming constant frame rate.
- Document smoothing/filter settings and keep raw and filtered traces available for debugging.
- Do not calculate derivatives across large missing-frame gaps.
- Record valid-sample ratio.
- Define which interval is used for baseline and response; do not select windows after inspecting each participant's desired result.
- If stimulus onset was not reliably recorded, do not invent latency.
- If physical calibration is not available, label size/velocity in pixels or normalized units.

---

## 10. Smooth-pursuit tracking

Implement `pursuit_tracking.py`.

Inputs:

- Smooth-pursuit recording.
- Face/eye landmarks and estimated gaze/eye position.
- Target trajectory metadata generated by Sakar's frontend.
- Capture start timestamp and path version.

Requirements:

- Map estimated eye position to normalized screen coordinates only if a defensible mapping exists. Otherwise return eye-position coordinates in the documented frame/crop coordinate system and mark the mismatch.
- Interpolate target coordinates using timestamps, not frame index alone.
- Calculate target-to-eye tracking error only after coordinate systems are aligned.
- Keep horizontal/vertical components and combined error clearly defined.
- Detect loss of tracking and head movement; mark affected intervals invalid.
- Treat rapid corrective movements as candidates, not automatically pathological saccades.
- Document frame-rate limitations before extracting timing-sensitive features.

### Required outputs

- Timestamped eye position.
- Timestamped target position.
- Per-frame validity flag.
- Mean/median tracking error where valid.
- Tracking continuity ratio.
- Optional lag estimate where technically supported.
- Corrective-movement candidate count/summary where frame rate supports it.

If target-path metadata is missing or unsynchronized, return `not_comparable`/unavailable pursuit features rather than assuming a path.

---

## 11. Recording-quality checks

Implement `quality.py` and make quality checks part of the top-level pipeline.

Minimum checks:

- Video decodes successfully.
- Duration is within the configured protocol range.
- Sufficient number of frames exists.
- Frame rate is measured/reported and meets the team's documented technical minimum.
- Face and eye regions are visible for a sufficient proportion of frames.
- Pupil localization continuity is sufficient for pupil feature calculation.
- Tracking interruption ratio is reported.
- Head movement or eye occlusion warnings are surfaced where available.
- Stimulus timing metadata exists before latency is calculated.
- Test protocol and illumination metadata are present.

The numerical thresholds are engineering-quality thresholds for the prototype, not medical thresholds. Define them in a configuration file and explain how they were selected. Return warnings and detailed metrics so Sakar can show the reason.

If overall quality is insufficient:

- Do not emit normal/abnormal physiological interpretation.
- Mark the test `insufficient_quality`.
- Return the reason(s) and any safe-to-show technical metrics.

---

## 12. TCN and temporal ML workstream

### 12.1 Purpose

The TCN is intended to analyze the time-series sequence within an individual recording. It is not the across-visit longitudinal comparison engine (Parth owns that). The model must have a clearly defined target and dataset before training.

### 12.2 Input representation

Possible channels include:

- Pupil diameter (pixel or normalized units; calibrated only if justified).
- Pupil velocity.
- Pupil acceleration if sufficiently stable.
- Eye position x/y.
- Target position x/y.
- Tracking error.
- Validity/missingness mask.

Do not concatenate pupil and pursuit sequences without a rationale. For the first experiment, separate pupil and pursuit TCNs or separate input heads may be easier to evaluate.

### 12.3 Required implementation

- `dataset.py`: participant-level dataset loading and sequence construction.
- `preprocessing.py`: resampling/normalization/masking with saved configuration.
- `tcn.py`: TCN architecture with documented receptive field, channels, kernel size, dilation scheme, and output head.
- `train.py`: reproducible training entry point and seeded configuration.
- `inference.py`: load versioned weights and return structured output.
- `baseline.py`: simple statistical or Scikit-learn baseline.
- `evaluation.py`: subject-level split, metrics, confusion matrix where labels exist, and comparison against baseline.

### 12.4 Data availability decision gate

Before training, verify:

- Dataset license and permitted use.
- Participant identifiers and label definitions.
- Whether labels correspond to the actual task the TCN is meant to predict.
- Device, frame rate, lighting, and population compatibility.
- Enough independent participants for a meaningful held-out evaluation.

If suitable labelled data is unavailable:

- Implement the TCN architecture and input pipeline as an experimental technical component if time permits.
- Do not invent clinical labels or train on fabricated sequences and claim medical performance.
- Use synthetic data only for code-path tests and clearly labelled visualization fixtures.
- Set model status to `not_configured` or `experimental` and output `null` where appropriate.
- Use transparent signal summaries/statistical checks for the working MVP.

### 12.5 Avoid data leakage

Split by participant, never by video frame or random overlapping windows. All recordings from a participant belong to only one split. Report subject counts and class distribution for every split. Save random seed and configuration.

### 12.6 Metrics

If appropriate labels exist, report precision, recall, F1, AUROC when meaningful, confusion matrix, class distribution, confidence intervals where feasible, and the same held-out split for TCN and baseline. Do not report accuracy alone. If labels do not exist, do not report disease-classification metrics.

---

## 13. Data and experiment documentation

Create `ml-experiments/data-card.md` and update it whenever a dataset changes.

For each data source, document:

- Source URL/name and license.
- Intended use and restrictions.
- Number of participants/recordings.
- Population and collection context if known.
- Camera/sensor type, frame rate, lighting, and protocol.
- Label source and definition.
- Missing data and exclusions.
- Participant-level train/validation/test split.
- Potential biases and domain mismatch against ordinary webcams.

For volunteer recordings:

- Obtain informed consent for the stated demo/research purpose.
- Use only non-identifying test data.
- Do not present volunteer recordings as clinically diagnosed data.
- Do not upload identifiable videos to public repositories.
- Keep raw videos only as long as needed and under the team's approved retention policy.

---

## 14. Evaluation and evidence

Aditya owns engineering evaluation of the analysis package.

### Computer vision

| Component | Metric | Reference |
|---|---|---|
| Eye localization | Detection success rate | Manually reviewed sample frames |
| Pupil segmentation | Dice/IoU or boundary error, where annotations exist | Manually annotated pupil regions |
| Pupil size | MAE in pixels or calibrated units | Manual measurements/reference instrument if available |
| Time-series quality | Valid-frame ratio, missing-frame rate, signal continuity | Per-recording pipeline output |
| Pursuit | Target-to-eye error | Manually reviewed/annotated reference or suitable eye tracker |
| Repeatability | Within-/between-session variation | Repeated controlled recordings |

### Model evaluation

- Same participant-level held-out test set for model and baseline.
- Report input feature schema and preprocessing.
- Store training seed, configuration, code commit, dataset version, and model version.
- Keep train/validation/test performance separate.
- Do not tune on the test set.
- Make a model card that states intended use, unsupported use, known limitations, and evaluation evidence.

### Demo artifacts

Provide:

- At least two sample videos or consented recordings with clear labels (sample/consented; not clinical diagnosis).
- Annotated frame examples.
- Pupil time-series plot.
- Pursuit target-vs-eye plot.
- Quality-check report.
- Reproducible evaluation summary.
- TCN evaluation or explicit statement that clinical labels/data were unavailable and model output is not configured.

---

## 15. Safety and result constraints

The analysis engine must never emit a disease diagnosis or independently set emergency urgency.

Allowed technical outputs:

- `acceptable` or `insufficient` recording quality.
- Feature values with units and calculation definitions.
- Within-recording temporal-pattern result with `experimental` status where appropriate.
- Warnings about timing, frame rate, missing data, or comparability.

Prohibited outputs:

- Parkinson's detected.
- Concussion detected.
- Diabetic neuropathy detected.
- Neurologically healthy.
- Unsupported disease probability or medical risk score.
- Urgent/emergency priority based only on TCN output.

Parth will convert technical output into neutral report wording. Do not write referral messages in the CV or ML package.

---

## 16. Performance and reliability requirements

- Process short demo videos within a measured, repeatable time on the selected backend environment.
- Bound input file size, duration, frame count, and memory usage.
- Avoid loading unnecessarily large full-resolution videos into memory when streaming frame decode is possible.
- Reuse loaded MediaPipe/Torch models within a worker.
- Use deterministic preprocessing where possible.
- Handle unsupported/corrupt codecs with a structured error.
- Do not return partially computed values as complete without marking the status/warnings.
- Log technical errors without logging raw video or personally identifying information.

---

## 17. Phased implementation plan

Implement the analysis engine in the following sequence. Each phase must leave a runnable CLI/test path. Do not create empty modules or claim model performance before evaluating real, suitable data.

### Phase 0 — Contract, input protocol, and data gate

- Confirm the exact `analyze_assessment()` callable and JSON output contract with Parth.
- Confirm Sakar's video MIME/container, frame-timestamp behavior, pupil protocol metadata, pursuit trajectory format, target timing, and protocol version.
- Identify candidate datasets and document their provenance, permissions, labels, subject identifiers, acquisition conditions, and suitability.
- Decide which measurements can be extracted from the actual browser/demo recording and which must remain `null` until validated.
- Commit the approved analysis contract/example to branch `aditya`; coordinate any shared contract update before implementation.

**Exit criteria:** The engine contract and input metadata are agreed; supported input formats and the dataset decision are documented.

### Phase 1 — Reliable video ingestion and quality assessment

- [x] Implement actual video validation, decoding, timestamp extraction, and deterministic frame sampling.
- [x] Handle missing, corrupt, unsupported, too-short, or low-frame-rate recordings with structured errors/statuses.
- [x] Measure usable-frame ratio and report quality warnings.
- [x] Provide a working CLI that analyzes a supplied video and prints the structured quality report.

**Exit criteria:** A valid sample video and invalid sample videos produce deterministic, documented outputs; no CV or ML values are fabricated when decoding fails. (COMPLETED)

### Phase 2 — Eye localization and pupil segmentation

- [x] Implement MediaPipe Face Landmarker or the agreed equivalent for face/eye localization.
- [x] Implement actual pupil-region segmentation/tracking with OpenCV; do not treat facial landmarks as a pupil boundary.
- [x] Handle no-face, closed-eye, occlusion, glare, low-resolution, and tracking-loss cases.
- [x] Produce timestamped per-frame pupil diameter/position values, validity flags, and optional annotated debug frames for development only.
- [x] Evaluate detections against a manually annotated subset where available.

**Exit criteria:** The pipeline can process the agreed sample recording and produce a pupil time series with explicit invalid frames and measurable evaluation evidence. (COMPLETED)

### Phase 3 — Physiological feature extraction and pursuit tracking

- [x] Calculate only features supported by the captured stimulus and reliable timestamps: baseline/minimum pupil size, constriction amplitude, latency when stimulus onset is known, and velocity with documented units.
- [x] Keep pixel/normalized measurements distinct; do not label pixels as millimetres without calibration.
- [x] Implement smooth-pursuit eye-position tracking and align it to Sakar's target trajectory metadata.
- [x] Calculate tracking error/continuity and candidate corrective movements with transparent definitions.
- [x] Return `null` plus a warning when timing, calibration, eye visibility, or target alignment is insufficient.

**Exit criteria:** Feature definitions, units, formulas, test coverage, and output series are documented; sample CLI output is valid JSON matching the agreed schema. (COMPLETED)

### Phase 4 — Temporal model experiment (data-gated)

- Establish simple statistical/Scikit-learn baselines before the TCN.
- Train/evaluate a PyTorch TCN only if the available dataset has relevant labels, adequate subject diversity, permissible use, and enough examples for a defensible evaluation.
- Split train/validation/test data by participant, not by video frame or recording, to prevent subject leakage.
- Report suitable metrics, confidence/uncertainty handling, class balance, limitations, and comparison against the baseline.
- Export model weights/configuration only when training and evaluation are reproducible.
- If suitable labels/data are unavailable, return `temporal_model.status = not_configured` (or `experimental` only for a clearly described non-clinical experiment). Do not train on invented data or present a synthetic classification as medical evidence.

**Exit criteria:** Either a reproducible, appropriately evaluated experimental TCN is available, or the system honestly reports that the model is not configured and still provides the validated measurement pipeline.

### Phase 5 — Backend integration and reproducible handoff

- Expose the agreed `analyze_assessment()` function and keep it free of HTTP, FastAPI, and database code.
- Ensure every returned object is JSON-serializable and follows the shared schema exactly.
- Add unit tests and a CLI invocation using the same configuration as the backend.
- Coordinate a single integration test with Parth using a consented/synthetic non-identifying sample fixture.
- Document runtime, dependencies, model version, supported video formats, feature units, quality limitations, and known failure modes.

**Exit criteria:** Parth can import and execute the analysis package without copying CV/ML code; the CLI and backend produce schema-compatible results.

### Definition of done

- The analysis package runs independently of FastAPI through a documented CLI.
- Pupil and pursuit processing are independently testable.
- All computed features include units, definitions, timestamps, and validity information.
- Missing/unsupported values are `null`, never fabricated zeros.
- The TCN is data-gated and its status is honest; subject-level evaluation is documented if trained.
- No disease diagnosis, clinical risk score, or urgency claim is emitted.
- No database calls, frontend code, empty placeholder modules, or raw sensitive videos are committed.

## 18. Git and integration rules

**Assigned branch: `aditya`**

- Create/use the exact branch name `aditya` from the latest agreed `main`.
- Commit all Aditya-owned work only to `aditya`; never push directly to `main` or create a substitute feature/integration branch.
- Own `analysis/`, ML experiment code, analysis tests, and analysis documentation only.
- Do not edit `frontend/`, FastAPI routes, Parth's database schema, or Supabase configuration.
- Commit in small phase-based increments. Each commit must leave the analysis CLI/tests runnable.
- Keep `aditya` updated by merging or rebasing the latest `main` into `aditya`; resolve conflicts on `aditya`.
- Open a pull request from `aditya` into `main` after the analysis contract, tests, and handoff criteria pass. Coordinate with Sakar for the merge; the agreed merge order is Aditya before Parth.
- Do not change field names, units, or status enums without approval from Sakar and Parth and an update to the shared contract plus tests.
- Never commit `.env`, secrets, private participant videos, or datasets whose license/permission does not allow repository storage.

### Commit format

Examples:

- `feat(analysis): add deterministic video decoder`
- `feat(cv): track pupil diameter across frames`
- `feat(ml): add evaluated experimental TCN`
- `test(analysis): cover low-quality recordings`

Do not commit empty modules, dead code, TODO-only stubs, model weights without a reproducible evaluation, or raw video files.

## 19. Dependencies and questions to resolve early

1. Parth must confirm how the FastAPI service passes temporary file paths and metadata into `analyze_assessment()`.
2. Sakar must provide exact pursuit target path metadata and timing fields.
3. The team must agree on codec/container output from MediaRecorder and verify it decodes in the deployment environment.
4. The team must agree on the illumination protocol and stimulus-onset timestamp method.
5. Suitable labelled data must be identified before any disease- or clinical-outcome model is attempted.
6. The team must choose whether any measurements are pixel-based, normalized, or calibrated; do not mix units across visits.

---

## 20. Final handoff checklist

- [x] `analysis/pipeline.py` exposes the agreed callable entry point.
- [x] `analysis/contracts.py` and example output match the integration contract.
- [x] Video decoder validates format, duration, FPS, and frame count.
- [x] MediaPipe locates the face/eye region and handles no-face cases.
- [x] OpenCV estimates pupil region separately from MediaPipe landmarks.
- [x] Pupil time-series includes timestamps, validity, and unit metadata.
- [x] Stimulus latency is null unless onset timing is reliable.
- [x] Smooth-pursuit features use Sakar's recorded target trajectory.
- [x] Quality status and warnings are returned for every test.
- [ ] TCN has a defined input/output contract and reproducible configuration.
- [ ] If labels are unavailable, the output clearly remains experimental/not configured.
- [ ] Subject-level data split and baseline comparison are documented where relevant.
- [x] No disease diagnosis or unvalidated urgency is returned.
- [x] No database calls or frontend code exist in the analysis package.
- [x] Tests and CLI examples are committed; no raw sensitive video is committed.
