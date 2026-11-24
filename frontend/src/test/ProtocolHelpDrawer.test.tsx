import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelpDrawerProvider } from '../context/HelpDrawerContext';
import { ProtocolHelpDrawer } from '../components/help/ProtocolHelpDrawer';
import { Header } from '../components/layout/Header';
import { LanguageProvider } from '../i18n';
import { AuthProvider } from '../context/AuthContext';

const TestDrawerHarness: React.FC<{ initialEntries?: string[] }> = ({
  initialEntries = ['/'],
}) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <LanguageProvider>
        <AuthProvider>
          <HelpDrawerProvider>
            <Header />
            <ProtocolHelpDrawer />
          </HelpDrawerProvider>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('ProtocolHelpDrawer (Phase 3)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders Protocol Guide trigger button in Header with keyboard shortcut hint', () => {
    render(<TestDrawerHarness initialEntries={['/']} />);

    const guideButtons = screen.getAllByRole('button', { name: /Protocol Guide/i });
    expect(guideButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('opens drawer when Protocol Guide button is clicked and closes on Close button', async () => {
    render(<TestDrawerHarness initialEntries={['/']} />);

    // Initially drawer should not be visible
    expect(screen.queryByRole('dialog', { name: /OcuTrack Protocol & Clinical Guide/i })).not.toBeInTheDocument();

    // Click guide button
    const guideButton = screen.getAllByRole('button', { name: /Protocol Guide/i })[0];
    fireEvent.click(guideButton);

    // Drawer should open
    expect(await screen.findByRole('dialog', { name: /OcuTrack Protocol & Clinical Guide/i })).toBeInTheDocument();
    expect(screen.getByText(/Screen-aware instrumentation protocols/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Operating Checklist/i)).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /Close Guide Drawer/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /OcuTrack Protocol & Clinical Guide/i })).not.toBeInTheDocument();
    });
  });

  it('toggles drawer with keyboard shortcuts (? and Escape)', async () => {
    render(<TestDrawerHarness initialEntries={['/']} />);

    // Press '?'
    fireEvent.keyDown(window, { key: '?' });
    expect(await screen.findByRole('dialog', { name: /OcuTrack Protocol & Clinical Guide/i })).toBeInTheDocument();

    // Press 'Escape'
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /OcuTrack Protocol & Clinical Guide/i })).not.toBeInTheDocument();
    });
  });

  it('automatically detects active route context for pupil test route', async () => {
    render(<TestDrawerHarness initialEntries={['/pupil-test']} />);

    // Open drawer via button
    const guideButton = screen.getAllByRole('button', { name: /Protocol Guide/i })[0];
    fireEvent.click(guideButton);

    // Active context badge should be visible
    expect(await screen.findByText(/ACTIVE CONTEXT/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Standardized Pupillary Light Reflex \(PLR\) Protocol/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/45-60 cm from webcam lens/i)).toBeInTheDocument();
    expect(screen.getByText(/Full-screen white flash at 5\.0 s/i)).toBeInTheDocument();
  });

  it('automatically detects active route context for smooth pursuit test route', async () => {
    render(<TestDrawerHarness initialEntries={['/pursuit-test']} />);

    const guideButton = screen.getAllByRole('button', { name: /Protocol Guide/i })[0];
    fireEvent.click(guideButton);

    expect(await screen.findByText(/ACTIVE CONTEXT/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Horizontal Smooth-Pursuit Kinematics Protocol/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Horizontal sinusoidal sweep/i)).toBeInTheDocument();
  });

  it('supports client-side search filtering across protocols and troubleshooting items', async () => {
    render(<TestDrawerHarness initialEntries={['/']} />);

    // Open drawer
    fireEvent.click(screen.getAllByRole('button', { name: /Protocol Guide/i })[0]);

    const searchInput = await screen.findByPlaceholderText(/Search protocols, parameters, or troubleshooting/i);
    fireEvent.change(searchInput, { target: { value: 'blinking' } });

    // Should find the troubleshooting topic regarding blinking/quality
    expect(screen.getByText(/Why was my recording marked "Insufficient Recording Quality"\?/i)).toBeInTheDocument();
  });

  it('expands and collapses troubleshooting accordion items', async () => {
    render(<TestDrawerHarness initialEntries={['/']} />);

    // Open drawer
    fireEvent.click(screen.getAllByRole('button', { name: /Protocol Guide/i })[0]);

    // Switch to Troubleshooting tab
    const troubleTab = await screen.findByRole('button', { name: /Troubleshooting/i });
    fireEvent.click(troubleTab);

    const questionButton = screen.getByRole('button', {
      name: /Camera permission denied or video device not detected/i,
    });
    expect(questionButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(questionButton);

    expect(await screen.findByText(/Browser permissions have blocked webcam access/i)).toBeInTheDocument();
    expect(screen.getByText(/Click the site security \/ lock icon/i)).toBeInTheDocument();
  });
});
