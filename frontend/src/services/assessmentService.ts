import { apiRequest } from './apiClient';
import {
  CreateAssessmentPayload,
  AssessmentDetail,
  AssessmentSummary,
} from '../types/api';

export async function listAssessments(params?: {
  patient_id?: string;
  status?: string;
}): Promise<AssessmentSummary[]> {
  const query = new URLSearchParams();
  if (params?.patient_id) query.set('patient_id', params.patient_id);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return apiRequest<AssessmentSummary[]>(`/api/assessments${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<AssessmentSummary> {
  return apiRequest<AssessmentSummary>('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAssessment(assessmentId: string): Promise<AssessmentDetail> {
  return apiRequest<AssessmentDetail>(`/api/assessments/${encodeURIComponent(assessmentId)}`, {
    method: 'GET',
  });
}

export async function uploadPupilVideo(
  assessmentId: string,
  videoBlob: Blob,
  metadata: Record<string, unknown>
): Promise<AssessmentDetail> {
  const formData = new FormData();
  formData.append('file', videoBlob, 'pupil_recording.webm');
  formData.append('metadata_json', JSON.stringify(metadata));

  return apiRequest<AssessmentDetail>(
    `/api/assessments/${encodeURIComponent(assessmentId)}/pupil-video`,
    {
      method: 'POST',
      body: formData,
    },
    30000 // Extended 30s timeout for video payload upload
  );
}

export async function uploadPursuitVideo(
  assessmentId: string,
  videoBlob: Blob,
  metadata: Record<string, unknown>
): Promise<AssessmentDetail> {
  const formData = new FormData();
  formData.append('file', videoBlob, 'pursuit_recording.webm');
  formData.append('metadata_json', JSON.stringify(metadata));

  return apiRequest<AssessmentDetail>(
    `/api/assessments/${encodeURIComponent(assessmentId)}/pursuit-video`,
    {
      method: 'POST',
      body: formData,
    },
    30000 // Extended 30s timeout for video payload upload
  );
}

export async function triggerAnalysis(assessmentId: string): Promise<AssessmentDetail> {
  return apiRequest<AssessmentDetail>(
    `/api/assessments/${encodeURIComponent(assessmentId)}/analyze`,
    {
      method: 'POST',
    },
    15000
  );
}

export async function compareAssessment(
  assessmentId: string,
  baselineId?: string
): Promise<AssessmentDetail> {
  return apiRequest<AssessmentDetail>(
    `/api/assessments/${encodeURIComponent(assessmentId)}/compare`,
    {
      method: 'POST',
      body: JSON.stringify(baselineId ? { baseline_id: baselineId } : {}),
    }
  );
}
