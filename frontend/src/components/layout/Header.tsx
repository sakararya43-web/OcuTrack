import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Eye, Activity, Users, PlusCircle, Server, RefreshCw, Info, Menu, X } from 'lucide-react';
import { checkBackendHealth } from '../../services/healthService';
import { APP_NAME } from '../../lib/constants';

export const Header: React.FC = () => {
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
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 focus-visible:outline-none">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <Eye className="w-5 h-5 text-sky-400" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-base text-slate-900 tracking-tight">{APP_NAME}</span>
                <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">v0.1</span>
              </div>
            </NavLink>

            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                <Activity className="w-4 h-4" aria-hidden="true" />
                Dashboard
              </NavLink>
              <NavLink to="/patients" className={navLinkClass}>
                <Users className="w-4 h-4" aria-hidden="true" />
                Patients
              </NavLink>
              <NavLink to="/assessments/new" className={navLinkClass}>
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                New Assessment
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                <Info className="w-4 h-4" aria-hidden="true" />
                About
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend status indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 bg-slate-50 text-slate-700"
              title={
                lastChecked
                  ? `Backend checked at ${lastChecked.toLocaleTimeString()}`
                  : 'Checking backend status...'
              }
            >
              <Server className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline text-slate-600">API:</span>
              {backendStatus === 'checking' && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-sm bg-slate-400" aria-hidden="true"></span>
                  Checking
                </span>
              )}
              {backendStatus === 'connected' && (
                <span className="inline-flex items-center gap-1.5 text-teal-800 font-medium">
                  <span className="w-2 h-2 rounded-sm bg-teal-600 motion-safe:animate-calm-pulse" aria-hidden="true"></span>
                  Connected
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="inline-flex items-center gap-1.5 text-rose-800 font-medium">
                  <span className="w-2 h-2 rounded-sm bg-rose-600" aria-hidden="true"></span>
                  Offline
                </span>
              )}
              <button
                type="button"
                onClick={verifyHealth}
                aria-label="Refresh backend status"
                className="ml-1 p-0.5 rounded text-slate-500 hover:text-slate-900 transition-colors duration-150"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            <NavLink
              to="/assessments/new"
              className="group hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] rounded-md shadow-sm transition-all duration-150 ease-out"
            >
              <PlusCircle className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              <span>Start Assessment</span>
            </NavLink>

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
              Dashboard
            </NavLink>
            <NavLink to="/patients" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <Users className="w-4 h-4" aria-hidden="true" />
              Patients
            </NavLink>
            <NavLink to="/assessments/new" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              New Assessment
            </NavLink>
            <NavLink to="/about" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
              <Info className="w-4 h-4" aria-hidden="true" />
              About
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
};
