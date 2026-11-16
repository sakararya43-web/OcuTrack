from typing import Tuple
from app.db.models import AssessmentModel
from app.schemas.common import QualityStatus


def check_comparability(
    current: AssessmentModel,
    baseline: AssessmentModel,
) -> Tuple[bool, str]:
    """
    Evaluates comparability between two assessments according to PRD section 8.2:
    - Recording quality status
    - Protocol version consistency
    - Shared valid biometric feature availability
    - Lighting condition compatibility
    """
    # 1. Quality check
    if current.quality_status == QualityStatus.INSUFFICIENT.value:
        return False, "Current assessment has insufficient recording quality."
    if baseline.quality_status == QualityStatus.INSUFFICIENT.value:
        return False, "Baseline assessment has insufficient recording quality."

    # 2. Protocol version check
    if current.protocol_version != baseline.protocol_version:
        return False, f"Protocol version mismatch ({current.protocol_version} vs {baseline.protocol_version})."

    # 3. Lighting metadata check (if specified)
    if current.lighting_metadata and baseline.lighting_metadata:
        curr_light = current.lighting_metadata.get("method")
        base_light = baseline.lighting_metadata.get("method")
        if curr_light and base_light and curr_light != base_light:
            return False, f"Lighting procedure mismatch ({curr_light} vs {base_light})."

    # 4. Overlapping features check
    curr_features = {
        m.feature_name: m for m in (current.measurements or []) if m.feature_value is not None
    }
    base_features = {
        m.feature_name: m for m in (baseline.measurements or []) if m.feature_value is not None
    }
    shared_names = set(curr_features.keys()).intersection(set(base_features.keys()))

    if not shared_names:
        return False, "No overlapping valid biometric features available to compare."

    # Check units match on shared features
    for name in shared_names:
        if curr_features[name].unit != base_features[name].unit:
            return False, f"Measurement unit mismatch on feature '{name}' ({curr_features[name].unit} vs {base_features[name].unit})."

    return True, "Matching protocol version and acceptable recording quality."

