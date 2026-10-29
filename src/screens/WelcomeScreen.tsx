import { ArrowRight, BookHeart, HeartHandshake, Languages, Phone, ShieldCheck, Stethoscope, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../components/LanguageSwitch'
import type { Route } from '../hooks/useHashRoute'
import { SECTIONS, isPlanEmpty } from '../model/plan'
import { useAppStore } from '../state/AppStore'

const FEATURES = [
  { Icon: ShieldCheck, title: 'welcome.privacyTitle', body: 'welcome.privacyBody' },
  { Icon: WifiOff, title: 'welcome.offlineTitle', body: 'welcome.offlineBody' },
  { Icon: Languages, title: 'welcome.freeTitle', body: 'welcome.freeBody' },
] as const

/** A decorative glimpse of a finished plan, built from the translated example ideas. */
function PlanPreview() {
  const { t } = useTranslation()
  const firstIdea = (key: (typeof SECTIONS)[number]['key']) =>
    (t(`sections.${key}.ideas`, { returnObjects: true }) as readonly string[])[0]
  const rows = [
    { step: 1, key: 'warningSigns' },
    { step: 2, key: 'copingStrategies' },
    { step: 4, key: 'helpers' },
    { step: 7, key: 'reasonsForLiving' },
  ] as const

  return (
    <div aria-hidden="true" className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary-soft" />
      <div className="card space-y-4 p-5 shadow-lg sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
            {t('app.name')}
          </p>
          <span className="rounded-full bg-accent-soft px-3 py-0.5 text-sm font-bold">{t('welcome.previewLabel')}</span>
        </div>
        {rows.map(({ step, key }) => (
          <div key={key} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
              {step}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-snug">{t(`sections.${key}.planTitle`)}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-ink-muted">
                <span className="min-w-0">{firstIdea(key)}</span>
                {key === 'helpers' && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-on-primary">
                    <Phone className="size-3.5" />
                    {t('contact.callShort')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WelcomeScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { t } = useTranslation()
  const { plan, settings, updateSettings } = useAppStore()
  const hasPlan = !isPlanEmpty(plan)

  const go = (route: Route) => {
    if (!settings.welcomeSeen) updateSettings({ welcomeSeen: true })
    navigate(route)
  }

  const actions = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" className="btn-primary px-6 text-lg" onClick={() => go({ name: 'build', step: 1 })}>
        {hasPlan ? t('welcome.continue') : t('welcome.start')}
        <ArrowRight aria-hidden="true" className="size-5" />
      </button>
      {hasPlan && (
        <button type="button" className="btn-secondary px-6 text-lg" onClick={() => go({ name: 'plan' })}>
          <BookHeart aria-hidden="true" className="size-5" />
          {t('welcome.view')}
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="mb-6 flex justify-end">
        <LanguageSwitch compact />
      </div>

      {/* Hero: what this is, and the one thing to do next, before any scrolling. */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="font-bold text-primary-ink">{t('app.name')}</p>
          <h1 tabIndex={-1} className="mt-2 text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {t('welcome.heroTitle')}
          </h1>
          <p className="mt-5 text-xl leading-relaxed">{t('welcome.lead')}</p>
          <p className="mt-3 text-lg text-ink-muted">{t('welcome.aheadOfTime')}</p>
          <div className="mt-7">{actions}</div>
          <p className="mt-3 text-sm text-ink-muted">{t('welcome.reassure')}</p>
        </div>
        <div className="hidden px-4 lg:block">
          <PlanPreview />
        </div>
      </section>

      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, body }) => (
          <li key={title} className="card p-5 sm:p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-3 text-lg font-bold leading-snug">{t(title)}</h2>
            <p className="mt-1 text-ink-muted">{t(body)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">{t('welcome.privacyPin')}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <p className="flex gap-3 rounded-2xl bg-primary-soft p-5 text-lg text-primary-ink">
          <HeartHandshake aria-hidden="true" className="mt-1 size-6 shrink-0" />
          {t('welcome.withSomeone')}
        </p>
        <p className="flex gap-3 rounded-2xl bg-help-soft p-5 text-lg">
          <Stethoscope aria-hidden="true" className="mt-1 size-6 shrink-0" />
          {t('welcome.notCare')}
        </p>
      </div>

      <section aria-labelledby="steps-heading" className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 id="steps-heading" className="text-2xl font-bold sm:text-3xl">
            {t('welcome.stepsTitle')}
          </h2>
          <p className="mt-3 text-lg text-ink-muted">{t('plan.intro')}</p>
        </div>
        <ol>
          {SECTIONS.map((section, index) => (
            <li key={section.key} className="relative flex gap-4 pb-7 last:pb-0">
              {/* The connecting line shows the steps are followed in order. */}
              {index < SECTIONS.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-0 left-[1.1875rem] top-10 w-0.5 bg-line" />
              )}
              <span
                aria-hidden="true"
                className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-ink"
              >
                {section.step}
              </span>
              <span className="pt-1.5">
                <span className="block text-lg font-bold leading-snug">{t(`sections.${section.key}.title`)}</span>
                <span className="block text-ink-muted">{t(`sections.${section.key}.short`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="card mt-14 flex flex-col items-start gap-4 bg-surface-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg">{t('welcome.reassure')}</p>
        {actions}
      </div>
    </>
  )
}
