import { useMemo } from 'react';
import { QualityStatus } from '../types/api';
import { STANDARD_REVIEW_MESSAGES } from '../lib/constants';

export interface CameraObservedSettings {
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface RecordingQualityInput {
  durationMs: number;
  sizeBytes?: number;
  observedSettings?: CameraObservedSettings | null;
  testType: 'pupil_reflex' | 'smooth_pursuit';
  isFallback?: boolean;
}

export interface QualityCheckItem {
  name: string;
  passed: boolean;
  severity: 'ok' | 'warning' | 'error';
  message: string;
}

export interface RecordingQualityResult {
  status: QualityStatus;
  isAcceptable: boolean;
  scoreRatio: number; // 0.0 - 1.0
  reviewMessage: string;
  warnings: string[];
  checks: QualityCheckItem[];
}

/**
 * Evaluates video capture parameters against clinical protocol quality standards.
 */
export function evaluateRecordingQuality(input: RecordingQualityInput): RecordingQualityResult {
  const { durationMs, sizeBytes, observedSettings, testType, isFallback } = input;
  const checks: QualityCheckItem[] = [];
  const warnings: string[] = [];

  // If this is an approved fallback benchmark, mark as acceptable
  if (isFallback) {
    return {
      status: 'acceptable',
      isAcceptable: true,
      scoreRatio: 1.0,
      reviewMessage: STANDARD_REVIEW_MESSAGES.QUALITY_ACCEPTABLE,
      warnings: [],
      checks: [
        {
          name: 'Calibrated Benchmark',
          passed: true,
          severity: 'ok',
          message: 'Calibrated reference dataset with verified frame rate and ground truth.',
        },
      ],
    };
  }

  // 1. Duration check
  if (testType === 'pupil_reflex') {
    if (durationMs < 8000) {
      checks.push({
        name: 'Duration',
        passed: false,
        severity: 'error',
        message: `Duration (${(durationMs / 1000).toFixed(1)}s) too short (< 8s) for pupil reflex.`,
      });
      warnings.push('Recording duration too short for pupil reflex evaluation.');
    } else if (durationMs < 12000) {
      checks.push({
        name: 'Duration',
        passed: true,
        severity: 'warning',
        message: `Duration (${(durationMs / 1000).toFixed(1)}s) shorter than nominal 15s protocol.`,
      });
      warnings.push('Duration shorter than nominal 15s; recovery phase may be truncated.');
    } else {
      checks.push({
        name: 'Duration',
        passed: true,
        severity: 'ok',
        message: `Nominal duration achieved (${(durationMs / 1000).toFixed(1)}s).`,
      });
    }
  } else {
    // smooth_pursuit (10s nominal)
    if (durationMs < 5000) {
      checks.push({
        name: 'Duration',
        passed: false,
        severity: 'error',
        message: `Duration (${(durationMs / 1000).toFixed(1)}s) too short (< 5s) for smooth pursuit tracking.`,
      });
      warnings.push('Recording duration too short for smooth-pursuit tracking cycles.');
    } else if (durationMs < 8000) {
      checks.push({
        name: 'Duration',
        passed: true,
        severity: 'warning',
        message: `Duration (${(durationMs / 1000).toFixed(1)}s) shorter than nominal 10s protocol.`,
      });
      warnings.push('Duration shorter than nominal 10s; tracking cycles incomplete.');
    } else {
      checks.push({
        name: 'Duration',
        passed: true,
        severity: 'ok',
        message: `Nominal duration achieved (${(durationMs / 1000).toFixed(1)}s).`,
      });
    }
  }

  // 2. Video file size check (minimum decodability payload)
  if (sizeBytes !== undefined) {
    if (sizeBytes < 20000) {
      checks.push({
        name: 'File Size',
        passed: false,
        severity: 'error',
        message: `Payload (${(sizeBytes / 1024).toFixed(1)} KB) too small; video stream may be corrupted.`,
      });
      warnings.push('Payload size too small; stream may be empty or corrupted.');
    } else {
      checks.push({
        name: 'File Size',
        passed: true,
        severity: 'ok',
        message: `Decodable container payload size (${(sizeBytes / 1024).toFixed(1)} KB).`,
      });
    }
  }

  // 3. Resolution check
  const width = observedSettings?.width;
  const height = observedSettings?.height;
  if (width && height) {
    if (width < 640 || height < 480) {
      checks.push({
        name: 'Resolution',
        passed: false,
        severity: 'error',
        message: `Resolution (${width}x${height}) below minimum 640x480 standard.`,
      });
      warnings.push('Camera resolution below minimum 640x480 standard.');
    } else if (width < 1280 || height < 720) {
      checks.push({
        name: 'Resolution',
        passed: true,
        severity: 'warning',
        message: `Resolution (${width}x${height}) is standard definition; 720p recommended.`,
      });
      warnings.push('Resolution below 720p; may reduce pupil contour subpixel accuracy.');
    } else {
      checks.push({
        name: 'Resolution',
        passed: true,
        severity: 'ok',
        message: `High definition resolution (${width}x${height}).`,
      });
    }
  }

  // 4. Frame rate check
  const frameRate = observedSettings?.frameRate;
  if (frameRate) {
    if (frameRate < 15) {
      checks.push({
        name: 'Frame Rate',
        passed: false,
        severity: 'error',
        message: `Frame rate (${frameRate} FPS) below 15 FPS; insufficient for latency estimation.`,
      });
      warnings.push('Frame rate below 15 FPS; insufficient temporal resolution.');
    } else if (frameRate < 24) {
      checks.push({
        name: 'Frame Rate',
        passed: true,
        severity: 'warning',
        message: `Frame rate (${frameRate} FPS) below 24 FPS.`,
      });
      warnings.push('Frame rate below 24 FPS; latency jitter possible.');
    } else {
      checks.push({
        name: 'Frame Rate',
        passed: true,
        severity: 'ok',
        message: `Temporal sampling rate (${frameRate} FPS) acceptable.`,
      });
    }
  }

  // Determine overall status
  const hasErrors = checks.some((c) => c.severity === 'error');
  const errorCount = checks.filter((c) => c.severity === 'error').length;
  const warningCount = checks.filter((c) => c.severity === 'warning').length;
  const totalChecks = Math.max(checks.length, 1);

  const scoreRatio = Math.max(0, Math.min(1, (totalChecks - errorCount - warningCount * 0.5) / totalChecks));
  const isAcceptable = !hasErrors;
  const status: QualityStatus = isAcceptable ? 'acceptable' : 'insufficient';
  const reviewMessage = isAcceptable
    ? STANDARD_REVIEW_MESSAGES.QUALITY_ACCEPTABLE
    : STANDARD_REVIEW_MESSAGES.QUALITY_INSUFFICIENT;

  return {
    status,
    isAcceptable,
    scoreRatio: Number(scoreRatio.toFixed(3)),
    reviewMessage,
    warnings,
    checks,
  };
}

/**
 * Reusable React Hook for evaluating capture quality
 */
export function useRecordingQuality(input: RecordingQualityInput | null): RecordingQualityResult | null {
  return useMemo(() => {
    if (!input) return null;
    return evaluateRecordingQuality(input);
  }, [
    input?.durationMs,
    input?.sizeBytes,
    input?.observedSettings?.width,
    input?.observedSettings?.height,
    input?.observedSettings?.frameRate,
    input?.testType,
    input?.isFallback,
  ]);
}
