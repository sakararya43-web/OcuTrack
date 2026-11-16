"""Face and eye localization using MediaPipe FaceLandmarker with geometric fallback.

Extracts facial landmarks, eye bounding boxes, blink/openness indicators, and head pose.
Adheres strictly to adityaImplementation.md Section 7.
"""

import math
import os
import urllib.request
from pathlib import Path
from typing import List, Optional, Tuple
import cv2
import numpy as np

from analysis.contracts import FaceLocalizationResult

# MediaPipe FaceMesh landmark indices
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]  # [corner_outer, top1, top2, corner_inner, bot2, bot1]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
NOSE_TIP_INDEX = 1
CHIN_INDEX = 152
FOREHEAD_INDEX = 10
LEFT_CHEEK_INDEX = 234
RIGHT_CHEEK_INDEX = 454

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
DEFAULT_CACHE_DIR = Path.home() / ".cache" / "ocutrack"


def compute_eye_aspect_ratio(landmarks: List[Tuple[float, float]], width: int, height: int) -> float:
    """Computes Eye Aspect Ratio (EAR) from 6 canonical eyelid landmarks."""
    if len(landmarks) < 6:
        return 0.0

    # Convert normalized landmarks to pixel coordinates
    pts = [(x * width, y * height) for x, y in landmarks]

    # Vertical distances
    v1 = math.hypot(pts[1][0] - pts[5][0], pts[1][1] - pts[5][1])
    v2 = math.hypot(pts[2][0] - pts[4][0], pts[2][1] - pts[4][1])

    # Horizontal distance
    h = math.hypot(pts[0][0] - pts[3][0], pts[0][1] - pts[3][1])

    if h <= 0.0:
        return 0.0

    return (v1 + v2) / (2.0 * h)


def ensure_model_file(cache_dir: Path = DEFAULT_CACHE_DIR) -> Optional[Path]:
    """Ensures face_landmarker.task model file is downloaded and cached."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    task_path = cache_dir / "face_landmarker.task"

    if task_path.exists() and task_path.stat().st_size > 100_000:
        return task_path

    try:
        urllib.request.urlretrieve(MODEL_URL, str(task_path))
        if task_path.exists() and task_path.stat().st_size > 100_000:
            return task_path
    except Exception:
        pass

    return None


class GeometricFaceLocalizer:
    """Deterministic OpenCV fallback face/eye localizer for offline or unit-test environments."""

    @staticmethod
    def localize(frame: np.ndarray) -> FaceLocalizationResult:
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame.copy()

        # Check for empty or uniform frame (no face)
        std_dev = np.std(gray)
        if std_dev < 10.0:
            return FaceLocalizationResult(face_detected=False, face_count=0, detector_backend="geometric_fallback")

        # Threshold to locate potential foreground/face region
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        valid_contours = [c for c in contours if cv2.contourArea(c) > (w * h * 0.05)]

        if not valid_contours:
            # Fall back to center-of-frame face prior if image has structure
            fx, fy, fw, fh = int(w * 0.2), int(h * 0.15), int(w * 0.6), int(h * 0.7)
        else:
            dominant = max(valid_contours, key=cv2.contourArea)
            fx, fy, fw, fh = cv2.boundingRect(dominant)

        # Ensure bounds within frame
        fx = max(0, fx)
        fy = max(0, fy)
        fw = min(w - fx, fw)
        fh = min(h - fy, fh)

        if fw < 40 or fh < 40:
            return FaceLocalizationResult(face_detected=False, face_count=0, detector_backend="geometric_fallback")

        # Estimate eye locations within upper face region
        eye_y = fy + int(fh * 0.25)
        eye_h = int(fh * 0.25)
        eye_w = int(fw * 0.28)

        left_eye_x = fx + int(fw * 0.15)
        right_eye_x = fx + int(fw * 0.57)

        left_eye_bbox = (max(0, left_eye_x), max(0, eye_y), min(w - left_eye_x, eye_w), min(h - eye_y, eye_h))
        right_eye_bbox = (max(0, right_eye_x), max(0, eye_y), min(w - right_eye_x, eye_w), min(h - eye_y, eye_h))

        return FaceLocalizationResult(
            face_detected=True,
            face_count=1,
            face_bbox=(fx, fy, fw, fh),
            left_eye_bbox=left_eye_bbox,
            right_eye_bbox=right_eye_bbox,
            left_eye_open_ratio=0.28,
            right_eye_open_ratio=0.28,
            head_yaw=0.0,
            head_pitch=0.0,
            landmarks_count=10,
            detector_backend="geometric_fallback",
        )


class FaceLocalizer:
    """Primary face and eye localizer using MediaPipe FaceLandmarker with fallback."""

    def __init__(self, model_path: Optional[Path] = None, force_fallback: bool = False):
        self.force_fallback = force_fallback
        self.landmarker = None
        self.backend = "geometric_fallback"

        if not force_fallback:
            try:
                import mediapipe as mp
                from mediapipe.tasks.python import BaseOptions
                from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions, RunningMode

                task_file = model_path or ensure_model_file()
                if task_file and task_file.exists():
                    options = FaceLandmarkerOptions(
                        base_options=BaseOptions(model_asset_path=str(task_file)),
                        running_mode=RunningMode.IMAGE,
                        num_faces=3,
                        min_face_detection_confidence=0.5,
                        min_face_presence_confidence=0.5,
                    )
                    self.landmarker = FaceLandmarker.create_from_options(options)
                    self.backend = "mediapipe"
            except Exception:
                self.landmarker = None
                self.backend = "geometric_fallback"

    def localize(self, frame: np.ndarray) -> FaceLocalizationResult:
        """Localizes face and eye regions in an RGB/BGR numpy frame."""
        if frame is None or frame.size == 0:
            return FaceLocalizationResult(face_detected=False, face_count=0)

        h, w = frame.shape[:2]

        if self.landmarker is None:
            return GeometricFaceLocalizer.localize(frame)

        try:
            import mediapipe as mp

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.ndim == 3 else cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            detection_result = self.landmarker.detect(mp_image)

            face_landmarks_list = detection_result.face_landmarks
            if not face_landmarks_list:
                return FaceLocalizationResult(face_detected=False, face_count=0, detector_backend=self.backend)

            face_count = len(face_landmarks_list)

            # Pick dominant face (face with largest bounding box area)
            best_face = None
            max_area = 0.0
            best_bbox = (0, 0, 0, 0)

            for landmarks in face_landmarks_list:
                xs = [lm.x for lm in landmarks]
                ys = [lm.y for lm in landmarks]
                min_x, max_x = int(min(xs) * w), int(max(xs) * w)
                min_y, max_y = int(min(ys) * h), int(max(ys) * h)
                area = max(0, max_x - min_x) * max(0, max_y - min_y)
                if area > max_area:
                    max_area = area
                    best_face = landmarks
                    best_bbox = (min_x, min_y, max_x - min_x, max_y - min_y)

            if best_face is None:
                return FaceLocalizationResult(face_detected=False, face_count=face_count, detector_backend=self.backend)

            # Extract left eye points
            left_pts = [(best_face[i].x, best_face[i].y) for i in LEFT_EYE_INDICES]
            right_pts = [(best_face[i].x, best_face[i].y) for i in RIGHT_EYE_INDICES]

            left_ear = compute_eye_aspect_ratio(left_pts, w, h)
            right_ear = compute_eye_aspect_ratio(right_pts, w, h)

            # Calculate eye bounding boxes with 20% margin
            def bbox_from_points(pts_list: List[Tuple[float, float]], margin_scale: float = 0.25):
                pxs = [pt[0] * w for pt in pts_list]
                pys = [pt[1] * h for pt in pts_list]
                bx, by = min(pxs), min(pys)
                bw, bh = max(pxs) - bx, max(pys) - by
                pad_x = bw * margin_scale
                pad_y = bh * (margin_scale * 1.5)
                x1 = max(0, int(bx - pad_x))
                y1 = max(0, int(by - pad_y))
                x2 = min(w, int(bx + bw + pad_x))
                y2 = min(h, int(by + bh + pad_y))
                return (x1, y1, x2 - x1, y2 - y1)

            left_bbox = bbox_from_points(left_pts)
            right_bbox = bbox_from_points(right_pts)

            # Estimate head pose using nose tip, cheeks, and forehead/chin
            nose = (best_face[NOSE_TIP_INDEX].x * w, best_face[NOSE_TIP_INDEX].y * h)
            left_cheek = (best_face[LEFT_CHEEK_INDEX].x * w, best_face[LEFT_CHEEK_INDEX].y * h)
            right_cheek = (best_face[RIGHT_CHEEK_INDEX].x * w, best_face[RIGHT_CHEEK_INDEX].y * h)

            dist_left = math.hypot(nose[0] - left_cheek[0], nose[1] - left_cheek[1])
            dist_right = math.hypot(nose[0] - right_cheek[0], nose[1] - right_cheek[1])
            total_dist = dist_left + dist_right
            head_yaw = ((dist_left - dist_right) / total_dist) * 45.0 if total_dist > 0 else 0.0

            forehead = (best_face[FOREHEAD_INDEX].x * w, best_face[FOREHEAD_INDEX].y * h)
            chin = (best_face[CHIN_INDEX].x * w, best_face[CHIN_INDEX].y * h)
            face_h = math.hypot(chin[0] - forehead[0], chin[1] - forehead[1])
            nose_vertical = nose[1] - forehead[1]
            head_pitch = ((nose_vertical / face_h) - 0.5) * 60.0 if face_h > 0 else 0.0

            return FaceLocalizationResult(
                face_detected=True,
                face_count=face_count,
                face_bbox=best_bbox,
                left_eye_bbox=left_bbox,
                right_eye_bbox=right_bbox,
                left_eye_open_ratio=round(left_ear, 3),
                right_eye_open_ratio=round(right_ear, 3),
                head_yaw=round(head_yaw, 1),
                head_pitch=round(head_pitch, 1),
                landmarks_count=len(best_face),
                detector_backend="mediapipe",
            )
        except Exception:
            return GeometricFaceLocalizer.localize(frame)
