import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Root and Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
    window.history.pushState({}, '', '/');
  });

  it('renders the Awwwards-inspired landing page at root', async () => {
    render(<App />);
    expect(screen.getAllByText('OcuTrack')[0]).toBeInTheDocument();
    expect(screen.getByText('ENTER RESEARCH CONSOLE')).toBeInTheDocument();
    expect(screen.getByText('Start Clinical Screening')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('renders the interactive chapters and exploration anchors on landing page', async () => {
    render(<App />);
    expect(screen.getByText(/AUTONOMIC PUPILLARY LIGHT REFLEX/i)).toBeInTheDocument();
    expect(screen.getByText(/SMOOTH PURSUIT OCULAR MOTOR CONTROL/i)).toBeInTheDocument();
    expect(screen.getByText(/LONGITUDINAL TEMPORAL DRIFT/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('renders the console dashboard and handles unavailable backend gracefully', async () => {
    window.history.pushState({}, '', '/console');
    render(<App />);
    
    // Header navigation links in cockpit
    expect(screen.getByText('CONSOLE')).toBeInTheDocument();
    expect(screen.getByText('COHORTS')).toBeInTheDocument();
    expect(screen.getByText('PROTOCOL')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Backend Service Unavailable')).toBeInTheDocument();
    });
  });
});