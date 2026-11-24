import React from 'react';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../../lib/constants';
import { useTranslation } from '../../i18n';

export const DisclaimerBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <aside
      aria-label="Clinical Protocol Status"
      className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-[11px] leading-relaxed text-[#475569] font-sans flex items-center justify-center z-50 relative"
    >
      <div className="flex items-center gap-2.5 max-w-[1440px] w-full justify-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-white text-[#0F172A] border border-slate-200 shrink-0 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
          {t('nav.notice', 'Protocol Notice')}
        </span>
        <span className="tracking-normal text-center text-xs text-[#475569] font-normal truncate sm:text-clip">
          {t('common.disclaimer', NON_DIAGNOSTIC_DISCLAIMER)}
        </span>
      </div>
    </aside>
  );
};
