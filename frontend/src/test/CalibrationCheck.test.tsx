import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  CalibrationCheck,
  CALIBRATION_POINTS,
  computeFrameJitterMetrics,
  extractLuminanceSamples,
  buildCalibrationUploadMetadata,
} from '../components/capture/CalibrationCheck';
import { PupilTestPage } from '../pages/PupilTestPage';
import { PursuitTestPage } from '../pages/PursuitTestPage';
import { en } from '../i18n/locales/en';
import { hi } from '../i18n/locales/hi';
import { es } from '../i18n/locales/es';
import { fr } from '../i18n/locales/fr';

function makeMockRgba(value: number, width = 160, height = 120): Uint8ClampedArray {
  const arr = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    arr[idx] = value;
    arr[idx + 1] = value;
    arr[idx + 2] = value;
    arr[idx + 3] = 255;
  }
  return arr;
}

describe('CalibrationCheck & Jitter Scoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes high stability score (>=75) for steady frames and low score (<75) for high-jitter frames', () => {
    const frameA = extractLuminanceSamples(makeMockRgba(120));
    const frameBSteady = extractLuminanceSamples(makeMockRgba(122));
    const frameCShaky = extractLuminanceSamples(makeMockRgba(175));

    const steady = computeFrameJitterMetrics(frameA, frameBSteady, 120);
    expect(steady.mad).toBeCloseTo(2, 1);
    expect(steady.instantScore).toBeGreaterThanOrEqual(90);

    const shaky = computeFrameJitterMetrics(frameA, frameCShaky, 120);
    expect(shaky.mad).toBeGreaterThan(20);
    expect(shaky.instantScore).toBeLessThan(75);
  });

  it('cycles through all 5 coordinates over 5s, passes on steady stream, and unlocks on button or 1.5s auto-unlock', () => {
    const mockGetContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation(() => ({
        data: makeMockRgba(128),
      })),
    } as unknown as CanvasRenderingContext2D);

    const fakeVideo = {
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
    } as unknown as HTMLVideoElement;
    const videoRef = { current: fakeVideo } as React.RefObject<HTMLVideoElement>;
    const onComplete = vi.fn();

    render(<CalibrationCheck videoRef={videoRef} onCalibrationComplete={onComplete} />);

    // Verify P1 CTR initially
    expect(screen.getByTestId('calibration-point-indicator').textContent).toContain(CALIBRATION_POINTS[0].code);

    // Advance 2.2s -> should be at P3 TR
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByTestId('calibration-point-indicator').textContent).toContain(CALIBRATION_POINTS[2].code);

    // Advance remaining 3s -> completes 5s sweep and shows CALIBRATION STABLE gate
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('calibration-passed-gate')).toBeInTheDocument();
    expect(screen.getByText('CALIBRATION STABLE')).toBeInTheDocument();

    // Auto-unlocks after 1.5s
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      passed: true,
      overridden: false,
    });
    expect(onComplete.mock.calls[0][0].stabilityScore).toBeGreaterThanOrEqual(75);

    mockGetContext.mockRestore();
  });

  it('triggers high jitter warning (<75%), allows Recalibrate (5s) or Override & Proceed logging low_calibration_stability', () => {
    let toggle = false;
    const mockGetContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation(() => {
        toggle = !toggle;
        return { data: makeMockRgba(toggle ? 40 : 180) };
      }),
    } as unknown as CanvasRenderingContext2D);

    const fakeVideo = {
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
    } as unknown as HTMLVideoElement;
    const videoRef = { current: fakeVideo } as React.RefObject<HTMLVideoElement>;
    const onComplete = vi.fn();

    render(<CalibrationCheck videoRef={videoRef} onCalibrationComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    expect(screen.getByTestId('calibration-jitter-gate')).toBeInTheDocument();
    expect(
      screen.getByText(/High tracking jitter detected\. Steady the device or rest it on a stable surface before capturing\./i)
    ).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // Verify Recalibrate (5s) restarts the check cleanly
    fireEvent.click(screen.getByRole('button', { name: /Recalibrate \(5s\)/i }));
    expect(screen.queryByTestId('calibration-jitter-gate')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(screen.getByTestId('calibration-jitter-gate')).toBeInTheDocument();

    // Verify Override & Proceed completes with low_calibration_stability note
    fireEvent.click(screen.getByRole('button', { name: /Override & Proceed/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.passed).toBe(false);
    expect(result.overridden).toBe(true);
    expect(result.note).toBe('low_calibration_stability');

    const meta = buildCalibrationUploadMetadata(result, false);
    expect(meta).toMatchObject({
      calibration_note: 'low_calibration_stability',
      calibration: expect.objectContaining({
        overridden: true,
        note: 'low_calibration_stability',
      }),
    });

    mockGetContext.mockRestore();
  });

  it('integrates into PupilTestPage and PursuitTestPage, gating live recording until calibrated while leaving SampleVideoFallback unblocked', async () => {
    vi.useRealTimers();
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    const mockTrack = {
      stop: vi.fn(),
      getSettings: vi.fn().mockReturnValue({ width: 640, height: 480, frameRate: 24 }),
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
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
      json: async () => ({ assessment_id: 'asm-cal-1', test_type: 'both' }),
    });

    const pupilView = render(
      <MemoryRouter
        initialEntries={['/assessments/asm-cal-1/pupil-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pupil-test" element={<PupilTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Sample Video Fallback remains accessible before camera activation
    expect(screen.getByRole('button', { name: /Generate Standard Synthetic Benchmark/i })).toBeEnabled();

    // Activate webcam -> calibration check appears and Start Recording is disabled
    fireEvent.click(screen.getByRole('button', { name: /Enable Webcam Device/i }));
    await waitFor(() => {
      expect(screen.getByTestId('calibration-check-panel')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Start 15s Recording/i })).toBeDisabled();

    pupilView.unmount();

    // Verify PursuitTestPage also activates CalibrationCheck automatically when webcam turns on
    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-cal-1/pursuit-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pursuit-test" element={<PursuitTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Generate Standard Synthetic Benchmark/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /Enable Webcam Device/i }));
    await waitFor(() => {
      expect(screen.getByTestId('calibration-check-panel')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Start Pursuit Recording/i })).toBeDisabled();

    playSpy.mockRestore();
  });

  it('unlocks recording and displays header Calibration badge + Recalibrate trigger upon completion, while SampleVideoFallback bypasses calibration', async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const mockGetContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation(() => ({
        data: makeMockRgba(128),
      })),
    } as unknown as CanvasRenderingContext2D);

    const mockTrack = {
      stop: vi.fn(),
      getSettings: vi.fn().mockReturnValue({ width: 640, height: 480, frameRate: 24 }),
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
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
      json: async () => ({ assessment_id: 'asm-cal-2', test_type: 'pupil_reflex' }),
    });

    // Ensure URL.createObjectURL exists for sample fallback file upload
    const createUrlOrig = URL.createObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-sample');

    const { unmount } = render(
      <MemoryRouter
        initialEntries={['/assessments/asm-cal-2/pupil-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pupil-test" element={<PupilTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Trigger webcam start without fake timers first so promise settles, then advance timers
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Enable Webcam Device/i }));
      await Promise.resolve();
    });

    expect(screen.getByTestId('calibration-check-panel')).toBeInTheDocument();

    // Provide decoded dimensions on JSDOM <video> so CalibrationCheck samples frames cleanly
    const videoEl = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(videoEl, 'readyState', { value: 4, configurable: true });
    Object.defineProperty(videoEl, 'videoWidth', { value: 640, configurable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 480, configurable: true });

    // Wait out 5s calibration sequence + click Proceed to Capture
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Capture/i });
    fireEvent.click(proceedBtn);

    expect(screen.queryByTestId('calibration-check-panel')).not.toBeInTheDocument();
    const badge = screen.getByTestId('pupil-calibration-badge');
    expect(badge.textContent).toMatch(/Calibration: \d+% \(Passed\)/);
    expect(badge.className).not.toContain('rounded-full');
    expect(screen.getByRole('button', { name: /Start 15s Recording/i })).toBeEnabled();

    // Clicking Recalibrate in header re-opens CalibrationCheck
    fireEvent.click(screen.getByRole('button', { name: /^Recalibrate$/i }));
    expect(screen.getByTestId('calibration-check-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start 15s Recording/i })).toBeDisabled();

    unmount();

    // Verify Sample Video Fallback bypasses live calibration completely
    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-cal-2/pursuit-test']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/pursuit-test" element={<PursuitTestPage />} />
        </Routes>
      </MemoryRouter>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const sampleFile = new File(['mock-video'], 'sample.webm', { type: 'video/webm' });
    fireEvent.change(fileInput, { target: { files: [sampleFile] } });

    expect(screen.getByText(/Review Recorded Pursuit Sequence/i)).toBeInTheDocument();
    expect(screen.queryByTestId('calibration-check-panel')).not.toBeInTheDocument();

    URL.createObjectURL = createUrlOrig;
    mockGetContext.mockRestore();
    playSpy.mockRestore();
  });

  it('has complete EN, HI, ES, FR translations for calibration and clinical PDF export', () => {
    const expectedCalKeys = Object.keys(en.capture.calibration) as Array<
      keyof typeof en.capture.calibration
    >;
    for (const locale of [en, hi, es, fr]) {
      for (const key of expectedCalKeys) {
        expect(locale.capture.calibration[key]).toBeTruthy();
      }
      expect(locale.reportPage.exportClinicalPdf).toBeTruthy();
      expect(locale.reportPage.pdfGenerating).toBeTruthy();
      expect(locale.reportPage.pdfExportError).toBeTruthy();
    }
  });
});
