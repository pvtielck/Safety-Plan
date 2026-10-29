import { ArrowLeft, ArrowRight, BookHeart, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ContactSectionEditor } from '../components/ContactSectionEditor'
import { PhotoEditor } from '../components/PhotoEditor'
import { SaveStatus } from '../components/SaveStatus'
import { StepProgress } from '../components/StepProgress'
import { TextSectionEditor } from '../components/TextSectionEditor'
import type { Route } from '../hooks/useHashRoute'
import { SECTIONS } from '../model/plan'
import { useAppStore } from '../state/AppStore'

export function BuilderScreen({ step, navigate }: { step: number; navigate: (route: Route) => void }) {
  const { t } = useTranslation()
  const { plan } = useAppStore()
  const section = SECTIONS[step - 1] ?? SECTIONS[0]!
  const key = section.key
  const isFirst = section.step === 1
  const isLast = section.step === SECTIONS.length

  return (
    <>
      <StepProgress current={section.step} plan={plan} onGo={(n) => navigate({ name: 'build', step: n })} />
      <p className="mt-3 text-sm text-ink-muted">{t('builder.skipOk')}</p>

      <div className="mt-6">
        <h1 tabIndex={-1} className="text-3xl font-bold leading-tight">
          {t(`sections.${key}.title`)}
        </h1>
        <p className="mt-3 text-lg leading-relaxed">{t(`sections.${key}.explanation`)}</p>
        <p className="mt-5 rounded-xl border-l-4 border-primary bg-primary-soft px-4 py-3 text-lg font-bold text-primary-ink">
          {t(`sections.${key}.question`)}
        </p>
      </div>

      {/* Keyed by section so each step's editor starts fresh and autosaves drafts on leave. */}
      <div className="mt-6" key={key}>
        {section.kind === 'text' ? <TextSectionEditor section={section} /> : <ContactSectionEditor section={section} />}
        {section.kind === 'text' && section.allowsPhotos && <PhotoEditor />}
      </div>

      <p className="mt-8 flex gap-2 text-ink-muted">
        <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
        {t(`sections.${key}.tip`)}
      </p>

      <div className="mt-8 border-t border-line pt-5">
        <SaveStatus />
        <div className="mt-4 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(isFirst ? { name: 'welcome' } : { name: 'build', step: section.step - 1 })}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            {t('common.back')}
          </button>
          {isLast ? (
            <button type="button" className="btn-primary" onClick={() => navigate({ name: 'plan' })}>
              <BookHeart aria-hidden="true" className="size-5" />
              {t('builder.finish')}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate({ name: 'build', step: section.step + 1 })}
            >
              {t('common.next')}
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
