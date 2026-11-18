"""Temporal pupil tracking, spatial continuity validation, and debug overlays.

Enforces consistency across consecutive frames, rejects physiological outliers, and generates debug overlays.
Adheres strictly to adityaImplementation.md Section 8.
"""

import math
from typing import List, Optional, Tuple
import cv2
import numpy as np

from analysis.contracts import (
    EyeSide,
    FaceLocalizationResult,
    PupilMeasurement,
    SampledFrame,
)
from analysis.eye_region import EyeRegionExtractor
from analysis.face_localization import FaceLocalizer
from analysis.pupil_segmentation import PupilSegmenter


class PupilTracker:
    """Orchestrates face localization, eye cropping, pupil segmentation, and temporal tracking."""

    def __init__(
        self,
        preferred_eye_side: str = EyeSide.AUTO.value,
        max_spatial_jump_px: float = 45.0,
        max_size_change_ratio: float = 0.50,
        face_localizer: Optional[FaceLocalizer] = None,
        segmenter: Optional[PupilSegmenter] = None,
    ):
        self.face_localizer = face_localizer or FaceLocalizer()
        self.eye_extractor = EyeRegionExtractor(preferred_side=preferred_eye_side)
        self.segmenter = segmenter or PupilSegmenter()
        self.max_spatial_jump_px = max_spatial_jump_px
        self.max_size_change_ratio = max_size_change_ratio

        self._last_valid: Optional[PupilMeasurement] = None
        self._history: List[PupilMeasurement] = []

    @property
    def tracked_eye_side(self) -> Optional[str]:
        return self.eye_extractor.locked_side

    def reset(self) -> None:
        """Resets tracker state between independent recordings."""
        self._last_valid = None
        self._history.clear()

    def process_frame(
        self,
        frame: np.ndarray,
        frame_index: int,
        timestamp_ms: float,
    ) -> Tuple[PupilMeasurement, Optional[FaceLocalizationResult], Tuple[int, int, int, int]]:
        """Processes a single video frame and returns the pupil measurement.

        Returns:
            (measurement, face_localization_result, eye_crop_bbox)
        """
        t_int = int(round(timestamp_ms))

        if frame is None or frame.size == 0:
            m = PupilMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                eye_side=self.tracked_eye_side or "unknown",
                valid=False,
                error_reason="empty_frame",
            )
            self._history.append(m)
            return m, None, (0, 0, 0, 0)

        # 1. Localize face and eyes
        face_res = self.face_localizer.localize(frame)
        if not face_res.face_detected:
            m = PupilMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                eye_side=self.tracked_eye_side or "unknown",
                valid=False,
                error_reason="no_face_detected",
            )
            self._history.append(m)
            return m, face_res, (0, 0, 0, 0)

        # 2. Extract cropped eye region
        crop, bbox, is_open, crop_err = self.eye_extractor.extract_crop(frame, face_res)
        eye_side = self.eye_extractor.locked_side or "unknown"

        if not is_open or crop is None:
            m = PupilMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                eye_side=eye_side,
                valid=False,
                error_reason=crop_err or "eye_not_open",
            )
            self._history.append(m)
            return m, face_res, bbox

        # 3. Segment pupil boundary
        crop_cx, crop_cy, diameter, conf, is_valid_seg, seg_err = self.segmenter.segment(crop)
        if not is_valid_seg or crop_cx is None or crop_cy is None or diameter is None:
            m = PupilMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                eye_side=eye_side,
                confidence=conf,
                valid=False,
                error_reason=seg_err or "segmentation_failed",
            )
            self._history.append(m)
            return m, face_res, bbox

        # 4. Map coordinates from crop to full-frame space
        frame_cx, frame_cy = EyeRegionExtractor.crop_to_frame_coordinates(crop_cx, crop_cy, bbox)

        # 5. Temporal continuity check
        is_temporally_valid = True
        temp_err = None

        if self._last_valid is not None and self._last_valid.center_x is not None:
            dist = math.hypot(frame_cx - self._last_valid.center_x, frame_cy - self._last_valid.center_y)
            if dist > self.max_spatial_jump_px:
                is_temporally_valid = False
                temp_err = f"spatial_jump_exceeded_{dist:.1f}px"

            if self._last_valid.diameter is not None and self._last_valid.diameter > 0:
                size_delta_ratio = abs(diameter - self._last_valid.diameter) / self._last_valid.diameter
                if size_delta_ratio > self.max_size_change_ratio:
                    is_temporally_valid = False
                    temp_err = f"diameter_change_implausible_{size_delta_ratio * 100:.1f}%"

        measurement = PupilMeasurement(
            frame_index=frame_index,
            t_ms=t_int,
            eye_side=eye_side,
            center_x=frame_cx,
            center_y=frame_cy,
            crop_center_x=crop_cx,
            crop_center_y=crop_cy,
            diameter=diameter,
            confidence=conf if is_temporally_valid else (conf * 0.5),
            valid=is_temporally_valid,
            error_reason=temp_err,
        )

        if is_temporally_valid:
            self._last_valid = measurement

        self._history.append(measurement)
        return measurement, face_res, bbox

    def track_sequence(
        self,
        sampled_frames: List[SampledFrame],
    ) -> List[PupilMeasurement]:
        """Runs pupil tracking across a sequence of sampled video frames."""
        self.reset()
        results: List[PupilMeasurement] = []

        for sf in sampled_frames:
            if not sf.is_valid or sf.frame is None:
                m = PupilMeasurement(
                    frame_index=sf.frame_index,
                    t_ms=int(round(sf.timestamp_ms)),
                    eye_side=self.tracked_eye_side or "unknown",
                    valid=False,
                    error_reason="sampled_frame_corrupt_or_missing",
                )
                self._history.append(m)
                results.append(m)
            else:
                m, _, _ = self.process_frame(sf.frame, sf.frame_index, sf.timestamp_ms)
                results.append(m)

        return results

    @staticmethod
    def render_debug_overlay(
        frame: np.ndarray,
        measurement: PupilMeasurement,
        eye_bbox: Tuple[int, int, int, int] = (0, 0, 0, 0),
        face_res: Optional[FaceLocalizationResult] = None,
    ) -> np.ndarray:
        """Renders visual debug overlays (bounding boxes, pupil contour, HUD) onto frame copy."""
        annotated = frame.copy()
        bx, by, bw, bh = eye_bbox

        # Draw face bbox if present
        if face_res is not None and face_res.face_bbox is not None:
            fx, fy, fw, fh = face_res.face_bbox
            cv2.rectangle(annotated, (fx, fy), (fx + fw, fy + fh), (80, 80, 80), 1)

        # Draw eye bounding box
        if bw > 0 and bh > 0:
            box_color = (0, 255, 0) if measurement.valid else (0, 0, 255)
            cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), box_color, 2)

        # Draw pupil ellipse and center
        if measurement.valid and measurement.center_x is not None and measurement.center_y is not None:
            cx, cy = int(round(measurement.center_x)), int(round(measurement.center_y))
            radius = int(round((measurement.diameter or 10.0) / 2.0))
            cv2.circle(annotated, (cx, cy), radius, (0, 255, 0), 2)
            cv2.drawMarker(annotated, (cx, cy), (0, 0, 255), markerType=cv2.MARKER_CROSS, markerSize=10, thickness=2)

        # Render HUD banner
        hud_bg = np.zeros((40, annotated.shape[1], 3), dtype=np.uint8)
        diam_str = f"{measurement.diameter:.1f}px" if measurement.diameter is not None else "N/A"
        conf_val = measurement.confidence if measurement.confidence is not None else 0.0
        hud_text = (
            f"t: {measurement.t_ms}ms | Eye: {measurement.eye_side} | "
            f"Diam: {diam_str} | Conf: {conf_val:.2f} | "
            f"Valid: {measurement.valid}"
        )
        if not measurement.valid and measurement.error_reason:
            hud_text += f" ({measurement.error_reason})"

        cv2.putText(annotated, hud_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
        return annotated
