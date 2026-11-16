"""Physiological pupil-response feature extraction.

Calculates baseline diameter, minimum diameter, constriction amplitude,
response latency (stimulus-synchronized), and constriction velocity.
Adheres strictly to adityaImplementation.md Section 9 and Section 17.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from analysis.config import AnalysisConfig
from analysis.contracts import PupilMeasurement


def extract_pupil_features(
    measurements: List[PupilMeasurement],
    metadata: Optional[Dict[str, Any]] = None,
    config: Optional[AnalysisConfig] = None,
) -> Tuple[Dict[str, Any], List[str]]:
    """Extracts physiological pupil-response features from temporal measurements.

    Args:
        measurements: Chronological list of PupilMeasurement instances.
        metadata: Test protocol metadata (e.g. stimulus_onset_ms, baseline_duration_ms).
        config: Analysis configuration settings.

    Returns:
        (features_dict, warnings_list)
        where features_dict strictly adheres to the integration schema:
        - baseline_diameter
        - minimum_diameter
        - constriction_amplitude
        - response_latency_seconds
        - constriction_velocity
    """
    warnings: List[str] = []
    meta = metadata or {}

    # Initial empty feature structure
    features: Dict[str, Any] = {
        "baseline_diameter": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Baseline pupil size",
        },
        "minimum_diameter": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Minimum pupil size",
        },
        "constriction_amplitude": {
            "value": None,
            "unit": "px_or_normalized",
            "label": "Constriction amplitude",
        },
        "response_latency_seconds": {
            "value": None,
            "unit": "s",
            "label": "Pupil response latency",
        },
        "constriction_velocity": {
            "value": None,
            "unit": "px_or_normalized per second",
            "label": "Constriction velocity",
        },
    }

    if not measurements:
        warnings.append("[Pupil Features] No pupil measurements supplied.")
        return features, warnings

    # Extract valid measurements sorted chronologically
    valid_pts = [m for m in measurements if m.valid and m.diameter is not None and m.diameter > 0]
    total_count = len(measurements)
    valid_count = len(valid_pts)

    if valid_count < 5:
        warnings.append(
            f"[Pupil Features] Insufficient valid pupil measurements ({valid_count}/{total_count}); "
            "features returned as null."
        )
        return features, warnings

    timestamps = np.array([m.t_ms for m in valid_pts], dtype=float)
    raw_diameters = np.array([m.diameter for m in valid_pts], dtype=float)

    # 1. Temporal Smoothing
    # Apply 3-point moving median + moving average to eliminate single-frame segmentation glitches
    if len(raw_diameters) >= 5:
        smoothed = np.copy(raw_diameters)
        for i in range(1, len(raw_diameters) - 1):
            smoothed[i] = np.median(raw_diameters[max(0, i - 1) : min(len(raw_diameters), i + 2)])
    else:
        smoothed = raw_diameters

    # 2. Stimulus Onset and Baseline Interval
    stimulus_onset_ms: Optional[float] = None
    if "stimulus_onset_ms" in meta and meta["stimulus_onset_ms"] is not None:
        try:
            stimulus_onset_ms = float(meta["stimulus_onset_ms"])
        except (ValueError, TypeError):
            stimulus_onset_ms = None
            warnings.append("[Pupil Features] Invalid stimulus_onset_ms format in metadata.")

    # Determine baseline window
    if stimulus_onset_ms is not None:
        baseline_mask = timestamps <= stimulus_onset_ms
        if np.sum(baseline_mask) < 3:
            # Fall back to initial 20% of frames if pre-stimulus frames are too sparse
            warnings.append(
                "[Pupil Features] Fewer than 3 valid samples before stimulus onset; "
                "using initial recording window for baseline estimation."
            )
            k = max(3, int(len(smoothed) * 0.20))
            baseline_samples = smoothed[:k]
        else:
            baseline_samples = smoothed[baseline_mask]
    else:
        # Stimulus onset not provided: use the first 500ms or initial 20% of recording
        warnings.append(
            "[Pupil Features] stimulus_onset_ms not provided in metadata; "
            "response latency returned as null and baseline estimated from initial window."
        )
        duration_ms = timestamps[-1] - timestamps[0]
        baseline_cutoff = timestamps[0] + min(500.0, duration_ms * 0.25)
        baseline_mask = timestamps <= baseline_cutoff
        baseline_samples = smoothed[baseline_mask] if np.sum(baseline_mask) >= 3 else smoothed[:3]

    # Baseline diameter: robust median of baseline samples
    baseline_val = float(np.median(baseline_samples))
    features["baseline_diameter"]["value"] = round(baseline_val, 2)

    # 3. Minimum Diameter & Response Window
    if stimulus_onset_ms is not None:
        response_mask = timestamps >= stimulus_onset_ms
        response_samples = smoothed[response_mask]
        response_timestamps = timestamps[response_mask]
    else:
        response_samples = smoothed
        response_timestamps = timestamps

    if len(response_samples) < 3:
        warnings.append("[Pupil Features] Insufficient post-stimulus samples to compute minimum diameter.")
        return features, warnings

    # Minimum diameter: robust 5th percentile or minimum of smoothed curve
    min_val = float(np.min(response_samples))
    features["minimum_diameter"]["value"] = round(min_val, 2)

    # 4. Constriction Amplitude
    amplitude = max(0.0, baseline_val - min_val)
    features["constriction_amplitude"]["value"] = round(amplitude, 2)

    # 5. Constriction Velocity
    # Compute timestamp-aware derivatives over the contraction interval
    # Disregard temporal steps across gaps > 250ms
    velocities: List[float] = []
    # Identify index of minimum diameter in smoothed response
    min_idx_global = int(np.argmin(smoothed))

    for i in range(1, len(smoothed)):
        dt_ms = timestamps[i] - timestamps[i - 1]
        if 5.0 <= dt_ms <= 250.0:
            # Positive velocity = constriction (decreasing diameter)
            rate_px_per_sec = (smoothed[i - 1] - smoothed[i]) / (dt_ms / 1000.0)
            if i <= min_idx_global:
                velocities.append(rate_px_per_sec)

    if velocities:
        # Peak constriction velocity (positive contraction speed)
        peak_velocity = max(0.0, float(np.max(velocities)))
        features["constriction_velocity"]["value"] = round(peak_velocity, 2)
    else:
        warnings.append("[Pupil Features] Could not compute constriction velocity due to irregular sampling gaps.")

    # 6. Response Latency (Strictly conditional on reliable stimulus onset)
    if stimulus_onset_ms is None:
        features["response_latency_seconds"]["value"] = None
    else:
        # Clinical definition: time from stimulus onset until pupil decreases by 10% of total constriction amplitude
        if amplitude > 0.5:  # Require detectable constriction (> 0.5px)
            threshold_diam = baseline_val - (0.10 * amplitude)
            constriction_start_t: Optional[float] = None

            for t, d in zip(response_timestamps, response_samples):
                if t >= stimulus_onset_ms and d <= threshold_diam:
                    constriction_start_t = t
                    break

            if constriction_start_t is not None:
                latency_sec = (constriction_start_t - stimulus_onset_ms) / 1000.0
                if 0.05 <= latency_sec <= 2.0:
                    features["response_latency_seconds"]["value"] = round(latency_sec, 3)
                else:
                    features["response_latency_seconds"]["value"] = round(latency_sec, 3)
                    warnings.append(
                        f"[Pupil Features] Atypical response latency ({latency_sec:.3f}s) outside "
                        "typical physiological range (0.15s - 0.60s)."
                    )
            else:
                features["response_latency_seconds"]["value"] = None
                warnings.append("[Pupil Features] Pupil did not constrict past 10% amplitude threshold.")
        else:
            features["response_latency_seconds"]["value"] = None
            warnings.append("[Pupil Features] Negligible pupil constriction; latency cannot be determined.")

    return features, warnings
