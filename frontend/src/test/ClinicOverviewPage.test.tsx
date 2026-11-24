import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClinicOverviewPage } from '../pages/ClinicOverviewPage';
import { LanguageProvider } from '../i18n';
import { AuthProvider } from '../context/AuthContext';

const renderClinicOverview = () => {
  return render(
    <MemoryRouter initialEntries={['/clinic-overview']}>
      <LanguageProvider>
        <AuthProvider>
          <ClinicOverviewPage />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('ClinicOverviewPage (Phase 4)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders collective analytics header, guardrail badges, and dataset toggle', async () => {
    renderClinicOverview();

    expect(await screen.findByText(/COLLECTIVE TELEMETRY/i)).toBeInTheDocument();
    expect(screen.getByText(/NO CROSS-PATIENT PUPIL AVERAGING/i)).toBeInTheDocument();
    expect(screen.getByText(/Clinic Triage & Collective Quality Telemetry/i)).toBeInTheDocument();

    // Toggle controls
    expect(screen.getByRole('button', { name: /Live Backend Data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Demo Dataset/i })).toBeInTheDocument();
  });

  it('renders maximalist 4-card telemetry KPI strip with high-density values', async () => {
    renderClinicOverview();

    expect(await screen.findByText(/Total Assessments Logged/i)).toBeInTheDocument();
    expect(screen.getByText(/148/)).toBeInTheDocument();

    expect(screen.getAllByText(/Attention Priority Queue/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^8$/)).toBeInTheDocument();

    expect(screen.getAllByText(/Capture Quality Pass Rate/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/92\.6%/i)).toBeInTheDocument();

    expect(screen.getByText(/Active Longitudinal Cohort/i)).toBeInTheDocument();
    expect(screen.getByText(/^34$/)).toBeInTheDocument();
  });

  it('renders interactive triage and quality failure visualization sections with timeframe controls', async () => {
    renderClinicOverview();

    expect(await screen.findByText(/Triage Status Distribution Over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Capture Quality & Field Failure Diagnostics/i)).toBeInTheDocument();

    // Timeframe filter buttons
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();

    // Field diagnostics badge
    expect(screen.getByText(/Field Diagnostics/i)).toBeInTheDocument();
  });

  it('renders attention priority queue table and filters records by classification', async () => {
    renderClinicOverview();

    expect(await screen.findByText(/COLLECTIVE TELEMETRY/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Attention Priority Queue/i).length).toBeGreaterThanOrEqual(2);

    // Check table headers
    expect(screen.getByRole('columnheader', { name: /Pseudonymous ID/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Visit Date/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Capture Quality/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Key Feature Delta/i })).toBeInTheDocument();

    // Check presence of flagged patient codes
    expect(screen.getByText(/PT-2026-0812/i)).toBeInTheDocument();
    expect(screen.getByText(/PT-2026-0394/i)).toBeInTheDocument();
    expect(screen.getByText(/Constriction Latency: \+18\.4%/i)).toBeInTheDocument();

    // Click "Feature Changes Only" filter
    const changesOnlyBtn = screen.getByRole('button', { name: /Feature Changes Only/i });
    fireEvent.click(changesOnlyBtn);

    // Latency change item should remain visible
    expect(screen.getByText(/PT-2026-0812/i)).toBeInTheDocument();

    // Click "Quality Failures Only" filter
    const qualityOnlyBtn = screen.getByRole('button', { name: /Quality Failures Only/i });
    fireEvent.click(qualityOnlyBtn);

    // PT-0451 has an insufficient quality flag
    expect(screen.getByText(/PT-2026-0451/i)).toBeInTheDocument();
    expect(screen.getByText(/Frame visibility dropped to 64\.2%/i)).toBeInTheDocument();
  });

  it('displays scientific guardrail disclosure on why cross-patient averaging is avoided', async () => {
    renderClinicOverview();

    expect(await screen.findByText(/Scientific Guardrail:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cross-patient pupil size averaging is deliberately avoided to prevent diagnostic false positives/i)
    ).toBeInTheDocument();
  });
});
