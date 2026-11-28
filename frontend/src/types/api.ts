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

export interface ConsentPayload {
  consent_status: 'granted' | 'denied';
  purpose: string;
  granted_at?: string;
}

export interface CreatePatientPayload {
  pseudonymous_code: string;
  age_band: string;
  context_notes?: string | null;
  consent: ConsentPayload;
}

export interface Patient {
  patient_id: string;
  pseudonymous_code: string;
  age_band: string;
  context_notes: string | null;
  created_at: string;
  consent_status: 'granted' | 'denied';
  consent_purpose?: string;
  last_assessment_date?: string | null;
  last_quality_status?: QualityStatus | null;
  feature_change_recorded?: boolean | null;
  assessment_count?: number;
  latest_assessment_id?: string | null;
  latest_assessment_status?: AssessmentStatus | null;
  latest_completed_assessment_id?: string | null;
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
  notes: string;
}

export interface CreateAssessmentPayload {
  patient_id: string;
  protocol_version: string;
  test_type: 'pupil_reflex' | 'smooth_pursuit' | 'both';
  device_metadata?: DeviceMetadata;
  lighting_metadata?: LightingMetadata;
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
  fps_estimate?: number | null;
  warnings: string[];
}

export interface PupilTestResult {
  status: TestStatus;
  features?: Record<string, FeatureValue>;
  series?: TimeSeriesPoint[];
}

export interface PursuitTestResult {
  status: TestStatus;
  features?: Record<string, FeatureValue>;
  series?: PursuitSeriesPoint[];
}

export interface TemporalModelResult {
  status: ModelStatus;
  model_name?: string;
  model_version?: string;
  output?: unknown;
  notes?: string;
}

export interface FeatureDelta {
  delta: number | null;
  percentage_delta?: number | null;
  unit: string;
  direction?: 'increased' | 'decreased' | 'stable' | 'unknown';
}

export interface LongitudinalComparisonResult {
  status: ComparisonStatus;
  baseline_id?: string | null;
  comparability_reason?: string | null;
  feature_deltas?: Record<string, FeatureDelta>;
}

export interface AssessmentSummary {
  assessment_id: string;
  patient_id: string;
  pseudonymous_code?: string | null;
  test_type?: 'pupil_reflex' | 'smooth_pursuit' | 'both' | null;
  is_baseline?: boolean;
  status: AssessmentStatus;
  quality_status: QualityStatus;
  assessment_at: string;
  protocol_version: string;
  warnings?: string[];
  review_message?: string;
  features?: {
    latency_ms?: number | null;
    constriction_velocity?: number | null;
    tracking_gain?: number | null;
    [key: string]: unknown;
  };
}

export interface AssessmentDetail extends AssessmentSummary {
  has_pupil_video?: boolean;
  has_pursuit_video?: boolean;
  quality?: QualityMetrics;
  pupil?: PupilTestResult;
  pursuit?: PursuitTestResult;
  temporal_model?: TemporalModelResult;
  longitudinal_comparison?: LongitudinalComparisonResult;
  non_diagnostic_notice?: string;
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
