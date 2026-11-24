import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck, Lock } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';
import { useTranslation } from '../../i18n';

export const HelloMondayFooter: React.FC = () => {
  const { t, dict } = useTranslation();

  return (
    <footer className="bg-slate-50 text-[#0F172A] border-t border-slate-200">
      {/* 1. Structured Closing Section */}
      <section className="py-20 sm:py-24 px-6 sm:px-10 lg:px-12 border-b border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl space-y-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold">
              {t('landingFooter.eyebrow')}
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              {t('landingFooter.heading')}
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#475569] leading-relaxed">
              {t('landingFooter.subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/assessments/new"
                className="btn-ramp-primary text-xs py-2.5 px-5 shadow-sm flex items-center gap-2"
              >
                <span>{t('landingFooter.ctaInitiate')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/patients"
                className="btn-ramp-secondary text-xs py-2.5 px-5"
              >
                <span>{t('landingFooter.ctaRegistry')}</span>
              </Link>
              <Link
                to="/console"
                className="btn-ramp-secondary text-xs py-2.5 px-5"
              >
                <span>{t('landingFooter.ctaConsole')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Structured Institutional Columns */}
      <div className="py-16 px-6 sm:px-10 lg:px-12 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200 text-xs">
          {/* Brand & Mission Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base text-[#0F172A]">
                {APP_NAME}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-[#475569] border border-slate-200">
                {PROTOCOL_VERSION}
              </span>
            </div>
            <p className="text-[#475569] leading-relaxed font-normal">
              {t('landingFooter.brandDesc')}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                {t('landingFooter.protocolActive')}
              </span>
            </div>
          </div>

          {/* Protocols */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              {t('landingFooter.colProtocols')}
            </span>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.protocolLinks[0]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/assessments/new" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.protocolLinks[1]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/console" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.protocolLinks[2]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#tcn-model" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.protocolLinks[3]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Metrology */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              {t('landingFooter.colStandards')}
            </span>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <Link to="/about#iris-standard" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.standardLinks[0]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#privacy" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.standardLinks[1]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#quality" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.standardLinks[2]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about#limitations" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{dict.landingFooter.standardLinks[3]}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Legal Policies */}
          <div className="space-y-3">
            <span className="font-mono uppercase tracking-[0.08em] font-semibold text-[11px] text-[#0F172A] block">
              {t('landingFooter.colGovernance')}
            </span>
            <p className="text-[11px] text-[#475569] leading-relaxed">
              {t('landingFooter.governanceDesc')}
            </p>
            <ul className="space-y-2 text-[#475569] pt-1">
              <li>
                <Link to="/privacy" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                  <Lock className="w-3 h-3 text-[#0F766E]" />
                  <span>{t('landingFooter.privacyPolicy')}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#0F172A] transition-colors flex items-center gap-1 font-medium text-[#0F172A]">
                  <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                  <span>{t('landingFooter.termsConditions')}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0F172A] transition-colors flex items-center gap-1">
                  <span>{t('landingFooter.regulatoryNotice')}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal Links, Protocol Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#64748B] gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <p>{t('landingFooter.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                {t('landingFooter.privacyPolicy')}
              </Link>
              <span>&bull;</span>
              <Link to="/terms" className="hover:text-[#0F172A] transition-colors underline underline-offset-2">
                {t('landingFooter.termsShort')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>{t('landingFooter.protocolLabel', { version: PROTOCOL_VERSION })}</span>
            <span>&bull;</span>
            <span>{t('landingFooter.investigationalOnly')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HelloMondayFooter;
