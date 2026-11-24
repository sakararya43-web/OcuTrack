# OcuTrack — Simplified Project & Technical Explanation

A comprehensive, plain-English reference guide explaining what OcuTrack is, how it works, how the underlying technology operates, and how datasets and privacy are handled.

---

## 1. The 10-Second Summary

**OcuTrack is a digital eye-reflex screening tool that runs directly in a laptop web browser.**

Instead of requiring an expensive **$25,000 hospital infrared eye scanner**, a community health worker simply opens OcuTrack in Google Chrome or another modern browser. The laptop webcam records two quick eye tests, measures how fast and smoothly the patient's eyes react down to the millisecond, and answers the central clinical question:

> **"Are this person's eye reflexes changing or slowing down compared to their own previous clinic visits?"**

---

## 2. Step-by-Step: What the Patient Actually Does

The entire assessment takes under 30 seconds and consists of two non-invasive tests:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Test 1: The Light Flash (Pupil Light Reflex)                                 │
│ [ Screen is dark ... then FLASHES white for 1 second! ]                      │
│ ➔ The webcam observes: How quickly and sharply does the black pupil shrink?  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Test 2: Follow the Dot (Smooth Pursuit Test)                                 │
│ [ A smooth green dot sweeps horizontally across the screen (Left <───> Right)]│
│ ➔ The webcam observes: Do the eyes track smoothly, or do they lag & jerk?   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. What the Computer Does Behind the Scenes

Once the recordings stop, the software executes three automated actions:

1. **Finds the Eye:** Using Google MediaPipe (face-tracking software), the computer pinpoints the precise boundaries of the iris and pupil in every single video frame (30 times per second).
2. **Measures Speed & Smoothness (The Math):**
   * **Reaction Delay (Latency):** Exactly how many milliseconds elapse before the pupil starts shrinking after the white screen flash?
   * **Shrink Speed (Velocity):** How fast does the pupil squeeze down in millimeters per second?
   * **Tracking Smoothness (Gain & Error):** Does the eye stay locked onto the moving target, or does it lag behind and make jerky catch-up jumps?
3. **Deletes the Video ("Burn After Reading"):** To safeguard patient privacy, **the raw video recording is permanently deleted from disk** immediately after landmark coordinates are extracted. Only the numerical measurements (e.g., `245 ms`) and time-series curves are saved.

---

## 4. The Core Differentiator: Comparing You to *Yourself*

Normal, healthy people exhibit wide natural differences in ocular reflexes:
* **Person A's** pupils might naturally react in **220 milliseconds**.
* **Person B's** pupils might naturally react in **270 milliseconds** and be completely healthy.

Because of this baseline variation, a single one-off measurement rarely tells a clinician whether something is wrong.

### OcuTrack's Longitudinal Delta Engine ($\Delta$)

OcuTrack focuses on **intra-individual longitudinal changes**:
* **Visit 1 (October):** OcuTrack establishes your baseline (e.g., pupil constriction latency is `245 ms`, tracking gain is `0.95`).
* **Visit 2 (November):** OcuTrack tests you again under identical protocol conditions. If your pupil response has slowed to `268 ms` (a $23\text{ ms}$ delay) and your tracking gain has dropped to `0.84`, OcuTrack flags this objective shift:
  > *"Noticeable variation detected in constriction latency (+23 ms) and pursuit gain (-0.11) compared with baseline on 2026-10-15. Recommend repeating measurement and arranging clinical review."*

---

## 5. What the Healthcare Worker Sees on Screen

At the end of testing, the console presents a transparent, non-diagnostic report:
1. **Pupil Constriction Curve:** A time-series chart showing pupil diameter over time, marking the exact millisecond of stimulus onset and minimum constriction diameter.
2. **Smooth Pursuit Gaze Plot:** A dual-line chart comparing the true position of the moving target dot against the patient's actual eye position.
3. **Longitudinal Trajectory Chart:** A multi-visit timeline tracking parameter deltas across visits with personal baseline confidence bands.
4. **Recording Quality Badges:** Status indicators confirming whether lighting, frame rate ($\ge 25\text{ FPS}$), and duration met scientific standards.

---

## 6. The Technical Architecture in Simple Terms

```
[ FRONTEND (Sakar) ]            [ BACKEND (Parth) ]             [ ANALYSIS (Aditya) ]
React 18 + TypeScript          FastAPI + SQLite/Postgres       MediaPipe + OpenCV + TCN
  │                              │                               │
  ├─ useCamera / MediaRecorder   ├─ Ephemeral disk storage       ├─ 478 Landmark FaceMesh
  ├─ Pre-upload Quality Gate     ├─ Longitudinal Delta Engine    ├─ 11.7mm Iris Ruler
  └─ Stimulus Timestamp Sync     └─ Pseudonymous DB records      └─ Biometric Kinematics
```

### 1. The Browser & Camera (Frontend Engineering)
* **Zero-Install Web App:** Uses browser-native APIs (`navigator.mediaDevices` and `MediaRecorder`) to stream and record 720p video at 30 frames per second without requiring software downloads or mobile app store installations.
* **The "Bouncer" (`useRecordingQuality`):** Before allowing heavy video uploads over clinic internet, a lightweight client-side script verifies that frame rate ($\ge 25\text{ FPS}$), duration, and ambient lighting are sufficient. If not, the test is rejected locally before wasting bandwidth.
* **Millisecond Stimulus Stopwatch:** When the screen flashes white, the frontend logs the CPU timestamp (e.g., $t = 5002\text{ ms}$). This metadata is bundled with the video so the analysis engine counts reaction latency from the true instant light hit the eye.

### 2. Computer Vision (MediaPipe & OpenCV)
* **478 Landmark Dots:** MediaPipe FaceMesh tracks 468 facial points plus 10 dedicated iris boundary coordinates (points 468 to 477) wrap-around the circular edge of the colored ring.
* **The "Built-in Human Ruler" (Pixel-to-Millimeter Normalization):**
  * *The problem:* If a pupil is 40 pixels wide on a webcam, is that large or small? If the patient moves closer to the camera, the pixel count increases!
  * *The biological solution:* The adult human iris is universally approximately **$11.7\text{ mm}$** wide across populations.
  * *The formula:* If the computer measures the iris at 117 pixels on the camera, it computes:
    $$\text{Scale Factor} = \frac{11.7\text{ mm}}{117\text{ px}} = 0.1\text{ mm per pixel}$$
    Every pixel measurement is now converted into absolute physical millimeters, regardless of how close the patient sits to the lens.

### 3. Biometric Kinematics (What the Measurements Mean)

| Parameter | Plain-English Meaning | Healthy Reference Range |
| :--- | :--- | :--- |
| **Constriction Latency** | **Reflex Delay:** The time between the light flash and the first mechanical constriction of the pupil. Reflects optic nerve and brainstem transmission speed. | $\approx 220 - 260\text{ ms}$ |
| **Constriction Velocity** | **Shrinking Speed:** Peak speed of pupil constriction once movement initiates. | $\approx 4.0 - 5.5\text{ mm/s}$ |
| **Tracking Gain** | **Speed Matching:** The ratio $\frac{\text{Eye Velocity}}{\text{Target Velocity}}$ when following the smooth target. A value of $1.0$ indicates perfect tracking. | $\approx 0.90 - 1.00$ |
| **Catch-up Saccades** | **Stutter Jumps:** Jerky corrective micro-jumps when the eye loses tracking velocity and has to leap forward to re-acquire the target dot. | $0 - 2\text{ occurrences}$ |

### 4. Machine Learning (Temporal Convolutional Network — TCN)
* **Why Time Matters:** Standard neural networks evaluate single static images. Eye dynamics are a sequential time-series movie.
* **Causal Dilated Convolutions:** The TCN uses causal filters that process eye motion frame-by-frame. "Causal" ensures the algorithm is mathematically prohibited from "peeking ahead" into future frames.
* **Scientific Honesty & Data Gating:** The TCN is evaluated on synthetic test sequences (`analysis/ml/dataset.py`) to verify zero data leakage and stable architecture. Because large-scale, clinically labelled hospital webcam datasets do not exist publicly, OcuTrack flags TCN output as **experimental research data** rather than fabricating diagnostic claims.

### 5. Backend & Data Privacy (FastAPI & Database)
* **"Burn After Reading" Retention:** Raw participant facial videos are processed in private scratch directories and deleted immediately after analysis.
* **Pseudonymous Identifiers:** Patients are identified solely by randomized tokens (e.g., `OT-DEMO-001`). No national identity numbers, unmasked phone numbers, or clear-text names are stored in the database.
* **Delta Thresholds:** If follow-up tests deviate past established variance bounds (e.g., latency shift $> 15\text{ ms}$ or gain reduction $> 0.05$), the system issues a neutral recommendation for clinician re-evaluation.

---

## 7. The Dataset Strategy in Simple Terms

### *"Did you train this on 50,000 hospital patient videos?"*
**The honest answer is: No.**

Hospital clinical datasets for eye reflexes exist almost exclusively on **$25,000 specialized infrared pupillometers (e.g., NeurOptics)** in controlled darkrooms. There is no legitimate public hospital dataset of patients performing eye tests on standard laptop webcams with clinical disease labels.

OcuTrack relies on **three clear, honest tiers of data**:

1. **The Live Human (Real Data):** When an individual sits at the laptop, the webcam tracks their live ocular reflexes in real time. The algorithm behaves like a physical measuring tool (like a caliper or stopwatch) that measures physical movement without needing prior training on that specific face.
2. **The "Crash Test Dummy" (Synthetic Benchmark Data):** An off-screen canvas generator in `SampleVideoFallback.tsx` and pre-computed records in `seed_demo.sql`. This allows presentation and verification of the entire software pipeline even when live cameras or clinic lighting fail.
3. **The Practice Math Curves (TCN Validation Fixture):** Mathematically generated curves in `analysis/ml/dataset.py` used to test gradient descent, causal convolutions, and `GroupKFold` participant splitting without medical fabrication.

### The Measuring Tape Analogy
A physical measuring tape does not need to be trained on 10,000 people to tell you how tall someone is. It simply needs to measure millimeters accurately. If someone was **$175\text{ cm}$** tall last month and is **$170\text{ cm}$** tall today, the tape flags that a $5\text{ cm}$ loss occurred. That is how OcuTrack functions: **accurate measurement, baseline comparison, and change tracking.**

---

## 8. Summary of Feature Evaluation Decisions

| Feature | Verdict | Rationale |
| :--- | :--- | :--- |
| **AI ChatBot Guide** | ❌ **Rejected** | Chatbots in diagnostic software invite hallucinations and medical liability, and violate PRD Section 6. Replaced with deterministic audio/visual step-by-step guidance. |
| **Regional Languages** | ✅ **High Priority** | Essential for rural health equity (ASHA/ANM workers). Clear patient instructions directly prevent blinks and head motion, improving video quality. |
| **Health Tracker Graph** | ⚖️ **Refined** | Reject generic fitness/lifestyle metrics (steps, heart rate). Retain and enhance the core **Longitudinal Ocular Biometrics Trajectory**. |
| **Low Internet Mode** | 🏆 **High Priority** | Solves rural bandwidth bottlenecks via client-side video quality pre-screening, IndexedDB offline queuing, and deferred synchronization. |
| **Account Login & Security** | 🔒 **Essential** | Implemented as a lightweight role-based healthcare worker login with pseudonymous patient IDs, explicit consent logging, and ephemeral video destruction. |
