import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { en } from '../i18n/locales/en';

describe('Console Authentication Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
    try {
      window.localStorage?.removeItem?.('ocutrack_staff_session');
      window.sessionStorage?.removeItem?.('ocutrack_staff_session');
    } catch {
      // Ignore storage access warnings in headless node environments
    }
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prompts for sign-in when clicking ENTER RESEARCH CONSOLE while signed out, then enters /console upon login', async () => {
    render(<App />);

    // Ensure session is signed out (automated test env seeds a default session)
    const signOutBtn = screen.queryByText(en.auth.signOut);
    if (signOutBtn) {
      fireEvent.click(signOutBtn);
    }

    // Navigate back to landing page via header brand link or CONSOLE link
    fireEvent.click(screen.getAllByText('OcuTrack')[0]);

    // Click "ENTER RESEARCH CONSOLE" on landing hero
    const enterConsoleBtn = await screen.findByText(en.hero.enterConsole);
    fireEvent.click(enterConsoleBtn);

    // Should be redirected to /login with the required-auth notice
    await waitFor(() => {
      expect(screen.getByText(en.auth.loginTitle)).toBeInTheDocument();
      expect(screen.getByText(en.auth.loginRequiredNotice)).toBeInTheDocument();
    });

    // Sign in via staff credentials form
    fireEvent.click(screen.getByText(en.auth.signIn));

    // Should now enter /console (DashboardPage)
    await waitFor(() => {
      expect(screen.getAllByText(en.dashboardPage.registerParticipant)[0]).toBeInTheDocument();
    });
  });

  it('redirects protected routes like /patients to /login when signed out and returns after demo login', async () => {
    render(<App />);

    const signOutBtn = screen.queryByText(en.auth.signOut);
    if (signOutBtn) {
      fireEvent.click(signOutBtn);
    }

    // Click COHORTS (/patients) in header while unauthenticated
    fireEvent.click(screen.getByText('COHORTS'));

    await waitFor(() => {
      expect(screen.getByText(en.auth.loginTitle)).toBeInTheDocument();
      expect(screen.getByText(en.auth.loginRequiredNotice)).toBeInTheDocument();
    });

    // Use One-Click Demo Clinician button
    fireEvent.click(screen.getByText(en.auth.clinicianSub));

    // Should redirect back to /patients
    await waitFor(() => {
      expect(screen.getByText(en.patientsPage.badge)).toBeInTheDocument();
    });
  });

  it('does not persist login across reload or browser reopen and prompts for sign-in on /console', async () => {
    // Simulate a real browser environment (non-test MODE/NODE_ENV)
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MODE', 'production');

    const createMemoryStorage = (): Storage => {
      const store = new Map<string, string>();
      return {
        get length() {
          return store.size;
        },
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        removeItem: (key: string) => {
          store.delete(key);
        },
        setItem: (key: string, value: string) => {
          store.set(key, String(value));
        },
      };
    };

    const localMock = createMemoryStorage();
    const sessionMock = createMemoryStorage();
    vi.stubGlobal('localStorage', localMock);
    vi.stubGlobal('sessionStorage', sessionMock);

    // Seed stale session in storage to simulate leftover browser storage
    localMock.setItem(
      'ocutrack_staff_session',
      JSON.stringify({ id: 'stale', email: 'stale@clinic.org', name: 'Dr. Stale', role: 'supervising_clinician', ward: 'WARD-01' })
    );
    sessionMock.setItem(
      'ocutrack_staff_session',
      JSON.stringify({ id: 'stale', email: 'stale@clinic.org', name: 'Dr. Stale', role: 'supervising_clinician', ward: 'WARD-01' })
    );

    window.history.pushState({}, '', '/console');
    const firstRender = render(<App />);

    // Must ignore/clear stale storage and prompt for sign-in
    await waitFor(() => {
      expect(screen.getByText(en.auth.loginTitle)).toBeInTheDocument();
      expect(screen.getByText(en.auth.loginRequiredNotice)).toBeInTheDocument();
    });
    expect(localMock.getItem('ocutrack_staff_session')).toBeNull();
    expect(sessionMock.getItem('ocutrack_staff_session')).toBeNull();

    // Sign in and verify entry into console without persisting to storage
    fireEvent.click(screen.getByText(en.auth.signIn));
    await waitFor(() => {
      expect(screen.getAllByText(en.dashboardPage.registerParticipant)[0]).toBeInTheDocument();
    });
    expect(localMock.getItem('ocutrack_staff_session')).toBeNull();
    expect(sessionMock.getItem('ocutrack_staff_session')).toBeNull();

    // Simulate reload / browser close & reopen by unmounting and remounting at /console
    firstRender.unmount();
    window.history.pushState({}, '', '/console');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(en.auth.loginTitle)).toBeInTheDocument();
      expect(screen.getByText(en.auth.loginRequiredNotice)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
