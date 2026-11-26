import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera } from '../hooks/useCamera';

describe('useCamera Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles permission denied error cleanly', async () => {
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    const mockGetUserMedia = vi.fn().mockRejectedValue(permissionError);

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    let success = true;
    await act(async () => {
      success = await result.current.startCamera();
    });

    expect(success).toBe(false);
    expect(result.current.isCameraActive).toBe(false);
    expect(result.current.error?.type).toBe('permission_denied');
    expect(result.current.error?.message).toContain('Camera permission denied');
  });

  it('handles device not found error cleanly', async () => {
    const notFoundError = new DOMException('No devices', 'NotFoundError');
    const mockGetUserMedia = vi.fn().mockRejectedValue(notFoundError);

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    let success = true;
    await act(async () => {
      success = await result.current.startCamera();
    });

    expect(success).toBe(false);
    expect(result.current.error?.type).toBe('not_found');
    expect(result.current.error?.message).toContain('No video capture device detected');
  });

  it('cleans up stream tracks when stopCamera is called', async () => {
    const mockTrack = {
      stop: vi.fn(),
      getSettings: vi.fn().mockReturnValue({ width: 1280, height: 720, frameRate: 30 }),
    };

    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
      active: true,
    };

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCameraActive).toBe(true);
    expect(result.current.observedSettings?.width).toBe(1280);

    act(() => {
      result.current.stopCamera();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.isCameraActive).toBe(false);
    expect(result.current.stream).toBeNull();
    expect(result.current.getStream()).toBeNull();
  });

  it('falls back to relaxed constraints on OverconstrainedError and exposes getStream', async () => {
    const mockTrack = {
      stop: vi.fn(),
      getSettings: vi.fn().mockReturnValue({ width: 640, height: 480, frameRate: 30 }),
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
      active: true,
    };
    const overconstrained = new DOMException('Overconstrained', 'OverconstrainedError');
    const mockGetUserMedia = vi
      .fn()
      .mockRejectedValueOnce(overconstrained)
      .mockResolvedValueOnce(mockStream);

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    let success = false;
    await act(async () => {
      success = await result.current.startCamera();
    });

    expect(success).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    expect(result.current.getStream()).toBe(mockStream);
  });
});
