import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { routeToHash } from '../hooks/useHashRoute'
import { SECTIONS, type SafetyPlan, type SectionDef } from '../model/plan'

interface StepProgressProps {
  current: number
  plan: SafetyPlan
  onGo: (step: number) => void
}

const isFilled = (section: SectionDef, plan: SafetyPlan) =>
  plan[section.key].length > 0 || (section.kind === 'text' && section.allowsPhotos && plan.photos.length > 0)

function useStepLink(onGo: (step: number) => void) {
  const { t } = useTranslation()
  return (section: SectionDef, current: number, plan: SafetyPlan) => {
    const filled = isFilled(section, plan)
    return {
      filled,
      isCurrent: section.step === current,
      props: {
        href: routeToHash({ name: 'build', step: section.step }),
        onClick: (event: { preventDefault: () => void }) => {
          event.preventDefault()
          onGo(section.step)
        },
        'aria-current': section.step === current ? ('step' as const) : undefined,
        'aria-label': `${t('builder.goToStep', {
          number: section.step,
          title: t(`sections.${section.key}.title`),
        })}${filled ? ` ${t('builder.filled')}` : ''}`,
      },
    }
  }
}

/** Phones and tablets: a progress bar and a row of numbered step buttons. */
export function StepProgress({ current, plan, onGo }: StepProgressProps) {
  const { t } = useTranslation()
  const stepLink = useStepLink(onGo)
  const total = SECTIONS.length

  return (
    <div className="print:hidden">
      <p className="font-bold text-primary-ink">{t('builder.stepOf', { current, total })}</p>
      {/* Decorative: the "Step x of y" text above carries the same information. */}
      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      <nav aria-label={t('builder.stepsNav')} className="mt-4">
        <ol className="flex flex-wrap gap-1.5">
          {SECTIONS.map((section) => {
            const { filled, isCurrent, props } = stepLink(section, current, plan)
            return (
              <li key={section.key}>
                <a
                  {...props}
                  className={`relative flex size-10 items-center justify-center rounded-full border-2 font-bold ${
                    isCurrent
                      ? 'border-primary bg-primary text-on-primary'
                      : filled
                        ? 'border-primary bg-primary-soft text-primary-ink'
                        : 'border-line-strong bg-surface text-ink-muted hover:bg-surface-muted'
                  }`}
                >
                  {section.step}
                  {filled && !isCurrent && (
                    <Check
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 size-4 rounded-full bg-primary p-0.5 text-on-primary"
                      strokeWidth={3}
                    />
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}

/** Wide screens: every step listed by name, so the whole plan's shape is always visible. */
export function StepSidebar({ current, plan, onGo }: StepProgressProps) {
  const { t } = useTranslation()
  const stepLink = useStepLink(onGo)
  const done = SECTIONS.filter((section) => isFilled(section, plan)).length

  return (
    <nav aria-label={t('builder.stepsNav')} className="print:hidden">
      <p className="font-bold text-primary-ink">{t('builder.stepOf', { current, total: SECTIONS.length })}</p>
      <div aria-hidden="true" className="mb-4 mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(done / SECTIONS.length) * 100}%` }} />
      </div>
      <ol className="space-y-1">
        {SECTIONS.map((section) => {
          const { filled, isCurrent, props } = stepLink(section, current, plan)
          return (
            <li key={section.key}>
              <a
                {...props}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 leading-snug ${
                  isCurrent ? 'bg-primary-soft font-bold text-primary-ink' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent
                      ? 'bg-primary text-on-primary'
                      : filled
                        ? 'bg-primary-soft text-primary-ink ring-1 ring-primary'
                        : 'border-2 border-line-strong'
                  }`}
                >
                  {filled && !isCurrent ? <Check className="size-4" strokeWidth={3} /> : section.step}
                </span>
                <span aria-hidden="true">{t(`sections.${section.key}.title`)}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
