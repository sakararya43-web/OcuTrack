import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReportsDirectoryPage } from '../pages/ReportsDirectoryPage';

describe('ReportsDirectoryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists all patients and assessment reports and allows filtering by code and status', async () => {
    const mockPatients = [
      {
        patient_id: 'p-1',
        pseudonymous_code: 'OT-5442',
        age_band: '30-39',
        context_notes: null,
        created_at: '2026-11-24T21:20:26Z',
        consent_status: 'granted',
        assessment_count: 1,
        latest_assessment_id: 'a-1',
        latest_assessment_status: 'complete',
        latest_completed_assessment_id: 'a-1',
      },
      {
        patient_id: 'p-2',
        pseudonymous_code: 'OT-8167',
        age_band: '40-49',
        context_notes: null,
        created_at: '2026-11-18T20:32:24Z',
        consent_status: 'granted',
        assessment_count: 1,
        latest_assessment_id: 'a-2',
        latest_assessment_status: 'created',
        latest_completed_assessment_id: null,
      },
      {
        patient_id: 'p-3',
        pseudonymous_code: 'OT-7026',
        age_band: '50-59',
        context_notes: null,
        created_at: '2026-11-16T22:10:40Z',
        consent_status: 'granted',
        assessment_count: 0,
      },
    ];

    const mockAssessments = [
      {
        assessment_id: 'a-1',
        patient_id: 'p-1',
        pseudonymous_code: 'OT-5442',
        test_type: 'both',
        is_baseline: true,
        status: 'complete',
        quality_status: 'acceptable',
        assessment_at: '2026-11-24T21:20:44Z',
        protocol_version: 'ocutrack-protocol-0.1',
        review_message: 'Baseline established.',
      },
      {
        assessment_id: 'a-2',
        patient_id: 'p-2',
        pseudonymous_code: 'OT-8167',
        test_type: 'both',
        is_baseline: false,
        status: 'created',
        quality_status: 'pending',
        assessment_at: '2026-11-18T20:33:32Z',
        protocol_version: 'ocutrack-protocol-0.1',
        review_message: null,
      },
    ];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/patients')) {
        return { ok: true, status: 200, json: async () => mockPatients };
      }
      if (url.includes('/api/assessments')) {
        return { ok: true, status: 200, json: async () => mockAssessments };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ReportsDirectoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('OT-5442')).toBeInTheDocument();
    });

    expect(screen.getByText('OT-8167')).toBeInTheDocument();
    expect(screen.getByText('OT-7026')).toBeInTheDocument();
    expect(screen.getByText('Baseline established.')).toBeInTheDocument();

    // Filter by Completed status
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('OT-5442')).toBeInTheDocument();
    expect(screen.queryByText('OT-8167')).not.toBeInTheDocument();
  });
});
