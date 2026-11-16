-- OcuTrack Supabase Row Level Security (RLS) Policies
-- Parent Specification: parthImplementation.md Section 7.3

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

-- Backend Service Role Policies:
-- The FastAPI backend interacts with Supabase using the service_role key or direct backend connection.
-- By default, service_role bypasses RLS, but explicit policies ensure backend access is granted.

-- Drop existing policies if any
DROP POLICY IF EXISTS "service_role_all_patients" ON patients;
DROP POLICY IF EXISTS "service_role_all_consents" ON consents;
DROP POLICY IF EXISTS "service_role_all_assessments" ON assessments;
DROP POLICY IF EXISTS "service_role_all_measurements" ON measurements;
DROP POLICY IF EXISTS "service_role_all_model_runs" ON model_runs;
DROP POLICY IF EXISTS "service_role_all_comparisons" ON comparisons;

CREATE POLICY "service_role_all_patients" ON patients
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_consents" ON consents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_assessments" ON assessments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_measurements" ON measurements
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_model_runs" ON model_runs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_comparisons" ON comparisons
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Public / Anon restrictions:
-- Direct anon access to patient and clinical measurement data is blocked.
-- All access must go through the authenticated FastAPI application.
