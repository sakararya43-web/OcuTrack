import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PupilCurveChart } from '../components/charts/PupilCurveChart';
import { SmoothPursuitChart } from '../components/charts/SmoothPursuitChart';
import { BaselineComparisonView } from '../components/charts/BaselineComparisonView';
import { LongitudinalTrendChart } from '../components/charts/LongitudinalTrendChart';
import { SequenceDynamicsSection } from '../components/charts/SequenceDynamicsSection';

describe('Chart components fallback states', () => {
  it('renders clean fallback when pupil curve series is missing', () => {
    render(<PupilCurveChart series={[]} />);
    expect(screen.getByText('Pupil Time-Series Data Unavailable')).toBeInTheDocument();
  });

  it('renders clean fallback when pursuit series is missing', () => {
    render(<SmoothPursuitChart series={[]} />);
    expect(screen.getByText('Pursuit Kinematic Series Unavailable')).toBeInTheDocument();
  });

  it('renders clean baseline notice when no baseline comparison exists', () => {
    render(<BaselineComparisonView comparison={null} />);
    expect(screen.getByText(/No historical baseline is available for comparison/i)).toBeInTheDocument();
  });

  it('renders non-comparable protocol warning when comparability status is not_comparable', () => {
    render(
      <BaselineComparisonView
        comparison={{
          status: 'not_comparable',
          comparability_reason: 'Different frame rates between sessions preclude direct comparison.',
        }}
      />
    );
    expect(screen.getByText('Assessments Not Directly Comparable')).toBeInTheDocument();
    expect(screen.getByText(/Different frame rates between sessions/i)).toBeInTheDocument();
  });

  it('renders longitudinal building notice when fewer than 2 assessments exist', () => {
    render(<LongitudinalTrendChart data={[{ assessmentDate: '2026-11-16T00:00:00Z', latencyMs: 240 }]} />);
    expect(screen.getByText('Longitudinal History Building')).toBeInTheDocument();
  });

  it('renders interactive phase zoom controls and peak drop badge on PupilCurveChart', () => {
    render(
      <PupilCurveChart
        series={[
          { t_ms: 0, value: 40, valid: true },
          { t_ms: 4000, value: 40, valid: true },
          { t_ms: 5500, value: 28, valid: true },
          { t_ms: 8000, value: 36, valid: true },
        ]}
      />
    );
    expect(screen.getByText(/Peak drop: -30% at 5.5s/i)).toBeInTheDocument();
    const flashBtn = screen.getByRole('button', { name: 'Flash Reaction' });
    fireEvent.click(flashBtn);
    expect(screen.getByText(/Selected Time:/i)).toBeInTheDocument();
  });

  it('smooths dense jittery pupil series and toggles between Smoothed and Raw Frames', () => {
    const jitterySeries = Array.from({ length: 16 }, (_, idx) => {
      const t_ms = idx * 1000;
      const base = idx >= 5 && idx <= 7 ? 15 : 22;
      // Inject an extreme 1-frame 42px spike and a valid blink gap
      if (idx === 3) return { t_ms, value: 42, valid: true };
      if (idx === 10) return { t_ms, value: null, valid: false };
      return { t_ms, value: base, valid: true };
    });

    render(<PupilCurveChart series={jitterySeries} unit="px_or_normalized" />);

    const rawBtn = screen.getByRole('button', { name: 'Raw Frames' });
    const smoothBtn = screen.getByRole('button', { name: 'Smoothed' });
    expect(smoothBtn).toHaveClass('bg-[#0F172A]');

    fireEvent.click(rawBtn);
    expect(rawBtn).toHaveClass('bg-[#0F172A]');
  });

  it('renders interactive trajectory/gap toggle and match badge on SmoothPursuitChart', () => {
    render(
      <SmoothPursuitChart
        series={[
          { t_ms: 0, target_x: 0.5, eye_x: 0.5, valid: true },
          { t_ms: 3000, target_x: 0.8, eye_x: 0.76, valid: true },
          { t_ms: 7000, target_x: 0.2, eye_x: 0.22, valid: true },
        ]}
      />
    );
    expect(screen.getByText(/Tracking Match: 98%/i)).toBeInTheDocument();
    const gapBtn = screen.getByRole('button', { name: 'Tracking Gap (%)' });
    fireEvent.click(gapBtn);
    expect(screen.getByText(/Gaze Offset from Dot/i)).toBeInTheDocument();
  });

  it('renders interactive SequenceDynamicsSection with clickable metrics, phases, and AI info toggle', () => {
    render(
      <SequenceDynamicsSection
        assessment={{
          assessment_id: 'asm-seq',
          patient_id: 'OT-1',
          status: 'complete',
          quality_status: 'acceptable',
          assessment_at: '2026-11-26T00:00:00Z',
          protocol_version: 'ocutrack-protocol-0.1',
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
          temporal_model: {
            status: 'not_configured',
            model_name: 'ocutrack-tcn-experimental',
            notes: 'Experimental model output; not clinically validated.',
          },
        }}
        isInsufficientQuality={false}
        modelPrefixLabel="Model:"
        experimentalBadgeLabel="Experimental Model Output"
        defaultNotes="Default notes"
      />
    );

    expect(screen.getByText('Eye Movement & Recovery Rhythm')).toBeInTheDocument();
    expect(screen.getByText(/Steady Rhythm/i)).toBeInTheDocument();

    // Switch phase breakdown button
    fireEvent.click(screen.getByRole('button', { name: '2. Middle' }));
    expect(screen.getByText(/Mid-test stability was/i)).toBeInTheDocument();

    // Expand AI Model Info drawer
    fireEvent.click(screen.getByRole('button', { name: /AI Model Info/i }));
    expect(screen.getByText(/Experimental model output; not clinically validated/i)).toBeInTheDocument();
  });
});
