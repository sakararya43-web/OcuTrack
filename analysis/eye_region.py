"""Eye region extraction, eye-side locking, and coordinate system transformation.

Ensures the pipeline consistently tracks one eye throughout a recording and handles blinks.
Adheres strictly to adityaImplementation.md Section 7.
"""

from typing import Optional, Tuple
import numpy as np

from analysis.contracts import EyeSide, FaceLocalizationResult

MIN_EYE_OPEN_RATIO = 0.15
MIN_CROP_DIMENSION = 10
TARGET_MIN_CROP_DIMENSION = 16


class EyeRegionExtractor:
    """Manages consistent single-eye extraction across consecutive video frames."""

    def __init__(self, preferred_side: str = EyeSide.AUTO.value):
        self.preferred_side = preferred_side
        self._locked_side: Optional[str] = None

    @property
    def locked_side(self) -> Optional[str]:
        return self._locked_side

    def select_and_lock_side(self, loc_result: FaceLocalizationResult) -> str:
        """Determines active eye on the first valid detection and locks it for the session."""
        if self._locked_side is not None:
            return self._locked_side

        if self.preferred_side in (EyeSide.LEFT.value, EyeSide.RIGHT.value):
            self._locked_side = self.preferred_side
            return self._locked_side

        # Auto-selection: choose eye with higher openness or default to left
        left_ear = loc_result.left_eye_open_ratio or 0.0
        right_ear = loc_result.right_eye_open_ratio or 0.0

        if right_ear > left_ear + 0.05:
            self._locked_side = EyeSide.RIGHT.value
        else:
            self._locked_side = EyeSide.LEFT.value

        return self._locked_side

    def extract_crop(
        self,
        frame: np.ndarray,
        loc_result: FaceLocalizationResult,
    ) -> Tuple[Optional[np.ndarray], Tuple[int, int, int, int], bool, Optional[str]]:
        """Extracts the cropped eye image, its bounding box (x, y, w, h), and validity flag.

        Returns:
            (crop_image, bbox_tuple, is_valid, error_reason)
        """
        if not loc_result.face_detected:
            return None, (0, 0, 0, 0), False, "no_face_detected"

        eye_side = self.select_and_lock_side(loc_result)

        if eye_side == EyeSide.RIGHT.value:
            bbox = loc_result.right_eye_bbox
            ear = loc_result.right_eye_open_ratio or 0.0
        else:
            bbox = loc_result.left_eye_bbox
            ear = loc_result.left_eye_open_ratio or 0.0

        if bbox is None:
            return None, (0, 0, 0, 0), False, f"missing_{eye_side}_eye_bbox"

        x, y, w, h = bbox
        frame_h, frame_w = frame.shape[:2]

        # Clamp bounding box within frame dimensions
        x1 = max(0, min(frame_w - 1, x))
        y1 = max(0, min(frame_h - 1, y))
        x2 = max(x1 + 1, min(frame_w, x + w))
        y2 = max(y1 + 1, min(frame_h, y + h))

        cw = x2 - x1
        ch = y2 - y1

        if cw < MIN_CROP_DIMENSION or ch < MIN_CROP_DIMENSION:
            return None, (x1, y1, cw, ch), False, "eye_crop_too_small"

        # Pad small crops from QVGA/low-res rural webcams symmetrically up to TARGET_MIN_CROP_DIMENSION
        if cw < TARGET_MIN_CROP_DIMENSION and frame_w >= TARGET_MIN_CROP_DIMENSION:
            pad = (TARGET_MIN_CROP_DIMENSION - cw + 1) // 2
            x1 = max(0, x1 - pad)
            x2 = min(frame_w, x1 + TARGET_MIN_CROP_DIMENSION)
            x1 = max(0, x2 - TARGET_MIN_CROP_DIMENSION)
            cw = x2 - x1
        if ch < TARGET_MIN_CROP_DIMENSION and frame_h >= TARGET_MIN_CROP_DIMENSION:
            pad = (TARGET_MIN_CROP_DIMENSION - ch + 1) // 2
            y1 = max(0, y1 - pad)
            y2 = min(frame_h, y1 + TARGET_MIN_CROP_DIMENSION)
            y1 = max(0, y2 - TARGET_MIN_CROP_DIMENSION)
            ch = y2 - y1

        crop = frame[y1:y2, x1:x2].copy()

        # Check for closed eye / blink
        if ear > 0.0 and ear < MIN_EYE_OPEN_RATIO:
            return crop, (x1, y1, cw, ch), False, "eye_closed_or_blink"

        return crop, (x1, y1, cw, ch), True, None

    @staticmethod
    def crop_to_frame_coordinates(
        crop_x: float,
        crop_y: float,
        crop_bbox: Tuple[int, int, int, int],
    ) -> Tuple[float, float]:
        """Translates crop-relative coordinates to the original full-frame pixel coordinates."""
        bx, by, _, _ = crop_bbox
        return float(bx + crop_x), float(by + crop_y)
