import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProcessingPage } from '../pages/ProcessingPage';

describe('ProcessingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders honest pipeline stages during processing', async () => {
    const mockDetail = {
      assessment_id: 'asm-999',
      patient_id: 'p-1',
      status: 'processing',
      quality_status: 'pending',
      assessment_at: new Date().toISOString(),
      protocol_version: 'ocutrack-protocol-0.1',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-999/processing']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/processing" element={<ProcessingPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Analysis Pipeline Execution')).toBeInTheDocument();
    expect(screen.getByText('Video Validation & Codec Decoding')).toBeInTheDocument();
    expect(screen.getByText('Frame Usability & Quality Check')).toBeInTheDocument();
    expect(screen.getByText('Experimental Temporal Convolutional Network (TCN)')).toBeInTheDocument();
  });

  it('renders completion state and review guidance when backend finishes analysis', async () => {
    const mockDetail = {
      assessment_id: 'asm-999',
      patient_id: 'p-1',
      status: 'complete',
      quality_status: 'acceptable',
      assessment_at: new Date().toISOString(),
      protocol_version: 'ocutrack-protocol-0.1',
      review_message: 'Recording quality acceptable. Feature series extracted.',
      warnings: ['Minor blink detected at 8.2s'],
      quality: {
        status: 'acceptable',
        usable_frame_ratio: 0.94,
        warnings: ['Minor blink detected at 8.2s'],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });

    render(
      <MemoryRouter
        initialEntries={['/assessments/asm-999/processing']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/assessments/:assessmentId/processing" element={<ProcessingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Analysis Completed Successfully')).toBeInTheDocument();
    });

    expect(screen.getByText(/Recording quality acceptable/i)).toBeInTheDocument();
    expect(screen.getByText('94.0%')).toBeInTheDocument();
    expect(screen.getByText('Minor blink detected at 8.2s')).toBeInTheDocument();
  });
});
