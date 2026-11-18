export type AssessmentStatus =
  | 'created'
  | 'uploaded'
  | 'processing'
  | 'complete'
  | 'failed';

export type TestStatus =
  | 'complete'
  | 'insufficient_quality'
  | 'failed'
  | 'not_provided';

export type QualityStatus =
  | 'pending'
  | 'acceptable'
  | 'insufficient';

export type ModelStatus =
  | 'not_configured'
  | 'experimental'
  | 'evaluated'
  | 'failed';

export type ComparisonStatus =
  | 'not_available'
  | 'comparable'
  | 'not_comparable';

export type ConsentStatus =
  | 'granted'
  | 'denied'
  | 'withdrawn'
  | 'not_recorded';

export interface ConsentPayload {
  consent_status: ConsentStatus;
  purpose: string;
  granted_at?: string | null;
}

export interface CreatePatientPayload {
  pseudonymous_code: string;
  age_band?: string | null;
  context_notes?: string | null;
  consent: ConsentPayload;
}

export interface Patient {
  patient_id: string;
  pseudonymous_code: string;
  age_band: string | null;
  context_notes: string | null;
  created_at: string;
  consent_status: ConsentStatus;
  consent_purpose?: string | null;
  last_assessment_date?: string | null;
  last_quality_status?: QualityStatus | null;
  feature_change_recorded?: boolean | null;
  assessment_count?: number;
}

export interface DeviceMetadata {
  user_agent: string;
  screen_width?: number;
  screen_height?: number;
  camera_width?: number;
  camera_height?: number;
  frame_rate?: number;
}

export interface LightingMetadata {
  method: string;
  notes?: string | null;
}

export interface CreateAssessmentPayload {
  patient_id: string;
  protocol_version: string;
  test_type: 'pupil_reflex' | 'smooth_pursuit' | 'both';
  device_metadata?: DeviceMetadata | Record<string, unknown>;
  lighting_metadata?: LightingMetadata | Record<string, unknown>;
}

export interface FeatureValue {
  value: number | null;
  unit: string;
  label: string;
}

export interface TimeSeriesPoint {
  t_ms: number;
  value: number | null;
  valid: boolean;
}

export interface PursuitSeriesPoint {
  t_ms: number;
  target_x: number | null;
  eye_x: number | null;
  valid: boolean;
}

export interface QualityMetrics {
  status: QualityStatus;
  usable_frame_ratio?: number | null;
  warnings?: string[];
}

export interface PupilTestResult {
  status: TestStatus;
  features?: Record<string, FeatureValue> | null;
  series?: TimeSeriesPoint[] | null;
}

export interface PursuitTestResult {
  status: TestStatus;
  features?: Record<string, FeatureValue> | null;
  series?: PursuitSeriesPoint[] | null;
}

export interface TemporalModelResult {
  status: ModelStatus;
  model_name?: string | null;
  model_version?: string | null;
  output?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface FeatureDelta {
  delta: number | null;
  percentage_delta?: number | null;
  unit: string;
  direction?: 'increased' | 'decreased' | 'stable' | 'unknown' | null;
}

export interface LongitudinalComparisonResult {
  status: ComparisonStatus;
  baseline_id?: string | null;
  comparability_reason?: string | null;
  feature_deltas?: Record<string, FeatureDelta> | null;
}

export interface AssessmentSummary {
  assessment_id: string;
  patient_id: string;
  status: AssessmentStatus;
  quality_status: QualityStatus;
  assessment_at: string;
  protocol_version: string;
  warnings?: string[];
  review_message?: string | null;
  features?: {
    latency_ms?: number | null;
    constriction_velocity?: number | null;
    tracking_gain?: number | null;
    [key: string]: unknown;
  } | null;
}

export interface AssessmentDetail extends AssessmentSummary {
  quality?: QualityMetrics | null;
  pupil?: PupilTestResult | null;
  pursuit?: PursuitTestResult | null;
  temporal_model?: TemporalModelResult | null;
  longitudinal_comparison?: LongitudinalComparisonResult | null;
  non_diagnostic_notice?: string | null;
}

export interface HealthResponse {
  status: string;
  app: string;
  database?: string;
  version?: string;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc?: string[] }>;
  message?: string;
}
