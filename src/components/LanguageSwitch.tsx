import { useTranslation } from 'react-i18next'
import { LANGUAGE_NAMES } from '../i18n'
import { LANGUAGES } from '../model/settings'
import { useAppStore } from '../state/AppStore'
import { ChoiceGroup } from './ChoiceGroup'

/** Language choice, with each option labelled in its own language. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { settings, updateSettings } = useAppStore()
  return (
    <ChoiceGroup
      legend={compact ? t('welcome.language') : t('settings.language.title')}
      hideLegend={compact}
      name="language"
      value={settings.language}
      options={LANGUAGES.map((lang) => ({ value: lang, label: LANGUAGE_NAMES[lang], lang }))}
      onChange={(language) => updateSettings({ language })}
    />
  )
}
