export const LANGUAGES = ['en', 'es'] as const
export type Language = (typeof LANGUAGES)[number]

export const TEXT_SIZES = ['standard', 'large', 'xlarge'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

export const THEMES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEMES)[number]

/** A salted PBKDF2 hash of the PIN. The PIN itself is never stored. */
export interface PinRecord {
  hash: string
  salt: string
  iterations: number
}

export interface Settings {
  language: Language
  textSize: TextSize
  theme: ThemePreference
  pin: PinRecord | null
  /** Whether the welcome screen has been shown once, so returning users land on their plan. */
  welcomeSeen: boolean
}

/** Uses the device's first preferred language if the app supports it. */
export function detectLanguage(): Language {
  const first = typeof navigator === 'undefined' ? '' : (navigator.languages?.[0] ?? navigator.language ?? '')
  return first.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function createDefaultSettings(): Settings {
  return { language: detectLanguage(), textSize: 'standard', theme: 'system', pin: null, welcomeSeen: false }
}
