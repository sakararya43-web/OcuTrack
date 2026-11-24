import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { en } from '../i18n/locales/en';
import { hi } from '../i18n/locales/hi';
import { es } from '../i18n/locales/es';
import { fr } from '../i18n/locales/fr';

describe('Global Language Switching (i18n)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
    try {
      window.localStorage?.removeItem?.('ocutrack_language');
    } catch {
      // Ignore storage access warnings in headless node environments
    }
    window.history.pushState({}, '', '/');
  });

  it('translates landing page sections (Story, Protocols, Footer) across EN, HI, ES, FR', async () => {
    render(<App />);

    // Verify English baseline
    expect(screen.getAllByText(en.story.badge)[0]).toBeInTheDocument();
    expect(screen.getAllByText(en.protocolsSection.items[0].title)[0]).toBeInTheDocument();
    expect(screen.getAllByText(en.landingFooter.heading)[0]).toBeInTheDocument();

    const switchAndVerify = (label: string, locale: typeof hi) => {
      const btn = screen.getAllByText(label)[0];
      fireEvent.click(btn);
      expect(screen.getAllByText(locale.story.badge)[0]).toBeInTheDocument();
      expect(screen.getAllByText(locale.protocolsSection.items[0].title)[0]).toBeInTheDocument();
      expect(screen.getAllByText(locale.landingFooter.heading)[0]).toBeInTheDocument();
    };

    switchAndVerify('HI', hi);
    switchAndVerify('ES', es);
    switchAndVerify('FR', fr);
  });

  it('translates Console Dashboard and AppLayout footer across EN, HI, ES, FR', async () => {
    window.history.pushState({}, '', '/console');
    render(<App />);

    expect(screen.getAllByText(en.dashboardPage.registerParticipant)[0]).toBeInTheDocument();
    expect(screen.getAllByText(en.appFooter.clinicalNavigation)[0]).toBeInTheDocument();

    for (const [label, locale] of [
      ['HI', hi],
      ['ES', es],
      ['FR', fr],
    ] as const) {
      fireEvent.click(screen.getAllByText(label)[0]);
      await waitFor(() => {
        expect(screen.getAllByText(locale.dashboardPage.registerParticipant)[0]).toBeInTheDocument();
        expect(screen.getAllByText(locale.appFooter.clinicalNavigation)[0]).toBeInTheDocument();
      });
    }
  });

  it('translates Patients Cohort Registry, New Assessment, and About Limitations pages across HI, ES, FR', async () => {
    // 1. Cohort Registry (/patients)
    window.history.pushState({}, '', '/patients');
    const { unmount } = render(<App />);

    fireEvent.click(screen.getAllByText('ES')[0]);
    await waitFor(() => {
      expect(screen.getAllByText(es.patientsPage.badge)[0]).toBeInTheDocument();
    });
    unmount();

    // 2. New Assessment (/assessments/new)
    window.history.pushState({}, '', '/assessments/new');
    const view2 = render(<App />);

    fireEvent.click(screen.getAllByText('FR')[0]);
    await waitFor(() => {
      expect(screen.getAllByText(fr.newAssessmentPage.badge)[0]).toBeInTheDocument();
      expect(screen.getAllByText(fr.newAssessmentPage.step1Title)[0]).toBeInTheDocument();
    });
    view2.unmount();

    // 3. About & Limitations (/about)
    window.history.pushState({}, '', '/about');
    render(<App />);

    fireEvent.click(screen.getAllByText('HI')[0]);
    await waitFor(() => {
      expect(screen.getAllByText(hi.aboutPage.badge)[0]).toBeInTheDocument();
      expect(screen.getAllByText(hi.aboutPage.notDiagnosticTitle)[0]).toBeInTheDocument();
    });
  });
});
