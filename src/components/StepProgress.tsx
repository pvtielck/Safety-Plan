import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { routeToHash } from '../hooks/useHashRoute'
import { SECTIONS, type SafetyPlan } from '../model/plan'

interface StepProgressProps {
  current: number
  plan: SafetyPlan
  onGo: (step: number) => void
}

export function StepProgress({ current, plan, onGo }: StepProgressProps) {
  const { t } = useTranslation()
  const total = SECTIONS.length

  return (
    <div className="print:hidden">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-primary-ink">{t('builder.stepOf', { current, total })}</p>
      </div>
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
            const isCurrent = section.step === current
            const filled =
              plan[section.key].length > 0 || (section.kind === 'text' && section.allowsPhotos && plan.photos.length > 0)
            return (
              <li key={section.key}>
                <a
                  href={routeToHash({ name: 'build', step: section.step })}
                  onClick={(event) => {
                    event.preventDefault()
                    onGo(section.step)
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${t('builder.goToStep', {
                    number: section.step,
                    title: t(`sections.${section.key}.title`),
                  })}${filled ? ` ${t('builder.filled')}` : ''}`}
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
