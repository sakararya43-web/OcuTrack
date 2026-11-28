import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClinicalHandoffTemplate } from '../components/reports/ClinicalHandoffTemplate';
import type { AssessmentDetail } from '../types/api';

const { mockSave, mockAddImage, mockAddPage, mockText, mockHtml2Canvas } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockAddImage: vi.fn(),
  mockAddPage: vi.fn(),
  mockText: vi.fn(),
  mockHtml2Canvas: vi.fn(),
}));

vi.mock('html2canvas', () => ({
  default: mockHtml2Canvas,
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addPage: mockAddPage,
    addImage: mockAddImage,
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: mockText,
    save: mockSave,
  })),
}));

import { exportClinicalSummaryPdf } from '../lib/exportClinicalPdf';

describe('ClinicalHandoffTemplate & exportClinicalSummaryPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 monochrome handoff sections with computed baseline and delta percentages', () => {
    const assessment: AssessmentDetail = {
      assessment_id: 'asm-handoff-01',
      patient_id: 'p-101',
      pseudonymous_code: 'OT-9001',
      test_type: 'both',
      status: 'complete',
      quality_status: 'acceptable',
      assessment_at: '2026-11-28T14:00:00Z',
      protocol_version: 'ocutrack-protocol-0.1',
      review_message: 'No notable change detected in measured features.',
      quality: {
        status: 'acceptable',
        usable_frame_ratio: 0.93,
        fps_estimate: 24,
        warnings: [],
      },
      pupil: {
        status: 'complete',
        features: {
          baseline_diameter: { value: 4.5, unit: 'mm', label: 'Baseline Diameter' },
          minimum_diameter: { value: 3.0, unit: 'mm', label: 'Minimum Diameter' },
          constriction_velocity: { value: 4.2, unit: 'mm/s', label: 'Constriction Velocity' },
          constriction_latency: { value: 250, unit: 'ms', label: 'Constriction Latency' },
        },
        series: [
          { t_ms: 0, value: 4.5, valid: true },
          { t_ms: 5000, value: 4.5, valid: true },
          { t_ms: 5500, value: 3.0, valid: true },
          { t_ms: 10000, value: 4.1, valid: true },
        ],
      },
      pursuit: {
        status: 'complete',
        features: {
          tracking_gain: { value: 0.91, unit: 'ratio', label: 'Smooth Pursuit Gain' },
        },
        series: [
          { t_ms: 0, target_x: 0.5, eye_x: 0.5, valid: true },
          { t_ms: 1000, target_x: 0.8, eye_x: 0.78, valid: true },
        ],
      },
      longitudinal_comparison: {
        status: 'comparable',
        baseline_id: 'asm-base-01',
        feature_deltas: {
          constriction_latency: { delta: 10, percentage_delta: 4.2, unit: 'ms', direction: 'stable' },
          constriction_velocity: { delta: -0.3, percentage_delta: -6.7, unit: 'mm/s', direction: 'decreased' },
        },
      },
    };

    const { container } = render(
      <ClinicalHandoffTemplate
        assessment={assessment}
        patientCode="OT-9001"
        ageBand="50-59"
        facilityId="NEURO-TRIAGE-04"
        staffId="Dr. Elena Vance"
      />
    );

    expect(screen.getByText('NON-DIAGNOSTIC SCREENING SUMMARY - FOR CLINICAL REVIEW ONLY')).toBeInTheDocument();
    expect(screen.getByText('OT-9001')).toBeInTheDocument();
    expect(screen.getByText('50-59')).toBeInTheDocument();
    expect(screen.getByText(/Facility\/Ward: NEURO-TRIAGE-04/)).toBeInTheDocument();
    expect(screen.getByText('240 ms')).toBeInTheDocument(); // Computed personal baseline (250 - 10)
    expect(screen.getByText('250 ms')).toBeInTheDocument();
    expect(screen.getByText('+10 ms (+4.2%)')).toBeInTheDocument();
    expect(screen.getByText('No notable change detected')).toBeInTheDocument();
    expect(screen.getByText('Change detected - consider repeat measurement and clinical review')).toBeInTheDocument();
    expect(screen.getByText('Referring Health Worker Notes:')).toBeInTheDocument();
    expect(screen.getByText('Receiving Specialist Review:')).toBeInTheDocument();

    // Ensure strict compliance: no em dashes and no Recharts SVG failure
    expect(container.textContent).not.toContain('—');
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
  });

  it('slices tall captures across multiple A4 pages and downloads expected filename', async () => {
    const fakeCanvas = {
      width: 1588,
      height: 4000, // Taller than 1 A4 page at 190mm width (~2248px per page)
    } as unknown as HTMLCanvasElement;

    mockHtml2Canvas.mockResolvedValue(fakeCanvas);

    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          }),
          toDataURL: () => 'data:image/png;base64,MOCK',
        } as unknown as HTMLCanvasElement;
      }
      return createElementOrig(tagName);
    });

    const el = document.createElement('div');
    const filename = await exportClinicalSummaryPdf(el, 'OT 9001', '2026-11-28T10:00:00Z');

    expect(filename).toBe('OcuTrack_Clinical_Summary_OT_9001_20261128.pdf');
    expect(mockHtml2Canvas).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ scale: 2, backgroundColor: '#ffffff', useCORS: true })
    );
    expect(mockAddPage).toHaveBeenCalledTimes(1);
    expect(mockAddImage).toHaveBeenCalledTimes(2);
    expect(mockText).toHaveBeenCalledWith('Page 1 of 2', 200, 290, { align: 'right' });
    expect(mockText).toHaveBeenCalledWith('Page 2 of 2', 200, 290, { align: 'right' });
    expect(mockSave).toHaveBeenCalledWith('OcuTrack_Clinical_Summary_OT_9001_20261128.pdf');

    vi.restoreAllMocks();
  });
});
