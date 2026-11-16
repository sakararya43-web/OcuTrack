import { describe, it, expect } from 'vitest';
import { evaluateRecordingQuality } from '../hooks/useRecordingQuality';
import { STANDARD_REVIEW_MESSAGES } from '../lib/constants';

describe('useRecordingQuality / evaluateRecordingQuality', () => {
  it('identifies compliant pupil reflex recording as acceptable', () => {
    const result = evaluateRecordingQuality({
      durationMs: 15100,
      sizeBytes: 450000,
      testType: 'pupil_reflex',
      observedSettings: {
        width: 1280,
        height: 720,
        frameRate: 30,
      },
    });

    expect(result.status).toBe('acceptable');
    expect(result.isAcceptable).toBe(true);
    expect(result.reviewMessage).toBe(STANDARD_REVIEW_MESSAGES.QUALITY_ACCEPTABLE);
    expect(result.warnings).toHaveLength(0);
    expect(result.scoreRatio).toBe(1.0);
  });

  it('marks recording with insufficient duration as insufficient', () => {
    const result = evaluateRecordingQuality({
      durationMs: 4000, // Too short for 15s pupil reflex
      sizeBytes: 120000,
      testType: 'pupil_reflex',
      observedSettings: {
        width: 1280,
        height: 720,
        frameRate: 30,
      },
    });

    expect(result.status).toBe('insufficient');
    expect(result.isAcceptable).toBe(false);
    expect(result.reviewMessage).toBe(STANDARD_REVIEW_MESSAGES.QUALITY_INSUFFICIENT);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('marks recording with low frame rate as insufficient', () => {
    const result = evaluateRecordingQuality({
      durationMs: 15000,
      sizeBytes: 250000,
      testType: 'pupil_reflex',
      observedSettings: {
        width: 1280,
        height: 720,
        frameRate: 10, // < 15 FPS
      },
    });

    expect(result.status).toBe('insufficient');
    expect(result.isAcceptable).toBe(false);
    expect(result.warnings.some((w) => w.includes('15 FPS'))).toBe(true);
  });

  it('handles labelled fallback benchmark sample as acceptable', () => {
    const result = evaluateRecordingQuality({
      durationMs: 15000,
      sizeBytes: 500000,
      testType: 'pupil_reflex',
      isFallback: true,
    });

    expect(result.status).toBe('acceptable');
    expect(result.isAcceptable).toBe(true);
    expect(result.scoreRatio).toBe(1.0);
  });

  it('detects smooth pursuit test short duration', () => {
    const result = evaluateRecordingQuality({
      durationMs: 3000, // < 5s for pursuit
      sizeBytes: 60000,
      testType: 'smooth_pursuit',
      observedSettings: {
        width: 1280,
        height: 720,
        frameRate: 30,
      },
    });

    expect(result.status).toBe('insufficient');
    expect(result.isAcceptable).toBe(false);
  });
});
