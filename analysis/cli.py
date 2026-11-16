"""Command Line Interface for OcuTrack Video Quality, Pupil Tracking, and Smooth Pursuit Engine.

Allows engineers to validate video files, verify decoding, inspect
recording-quality metrics, run pupil segmentation, extract physiological features,
and evaluate smooth-pursuit tracking against target trajectories.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import cv2

from analysis.config import AnalysisConfig
from analysis.contracts import QualityStatus
from analysis.frame_sampling import sample_frames
from analysis.pipeline import analyze_assessment
from analysis.pupil_tracking import PupilTracker
from analysis.pursuit_tracking import PursuitTracker
from analysis.quality import assess_video_quality
from analysis.video_io import VideoReader


def _load_metadata(raw_arg: Optional[str]) -> Optional[Dict[str, Any]]:
    """Parses JSON metadata from either a file path or direct JSON string."""
    if not raw_arg:
        return None
    p = Path(raw_arg)
    if p.exists() and p.is_file():
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to parse metadata file {p}: {e}", file=sys.stderr)
            return None
    try:
        return json.loads(raw_arg)
    except Exception:
        print(f"Warning: Could not parse metadata argument as JSON: {raw_arg}", file=sys.stderr)
        return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="OcuTrack Assessment, Pupil Response, and Smooth-Pursuit Analysis CLI"
    )
    parser.add_argument(
        "video_path",
        nargs="?",
        type=str,
        help="Path to a video file to inspect recording quality or track.",
    )
    parser.add_argument(
        "--pupil",
        type=str,
        help="Path to pupil recording video file for full assessment analysis.",
    )
    parser.add_argument(
        "--pursuit",
        type=str,
        help="Path to smooth-pursuit recording video file.",
    )
    parser.add_argument(
        "--pupil-metadata",
        type=str,
        help="JSON string or file path containing pupil test metadata (stimulus_onset_ms, etc.).",
    )
    parser.add_argument(
        "--pursuit-metadata",
        type=str,
        help="JSON string or file path containing pursuit test metadata (trajectory points, etc.).",
    )
    parser.add_argument(
        "--track-pupil",
        action="store_true",
        help="Execute face localization, eye cropping, and OpenCV pupil tracking on video_path.",
    )
    parser.add_argument(
        "--track-pursuit",
        action="store_true",
        help="Execute face localization and smooth-pursuit eye tracking on video_path.",
    )
    parser.add_argument(
        "--eye-side",
        choices=["left", "right", "auto"],
        default="auto",
        help="Eye side to lock for tracking (default: auto).",
    )
    parser.add_argument(
        "--debug-frames-dir",
        type=str,
        help="Directory path to save annotated visual debug frames.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output result as formatted JSON.",
    )
    parser.add_argument(
        "--target-fps",
        type=float,
        default=30.0,
        help="Target sampling frame rate (default: 30.0).",
    )
    parser.add_argument(
        "--min-fps",
        type=float,
        default=15.0,
        help="Minimum acceptable frame rate (default: 15.0).",
    )
    parser.add_argument(
        "--min-duration",
        type=float,
        default=2.0,
        help="Minimum required duration in seconds (default: 2.0).",
    )

    args = parser.parse_args()

    # Build config overrides
    config = AnalysisConfig(
        target_fps=args.target_fps,
        min_fps=args.min_fps,
        min_duration_sec=args.min_duration,
    )

    pupil_meta = _load_metadata(args.pupil_metadata) or {}
    if "preferred_eye" not in pupil_meta:
        pupil_meta["preferred_eye"] = args.eye_side

    pursuit_meta = _load_metadata(args.pursuit_metadata) or {}
    if "preferred_eye" not in pursuit_meta:
        pursuit_meta["preferred_eye"] = args.eye_side

    # Mode 1: Assessment pipeline mode (--pupil and/or --pursuit)
    if args.pupil or args.pursuit:
        result = analyze_assessment(
            pupil_video_path=Path(args.pupil) if args.pupil else None,
            pursuit_video_path=Path(args.pursuit) if args.pursuit else None,
            pupil_metadata=pupil_meta,
            pursuit_metadata=pursuit_meta,
            config=config,
        )
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            q = result["quality"]
            print("==================================================")
            print("         OCUTRACK ASSESSMENT PIPELINE REPORT      ")
            print("==================================================")
            print(f"Overall Quality Status : {q['status'].upper()}")
            print(f"Usable Frame Ratio     : {q['usable_frame_ratio'] * 100:.1f}%")
            print(f"Warnings Count         : {len(q['warnings'])}")
            for w in q["warnings"]:
                print(f"  - {w}")

            print("--------------------------------------------------")
            print(f"Pupil Test Status      : {result['pupil']['status']}")
            if result['pupil'].get('series'):
                valid_pts = sum(1 for p in result['pupil']['series'] if p.get('valid'))
                total_pts = len(result['pupil']['series'])
                print(f"Pupil Tracked Points   : {valid_pts}/{total_pts} valid frames")
            if result['pupil'].get('features'):
                print("Extracted Pupil Features:")
                for fk, fv in result['pupil']['features'].items():
                    val_str = f"{fv['value']} {fv['unit']}" if fv['value'] is not None else "null"
                    print(f"  - {fv['label']:26s}: {val_str}")

            print("--------------------------------------------------")
            print(f"Pursuit Test Status    : {result['pursuit']['status']}")
            if result['pursuit'].get('series'):
                valid_pts = sum(1 for p in result['pursuit']['series'] if p.get('valid'))
                total_pts = len(result['pursuit']['series'])
                print(f"Pursuit Tracked Points : {valid_pts}/{total_pts} valid frames")
            if result['pursuit'].get('features'):
                print("Extracted Pursuit Features:")
                for fk, fv in result['pursuit']['features'].items():
                    val_str = f"{fv['value']} {fv['unit']}" if fv['value'] is not None else "null"
                    print(f"  - {fv['label']:26s}: {val_str}")
            print("==================================================")

        return 0 if result["quality"]["status"] == QualityStatus.ACCEPTABLE.value else 1

    # Mode 2: Pupil tracking on single video
    if args.video_path and args.track_pupil:
        video_p = Path(args.video_path)
        q_res = assess_video_quality(video_p, config)
        if q_res.status == QualityStatus.INSUFFICIENT:
            print(f"Error: Video quality insufficient for pupil tracking: {q_res.warnings}", file=sys.stderr)
            return 1

        tracker = PupilTracker(preferred_eye_side=args.eye_side)
        measurements = []
        debug_dir = Path(args.debug_frames_dir) if args.debug_frames_dir else None
        if debug_dir:
            debug_dir.mkdir(parents=True, exist_ok=True)

        with VideoReader(video_p, config) as reader:
            sampled_frames, _, _ = sample_frames(reader, config)
            for sf in sampled_frames:
                if sf.is_valid and sf.frame is not None:
                    m, face_res, eye_bbox = tracker.process_frame(sf.frame, sf.frame_index, sf.timestamp_ms)
                    measurements.append(m)
                    if debug_dir:
                        annotated = PupilTracker.render_debug_overlay(sf.frame, m, eye_bbox, face_res)
                        out_file = debug_dir / f"pupil_{sf.frame_index:04d}_{m.t_ms}ms.jpg"
                        cv2.imwrite(str(out_file), annotated)

        valid_count = sum(1 for m in measurements if m.valid)
        total_count = len(measurements)
        valid_diams = [m.diameter for m in measurements if m.valid and m.diameter is not None]

        summary = {
            "path": str(video_p),
            "tracked_eye": tracker.tracked_eye_side,
            "total_frames": total_count,
            "valid_frames": valid_count,
            "continuity": round(valid_count / total_count, 4) if total_count > 0 else 0.0,
            "mean_diameter_px": round(float(sum(valid_diams) / len(valid_diams)), 2) if valid_diams else None,
            "series": [m.to_dict() for m in measurements],
        }

        if args.json:
            print(json.dumps(summary, indent=2))
        else:
            print("==================================================")
            print("         OCUTRACK PUPIL TRACKING REPORT           ")
            print("==================================================")
            print(f"File Path          : {summary['path']}")
            print(f"Tracked Eye Side   : {summary['tracked_eye']}")
            print(f"Valid Frames       : {valid_count} / {total_count} ({summary['continuity'] * 100:.1f}%)")
            print(f"Mean Pupil Size    : {summary['mean_diameter_px']} px")
            if debug_dir:
                print(f"Debug Frames Saved : {debug_dir}")
            print("==================================================")

        return 0 if valid_count > 0 else 1

    # Mode 3: Pursuit tracking on single video
    if args.video_path and args.track_pursuit:
        video_p = Path(args.video_path)
        q_res = assess_video_quality(video_p, config)
        if q_res.status == QualityStatus.INSUFFICIENT:
            print(f"Error: Video quality insufficient for pursuit tracking: {q_res.warnings}", file=sys.stderr)
            return 1

        tracker = PursuitTracker(preferred_eye_side=args.eye_side)
        measurements = []
        debug_dir = Path(args.debug_frames_dir) if args.debug_frames_dir else None
        if debug_dir:
            debug_dir.mkdir(parents=True, exist_ok=True)

        with VideoReader(video_p, config) as reader:
            sampled_frames, _, _ = sample_frames(reader, config)
            for sf in sampled_frames:
                if sf.is_valid and sf.frame is not None:
                    m, face_res, eye_bbox = tracker.process_frame(sf.frame, sf.frame_index, sf.timestamp_ms)
                    measurements.append(m)
                    if debug_dir:
                        annotated = PursuitTracker.render_debug_overlay(sf.frame, m, eye_bbox, face_res)
                        out_file = debug_dir / f"pursuit_{sf.frame_index:04d}_{m.t_ms}ms.jpg"
                        cv2.imwrite(str(out_file), annotated)

        features, aligned_measurements, warnings = PursuitTracker.align_and_extract_features(
            measurements=measurements,
            metadata=pursuit_meta,
            config=config,
        )

        valid_count = sum(1 for m in aligned_measurements if m.valid and m.eye_x is not None)
        total_count = len(aligned_measurements)

        summary = {
            "path": str(video_p),
            "tracked_eye": tracker.tracked_eye_side,
            "total_frames": total_count,
            "valid_frames": valid_count,
            "features": features,
            "warnings": warnings,
            "series": [m.to_dict() for m in aligned_measurements],
        }

        if args.json:
            print(json.dumps(summary, indent=2))
        else:
            print("==================================================")
            print("         OCUTRACK PURSUIT TRACKING REPORT         ")
            print("==================================================")
            print(f"File Path          : {summary['path']}")
            print(f"Tracked Eye Side   : {summary['tracked_eye']}")
            print(f"Valid Frames       : {valid_count} / {total_count}")
            print("Extracted Features:")
            for fk, fv in features.items():
                val_str = f"{fv['value']} {fv['unit']}" if fv['value'] is not None else "null"
                print(f"  - {fv['label']:26s}: {val_str}")
            if debug_dir:
                print(f"Debug Frames Saved : {debug_dir}")
            print("==================================================")

        return 0 if valid_count > 0 else 1

    # Mode 4: Single video quality inspection mode
    if args.video_path:
        q_res = assess_video_quality(Path(args.video_path), config)
        res_dict = q_res.to_dict()

        if args.json:
            print(json.dumps(res_dict, indent=2))
        else:
            print("==================================================")
            print("         OCUTRACK VIDEO QUALITY REPORT            ")
            print("==================================================")
            print(f"File Path          : {args.video_path}")
            print(f"Quality Status     : {q_res.status.value.upper()}")
            print(f"Usable Frame Ratio : {q_res.usable_frame_ratio * 100:.1f}%")
            print("Details:")
            for k, v in q_res.details.items():
                print(f"  {k:20s}: {v}")
            print(f"Warnings ({len(q_res.warnings)}):")
            for w in q_res.warnings:
                print(f"  - {w}")
            print("==================================================")

        return 0 if q_res.status == QualityStatus.ACCEPTABLE else 1

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
