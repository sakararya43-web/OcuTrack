import re
from pathlib import Path
from typing import Optional


def mask_secret(secret: Optional[str]) -> str:
    """Masks sensitive credentials or API keys for safe display in logs/diagnostics."""
    if not secret:
        return ""
    if len(secret) <= 8:
        return "********"
    return f"{secret[:4]}...{secret[-4:]}"


def is_safe_path(target_path: Path, base_dir: Path) -> bool:
    """Verifies that a target file path does not escape the designated base directory."""
    try:
        resolved_target = target_path.resolve()
        resolved_base = base_dir.resolve()
        return str(resolved_target).startswith(str(resolved_base))
    except (ValueError, RuntimeError):
        return False


def sanitize_identifier(value: str) -> str:
    """Sanitizes user-provided identifiers against path traversal and control characters."""
    # Allow alphanumeric characters, hyphens, and underscores only
    return re.sub(r"[^a-zA-Z0-9_\-]", "", value.strip())
