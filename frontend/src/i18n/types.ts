import type { en } from './locales/en';

export type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'EN', nativeName: 'English' },
  { code: 'hi', label: 'HI', nativeName: 'हिन्दी' },
  { code: 'es', label: 'ES', nativeName: 'Español' },
  { code: 'fr', label: 'FR', nativeName: 'Français' },
];

export type TranslationDictionary = typeof en;
