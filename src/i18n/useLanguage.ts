import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '../model/settings'

/** The active UI language, narrowed to one the app supports. */
export function useLanguage(): Language {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language
  return (LANGUAGES as readonly string[]).includes(current) ? (current as Language) : 'en'
}
