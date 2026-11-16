-- OcuTrack PostgreSQL / Supabase Database Schema
-- Version: 0.1.0 (Hackathon MVP)
-- Parent Specification: parthImplementation.md Section 7

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudonymous_code TEXT UNIQUE NOT NULL,
    age_band TEXT NULL,
    context_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Consents Table
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_status TEXT NOT NULL CHECK (consent_status IN ('granted', 'denied', 'withdrawn', 'not_recorded')),
    purpose TEXT NOT NULL DEFAULT 'hackathon_demo',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'uploaded', 'processing', 'complete', 'failed')),
    test_type TEXT NOT NULL DEFAULT 'both' CHECK (test_type IN ('pupil_reflex', 'smooth_pursuit', 'both')),
    protocol_version TEXT NOT NULL DEFAULT 'ocutrack-protocol-0.1',
    device_metadata JSONB NULL,
    lighting_metadata JSONB NULL,
    quality_status TEXT NOT NULL DEFAULT 'pending' CHECK (quality_status IN ('pending', 'acceptable', 'insufficient')),
    is_baseline BOOLEAN NOT NULL DEFAULT false,
    pupil_video_path TEXT NULL,
    pursuit_video_path TEXT NULL,
    pupil_metadata JSONB NULL,
    pursuit_metadata JSONB NULL,
    warnings JSONB NULL,
    review_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL CHECK (test_type IN ('pupil_reflex', 'smooth_pursuit')),
    feature_name TEXT NOT NULL,
    feature_value DOUBLE PRECISION NULL,
    unit TEXT NOT NULL,
    series_data JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Model Runs Table
CREATE TABLE IF NOT EXISTS model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NULL,
    input_schema_version TEXT NOT NULL DEFAULT 'v1',
    status TEXT NOT NULL CHECK (status IN ('not_configured', 'experimental', 'evaluated', 'failed')),
    output JSONB NULL,
    evaluation_context JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Comparisons Table
CREATE TABLE IF NOT EXISTS comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    current_assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    baseline_assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    comparable BOOLEAN NOT NULL DEFAULT false,
    feature_deltas JSONB NULL,
    reason TEXT NULL,
    review_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_patients_pseudonymous_code ON patients(pseudonymous_code);
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_at ON assessments(assessment_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_assessment_id ON measurements(assessment_id);
CREATE INDEX IF NOT EXISTS idx_model_runs_assessment_id ON model_runs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_patient_id ON comparisons(patient_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_current_assessment ON comparisons(current_assessment_id);
