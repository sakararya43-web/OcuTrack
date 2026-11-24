import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, FileText } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { useTranslation } from '../i18n';

export const TermsConditionsPage: React.FC = () => {
  const { t, dict } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-[#0F172A] py-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
        <Link to="/" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('termsPage.home')}</span>
        </Link>
        <span>/</span>
        <span className="text-[#0F172A] font-medium">{t('termsPage.breadcrumb')}</span>
      </div>

      {/* Page Header */}
      <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <FileText className="w-3 h-3 text-[#0F766E]" />
            {t('termsPage.badge')}
          </span>
          <span className="font-mono text-[11px] text-[#64748B]">
            {t('termsPage.protocolPrefix', { version: PROTOCOL_VERSION })}
          </span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          {t('termsPage.title')}
        </h1>
        <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed max-w-2xl">
          {t('termsPage.subtitle', { appName: APP_NAME })}
        </p>
        <p className="text-xs font-mono text-[#64748B]">
          {t('termsPage.effectiveDate')}
        </p>
      </div>

      {/* Mandatory Regulatory Notice Banner */}
      <div className="panel-ramp p-6 space-y-3 border-l-4 border-l-[#B45309]">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#B45309]">
          <ShieldAlert className="w-4 h-4" />
          <span>{t('termsPage.noticeTitle')}</span>
        </div>
        <p className="text-sm text-[#475569] leading-relaxed">
          {t('common.disclaimer', NON_DIAGNOSTIC_DISCLAIMER)}
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-8 text-sm text-[#475569] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">01.</span>
            {t('termsPage.s1Title')}
          </h2>
          <p>
            {t('termsPage.s1P1', { appName: APP_NAME })}
          </p>
          <p>
            {t('termsPage.s1P2')}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">02.</span>
            {t('termsPage.s2Title')}
          </h2>
          <p>
            {t('termsPage.s2Body', { appName: APP_NAME })}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">03.</span>
            {t('termsPage.s3Title')}
          </h2>
          <p>
            {t('termsPage.s3Intro')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
            {dict.termsPage.s3Items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">04.</span>
            {t('termsPage.s4Title')}
          </h2>
          <p>
            {t('termsPage.s4Body', { appName: APP_NAME })}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-[#E2E8F0] pt-6">
          <h2 className="text-base font-semibold text-[#0F172A] font-sans flex items-center gap-2">
            <span className="font-mono text-xs text-[#0F766E] font-bold">05.</span>
            {t('termsPage.s5Title')}
          </h2>
          <p>
            {t('termsPage.s5Body')}
          </p>
        </section>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/privacy" className="btn-ramp-secondary text-xs">
          <span>{t('termsPage.viewPrivacy')}</span>
        </Link>
        <Link to="/about" className="btn-ramp-secondary text-xs">
          <span>{t('termsPage.systemLimitations')}</span>
        </Link>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
