import os
import uuid
import json
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import cv2
from fastapi import UploadFile

from app.core.config import settings
from app.core.errors import ValidationError

ALLOWED_MIME_TYPES = {
    "video/webm",
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "application/octet-stream",  # Frequently reported by browser blobs in some configurations
}

ALLOWED_EXTENSIONS = {".webm", ".mp4", ".mov", ".mkv"}


def get_upload_dir() -> Path:
    """Returns and ensures existence of the temporary upload directory."""
    path = Path(settings.TEMP_UPLOAD_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def validate_metadata_json(raw_json: Optional[str]) -> Dict[str, Any]:
    """Validates and parses metadata_json form payload."""
    if not raw_json or not raw_json.strip():
        return {}
    try:
        data = json.loads(raw_json)
        if not isinstance(data, dict):
            raise ValidationError("metadata_json must be a valid JSON object.")
        return data
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid metadata_json payload: {str(e)}")


async def save_and_validate_video(
    file: UploadFile,
    test_type: str,
    assessment_id: str,
) -> Path:
    """
    Safely saves an uploaded video stream to a private temporary directory,
    validates file size, decodability via OpenCV, frame integrity, and duration.
    Deletes the temporary file on any validation failure.
    """
    upload_dir = get_upload_dir()

    # 1. Basic filename / extension check
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # 2. Content-type check
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f"Unsupported MIME type '{content_type}'. Supported video types: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    # 3. Server-generated safe temporary path to prevent path traversal
    safe_filename = f"{assessment_id}_{test_type}_{uuid.uuid4().hex}.webm"
    temp_path = upload_dir / safe_filename

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    total_bytes = 0

    try:
        with open(temp_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunk
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise ValidationError(
                        f"Video file exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB."
                    )
                f.write(chunk)
    except Exception:
        # Cleanup partial file on read/write exception
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        raise

    # 4. Empty file check
    if total_bytes == 0:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        raise ValidationError("Uploaded video file is empty.")

    # 5. Decode and duration validation using OpenCV
    try:
        cap = cv2.VideoCapture(str(temp_path))
        if not cap.isOpened():
            raise ValidationError("Uploaded video file could not be decoded or container is unsupported.")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)

        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None or frame.size == 0:
            raise ValidationError("Uploaded video contains no decodable frames or is corrupted.")

        # Duration validation (with small 5s tolerance buffer for browser MediaRecorder timestamp jitter)
        if fps > 0 and frame_count > 0:
            duration_s = frame_count / fps
            max_allowed = settings.MAX_VIDEO_SECONDS + 5
            if duration_s > max_allowed:
                raise ValidationError(
                    f"Video duration ({duration_s:.1f}s) exceeds maximum allowed {settings.MAX_VIDEO_SECONDS}s."
                )

    except Exception as e:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        if isinstance(e, ValidationError):
            raise
        raise ValidationError(f"Failed to decode and validate video: {str(e)}")

    return temp_path


def cleanup_file(path_str: Optional[str]) -> bool:
    """Safely removes a temporary file if it exists."""
    if not path_str:
        return False
    try:
        p = Path(path_str)
        if p.exists() and p.is_file():
            p.unlink()
            return True
    except Exception:
        pass
    return False
