import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation, SupportedLanguage } from '../../i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, supportedLanguages } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`relative inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-mono select-none ${className || ''}`}
    >
      <Globe className="w-3 h-3 text-slate-500 ml-1.5 mr-1 hidden sm:inline-block" aria-hidden="true" />
      {supportedLanguages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code as SupportedLanguage)}
            aria-pressed={isActive}
            title={lang.nativeName}
            className={`relative z-10 px-1.5 py-0.5 text-[11px] font-semibold rounded-sm transition-colors duration-150 ${
              isActive
                ? 'text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="activeLanguageHighlight"
                className="absolute inset-0 z-[-1] rounded-sm bg-slate-900 shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};
