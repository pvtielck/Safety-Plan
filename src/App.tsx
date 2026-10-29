import { Info, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from './components/AppShell'
import { CrisisPanel } from './components/CrisisPanel'
import { AUTO_LOCK_MINUTES } from './config/app'
import { useHashRoute, type Route } from './hooks/useHashRoute'
import { applyDocumentPreferences, requestPersistentStorage } from './lib/document'
import { quickExit } from './lib/quickExit'
import { isPlanEmpty } from './model/plan'
import { BuilderScreen } from './screens/BuilderScreen'
import { LockScreen } from './screens/LockScreen'
import { PlanScreen } from './screens/PlanScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { AppStoreProvider, useAppStore } from './state/AppStore'

type NoticeKey = 'save.recovered' | 'save.unavailable' | 'settings.erase.done'

/** Locks again (when a PIN is set) after the app has been in the background for a while. */
function useAutoLock(enabled: boolean, lock: () => void) {
  useEffect(() => {
    if (!enabled) return
    let hiddenAt: number | null = null
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null && Date.now() - hiddenAt >= AUTO_LOCK_MINUTES * 60_000) {
        lock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [enabled, lock])
}

function Notice({ children, onDismiss }: { children: string; onDismiss: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl bg-warning-soft p-4 text-warning-ink">
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p className="flex-1 font-bold">{children}</p>
      <button
        type="button"
        className="icon-btn -m-2 size-10 text-warning-ink"
        onClick={onDismiss}
        aria-label={t('common.dismiss')}
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}

function AppContent() {
  const { t, i18n } = useTranslation()
  const { settings, plan, loadStatus, saveProblem } = useAppStore()
  const [route, navigate] = useHashRoute()
  const [helpOpen, setHelpOpen] = useState(false)
  const [lockRequested, setLocked] = useState(() => settings.pin !== null)
  // If the PIN is removed (or all data erased), there's nothing left to unlock.
  const locked = lockRequested && settings.pin !== null
  const [exiting, setExiting] = useState(false)
  const [notice, setNotice] = useState<NoticeKey | null>(() => {
    if (loadStatus === 'recovered') return 'save.recovered'
    if (loadStatus === 'unavailable') return 'save.unavailable'
    return null
  })

  useEffect(() => {
    applyDocumentPreferences(settings)
    if (i18n.language !== settings.language) void i18n.changeLanguage(settings.language)
  }, [settings, i18n])

  useEffect(() => {
    document.title = t('app.name')
  }, [t, settings.language])

  useEffect(() => {
    if (!isPlanEmpty(plan)) requestPersistentStorage()
  }, [plan])

  const lock = useCallback(() => setLocked(true), [])
  useAutoLock(settings.pin !== null, lock)

  // If the browser restores this page from its back/forward cache after Quick exit, reload so
  // nothing from before is shown (and the PIN screen appears again if one is set).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && exiting) window.location.reload()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [exiting])

  const handleQuickExit = () => {
    // Clear the screen synchronously, before the browser starts loading the next page.
    flushSync(() => {
      setHelpOpen(false)
      setExiting(true)
    })
    quickExit()
  }

  const afterErase = () => {
    setNotice('settings.erase.done')
    navigate({ name: 'welcome' })
  }

  if (exiting) return null

  const resolved: Route =
    route.name === 'home' ? (settings.welcomeSeen ? { name: 'plan' } : { name: 'welcome' }) : route
  const screenKey = locked ? 'lock' : resolved.name === 'build' ? `build-${resolved.step}` : resolved.name

  let screen
  if (locked) {
    screen = <LockScreen onUnlock={() => setLocked(false)} onErased={afterErase} />
  } else if (resolved.name === 'build') {
    screen = <BuilderScreen step={resolved.step} navigate={navigate} />
  } else if (resolved.name === 'plan') {
    screen = <PlanScreen navigate={navigate} />
  } else if (resolved.name === 'settings') {
    screen = <SettingsScreen onErased={afterErase} />
  } else {
    screen = <WelcomeScreen navigate={navigate} />
  }

  return (
    <>
      <AppShell
        screenKey={screenKey}
        route={locked ? undefined : resolved}
        navigate={locked ? undefined : navigate}
        onOpenHelp={() => setHelpOpen(true)}
        onQuickExit={handleQuickExit}
      >
        {/* The save banner already covers blocked storage while building. */}
        {notice && !(notice === 'save.unavailable' && saveProblem) && (
          <Notice onDismiss={() => setNotice(null)}>{t(notice)}</Notice>
        )}
        {screen}
      </AppShell>
      <CrisisPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onOpenPlan={
          locked
            ? undefined
            : () => {
                setHelpOpen(false)
                navigate({ name: 'plan' })
              }
        }
      />
    </>
  )
}

export function App({ storage }: { storage?: Storage | null }) {
  return (
    <AppStoreProvider storage={storage}>
      <AppContent />
    </AppStoreProvider>
  )
}
