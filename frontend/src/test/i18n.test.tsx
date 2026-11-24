import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useTranslation } from '../i18n';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

const TestComponent = () => {
  const { t, language } = useTranslation();
  return (
    <div>
      <LanguageSwitcher />
      <span data-testid="current-lang">{language}</span>
      <span data-testid="translated-dashboard">{t('nav.dashboard')}</span>
      <span data-testid="translated-patients">{t('nav.patients')}</span>
      <span data-testid="translated-hero">{t('dashboard.heroTitle')}</span>
      <span data-testid="translated-quality">{t('review.qualityAcceptable')}</span>
      <span data-testid="translated-auth-title">{t('auth.loginTitle')}</span>
      <span data-testid="translated-help-button">{t('help.guideButton')}</span>
      <span data-testid="translated-clinic-title">{t('clinicOverview.pageTitle')}</span>
    </div>
  );
};

describe('i18n Multilingual Engine and Language Switcher', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to English and renders primary navigation and review strings', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-dashboard')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('translated-patients')).toHaveTextContent('Patients');
    expect(screen.getByTestId('translated-hero')).toHaveTextContent(
      'OcuTrack: Ocular Measurement and Longitudinal Monitoring Prototype'
    );
    expect(screen.getByTestId('translated-quality')).toHaveTextContent(
      'Recording quality acceptable'
    );
    expect(screen.getByTestId('translated-auth-title')).toHaveTextContent('Hospital Staff Portal');
    expect(screen.getByTestId('translated-help-button')).toHaveTextContent('Protocol Guide');
    expect(screen.getByTestId('translated-clinic-title')).toHaveTextContent(
      'Clinic Triage & Collective Quality Telemetry'
    );
  });

  it('switches to Hindi and updates translations dynamically', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const hiButton = screen.getByRole('button', { name: 'HI' });
    fireEvent.click(hiButton);

    expect(screen.getByTestId('current-lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('translated-dashboard')).toHaveTextContent('डैशबोर्ड');
    expect(screen.getByTestId('translated-patients')).toHaveTextContent('मरीज़');
    expect(screen.getByTestId('translated-hero')).toHaveTextContent(
      'OcuTrack: नेत्र माप और अनुदैर्ध्य निगरानी प्रोटोटाइप'
    );
    expect(screen.getByTestId('translated-auth-title')).toHaveTextContent('अस्पताल स्टाफ पोर्टल');
    expect(screen.getByTestId('translated-help-button')).toHaveTextContent('प्रोटोकॉल गाइड');
    expect(screen.getByTestId('translated-clinic-title')).toHaveTextContent(
      'क्लिनिक ट्राइएज और सामूहिक गुणवत्ता टेलीमेट्री'
    );
  });

  it('switches to Spanish and updates translations dynamically', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const esButton = screen.getByRole('button', { name: 'ES' });
    fireEvent.click(esButton);

    expect(screen.getByTestId('current-lang')).toHaveTextContent('es');
    expect(screen.getByTestId('translated-dashboard')).toHaveTextContent('Panel de Control');
    expect(screen.getByTestId('translated-patients')).toHaveTextContent('Pacientes');
    expect(screen.getByTestId('translated-auth-title')).toHaveTextContent('Portal del Personal Hospitalario');
    expect(screen.getByTestId('translated-help-button')).toHaveTextContent('Guía de Protocolo');
    expect(screen.getByTestId('translated-clinic-title')).toHaveTextContent(
      'Triaje Clínico y Telemetría de Calidad Colectiva'
    );
  });

  it('switches to French and updates translations dynamically', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const frButton = screen.getByRole('button', { name: 'FR' });
    fireEvent.click(frButton);

    expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
    expect(screen.getByTestId('translated-dashboard')).toHaveTextContent('Tableau de Bord');
    expect(screen.getByTestId('translated-patients')).toHaveTextContent('Patients');
    expect(screen.getByTestId('translated-auth-title')).toHaveTextContent('Portail du Personnel Hospitalier');
    expect(screen.getByTestId('translated-help-button')).toHaveTextContent('Guide du Protocole');
    expect(screen.getByTestId('translated-clinic-title')).toHaveTextContent(
      'Triage Clinique & Télémétrie de Qualité Collective'
    );
  });

  it('persists selected language in localStorage across re-mounts', () => {
    window.localStorage.setItem('ocutrack_language', 'es');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('es');
    expect(screen.getByTestId('translated-dashboard')).toHaveTextContent('Panel de Control');
  });
});
