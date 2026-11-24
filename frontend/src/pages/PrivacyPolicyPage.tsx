import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../lib/constants';
import { useTranslation } from '../i18n';

export const PrivacyPolicyPage: React.FC = () => {
  const { t, dict } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-[#0F172A] py-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
        <Link to="/" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('privacyPage.home')}</span>
        </Link>
        <span>/</span>
        <span className="text-[#0F172A] font-medium">{t('privacyPage.breadcrumb')}</span>
      </div>

      {/* Page Header */}
      <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <Lock className="w-3 h-3 text-[#0F766E]" />
            {t('privacyPage.badge')}
          </span>
          <span className="font-mono text-[11px] text-[#64748B]">
            {t('privacyPage.protocolPrefix', { version: PROTOCOL_VERSION })}
          </span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          {t('privacyPage.title')}
        </h1>
        <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed max-w-2xl">
          {t('privacyPage.subtitle', { appName: APP_NAME })}
        </p>
        <p className="text-xs font-mono text-[#64748B]">
          {t('privacyPage.effectiveDate')}
        </p>
      </div>

      {/* Burn-After-Reading Architecture Highlight */}
      <div className="panel-ramp p-6 space-y-3 border-l-4 border-l-[#0F766E]">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F766E]">
          <ShieldCheck className="w-4 h-4" />
          <span>{t('privacyPage.highlightTitle')}</span>
        </div>
        <p className="text-sm text-[#475569] leading-relaxed">
          {t('privacyPage.highlightDesc')}
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-8 text-sm text-[#475569] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">01.</span>
            {t('privacyPage.s1Title')}
          </h2>
          <p>
            {t('privacyPage.s1Intro', { appName: APP_NAME })}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            {dict.privacyPage.s1Items.map((item, idx) => (
              <li key={idx}><strong>{item.strong}</strong> {item.text}</li>
            ))}
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">02.</span>
            {t('privacyPage.s2Title')}
          </h2>
          <p>
            {t('privacyPage.s2Intro')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            {dict.privacyPage.s2Items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">03.</span>
            {t('privacyPage.s3Title')}
          </h2>
          <p>
            {t('privacyPage.s3Body')}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">04.</span>
            {t('privacyPage.s4Title')}
          </h2>
          <p>
            {t('privacyPage.s4Body', { appName: APP_NAME })}
          </p>
          <div className="panel-ramp p-4 mt-2 text-xs font-mono text-[#64748B]">
            {t('privacyPage.contact')}
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/terms" className="btn-ramp-secondary text-xs">
          <span>{t('privacyPage.viewTerms')}</span>
        </Link>
        <Link to="/about" className="btn-ramp-secondary text-xs">
          <span>{t('privacyPage.systemLimitations')}</span>
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
