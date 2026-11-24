import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Cpu,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { APP_NAME, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { soundFx } from '../lib/soundFx';
import { useTranslation } from '../i18n';

export const AboutLimitationsPage: React.FC = () => {
  const { t, dict } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-[#0F172A]">
      {/* Page Header */}
      <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            {t('aboutPage.badge')}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
          {t('aboutPage.headingPrefix')} {APP_NAME} {t('aboutPage.headingSuffix')}
        </h1>
        <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed font-sans max-w-2xl">
          {t('aboutPage.subtitle')}
        </p>
      </div>

      {/* Mandatory Non-Diagnostic Notice */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm border-l-4 border-l-[#B45309]">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-mono text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              {t('aboutPage.notDiagnosticTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-sans font-normal">
              {t('common.disclaimer', NON_DIAGNOSTIC_DISCLAIMER)}
            </p>
          </div>
        </div>
        <div className="pt-3 text-xs text-[#475569] border-t border-[#E2E8F0] font-sans font-normal">
          <strong className="text-[#0F172A] font-mono uppercase text-[10px] block mb-0.5">{t('aboutPage.intendedScopeLabel')}</strong> {t('aboutPage.intendedScopeDesc')}
        </div>
      </div>

      {/* Scope Comparison Table: Can vs Cannot */}
      <div className="panel-ramp p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-[#64748B] font-semibold">
            {t('aboutPage.scopeTitle')}
          </h2>
          <p className="text-xs text-[#475569] mt-0.5 font-normal font-sans">
            {t('aboutPage.scopeSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* What OcuTrack Does */}
          <div className="bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-[#0F766E] uppercase tracking-wider text-[11px] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('aboutPage.whatMeasuresTitle')}</span>
            </div>
            <ul className="text-[#475569] space-y-2.5 leading-relaxed font-sans text-xs font-normal">
              {dict.aboutPage.whatMeasures.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#0F766E] font-bold">&bull;</span>
                  <span><strong className="text-[#0F172A] font-medium font-mono">{item.strong}</strong> {item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What OcuTrack Does NOT Do */}
          <div className="bg-[#F8FAFC] border border-[#FECACA] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-[#B91C1C] uppercase tracking-wider text-[11px] font-semibold">
              <XCircle className="w-4 h-4" />
              <span>{t('aboutPage.whatNotTitle')}</span>
            </div>
            <ul className="text-[#475569] space-y-2.5 leading-relaxed font-sans text-xs font-normal">
              {dict.aboutPage.whatNot.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#B91C1C] font-bold">&bull;</span>
                  <span><strong className="text-[#0F172A] font-medium font-mono">{item.strong}</strong> {item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Hardware & Constraints */}
      <div className="panel-ramp p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Video className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              {t('aboutPage.hardwareTitle')}
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              {t('aboutPage.hardwareSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
            <h3 className="text-[#0F172A] flex items-center gap-1.5 font-semibold uppercase text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              {t('aboutPage.fpsTitle')}
            </h3>
            <p className="text-[#475569] leading-relaxed font-sans font-normal">
              {t('aboutPage.fpsDesc')}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
            <h3 className="text-[#0F172A] flex items-center gap-1.5 font-semibold uppercase text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              {t('aboutPage.exposureTitle')}
            </h3>
            <p className="text-[#475569] leading-relaxed font-sans font-normal">
              {t('aboutPage.exposureDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Status */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Cpu className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              {t('aboutPage.mlTitle')}
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              {t('aboutPage.mlSubtitle')}
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-[#0F172A] border border-[#E2E8F0] uppercase">
              {t('aboutPage.mlBadge')}
            </span>
            <span className="text-[10px] text-[#64748B]">TCN-v0.1</span>
          </div>
          <p className="leading-relaxed text-[#475569] font-sans font-normal">
            {t('aboutPage.mlDesc')}
          </p>
        </div>
      </div>

      {/* Privacy & Data Governance */}
      <div className="panel-ramp p-6 sm:p-8 space-y-4 shadow-sm" id="privacy">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#475569]" />
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              {t('aboutPage.privacyTitle')}
            </h2>
            <p className="text-xs text-[#475569] font-normal font-sans">
              {t('aboutPage.privacySubtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#475569] leading-relaxed font-sans font-normal">
          <p>
            {t('aboutPage.privacyIntro')}
          </p>
          <ul className="list-disc list-inside space-y-2 pl-1 font-mono text-[11px] text-[#475569]">
            {dict.aboutPage.privacyItems.map((item, idx) => (
              <li key={idx}><strong className="text-[#0F172A]">{item.strong}</strong> {item.text}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0] text-xs font-mono">
        <Link
          to="/console"
          onClick={() => soundFx.playClick()}
          className="link-editorial font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('aboutPage.returnConsole')}</span>
        </Link>
        <Link
          to="/"
          onClick={() => soundFx.playClick()}
          className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
        >
          <span>{t('aboutPage.exploreLanding')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AboutLimitationsPage;
