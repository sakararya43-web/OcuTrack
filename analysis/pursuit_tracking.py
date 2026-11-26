"""Smooth-pursuit eye-position tracking and target alignment engine.

Tracks ocular displacement across video frames, aligns with on-screen target trajectory
metadata, computes tracking error, continuity, and detects candidate corrective saccades.
Adheres strictly to adityaImplementation.md Section 10 and Section 17.
"""

import math
from typing import Any, Dict, List, Optional, Tuple
import cv2
import numpy as np

from analysis.config import AnalysisConfig
from analysis.contracts import (
    EyeSide,
    FaceLocalizationResult,
    PursuitMeasurement,
    SampledFrame,
)
from analysis.eye_region import EyeRegionExtractor
from analysis.face_localization import FaceLocalizer
from analysis.pupil_segmentation import PupilSegmenter


class PursuitTracker:
    """Orchestrates eye position estimation and target trajectory alignment during smooth-pursuit tasks."""

    def __init__(
        self,
        preferred_eye_side: str = EyeSide.AUTO.value,
        face_localizer: Optional[FaceLocalizer] = None,
        segmenter: Optional[PupilSegmenter] = None,
        saccade_velocity_threshold: float = 2.0,  # normalized screen units per second
    ):
        self.face_localizer = face_localizer or FaceLocalizer()
        self.eye_extractor = EyeRegionExtractor(preferred_side=preferred_eye_side)
        self.segmenter = segmenter or PupilSegmenter()
        self.saccade_velocity_threshold = saccade_velocity_threshold

        self._last_valid: Optional[PursuitMeasurement] = None
        self._history: List[PursuitMeasurement] = []

    @property
    def tracked_eye_side(self) -> Optional[str]:
        return self.eye_extractor.locked_side

    def reset(self) -> None:
        """Resets tracker state between recordings."""
        self._last_valid = None
        self._history.clear()

    def process_frame(
        self,
        frame: np.ndarray,
        frame_index: int,
        timestamp_ms: float,
    ) -> Tuple[PursuitMeasurement, Optional[FaceLocalizationResult], Tuple[int, int, int, int]]:
        """Processes a single video frame to estimate normalized eye position (in [0, 1]).

        Returns:
            (measurement, face_localization_result, eye_bbox)
        """
        t_int = int(round(timestamp_ms))

        if frame is None or frame.size == 0:
            m = PursuitMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                valid=False,
                error_reason="empty_frame",
            )
            self._history.append(m)
            return m, None, (0, 0, 0, 0)

        h, w = frame.shape[:2]

        # 1. Localize face and ocular boundaries
        face_res = self.face_localizer.localize(frame)
        if not face_res.face_detected:
            m = PursuitMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                valid=False,
                error_reason="no_face_detected",
            )
            self._history.append(m)
            return m, face_res, (0, 0, 0, 0)

        # 2. Extract eye crop
        crop, bbox, is_open, crop_err = self.eye_extractor.extract_crop(frame, face_res)
        if not is_open or crop is None or bbox[2] == 0 or bbox[3] == 0:
            m = PursuitMeasurement(
                frame_index=frame_index,
                t_ms=t_int,
                head_yaw=face_res.head_yaw,
                head_pitch=face_res.head_pitch,
                valid=False,
                error_reason=crop_err or "eye_not_open",
            )
            self._history.append(m)
            return m, face_res, bbox

        # 3. Locate pupil/iris center within crop
        crop_cx, crop_cy, _, _, is_valid_seg, seg_err = self.segmenter.segment(crop)

        if is_valid_seg and crop_cx is not None and crop_cy is not None:
            frame_cx, frame_cy = EyeRegionExtractor.crop_to_frame_coordinates(crop_cx, crop_cy, bbox)
        else:
            # Prefer localized iris center before falling back to static eye bounding box center
            iris_center = (
                face_res.right_iris_center
                if self.tracked_eye_side == EyeSide.RIGHT.value
                else face_res.left_iris_center
            )
            if iris_center is not None:
                frame_cx, frame_cy = float(iris_center[0]), float(iris_center[1])
            else:
                bx, by, bw, bh = bbox
                frame_cx, frame_cy = float(bx + bw / 2.0), float(by + bh / 2.0)

        # Normalize to screen/frame coordinate range [0.0, 1.0]
        norm_eye_x = max(0.0, min(1.0, frame_cx / float(w)))
        norm_eye_y = max(0.0, min(1.0, frame_cy / float(h)))

        # Check for excessive head pose displacement
        err_reason: Optional[str] = None
        if face_res.head_yaw is not None and abs(face_res.head_yaw) > 30.0:
            err_reason = f"excessive_head_yaw_{face_res.head_yaw:.1f}deg"
        elif face_res.head_pitch is not None and abs(face_res.head_pitch) > 30.0:
            err_reason = f"excessive_head_pitch_{face_res.head_pitch:.1f}deg"

        measurement = PursuitMeasurement(
            frame_index=frame_index,
            t_ms=t_int,
            eye_x=round(norm_eye_x, 4),
            eye_y=round(norm_eye_y, 4),
            head_yaw=face_res.head_yaw,
            head_pitch=face_res.head_pitch,
            valid=(err_reason is None),
            error_reason=err_reason,
        )

        if measurement.valid:
            self._last_valid = measurement

        self._history.append(measurement)
        return measurement, face_res, bbox

    def track_sequence(
        self,
        sampled_frames: List[SampledFrame],
    ) -> List[PursuitMeasurement]:
        """Runs pursuit eye-tracking across a sequence of sampled video frames."""
        self.reset()
        results: List[PursuitMeasurement] = []

        for sf in sampled_frames:
            if not sf.is_valid or sf.frame is None:
                m = PursuitMeasurement(
                    frame_index=sf.frame_index,
                    t_ms=int(round(sf.timestamp_ms)),
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
    def _parse_target_trajectory(
        metadata: Optional[Dict[str, Any]],
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        """Extracts and validates target trajectory timestamps and coordinates from metadata."""
        if not metadata:
            return None, None, None

        # Accept "trajectory", "target_trajectory", "target_points", or "target_path"
        # Either as a direct list or a dict containing "coordinates_normalized" / "points"
        raw_traj = (
            metadata.get("trajectory")
            or metadata.get("target_trajectory")
            or metadata.get("target_points")
            or metadata.get("target_path")
        )

        if isinstance(raw_traj, dict):
            raw_traj = raw_traj.get("coordinates_normalized") or raw_traj.get("points")

        if not raw_traj or not isinstance(raw_traj, list):
            return None, None, None

        ts: List[float] = []
        xs: List[float] = []
        ys: List[float] = []

        for pt in raw_traj:
            if not isinstance(pt, dict):
                continue
            t = pt.get("t_ms", pt.get("timestamp_ms", pt.get("t")))
            x = pt.get("x", pt.get("target_x"))
            y = pt.get("y", pt.get("target_y", 0.5))

            if t is not None and x is not None:
                try:
                    ts.append(float(t))
                    xs.append(float(x))
                    ys.append(float(y) if y is not None else 0.5)
                except (ValueError, TypeError):
                    continue

        if len(ts) < 2:
            return None, None, None

        # Sort by timestamp
        order = np.argsort(ts)
        return np.array(ts)[order], np.array(xs)[order], np.array(ys)[order]

    @classmethod
    def align_and_extract_features(
        cls,
        measurements: List[PursuitMeasurement],
        metadata: Optional[Dict[str, Any]] = None,
        config: Optional[AnalysisConfig] = None,
        saccade_threshold: float = 2.0,
    ) -> Tuple[Dict[str, Any], List[PursuitMeasurement], List[str]]:
        """Aligns tracked eye positions with target trajectory and computes pursuit features.

        Args:
            measurements: List of PursuitMeasurement instances from track_sequence.
            metadata: Protocol metadata containing target trajectory points.
            config: Optional AnalysisConfig.
            saccade_threshold: Speed threshold (normalized units/sec) for candidate corrective saccades.

        Returns:
            (features_dict, aligned_measurements, warnings_list)
        """
        warnings: List[str] = []
        features: Dict[str, Any] = {
            "mean_tracking_error": {
                "value": None,
                "unit": "normalized_screen_units",
                "label": "Mean tracking error",
            },
            "tracking_continuity": {
                "value": None,
                "unit": "ratio",
                "label": "Tracking continuity",
            },
            "corrective_movement_count": {
                "value": None,
                "unit": "count",
                "label": "Corrective movement candidates",
            },
        }

        if not measurements:
            warnings.append("[Pursuit] No pursuit measurements supplied.")
            return features, measurements, warnings

        total_frames = len(measurements)
        valid_eye_frames = sum(1 for m in measurements if m.valid and m.eye_x is not None)
        continuity = valid_eye_frames / float(total_frames) if total_frames > 0 else 0.0

        target_ts, target_xs, target_ys = cls._parse_target_trajectory(metadata)

        if target_ts is None:
            warnings.append(
                "[Pursuit] Target trajectory metadata missing or unsynchronized; "
                "tracking error and corrective movements cannot be computed."
            )
            features["tracking_continuity"]["value"] = round(continuity, 4)
            return features, measurements, warnings

        # Temporal bounds of target trajectory
        t_min, t_max = target_ts[0], target_ts[-1]

        aligned_measurements: List[PursuitMeasurement] = []
        tracking_errors: List[float] = []

        for m in measurements:
            t = float(m.t_ms)

            # Interpolate target coordinates
            if t < t_min - 200.0 or t > t_max + 200.0:
                tgt_x, tgt_y = None, None
            else:
                tgt_x = float(np.interp(t, target_ts, target_xs))
                tgt_y = float(np.interp(t, target_ts, target_ys))

            err: Optional[float] = None
            if m.valid and m.eye_x is not None and m.eye_y is not None and tgt_x is not None and tgt_y is not None:
                err = math.hypot(m.eye_x - tgt_x, m.eye_y - tgt_y)
                tracking_errors.append(err)

            aligned_m = PursuitMeasurement(
                frame_index=m.frame_index,
                t_ms=m.t_ms,
                eye_x=m.eye_x,
                eye_y=m.eye_y,
                target_x=round(tgt_x, 4) if tgt_x is not None else None,
                target_y=round(tgt_y, 4) if tgt_y is not None else None,
                tracking_error=round(err, 4) if err is not None else None,
                head_yaw=m.head_yaw,
                head_pitch=m.head_pitch,
                valid=m.valid,
                error_reason=m.error_reason,
            )
            aligned_measurements.append(aligned_m)

        # 1. Tracking Continuity
        features["tracking_continuity"]["value"] = round(continuity, 4)

        # 2. Mean Tracking Error
        if tracking_errors:
            mean_err = float(np.mean(tracking_errors))
            features["mean_tracking_error"]["value"] = round(mean_err, 4)
        else:
            warnings.append("[Pursuit] No overlapping valid frames between eye tracking and target trajectory.")

        # 3. Corrective Movement Candidates (Saccadic repositioning events)
        # Identify rapid velocity spikes where v > saccade_threshold (units/sec)
        saccade_events = 0
        in_saccade = False

        valid_aligned = [m for m in aligned_measurements if m.valid and m.eye_x is not None and m.eye_y is not None]
        for i in range(1, len(valid_aligned)):
            dt_sec = (valid_aligned[i].t_ms - valid_aligned[i - 1].t_ms) / 1000.0
            if 0.005 <= dt_sec <= 0.250:
                dist = math.hypot(
                    valid_aligned[i].eye_x - valid_aligned[i - 1].eye_x,
                    valid_aligned[i].eye_y - valid_aligned[i - 1].eye_y,
                )
                vel = dist / dt_sec

                if vel > saccade_threshold:
                    if not in_saccade:
                        saccade_events += 1
                        in_saccade = True
                else:
                    in_saccade = False
            else:
                in_saccade = False

        features["corrective_movement_count"]["value"] = int(saccade_events)

        return features, aligned_measurements, warnings

    @staticmethod
    def render_debug_overlay(
        frame: np.ndarray,
        measurement: PursuitMeasurement,
        eye_bbox: Tuple[int, int, int, int] = (0, 0, 0, 0),
        face_res: Optional[FaceLocalizationResult] = None,
    ) -> np.ndarray:
        """Renders visual pursuit debug HUD and target-vs-eye indicators onto frame."""
        annotated = frame.copy()
        h, w = frame.shape[:2]

        # Draw eye bounding box
        bx, by, bw, bh = eye_bbox
        if bw > 0 and bh > 0:
            box_col = (0, 255, 0) if measurement.valid else (0, 0, 255)
            cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), box_col, 2)

        # Draw estimated eye position (green dot)
        if measurement.valid and measurement.eye_x is not None and measurement.eye_y is not None:
            ex = int(round(measurement.eye_x * w))
            ey = int(round(measurement.eye_y * h))
            cv2.circle(annotated, (ex, ey), 6, (0, 255, 0), -1)

            # Draw target position (cyan ring) and tracking error vector
            if measurement.target_x is not None and measurement.target_y is not None:
                tx = int(round(measurement.target_x * w))
                ty = int(round(measurement.target_y * h))
                cv2.circle(annotated, (tx, ty), 8, (255, 255, 0), 2)
                cv2.line(annotated, (ex, ey), (tx, ty), (0, 255, 255), 1)

        # HUD Banner
        hud_bg = np.zeros((40, w, 3), dtype=np.uint8)
        err_str = f"{measurement.tracking_error:.3f}" if measurement.tracking_error is not None else "N/A"
        hud_text = (
            f"t: {measurement.t_ms}ms | Eye: ({measurement.eye_x}, {measurement.eye_y}) | "
            f"Target: ({measurement.target_x}, {measurement.target_y}) | Error: {err_str}"
        )
        if not measurement.valid and measurement.error_reason:
            hud_text += f" [{measurement.error_reason}]"

        cv2.putText(annotated, hud_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        return annotated
