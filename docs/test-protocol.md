# OcuTrack — Test Protocol, Sensor Synchronization & Backend Handoff

**Author:** Aditya (Computer Vision & ML Workstream)  
**Target Audience:** Parth (FastAPI Backend), Sakar (Frontend / UI), Engineering Reviewers  
**Specification:** `adityaImplementation.md` (Sections 2, 5, 11, 17 Phase 5)  
**Status:** Approved Integration Handoff  

---

## 1. Protocol Specifications

OcuTrack supports two distinct recording procedures captured through standard smartphone or laptop webcams.

### 1.1 Pupil-Response Recording (`pupil`)
- **Objective:** Track apparent pupil diameter changes in response to an on-screen or flashlight stimulus.
- **Protocol Timing:**
  - Baseline Phase: Initial 500ms – 1000ms prior to stimulus onset (ambient room light).
  - Stimulus Onset: Light flash or bright screen transition. The frontend must record the exact millisecond timestamp `stimulus_onset_ms` relative to recording start.
  - Constriction & Recovery Phase: 2.0s – 5.0s recording duration following stimulus.
- **Environmental Constraints:**
  - Fixed distance (~30cm – 45cm from camera).
  - Steady head position.
  - Minimum illumination to distinguish pupil from iris.

### 1.2 Smooth-Pursuit Recording (`pursuit`)
- **Objective:** Track ocular displacement while the user follows an animated moving dot on the screen.
- **Protocol Timing:**
  - Duration: Typically 3.0s – 10.0s.
  - Target Path: Moving visual target across horizontal/vertical axes.
  - Trajectory Metadata: Chronological list of timestamped target coordinates normalized to $[0.0, 1.0]$.

---

## 2. Input Metadata Contracts

### 2.1 Pupil Metadata Dictionary (`pupil_metadata`)
```json
{
  "stimulus_onset_ms": 1000,
  "preferred_eye": "auto",
  "baseline_duration_ms": 1000,
  "test_protocol_version": "1.0"
}
```
*Note:* If `stimulus_onset_ms` is omitted or `null`, `response_latency_seconds` will return `null` with a warning, while baseline and minimum diameter will still be computed.

### 2.2 Pursuit Metadata Dictionary (`pursuit_metadata`)
```json
{
  "preferred_eye": "auto",
  "trajectory": [
    {"t_ms": 0, "x": 0.10, "y": 0.50},
    {"t_ms": 500, "x": 0.30, "y": 0.50},
    {"t_ms": 1000, "x": 0.50, "y": 0.50},
    {"t_ms": 1500, "x": 0.70, "y": 0.50},
    {"t_ms": 2000, "x": 0.90, "y": 0.50}
  ]
}
```
*Note:* If `trajectory` is missing or contains fewer than 2 points, `mean_tracking_error` will return `null` with a warning.

---

## 3. Backend Integration Guide (for Parth)

Parth's FastAPI application can import and invoke the engine without copying any computer-vision or machine-learning code.

### 3.1 Python Package Call
```python
from pathlib import Path
from analysis import analyze_assessment

# In a FastAPI background task or upload route:
result = analyze_assessment(
    pupil_video_path=Path("/tmp/assessment_123_pupil.webm"),
    pursuit_video_path=Path("/tmp/assessment_123_pursuit.webm"),
    pupil_metadata={"stimulus_onset_ms": 800},
    pursuit_metadata={"trajectory": target_points},
)
```

### 3.2 Output Schema Contract
The returned object is a plain Python dictionary guaranteed to be **100% JSON-serializable** (all NumPy types, NaNs, infinities, and enums are converted to native primitives).

```json
{
  "pipeline_version": "0.1.0",
  "quality": {
    "status": "acceptable",
    "usable_frame_ratio": 0.98,
    "warnings": [],
    "details": {
      "pupil": {"duration_seconds": 3.0, "fps": 30.0, "valid_pupil_frames": 88},
      "pursuit": {"duration_seconds": 3.0, "fps": 30.0, "valid_pursuit_frames": 86}
    }
  },
  "pupil": {
    "status": "complete",
    "features": {
      "baseline_diameter": {"value": 28.50, "unit": "px_or_normalized", "label": "Baseline pupil size"},
      "minimum_diameter": {"value": 16.20, "unit": "px_or_normalized", "label": "Minimum pupil size"},
      "constriction_amplitude": {"value": 12.30, "unit": "px_or_normalized", "label": "Constriction amplitude"},
      "response_latency_seconds": {"value": 0.233, "unit": "s", "label": "Pupil response latency"},
      "constriction_velocity": {"value": 45.10, "unit": "px_or_normalized per second", "label": "Constriction velocity"}
    },
    "series": [
      {"t_ms": 0, "diameter": 28.5, "valid": true}
    ]
  },
  "pursuit": {
    "status": "complete",
    "features": {
      "mean_tracking_error": {"value": 0.0412, "unit": "normalized_screen_units", "label": "Mean tracking error"},
      "tracking_continuity": {"value": 0.9556, "unit": "ratio", "label": "Tracking continuity"},
      "corrective_movement_count": {"value": 2, "unit": "count", "label": "Corrective movement candidates"}
    },
    "series": [
      {"t_ms": 0, "eye_x": 0.11, "eye_y": 0.50, "target_x": 0.10, "target_y": 0.50, "tracking_error": 0.01, "valid": true}
    ]
  },
  "temporal_model": {
    "status": "not_configured",
    "model_name": "ocutrack-tcn-experimental",
    "model_version": null,
    "output": null,
    "notes": [
      "Temporal TCN model is not configured for production clinical use.",
      "No disease probability or diagnostic claim is produced."
    ]
  },
  "warnings": []
}
```

### 3.3 Temporary File Cleanup
The analysis engine reads the files from disk and releases all video capture handles immediately upon completion of `analyze_assessment()`. Parth's orchestration layer is responsible for removing temporary files from `/tmp` following database persistence.
