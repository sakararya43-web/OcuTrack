"""Time-series preprocessing, resampling, normalization, and feature masking for Ocular TCN.

Adheres strictly to adityaImplementation.md Section 12.2 and Section 12.3.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


@dataclass
class PreprocessingConfig:
    """Configuration parameters for time-series resampling and normalization."""

    target_sequence_length: int = 128
    resample_method: str = "linear"  # "linear" or "nearest"
    normalize: bool = True
    fill_missing_value: float = 0.0


class TimeSeriesPreprocessor:
    """Preprocesses raw pupil and pursuit series into fixed-length normalized tensor arrays."""

    def __init__(self, config: Optional[PreprocessingConfig] = None):
        self.config = config or PreprocessingConfig()

    def prepare_pupil_sequence(
        self,
        pupil_series: List[Dict[str, Any]],
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Preprocesses pupil series into (channels, sequence_length) array.

        Channels:
            0: Normalized pupil diameter
            1: Pupil contraction velocity (approximate)
            2: Validity mask (1.0 = valid, 0.0 = invalid/missing)

        Returns:
            (sequence_array, timestamps)
            sequence_array shape: (3, target_sequence_length)
        """
        L = self.config.target_sequence_length
        if not pupil_series:
            return np.zeros((3, L), dtype=np.float32), np.linspace(0, 1000, L)

        ts = np.array([p.get("t_ms", 0) for p in pupil_series], dtype=np.float32)
        diams = np.array([p.get("diameter") if p.get("valid") else np.nan for p in pupil_series], dtype=np.float32)
        valid_mask = np.array([1.0 if p.get("valid") and p.get("diameter") is not None else 0.0 for p in pupil_series], dtype=np.float32)

        # Uniform target timestamps
        t_start, t_end = ts[0], ts[-1]
        if t_end <= t_start:
            t_end = t_start + 1000.0
        target_t = np.linspace(t_start, t_end, L, dtype=np.float32)

        # Resample validity mask
        resampled_mask = np.interp(target_t, ts, valid_mask)
        resampled_mask = (resampled_mask >= 0.5).astype(np.float32)

        # Interpolate diameter
        valid_indices = np.where(~np.isnan(diams))[0]
        if len(valid_indices) >= 2:
            resampled_diam = np.interp(target_t, ts[valid_indices], diams[valid_indices])
        elif len(valid_indices) == 1:
            resampled_diam = np.full(L, diams[valid_indices[0]], dtype=np.float32)
        else:
            resampled_diam = np.zeros(L, dtype=np.float32)

        # Normalize diameter if requested
        if self.config.normalize:
            mean_val = np.mean(resampled_diam[resampled_mask > 0]) if np.any(resampled_mask > 0) else np.mean(resampled_diam)
            std_val = np.std(resampled_diam[resampled_mask > 0]) if np.any(resampled_mask > 0) else np.std(resampled_diam)
            if std_val > 1e-4:
                resampled_diam = (resampled_diam - mean_val) / std_val
            else:
                resampled_diam = resampled_diam - mean_val

        # Approximate velocity
        dt = np.gradient(target_t) / 1000.0  # seconds
        dt[dt <= 0] = 1e-3
        velocity = np.gradient(resampled_diam) / dt
        # Zero out invalid regions
        velocity = velocity * resampled_mask
        resampled_diam = resampled_diam * resampled_mask

        features = np.stack([resampled_diam, velocity, resampled_mask], axis=0).astype(np.float32)
        return features, target_t

    def prepare_pursuit_sequence(
        self,
        pursuit_series: List[Dict[str, Any]],
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Preprocesses pursuit series into (channels, sequence_length) array.

        Channels:
            0: Eye X coordinate [0, 1]
            1: Eye Y coordinate [0, 1]
            2: Target X coordinate [0, 1]
            3: Target Y coordinate [0, 1]
            4: Tracking error [0, 1]
            5: Validity mask (1.0 = valid, 0.0 = invalid)

        Returns:
            (sequence_array, timestamps)
            sequence_array shape: (6, target_sequence_length)
        """
        L = self.config.target_sequence_length
        if not pursuit_series:
            return np.zeros((6, L), dtype=np.float32), np.linspace(0, 1000, L)

        ts = np.array([p.get("t_ms", 0) for p in pursuit_series], dtype=np.float32)
        eye_x = np.array([p.get("eye_x") if p.get("valid") else np.nan for p in pursuit_series], dtype=np.float32)
        eye_y = np.array([p.get("eye_y") if p.get("valid") else np.nan for p in pursuit_series], dtype=np.float32)
        tgt_x = np.array([p.get("target_x") if p.get("target_x") is not None else 0.5 for p in pursuit_series], dtype=np.float32)
        tgt_y = np.array([p.get("target_y") if p.get("target_y") is not None else 0.5 for p in pursuit_series], dtype=np.float32)
        err = np.array([p.get("tracking_error") if p.get("valid") and p.get("tracking_error") is not None else np.nan for p in pursuit_series], dtype=np.float32)
        mask = np.array([1.0 if p.get("valid") and p.get("eye_x") is not None else 0.0 for p in pursuit_series], dtype=np.float32)

        t_start, t_end = ts[0], ts[-1]
        if t_end <= t_start:
            t_end = t_start + 1000.0
        target_t = np.linspace(t_start, t_end, L, dtype=np.float32)

        # Interpolate components
        res_mask = (np.interp(target_t, ts, mask) >= 0.5).astype(np.float32)
        res_tgt_x = np.interp(target_t, ts, tgt_x).astype(np.float32)
        res_tgt_y = np.interp(target_t, ts, tgt_y).astype(np.float32)

        v_idx = np.where(~np.isnan(eye_x))[0]
        if len(v_idx) >= 2:
            res_eye_x = np.interp(target_t, ts[v_idx], eye_x[v_idx]).astype(np.float32)
            res_eye_y = np.interp(target_t, ts[v_idx], eye_y[v_idx]).astype(np.float32)
        elif len(v_idx) == 1:
            res_eye_x = np.full(L, eye_x[v_idx[0]], dtype=np.float32)
            res_eye_y = np.full(L, eye_y[v_idx[0]], dtype=np.float32)
        else:
            res_eye_x = np.full(L, 0.5, dtype=np.float32)
            res_eye_y = np.full(L, 0.5, dtype=np.float32)

        e_idx = np.where(~np.isnan(err))[0]
        if len(e_idx) >= 2:
            res_err = np.interp(target_t, ts[e_idx], err[e_idx]).astype(np.float32)
        elif len(e_idx) == 1:
            res_err = np.full(L, err[e_idx[0]], dtype=np.float32)
        else:
            res_err = np.zeros(L, dtype=np.float32)

        res_eye_x = res_eye_x * res_mask
        res_eye_y = res_eye_y * res_mask
        res_err = res_err * res_mask

        features = np.stack([res_eye_x, res_eye_y, res_tgt_x, res_tgt_y, res_err, res_mask], axis=0).astype(np.float32)
        return features, target_t
