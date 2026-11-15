import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Eye, Activity, Users, PlusCircle, Server, RefreshCw } from 'lucide-react';
import { checkBackendHealth } from '../../services/healthService';
import { APP_NAME } from '../../lib/constants';

export const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <Eye className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="font-semibold text-base text-slate-900 tracking-tight">{APP_NAME}</span>
                <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-normal">v0.1 Prototype</span>
              </div>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/" className={navLinkClass}>
                <Activity className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to="/patients" className={navLinkClass}>
                <Users className="w-4 h-4" />
                Patients
              </NavLink>
              <NavLink to="/assessments/new" className={navLinkClass}>
                <PlusCircle className="w-4 h-4" />
                New Assessment
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend status indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border bg-slate-50 text-slate-700"
              title={
                lastChecked
                  ? `Backend checked at ${lastChecked.toLocaleTimeString()}`
                  : 'Checking backend status...'
              }
            >
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Backend:</span>
              {backendStatus === 'checking' && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Checking...
                </span>
              )}
              {backendStatus === 'connected' && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Offline
                </span>
              )}
              <button
                onClick={verifyHealth}
                aria-label="Refresh backend status"
                className="ml-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <NavLink
              to="/assessments/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-md shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Start Assessment</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};
