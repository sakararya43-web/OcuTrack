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

export interface AssessmentSummary {
  assessment_id: string;
  patient_id: string;
  status: AssessmentStatus;
  quality_status: QualityStatus;
  assessment_at: string;
  protocol_version: string;
  warnings?: string[];
  review_message?: string;
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
