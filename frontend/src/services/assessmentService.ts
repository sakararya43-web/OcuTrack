import { apiRequest } from './apiClient';
import {
  CreateAssessmentPayload,
  AssessmentDetail,
  AssessmentSummary,
} from '../types/api';

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

function getExtensionFromBlob(blob: Blob): string {
  const mime = (blob.type || '').toLowerCase();
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('quicktime')) return '.mov';
  if (mime.includes('matroska')) return '.mkv';
  return '.webm';
}

export async function uploadPupilVideo(
  assessmentId: string,
  videoBlob: Blob,
  metadata: Record<string, unknown>
): Promise<AssessmentDetail> {
  const formData = new FormData();
  formData.append('file', videoBlob, `pupil_recording${getExtensionFromBlob(videoBlob)}`);
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
  formData.append('file', videoBlob, `pursuit_recording${getExtensionFromBlob(videoBlob)}`);
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
