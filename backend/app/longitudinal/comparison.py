from typing import Optional, Dict, Any, Tuple, List
from sqlalchemy.orm import Session

from app.db.models import AssessmentModel, ComparisonModel, utc_now
from app.schemas.common import AssessmentStatus, QualityStatus
from app.longitudinal.comparability import check_comparability

# Human-readable labels for report review messages
FEATURE_LABELS = {
    "baseline_diameter": "baseline pupil diameter",
    "constriction_latency": "constriction latency",
    "constriction_velocity": "constriction velocity",
    "constriction_amplitude": "constriction amplitude",
    "dilation_velocity": "dilation velocity",
    "tracking_gain": "smooth pursuit gain",
    "rmse_error": "gaze tracking RMSE",
    "saccadic_intrusions": "catch-up saccades",
}

# Configurable prototype thresholds for technical change highlighting
FEATURE_CHANGE_THRESHOLDS = {
    "constriction_latency": 15.0,    # ms
    "latency_ms": 15.0,             # ms
    "constriction_velocity": 0.30,  # mm/s
    "constriction_amplitude": 4.0,   # %
    "dilation_velocity": 0.25,      # mm/s
    "tracking_gain": 0.05,          # ratio
    "rmse_error": 0.02,             # norm
    "saccadic_intrusions": 1.0,     # count
}


def find_baseline_assessment(
    patient_id: str,
    db: Session,
    preferred_baseline_id: Optional[str] = None,
    exclude_assessment_id: Optional[str] = None,
) -> Optional[AssessmentModel]:
    """
    Selects the patient's approved baseline or earliest acceptable prior assessment.
    Excludes failed or insufficient-quality recordings.
    """
    query = db.query(AssessmentModel).filter(
        AssessmentModel.patient_id == patient_id,
        AssessmentModel.status == AssessmentStatus.COMPLETE.value,
        AssessmentModel.quality_status == QualityStatus.ACCEPTABLE.value,
    )
    if exclude_assessment_id:
        query = query.filter(AssessmentModel.id != exclude_assessment_id)

    # 1. Check preferred baseline ID if provided
    if preferred_baseline_id:
        preferred = query.filter(AssessmentModel.id == preferred_baseline_id).first()
        if preferred:
            return preferred

    # 2. Check explicitly marked baseline
    marked_baseline = query.filter(AssessmentModel.is_baseline == True).first()
    if marked_baseline:
        return marked_baseline

    # 3. Fallback to earliest acceptable completed assessment
    earliest = query.order_by(AssessmentModel.assessment_at.asc()).first()
    return earliest


def calculate_feature_deltas(
    current: AssessmentModel,
    baseline: AssessmentModel,
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Computes absolute deltas and change directions for shared biometric features.
    """
    curr_map = {m.feature_name: m for m in (current.measurements or [])}
    base_map = {m.feature_name: m for m in (baseline.measurements or [])}

    feature_deltas = {}
    changed_labels = []

    for name, curr_m in curr_map.items():
        if name in base_map:
            base_m = base_map[name]
            if curr_m.feature_value is not None and base_m.feature_value is not None:
                delta = round(curr_m.feature_value - base_m.feature_value, 3)
                threshold = FEATURE_CHANGE_THRESHOLDS.get(name, 0.05)

                if abs(delta) < threshold:
                    direction = "stable"
                elif delta > 0:
                    direction = "increased"
                    changed_labels.append(FEATURE_LABELS.get(name, name.replace("_", " ")))
                else:
                    direction = "decreased"
                    changed_labels.append(FEATURE_LABELS.get(name, name.replace("_", " ")))

                feature_deltas[name] = {
                    "delta": delta,
                    "unit": curr_m.unit,
                    "direction": direction,
                }
            else:
                feature_deltas[name] = {
                    "delta": None,
                    "unit": curr_m.unit,
                    "direction": "unknown",
                }

    return feature_deltas, changed_labels


def evaluate_longitudinal_comparison(
    current: AssessmentModel,
    db: Session,
    preferred_baseline_id: Optional[str] = None,
) -> Optional[ComparisonModel]:
    """
    Evaluates longitudinal comparison against prior accepted baseline:
    - If first accepted assessment, establishes baseline.
    - If prior exists, checks comparability and calculates feature deltas.
    - Persists comparison provenance to the database.
    - Updates neutral review message on the assessment.
    """
    # Find candidate baseline
    baseline = find_baseline_assessment(
        patient_id=current.patient_id,
        db=db,
        preferred_baseline_id=preferred_baseline_id,
        exclude_assessment_id=current.id,
    )

    # First visit case: Establish baseline
    if not baseline:
        if current.quality_status == QualityStatus.ACCEPTABLE.value:
            current.is_baseline = True
            current.review_message = (
                "Baseline established. Future assessments can be compared when recording conditions are sufficiently similar."
            )
            db.commit()
            db.refresh(current)
        return None

    # Check comparability
    is_comparable, reason = check_comparability(current, baseline)

    if current.quality_status == QualityStatus.INSUFFICIENT.value:
        review_msg = "Insufficient recording quality — repeat test."
        feature_deltas = {}
    elif not is_comparable:
        review_msg = f"Comparison unavailable — recordings are not sufficiently comparable ({reason})"
        feature_deltas = {}
    else:
        feature_deltas, changed_labels = calculate_feature_deltas(current, baseline)
        if changed_labels:
            date_str = baseline.assessment_at.strftime("%Y-%m-%d") if baseline.assessment_at else "prior visit"
            review_msg = f"Change detected in {', '.join(changed_labels)} compared with {date_str} — consider repeat measurement and clinical review."
        else:
            review_msg = "No notable change detected in measured features compared with the selected baseline."

    # Update assessment review message
    current.review_message = review_msg

    # Persist or update comparison record
    comparison = db.query(ComparisonModel).filter(
        ComparisonModel.current_assessment_id == current.id,
        ComparisonModel.baseline_assessment_id == baseline.id,
    ).first()

    if not comparison:
        comparison = ComparisonModel(
            patient_id=current.patient_id,
            current_assessment_id=current.id,
            baseline_assessment_id=baseline.id,
            comparable=is_comparable,
            feature_deltas=feature_deltas,
            reason=reason if not is_comparable else None,
            review_message=review_msg,
            created_at=utc_now(),
        )
        db.add(comparison)
    else:
        comparison.comparable = is_comparable
        comparison.feature_deltas = feature_deltas
        comparison.reason = reason if not is_comparable else None
        comparison.review_message = review_msg

    db.commit()
    db.refresh(comparison)
    db.refresh(current)

    return comparison
