import { describe, it, expect } from 'vitest';
import { buildPatientSituationSummary, computeSequenceDynamics, interpretMetric } from '../lib/clinicalSummary';
import { AssessmentDetail } from '../types/api';

const baseAssessment: AssessmentDetail = {
  assessment_id: 'asm-1',
  patient_id: 'OT-1',
  status: 'complete',
  quality_status: 'acceptable',
  assessment_at: '2026-11-26T00:00:00Z',
  protocol_version: 'ocutrack-protocol-0.1',
};

describe('clinicalSummary', () => {
  it('returns Typical Response with baseline guidance when pupil & pursuit look steady', () => {
    const summary = buildPatientSituationSummary({
      ...baseAssessment,
      pupil: {
        status: 'complete',
        features: {
          baseline_diameter: { value: 30, unit: 'px_or_normalized', label: 'Baseline pupil size' },
          minimum_diameter: { value: 21, unit: 'px_or_normalized', label: 'Minimum pupil size' },
          constriction_amplitude: { value: 9, unit: 'px_or_normalized', label: 'Constriction amplitude' },
          response_latency_seconds: { value: 0.25, unit: 's', label: 'Pupil response latency' },
        },
      },
      pursuit: {
        status: 'complete',
        features: {
          mean_tracking_error: { value: 0.08, unit: 'normalized_screen_units', label: 'Mean tracking error' },
          tracking_continuity: { value: 0.92, unit: 'ratio', label: 'Tracking continuity' },
          corrective_movement_count: { value: 2, unit: 'count', label: 'Corrective movement candidates' },
        },
      },
      longitudinal_comparison: { status: 'not_available' },
    });

    expect(summary.level).toBe('typical');
    expect(summary.badgeText).toBe('Typical Response');
    expect(summary.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it('flags Clinician Review Advised when pupil reaction is minimal and tracking error is high', () => {
    const summary = buildPatientSituationSummary({
      ...baseAssessment,
      pupil: {
        status: 'complete',
        features: {
          baseline_diameter: { value: 30, unit: 'px_or_normalized', label: 'Baseline' },
          constriction_amplitude: { value: 1, unit: 'px_or_normalized', label: 'Amplitude' },
          response_latency_seconds: { value: 0.72, unit: 's', label: 'Latency' },
        },
      },
      pursuit: {
        status: 'complete',
        features: {
          mean_tracking_error: { value: 0.31, unit: 'normalized_screen_units', label: 'Error' },
          tracking_continuity: { value: 0.42, unit: 'ratio', label: 'Continuity' },
        },
      },
    });

    expect(summary.level).toBe('review');
    expect(summary.badgeText).toBe('Clinician Review Advised');
  });

  it('returns Retake Needed when quality is insufficient', () => {
    const summary = buildPatientSituationSummary({
      ...baseAssessment,
      quality_status: 'insufficient',
      quality: { status: 'insufficient', usable_frame_ratio: 0.25, warnings: [] },
    });

    expect(summary.level).toBe('retake');
    expect(summary.badgeText).toBe('Retake Needed');
  });

  it('translates technical metric keys into plain labels', () => {
    const interp = interpretMetric('constriction_amplitude', { value: 8, unit: 'px_or_normalized', label: 'Constriction amplitude' }, {
      baseline_diameter: { value: 32, unit: 'px_or_normalized', label: 'Baseline' },
    });
    expect(interp.plainLabel).toBe('Light Reaction Strength');
    expect(interp.statusLabel).toBe('Strong');
    expect(interp.tone).toBe('good');
  });

  it('computes deterministic sequence dynamics from pupil and pursuit series', () => {
    const dynamics = computeSequenceDynamics({
      ...baseAssessment,
      pupil: {
        status: 'complete',
        series: [
          { t_ms: 0, value: 30, valid: true },
          { t_ms: 2000, value: 30, valid: true },
          { t_ms: 5500, value: 20, valid: true },
          { t_ms: 7000, value: 22, valid: true },
          { t_ms: 10000, value: 27, valid: true },
        ],
      },
      pursuit: {
        status: 'complete',
        series: [
          { t_ms: 0, target_x: 0.5, eye_x: 0.5, valid: true },
          { t_ms: 2000, target_x: 0.7, eye_x: 0.68, valid: true },
          { t_ms: 4000, target_x: 0.3, eye_x: 0.32, valid: true },
        ],
      },
    });

    expect(dynamics.some((d) => d.label === 'Pupil Curve Continuity' && d.value.includes('100%'))).toBe(true);
    expect(dynamics.some((d) => d.label === 'Pupil Recovery Toward Baseline' && d.value === '70%')).toBe(true);
    expect(dynamics.some((d) => d.label === 'Target Tracking Rhythm' && d.value === '100% on target')).toBe(true);
  });
});
