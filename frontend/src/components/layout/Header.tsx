import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Eye, Activity, Users, PlusCircle, Server, RefreshCw, Info, Menu, X, LogOut, Lock, UserCheck, HelpCircle } from 'lucide-react';
import { checkBackendHealth } from '../../services/healthService';
import { APP_NAME } from '../../lib/constants';
import { PulseIndicator } from '../motion';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useHelpDrawer } from '../../context/HelpDrawerContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleDrawer } = useHelpDrawer();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const verifyHealth = async () => {
    try {
      setBackendStatus('checking');
      await checkBackendHealth();
      setBackendStatus('connected');
    } catch {
      setBackendStatus('disconnected');
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors duration-150 ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6 lg:gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 focus-visible:outline-none group">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center border border-slate-800 shadow-xs group-hover:border-slate-700 transition-colors">
                <Eye className="w-5 h-5 text-sky-400" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight font-mono">{APP_NAME}</span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50">
                  v0.1-CLINICAL
                </span>
              </div>
            </NavLink>

            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.dashboard')}</span>
              </NavLink>
              <NavLink to="/patients" className={navLinkClass}>
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.patients')}</span>
              </NavLink>
              <NavLink to="/assessments/new" className={navLinkClass}>
                <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.newAssessment')}</span>
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.about')}</span>
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Protocol Guide Button */}
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label={t('help.guideButton')}
              title={`${t('help.guideButton')} (Shift + ?)`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 font-mono shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              <span className="hidden sm:inline">{t('help.guideButton')}</span>
              <kbd className="hidden xl:inline-block px-1 py-0.2 text-[9px] rounded bg-slate-200 border border-slate-300 text-slate-600 font-mono">
                ?
              </kbd>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Backend status indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 bg-slate-50 text-slate-700 font-mono"
              title={
                lastChecked
                  ? `Backend checked at ${lastChecked.toLocaleTimeString()}`
                  : 'Checking backend status...'
              }
            >
              <Server className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="text-slate-600">{t('nav.api')}:</span>
              {backendStatus === 'checking' && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-sm bg-slate-400" aria-hidden="true" />
                  {t('nav.apiChecking')}
                </span>
              )}
              {backendStatus === 'connected' && (
                <span className="inline-flex items-center gap-1.5 text-teal-800 font-medium">
                  <PulseIndicator status="active" />
                  {t('nav.apiConnected')}
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="inline-flex items-center gap-1.5 text-rose-800 font-medium">
                  <span className="w-2 h-2 rounded-sm bg-rose-600" aria-hidden="true" />
                  {t('nav.apiOffline')}
                </span>
              )}
              <button
                type="button"
                onClick={verifyHealth}
                aria-label={t('nav.refreshApi')}
                className="ml-1 p-0.5 rounded text-slate-500 hover:text-slate-900 transition-colors duration-150"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            <NavLink
              to="/assessments/new"
              className="group hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] rounded-md shadow-xs transition-all duration-150 ease-out border border-sky-600"
            >
              <PlusCircle className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              <span>{t('nav.startAssessment')}</span>
            </NavLink>

            {/* Staff Identity Badge & Sign Out */}
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-slate-900 truncate max-w-[130px]">{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 uppercase font-semibold">
                    {user.role === 'supervising_clinician' ? 'Clinician' : 'CHW'}
                  </span>
                  <span className="text-slate-400 text-[10px] hidden 2xl:inline">{user.ward}</span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  title={t('auth.signOut')}
                  aria-label={t('auth.signOut')}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors font-mono"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Staff Login</span>
              </NavLink>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors duration-150"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden py-3 border-t border-slate-200 flex flex-col gap-1"
          >
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.dashboard')}</span>
            </NavLink>
            <NavLink to="/patients" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.patients')}</span>
            </NavLink>
            <NavLink to="/assessments/new" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.newAssessment')}</span>
            </NavLink>
            <NavLink to="/about" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <Info className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.about')}</span>
            </NavLink>
            <button
              type="button"
              onClick={() => {
                toggleDrawer();
                setMobileMenuOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150 text-left border border-slate-200"
            >
              <HelpCircle className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span>{t('help.guideButton')}</span>
            </button>
            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md text-rose-700 hover:bg-rose-50 transition-colors duration-150 text-left mt-2 border border-rose-200"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{t('auth.signOut')} ({user.name})</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md text-sky-800 hover:bg-sky-50 transition-colors duration-150 mt-2 border border-sky-200"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Staff Login</span>
              </NavLink>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
