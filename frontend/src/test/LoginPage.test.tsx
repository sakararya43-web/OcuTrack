import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../i18n';

const AuthTestConsumer = () => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <span data-testid="user-role">{user?.role || 'none'}</span>
      <span data-testid="user-ward">{user?.ward || 'none'}</span>
      <button type="button" onClick={() => logout()} data-testid="manual-logout">
        Sign Out
      </button>
    </div>
  );
};

describe('LoginPage and Auth Gate (Phase 2)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders technical left panel with telemetry metrics and protocol version', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/OcuTrack Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/PLR DYNAMICS & VELOCITY PROFILE/i)).toBeInTheDocument();
    expect(screen.getByText(/Regulatory Notice:/i)).toBeInTheDocument();
    expect(screen.getByText(/ocutrack-protocol-0.1/i)).toBeInTheDocument();
  });

  it('renders right auth panel with hospital staff form and judge fast-track', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Hospital Staff Portal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Staff ID \/ Clinical Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access Key \/ Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Facility \/ Ward Code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticate Staff Member/i })).toBeInTheDocument();

    // Judge Fast-Track Evaluator Bypass
    expect(screen.getByText(/One-Click Demo Staff Login/i)).toBeInTheDocument();
    expect(screen.getAllByText(/EVALUATOR BYPASS/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows one-click demo staff login as Supervising Clinician', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <LoginPage />
            <AuthTestConsumer />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const clinicianFastTrackBtn = screen.getByRole('button', {
      name: /Dr\. Elena Vance/i,
    });
    fireEvent.click(clinicianFastTrackBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Dr. Elena Vance');
      expect(screen.getByTestId('user-role')).toHaveTextContent('supervising_clinician');
      expect(screen.getByTestId('user-ward')).toHaveTextContent('NEURO-TRIAGE-04');
    });
  });

  it('allows one-click demo staff login as Community Health Worker', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <LoginPage />
            <AuthTestConsumer />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const chwFastTrackBtn = screen.getByRole('button', {
      name: /Aarav Sharma/i,
    });
    fireEvent.click(chwFastTrackBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Aarav Sharma');
      expect(screen.getByTestId('user-role')).toHaveTextContent('community_health_worker');
      expect(screen.getByTestId('user-ward')).toHaveTextContent('COMMUNITY-FIELD-12');
    });
  });

  it('allows manual credentials login and updates staff profile', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <LoginPage />
            <AuthTestConsumer />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Staff ID \/ Clinical Email/i);
    const wardInput = screen.getByLabelText(/Facility \/ Ward Code/i);
    const submitBtn = screen.getByRole('button', { name: /Authenticate Staff Member/i });

    fireEvent.change(emailInput, { target: { value: 'sarah.connor@hospital.org' } });
    fireEvent.change(wardInput, { target: { value: 'TRIAGE-EAST' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Dr. Sarah Connor');
      expect(screen.getByTestId('user-ward')).toHaveTextContent('TRIAGE-EAST');
    });
  });
});
