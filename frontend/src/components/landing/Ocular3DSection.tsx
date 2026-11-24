import React, { Suspense } from 'react';
import { Eye, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

const Ocular3DExplorer = React.lazy(() =>
  import('./Ocular3DExplorer').then((module) => ({ default: module.Ocular3DExplorer }))
);

export const Ocular3DSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="ocular-3d-lab" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto space-y-12">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-mono font-medium text-[#0F172A]">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{t('ocular3d.badge')}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#0F172A]">
              {t('ocular3d.headingMain')} <span className="italic text-[#475569]">{t('ocular3d.headingItalic')}</span>
            </h2>
            <p className="font-sans text-sm text-[#475569] leading-relaxed">
              {t('ocular3d.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-[#0F172A] text-[#0F766E]">
              <Eye className="w-3.5 h-3.5" />
              {t('ocular3d.engineBadge')}
            </span>
          </div>
        </div>

        {/* 3D Component Mount with Suspense */}
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="w-full aspect-[16/9] bg-[#0F1117] rounded-xl border border-[#27282D] flex flex-col items-center justify-center text-white space-y-3 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
                <span className="text-[#64748B]">{t('ocular3d.loadingWebgl')}</span>
              </div>
            }
          >
            <Ocular3DExplorer />
          </Suspense>

          {/* Quick Technical Specs under 3D canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs text-[#475569]">
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-1 shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                {t('ocular3d.spec1Title')}
              </span>
              <p className="font-sans text-xs text-[#0F172A]">
                {t('ocular3d.spec1Desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-1 shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                {t('ocular3d.spec2Title')}
              </span>
              <p className="font-sans text-xs text-[#0F172A]">
                {t('ocular3d.spec2Desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-1 shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                {t('ocular3d.spec3Title')}
              </span>
              <p className="font-sans text-xs text-[#0F172A]">
                {t('ocular3d.spec3Desc')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
