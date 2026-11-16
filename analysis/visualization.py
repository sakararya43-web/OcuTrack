"""Engineering visualization and debug plotting utilities for OcuTrack.

Generates reproducible debug figures for pupil-response time-series,
target-vs-eye smooth-pursuit trajectories, and tracking error over time.
Adheres strictly to adityaImplementation.md Section 14 and Section 4.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import matplotlib
matplotlib.use("Agg")  # Headless backend for server and CLI environments
import matplotlib.pyplot as plt
import numpy as np


def plot_pupil_response(
    pupil_series: List[Dict[str, Any]],
    pupil_features: Optional[Dict[str, Any]] = None,
    output_path: Optional[Path | str] = None,
    title: str = "Pupil-Response Time-Series (Technical Evaluation)",
) -> Path:
    """Renders a publication-ready debug plot of pupil diameter dynamics.

    Args:
        pupil_series: List of points containing 't_ms', 'diameter', 'valid'.
        pupil_features: Optional feature dictionary from analyze_assessment().
        output_path: Path to save the PNG image.
        title: Plot title.

    Returns:
        Path to the saved PNG plot file.
    """
    out_p = Path(output_path) if output_path else Path("pupil_response_plot.png")
    out_p.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)

    if not pupil_series:
        ax.text(0.5, 0.5, "No Pupil Series Data Available", ha="center", va="center", transform=ax.transAxes)
        plt.tight_layout()
        plt.savefig(str(out_p))
        plt.close(fig)
        return out_p

    ts = [p["t_ms"] for p in pupil_series]
    diams = [p["diameter"] for p in pupil_series]
    valid_flags = [p.get("valid", True) for p in pupil_series]

    # Valid vs Invalid points
    valid_t = [t for t, d, v in zip(ts, diams, valid_flags) if v and d is not None]
    valid_d = [d for t, d, v in zip(ts, diams, valid_flags) if v and d is not None]
    invalid_t = [t for t, d, v in zip(ts, diams, valid_flags) if not v or d is None]
    invalid_d = [d if d is not None else 0 for t, d, v in zip(ts, diams, valid_flags) if not v or d is None]

    if valid_t:
        ax.plot(valid_t, valid_d, color="#1f77b4", linewidth=2.0, label="Pupil Diameter (px)", zorder=3)
        ax.scatter(valid_t, valid_d, color="#1f77b4", s=15, alpha=0.6, zorder=4)

    if invalid_t:
        ax.scatter(invalid_t, invalid_d, color="#d62728", marker="x", s=30, label="Invalid / Blinks", zorder=5)

    # Feature annotations
    if pupil_features:
        base_d = pupil_features.get("baseline_diameter", {}).get("value")
        min_d = pupil_features.get("minimum_diameter", {}).get("value")
        latency = pupil_features.get("response_latency_seconds", {}).get("value")
        velocity = pupil_features.get("constriction_velocity", {}).get("value")

        if base_d is not None:
            ax.axhline(base_d, color="#2ca02c", linestyle="--", alpha=0.8, label=f"Baseline: {base_d:.1f} px")
        if min_d is not None:
            ax.axhline(min_d, color="#ff7f0e", linestyle="--", alpha=0.8, label=f"Minimum: {min_d:.1f} px")

        # Subtitle with features
        summary_str = f"Baseline: {base_d} px | Min: {min_d} px | Velocity: {velocity} px/s | Latency: {latency} s"
        ax.set_title(f"{title}\n{summary_str}", fontsize=11, fontweight="bold")
    else:
        ax.set_title(title, fontsize=12, fontweight="bold")

    ax.set_xlabel("Time (milliseconds)", fontsize=10)
    ax.set_ylabel("Pupil Diameter (pixels)", fontsize=10)
    ax.grid(True, linestyle=":", alpha=0.6)
    ax.legend(loc="upper right", framealpha=0.9)

    plt.tight_layout()
    plt.savefig(str(out_p))
    plt.close(fig)
    return out_p


def plot_pursuit_tracking(
    pursuit_series: List[Dict[str, Any]],
    pursuit_features: Optional[Dict[str, Any]] = None,
    output_path: Optional[Path | str] = None,
    title: str = "Smooth-Pursuit Eye vs Target Tracking",
) -> Path:
    """Renders target-vs-eye horizontal tracking trajectories and tracking error.

    Args:
        pursuit_series: List of points containing 't_ms', 'eye_x', 'target_x', 'tracking_error', 'valid'.
        pursuit_features: Optional feature dictionary from analyze_assessment().
        output_path: Path to save the PNG image.
        title: Plot title.

    Returns:
        Path to the saved PNG plot file.
    """
    out_p = Path(output_path) if output_path else Path("pursuit_tracking_plot.png")
    out_p.parent.mkdir(parents=True, exist_ok=True)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True, dpi=150, gridspec_kw={"height_ratios": [2, 1]})

    if not pursuit_series:
        ax1.text(0.5, 0.5, "No Pursuit Series Data Available", ha="center", va="center", transform=ax1.transAxes)
        plt.tight_layout()
        plt.savefig(str(out_p))
        plt.close(fig)
        return out_p

    ts = [p["t_ms"] for p in pursuit_series]
    eye_x = [p.get("eye_x") for p in pursuit_series]
    tgt_x = [p.get("target_x") for p in pursuit_series]
    errs = [p.get("tracking_error") for p in pursuit_series]
    valid_flags = [p.get("valid", True) for p in pursuit_series]

    valid_t = [t for t, ex, v in zip(ts, eye_x, valid_flags) if v and ex is not None]
    valid_ex = [ex for t, ex, v in zip(ts, eye_x, valid_flags) if v and ex is not None]
    valid_tx = [tx for t, tx, v in zip(ts, tgt_x, valid_flags) if tx is not None]
    valid_t_target = [t for t, tx, v in zip(ts, tgt_x, valid_flags) if tx is not None]

    # Upper Subplot: Target vs Eye Trajectory
    if valid_t_target:
        ax1.plot(valid_t_target, valid_tx, color="#ff7f0e", linewidth=2.5, linestyle="--", label="Target X (Screen)", zorder=3)
    if valid_t:
        ax1.plot(valid_t, valid_ex, color="#1f77b4", linewidth=2.0, label="Estimated Eye X (Screen)", zorder=4)

    ax1.set_ylabel("Normalized X Position [0, 1]", fontsize=10)
    ax1.set_ylim(-0.05, 1.05)
    ax1.grid(True, linestyle=":", alpha=0.6)
    ax1.legend(loc="upper left")

    if pursuit_features:
        mean_err = pursuit_features.get("mean_tracking_error", {}).get("value")
        cont = pursuit_features.get("tracking_continuity", {}).get("value")
        saccades = pursuit_features.get("corrective_movement_count", {}).get("value")
        feat_str = f"Mean Error: {mean_err} | Continuity: {cont} | Corrective Candidates: {saccades}"
        ax1.set_title(f"{title}\n{feat_str}", fontsize=11, fontweight="bold")
    else:
        ax1.set_title(title, fontsize=12, fontweight="bold")

    # Lower Subplot: Tracking Error
    valid_err_t = [t for t, e, v in zip(ts, errs, valid_flags) if v and e is not None]
    valid_err = [e for t, e, v in zip(ts, errs, valid_flags) if v and e is not None]

    if valid_err_t:
        ax2.fill_between(valid_err_t, 0, valid_err, color="#2ca02c", alpha=0.35, label="Instantaneous Error Vector")
        ax2.plot(valid_err_t, valid_err, color="#2ca02c", linewidth=1.5)

    ax2.set_xlabel("Time (milliseconds)", fontsize=10)
    ax2.set_ylabel("Error (units)", fontsize=10)
    ax2.grid(True, linestyle=":", alpha=0.6)
    ax2.legend(loc="upper right")

    plt.tight_layout()
    plt.savefig(str(out_p))
    plt.close(fig)
    return out_p
