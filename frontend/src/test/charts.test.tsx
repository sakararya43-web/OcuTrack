import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PupilCurveChart } from '../components/charts/PupilCurveChart';
import { SmoothPursuitChart } from '../components/charts/SmoothPursuitChart';
import { BaselineComparisonView } from '../components/charts/BaselineComparisonView';
import { LongitudinalTrendChart } from '../components/charts/LongitudinalTrendChart';

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
});
