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
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]  # [center, right, top, left, bottom]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]
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


def _enhance_low_light_frame(frame: np.ndarray) -> np.ndarray:
    """Applies CLAHE luminance normalization for dim rural-clinic webcam captures."""
    if frame.ndim == 3 and frame.shape[2] >= 3:
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l_eq = clahe.apply(l_ch)
        merged = cv2.merge((l_eq, a_ch, b_ch))
        return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    return clahe.apply(frame)


class GeometricFaceLocalizer:
    """Deterministic OpenCV face, eye, and iris localizer for environments without MediaPipe."""

    @staticmethod
    def _detect_face_bbox(frame: np.ndarray, gray: np.ndarray) -> Tuple[int, int, int, int]:
        h, w = gray.shape[:2]
        frame_area = float(w * h)

        # Boost dim frames before skin-tone segmentation
        work_frame = _enhance_low_light_frame(frame) if float(np.mean(gray)) < 80.0 else frame

        # 1. Try skin-tone segmentation in YCrCb for real webcam frames (tolerant to dim lighting)
        if work_frame.ndim == 3 and work_frame.shape[2] >= 3:
            ycrcb = cv2.cvtColor(work_frame, cv2.COLOR_BGR2YCrCb)
            skin_mask = cv2.inRange(ycrcb, (15, 130, 74), (255, 178, 134))
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, k)
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, k)

            contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            face_candidates = []
            for c in contours:
                area = cv2.contourArea(c)
                if (frame_area * 0.03) <= area <= (frame_area * 0.85):
                    bx, by, bw, bh = cv2.boundingRect(c)
                    aspect = bw / float(bh) if bh > 0 else 0.0
                    if 0.40 <= aspect <= 1.60:
                        face_candidates.append((area, (bx, by, bw, bh)))
            if face_candidates:
                face_candidates.sort(key=lambda item: item[0], reverse=True)
                return face_candidates[0][1]

        # 2. Foreground Otsu separation (check both polarities, exclude full-frame background)
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        best_area = 0.0
        best_bbox: Optional[Tuple[int, int, int, int]] = None

        for mask in (thresh, cv2.bitwise_not(thresh)):
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                area = cv2.contourArea(c)
                if (frame_area * 0.05) <= area <= (frame_area * 0.85):
                    bx, by, bw, bh = cv2.boundingRect(c)
                    if bw < int(w * 0.92) or bh < int(h * 0.92):
                        if area > best_area:
                            best_area = area
                            best_bbox = (bx, by, bw, bh)

        if best_bbox is not None:
            return best_bbox

        # 3. Center-of-frame face prior
        return int(w * 0.2), int(h * 0.15), int(w * 0.6), int(h * 0.7)

    @staticmethod
    def _locate_eye_in_zone(
        gray: np.ndarray,
        zx: int,
        zy: int,
        zw: int,
        zh: int,
        default_w: int,
        default_h: int,
    ) -> Tuple[Tuple[int, int, int, int], Optional[Tuple[float, float]], Optional[float], float]:
        """Refines eye bounding box and iris/pupil center within a candidate ocular search zone."""
        frame_h, frame_w = gray.shape[:2]
        x1 = max(0, zx)
        y1 = max(0, zy)
        x2 = min(frame_w, zx + zw)
        y2 = min(frame_h, zy + zh)

        if (x2 - x1) < 10 or (y2 - y1) < 10:
            bbox = (x1, y1, max(1, x2 - x1), max(1, y2 - y1))
            return bbox, None, None, 0.28

        roi = gray[y1:y2, x1:x2]
        if float(np.mean(roi)) < 85.0:
            roi = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4)).apply(roi)
        smoothed = cv2.GaussianBlur(roi, (5, 5), 0)
        min_val = float(np.min(smoothed))
        p25 = float(np.percentile(smoothed, 25))
        p75 = float(np.percentile(smoothed, 75))

        # Check contrast inside zone
        if (p75 - min_val) < 10.0:
            bbox = (x1, y1, x2 - x1, y2 - y1)
            return bbox, None, None, 0.28

        thresh_val = min(140, int(min_val + max(18.0, (p25 - min_val) * 0.85)))
        _, dark_mask = cv2.threshold(smoothed, thresh_val, 255, cv2.THRESH_BINARY_INV)
        k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, k_open)

        contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        zone_area = float((x2 - x1) * (y2 - y1))
        zone_cy = (y2 - y1) / 2.0

        best_score = -1.0
        best_center: Optional[Tuple[float, float]] = None
        best_diam: Optional[float] = None
        best_aspect = 1.0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 12.0 or area > zone_area * 0.35:
                continue
            bx, by, bw, bh = cv2.boundingRect(cnt)
            # Skip contours hugging the very top edge (likely eyebrow)
            if by <= 1 and bh < (y2 - y1) * 0.25:
                continue
            perim = cv2.arcLength(cnt, True)
            if perim <= 0:
                continue
            circ = (4.0 * math.pi * area) / (perim * perim)
            aspect = bw / float(bh) if bh > 0 else 4.0
            if aspect > 3.5 or aspect < 0.3:
                continue
            M = cv2.moments(cnt)
            if M["m00"] == 0:
                continue
            cx = M["m10"] / M["m00"]
            cy = M["m01"] / M["m00"]
            vert_bias = max(0.0, 1.0 - abs(cy - zone_cy) / max(1.0, zone_cy))
            c_mask = np.zeros(smoothed.shape, dtype=np.uint8)
            cv2.drawContours(c_mask, [cnt], -1, 255, -1)
            darkness = 1.0 - (cv2.mean(smoothed, mask=c_mask)[0] / 255.0)
            score = (circ * 0.45) + (darkness * 0.35) + (vert_bias * 0.20)
            if score > best_score:
                best_score = score
                best_center = (float(x1 + cx), float(y1 + cy))
                best_diam = float(math.sqrt(4.0 * area / math.pi))
                best_aspect = aspect

        if best_center is None:
            # Check if a horizontal closed-eye slit exists (high aspect ratio contour)
            for cnt in contours:
                bx, by, bw, bh = cv2.boundingRect(cnt)
                if bw > 10 and bh > 0 and (bw / float(bh)) > 3.5:
                    bbox = (x1, y1, x2 - x1, y2 - y1)
                    return bbox, None, None, 0.08
            bbox = (x1, y1, x2 - x1, y2 - y1)
            return bbox, None, None, 0.28

        # Build eye crop centered on detected iris/pupil center
        crop_w = max(default_w, int((best_diam or 20.0) * 3.0))
        crop_h = max(default_h, int((best_diam or 20.0) * 2.0))
        cx_i, cy_i = int(round(best_center[0])), int(round(best_center[1]))
        bx1 = max(0, cx_i - crop_w // 2)
        by1 = max(0, cy_i - crop_h // 2)
        bx2 = min(frame_w, bx1 + crop_w)
        by2 = min(frame_h, by1 + crop_h)
        eye_open_ratio = 0.08 if best_aspect > 3.2 else 0.28

        return (bx1, by1, bx2 - bx1, by2 - by1), best_center, round(best_diam, 2) if best_diam else None, eye_open_ratio

    @staticmethod
    def localize(frame: np.ndarray) -> FaceLocalizationResult:
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame.copy()

        # Check for empty or uniform frame (no face)
        std_dev = np.std(gray)
        if std_dev < 10.0:
            return FaceLocalizationResult(face_detected=False, face_count=0, detector_backend="geometric_fallback")

        fx, fy, fw, fh = GeometricFaceLocalizer._detect_face_bbox(frame, gray)

        # Ensure bounds within frame
        fx = max(0, fx)
        fy = max(0, fy)
        fw = min(w - fx, fw)
        fh = min(h - fy, fh)

        if fw < 40 or fh < 40:
            return FaceLocalizationResult(face_detected=False, face_count=0, detector_backend="geometric_fallback")

        # Search left and right ocular zones within the upper face region
        zone_y = fy + int(fh * 0.18)
        zone_h = max(24, int(fh * 0.34))
        zone_w = max(24, int(fw * 0.38))
        default_eye_w = max(24, int(fw * 0.28))
        default_eye_h = max(20, int(fh * 0.22))

        left_zone_x = fx + int(fw * 0.10)
        right_zone_x = fx + int(fw * 0.52)

        left_eye_bbox, left_iris, left_iris_d, left_ear = GeometricFaceLocalizer._locate_eye_in_zone(
            gray, left_zone_x, zone_y, zone_w, zone_h, default_eye_w, default_eye_h
        )
        right_eye_bbox, right_iris, right_iris_d, right_ear = GeometricFaceLocalizer._locate_eye_in_zone(
            gray, right_zone_x, zone_y, zone_w, zone_h, default_eye_w, default_eye_h
        )

        return FaceLocalizationResult(
            face_detected=True,
            face_count=1,
            face_bbox=(fx, fy, fw, fh),
            left_eye_bbox=left_eye_bbox,
            right_eye_bbox=right_eye_bbox,
            left_eye_open_ratio=left_ear,
            right_eye_open_ratio=right_ear,
            left_iris_center=left_iris,
            right_iris_center=right_iris,
            left_iris_diameter_px=left_iris_d,
            right_iris_diameter_px=right_iris_d,
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
                        min_face_detection_confidence=0.35,
                        min_face_presence_confidence=0.35,
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
            if not face_landmarks_list and float(np.mean(frame)) < 95.0:
                enhanced = _enhance_low_light_frame(frame)
                rgb_enh = (
                    cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
                    if enhanced.ndim == 3
                    else cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
                )
                mp_enh = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_enh)
                face_landmarks_list = self.landmarker.detect(mp_enh).face_landmarks

            if not face_landmarks_list:
                return GeometricFaceLocalizer.localize(frame)

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

            # Extract left & right eye points
            left_pts = [(best_face[i].x, best_face[i].y) for i in LEFT_EYE_INDICES]
            right_pts = [(best_face[i].x, best_face[i].y) for i in RIGHT_EYE_INDICES]

            left_ear = compute_eye_aspect_ratio(left_pts, w, h)
            right_ear = compute_eye_aspect_ratio(right_pts, w, h)

            # Extract MediaPipe iris landmarks (468-477) when present
            left_iris_center: Optional[Tuple[float, float]] = None
            right_iris_center: Optional[Tuple[float, float]] = None
            left_iris_diameter_px: Optional[float] = None
            right_iris_diameter_px: Optional[float] = None
            left_bbox_pts = list(left_pts)
            right_bbox_pts = list(right_pts)

            if len(best_face) >= 478:
                left_iris_pts = [(best_face[i].x, best_face[i].y) for i in LEFT_IRIS_INDICES]
                right_iris_pts = [(best_face[i].x, best_face[i].y) for i in RIGHT_IRIS_INDICES]
                left_bbox_pts.extend(left_iris_pts)
                right_bbox_pts.extend(right_iris_pts)

                left_iris_center = (round(best_face[468].x * w, 2), round(best_face[468].y * h, 2))
                right_iris_center = (round(best_face[473].x * w, 2), round(best_face[473].y * h, 2))

                l_h = math.hypot((best_face[469].x - best_face[471].x) * w, (best_face[469].y - best_face[471].y) * h)
                l_v = math.hypot((best_face[470].x - best_face[472].x) * w, (best_face[470].y - best_face[472].y) * h)
                left_iris_diameter_px = round((l_h + l_v) / 2.0, 2)

                r_h = math.hypot((best_face[474].x - best_face[476].x) * w, (best_face[474].y - best_face[476].y) * h)
                r_v = math.hypot((best_face[475].x - best_face[477].x) * w, (best_face[475].y - best_face[477].y) * h)
                right_iris_diameter_px = round((r_h + r_v) / 2.0, 2)

            # Calculate eye bounding boxes with margin around eyelids + iris
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

            left_bbox = bbox_from_points(left_bbox_pts)
            right_bbox = bbox_from_points(right_bbox_pts)

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
                left_iris_center=left_iris_center,
                right_iris_center=right_iris_center,
                left_iris_diameter_px=left_iris_diameter_px,
                right_iris_diameter_px=right_iris_diameter_px,
                head_yaw=round(head_yaw, 1),
                head_pitch=round(head_pitch, 1),
                landmarks_count=len(best_face),
                detector_backend="mediapipe",
            )
        except Exception:
            return GeometricFaceLocalizer.localize(frame)
