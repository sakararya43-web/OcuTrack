import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';

describe('App Root and Navigation', () => {
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

  it('renders navigation links and header brand', async () => {
    render(<App />);
    expect(screen.getByText('OcuTrack')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('New Assessment')).toBeInTheDocument();
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
});
