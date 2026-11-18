import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';

describe('DashboardPage and PatientDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Dashboard KPIs and patient table including nullable age_band safely', async () => {
    const mockPatients = [
      {
        patient_id: 'p-101',
        pseudonymous_code: 'OT-1001',
        age_band: '40-49',
        context_notes: 'Baseline cohort',
        created_at: '2026-11-16T10:00:00Z',
        consent_status: 'granted',
        last_assessment_date: '2026-11-17T10:00:00Z',
        last_quality_status: 'acceptable',
        feature_change_recorded: true,
        assessment_count: 2,
      },
      {
        patient_id: 'p-102',
        pseudonymous_code: 'OT-1002',
        age_band: null,
        context_notes: null,
        created_at: '2026-11-16T12:00:00Z',
        consent_status: 'granted',
        last_assessment_date: null,
        last_quality_status: null,
        feature_change_recorded: null,
        assessment_count: 0,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPatients,
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('OT-1001')).toBeInTheDocument();
    expect(screen.getByText('OT-1002')).toBeInTheDocument();
    expect(screen.getByText('Unspecified')).toBeInTheDocument();
    expect(screen.getByText('Registered Records')).toBeInTheDocument();
    expect(screen.getByText('Flagged for Review')).toBeInTheDocument();
  });

  it('renders PatientDetailPage with baseline badge, history table, and trajectory controls', async () => {
    const mockPatient = {
      patient_id: 'p-101',
      pseudonymous_code: 'OT-1001',
      age_band: '40-49',
      context_notes: 'Diffuse ambient light',
      created_at: '2026-11-10T09:00:00Z',
      consent_status: 'granted',
    };

    const mockHistory = [
      {
        assessment_id: 'asm-2',
        patient_id: 'p-101',
        status: 'complete',
        quality_status: 'acceptable',
        assessment_at: '2026-11-17T10:00:00Z',
        protocol_version: 'ocutrack-protocol-0.1',
        review_message: 'Change detected — consider repeat measurement and clinical review',
        features: { latency_ms: 280, constriction_velocity: 3.9, tracking_gain: 0.89 },
      },
      {
        assessment_id: 'asm-1',
        patient_id: 'p-101',
        status: 'complete',
        quality_status: 'acceptable',
        assessment_at: '2026-11-12T10:00:00Z',
        protocol_version: 'ocutrack-protocol-0.1',
        review_message: 'Recording quality acceptable',
        features: { latency_ms: 245, constriction_velocity: 4.5, tracking_gain: 0.94 },
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/history')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockHistory });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => mockPatient });
    });

    render(
      <MemoryRouter
        initialEntries={['/patients/p-101']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/patients/:patientId" element={<PatientDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OT-1001')).toBeInTheDocument();
    });

    expect(screen.getByText('Baseline Established')).toBeInTheDocument();
    expect(screen.getByText('Across-Visit Trajectory')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Latency' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Velocity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tracking Gain' })).toBeInTheDocument();
    // Sanitized em dash in backend review message
    expect(
      screen.getByText('Change detected: consider repeat measurement and clinical review')
    ).toBeInTheDocument();
  });
});
