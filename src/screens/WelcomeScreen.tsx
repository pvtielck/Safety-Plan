import { ArrowRight, BookHeart, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../components/LanguageSwitch'
import type { Route } from '../hooks/useHashRoute'
import { SECTIONS, isPlanEmpty } from '../model/plan'
import { useAppStore } from '../state/AppStore'

export function WelcomeScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { t } = useTranslation()
  const { plan, settings, updateSettings } = useAppStore()
  const hasPlan = !isPlanEmpty(plan)

  const go = (route: Route) => {
    if (!settings.welcomeSeen) updateSettings({ welcomeSeen: true })
    navigate(route)
  }

  return (
    <>
      <div className="mb-6">
        <LanguageSwitch compact />
      </div>

      <h1 tabIndex={-1} className="text-3xl font-bold leading-tight sm:text-4xl">
        {t('app.name')}
      </h1>
      <p className="mt-4 text-xl leading-relaxed">{t('welcome.lead')}</p>
      <p className="mt-3 text-lg leading-relaxed">{t('welcome.aheadOfTime')}</p>

      <div className="mt-6 space-y-3">
        <p className="flex gap-3 rounded-2xl bg-primary-soft p-4 text-lg text-primary-ink">
          <HeartHandshake aria-hidden="true" className="mt-1 size-6 shrink-0" />
          {t('welcome.withSomeone')}
        </p>
        <p className="flex gap-3 rounded-2xl bg-help-soft p-4 text-lg">
          <Stethoscope aria-hidden="true" className="mt-1 size-6 shrink-0" />
          {t('welcome.notCare')}
        </p>
      </div>

      <section aria-labelledby="privacy-heading" className="card mt-6">
        <h2 id="privacy-heading" className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-primary" />
          {t('welcome.privacyTitle')}
        </h2>
        <p className="mt-2 text-lg">{t('welcome.privacyBody')}</p>
        <p className="mt-2 text-ink-muted">{t('welcome.privacyPin')}</p>
      </section>

      <section aria-labelledby="steps-heading" className="mt-8">
        <h2 id="steps-heading" className="text-xl font-bold">
          {t('welcome.stepsTitle')}
        </h2>
        <ol className="mt-4 space-y-3">
          {SECTIONS.map((section) => (
            <li key={section.key} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-ink"
              >
                {section.step}
              </span>
              <span className="pt-0.5">
                <span className="font-bold">{t(`sections.${section.key}.title`)}</span>
                <span className="block text-ink-muted">{t(`sections.${section.key}.short`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn-primary text-lg" onClick={() => go({ name: 'build', step: 1 })}>
          {hasPlan ? t('welcome.continue') : t('welcome.start')}
          <ArrowRight aria-hidden="true" className="size-5" />
        </button>
        {hasPlan && (
          <button type="button" className="btn-secondary text-lg" onClick={() => go({ name: 'plan' })}>
            <BookHeart aria-hidden="true" className="size-5" />
            {t('welcome.view')}
          </button>
        )}
      </div>
    </>
  )
}
