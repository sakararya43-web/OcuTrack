import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAssessment,
  getAssessment,
  uploadPupilVideo,
  uploadPursuitVideo,
  triggerAnalysis,
  compareAssessment,
} from '../services/assessmentService';

describe('assessmentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates assessment with protocol and metadata', async () => {
    const mockResponse = {
      assessment_id: 'asm-123',
      patient_id: 'p-456',
      status: 'created',
      quality_status: 'pending',
      assessment_at: new Date().toISOString(),
      protocol_version: 'ocutrack-protocol-0.1',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await createAssessment({
      patient_id: 'p-456',
      protocol_version: 'ocutrack-protocol-0.1',
      test_type: 'both',
    });

    expect(result.assessment_id).toBe('asm-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/assessments'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('uploads pupil video with FormData and metadata_json', async () => {
    const mockDetail = {
      assessment_id: 'asm-123',
      patient_id: 'p-456',
      status: 'uploaded',
      quality_status: 'pending',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    const blob = new Blob(['sample-video-bytes'], { type: 'video/webm' });
    const result = await uploadPupilVideo('asm-123', blob, { duration_ms: 15000 });

    expect(result.status).toBe('uploaded');
    const [calledUrl, calledOptions] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/assessments/asm-123/pupil-video');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.body).toBeInstanceOf(FormData);
    // Crucial: Content-Type must NOT be hardcoded on FormData
    expect(calledOptions.headers['Content-Type']).toBeUndefined();
  });

  it('uploads pursuit video with FormData and target trajectory', async () => {
    const mockDetail = {
      assessment_id: 'asm-123',
      patient_id: 'p-456',
      status: 'uploaded',
      quality_status: 'pending',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    const blob = new Blob(['sample-pursuit-bytes'], { type: 'video/webm' });
    const result = await uploadPursuitVideo('asm-123', blob, {
      target_path: { path_version: 'horizontal-sweep-v1' },
    });

    expect(result.status).toBe('uploaded');
    const [calledUrl, calledOptions] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/assessments/asm-123/pursuit-video');
    expect(calledOptions.body).toBeInstanceOf(FormData);
  });

  it('retrieves assessment detail by id', async () => {
    const mockDetail = {
      assessment_id: 'asm-123',
      patient_id: 'p-456',
      status: 'complete',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    const result = await getAssessment('asm-123');
    expect(result.assessment_id).toBe('asm-123');
    expect(result.status).toBe('complete');
  });

  it('triggers analysis orchestration via POST /api/assessments/:id/analyze', async () => {
    const mockDetail = {
      assessment_id: 'asm-123',
      status: 'processing',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    const result = await triggerAnalysis('asm-123');
    expect(result.status).toBe('processing');
    const [calledUrl, calledOptions] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/assessments/asm-123/analyze');
    expect(calledOptions.method).toBe('POST');
  });

  it('requests comparison against baseline', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ assessment_id: 'asm-123', status: 'complete' }),
    });

    await compareAssessment('asm-123', 'base-999');
    const [calledUrl, calledOptions] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/assessments/asm-123/compare');
    expect(calledOptions.body).toContain('base-999');
  });
});
