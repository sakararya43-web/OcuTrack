import { describe, it, expect, vi } from 'vitest';
import { getBestSupportedMimeType } from '../hooks/useMediaRecorder';
import {
  calculateTargetPosition,
  generateFullTrajectory,
  PURSUIT_DURATION_MS,
  PURSUIT_PATH_VERSION,
} from '../components/capture/SmoothPursuitTarget';

describe('useMediaRecorder & Pursuit Trajectory', () => {
  it('identifies best supported MIME type when MediaRecorder is available', () => {
    // Mock MediaRecorder.isTypeSupported
    (global as any).MediaRecorder = {
      isTypeSupported: vi.fn((mime: string) => mime.includes('video/webm;codecs=vp9,opus')),
    };

    const bestMime = getBestSupportedMimeType();
    expect(bestMime).toBe('video/webm;codecs=vp9,opus');
  });

  it('calculates deterministic pursuit target position starting at center (0.5, 0.5)', () => {
    const startPos = calculateTargetPosition(0);
    expect(startPos.x).toBe(0.5);
    expect(startPos.y).toBe(0.5);
  });

  it('keeps pursuit target within normalized visible bounds [0.1, 0.9] horizontally', () => {
    for (let t = 0; t <= PURSUIT_DURATION_MS; t += 250) {
      const pos = calculateTargetPosition(t);
      expect(pos.x).toBeGreaterThanOrEqual(0.1);
      expect(pos.x).toBeLessThanOrEqual(0.9);
      expect(pos.y).toBe(0.5);
    }
  });

  it('generates contract-compliant full trajectory metadata for Aditya', () => {
    const trajectory = generateFullTrajectory(PURSUIT_DURATION_MS, 50);
    expect(trajectory.path_version).toBe(PURSUIT_PATH_VERSION);
    expect(trajectory.duration_ms).toBe(PURSUIT_DURATION_MS);
    expect(trajectory.coordinates_normalized.length).toBeGreaterThan(150);

    const firstPoint = trajectory.coordinates_normalized[0];
    expect(firstPoint.t_ms).toBe(0);
    expect(firstPoint.x).toBe(0.5);

    const lastPoint = trajectory.coordinates_normalized[trajectory.coordinates_normalized.length - 1];
    expect(lastPoint.t_ms).toBe(PURSUIT_DURATION_MS);
  });
});
