import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const AppLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#0F172A] selection:bg-[#0F172A] selection:text-white relative">
      <Header />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-200 text-xs">

            {/* Column 1: Brand & Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-[#0F172A]">
                  {APP_NAME}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-50 text-[#475569] border border-slate-200">
                  {PROTOCOL_VERSION}
                </span>
              </div>
              <p className="text-[#475569] leading-relaxed font-normal">
                {t('appFooter.tagline')}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#0F766E] font-medium pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                <span>{t('appFooter.activeTelemetryEngine')}</span>
              </div>
            </div>

            {/* Column 2: Clinical Navigation */}
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
                {t('appFooter.clinicalNavigation')}
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li><Link to="/clinic-overview" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkClinicOverview')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/console" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkClinicalConsole')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/patients" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkCohortRegistry')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/login" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkStaffPortal')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkInitiateScreening')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
                <li><Link to="/about" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">{t('appFooter.linkProtocolMethodology')} <ArrowUpRight className="w-3 h-3 opacity-50" /></Link></li>
              </ul>
            </div>

            {/* Column 3: Quality & Calibration */}
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
                {t('appFooter.qualityStandards')}
              </span>
              <ul className="space-y-2 text-[#475569]">
                <li><span className="text-[#0F172A] font-medium">{t('appFooter.ephemeralVideoLabel')}</span> {t('appFooter.ephemeralVideoVal')}</li>
                <li><span className="text-[#0F172A] font-medium">{t('appFooter.calibrationLabel')}</span> {t('appFooter.calibrationVal')}</li>
                <li><span className="text-[#0F172A] font-medium">{t('appFooter.frameFloorLabel')}</span> {t('appFooter.frameFloorVal')}</li>
                <li><Link to="/about#disclaimer" className="text-[#0F172A] hover:underline font-medium">{t('appFooter.regulatoryScopeNotice')}</Link></li>
              </ul>
            </div>

            {/* Column 4: Regulatory & Legal Policies */}
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
                {t('appFooter.governanceLegal')}
              </span>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                {t('appFooter.governanceDesc')}
              </p>
              <ul className="space-y-2 text-[#475569] pt-1">
                <li>
                  <Link to="/privacy" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                    <Lock className="w-3 h-3 text-[#0F766E]" />
                    <span>{t('appFooter.privacyPolicy')}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                    <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                    <span>{t('appFooter.termsConditions')}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#64748B] gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span>{t('appFooter.copyright', { year: new Date().getFullYear() })}</span>
              <div className="flex items-center gap-3">
                <Link to="/privacy" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                  {t('appFooter.privacyPolicy')}
                </Link>
                <span>&bull;</span>
                <Link to="/terms" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                  {t('appFooter.termsShort')}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#0F172A] font-medium">{t('appFooter.protocolLabel', { version: PROTOCOL_VERSION })}</span>
              <span>&bull;</span>
              <span>{t('appFooter.webcamReflexDiagnostics')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
