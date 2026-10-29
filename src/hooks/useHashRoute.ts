import { useCallback, useEffect, useState } from 'react'
import { SECTIONS } from '../model/plan'

/**
 * A tiny hash router. Hash URLs work on any static host (GitHub Pages included) and offline,
 * with no server rewrites.
 *
 * Privacy choice: navigating inside the app REPLACES the current history entry instead of
 * pushing a new one. The app therefore occupies a single entry in the browser's history, so
 * after "Quick exit" the Back button leads to whatever was open before the app, not back into
 * someone's safety plan. In-app Back/Next buttons and the menu handle navigation instead.
 */

export type Route =
  | { name: 'home' }
  | { name: 'welcome' }
  | { name: 'build'; step: number }
  | { name: 'plan' }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (path === 'welcome') return { name: 'welcome' }
  if (path === 'plan') return { name: 'plan' }
  if (path === 'settings') return { name: 'settings' }
  const build = /^build(?:\/(\d+))?$/.exec(path)
  if (build) {
    const step = Number(build[1] ?? 1)
    return { name: 'build', step: Math.min(Math.max(step, 1), SECTIONS.length) }
  }
  return { name: 'home' }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'build':
      return `#/build/${route.step}`
    default:
      return `#/${route.name}`
  }
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.history.replaceState(window.history.state, '', routeToHash(next))
    setRoute(next)
  }, [])

  return [route, navigate]
}
