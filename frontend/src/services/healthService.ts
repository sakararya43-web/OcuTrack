import { apiRequest } from './apiClient';
import { HealthResponse } from '../types/api';

export async function checkBackendHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/api/health', {
    method: 'GET',
  }, 5000);
}
