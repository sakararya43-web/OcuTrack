import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AssessmentReportPage } from '../pages/AssessmentReportPage';

describe('AssessmentReportPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders report with extracted features, units, charts, and non-diagnostic disclaimer', async () => {
    const mockDetail = {
      assessment_id: 'asm-test-report',
      patient_id: 'OT-4091',
      status: 'complete',
      quality_status: 'acceptable',
      assessment_at: '2026-11-16T12:00:00Z',
      protocol_version: 'ocutrack-protocol-0.1',
      review_message: 'Change detected — consider repeat measurement and clinical review',
      warnings: ['Transient motion artifact at 12.1s'],
      quality: {
        status: 'acceptable',
        usable_frame_ratio: 0.96,
        warnings: ['Transient motion artifact at 12.1s'],
      },
      pupil: {
        status: 'complete',
        features: {
          constriction_latency: { value: 245, unit: 'ms', label: 'Constriction Latency' },
          constriction_velocity: { value: 4.3, unit: 'mm/s', label: 'Constriction Velocity' },
          baseline_diameter: { value: 4.8, unit: 'mm', label: 'Baseline Diameter' },
        },
        series: [
          { t_ms: 0, value: 4.8, valid: true },
          { t_ms: 5000, value: 4.8, valid: true },
          { t_ms: 5300, value: 3.2, valid: true },
        ],
      },
      pursuit: {
        status: 'complete',
        features: {
          tracking_gain: { value: 0.92, unit: 'ratio', label: 'Smooth Pursuit Gain' },
          tracking_rmse: { value: 3.8, unit: '%', label: 'Tracking RMSE' },
        },
        series: [
          { t_ms: 0, target_x: 0.5, eye_x: 0.5, valid: true },
          { t_ms: 1000, target_x: 0.7, eye_x: 0.68, valid: true },
        ],
      },
      longitudinal_comparison: {
        status: 'comparable',
        baseline_id: 'asm-baseline-001',
        feature_deltas: {
          constriction_latency: { delta: 25.0, unit: 'ms', direction: 'increased' },
          constriction_velocity: { delta: -0.4, unit: 'mm/s', direction: 'decreased' },
        },
      },
      temporal_model: {
        status: 'experimental',
        model_name: 'TCN-Temporal-Evaluator-v0.1',
        notes: 'Sequence dynamics evaluated. Experimental model output; not clinically validated.',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-test-report/report']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/report" element={<AssessmentReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ocular Measurement & Biomarker Report')).toBeInTheDocument();
    });

    // Verify patient ID & review finding
    expect(screen.getByText('OT-4091')).toBeInTheDocument();
    expect(screen.getByText(/Change detected — consider repeat measurement and clinical review/i)).toBeInTheDocument();

    // Verify feature values and units
    expect(screen.getAllByText('Constriction Latency').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getAllByText('Constriction Velocity').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4.3')).toBeInTheDocument();

    // Verify TCN model card and mandatory non-diagnostic notice
    expect(screen.getByText('Experimental Model Output')).toBeInTheDocument();
    expect(screen.getByText(/TCN-Temporal-Evaluator-v0.1/i)).toBeInTheDocument();
    expect(screen.getByText('Notice of Regulatory & Clinical Status')).toBeInTheDocument();

    // Verify delta table
    expect(screen.getByText('+25.00')).toBeInTheDocument();
    expect(screen.getByText('-0.40')).toBeInTheDocument();
  });
});
