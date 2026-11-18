import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsConditionsPage } from '../pages/TermsConditionsPage';

describe('App Root, Navigation, and Footer Legal Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
  });

  it('renders the persistent non-diagnostic disclaimer banner', async () => {
    render(<App />);
    const disclaimer = await screen.findByText(NON_DIAGNOSTIC_DISCLAIMER);
    expect(disclaimer).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Backend Service Unavailable')).toBeInTheDocument();
    });
  });

  it('renders navigation links, header brand, and required footer legal links', async () => {
    render(<App />);
    expect(screen.getByText('OcuTrack')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('New Assessment')).toBeInTheDocument();
    expect(screen.getAllByText('Limitations').length).toBeGreaterThanOrEqual(1);

    // Required footer links on Home / Dashboard
    expect(screen.getAllByRole('link', { name: /Privacy Policy/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Terms and Conditions/i }).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByText('Backend Service Unavailable')).toBeInTheDocument();
    });
  });

  it('handles unavailable backend without crashing and displays service unavailable alert', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Backend Service Unavailable')).toBeInTheDocument();
    });
  });

  it('renders Privacy Policy and Terms and Conditions pages cleanly', () => {
    const { unmount } = render(
      <MemoryRouter
        initialEntries={['/privacy']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/Ephemeral Raw Video Handling/i)).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter
        initialEntries={['/terms']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/terms" element={<TermsConditionsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Terms and Conditions' })).toBeInTheDocument();
    expect(screen.getByText(/Prohibited Clinical Uses/i)).toBeInTheDocument();
  });
});
