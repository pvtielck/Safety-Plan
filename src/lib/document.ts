import type { Settings } from '../model/settings'

/** Applies language, text size, and color theme to <html> so CSS and assistive tech pick them up. */
export function applyDocumentPreferences({
  language,
  textSize,
  theme,
}: Pick<Settings, 'language' | 'textSize' | 'theme'>) {
  const root = document.documentElement
  root.lang = language
  root.dataset.textSize = textSize
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}

let persistRequested = false

/**
 * Asks the browser to keep this site's storage even when the device runs low on space, so a
 * plan isn't silently evicted. Browsers decide for themselves; some ask the person first.
 */
export function requestPersistentStorage() {
  if (persistRequested || typeof navigator === 'undefined' || !navigator.storage?.persist) return
  persistRequested = true
  void navigator.storage.persist().catch(() => undefined)
}
