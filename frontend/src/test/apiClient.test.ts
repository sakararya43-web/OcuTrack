import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, ApiClientError, getApiBaseUrl } from '../services/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses default localhost:8000 when VITE_API_BASE_URL is not set', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:8000');
  });

  it('handles backend service unavailable (503) cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({ detail: 'Backend offline' }),
    });

    await expect(apiRequest('/api/patients')).rejects.toThrow(ApiClientError);

    try {
      await apiRequest('/api/patients');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.isUnavailable).toBe(true);
      expect(apiErr.status).toBe(503);
    }
  });

  it('catches network failure (fetch throws) and marks isUnavailable = true', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await apiRequest('/api/health');
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.isUnavailable).toBe(true);
      expect(apiErr.message).toContain('Cannot connect to backend');
    }
  });

  it('successfully returns data on 200 OK', async () => {
    const mockData = [{ patient_id: 'p-1', pseudonymous_code: 'OT-1001' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await apiRequest('/api/patients');
    expect(result).toEqual(mockData);
  });
});
