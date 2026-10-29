import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../model/settings'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ko from './locales/ko.json'
import zhHans from './locales/zh-Hans.json'

export const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  ko: { translation: ko },
  'zh-Hans': { translation: zhHans },
} as const satisfies Record<Language, { translation: unknown }>

/** Human-readable names, always shown in their own language. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ko: '한국어',
  'zh-Hans': '简体中文',
}

/**
 * Languages the downloadable PDF can be written in. Its built-in fonts only cover Latin-1, so for
 * other scripts the export panel points to Print and "Save as PDF", which uses the device's fonts.
 */
export const PDF_LANGUAGES: readonly Language[] = ['en', 'es', 'fr']

export function initI18n(language: Language) {
  // Translations are bundled with the app (no network loading), so init is synchronous.
  void i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes output.
    returnNull: false,
  })
  return i18n
}

export default i18n
