import { KeyRound, LockKeyhole, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup } from '../components/ChoiceGroup'
import { Dialog } from '../components/Dialog'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { PinField } from '../components/PinField'
import { AUTO_LOCK_MINUTES } from '../config/app'
import { hashPin, isValidPin } from '../lib/pin'
import { TEXT_SIZES, THEMES } from '../model/settings'
import { useAppStore } from '../state/AppStore'

function PinSection() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useAppStore()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const id = useId()
  const isOn = settings.pin !== null

  const reset = () => {
    setPin('')
    setConfirm('')
    setError('')
    setMode('view')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidPin(pin)) return setError(t('settings.pin.mustBeDigits'))
    if (pin !== confirm) return setError(t('settings.pin.noMatch'))
    setSaving(true)
    try {
      updateSettings({ pin: await hashPin(pin) })
      setMessage(t('settings.pin.saved'))
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="card">
      <h2 id={`${id}-heading`} className="flex items-center gap-2 text-xl font-bold">
        <LockKeyhole aria-hidden="true" className="size-6 shrink-0" />
        {t('settings.pin.title')}
      </h2>
      <p className="mt-2">{t('settings.pin.explain')}</p>
      <p className="mt-3 flex gap-2 rounded-xl bg-warning-soft p-3 text-warning-ink">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t('settings.pin.notEncryption')}
      </p>
      <p className="mt-3 font-bold">{isOn ? t('settings.pin.on') : t('settings.pin.off')}</p>
      {isOn && <p className="text-ink-muted">{t('settings.pin.autoLock', { minutes: AUTO_LOCK_MINUTES })}</p>}

      {mode === 'view' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setMessage('')
              setMode('edit')
            }}
          >
            <KeyRound aria-hidden="true" className="size-5" />
            {isOn ? t('settings.pin.change') : t('settings.pin.set')}
          </button>
          {isOn && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                updateSettings({ pin: null })
                setMessage(t('settings.pin.removed'))
              }}
            >
              {t('settings.pin.remove')}
            </button>
          )}
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <p id={`${id}-hint`} className="text-ink-muted">
            {t('settings.pin.digitsHint')}
          </p>
          <PinField
            id={`${id}-new`}
            label={t('settings.pin.newLabel')}
            value={pin}
            onChange={setPin}
            describedBy={`${id}-hint`}
            autoFocus
          />
          <PinField id={`${id}-confirm`} label={t('settings.pin.confirmLabel')} value={confirm} onChange={setConfirm} />
          {error && (
            <p role="alert" className="font-bold text-warning-ink">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('settings.pin.saving') : t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={reset}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
      <p role="status" className="mt-3 font-bold text-primary-ink">
        {message}
      </p>
    </section>
  )
}

export function EraseDataDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel: string
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-lg">{body}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onClose} data-autofocus>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn-emergency" onClick={onConfirm}>
          <Trash2 aria-hidden="true" className="size-5" />
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

export function SettingsScreen({ onErased }: { onErased: () => void }) {
  const { t } = useTranslation()
  const { settings, updateSettings, eraseAllData } = useAppStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const privacyPoints = t('settings.privacy.points', { returnObjects: true }) as readonly string[]

  return (
    <div className="mx-auto max-w-3xl">
      <h1 tabIndex={-1} className="text-3xl font-bold">
        {t('settings.title')}
      </h1>

      <div className="mt-6 space-y-5">
        <section className="card space-y-6">
          <LanguageSwitch />
          <ChoiceGroup
            legend={t('settings.textSize.title')}
            name="text-size"
            value={settings.textSize}
            options={TEXT_SIZES.map((size) => ({
              value: size,
              label: (
                <span className={size === 'large' ? 'text-lg' : size === 'xlarge' ? 'text-xl' : ''}>
                  {t(`settings.textSize.${size}`)}
                </span>
              ),
            }))}
            onChange={(textSize) => updateSettings({ textSize })}
          />
          <ChoiceGroup
            legend={t('settings.theme.title')}
            name="theme"
            value={settings.theme}
            options={THEMES.map((theme) => ({ value: theme, label: t(`settings.theme.${theme}`) }))}
            onChange={(theme) => updateSettings({ theme })}
          />
        </section>

        <section aria-labelledby="privacy-settings" className="card">
          <h2 id="privacy-settings" className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-primary" />
            {t('settings.privacy.title')}
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-6">
            {privacyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="mt-3 text-ink-muted">{t('settings.privacy.storageNote')}</p>
        </section>

        <PinSection />

        <section aria-labelledby="about-heading" className="card">
          <h2 id="about-heading" className="text-xl font-bold">
            {t('settings.about.title')}
          </h2>
          <p className="mt-2">{t('settings.about.body')}</p>
          <p className="mt-2 text-sm text-ink-muted">{t('settings.about.version', { version: __APP_VERSION__ })}</p>
        </section>

        <section aria-labelledby="erase-heading" className="card">
          <h2 id="erase-heading" className="text-xl font-bold">
            {t('settings.erase.title')}
          </h2>
          <p className="mt-2">{t('settings.erase.body')}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => setConfirmOpen(true)} aria-haspopup="dialog">
            <Trash2 aria-hidden="true" className="size-5" />
            {t('settings.erase.button')}
          </button>
        </section>
      </div>

      <EraseDataDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          eraseAllData()
          setConfirmOpen(false)
          onErased()
        }}
        title={t('settings.erase.confirmTitle')}
        body={t('settings.erase.confirmBody')}
        confirmLabel={t('settings.erase.confirmButton')}
      />
    </div>
  )
}
