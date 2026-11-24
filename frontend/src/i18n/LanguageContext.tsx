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

export type TranslationParams = Record<string, string | number>;
export type TranslateFn = (
  path: string,
  fallbackOrParams?: string | TranslationParams,
  params?: TranslationParams
) => string;

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslateFn;
  dict: TranslationDictionary;
  supportedLanguages: LanguageOption[];
}

function getNestedString(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== 'object') {
      return undefined;
    }
    curr = (curr as Record<string, unknown>)[part];
  }
  return typeof curr === 'string' ? curr : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    params[key] !== undefined ? String(params[key]) : match
  );
}

export function createTranslator(currentDict: TranslationDictionary): TranslateFn {
  return (path, fallbackOrParams, paramsArg) => {
    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
    const params = typeof fallbackOrParams === 'object' ? fallbackOrParams : paramsArg;

    const localized = getNestedString(currentDict, path);
    if (localized !== undefined) {
      return interpolate(localized, params);
    }

    const english = getNestedString(en, path);
    if (english !== undefined) {
      return interpolate(english, params);
    }

    return fallback !== undefined ? interpolate(fallback, params) : path;
  };
}

export const defaultTranslator = createTranslator(en);

const defaultContextValue: LanguageContextValue = {
  language: 'en',
  setLanguage: () => {},
  t: defaultTranslator,
  dict: en,
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
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const currentDict = dictionaries[language] || en;

  const t = useMemo(() => createTranslator(currentDict), [currentDict]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      dict: currentDict,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, t, currentDict]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextValue => {
  return useContext(LanguageContext);
};
