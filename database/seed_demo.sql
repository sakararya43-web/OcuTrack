-- OcuTrack Synthetic Demo Seed Script
-- Purpose: Provides non-identifying, consented sample data for evaluation and local fallback.
-- Parent Specification: parthImplementation.md Section 7 & 13

-- Clean existing demo records if present
DELETE FROM patients WHERE pseudonymous_code IN ('OT-DEMO-001', 'OT-DEMO-002');

-- 1. Create Demo Patient 1 (Longitudinal tracking participant with two visits)
INSERT INTO patients (id, pseudonymous_code, age_band, context_notes, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'OT-DEMO-001',
    '50-59',
    'Synthetic demonstration profile — baseline established and 30-day follow-up',
    '2026-10-15T09:00:00Z'
);

INSERT INTO consents (id, patient_id, consent_status, purpose, recorded_at)
VALUES (
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'granted',
    'hackathon_demo',
    '2026-10-15T09:00:00Z'
);

-- Visit 1: Baseline Assessment
INSERT INTO assessments (
    id, patient_id, assessment_at, status, test_type, protocol_version,
    device_metadata, lighting_metadata, quality_status, is_baseline, review_message, created_at
)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '2026-10-15T09:15:00Z',
    'complete',
    'both',
    'ocutrack-protocol-0.1',
    '{"user_agent": "Mozilla/5.0 DemoBrowser/1.0", "screen_width": 1920, "screen_height": 1080}'::jsonb,
    '{"method": "controlled_ambient", "notes": "Standard diffuse room lighting"}'::jsonb,
    'acceptable',
    true,
    'Baseline established. Future assessments can be compared when recording conditions are sufficiently similar.',
    '2026-10-15T09:15:00Z'
);

INSERT INTO measurements (id, assessment_id, test_type, feature_name, feature_value, unit, created_at)
VALUES
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'pupil_reflex', 'baseline_diameter', 4.65, 'mm', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'pupil_reflex', 'constriction_latency', 245.0, 'ms', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'pupil_reflex', 'constriction_velocity', 4.80, 'mm/s', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'pupil_reflex', 'constriction_amplitude', 33.0, '%', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'pupil_reflex', 'dilation_velocity', 2.10, 'mm/s', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'smooth_pursuit', 'tracking_gain', 0.95, 'ratio', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'smooth_pursuit', 'rmse_error', 0.038, 'norm', '2026-10-15T09:15:00Z'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'smooth_pursuit', 'saccadic_intrusions', 1.0, 'count', '2026-10-15T09:15:00Z');

INSERT INTO model_runs (id, assessment_id, model_name, model_version, input_schema_version, status, output, created_at)
VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'TCN-Temporal-Evaluator-v0.1',
    '1.0.0',
    'v1',
    'experimental',
    '{"sequence_embedding_variance": 0.079, "temporal_smoothness_index": 0.93}'::jsonb,
    '2026-10-15T09:15:00Z'
);

-- Visit 2: Follow-up Assessment (with detected change in latency and gain)
INSERT INTO assessments (
    id, patient_id, assessment_at, status, test_type, protocol_version,
    device_metadata, lighting_metadata, quality_status, is_baseline, review_message, created_at
)
VALUES (
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '2026-11-15T10:00:00Z',
    'complete',
    'both',
    'ocutrack-protocol-0.1',
    '{"user_agent": "Mozilla/5.0 DemoBrowser/1.0", "screen_width": 1920, "screen_height": 1080}'::jsonb,
    '{"method": "controlled_ambient", "notes": "Standard diffuse room lighting"}'::jsonb,
    'acceptable',
    false,
    'Change detected in constriction latency, smooth pursuit gain compared with 2026-10-15 — consider repeat measurement and clinical review.',
    '2026-11-15T10:00:00Z'
);

INSERT INTO measurements (id, assessment_id, test_type, feature_name, feature_value, unit, created_at)
VALUES
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'pupil_reflex', 'baseline_diameter', 4.60, 'mm', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'pupil_reflex', 'constriction_latency', 268.0, 'ms', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'pupil_reflex', 'constriction_velocity', 4.70, 'mm/s', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'pupil_reflex', 'constriction_amplitude', 31.5, '%', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'pupil_reflex', 'dilation_velocity', 2.05, 'mm/s', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'smooth_pursuit', 'tracking_gain', 0.84, 'ratio', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'smooth_pursuit', 'rmse_error', 0.051, 'norm', '2026-11-15T10:00:00Z'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'smooth_pursuit', 'saccadic_intrusions', 3.0, 'count', '2026-11-15T10:00:00Z');

INSERT INTO comparisons (
    id, patient_id, current_assessment_id, baseline_assessment_id,
    comparable, feature_deltas, reason, review_message, created_at
)
VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    true,
    '{
        "constriction_latency": {"delta": 23.0, "unit": "ms", "direction": "increased"},
        "constriction_velocity": {"delta": -0.10, "unit": "mm/s", "direction": "stable"},
        "tracking_gain": {"delta": -0.11, "unit": "ratio", "direction": "decreased"}
    }'::jsonb,
    null,
    'Change detected in constriction latency, smooth pursuit gain compared with 2026-10-15 — consider repeat measurement and clinical review.',
    '2026-11-15T10:00:00Z'
);

-- 2. Create Demo Patient 2 (Single baseline assessment)
INSERT INTO patients (id, pseudonymous_code, age_band, context_notes, created_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'OT-DEMO-002',
    '60-69',
    'Synthetic demonstration profile — baseline visit only',
    '2026-11-16T08:30:00Z'
);

INSERT INTO consents (id, patient_id, consent_status, purpose, recorded_at)
VALUES (
    'c3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'granted',
    'hackathon_demo',
    '2026-11-16T08:30:00Z'
);
