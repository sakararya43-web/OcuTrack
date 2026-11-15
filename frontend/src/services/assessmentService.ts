import { apiRequest } from './apiClient';
import { CreateAssessmentPayload, AssessmentSummary } from '../types/api';

export async function createAssessment(payload: CreateAssessmentPayload): Promise<AssessmentSummary> {
  return apiRequest<AssessmentSummary>('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAssessment(assessmentId: string): Promise<AssessmentSummary> {
  return apiRequest<AssessmentSummary>(`/api/assessments/${encodeURIComponent(assessmentId)}`, {
    method: 'GET',
  });
}
