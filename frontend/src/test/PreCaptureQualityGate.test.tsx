import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  analyzeFrameLighting,
  extractHeadPoseEuler,
  evaluateEyeVisibility,
  buildPreCaptureQualityMetadata,
  usePreCaptureQualityGate,
} from '../hooks/usePreCaptureQualityGate';
import {
  PreCaptureQualityGate,
  QualityReticleOverlay,
} from '../components/capture/PreCaptureQualityGate';
import { PupilTestPage } from '../pages/PupilTestPage';
import { PursuitTestPage } from '../pages/PursuitTestPage';
import { en } from '../i18n/locales/en';
import { hi } from '../i18n/locales/hi';
import { es } from '../i18n/locales/es';
import { fr } from '../i18n/locales/fr';

const { mockDetectForVideo, mockClose, mockCreateFromOptions, mockForVisionTasks } = vi.hoisted(() => ({
  mockDetectForVideo: vi.fn(),
  mockClose: vi.fn(),
  mockCreateFromOptions: vi.fn(),
  mockForVisionTasks: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: mockForVisionTasks,
  },
  FaceLandmarker: {
    createFromOptions: mockCreateFromOptions,
  },
}));

function makeRgba(rgb: number, width = 160, height = 120): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    buf[o] = rgb;
    buf[o + 1] = rgb;
    buf[o + 2] = rgb;
    buf[o + 3] = 255;
  }
  return buf;
}

function makeCenteredLandmarks(openEar = true, centerX = 0.5, centerY = 0.45): NormalizedLandmark[] {
  const pts: NormalizedLandmark[] = Array.from({ length: 468 }, () => ({
    x: centerX,
    y: centerY,
    z: 0,
    visibility: 1,
  }));

  // Nose, forehead, chin, cheeks for fallback geometry
  pts[1] = { x: centerX, y: centerY + 0.02, z: -0.05, visibility: 1 };
  pts[10] = { x: centerX, y: centerY - 0.18, z: 0, visibility: 1 };
  pts[152] = { x: centerX, y: centerY + 0.22, z: 0, visibility: 1 };
  pts[234] = { x: centerX - 0.16, y: centerY, z: 0.05, visibility: 1 };
  pts[454] = { x: centerX + 0.16, y: centerY, z: 0.05, visibility: 1 };

  const halfGap = openEar ? 0.015 : 0.002;
  // Left eye [33, 160, 158, 133, 153, 144]
  pts[33] = { x: centerX - 0.12, y: centerY - 0.04, z: 0, visibility: 1 };
  pts[133] = { x: centerX - 0.06, y: centerY - 0.04, z: 0, visibility: 1 };
  pts[160] = { x: centerX - 0.1, y: centerY - 0.04 - halfGap, z: 0, visibility: 1 };
  pts[144] = { x: centerX - 0.1, y: centerY - 0.04 + halfGap, z: 0, visibility: 1 };
  pts[158] = { x: centerX - 0.08, y: centerY - 0.04 - halfGap, z: 0, visibility: 1 };
  pts[153] = { x: centerX - 0.08, y: centerY - 0.04 + halfGap, z: 0, visibility: 1 };

  // Right eye [362, 385, 387, 263, 373, 380]
  pts[362] = { x: centerX + 0.06, y: centerY - 0.04, z: 0, visibility: 1 };
  pts[263] = { x: centerX + 0.12, y: centerY - 0.04, z: 0, visibility: 1 };
  pts[385] = { x: centerX + 0.08, y: centerY - 0.04 - halfGap, z: 0, visibility: 1 };
  pts[380] = { x: centerX + 0.08, y: centerY - 0.04 + halfGap, z: 0, visibility: 1 };
  pts[387] = { x: centerX + 0.1, y: centerY - 0.04 - halfGap, z: 0, visibility: 1 };
  pts[373] = { x: centerX + 0.1, y: centerY - 0.04 + halfGap, z: 0, visibility: 1 };

  return pts;
}

const GateHarness: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement>;
  active: boolean;
}> = ({ videoRef, active }) => {
  const gate = usePreCaptureQualityGate(videoRef, active);
  const [overridden, setOverridden] = React.useState(false);
  return (
    <div>
      <PreCaptureQualityGate
        gate={gate}
        isOverridden={overridden}
        onOverrideProceed={() => setOverridden(true)}
      />
      <QualityReticleOverlay allPassed={gate.allPassed} isOverridden={overridden} />
      <div data-testid="all-passed-flag">{String(gate.allPassed)}</div>
    </div>
  );
};

describe('PreCaptureQualityGate (Edge CV)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockForVisionTasks.mockResolvedValue({ wasmLoaderPath: '', wasmBinaryPath: '' });
    mockCreateFromOptions.mockResolvedValue({
      detectForVideo: mockDetectForVideo,
      close: mockClose,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('evaluates ambient lighting across low light, high glare, and optimal luminance ranges', () => {
    expect(analyzeFrameLighting(makeRgba(35))).toMatchObject({
      status: 'warn',
      code: 'low_light',
      meanLuminance: 35,
    });
    expect(analyzeFrameLighting(makeRgba(235))).toMatchObject({
      status: 'warn',
      code: 'high_glare',
      meanLuminance: 235,
    });
    expect(analyzeFrameLighting(makeRgba(130))).toMatchObject({
      status: 'pass',
      code: 'optimal',
      meanLuminance: 130,
    });
  });

  it('extracts head pose Euler angles from transformation matrix and detects excessive rotation', () => {
    const identityMatrix = {
      rows: 4,
      columns: 4,
      data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -40, 1],
    };
    const aligned = extractHeadPoseEuler(identityMatrix);
    expect(aligned).toMatchObject({
      status: 'pass',
      code: 'aligned',
      yaw: 0,
      pitch: 0,
      roll: 0,
      formatted: 'Y:+0° P:+0° R:+0°',
    });

    // Pure +16 deg yaw rotation around Y axis (column-major)
    const yawRad = (16 * Math.PI) / 180;
    const rotatedMatrix = {
      rows: 4,
      columns: 4,
      data: [
        Math.cos(yawRad),
        0,
        -Math.sin(yawRad),
        0,
        0,
        1,
        0,
        0,
        Math.sin(yawRad),
        0,
        Math.cos(yawRad),
        0,
        0,
        0,
        -40,
        1,
      ],
    };
    const tilted = extractHeadPoseEuler(rotatedMatrix);
    expect(tilted.status).toBe('warn');
    expect(tilted.code).toBe('adjust_pose');
    expect(tilted.yaw).toBe(16);
    expect(tilted.formatted).toContain('Y:+16°');
  });

  it('validates eye visibility via EAR and central safe-frame bounds', () => {
    expect(evaluateEyeVisibility(undefined)).toMatchObject({ status: 'warn', code: 'no_face' });
    expect(evaluateEyeVisibility(makeCenteredLandmarks(false))).toMatchObject({
      status: 'warn',
      code: 'eyes_not_visible',
    });
    expect(evaluateEyeVisibility(makeCenteredLandmarks(true, 0.08, 0.45))).toMatchObject({
      status: 'warn',
      code: 'center_face',
    });
    expect(evaluateEyeVisibility(makeCenteredLandmarks(true, 0.5, 0.45))).toMatchObject({
      status: 'pass',
      code: 'clear',
    });
  });

  it('runs live MediaPipe FaceLandmarker HUD and shifts reticle to ready when allPassed is true', async () => {
    const getCtxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: makeRgba(140) }),
    } as unknown as CanvasRenderingContext2D);

    mockDetectForVideo.mockReturnValue({
      faceLandmarks: [makeCenteredLandmarks(true, 0.5, 0.45)],
      facialTransformationMatrixes: [
        { rows: 4, columns: 4, data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -40, 1] },
      ],
    });

    const videoRef = {
      current: { readyState: 4, videoWidth: 640, videoHeight: 480 } as unknown as HTMLVideoElement,
    } as React.RefObject<HTMLVideoElement>;

    render(<GateHarness videoRef={videoRef} active={true} />);

    // Flush async MediaPipe initialization promises
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByTestId('all-passed-flag').textContent).toBe('true');
    expect(screen.getByText('CAPTURE READY')).toBeInTheDocument();
    expect(screen.getByText('OPTIMAL')).toBeInTheDocument();
    expect(screen.getByText('ALIGNED')).toBeInTheDocument();
    expect(screen.getByText('CLEAR')).toBeInTheDocument();
    expect(screen.getByTestId('quality-reticle-overlay').getAttribute('data-ready')).toBe('true');

    // No pill buttons anywhere in the HUD
    const buttons = screen.queryAllByRole('button');
    buttons.forEach((btn) => expect(btn.className).not.toContain('rounded-full'));

    getCtxSpy.mockRestore();
  });

  it('gracefully falls back to LITE MODE when MediaPipe CDN/WASM fails offline', async () => {
    mockForVisionTasks.mockRejectedValue(new Error('Network offline'));

    const getCtxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: makeRgba(45) }), // Dim lighting warning
    } as unknown as CanvasRenderingContext2D);

    const videoRef = {
      current: { readyState: 4, videoWidth: 640, videoHeight: 480 } as unknown as HTMLVideoElement,
    } as React.RefObject<HTMLVideoElement>;

    render(<GateHarness videoRef={videoRef} active={true} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByTestId('quality-gate-lite-badge')).toBeInTheDocument();
    expect(screen.getByText('LOW LIGHT')).toBeInTheDocument();
    expect(screen.getByTestId('all-passed-flag').textContent).toBe('false');

    // Proceed Anyway override works cleanly without locking out offline clinics
    fireEvent.click(screen.getByRole('button', { name: /Proceed Anyway/i }));
    expect(screen.getByText('OVERRIDE ACTIVE')).toBeInTheDocument();
    expect(screen.getByTestId('quality-reticle-overlay').getAttribute('data-ready')).toBe('true');

    const meta = buildPreCaptureQualityMetadata(
      {
        lighting: { status: 'warn', code: 'low_light', meanLuminance: 45, overexposedRatio: 0 },
        headPose: {
          status: 'lite',
          code: 'lite_mode',
          yaw: null,
          pitch: null,
          roll: null,
          formatted: 'LITE MODE',
        },
        eyeVisibility: { status: 'lite', code: 'lite_mode', leftEar: null, rightEar: null },
        allPassed: false,
        isModelLoading: false,
        isLiteMode: true,
      },
      true,
      false
    );
    expect(meta).toMatchObject({
      quality_gate_note: 'pre_capture_quality_override',
      pre_capture_quality: expect.objectContaining({
        overridden: true,
        is_lite_mode: true,
        note: 'pre_capture_quality_override',
      }),
    });

    getCtxSpy.mockRestore();
  });

  it('integrates PreCaptureQualityGate on PupilTestPage & PursuitTestPage and bypasses on SampleVideoFallback', async () => {
    mockForVisionTasks.mockRejectedValue(new Error('Offline test'));
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const getCtxSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: makeRgba(40) }), // Dim lighting warning
    } as unknown as CanvasRenderingContext2D);

    const mockTrack = {
      stop: vi.fn(),
      getSettings: () => ({ width: 640, height: 480, frameRate: 24 }),
    };
    const mockStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [mockTrack],
      active: true,
    };

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ assessment_id: 'asm-qg-1', test_type: 'both' }),
    });

    const createUrlOrig = URL.createObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-qg-sample');

    const { unmount } = render(
      <MemoryRouter
        initialEntries={['/assessments/asm-qg-1/pupil-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pupil-test" element={<PupilTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Enable Webcam Device/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('pre-capture-quality-gate')).toBeInTheDocument();
    expect(screen.getByTestId('quality-reticle-overlay')).toBeInTheDocument();

    // Sample Video Fallback hides and bypasses the PreCaptureQualityGate
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['mock'], 'fallback.webm', { type: 'video/webm' })] },
    });
    expect(screen.queryByTestId('pre-capture-quality-gate')).not.toBeInTheDocument();
    expect(screen.getByText(/Review Recorded Pupil Sequence/i)).toBeInTheDocument();

    unmount();

    // Verify PursuitTestPage also mounts PreCaptureQualityGate when webcam activates
    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-qg-1/pursuit-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pursuit-test" element={<PursuitTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Enable Webcam Device/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('pre-capture-quality-gate')).toBeInTheDocument();
    expect(screen.getByTestId('quality-reticle-overlay')).toBeInTheDocument();

    URL.createObjectURL = createUrlOrig;
    getCtxSpy.mockRestore();
    playSpy.mockRestore();
  });

  it('provides non-empty EN, HI, ES, FR translations for all qualityGate keys', () => {
    const keys = Object.keys(en.capture.qualityGate) as Array<
      keyof typeof en.capture.qualityGate
    >;
    for (const locale of [en, hi, es, fr]) {
      for (const key of keys) {
        expect(locale.capture.qualityGate[key]).toBeTruthy();
      }
    }
  });
});
