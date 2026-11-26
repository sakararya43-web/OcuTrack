import { useMemo } from 'react';
import { QualityStatus } from '../types/api';
import { STANDARD_REVIEW_MESSAGES } from '../lib/constants';
import { TranslateFn, defaultTranslator, useTranslation } from '../i18n';

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
export function evaluateRecordingQuality(
  input: RecordingQualityInput,
  t: TranslateFn = defaultTranslator
): RecordingQualityResult {
  const { durationMs, sizeBytes, observedSettings, testType, isFallback } = input;
  const checks: QualityCheckItem[] = [];
  const warnings: string[] = [];

  // If this is an approved fallback benchmark, mark as acceptable
  if (isFallback) {
    return {
      status: 'acceptable',
      isAcceptable: true,
      scoreRatio: 1.0,
      reviewMessage: t('review.qualityAcceptable', STANDARD_REVIEW_MESSAGES.QUALITY_ACCEPTABLE),
      warnings: [],
      checks: [
        {
          name: t('quality.calibratedName'),
          passed: true,
          severity: 'ok',
          message: t('quality.calibratedMsg'),
        },
      ],
    };
  }

  const sec = (durationMs / 1000).toFixed(1);
  const durationLabel = t('quality.durationName');

  // 1. Duration check (tolerant of rural clinic early stops that still cover flash/sweep)
  if (testType === 'pupil_reflex') {
    if (durationMs < 6000) {
      checks.push({
        name: durationLabel,
        passed: false,
        severity: 'error',
        message: t('quality.pupilShortErr', { sec }),
      });
      warnings.push(t('quality.pupilShortWarn'));
    } else if (durationMs < 12000) {
      checks.push({
        name: durationLabel,
        passed: true,
        severity: 'warning',
        message: t('quality.pupilNominalWarn', { sec }),
      });
      warnings.push(t('quality.pupilNominalWarnDesc'));
    } else {
      checks.push({
        name: durationLabel,
        passed: true,
        severity: 'ok',
        message: t('quality.nominalOk', { sec }),
      });
    }
  } else {
    // smooth_pursuit (10s nominal)
    if (durationMs < 4000) {
      checks.push({
        name: durationLabel,
        passed: false,
        severity: 'error',
        message: t('quality.pursuitShortErr', { sec }),
      });
      warnings.push(t('quality.pursuitShortWarn'));
    } else if (durationMs < 8000) {
      checks.push({
        name: durationLabel,
        passed: true,
        severity: 'warning',
        message: t('quality.pursuitNominalWarn', { sec }),
      });
      warnings.push(t('quality.pursuitNominalWarnDesc'));
    } else {
      checks.push({
        name: durationLabel,
        passed: true,
        severity: 'ok',
        message: t('quality.nominalOk', { sec }),
      });
    }
  }

  // 2. Video file size check (supports compressed low-res rural clinic streams >= 8 KB)
  if (sizeBytes !== undefined) {
    const kb = (sizeBytes / 1024).toFixed(1);
    const fileLabel = t('quality.fileSizeName');
    if (sizeBytes < 8000) {
      checks.push({
        name: fileLabel,
        passed: false,
        severity: 'error',
        message: t('quality.fileSmallErr', { kb }),
      });
      warnings.push(t('quality.fileSmallWarn'));
    } else {
      checks.push({
        name: fileLabel,
        passed: true,
        severity: 'ok',
        message: t('quality.fileOk', { kb }),
      });
    }
  }

  // 3. Resolution check (orientation-agnostic; supports QVGA 320x240+ rural devices)
  const width = observedSettings?.width;
  const height = observedSettings?.height;
  if (width && height) {
    const resLabel = t('quality.resolutionName');
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);

    if (shortSide < 240 || longSide < 320) {
      checks.push({
        name: resLabel,
        passed: false,
        severity: 'error',
        message: t('quality.resLowErr', { w: width, h: height }),
      });
      warnings.push(t('quality.resLowWarn'));
    } else if (shortSide < 480 || longSide < 640) {
      checks.push({
        name: resLabel,
        passed: true,
        severity: 'warning',
        message: t('quality.resSdMsg', { w: width, h: height }),
      });
      warnings.push(t('quality.resSdWarn'));
    } else {
      checks.push({
        name: resLabel,
        passed: true,
        severity: 'ok',
        message: t('quality.resHdOk', { w: width, h: height }),
      });
    }
  }

  // 4. Frame rate check (8 FPS minimum floor for low-end/dim-room rural clinic webcams)
  const frameRate = observedSettings?.frameRate;
  if (frameRate) {
    const fpsLabel = t('quality.frameRateName');
    if (frameRate < 8) {
      checks.push({
        name: fpsLabel,
        passed: false,
        severity: 'error',
        message: t('quality.fpsLowErr', { fps: frameRate }),
      });
      warnings.push(t('quality.fpsLowWarn'));
    } else if (frameRate < 15) {
      checks.push({
        name: fpsLabel,
        passed: true,
        severity: 'warning',
        message: t('quality.fps24Msg', { fps: frameRate }),
      });
      warnings.push(t('quality.fps24Warn'));
    } else {
      checks.push({
        name: fpsLabel,
        passed: true,
        severity: 'ok',
        message: t('quality.fpsOk', { fps: frameRate }),
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
    ? t('review.qualityAcceptable', STANDARD_REVIEW_MESSAGES.QUALITY_ACCEPTABLE)
    : t('review.qualityInsufficient', STANDARD_REVIEW_MESSAGES.QUALITY_INSUFFICIENT);

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
  const { t } = useTranslation();

  return useMemo(() => {
    if (!input) return null;
    return evaluateRecordingQuality(input, t);
  }, [
    input?.durationMs,
    input?.sizeBytes,
    input?.observedSettings?.width,
    input?.observedSettings?.height,
    input?.observedSettings?.frameRate,
    input?.testType,
    input?.isFallback,
    t,
  ]);
}
