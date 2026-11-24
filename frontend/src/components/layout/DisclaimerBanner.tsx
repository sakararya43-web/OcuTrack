import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const DisclaimerBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      role="region"
      aria-label="Clinical non-diagnostic notice"
      className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-100 print:bg-white print:text-slate-900 print:border-slate-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 font-medium text-center">
        <ShieldAlert className="w-4 h-4 text-sky-400 flex-shrink-0 print:text-slate-700" aria-hidden="true" />
        <span>{t('common.disclaimer')}</span>
      </div>
    </div>
  );
};
