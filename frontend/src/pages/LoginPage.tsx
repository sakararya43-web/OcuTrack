import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye,
  ShieldAlert,
  UserCheck,
  Stethoscope,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  KeyRound,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth, StaffRole } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AnimatedPLRPath, PulseIndicator } from '../components/motion';
import { PROTOCOL_VERSION, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, login, loginDemo, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as { from?: { pathname: string; search?: string } })?.from;
  const from =
    fromLocation?.pathname && fromLocation.pathname !== '/login' && fromLocation.pathname !== '/'
      ? `${fromLocation.pathname}${fromLocation.search || ''}`
      : '/console';
  const wasRedirected = Boolean(fromLocation?.pathname && fromLocation.pathname !== '/login');

  const [role, setRole] = useState<StaffRole>('supervising_clinician');
  const [email, setEmail] = useState<string>('elena.vance@neuro-clinic.org');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [ward, setWard] = useState<string>('NEURO-TRIAGE-04');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login({
        email,
        password: password === '••••••••••••' ? 'demo-secure-password' : password,
        role,
        ward,
      });
      navigate(from, { replace: true });
    } catch {
      setErrorMessage(t('auth.authFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (targetRole: StaffRole) => {
    loginDemo(targetRole);
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-md border border-slate-300 bg-white shadow-xs overflow-hidden">
        {/* Left Visual Panel: Clinical Telemetry Showcase */}
        <div className="lg:col-span-5 bg-slate-950 text-slate-100 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Technical Backdrop Grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight text-white font-mono block">
                    {t('auth.telemetryBrand')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{t('auth.suiteLabel')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-800 bg-slate-900/80 text-[11px] font-mono text-teal-400">
                <PulseIndicator status="active" />
                <span>{PROTOCOL_VERSION}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-sky-400 uppercase tracking-widest block">
                {t('auth.instrumentationProtocol')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {t('auth.showcaseTitle')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('auth.showcaseDesc')}
              </p>
            </div>

            {/* Live Real-Time PLR Waveform Visualizer */}
            <div className="rounded border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="text-sky-300 font-semibold">{t('auth.plrProfile')}</span>
                <span className="text-teal-400 text-[10px]">{t('auth.fpsCalibrated')}</span>
              </div>

              <div className="w-full bg-slate-950 rounded border border-slate-800 p-2 overflow-hidden">
                <AnimatedPLRPath variant="reflex" height={75} className="w-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                <div className="border border-slate-800 rounded px-2 py-1 bg-slate-950/60">
                  <span className="text-slate-500 block text-[9px] uppercase">{t('auth.latencyLabel')}</span>
                  <span className="text-white font-semibold tabular-nums">245 ms</span>
                </div>
                <div className="border border-slate-800 rounded px-2 py-1 bg-slate-950/60">
                  <span className="text-slate-500 block text-[9px] uppercase">{t('auth.velocityLabel')}</span>
                  <span className="text-teal-400 font-semibold tabular-nums">4.3 mm/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Non-Diagnostic Clinical Scope Notice */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 space-y-2">
            <div className="flex items-start gap-2 text-slate-300 text-[11px] leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>{t('auth.regulatoryNotice')}</strong> {t('common.disclaimer', NON_DIAGNOSTIC_DISCLAIMER)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Auth Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white space-y-6">
          {isAuthenticated && user && (
            <div className="p-4 rounded-md border border-teal-200 bg-teal-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-teal-900 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" aria-hidden="true" />
                <span>
                  <strong>{t('auth.alreadyAuthenticated')}</strong> {user.name} ({user.ward})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="navy" onClick={() => navigate(from, { replace: true })}>
                  <span>{t('auth.goToWorkspace')}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => logout()}>
                  <LogOut className="w-3.5 h-3.5 mr-1 text-slate-500" aria-hidden="true" />
                  <span>{t('auth.signOut')}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Form Header */}
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="navy">
                <Lock className="w-3 h-3 text-sky-400" aria-hidden="true" />
                <span>{t('auth.hospitalStaffAccess')}</span>
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-xs text-slate-600">
              {t('auth.loginSubtitle')}
            </p>
          </div>

              {!isAuthenticated && wasRedirected && (
                <div className="p-3 text-xs bg-sky-50 border border-sky-200 text-sky-900 rounded flex items-center gap-2 font-mono">
                  <Lock className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
                  <span>{t('auth.loginRequiredNotice')}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded">
                  {errorMessage}
                </div>
              )}

              {/* Staff Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selector Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    {t('auth.role')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('supervising_clinician')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all duration-150 ${
                        role === 'supervising_clinician'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t('auth.clinician')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('community_health_worker')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all duration-150 ${
                        role === 'community_health_worker'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t('auth.communityWorker')}</span>
                    </button>
                  </div>
                </div>

                {/* Email / Staff ID */}
                <div className="space-y-1">
                  <label htmlFor="staff-email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    {t('auth.staffId')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="staff-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.staffIdPlaceholder')}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:border-sky-700 focus:outline-none focus:ring-1 focus:ring-sky-700 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div className="space-y-1">
                    <label htmlFor="staff-password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" aria-hidden="true" />
                      <input
                        id="staff-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:border-sky-700 focus:outline-none focus:ring-1 focus:ring-sky-700 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Facility / Ward Code */}
                  <div className="space-y-1">
                    <label htmlFor="staff-ward" className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      {t('auth.ward')}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" aria-hidden="true" />
                      <input
                        id="staff-ward"
                        type="text"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        placeholder={t('auth.facilityPlaceholder')}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:border-sky-700 focus:outline-none focus:ring-1 focus:ring-sky-700 text-slate-900 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="navy"
                  disabled={submitting}
                  className="w-full py-2.5 font-semibold text-xs tracking-wider uppercase font-mono shadow-xs"
                >
                  {submitting ? t('auth.authenticating') : t('auth.signIn')}
                </Button>
              </form>

              {/* Mandatory Judge / Evaluator Fast-Track Container */}
              <div className="rounded-md border-2 border-sky-600 bg-sky-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-950 font-bold text-xs uppercase font-mono tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-sky-700" aria-hidden="true" />
                    <span>{t('auth.judgeFastTrack')}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-200/80 text-sky-900 font-bold">
                    {t('auth.evaluatorBypass')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('auth.demoNotice')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('supervising_clinician')}
                    className="flex items-center justify-start gap-2 p-2.5 rounded-md border border-sky-700 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold transition-all duration-150 active:scale-[0.98] shadow-xs text-left"
                  >
                    <Stethoscope className="w-4 h-4 text-sky-200 flex-shrink-0" aria-hidden="true" />
                    <div className="leading-tight">
                      <div className="text-[11px] font-bold">{t('auth.clinicianTitle')}</div>
                      <div className="text-[10px] text-sky-200 font-mono">{t('auth.clinicianSub')}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('community_health_worker')}
                    className="flex items-center justify-start gap-2 p-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all duration-150 active:scale-[0.98] shadow-xs text-left"
                  >
                    <UserCheck className="w-4 h-4 text-teal-700 flex-shrink-0" aria-hidden="true" />
                    <div className="leading-tight">
                      <div className="text-[11px] font-bold">{t('auth.chwTitle')}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t('auth.chwSub')}</div>
                    </div>
                  </button>
                </div>
              </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 font-mono">
            <span>{t('auth.protocolBadge')}</span>
            <Link to="/about" className="hover:text-slate-900 hover:underline">
              {t('nav.about')} OcuTrack &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
