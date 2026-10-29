import { BookHeart, LifeBuoy, LogOut, PencilLine, Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { routeToHash, type Route } from '../hooks/useHashRoute'

interface AppShellProps {
  children: ReactNode
  /** Identifies the current screen; focus moves to its heading whenever this changes. */
  screenKey: string
  route?: Route
  navigate?: (route: Route) => void
  onOpenHelp: () => void
  onQuickExit: () => void
}

const NAV_ITEMS = [
  { route: { name: 'plan' }, labelKey: 'nav.plan', Icon: BookHeart },
  { route: { name: 'build', step: 1 }, labelKey: 'nav.build', Icon: PencilLine },
  { route: { name: 'settings' }, labelKey: 'nav.settings', Icon: SettingsIcon },
] as const satisfies readonly { route: Route; labelKey: string; Icon: unknown }[]

export function AppShell({ children, screenKey, route, navigate, onOpenHelp, onQuickExit }: AppShellProps) {
  const { t } = useTranslation()
  const mainRef = useRef<HTMLElement>(null)
  const previousScreen = useRef(screenKey)

  // On every screen change, move focus to the new heading so screen reader and keyboard users
  // start at the top of the new content (not on first load, where e.g. the PIN field has focus).
  useEffect(() => {
    if (previousScreen.current === screenKey) return
    previousScreen.current = screenKey
    window.scrollTo({ top: 0 })
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [screenKey])

  const navLinks = (variant: 'top' | 'bottom') =>
    navigate &&
    route &&
    NAV_ITEMS.map(({ route: target, labelKey, Icon }) => {
      const active = target.name === route.name
      return (
        <li key={target.name} className={variant === 'bottom' ? 'flex-1' : ''}>
          <a
            href={routeToHash(target)}
            aria-current={active ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              navigate(target)
            }}
            className={
              variant === 'bottom'
                ? `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-sm font-bold ${
                    active ? 'bg-primary-soft text-primary-ink' : 'text-ink-muted hover:text-ink'
                  }`
                : `inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold ${
                    active ? 'bg-primary-soft text-primary-ink' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                  }`
            }
          >
            <Icon aria-hidden="true" className="size-5" />
            {t(labelKey)}
          </a>
        </li>
      )
    })

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="skip-link btn-primary"
        onClick={(event) => {
          // A plain #main link would replace the router's hash, so move focus manually.
          event.preventDefault()
          mainRef.current?.focus()
        }}
      >
        {t('common.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8 shrink-0" />
            <span>{t('app.name')}</span>
          </p>
          <button
            type="button"
            className="btn-help order-3 basis-full sm:order-2 sm:basis-auto"
            onClick={onOpenHelp}
            aria-haspopup="dialog"
          >
            <LifeBuoy aria-hidden="true" className="size-5" />
            {t('help.button')}
          </button>
          <button
            type="button"
            className="btn-secondary order-2 min-h-11 px-3 text-sm sm:order-3"
            onClick={onQuickExit}
            aria-label={t('quickExit.label')}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {t('quickExit.button')}
          </button>
        </div>
        {navigate && (
          <nav aria-label={t('nav.label')} className="mx-auto hidden max-w-3xl px-4 pb-2 md:block">
            <ul className="flex gap-1">{navLinks('top')}</ul>
          </nav>
        )}
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={`mx-auto max-w-3xl px-4 pt-6 print:max-w-none print:p-0 ${navigate ? 'pb-28 md:pb-16' : 'pb-16'}`}
      >
        {children}
      </main>

      {navigate && (
        <nav
          aria-label={t('nav.label')}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden print:hidden"
        >
          <ul className="mx-auto flex max-w-md gap-1">{navLinks('bottom')}</ul>
        </nav>
      )}
    </div>
  )
}
