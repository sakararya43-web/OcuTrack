import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpticalPupilLoader } from '../components/common/OpticalPupilLoader';
import { TelemetryWaveform } from '../components/common/TelemetryWaveform';
import { ScrollReveal } from '../components/common/ScrollReveal';

describe('Healthcare Animations and Primitives', () => {
  it('renders OpticalPupilLoader with accessible status role and labels', () => {
    render(
      <OpticalPupilLoader
        size="md"
        label="Calibrating Iris Contour"
        sublabel="Frame 12/450"
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Calibrating Iris Contour')).toBeInTheDocument();
    expect(screen.getByText('Frame 12/450')).toBeInTheDocument();
  });

  it('renders TelemetryWaveform for pupillary reflex and pursuit modes', () => {
    const { unmount } = render(
      <TelemetryWaveform
        variant="reflex"
        label="Pupillary Light Telemetry"
      />
    );

    expect(screen.getByText('Pupillary Light Telemetry')).toBeInTheDocument();
    expect(screen.getByText(/PLR Dynamics/i)).toBeInTheDocument();
    unmount();

    render(
      <TelemetryWaveform
        variant="pursuit"
        label="Smooth Pursuit Kinematics"
      />
    );

    expect(screen.getByText('Smooth Pursuit Kinematics')).toBeInTheDocument();
    expect(screen.getByText(/Target Velocity Gain/i)).toBeInTheDocument();
  });

  it('renders ScrollReveal component and displays children', () => {
    render(
      <ScrollReveal className="custom-scroll-class">
        <span>Clinical Content Block</span>
      </ScrollReveal>
    );

    expect(screen.getByText('Clinical Content Block')).toBeInTheDocument();
  });
});
