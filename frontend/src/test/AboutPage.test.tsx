import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutPage } from '../pages/AboutPage';

describe('AboutPage', () => {
  it('renders clinical purpose header, authentic context, 4-stage pipeline walkthrough, and boundaries', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AboutPage />
      </MemoryRouter>
    );

    // 1. Clinical Purpose Header
    expect(
      screen.getByRole('heading', { name: /Addressing the Attention Bottleneck in Community Health/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Personal-Baseline Paradigm/i)).toBeInTheDocument();

    // 2. Authentic Context and User Roles
    expect(screen.getByText(/Community Health Worker/i)).toBeInTheDocument();
    expect(screen.getByText(/Supervising Clinician/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Healthcare clinician reviewing objective biometric data/i)).toBeInTheDocument();

    // 3. Interactive 4-Stage Pipeline Walkthrough
    expect(screen.getByText(/Interactive 4-Stage Pipeline Architecture/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Standardized Capture/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Computer Vision Extraction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Within-Session Temporal Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Longitudinal Baseline Comparison/i })).toBeInTheDocument();

    // 4. Clinical Safety, Limitations & Privacy Grid
    expect(screen.getByText(/What OcuTrack Supports/i)).toBeInTheDocument();
    expect(screen.getByText(/What OcuTrack Does NOT Conclude/i)).toBeInTheDocument();
    expect(screen.getByText(/No Disease Diagnosis:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ephemeral Video Storage:/i)).toBeInTheDocument();
  });

  it('allows clicking between pipeline architecture stages to inspect technical details', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AboutPage />
      </MemoryRouter>
    );

    // Initial stage: 01 Standardized Capture
    expect(screen.getByText(/STAGE 01 ARCHITECTURE/i)).toBeInTheDocument();

    // Click on Stage 02
    const stage2Btn = screen.getByRole('button', { name: /Computer Vision Extraction/i });
    fireEvent.click(stage2Btn);
    expect(screen.getByText(/STAGE 02 ARCHITECTURE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MediaPipe Face Landmarker/i).length).toBeGreaterThanOrEqual(1);

    // Click on Stage 03
    const stage3Btn = screen.getByRole('button', { name: /Within-Session Temporal Analysis/i });
    fireEvent.click(stage3Btn);
    expect(screen.getByText(/STAGE 03 ARCHITECTURE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Temporal Convolutional Network/i).length).toBeGreaterThanOrEqual(1);

    // Click on Stage 04
    const stage4Btn = screen.getByRole('button', { name: /Longitudinal Baseline Comparison/i });
    fireEvent.click(stage4Btn);
    expect(screen.getByText(/STAGE 04 ARCHITECTURE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Longitudinal Trajectory Comparison Engine/i).length).toBeGreaterThanOrEqual(1);
  });
});
