import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../model/settings'
import en from './locales/en.json'
import es from './locales/es.json'

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const

/** Human-readable names, always shown in their own language. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', es: 'Español' }

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
