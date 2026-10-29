import { QUICK_EXIT_URL } from '../config/app'

/**
 * Leaves the app for a neutral site. `location.replace` swaps out the app's history entry,
 * so pressing Back doesn't return to the plan (the app keeps only one history entry; see
 * useHashRoute). The referrer is suppressed by <meta name="referrer" content="no-referrer">.
 */
export function quickExit(url: string = QUICK_EXIT_URL) {
  document.title = ''
  window.location.replace(url)
}
