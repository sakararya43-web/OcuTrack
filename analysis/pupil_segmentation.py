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
        max_pupil_area_ratio: float = 0.42,
        min_circularity: float = 0.28,
        min_aspect_ratio: float = 0.35,
        max_aspect_ratio: float = 2.60,
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
        expected_diameter: Optional[float] = None,
        max_diameter_override: Optional[float] = None,
    ) -> Tuple[Optional[float], Optional[float], Optional[float], float, bool, Optional[str]]:
        """Segments pupil within eye crop.

        Args:
            eye_crop: Cropped eye BGR or grayscale image.
            expected_diameter: Optional temporal prior (in original crop pixels) to stabilize
                multi-threshold selection across consecutive frames.
            max_diameter_override: Optional anatomical upper bound (e.g. 0.78 * iris_diameter_px)
                preventing segmentation from latching onto the full iris.

        Returns:
            (crop_center_x, crop_center_y, pupil_diameter, confidence, is_valid, error_reason)
        """
        if eye_crop is None or eye_crop.size == 0:
            return None, None, None, 0.0, False, "empty_eye_crop"

        h, w = eye_crop.shape[:2]

        gray = cv2.cvtColor(eye_crop, cv2.COLOR_BGR2GRAY) if eye_crop.ndim == 3 else eye_crop.copy()

        # Upscale low-resolution eye crops (e.g., 320x240 / 480x360 rural webcams) for sub-pixel fitting
        scale = 2.0 if min(w, h) < 48 else 1.0
        if scale > 1.0:
            gray = cv2.resize(
                gray,
                (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
                interpolation=cv2.INTER_CUBIC,
            )
            h, w = gray.shape[:2]

        crop_area = w * h

        # 1. Specular glare suppression
        gray_noglint = self.remove_glare(gray)

        # 1b. Adaptive CLAHE contrast lift for dim or low-contrast rural clinic webcams
        p10, p90 = float(np.percentile(gray_noglint, 10)), float(np.percentile(gray_noglint, 90))
        if float(np.mean(gray_noglint)) < 95.0 or (0.0 < (p90 - p10) < 45.0):
            enhanced = self.clahe.apply(gray_noglint)
            gray_noglint = cv2.addWeighted(gray_noglint, 0.4, enhanced, 0.6, 0)

        # 2. Controlled bilateral/Gaussian denoising
        denoised = cv2.bilateralFilter(gray_noglint, d=5, sigmaColor=25, sigmaSpace=25)

        # 3. Dynamic multi-threshold candidate search
        # Pupil is the darkest core inside the iris; evaluate thresholds near minimum intensity
        min_val = float(np.min(denoised))
        median_val = float(np.median(denoised))

        # Reject uniform or near-flat crops lacking ocular contrast
        if (median_val - min_val) < 7.0:
            return None, None, None, 0.0, False, "no_valid_pupil_contour"

        # Adaptive threshold ceiling based on local contrast (supports brighter auto-exposed webcams)
        max_pupil_thresh = min(150, int(min_val + max(40.0, (median_val - min_val) * 0.72)))

        step_offsets = [15, 25, 35, 45, 55, 70]
        candidate_thresholds = sorted({
            min(int(min_val + off), max_pupil_thresh)
            for off in step_offsets
            if (min_val + off) < median_val
        })
        if not candidate_thresholds:
            candidate_thresholds = [min(int(min_val + 25), max_pupil_thresh)]

        best_candidate = None
        best_score = -1.0

        eye_cx, eye_cy = w / 2.0, h / 2.0
        k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        close_size = 3 if min(w, h) < 45 else 5
        k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close_size, close_size))

        for val_thresh in candidate_thresholds:
            _, binary = cv2.threshold(denoised, val_thresh, 255, cv2.THRESH_BINARY_INV)

            # Morphological cleanup: open to remove thin eyelashes, close to fill interior gaps
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

                dist_from_center = math.hypot(cx - eye_cx, cy - eye_cy) / max(1.0, w * 0.5)
                center_score = max(0.0, 1.0 - dist_from_center)

                # Darkness preference: pupil should be the darkest structure
                c_mask = np.zeros(denoised.shape, dtype=np.uint8)
                cv2.drawContours(c_mask, [cnt], -1, 255, -1)
                mean_int = cv2.mean(denoised, mask=c_mask)[0]
                darkness_score = max(0.0, 1.0 - (mean_int / 255.0))

                # Penalize border-touching blobs (eyelashes / corner shadows)
                touches_border = bx <= 0 or by <= 0 or (bx + bw) >= w or (by + bh) >= h
                border_penalty = 0.20 if touches_border else 0.0

                # Candidate equivalent diameter in original crop pixels
                cand_diam = (math.sqrt(4.0 * area / math.pi)) / scale
                if max_diameter_override is not None and cand_diam > max_diameter_override:
                    continue

                # Temporal size consistency bonus/penalty prevents jumping between pupil and iris
                size_prior_score = 0.0
                if expected_diameter is not None and expected_diameter > 0:
                    rel_diff = abs(cand_diam - expected_diameter) / expected_diameter
                    size_prior_score = max(-0.25, 0.25 * (1.0 - min(2.0, rel_diff * 2.0)))

                # Composite score (strongly favors darkest, centered, circular core over larger iris halos)
                score = (
                    (circularity * 0.40)
                    + (center_score * 0.25)
                    + (darkness_score * 0.35)
                    + size_prior_score
                    - border_penalty
                )

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

        # Scale coordinates and diameter back to original crop pixel space
        if scale > 1.0:
            fit_cx /= scale
            fit_cy /= scale
            diameter /= scale
            orig_min_dim = min(w / scale, h / scale)
        else:
            orig_min_dim = min(w, h)

        # Final sanity checks on diameter (supports smaller QVGA pupils down to 2.5px)
        max_allowed_diam = orig_min_dim * 0.85
        if max_diameter_override is not None:
            max_allowed_diam = min(max_allowed_diam, max_diameter_override)
        if diameter < 2.5 or diameter > max_allowed_diam:
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
