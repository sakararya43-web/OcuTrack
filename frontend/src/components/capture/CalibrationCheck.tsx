import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Crosshair,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { soundFx } from '../../lib/soundFx';

/**
 * Formats calibration telemetry for backend pupil_metadata / pursuit_metadata without
 * breaking existing FastAPI upload endpoints or schemas.
 */
export function buildCalibrationUploadMetadata(
  result: CalibrationResult | null,
  isFallback: boolean
): Record<string, unknown> {
  if (isFallback || !result) return {};
  return {
    calibration: {
      passed: result.passed,
      stability_score: result.stabilityScore,
      mean_jitter: result.meanJitter,
      mean_luminance: result.meanLuminance,
      sample_count: result.sampleCount,
      overridden: result.overridden,
      ...(result.note ? { note: result.note } : {}),
    },
    ...(result.note ? { calibration_note: result.note } : {}),
  };
}

interface CalibrationStatusBadgeProps {
  result: CalibrationResult;
  canRecalibrate: boolean;
  onRecalibrate: () => void;
  testId?: string;
}

export const CalibrationStatusBadge: React.FC<CalibrationStatusBadgeProps> = ({
  result,
  canRecalibrate,
  onRecalibrate,
  testId = 'calibration-status-badge',
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5">
      <span
        data-testid={testId}
        className={`px-2.5 py-1 rounded-sm border text-[11px] font-semibold tabular-nums ${
          result.overridden
            ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
            : 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]'
        }`}
      >
        {result.overridden
          ? t('capture.calibration.headerOverride', { score: result.stabilityScore })
          : t('capture.calibration.headerPassed', { score: result.stabilityScore })}
      </span>
      {canRecalibrate && (
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onRecalibrate();
          }}
          className="btn-ramp-secondary rounded-md py-1 px-2 text-[11px] font-mono"
        >
          <RefreshCw className="w-3 h-3" aria-hidden="true" />
          <span>{t('capture.calibration.recalibrateShort')}</span>
        </button>
      )}
    </div>
  );
};

export interface CalibrationPoint {
  id: string;
  code: string;
  xPct: number;
  yPct: number;
}

export const CALIBRATION_POINTS: CalibrationPoint[] = [
  { id: 'center', code: 'P1 CTR', xPct: 50, yPct: 50 },
  { id: 'top-left', code: 'P2 TL', xPct: 20, yPct: 22 },
  { id: 'top-right', code: 'P3 TR', xPct: 80, yPct: 22 },
  { id: 'bottom-right', code: 'P4 BR', xPct: 80, yPct: 78 },
  { id: 'bottom-left', code: 'P5 BL', xPct: 20, yPct: 78 },
];

export const CALIBRATION_POINT_DURATION_MS = 1000;
export const CALIBRATION_TOTAL_DURATION_MS =
  CALIBRATION_POINTS.length * CALIBRATION_POINT_DURATION_MS;
export const CALIBRATION_SAMPLE_INTERVAL_MS = 67; // ~15 FPS
export const CALIBRATION_PASS_THRESHOLD = 75;
export const CALIBRATION_AUTO_UNLOCK_MS = 1500;

export interface CalibrationResult {
  passed: boolean;
  stabilityScore: number;
  meanJitter: number;
  meanLuminance: number;
  sampleCount: number;
  overridden: boolean;
  note?: 'low_calibration_stability';
  completedAt: string;
}

export interface FrameJitterMetrics {
  mad: number;
  luminanceDelta: number;
  meanLuminance: number;
  instantScore: number;
}

/**
 * Extracts sub-sampled grayscale luminance values (0..255) from RGBA ImageData.
 * Samples every 2nd pixel across the 160x120 off-screen frame (9,600 samples).
 */
export function extractLuminanceSamples(rgba: Uint8ClampedArray): Uint8Array {
  const pixelCount = Math.floor(rgba.length / 4);
  const sampleLen = Math.ceil(pixelCount / 2);
  const lum = new Uint8Array(sampleLen);
  let outIdx = 0;
  for (let p = 0; p < pixelCount; p += 2) {
    const base = p * 4;
    lum[outIdx++] = Math.round(
      0.299 * rgba[base] + 0.587 * rgba[base + 1] + 0.114 * rgba[base + 2]
    );
  }
  return lum;
}

/**
 * Computes frame-to-frame luminance MAD, ambient brightness drift, and
 * instantaneous calibration stability score (0..100).
 */
export function computeFrameJitterMetrics(
  prevLum: Uint8Array | null,
  currLum: Uint8Array,
  prevMeanLum: number | null
): FrameJitterMetrics {
  let lumSum = 0;
  let diffSum = 0;
  const len = currLum.length;

  for (let i = 0; i < len; i++) {
    const c = currLum[i];
    lumSum += c;
    if (prevLum && i < prevLum.length) {
      diffSum += Math.abs(c - prevLum[i]);
    }
  }

  const meanLuminance = len > 0 ? lumSum / len : 0;
  const mad = prevLum && len > 0 ? diffSum / len : 0;
  const luminanceDelta = prevMeanLum !== null ? Math.abs(meanLuminance - prevMeanLum) : 0;

  // Penalize camera/head jitter above baseline webcam sensor noise (~1.2 MAD),
  // sudden ambient illumination drift, and severely dark/occluded frames.
  const motionPenalty = Math.max(0, (mad - 1.2) * 3.1);
  const lumFlickerPenalty = Math.max(0, (luminanceDelta - 0.8) * 1.1);
  const darkPenalty = meanLuminance < 6 ? 35 : 0;

  const instantScore = Math.max(
    0,
    Math.min(100, Math.round(100 - motionPenalty - lumFlickerPenalty - darkPenalty))
  );

  return {
    mad,
    luminanceDelta,
    meanLuminance,
    instantScore,
  };
}

interface CalibrationCheckProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onCalibrationComplete: (result: CalibrationResult) => void;
  onSkipForDemo?: () => void;
  className?: string;
}

type CalibrationPhase = 'running' | 'passed' | 'high_jitter';

export const CalibrationCheck: React.FC<CalibrationCheckProps> = ({
  videoRef,
  onCalibrationComplete,
  onSkipForDemo,
  className = '',
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [runNonce, setRunNonce] = useState<number>(0);
  const [phase, setPhase] = useState<CalibrationPhase>('running');
  const [activePointIndex, setActivePointIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(100);
  const [liveJitter, setLiveJitter] = useState<number>(0);
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [finalResult, setFinalResult] = useState<CalibrationResult | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onCalibrationComplete);
  onCompleteRef.current = onCalibrationComplete;

  const handleConfirmResult = useCallback((result: CalibrationResult) => {
    if (completedRef.current) return;
    completedRef.current = true;
    soundFx.playClick();
    onCompleteRef.current(result);
  }, []);

  const handleRecalibrate = useCallback(() => {
    soundFx.playClick();
    completedRef.current = false;
    setFinalResult(null);
    setPhase('running');
    setActivePointIndex(0);
    setElapsedMs(0);
    setLiveScore(100);
    setLiveJitter(0);
    setSampleCount(0);
    setRunNonce((n) => n + 1);
  }, []);

  // Run the 5-second coordinate sequence + ~15 FPS off-screen canvas frame-jitter sampling
  useEffect(() => {
    completedRef.current = false;
    const startTs = Date.now();

    if (!canvasRef.current && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 120;
      canvasRef.current = c;
    }

    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    if (canvas) {
      try {
        ctx = canvas.getContext('2d', { willReadFrequently: true });
      } catch {
        ctx = null;
      }
    }

    let prevLum: Uint8Array | null = null;
    let prevMeanLum: number | null = null;
    let emaScore = 100;
    const scoreSamples: number[] = [];
    const madSamples: number[] = [];
    const lumSamples: number[] = [];
    let capturedCount = 0;

    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(CALIBRATION_TOTAL_DURATION_MS, now - startTs);
      setElapsedMs(elapsed);

      const pointIdx = Math.min(
        CALIBRATION_POINTS.length - 1,
        Math.floor(elapsed / CALIBRATION_POINT_DURATION_MS)
      );
      setActivePointIndex(pointIdx);

      // Sample live video frame onto 160x120 off-screen canvas
      const videoEl = videoRef.current;
      if (
        ctx &&
        videoEl &&
        videoEl.readyState >= 2 &&
        videoEl.videoWidth > 0 &&
        videoEl.videoHeight > 0
      ) {
        try {
          ctx.drawImage(videoEl, 0, 0, 160, 120);
          const imageData = ctx.getImageData(0, 0, 160, 120);
          const currLum = extractLuminanceSamples(imageData.data);
          const metrics = computeFrameJitterMetrics(prevLum, currLum, prevMeanLum);

          if (prevLum !== null) {
            emaScore = Math.round(emaScore * 0.65 + metrics.instantScore * 0.35);
            scoreSamples.push(metrics.instantScore);
            madSamples.push(metrics.mad);
            setLiveScore(emaScore);
            setLiveJitter(Number(metrics.mad.toFixed(1)));
          }

          lumSamples.push(metrics.meanLuminance);
          prevLum = currLum;
          prevMeanLum = metrics.meanLuminance;
          capturedCount += 1;
          setSampleCount(capturedCount);
        } catch {
          // Ignore transient tainted/unready frame reads
        }
      }

      if (elapsed >= CALIBRATION_TOTAL_DURATION_MS) {
        window.clearInterval(timer);

        const hasAnalyzedPairs = scoreSamples.length > 0;
        const avgScore = hasAnalyzedPairs
          ? Math.round(scoreSamples.reduce((a, b) => a + b, 0) / scoreSamples.length)
          : 0; // Zero decoded frame pairs indicates unready/frozen stream and enters recalibrate/override gate
        const avgJitter =
          madSamples.length > 0
            ? Number((madSamples.reduce((a, b) => a + b, 0) / madSamples.length).toFixed(2))
            : 0;
        const avgLum =
          lumSamples.length > 0
            ? Number((lumSamples.reduce((a, b) => a + b, 0) / lumSamples.length).toFixed(1))
            : 0;

        const passed = avgScore >= CALIBRATION_PASS_THRESHOLD;
        const result: CalibrationResult = {
          passed,
          stabilityScore: avgScore,
          meanJitter: avgJitter,
          meanLuminance: avgLum,
          sampleCount: capturedCount,
          overridden: false,
          completedAt: new Date().toISOString(),
        };

        setLiveScore(avgScore);
        setFinalResult(result);
        setPhase(passed ? 'passed' : 'high_jitter');
        if (passed) {
          soundFx.playSuccess();
        }
      }
    }, CALIBRATION_SAMPLE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [runNonce, videoRef]);

  // 1.5s auto-unlock after passing calibration
  useEffect(() => {
    if (phase !== 'passed' || !finalResult) return;
    const autoTimer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current(finalResult);
      }
    }, CALIBRATION_AUTO_UNLOCK_MS);

    return () => {
      window.clearTimeout(autoTimer);
    };
  }, [phase, finalResult]);

  const activePoint = CALIBRATION_POINTS[activePointIndex] || CALIBRATION_POINTS[0];
  const progressPct = Math.min(100, (elapsedMs / CALIBRATION_TOTAL_DURATION_MS) * 100);
  const isScoreHealthy = liveScore >= CALIBRATION_PASS_THRESHOLD;

  return (
    <div
      data-testid="calibration-check-panel"
      className={`panel-ramp overflow-hidden border border-[#CBD5E1] shadow-ramp-card bg-white ${className}`}
    >
      {/* Top Clinical Telemetry Header */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-sm bg-[#0F172A] text-white">
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              {t('capture.calibration.title')}
            </h3>
            <p className="text-[11px] font-sans text-[#475569]">
              {t('capture.calibration.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className="px-2 py-1 rounded-sm bg-white border border-[#CBD5E1] text-[#0F172A] tabular-nums font-semibold"
            data-testid="calibration-point-indicator"
          >
            {activePoint.code} ({activePointIndex + 1}/{CALIBRATION_POINTS.length})
          </span>
          <span className="px-2 py-1 rounded-sm bg-white border border-[#CBD5E1] text-[#475569] tabular-nums">
            {(elapsedMs / 1000).toFixed(1)}s / 5.0s
          </span>
          {onSkipForDemo && phase === 'running' && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onSkipForDemo();
              }}
              className="px-2.5 py-1 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#475569] text-[11px] font-mono font-medium transition-colors"
            >
              {t('capture.calibration.skipDemoBtn')}
            </button>
          )}
        </div>
      </div>

      {/* 5-Point Crosshair Arena (Dedicated Coordinate Stage with Hairline Ticks) */}
      <div className="relative w-full h-64 sm:h-72 bg-[#0F1117] border-b border-[#27282D] overflow-hidden select-none">
        {/* Technical Coordinate Ticks & Axis Hairlines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute inset-3 border border-white/10 pointer-events-none" />

          {/* Corner Coordinate Markers */}
          {CALIBRATION_POINTS.map((pt, idx) => {
            const isCurrent = idx === activePointIndex && phase === 'running';
            const isVisited = idx < activePointIndex || phase !== 'running';
            return (
              <div
                key={pt.id}
                style={{ left: `${pt.xPct}%`, top: `${pt.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                <div
                  className={`w-2.5 h-2.5 border transition-colors ${
                    isCurrent
                      ? 'border-[#14B8A6] bg-[#14B8A6]/30'
                      : isVisited
                      ? 'border-white/40 bg-white/15'
                      : 'border-white/20 bg-transparent'
                  }`}
                />
                <span className="mt-1 text-[9px] font-mono text-white/35 tabular-nums">
                  {pt.xPct},{pt.yPct}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated Crosshair Target */}
        <motion.div
          data-testid="calibration-crosshair"
          animate={{
            left: `${activePoint.xPct}%`,
            top: `${activePoint.yPct}%`,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 260, damping: 24 }
          }
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          <div className="relative flex items-center justify-center w-12 h-12">
            <div className="w-8 h-8 rounded-sm border-2 border-[#14B8A6] bg-[#0F766E]/25 flex items-center justify-center">
              <div className="w-2 h-2 bg-white" />
            </div>
            <div className="absolute w-12 h-px bg-[#14B8A6]/70" />
            <div className="absolute h-12 w-px bg-[#14B8A6]/70" />
          </div>
        </motion.div>

        {/* Bottom Arena Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#14B8A6] transition-all duration-75 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Live Stability Telemetry & Gate Footer (Zero Overlap) */}
      <div className="p-4 space-y-3.5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center font-mono text-xs">
          {/* Stability Score Readout */}
          <div className="p-2.5 rounded-sm bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
              {t('capture.calibration.stabilityLabel')}
            </span>
            <span
              data-testid="calibration-stability-score"
              className={`text-sm font-bold tabular-nums ${
                isScoreHealthy ? 'text-[#0F766E]' : 'text-[#B45309]'
              }`}
            >
              {liveScore}%
            </span>
          </div>

          {/* Live Jitter Meter */}
          <div className="sm:col-span-2 p-2.5 rounded-sm bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className="text-[#64748B] font-semibold flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#0F172A]" aria-hidden="true" />
                {t('capture.calibration.jitterMeterLabel')}
              </span>
              <span className="text-[#475569] tabular-nums">
                MAD {liveJitter.toFixed(1)} | {sampleCount} {t('capture.calibration.framesUnit')}
              </span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] rounded-sm overflow-hidden">
              <div
                data-testid="calibration-jitter-bar"
                className={`h-full transition-all duration-100 ${
                  isScoreHealthy ? 'bg-[#0F766E]' : 'bg-[#D97706]'
                }`}
                style={{ width: `${liveScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Gate: Running vs Passed vs High Jitter */}
        {phase === 'running' && (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#475569] pt-1">
            <span>{t('capture.calibration.followCrosshairHint')}</span>
            <span className="tabular-nums text-[#0F172A] font-semibold">
              {t('capture.calibration.samplingTelemetry')}
            </span>
          </div>
        )}

        {phase === 'passed' && finalResult && (
          <div
            data-testid="calibration-passed-gate"
            className="p-3.5 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-sm bg-[#0F766E] text-white font-mono text-[10px] font-bold tracking-wider uppercase">
                    {t('capture.calibration.stableBadge')}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
                    {finalResult.stabilityScore}%
                  </span>
                </div>
                <p className="text-[11px] font-sans text-[#334155]">
                  {t('capture.calibration.autoUnlockHint')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleConfirmResult(finalResult)}
              className="btn-ramp-accent rounded-md py-2 px-3.5 text-xs font-mono shrink-0"
            >
              <span>{t('capture.calibration.proceedBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {phase === 'high_jitter' && finalResult && (
          <div
            data-testid="calibration-jitter-gate"
            className="p-3.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-sm bg-[#B45309] text-white font-mono text-[10px] font-bold tracking-wider uppercase">
                    {t('capture.calibration.jitterBadge')}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
                    {finalResult.stabilityScore}%
                  </span>
                </div>
                <p className="text-xs font-sans text-[#92400E] leading-relaxed">
                  {t('capture.calibration.highJitterWarning')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleRecalibrate}
                className="btn-ramp-primary rounded-md py-2 px-3.5 text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('capture.calibration.recalibrate5sBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleConfirmResult({
                    ...finalResult,
                    overridden: true,
                    note: 'low_calibration_stability',
                  })
                }
                className="btn-ramp-secondary rounded-md py-2 px-3.5 text-xs font-mono"
              >
                <span>{t('capture.calibration.overrideBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
