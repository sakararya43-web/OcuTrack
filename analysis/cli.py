"""Command Line Interface for OcuTrack Video Quality and Ingestion Engine.

Allows engineers to validate video files, verify decoding, and inspect
recording-quality metrics and warnings.
"""

import argparse
import json
import sys
from pathlib import Path

from analysis.config import AnalysisConfig
from analysis.contracts import QualityStatus
from analysis.pipeline import analyze_assessment
from analysis.quality import assess_video_quality


def main() -> int:
    parser = argparse.ArgumentParser(
        description="OcuTrack Video Ingestion and Quality Assessment CLI"
    )
    parser.add_argument(
        "video_path",
        nargs="?",
        type=str,
        help="Path to a video file to inspect recording quality.",
    )
    parser.add_argument(
        "--pupil",
        type=str,
        help="Path to pupil recording video file.",
    )
    parser.add_argument(
        "--pursuit",
        type=str,
        help="Path to smooth-pursuit recording video file.",
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

    # Mode 1: Assessment pipeline mode (--pupil and/or --pursuit)
    if args.pupil or args.pursuit:
        result = analyze_assessment(
            pupil_video_path=Path(args.pupil) if args.pupil else None,
            pursuit_video_path=Path(args.pursuit) if args.pursuit else None,
            config=config,
        )
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            q = result["quality"]
            print("==================================================")
            print("         OCUTRACK ASSESSMENT QUALITY REPORT       ")
            print("==================================================")
            print(f"Overall Quality Status : {q['status'].upper()}")
            print(f"Usable Frame Ratio     : {q['usable_frame_ratio'] * 100:.1f}%")
            print(f"Warnings Count         : {len(q['warnings'])}")
            for w in q["warnings"]:
                print(f"  - {w}")
            print(f"Pupil Test Status      : {result['pupil']['status']}")
            print(f"Pursuit Test Status    : {result['pursuit']['status']}")
            print("==================================================")

        return 0 if result["quality"]["status"] == QualityStatus.ACCEPTABLE.value else 1

    # Mode 2: Single video inspection mode
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
