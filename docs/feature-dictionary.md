# OcuTrack — Feature Dictionary & Physiological Signal Specifications

**Author:** Aditya (Computer Vision & ML Workstream)  
**Parent Specification:** `adityaImplementation.md` (Sections 9, 10, 17)  
**Status:** Phase 3 Complete  
**Last Updated:** November 2026  

---

## 1. Overview and Core Measurement Constraints

The OcuTrack Python analysis engine processes two types of ocular videos:
1. **Pupil-Response Recordings:** Measures pupil constriction and redilation dynamics in response to a light stimulus.
2. **Smooth-Pursuit Recordings:** Estimates eye displacement while tracking an animated target on a screen and compares the eye trajectory to target kinematics.

### Critical Safety & Scientific Constraints
- **Units:** All pupil measurements are reported strictly in **pixels (`px_or_normalized`)** or **normalized screen units** unless a validated physical calibration instrument is available. Pixels are **never** labeled as millimetres.
- **Stimulus Synchronization:** Latency is reported as `null` with a warning unless a reliable, hardware-synced `stimulus_onset_ms` timestamp is provided in test metadata.
- **Target Trajectory Dependency:** Smooth-pursuit tracking error and corrective saccade counts require explicit target trajectory metadata (`trajectory` list with `t_ms`, `x`, `y`). If missing, tracking error returns `null`.
- **Non-Diagnostic:** Measurements are non-specific physiological signals and are never reported as diagnostic of any neurological disorder (Parkinson's, concussion, diabetic neuropathy).

---

## 2. Pupil-Response Features

| Feature Key | Label | Unit | Calculation Formula / Method | Conditions & Edge Cases |
|---|---|---|---|---|
| `baseline_diameter` | Baseline pupil size | `px_or_normalized` | Median pupil diameter of valid frames during pre-stimulus interval ($t \le t_{\text{stimulus}}$) | Requires at least 3 valid pre-stimulus frames; falls back to initial 20% window if stimulus timing is absent. |
| `minimum_diameter` | Minimum pupil size | `px_or_normalized` | Minimum pupil diameter of 3-point temporally smoothed series within post-stimulus response window | Requires at least 3 valid post-stimulus frames. Temporal smoothing prevents false single-frame constriction spikes. |
| `constriction_amplitude` | Constriction amplitude | `px_or_normalized` | $\max(0.0, \text{baseline\_diameter} - \text{minimum\_diameter})$ | Returns `null` if either baseline or minimum diameter cannot be computed. Returns `0.0` if no constriction occurs. |
| `response_latency_seconds` | Pupil response latency | `s` | $\frac{t_{\text{onset}} - t_{\text{stimulus}}}{1000.0}$ where $t_{\text{onset}}$ is the first timestamp where diameter drops by $\ge 10\%$ of constriction amplitude | **Strictly null** if `stimulus_onset_ms` is missing or constriction amplitude $\le 0.5\text{ px}$. Issues warning if latency falls outside 0.15s - 0.60s. |
| `constriction_velocity` | Constriction velocity | `px_or_normalized per second` | Peak rate of pupil constriction: $\max(-\frac{d(t_i) - d(t_{i-1})}{(t_i - t_{i-1})/1000})$ over the contraction window | Timestamp-aware numerical derivative. Skips intervals across gaps $> 250\text{ ms}$ or dropped frames. |

### Series Representation (`pupil.series`)
Each point in the time-series contains:
```json
{
  "t_ms": 120,
  "diameter": 28.45,
  "valid": true
}
```

---

## 3. Smooth-Pursuit Features

| Feature Key | Label | Unit | Calculation Formula / Method | Conditions & Edge Cases |
|---|---|---|---|---|
| `mean_tracking_error` | Mean tracking error | `normalized_screen_units` | $\frac{1}{N} \sum_{i=1}^N \sqrt{(eye\_x_i - target\_x_i)^2 + (eye\_y_i - target\_y_i)^2}$ | Evaluated only on frames where both eye tracking and target position are valid. Returns `null` if target trajectory is missing. |
| `tracking_continuity` | Tracking continuity | `ratio` | $\frac{N_{\text{valid\_frames}}}{N_{\text{total\_frames}}}$ | Fraction of sampled video frames where eye position was successfully localized and tracked. |
| `corrective_movement_count` | Corrective movement candidates | `count` | Count of rapid saccadic repositioning episodes where eye velocity exceeds $2.0\text{ units/s}$ over $\Delta t \le 200\text{ ms}$ | Contiguous high-velocity frames are clustered into single movement candidates. Labeled as candidates, not pathological saccades. |

### Series Representation (`pursuit.series`)
Each point in the pursuit time-series contains:
```json
{
  "t_ms": 150,
  "eye_x": 0.4821,
  "eye_y": 0.5102,
  "target_x": 0.5000,
  "target_y": 0.5000,
  "tracking_error": 0.0206,
  "valid": true
}
```

---

## 4. Metadata Contract

### Pupil Metadata (`pupil_metadata`)
```json
{
  "stimulus_onset_ms": 500,
  "preferred_eye": "auto",
  "baseline_duration_ms": 500
}
```

### Pursuit Metadata (`pursuit_metadata`)
```json
{
  "preferred_eye": "auto",
  "trajectory": [
    {"t_ms": 0, "x": 0.1, "y": 0.5},
    {"t_ms": 500, "x": 0.3, "y": 0.5},
    {"t_ms": 1000, "x": 0.5, "y": 0.5},
    {"t_ms": 1500, "x": 0.7, "y": 0.5},
    {"t_ms": 2000, "x": 0.9, "y": 0.5}
  ]
}
```

---

## 5. Signal Processing Rules

1. **Temporal Filtering:** Moving median filters remove transient specular reflections or single-frame segmentation failures without phase distortion.
2. **Derivative Calculation:** All derivatives $\frac{\Delta y}{\Delta t}$ use exact millisecond timestamps from frames rather than assuming constant framerate.
3. **Gap Handling:** If frame drop or tracking loss creates a gap greater than $250\text{ ms}$, derivative calculation is suppressed across the gap.
4. **Coordinate Normalization:** Eye coordinates are mapped to normalized screen units $[0.0, 1.0]$ relative to the frame dimensions:
   $$eye\_x = \frac{\text{pixel\_x}}{\text{frame\_width}}, \quad eye\_y = \frac{\text{pixel\_y}}{\text{frame\_height}}$$
5. **Head Pose Validation:** Head yaw or pitch exceeding $30^\circ$ triggers quality warnings and marks affected intervals as invalid to prevent spurious gaze errors.
