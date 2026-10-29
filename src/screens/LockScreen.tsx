import { LifeBuoy, LockKeyhole } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { PinField } from '../components/PinField'
import { PIN_LENGTH, verifyPin } from '../lib/pin'
import { useAppStore } from '../state/AppStore'
import { EraseDataDialog } from './SettingsScreen'

export function LockScreen({ onUnlock, onErased }: { onUnlock: () => void; onErased: () => void }) {
  const { t } = useTranslation()
  const { settings, eraseAllData } = useAppStore()
  const [pin, setPin] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const id = useId()

  const check = async (candidate: string) => {
    if (!settings.pin || candidate.length !== PIN_LENGTH) return
    setChecking(true)
    setError('')
    const ok = await verifyPin(candidate, settings.pin)
    setChecking(false)
    if (ok) {
      onUnlock()
    } else {
      setError(t('lock.wrong'))
      setPin('')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <LanguageSwitch compact />
      </div>
      <div className="card text-center">
        <LockKeyhole aria-hidden="true" className="mx-auto size-10 text-primary" />
        <h1 tabIndex={-1} className="mt-3 text-2xl font-bold">
          {t('lock.title')}
        </h1>
        <p className="mt-2 text-ink-muted">{t('lock.intro')}</p>

        <form
          className="mt-6 flex flex-col items-center gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void check(pin)
          }}
        >
          <PinField
            id={id}
            label={t('lock.pinLabel')}
            value={pin}
            onChange={(value) => {
              setPin(value)
              // Check as soon as four digits are typed; the Unlock button is there too.
              if (value.length === PIN_LENGTH && value !== pin) void check(value)
            }}
            describedBy={error ? `${id}-error` : undefined}
            autoFocus
          />
          <button type="submit" className="btn-primary w-48" disabled={checking || pin.length !== PIN_LENGTH}>
            {checking ? t('lock.checking') : t('lock.unlock')}
          </button>
        </form>
        <p id={`${id}-error`} role="alert" className="mt-3 min-h-6 font-bold text-warning-ink">
          {error}
        </p>
      </div>

      <p className="mt-6 flex gap-2 rounded-2xl bg-help-soft p-4">
        <LifeBuoy aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t('lock.helpNote')}
      </p>

      <div className="mt-6 text-center">
        <button type="button" className="btn-quiet" onClick={() => setForgotOpen(true)} aria-haspopup="dialog">
          {t('lock.forgot')}
        </button>
      </div>

      <EraseDataDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onConfirm={() => {
          eraseAllData()
          setForgotOpen(false)
          onErased()
        }}
        title={t('lock.forgot')}
        body={t('lock.forgotBody')}
        confirmLabel={t('lock.forgotErase')}
      />
    </div>
  )
}
