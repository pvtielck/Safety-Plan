import { BookHeart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { crisisConfig } from '../config/crisisResources'
import { useLanguage } from '../i18n/useLanguage'
import { CrisisResourceList } from './CrisisResourceList'
import { Dialog } from './Dialog'

interface CrisisPanelProps {
  open: boolean
  onClose: () => void
  /** Shown when the plan is unlocked: jumps to the person's own plan. */
  onOpenPlan?: () => void
}

export function CrisisPanel({ open, onClose, onOpenPlan }: CrisisPanelProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const reviewed = new Date(`${crisisConfig.lastReviewed}T12:00:00`).toLocaleDateString(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Dialog open={open} onClose={onClose} title={t('help.title')} data-testid="crisis-panel">
      <p className="mb-5 text-lg">{t('help.intro')}</p>
      <CrisisResourceList variant="panel" autoFocusFirst />

      {onOpenPlan && (
        <div className="mt-6 rounded-2xl bg-primary-soft p-4">
          <p className="mb-3 text-primary-ink">{t('help.openPlanHint')}</p>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={onOpenPlan}>
            <BookHeart aria-hidden="true" className="size-5" />
            {t('help.openPlan')}
          </button>
        </div>
      )}

      <p className="mt-5 text-sm text-ink-muted">
        {t('help.region', { region: crisisConfig.region[language], date: reviewed })}
      </p>
    </Dialog>
  )
}
