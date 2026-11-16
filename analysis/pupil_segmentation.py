"""OpenCV-based pupil region segmentation, boundary fitting, and validity scoring.

Estimates pupil center, diameter, and confidence without relying on MediaPipe iris landmarks.
Adheres strictly to adityaImplementation.md Section 8.
"""

import math
from typing import Optional, Tuple
import cv2
import numpy as np


class PupilSegmenter:
    """Modular OpenCV pipeline for segmenting the pupil boundary within an eye crop."""

    def __init__(
        self,
        min_pupil_area_ratio: float = 0.008,
        max_pupil_area_ratio: float = 0.55,
        min_circularity: float = 0.38,
        min_aspect_ratio: float = 0.40,
        max_aspect_ratio: float = 2.50,
        clahe_clip_limit: float = 2.0,
    ):
        self.min_area_ratio = min_pupil_area_ratio
        self.max_area_ratio = max_pupil_area_ratio
        self.min_circularity = min_circularity
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.clahe = cv2.createCLAHE(clipLimit=clahe_clip_limit, tileGridSize=(4, 4))

    def remove_glare(self, gray: np.ndarray) -> np.ndarray:
        """Detects bright specular glint points and fills them with local median values."""
        # Find saturated bright specks
        _, glare_mask = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY)
        num_glare_pixels = cv2.countNonZero(glare_mask)

        # Only inpaint if glint is small (less than 5% of eye area)
        total_pixels = gray.size
        if 0 < num_glare_pixels < total_pixels * 0.05:
            # Dilate slightly to cover halo
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            dilated = cv2.dilate(glare_mask, kernel, iterations=1)
            inpainted = cv2.inpaint(gray, dilated, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            return inpainted
        return gray

    def segment(
        self,
        eye_crop: np.ndarray,
    ) -> Tuple[Optional[float], Optional[float], Optional[float], float, bool, Optional[str]]:
        """Segments pupil within eye crop.

        Returns:
            (crop_center_x, crop_center_y, pupil_diameter, confidence, is_valid, error_reason)
        """
        if eye_crop is None or eye_crop.size == 0:
            return None, None, None, 0.0, False, "empty_eye_crop"

        h, w = eye_crop.shape[:2]
        crop_area = w * h

        gray = cv2.cvtColor(eye_crop, cv2.COLOR_BGR2GRAY) if eye_crop.ndim == 3 else eye_crop.copy()

        # 1. Specular glare suppression
        gray_noglint = self.remove_glare(gray)

        # 2. Controlled bilateral/Gaussian denoising
        denoised = cv2.bilateralFilter(gray_noglint, d=5, sigmaColor=25, sigmaSpace=25)

        # 3. Dynamic multi-threshold candidate search
        # Pupil is the darkest core inside the iris; evaluate thresholds near minimum intensity
        min_val = float(np.min(denoised))
        median_val = float(np.median(denoised))

        # Test threshold offsets relative to minimum intensity
        # Ensures pupil (darkest core) is targeted rather than surrounding lighter iris
        step_offsets = [15, 25, 35, 45, 55]
        candidate_thresholds = [int(min_val + off) for off in step_offsets if (min_val + off) < median_val]
        if not candidate_thresholds:
            candidate_thresholds = [int(min_val + 25)]

        best_candidate = None
        best_score = -1.0

        eye_cx, eye_cy = w / 2.0, h / 2.0

        for val_thresh in candidate_thresholds:
            val_thresh = min(val_thresh, 90)  # Bound upper threshold for dark pupil

            _, binary = cv2.threshold(denoised, val_thresh, 255, cv2.THRESH_BINARY_INV)

            # Morphological cleanup: open to remove thin eyelashes, close to fill interior gaps
            k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, k_open)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, k_close)

            contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for cnt in contours:
                area = cv2.contourArea(cnt)
                area_ratio = area / crop_area

                if not (self.min_area_ratio <= area_ratio <= self.max_area_ratio):
                    continue

                perimeter = cv2.arcLength(cnt, True)
                if perimeter <= 0:
                    continue

                circularity = (4.0 * math.pi * area) / (perimeter * perimeter)
                if circularity < self.min_circularity:
                    continue

                # Bounding rect aspect ratio check
                bx, by, bw, bh = cv2.boundingRect(cnt)
                aspect = bw / float(bh) if bh > 0 else 0.0
                if not (self.min_aspect_ratio <= aspect <= self.max_aspect_ratio):
                    continue

                # Center distance penalty (pupil should be near the center of the eye crop)
                M = cv2.moments(cnt)
                if M["m00"] == 0:
                    continue
                cx = M["m10"] / M["m00"]
                cy = M["m01"] / M["m00"]

                dist_from_center = math.hypot(cx - eye_cx, cy - eye_cy) / (w * 0.5)
                center_score = max(0.0, 1.0 - dist_from_center)

                # Darkness preference: pupil should be the darkest structure
                c_mask = np.zeros(denoised.shape, dtype=np.uint8)
                cv2.drawContours(c_mask, [cnt], -1, 255, -1)
                mean_int = cv2.mean(denoised, mask=c_mask)[0]
                darkness_score = max(0.0, 1.0 - (mean_int / 255.0))

                # Composite score
                score = (circularity * 0.45) + (center_score * 0.25) + (darkness_score * 0.30)

                if score > best_score:
                    best_score = score
                    best_candidate = cnt

        if best_candidate is None:
            return None, None, None, 0.0, False, "no_valid_pupil_contour"

        # Fit ellipse or enclosing circle to best candidate
        if len(best_candidate) >= 5:
            try:
                (ecx, ecy), (major_axis, minor_axis), angle = cv2.fitEllipse(best_candidate)
                diameter = (major_axis + minor_axis) / 2.0
                fit_cx, fit_cy = ecx, ecy
            except Exception:
                (ccx, ccy), radius = cv2.minEnclosingCircle(best_candidate)
                diameter = radius * 2.0
                fit_cx, fit_cy = ccx, ccy
        else:
            (ccx, ccy), radius = cv2.minEnclosingCircle(best_candidate)
            diameter = radius * 2.0
            fit_cx, fit_cy = ccx, ccy

        # Final sanity checks on diameter
        if diameter < 4.0 or diameter > (min(w, h) * 0.95):
            return None, None, None, 0.0, False, "pupil_dimensions_out_of_bounds"

        confidence = max(0.1, min(1.0, best_score))

        return (
            float(fit_cx),
            float(fit_cy),
            float(diameter),
            float(confidence),
            True,
            None,
        )
