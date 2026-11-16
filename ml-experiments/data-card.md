# OcuTrack Data Card & Experiment Documentation

**Author:** Aditya (Computer Vision & ML Workstream)  
**Parent Specification:** `adityaImplementation.md` (Sections 12.4, 13, 14)  
**Status:** Data-Gated (Phase 4)  
**Last Updated:** November 2026  

---

## 1. Data Availability & Gate Decision

In accordance with `adityaImplementation.md` Section 12.4 (*Data availability decision gate*):

1. **Verification of Clinical Data:**
   - Publicly available datasets for pupil light reflex (PLR) and smooth pursuit either:
     - Use specialized clinical infrared pupillometers (e.g. NeurOptics) under high-speed infrared illumination not representative of standard browser webcams.
     - Lack participant-level identifiers, licenses for redistribution, or explicit neurological diagnostic ground-truth labels.
   - Clinical datasets with disease labels under ordinary laptop/smartphone camera conditions were **unavailable**.

2. **Ethical & Scientific Decision Gate:**
   - As mandated by the parent specification, the team refuses to fabricate diagnostic labels or claim medical diagnostic performance.
   - For runtime API assessments, `temporal_model.status` defaults honestly to `"not_configured"` with `output: null`.
   - The analysis package focuses on extracting **objective, inspectable physiological measurements** (diameters, velocities, latencies, tracking error).

---

## 2. Experimental Synthetic Data Fixtures

For internal engineering verification, architecture validation, and unit testing, a synthetic simulation fixture generator is implemented in `analysis/ml/dataset.py`:

- **Generator:** `generate_synthetic_experimental_dataset()`
- **Purpose:** Verifies that code paths (resampling, causal convolutions, gradient descent, participant-level splitting) run deterministically and without memory leaks.
- **Labels:** Non-clinical binary wave dynamics (sluggish vs fast constriction simulation).
- **Explicit Label:** **Synthetic Fixture Only — Not Real Patient Physiology**.

---

## 3. Participant Partitioning & Leakage Rules

- **Unit of Splitting:** Partitions are created strictly by `subject_id` using `GroupKFold` / `GroupShuffleSplit`.
- **Zero Leakage:** No participant has recordings in both train and test splits.
- **Reproducibility:** Seeded with explicit random seeds (`seed=42`).
