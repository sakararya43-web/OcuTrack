# OcuTrack — Product Requirements Document (PRD)

**Document status:** Hackathon MVP specification  
**Version:** 1.0  
**Prepared:** 15 November 2026  
**Project type:** Browser-based software prototype for a student hackathon  
**Working name:** OcuTrack  
**Target challenge:** AI for Medicine: A Global Student Hackathon on the Future of Care  
**Hackathon deadline (as listed by the user):** 5 December 2026, 10:15 AM IST  

---

## 1. Executive summary

OcuTrack is a browser-based screening-support prototype that uses a device camera to record a person's pupil response to a controlled light stimulus and their eye movements while following a moving target. A computer-vision pipeline extracts measurements from the recordings. A temporal machine-learning component analyses patterns within each recording, while a longitudinal comparison component compares a person's current measurements with their own previous assessments.

The system is designed around a practical access problem: community and rural healthcare settings may have limited access to specialist equipment and neurological expertise. OcuTrack aims to help a trained healthcare worker collect repeatable ocular measurements and identify recordings or measurement trends that may warrant repeat testing or further clinical assessment.

**OcuTrack does not diagnose Parkinson's disease, concussion, diabetic neuropathy, or any other medical condition.** Pupil and eye-movement findings are non-specific and can be affected by medication, fatigue, lighting, eye conditions, camera quality, and other factors. The prototype will communicate measurements, recording quality, and changes over time—not a disease diagnosis.

The hackathon deliverable is a web application that runs in a modern browser on a laptop or a compatible smartphone browser. It is **not** a native Android or iOS application. There will be no Kotlin, Android Studio, or separate mobile-app codebase.

---

## 2. Problem statement

In under-resourced clinics, patients with subtle or changing neurological symptoms may not receive timely specialist assessment. Community healthcare workers may have limited tools for recording objective, repeatable measurements that can be compared across visits.

A single observation is often difficult to interpret. A measurement that differs from another person's measurement may be normal for that individual. Conversely, a person's measurements may change over time without crossing a generic threshold. This creates an opportunity to investigate **personal-baseline monitoring**: recording ocular measurements repeatedly and highlighting meaningful changes that deserve attention.

### 2.1 Problem OcuTrack addresses

OcuTrack addresses the measurement and monitoring gap by providing a low-cost, browser-based workflow to:

1. Capture standardized eye recordings using a readily available camera.
2. Extract pupil-response and eye-movement features from the recordings.
3. Assess recording quality before interpreting measurements.
4. Compare a person's current assessment with their own previous assessments.
5. Present transparent observations to a healthcare worker so they can decide whether to repeat the test or seek further clinical evaluation.

### 2.2 What OcuTrack does not claim to solve

- It does not replace a neurologist, ophthalmologist, or other qualified clinician.
- It does not diagnose a neurological or ophthalmic disease.
- It does not establish that a person is healthy because a measurement appears stable.
- It does not independently determine emergency urgency from pupil or eye-movement data.
- It is not a validated medical device and is not intended for unsupervised clinical decision-making.

---

## 3. Product vision and positioning

### 3.1 Vision

Make repeatable ocular-response measurements easier to collect and review in settings where specialist testing resources are limited.

### 3.2 Product positioning

**OcuTrack: Smartphone/browser-based ocular measurement and longitudinal change-monitoring for referral support.**

The core product question is not, “Which disease does this patient have?” It is:

> “Are this person's measured pupil and eye-movement patterns changing, and should a healthcare worker consider repeating the test or arranging further assessment?”

### 3.3 Main differentiator

OcuTrack combines three capabilities:

1. **Measurement:** Computer vision extracts pupil-response and eye-movement measurements from video.
2. **Temporal analysis:** A Temporal Convolutional Network (TCN), when supported by suitable data, analyses the sequence of measurements within a test recording.
3. **Longitudinal comparison:** A separate component compares assessments across visits against the individual's baseline and highlights changes.

The distinction between temporal and longitudinal analysis is important:

- **Within-session temporal analysis:** examines how values change from frame to frame during one recording.
- **Across-visit longitudinal analysis:** compares measurements from different dates for the same person.

The TCN will not automatically understand months of patient history unless it is specifically designed and trained to do so. OcuTrack's first prototype will keep these two functions separate.

---

## 4. Hackathon fit and success strategy

The project fits the challenge's focus on making care cheaper, faster, or possible through diagnosis support, triage, monitoring, and access. OcuTrack primarily targets **monitoring, screening support, and referral prioritization**.

### 4.1 Intended value

- **Access:** A browser-based workflow can run on common camera-equipped devices without a native app installation.
- **Cost:** The prototype explores whether useful measurements can be captured using commonly available cameras rather than dedicated specialist equipment.
- **Consistency:** A guided procedure and feature-extraction pipeline can make measurements easier to repeat.
- **Monitoring:** Historical comparisons can make changes more visible than isolated results.
- **Attention:** Quality checks and change flags can help a healthcare worker decide which assessments need review.

These are intended benefits, not proven clinical outcomes. The hackathon demo must show what works, what fails, and what has not yet been clinically validated.

### 4.2 Judging-oriented priorities

The project should demonstrate:

- A working camera-to-measurement pipeline, not only a dashboard.
- Transparent feature extraction and visualizations.
- A credible ML component with an honest evaluation.
- A working patient-history comparison.
- Clear recording-quality checks and limitations.
- Reproducible experiments and documented test conditions.

A polished interface is useful, but it cannot substitute for measurement accuracy or model evaluation.

---

## 5. Target users and personas

### 5.1 Primary user: Community healthcare worker

- Works in a community clinic or rural primary-care setting.
- May not be a neurologist or specialist.
- Needs a guided, understandable process for capturing and reviewing eye measurements.
- Must be able to identify poor-quality recordings and know when to request a repeat test or clinician review.

### 5.2 Secondary user: Doctor or supervising clinician

- Reviews patient history, extracted measurements, and changes across visits.
- Needs transparent evidence rather than an unexplained AI score.
- Makes the actual clinical decision.

### 5.3 Demonstration user: Hackathon evaluator

- Needs to understand the end-to-end workflow quickly.
- Should be able to see a live or sample recording processed into measurements.
- Should be able to inspect a patient's baseline and a later assessment.
- Should see the model's role, evaluation method, and limitations.

### 5.4 Patient

- Completes the guided eye tests with assistance from a healthcare worker.
- Provides informed consent for the demonstration or assessment.
- Should be told that the prototype is not a diagnosis and that results require appropriate clinical interpretation.

---

## 6. Product scope

### 6.1 In scope for the hackathon MVP

1. Browser-based web interface using React, Vite, and TypeScript.
2. Patient registration using a pseudonymous demo ID.
3. Camera preview and recording using browser APIs.
4. Guided pupil-response recording with a controlled and documented light-stimulus procedure.
5. Guided smooth-pursuit eye-movement recording using a moving on-screen target.
6. Video upload to a Python backend for analysis.
7. Eye localization and pupil-region processing using MediaPipe and OpenCV.
8. Extraction of pupil and eye-movement time-series features.
9. Recording-quality checks and clear failure states.
10. A PyTorch TCN prototype for within-recording temporal pattern analysis, subject to suitable data availability.
11. A baseline statistical or Scikit-learn model for comparison.
12. Across-visit comparison against the patient's baseline.
13. A clinician-facing dashboard with graphs, history, and neutral review recommendations.
14. Persistence of patient metadata and extracted measurements in Supabase PostgreSQL.
15. Demonstration data clearly marked as synthetic, sample, or consented volunteer data.
16. Basic privacy, consent, and data-retention controls appropriate to a hackathon prototype.

### 6.2 Explicitly out of scope

- Native Android or iOS application.
- Kotlin, Jetpack Compose, Android Studio, or a separate mobile-app codebase.
- Production-grade electronic health record integration.
- Diagnosis of Parkinson's disease, diabetic autonomic neuropathy, concussion, dementia, or any other condition.
- Disease-specific risk prediction without disease-specific, clinically labelled data and validation.
- Clinical deployment or use for treatment decisions.
- Hardware manufacturing or a dedicated medical device.
- Multi-hospital deployment, enterprise administration, or regulatory certification.
- Automatic emergency triage based solely on AI output.
- LLM chatbot or generative-AI medical advice feature.
- Kubernetes, microservices, or complex infrastructure that does not improve the core demonstration.

---

## 7. Core user workflow

### 7.1 End-to-end workflow

1. Healthcare worker opens OcuTrack in a supported browser.
2. Worker creates or selects a patient profile using a pseudonymous identifier.
3. Worker explains the test and records consent.
4. Browser checks camera permission, lighting, face position, focus, and recording quality.
5. Patient completes the pupil-response recording under the documented illumination protocol.
6. Patient completes the smooth-pursuit test by following a moving target on the screen.
7. Browser uploads recordings to the FastAPI backend.
8. Backend samples frames and runs the computer-vision pipeline.
9. Pipeline extracts pupil and eye-movement features and calculates quality indicators.
10. The backend runs the temporal model if the required model and input conditions are available.
11. The longitudinal component retrieves the patient's previous accepted assessment and compares the new measurements with the baseline.
12. The application presents measurements, graphs, quality status, changes, and a neutral next-step suggestion.
13. Healthcare worker reviews the result and decides whether a repeat test or clinical assessment is appropriate.
14. Extracted measurements and assessment metadata are saved for future comparison.

### 7.2 Example patient journey: Rahul

This example illustrates product behavior only. The numbers are illustrative and are not clinical reference ranges.

**First visit — baseline**

- Rahul visits a community healthcare centre.
- A healthcare worker creates a profile with a pseudonymous ID.
- Rahul completes the pupil-response and smooth-pursuit tests.
- The system estimates an initial pupil diameter of 5.0 mm, a minimum diameter of 3.2 mm, a response latency of 0.35 seconds, and a constriction velocity of 3.0 mm/s.
- The eye-movement test records tracking error and irregularity features.
- The app marks this assessment as Rahul's baseline after it passes quality checks.
- The system does not label Rahul as disease-free or diagnose a condition.

**Second visit — comparison**

- Rahul returns for a repeat assessment under similar recording conditions.
- Illustrative measurements are: minimum pupil diameter 3.7 mm, response latency 0.48 seconds, and constriction velocity 2.2 mm/s.
- The system checks that the recordings are sufficiently comparable in quality and test conditions.
- It identifies a change from Rahul's baseline and displays the measurements that changed.
- The report says **“Change detected — consider repeat measurement and clinical review”**, not “Rahul has a neurological disease.”
- The clinician reviews symptoms, medications, eye history, and other relevant findings before deciding what to do.

### 7.3 Failure workflow

If lighting, focus, face position, frame rate, eye visibility, or recording continuity is insufficient:

- The system must not present a confident interpretation.
- The assessment is marked **“Insufficient recording quality — repeat test.”**
- The UI explains the issue where possible, for example: “Pupil region not consistently visible.”
- The failed recording must not silently become the patient's baseline.

---

## 8. Functional requirements

Priority definitions: **P0 = required for the MVP**, **P1 = desirable if time permits**, **P2 = future enhancement**.

### 8.1 Patient and assessment management

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-01 | P0 | Create a patient profile using a pseudonymous ID. | A user can create and retrieve a profile without requiring a real name. |
| FR-02 | P0 | Create a dated assessment linked to a patient. | Each successful or failed test has a unique assessment ID and timestamp. |
| FR-03 | P0 | Record consent status for the assessment. | The user must confirm consent before recording begins. |
| FR-04 | P0 | Display assessment history. | A patient profile lists prior assessments in date order. |
| FR-05 | P1 | Record relevant context such as medication, eye history, fatigue, and recent injury. | Context is optional, clearly labelled, and available for clinician review. |

### 8.2 Browser capture and test guidance

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-06 | P0 | Request browser camera permission and show a live preview. | The user can start the test only after camera permission and preview are available. |
| FR-07 | P0 | Record a pupil-response video. | A configurable short recording can be captured and uploaded. The initial target is approximately 15 seconds, subject to test-protocol validation. |
| FR-08 | P0 | Provide a controlled light-stimulus procedure. | Instructions describe the stimulus, positioning, distance, and timing. The test records the chosen protocol and conditions. |
| FR-09 | P0 | Do not assume browser torch support. | The app checks device capability where possible and provides a controlled-lighting fallback. |
| FR-10 | P0 | Record smooth-pursuit eye movement while a target moves on screen. | The target follows a repeatable path and the recording captures the test interval. |
| FR-11 | P0 | Provide recording-quality checks. | The system can flag missing/low-quality video, poor eye visibility, or insufficient frames. |
| FR-12 | P1 | Allow a test to be repeated before submission. | The user can discard a failed recording and retake it. |

### 8.3 Computer vision and feature extraction

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-13 | P0 | Detect the face and eye regions. | The processing pipeline returns eye-region locations or a clear detection failure. |
| FR-14 | P0 | Estimate pupil size over time. | The output contains a timestamped pupil-size series and records units/scale assumptions. |
| FR-15 | P0 | Estimate pupil-response features. | The pipeline calculates available features such as baseline diameter, minimum diameter, constriction amplitude, latency, and constriction velocity. |
| FR-16 | P0 | Track eye position during smooth pursuit. | The pipeline outputs a timestamped eye-position series and target-position series where measurable. |
| FR-17 | P0 | Calculate eye-movement features. | The system calculates tracking error and selected irregularity/saccade-related features, with definitions documented. |
| FR-18 | P0 | Expose intermediate outputs for debugging. | Developers can inspect annotated frames and feature plots on test data. |
| FR-19 | P1 | Compare measurements against manually annotated frames. | A repeatable sample set and annotation protocol are available for accuracy evaluation. |

### 8.4 Machine learning and longitudinal analysis

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-20 | P0 | Implement a baseline analysis method. | A transparent statistical or Scikit-learn baseline can process extracted features and produce reproducible outputs. |
| FR-21 | P1 | Implement a PyTorch TCN for within-recording sequence analysis. | The model accepts documented fixed-length or padded time-series inputs and returns a defined, non-diagnostic output. |
| FR-22 | P0 | Compare current measurements with prior accepted measurements. | The system displays absolute and percentage changes for selected features. |
| FR-23 | P0 | Identify when recordings are not comparable. | Differences in quality or protocol are shown and can prevent a longitudinal comparison. |
| FR-24 | P0 | Provide explainable change details. | A flag is accompanied by the features and dates responsible for it. |
| FR-25 | P0 | Avoid disease diagnosis and unsupported probability claims. | No screen labels an individual with a disease or presents an unvalidated disease probability. |
| FR-26 | P1 | Compare TCN performance with a simpler baseline. | Evaluation reports the same held-out subjects and metrics for both methods. |

### 8.5 Dashboard and reporting

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-27 | P0 | Show an assessment summary. | The page displays quality status, measurements, and a neutral next-step message. |
| FR-28 | P0 | Show pupil-response charts. | A time-series graph displays estimated pupil size over the recording. |
| FR-29 | P0 | Show eye-movement charts. | A graph compares target movement with estimated eye movement where data is available. |
| FR-30 | P0 | Show longitudinal charts. | A patient page plots selected measurements across assessment dates. |
| FR-31 | P0 | Show comparison between two visits. | The user can inspect baseline and current values side by side. |
| FR-32 | P0 | Show model and method limitations. | The report states that the tool is a prototype and not a diagnostic system. |
| FR-33 | P1 | Export a report for demonstration. | A downloadable PDF or CSV can summarize the assessment without claiming clinical diagnosis. |

---

## 9. Proposed technical architecture

### 9.1 Architecture overview

```text
┌──────────────────────────────────────────────────────────────┐
│                  Browser-based web interface                 │
│       React + Vite + TypeScript + Tailwind + shadcn/ui        │
│                                                              │
│  Patient profile  |  Camera capture  |  Test guidance         │
│  Assessment view  |  History         |  Clinician dashboard   │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / REST
                               │ video upload + metadata
┌──────────────────────────────▼───────────────────────────────┐
│                         FastAPI                               │
│             Request validation, orchestration                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                 Python analysis pipeline                      │
│                                                              │
│  MediaPipe Face Landmarker → eye-region localization         │
│  OpenCV → pupil-region processing and tracking                │
│  NumPy / SciPy / Pandas → time-series feature extraction      │
│  PyTorch TCN → within-recording temporal pattern analysis     │
│  Scikit-learn / statistics → baseline and evaluation          │
│  Longitudinal module → compare current and previous visits    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                 Supabase PostgreSQL                           │
│  Patient IDs | Consent | Assessments | Features | Model info  │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Frontend

- **React + Vite + TypeScript:** interactive single-page web application.
- **Tailwind CSS:** layout and styling.
- **shadcn/ui:** accessible interface components.
- **Recharts:** pupil-response, eye-movement, and longitudinal graphs.
- **Browser MediaDevices API (`getUserMedia`):** camera access.
- **MediaRecorder API:** capture browser video for upload.

A native mobile application is not part of this architecture. The website should be responsive enough to open on a compatible smartphone browser, but the core hackathon demonstration should be designed and tested on a laptop webcam first.

### 9.3 Backend

- **Python + FastAPI:** REST API, validation, orchestration, and report data.
- **Pydantic:** request/response validation.
- **OpenCV:** image and video processing.
- **MediaPipe Face Landmarker:** face and eye-region localization. It provides landmarks; it should not be treated as a medically validated pupil-boundary segmentation system.
- **NumPy / SciPy / Pandas:** feature extraction and signal processing.
- **PyTorch:** TCN development and inference.
- **Scikit-learn:** preprocessing, baseline models, and evaluation.

### 9.4 Database and storage

- **Supabase PostgreSQL:** patient metadata, consent status, assessment records, features, comparison results, and model-version metadata.
- **Raw video:** do not retain by default. Process it in a controlled temporary location and delete it after analysis unless the participant has separately consented to retention for research/demo purposes.
- If Supabase Storage or another object store is used for consented videos, use private buckets, restrictive access policies, short retention, and signed access where appropriate.
- Use Supabase Row Level Security (RLS) for any exposed database access. The service-role secret must never be placed in the browser.

### 9.5 Deployment

- **Vercel:** React/Vite frontend.
- **Render:** FastAPI backend and model-serving process.
- **Supabase:** hosted PostgreSQL database.
- Use environment variables for API URLs, database credentials, and secrets.
- Configure HTTPS for deployed browser camera access.
- Confirm deployment-region, data-protection, and service availability requirements before using any real health information.

### 9.6 Why this stack

This stack is appropriate for a hackathon because it keeps the interface quick to build, uses Python for the computer-vision and ML work, avoids a separate native-app codebase, and allows the complete flow to be demonstrated through a browser. A single FastAPI service is sufficient; microservices and Kubernetes are unnecessary for the MVP.

---

## 10. Browser capture and illumination constraints

This section is important because the original concept included using a smartphone flashlight while recording the eye.

### 10.1 Camera access

- Browser camera access generally requires user permission and a secure context such as HTTPS (localhost is commonly permitted during local development).
- The camera may be a laptop webcam or a compatible smartphone browser camera.
- Camera resolution, frame rate, focus, exposure, and low-light performance differ by device.
- The UI must show camera status and reject or flag recordings that do not meet minimum quality criteria.

### 10.2 Flash/torch limitation

A browser cannot be assumed to control a device's flashlight, especially while the front-facing camera is active. Torch support is hardware- and browser-dependent. Simultaneous front/rear camera and flash operation must not be treated as universally available.

**MVP decision:** Do not make browser torch control a critical dependency. Use a documented, controlled illumination protocol that can be reproduced during the demo. Where a compatible device exposes safe torch control, it may be tested as an optional enhancement. Otherwise use an appropriate controlled external light source or documented ambient-light protocol.

### 10.3 Safety

- Do not instruct users to shine an intense flashlight directly into an eye.
- Any light stimulus used in a real clinical study must be designed and supervised by qualified clinical/ophthalmic experts, with suitable intensity, distance, duration, and safety review.
- The hackathon prototype must not be used to perform unsupervised clinical testing.
- Record the illumination method and conditions so that measurements from different sessions are not compared as if they were equivalent when they are not.

---

## 11. Computer-vision pipeline

### 11.1 Input

- Pupil-response video captured under the documented illumination procedure.
- Smooth-pursuit video captured while the participant follows a moving target.
- Session metadata: device/browser where available, approximate frame rate, test protocol, lighting notes, and assessment timestamp.

### 11.2 Processing steps

1. Validate file type, duration, frame count, and basic video integrity.
2. Decode frames and normalize timestamps where possible.
3. Detect face and eye landmarks with MediaPipe Face Landmarker.
4. Crop and track the eye region across frames.
5. Apply OpenCV-based image processing to estimate the pupil region and boundary.
6. Estimate pupil diameter using a documented pixel-to-scale method where calibration is available.
7. Track pupil size over time and calculate response features.
8. Track eye position during the smooth-pursuit task.
9. Match eye position with the known target position over time.
10. Calculate movement features and recording-quality indicators.
11. Return annotated frames or diagnostic plots for developer inspection.

### 11.3 Pupil-response features

Potential features include:

- Baseline pupil diameter.
- Minimum pupil diameter.
- Constriction amplitude.
- Response latency, if the stimulus onset can be timestamped reliably.
- Maximum or average constriction velocity.
- Redilation/recovery characteristics, if the recording duration supports it.
- Signal smoothness and missing-frame ratio.

All features must define their units, calculation method, and limitations. Pixel measurements must not be reported as millimetres unless a valid calibration method is used.

### 11.4 Smooth-pursuit features

Potential features include:

- Estimated eye position over time.
- Target position over time.
- Tracking error between target and eye position.
- Lag or delay estimates.
- Number and characteristics of corrective saccade-like movements, where the frame rate and tracking quality support such analysis.
- Missing or unstable tracking intervals.

The system must not claim that all detected rapid eye movements are pathological saccades. Feature definitions should be reviewed and described conservatively.

### 11.5 Quality-control features

- Face/eye visibility ratio.
- Pupil detection continuity.
- Number of usable frames.
- Actual frame rate and dropped-frame ratio.
- Motion blur or image-quality indicators where feasible.
- Lighting consistency indicators.
- Test duration and protocol completeness.

If quality is insufficient, the output must be **“Insufficient recording quality — repeat test”** rather than a physiological interpretation.

---

## 12. Machine-learning design

### 12.1 Role of the TCN

The Temporal Convolutional Network is intended to analyse the **sequence of extracted measurements within a single recording**. It may learn temporal patterns such as response shape, irregularity, latency-related patterns, or eye-tracking dynamics.

The TCN does not diagnose a condition. Its output must be named and described as a non-diagnostic temporal-pattern result, not a disease score.

### 12.2 Model input

A time-series tensor may contain channels such as:

- Pupil diameter (calibrated units or normalized values).
- Pupil velocity.
- Pupil acceleration or smoothed derivative, if reliable.
- Eye horizontal position.
- Eye vertical position.
- Target horizontal/vertical position.
- Tracking error.
- Validity or missingness mask.

Pupil-response and smooth-pursuit recordings may be handled by separate model heads or separate TCN models initially. They should not be merged without a clear rationale and adequate data.

### 12.3 Model output

The output depends on the training data available:

- If suitable labelled sequences exist: a validated experimental class or pattern score with clearly defined labels.
- If only non-clinical volunteer recordings exist: a technical pattern/quality output, not a medical abnormality classifier.
- If suitable labels are unavailable: use a transparent signal-analysis/statistical baseline for the MVP and present the TCN as an experimental component rather than inventing clinical labels.

A TCN must not be trained on synthetic measurements and then presented as clinically capable. Synthetic sequences may be used for software integration tests or illustrative UI states only, and must be clearly labelled as synthetic.

### 12.4 Baseline model

A simpler baseline is required so that the TCN's value can be assessed. Possible baselines include:

- Feature-based logistic regression or random forest if suitable labels exist.
- Rule-based or statistical change detection for longitudinal deviation.
- Simple signal summaries and thresholds for technical feasibility testing.

The selected baseline must be documented. It is not a medical reference standard unless clinically validated.

### 12.5 Longitudinal comparison

The longitudinal module is separate from the within-session TCN.

For each patient, it should:

1. Select the latest accepted baseline or prior assessment.
2. Check whether test protocol and recording quality are comparable.
3. Compare shared features across visits.
4. Display absolute and percentage differences.
5. Show trends over time.
6. Flag changes for review using clearly disclosed experimental thresholds or a validated method when available.

Do not compare measurements across materially different protocols, devices, or recording conditions without calibration or an explicit comparability warning.

### 12.6 Avoiding data leakage

If labelled data is used, split the dataset by participant—not by individual video frames or randomly mixed time windows. All recordings from one participant must remain in a single partition. This prevents the model from seeing nearly identical recordings from the same person in both training and test sets.

---

## 13. Result language and clinical safety

### 13.1 Allowed prototype statuses

The MVP should use neutral statuses such as:

1. **Insufficient recording quality — repeat test.** The recording cannot support reliable measurement.
2. **No notable change detected in measured features.** This does not mean the patient is healthy or free of disease.
3. **Change detected — consider repeat measurement and clinical review.** The displayed features differ from the patient's baseline.
4. **Experimental model output.** Used only where a model has been evaluated on appropriate data and its scope is stated.

### 13.2 Prohibited language

Do not display:

- “Parkinson's detected.”
- “Concussion detected.”
- “Diabetic neuropathy detected.”
- “Neurologically healthy.”
- “Disease probability: 92%” unless a disease-specific model has been appropriately developed, externally validated, and cleared for such use—which is outside the hackathon scope.
- “Urgent” based only on an unvalidated model score.

### 13.3 Human review

All outputs are intended to support, not replace, clinical judgment. A qualified healthcare professional must interpret results alongside symptoms, medical history, medication use, ocular history, and appropriate examination.

If a participant reports severe or acute symptoms, the system must not delay standard medical care while waiting for an OcuTrack result. Emergency decisions must follow local clinical protocols, not this prototype's algorithm.

---

## 14. Data strategy

### 14.1 Data required

The project may need:

- Eye videos with pupil boundaries or landmarks annotated for computer-vision evaluation.
- Pupil light-reflex time-series data under documented test conditions.
- Smooth-pursuit eye-tracking data with target trajectories.
- Participant-level labels only if the team intends to train a supervised model for a defined outcome.
- Repeated measurements from the same participants for longitudinal feasibility testing.

### 14.2 Data-source hierarchy

1. Public datasets with clear licensing and relevant recording protocols.
2. Consented volunteer recordings used only for technical feasibility and measurement evaluation.
3. Synthetic data for UI states, API testing, and pipeline testing only.

Do not assume that a dataset is suitable just because it contains eye images or eye-tracking data. Check licensing, consent, population, camera type, frame rate, lighting, label definitions, and intended use.

### 14.3 Data limitations

- Suitable, clinically labelled pupillary-reflex and smooth-pursuit datasets may be difficult to obtain.
- Data collected with specialized eye trackers may not transfer directly to ordinary webcam footage.
- A small convenience sample cannot establish diagnostic accuracy or generalizability.
- Different phones, webcams, lighting conditions, and frame rates may cause domain shifts.
- Medication, fatigue, age, ocular disease, contact lenses, and other factors may affect measurements.

### 14.4 Dataset documentation

For every dataset, document:

- Source and license.
- Intended use and restrictions.
- Number of participants and recordings.
- Recording devices and conditions.
- Available labels and who assigned them.
- Missing data and exclusions.
- Train/validation/test split by participant.
- Known biases and limitations.

---

## 15. Evaluation and success metrics

The hackathon report must distinguish engineering performance from clinical validity.

### 15.1 Computer-vision evaluation

| Component | Metric | Evaluation method |
|---|---|---|
| Eye localization | Detection success rate | Compare with manually reviewed/annotated frames. |
| Pupil boundary | Dice/IoU or boundary error, where annotations exist | Compare predicted pupil masks/boundaries with annotated references. |
| Pupil diameter | Mean absolute error in pixels or calibrated units | Compare with manual measurements or a reference instrument, if available. |
| Pupil time-series | Missing-frame rate and signal continuity | Report valid samples and interruptions per recording. |
| Eye tracking | Target-to-eye tracking error | Compare with manually annotated gaze/eye positions or an available reference system. |
| Repeatability | Within-session and between-session variation | Repeat recordings under controlled conditions. |

### 15.2 Machine-learning evaluation

If suitable labels are available:

- Use participant-level train/validation/test splits.
- Report confusion matrix, precision, recall, F1 score, and AUROC where appropriate.
- Report class distribution and confidence intervals where feasible.
- Compare TCN with a simpler baseline.
- Evaluate calibration if probabilities are produced.
- Do not report accuracy alone, especially with imbalanced classes.

If suitable labels are not available:

- Do not report disease-classification accuracy.
- Report technical pipeline completion, signal quality, and repeatability.
- Demonstrate longitudinal feature comparison using consented volunteer data or clearly labelled synthetic examples.
- State that clinical pattern detection remains unvalidated.

### 15.3 Product/demo success criteria

The MVP is considered demo-ready when:

1. A user can create a pseudonymous patient profile.
2. The browser can capture or load a supported test recording.
3. The backend can process the recording and return a structured result.
4. The system can display pupil and eye-movement feature plots.
5. Failed or poor-quality recordings are flagged rather than misinterpreted.
6. A second assessment can be compared with a baseline.
7. The interface explains which features changed and by how much.
8. The system never presents an unvalidated disease diagnosis.
9. At least one reproducible evaluation is documented for the computer-vision pipeline or model.
10. The complete demo can be repeated reliably using the same prepared test cases.

---

## 16. UI/UX requirements

### 16.1 Design principles

- Professional clinical-software feel; avoid a generic AI dashboard aesthetic.
- Clear typography, restrained colors, and strong information hierarchy.
- No celebratory or alarming color treatment for unvalidated results.
- Show actual measurements and trends, not just large AI scores.
- Make recording quality visible before presenting any analysis.
- Use concise explanations understandable to a community healthcare worker.
- Make the prototype disclaimer visible in patient and assessment views.

### 16.2 Main screens

1. **Welcome / workspace:** project purpose, prototype disclaimer, and entry to patient records.
2. **Patient list:** pseudonymous ID, latest assessment date, and status of last recording.
3. **Patient profile:** consent and context fields, assessment history, and baseline marker.
4. **Pupil test:** camera preview, positioning guide, illumination instructions, countdown, and recording-quality feedback.
5. **Smooth-pursuit test:** animated target, clear instruction, progress indicator, and camera preview.
6. **Processing screen:** transparent steps such as validating video, locating eyes, extracting measurements, and comparing history. Do not imply that processing has clinical certainty.
7. **Assessment report:** quality status, measured features, annotated visualizations, model/baseline information, and cautious next-step wording.
8. **Longitudinal view:** visit timeline and feature trends with protocol/quality warnings.
9. **About / limitations:** what the system can and cannot conclude, data handling, and known constraints.

### 16.3 Required report content

Each assessment report should contain:

- Pseudonymous patient ID and assessment timestamp.
- Test protocol and recorded conditions.
- Camera/device metadata where available.
- Recording-quality status.
- Pupil-response time-series graph.
- Extracted pupil features and units.
- Smooth-pursuit graph and extracted features.
- Previous assessment used for comparison, if available.
- Feature-level changes.
- Model name/version and whether its output is experimental.
- Neutral recommendation such as repeat test or consider clinical review.
- Explicit non-diagnostic disclaimer.

---

## 17. Proposed API contract

The exact implementation may change, but the following endpoints provide a clean MVP boundary.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/patients` | Create a pseudonymous patient profile. |
| `GET` | `/api/patients` | List demo patients. |
| `GET` | `/api/patients/{patient_id}` | Retrieve a patient profile. |
| `POST` | `/api/assessments` | Create an assessment record and attach test metadata. |
| `POST` | `/api/assessments/{assessment_id}/pupil-video` | Upload pupil-response recording. |
| `POST` | `/api/assessments/{assessment_id}/pursuit-video` | Upload smooth-pursuit recording. |
| `POST` | `/api/assessments/{assessment_id}/analyze` | Run quality checks, CV, feature extraction, and configured model analysis. |
| `GET` | `/api/assessments/{assessment_id}` | Retrieve assessment status and result. |
| `GET` | `/api/patients/{patient_id}/history` | Retrieve accepted assessments for longitudinal display. |
| `POST` | `/api/assessments/{assessment_id}/compare` | Compare an assessment with the selected baseline/prior visit. |
| `GET` | `/api/health` | Backend health check. |

### 17.1 Example analysis response

```json
{
  "assessment_id": "demo-assessment-002",
  "patient_id": "demo-patient-001",
  "quality": {
    "status": "acceptable",
    "usable_frame_ratio": 0.94,
    "warnings": []
  },
  "pupil_features": {
    "baseline_diameter": null,
    "minimum_diameter": null,
    "response_latency_seconds": null,
    "constriction_velocity": null,
    "units": "documented per feature"
  },
  "pursuit_features": {
    "mean_tracking_error": null,
    "tracking_continuity": null
  },
  "temporal_model": {
    "model_name": "ocutrack-tcn-experimental",
    "model_version": "0.1.0",
    "status": "not_configured_or_experimental",
    "output": null
  },
  "longitudinal_comparison": {
    "baseline_assessment_id": "demo-assessment-001",
    "comparable": true,
    "changed_features": []
  },
  "review_message": "Change analysis is a screening-support prototype and is not a diagnosis."
}
```

The null values above are placeholders to show response structure. They must be replaced with computed values only when the measurement pipeline supports them. Do not fabricate values.

---

## 18. Suggested database schema

The schema below is a starting point for Supabase PostgreSQL. Use UUIDs in the actual database and avoid storing direct identifiers unless necessary.

### 18.1 `patients`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Internal patient identifier. |
| `pseudonymous_code` | TEXT, unique | Display code such as `OT-0001`. |
| `age_band` | TEXT, nullable | Optional age band rather than exact date of birth. |
| `context_notes` | TEXT, nullable | Minimal non-identifying context. |
| `created_at` | TIMESTAMPTZ | Record creation time. |

### 18.2 `consents`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Consent record ID. |
| `patient_id` | UUID, foreign key | Related patient. |
| `consent_status` | TEXT | `granted`, `withdrawn`, or `not_recorded`. |
| `purpose` | TEXT | Demo, technical testing, or other stated purpose. |
| `recorded_at` | TIMESTAMPTZ | Consent timestamp. |

### 18.3 `assessments`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Assessment ID. |
| `patient_id` | UUID, foreign key | Related patient. |
| `assessment_at` | TIMESTAMPTZ | Assessment date/time. |
| `protocol_version` | TEXT | Version of the test procedure. |
| `device_metadata` | JSONB | Available camera/browser details. |
| `lighting_metadata` | JSONB | Illumination method and conditions. |
| `quality_status` | TEXT | `acceptable`, `insufficient`, or `pending`. |
| `is_baseline` | BOOLEAN | Whether this is the selected baseline. |
| `created_at` | TIMESTAMPTZ | Record creation time. |

### 18.4 `measurements`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Measurement ID. |
| `assessment_id` | UUID, foreign key | Related assessment. |
| `test_type` | TEXT | `pupil_reflex` or `smooth_pursuit`. |
| `feature_name` | TEXT | Feature identifier. |
| `feature_value` | DOUBLE PRECISION | Computed value. |
| `unit` | TEXT | Unit or normalization method. |
| `series_data` | JSONB, nullable | Time-series values when needed. |
| `created_at` | TIMESTAMPTZ | Creation time. |

### 18.5 `model_runs`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Model-run ID. |
| `assessment_id` | UUID, foreign key | Related assessment. |
| `model_name` | TEXT | Model identifier. |
| `model_version` | TEXT | Version or commit reference. |
| `input_schema_version` | TEXT | Feature schema version. |
| `output` | JSONB | Non-diagnostic model output. |
| `evaluation_context` | JSONB | Experimental status and relevant notes. |
| `created_at` | TIMESTAMPTZ | Run timestamp. |

### 18.6 `comparisons`

| Field | Type | Description |
|---|---|---|
| `id` | UUID, primary key | Comparison ID. |
| `patient_id` | UUID, foreign key | Related patient. |
| `current_assessment_id` | UUID, foreign key | Current visit. |
| `baseline_assessment_id` | UUID, foreign key | Comparison visit. |
| `comparable` | BOOLEAN | Whether the protocol/quality allows comparison. |
| `feature_deltas` | JSONB | Absolute and relative feature changes. |
| `review_message` | TEXT | Neutral summary. |
| `created_at` | TIMESTAMPTZ | Comparison timestamp. |

### 18.7 Database security

- Enable RLS on tables exposed through Supabase APIs.
- Restrict patient and assessment records to authorized demo users.
- Never expose the Supabase service-role key in frontend code.
- Use environment secrets for backend credentials.
- Keep access policies simple and test them before the demo.
- Use pseudonymous IDs and minimum necessary data.

---

## 19. Non-functional requirements

### 19.1 Performance

- The UI should remain responsive during upload and processing.
- Long-running video analysis must show progress and handle timeouts.
- The MVP should process short recordings within a practical demo window on the selected deployment hardware; actual latency must be measured and reported.
- Video size and duration must be limited to protect the backend.

### 19.2 Reliability

- Handle camera permission denial, missing cameras, unsupported formats, interrupted uploads, corrupt videos, and backend errors.
- A failed analysis must be visible and recoverable.
- Every output must be associated with the correct patient and assessment ID.

### 19.3 Compatibility

- Prioritize recent Chrome or Chromium-based browsers on desktop for the hackathon demo.
- Support other browsers only after testing.
- A compatible smartphone browser may be used, but the MVP is not a native mobile app and torch support is not guaranteed.

### 19.4 Security and privacy

- Use HTTPS for deployed services.
- Collect only the information needed for the demonstration.
- Use pseudonymous patient IDs.
- Obtain consent before recording.
- Avoid retaining raw videos by default.
- Restrict database access and keep secrets server-side.
- Provide a way to delete demo patient data.
- Do not use real patient health data without appropriate approval, consent, and safeguards.

### 19.5 Accessibility and usability

- Instructions should use simple language.
- Camera status and test progress should be visible.
- Important controls should be keyboard accessible.
- Charts should include readable labels and textual summaries.
- Color must not be the only way to communicate quality or status.

---

## 20. Risks, constraints, and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No suitable labelled medical dataset | TCN cannot be credibly trained for clinical abnormality detection. | Build a strong CV and longitudinal measurement demo; keep TCN experimental or use only an appropriate labelled task. Never invent clinical labels. |
| MediaPipe landmarks are not precise pupil segmentation | Pupil diameter estimates may be noisy. | Use MediaPipe for localization and a separate OpenCV segmentation step; validate against manual annotations. |
| Webcam resolution or frame rate is inadequate | Reflex timing and eye tracking may be inaccurate. | Establish minimum recording requirements, show quality warnings, and test supported devices. |
| Front camera and flash cannot operate simultaneously | Original flashlight workflow may fail on some devices. | Make browser torch optional; use controlled lighting and document the setup. |
| Lighting differs between visits | Apparent changes may be caused by capture conditions. | Record illumination metadata, standardize protocol, and block or warn on non-comparable sessions. |
| Camera exposure changes automatically | Pupil and image measurements may drift. | Lock exposure/focus where supported or detect and disclose changes; include device-specific limitations. |
| Eye movement features are confounded by head movement | Tracking output may be misleading. | Track face/head pose where possible and reject recordings with excessive movement. |
| Small or biased sample | Poor generalizability. | Report sample composition and limitations; split by participant; avoid broad claims. |
| Demo data mistaken for clinical evidence | Judges/users may misunderstand the result. | Label synthetic data and illustrative numbers prominently; show a disclaimer on reports. |
| Sensitive video exposure | Privacy harm. | Process temporarily, delete by default, restrict access, and avoid identifiable data where possible. |
| Supabase or hosting connectivity issue | Demo may fail. | Prepare local database/sample-data fallback and a recorded demo path; do not claim live functionality when offline. |

---

## 21. Hackathon implementation plan

The order below prioritizes a functioning end-to-end demonstration over infrastructure complexity.

### Phase 1 — Foundation and UI

- Create repository and project structure.
- Set up React + Vite + TypeScript.
- Add Tailwind CSS and shadcn/ui.
- Build patient list, patient profile, assessment flow, and report layout using clearly labelled sample data.
- Create FastAPI project and health endpoint.
- Configure Supabase PostgreSQL and initial schema.

**Exit condition:** A user can navigate the full interface using sample data.

### Phase 2 — Camera capture and recording quality

- Implement browser camera permission and live preview.
- Implement pupil-test recording flow.
- Implement moving-target smooth-pursuit flow.
- Add duration, frame-count, and video-integrity checks.
- Document and test the controlled lighting protocol.

**Exit condition:** The browser reliably records and uploads test videos on the target demo device.

### Phase 3 — Computer vision and feature extraction

- Build video decoding and frame sampling.
- Add MediaPipe eye localization.
- Add OpenCV pupil-region processing.
- Generate pupil time-series and pupil features.
- Generate eye-position and target-tracking time-series.
- Add annotated-frame and plot debugging tools.
- Evaluate against manual annotations where possible.

**Exit condition:** A recording produces visible, inspectable measurements and quality status.

### Phase 4 — ML and longitudinal comparison

- Implement transparent baseline calculations.
- Prepare and document any suitable labelled dataset.
- Train/evaluate TCN only if data supports a defined task.
- Compare current measurements with a patient's baseline.
- Add comparability checks and neutral change messages.

**Exit condition:** The demo shows a baseline visit and a later visit, with measured changes and honest method labels.

### Phase 5 — Integration and demo hardening

- Connect frontend, FastAPI, and Supabase.
- Add loading, error, and retry states.
- Add model version and evaluation information.
- Test the same demo sequence repeatedly.
- Prepare a clean sample patient journey and a fallback recording.
- Document limitations and evaluation results.

**Exit condition:** The end-to-end hackathon demonstration works reliably and does not overstate medical capability.

---

## 22. Suggested repository structure

```text
ocutrack/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── patients/
│   │   │   ├── pupil-test/
│   │   │   ├── pursuit-test/
│   │   │   ├── assessments/
│   │   │   └── history/
│   │   ├── services/
│   │   ├── types/
│   │   └── lib/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── cv/
│   │   │   ├── face_localization.py
│   │   │   ├── pupil_segmentation.py
│   │   │   ├── pupil_features.py
│   │   │   └── pursuit_tracking.py
│   │   ├── ml/
│   │   │   ├── tcn.py
│   │   │   ├── inference.py
│   │   │   └── evaluation.py
│   │   ├── longitudinal/
│   │   │   └── comparison.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── ml-experiments/
│   ├── notebooks/
│   ├── configs/
│   ├── reports/
│   └── README.md
├── database/
│   └── schema.sql
├── docs/
│   ├── data-dictionary.md
│   ├── test-protocol.md
│   ├── model-card.md
│   └── evaluation.md
├── .env.example
└── README.md
```

This is a suggested structure, not a requirement to create every folder before the core workflow works.

---

## 23. Demo script for judges

The demo should tell one coherent story rather than showing disconnected screens.

1. Introduce the rural-care measurement and monitoring problem.
2. Explain that OcuTrack is a browser-based prototype, not a native app or diagnostic device.
3. Create or select the sample patient **Rahul** using a pseudonymous ID.
4. Show the camera preview and explain the controlled-lighting procedure.
5. Capture or load the pupil-response recording.
6. Show the eye-localization overlay and pupil-size time-series.
7. Run the smooth-pursuit test and show target-versus-eye tracking.
8. Show the extracted features and recording-quality status.
9. Open Rahul's first visit and mark it as the baseline.
10. Open a second clearly labelled sample/consented assessment.
11. Compare the measurements and highlight the feature-level changes.
12. Show the neutral result: **“Change detected — consider repeat measurement and clinical review.”**
13. Explain what the TCN analyses, what the longitudinal component does, how it was evaluated, and what remains unvalidated.
14. Close with limitations, data privacy, and the potential role of the workflow in supporting—not replacing—clinical judgment.

If the live camera or torch fails during judging, use a prepared recording and clearly state that it is a fallback demonstration input. Do not present a prerecorded or synthetic result as live analysis.

---

## 24. Open questions and decisions to validate

These are deliberate research and engineering questions, not assumptions that should be hidden:

1. Which public datasets, if any, are suitable for pupil light-reflex and smooth-pursuit measurement under conditions comparable to ordinary cameras?
2. Can the selected webcam/mobile browser reliably capture enough frames for the intended timing features?
3. What illumination protocol is safe, reproducible, and feasible for the prototype?
4. Can pupil diameter be calibrated to physical units, or should the MVP report normalized/pixel-based values?
5. Which pupil and eye-movement features are sufficiently repeatable across sessions?
6. What is the smallest useful set of features for the first TCN experiment?
7. Is a TCN justified by the available data, or does a simpler baseline perform as well or better?
8. What feature-change thresholds are defensible for a technical demonstration, and how will they be labelled as experimental rather than clinical?
9. What retention and access policies are required for any recordings collected from volunteers?

---

## 25. Final product definition

OcuTrack is a **browser-based, hackathon-focused ocular measurement and longitudinal monitoring prototype**. It captures pupil-response and smooth-pursuit videos, uses MediaPipe and OpenCV to estimate eye-related measurements, applies time-series analysis and an experimental TCN where data permits, compares measurements across visits, and presents transparent findings in a clinician-facing web dashboard.

Its value proposition is not that it diagnoses a neurological disease. Its value proposition is that it explores whether low-cost, repeatable ocular measurements and personal-baseline comparisons can help healthcare workers notice changes and decide when further clinical assessment may be appropriate.

**The success of the hackathon project depends on demonstrating a reliable measurement pipeline, an honest evaluation, and a useful longitudinal workflow—not on claiming disease detection that the available evidence cannot support.**

---

## 26. Reference technology documentation

Use the official documentation during implementation and verify compatibility against the specific browser/device used for the demo:

- React: https://react.dev/
- Vite: https://vite.dev/guide/
- TypeScript: https://www.typescriptlang.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
- Recharts: https://recharts.org/en-US/guide
- MediaDevices API: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MediaPipe Face Landmarker: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
- OpenCV: https://docs.opencv.org/
- FastAPI: https://fastapi.tiangolo.com/
- PyTorch: https://pytorch.org/docs/stable/index.html
- Scikit-learn: https://scikit-learn.org/stable/user_guide.html
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs

