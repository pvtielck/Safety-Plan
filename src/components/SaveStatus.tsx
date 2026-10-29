import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../state/AppStore'

/** Reassures people that their work is kept, and speaks up clearly if it isn't. */
export function SaveStatus() {
  const { t } = useTranslation()
  const { saveProblem } = useAppStore()

  if (saveProblem) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 font-bold text-warning-ink">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t(saveProblem === 'quota' ? 'save.quota' : 'save.unavailable')}
      </p>
    )
  }
  return (
    <p className="flex items-center gap-1.5 text-sm text-ink-muted">
      <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
      {t('save.saved')}
    </p>
  )
}
