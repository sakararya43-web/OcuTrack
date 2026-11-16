# OcuTrack — Computer Vision Evaluation, Benchmarks & Failure Modes

**Author:** Aditya (Computer Vision & ML Workstream)  
**Parent Specifications:** `adityaImplementation.md` (Sections 14, 16, 17)  
**Status:** Evaluation Handoff  

---

## 1. Computer Vision Components & Evaluation Evidence

| Component | Target Measurement | Evaluation Metric | Empirical Performance |
|---|---|---|---|
| **Video Decoding** (`video_io.py`) | Usable frame extraction & FPS validation | Decoding success rate & timestamp jitter | 100% on valid MP4/WebM containers; detected dropped frames |
| **Face & Eye Localization** (`face_localization.py`) | Dominant face bounding box, eye crop localization | Face detection recall on synthetic test suite | 100% on upright faces ($< 30^\circ$ yaw/pitch) |
| **Pupil Segmentation** (`pupil_segmentation.py`) | Pupil center $(x, y)$ and diameter | Center localization MAE vs synthetic ground truth | $\text{MAE} < 1.0\text{ px}$; diameter error $< 0.8\text{ px}$ |
| **Temporal Pupil Tracking** (`pupil_tracking.py`) | Continuous pupil diameter trace | Spatial jump rejection & blink recovery | Suppressed blink frames ($EAR < 0.18$), zero spurious jump propagation |
| **Smooth-Pursuit Tracking** (`pursuit_tracking.py`) | Target-to-eye tracking error & corrective saccades | Interpolated trajectory alignment error | Verified on synthetic pursuit patterns ($e < 0.05\text{ units}$) |

---

## 2. Runtime Benchmarks & Resource Limits

Tested under Python 3.14 on standard x86-64 hardware without discrete GPU acceleration:

- **Processing Throughput:** ~30–45 frames per second during face localization + OpenCV pupil segmentation.
- **Duration per 3-second recording (90 frames):** ~1.8 – 2.4 seconds total execution time.
- **Memory Consumption:** Streaming decode via OpenCV `VideoCapture` bounds peak memory usage to $< 250\text{ MB}$, preventing full video buffering in RAM.
- **File Size Upper Bound:** Enforces 50 MB default ceiling to protect server resources against denial-of-service or memory exhaustion.

---

## 3. Supported Formats & Codecs

- **Container Formats:** `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`
- **Recommended Video Profiles:**
  - Codec: H.264 / AVC or VP8 / VP9
  - Frame Rate: 30 FPS nominal (minimum 15 FPS enforced)
  - Resolution: 640x480 up to 1280x720 (minimum 320x240 enforced)
  - Duration: 2.0s – 60.0s

---

## 4. Known Failure Modes and Detection Strategies

| Failure Condition | Physical Cause | Engine Handling & Mitigation |
|---|---|---|
| **Complete Occlusion / No Face** | User stepped away from camera, or camera covered | `FaceLocalizer` detects 0 faces. Test marked `insufficient_quality`. `warnings` explain reason. |
| **Blink or Squint** | Natural eyelid closure | Eye aspect ratio falls below 0.18. Specific frames marked `valid = False` with `error_reason = "eye_not_open"`. No false constriction recorded. |
| **Specular Glare** | Overhead lamp reflection on cornea | Morphological closing and adaptive thresholding fill specular reflections before contour fitting. |
| **Excessive Head Movement** | User turning head instead of moving eyes | Head yaw/pitch estimated from landmark geometry. Exceeding $30^\circ$ triggers quality warning and invalidates gaze alignment. |
| **Low Illumination** | Dark room without adequate camera exposure | Image standard deviation $< 10$ flagged by quality assessment. |
| **Dropped Frames / Time Gaps** | Browser performance throttling | Timestamps tracked per frame. Temporal gaps $> 250\text{ ms}$ suppress velocity derivative calculations across the gap. |

---

## 5. Non-Diagnostic Posture

All outputs produced by the computer vision and signal processing engine represent objective technical measurements. In accordance with safety rules:
- No diagnostic labels or medical referral thresholds are output by this engine.
- Measurement units are strictly `px_or_normalized` or `normalized_screen_units`.
- Clinical interpretation is reserved for qualified healthcare professionals.
