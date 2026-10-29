import { MessageSquareText, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { crisisConfig, type CrisisAction, type CrisisResource } from '../config/crisisResources'
import { smsHref, telHref } from '../lib/phone'
import { useLanguage } from '../i18n/useLanguage'
import type { Language } from '../model/settings'

export function crisisActionLabel(
  action: CrisisAction,
  language: Language,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (action.kind === 'call') return t('common.callNumber', { number: action.display })
  const keyword = action.body?.[language]
  return keyword
    ? t('common.textKeyword', { keyword, number: action.display })
    : t('common.textNumber', { number: action.display })
}

function ResourceAction({ action, resource, autoFocus }: { action: CrisisAction; resource: CrisisResource; autoFocus?: boolean }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const href = action.kind === 'call' ? telHref(action.number) : smsHref(action.number, action.body?.[language])
  if (!href) return null
  const Icon = action.kind === 'call' ? Phone : MessageSquareText
  const style = resource.emergency ? 'btn-emergency' : action.kind === 'call' ? 'btn-primary' : 'btn-secondary'
  return (
    <a href={href} className={`${style} w-full sm:w-auto`} data-autofocus={autoFocus || undefined}>
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {crisisActionLabel(action, language, t)}
    </a>
  )
}

interface CrisisResourceListProps {
  /** Large layout for the help panel; compact for inside the plan. */
  variant?: 'panel' | 'compact'
  /** Focus the first call button when shown (used when the help panel opens). */
  autoFocusFirst?: boolean
}

export function CrisisResourceList({ variant = 'panel', autoFocusFirst = false }: CrisisResourceListProps) {
  const language = useLanguage()

  return (
    <ul className={variant === 'panel' ? 'space-y-4' : 'space-y-3'}>
      {crisisConfig.resources.map((resource, resourceIndex) => (
        <li
          key={resource.id}
          className={`rounded-2xl border p-4 ${
            resource.emergency ? 'border-emergency/40 bg-surface' : 'border-line bg-surface-muted'
          }`}
        >
          <p className="text-lg font-bold leading-snug">{resource.name[language]}</p>
          <p className="mt-1 text-ink-muted">{resource.description[language]}</p>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            {resource.actions.map((action, actionIndex) => (
              <ResourceAction
                key={`${action.kind}-${action.number}`}
                action={action}
                resource={resource}
                autoFocus={autoFocusFirst && resourceIndex === 0 && actionIndex === 0}
              />
            ))}
          </div>
          {/* On paper, links can't be tapped, so print the numbers instead. */}
          <p className="mt-2 hidden font-bold print:block">
            {resource.actions
              .map((action) => (action.body?.[language] ? `${action.body[language]} → ${action.display}` : action.display))
              .join(' · ')}
          </p>
        </li>
      ))}
    </ul>
  )
}
