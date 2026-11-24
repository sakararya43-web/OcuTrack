import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLanguage, TranslationDictionary, SUPPORTED_LANGUAGES, LanguageOption } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { es } from './locales/es';
import { fr } from './locales/fr';

const STORAGE_KEY = 'ocutrack_language';

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  es,
  fr,
};

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

const defaultContextValue: LanguageContextValue = {
  language: 'en',
  setLanguage: () => {},
  t: (path: string, fallback?: string): string => {
    const parts = path.split('.');
    if (parts.length === 2) {
      const [section, key] = parts;
      const dictSection = (en as unknown as Record<string, Record<string, string>>)[section];
      if (dictSection && dictSection[key] !== undefined) {
        return dictSection[key];
      }
    }
    return fallback !== undefined ? fallback : path;
  },
  supportedLanguages: SUPPORTED_LANGUAGES,
};

const LanguageContext = createContext<LanguageContextValue>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
        if (saved && (saved === 'en' || saved === 'hi' || saved === 'es' || saved === 'fr')) {
          return saved;
        }
      }
    } catch {
      // Ignore localStorage errors (e.g. in restricted environments)
    }
    return 'en';
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, newLang);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    // Set document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const currentDict = dictionaries[language] || en;

  const t = useMemo(() => {
    return (path: string, fallback?: string): string => {
      const parts = path.split('.');
      if (parts.length === 2) {
        const [section, key] = parts;
        const dictSection = (currentDict as unknown as Record<string, Record<string, string>>)[section];
        if (dictSection && dictSection[key] !== undefined) {
          return dictSection[key];
        }
        // Fallback to English
        const enSection = (en as unknown as Record<string, Record<string, string>>)[section];
        if (enSection && enSection[key] !== undefined) {
          return enSection[key];
        }
      }
      return fallback !== undefined ? fallback : path;
    };
  }, [currentDict]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextValue => {
  return useContext(LanguageContext);
};
