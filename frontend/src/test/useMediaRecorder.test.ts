import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getBestSupportedMimeType, useMediaRecorder, RecordedVideo } from '../hooks/useMediaRecorder';
import {
  calculateTargetPosition,
  generateFullTrajectory,
  PURSUIT_DURATION_MS,
  PURSUIT_PATH_VERSION,
} from '../components/capture/SmoothPursuitTarget';

describe('useMediaRecorder & Pursuit Trajectory', () => {
  it('identifies best supported MIME type when MediaRecorder is available', () => {
    (globalThis as unknown as { MediaRecorder: { isTypeSupported: (mime: string) => boolean } }).MediaRecorder = {
      isTypeSupported: vi.fn((mime: string) => mime.includes('video/webm;codecs=vp9,opus')),
    };

    const bestMime = getBestSupportedMimeType();
    expect(bestMime).toBe('video/webm;codecs=vp9,opus');
  });

  it('sets and discards external fallback recordings via React state properly', () => {
    const originalRevoke = URL.revokeObjectURL;
    const revokeMock = vi.fn();
    URL.revokeObjectURL = revokeMock;

    try {
      const { result } = renderHook(() => useMediaRecorder());

      expect(result.current.recordedVideo).toBeNull();

      const sampleVideo: RecordedVideo = {
        blob: new Blob(['sample'], { type: 'video/webm' }),
        previewUrl: 'blob:http://localhost/sample-1',
        durationMs: 5000,
        mimeType: 'video/webm',
        recordedAt: '2026-11-18T12:00:00Z',
        sizeBytes: 6,
      };

      act(() => {
        result.current.setExternalRecording(sampleVideo);
      });

      expect(result.current.recordedVideo).toEqual(sampleVideo);
      expect(result.current.elapsedMs).toBe(5000);

      act(() => {
        result.current.discardRecording();
      });

      expect(result.current.recordedVideo).toBeNull();
      expect(revokeMock).toHaveBeenCalledWith('blob:http://localhost/sample-1');
    } finally {
      URL.revokeObjectURL = originalRevoke;
    }
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

  it('generates contract-compliant full trajectory metadata for analysis pipeline', () => {
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
