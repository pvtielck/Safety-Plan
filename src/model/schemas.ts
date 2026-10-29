import type { StorageSchema } from '../lib/storage'
import {
  CONTACT_SECTION_KEYS,
  TEXT_SECTION_KEYS,
  createEmptyPlan,
  createId,
  type ContactItem,
  type PhotoItem,
  type SafetyPlan,
  type TextItem,
} from './plan'
import {
  LANGUAGES,
  TEXT_SIZES,
  THEMES,
  createDefaultSettings,
  type PinRecord,
  type Settings,
} from './settings'

/*
 * Storage schemas for the two things the app saves. To change a stored shape:
 *   1. bump `version`,
 *   2. add `migrations[oldVersion]` that converts old data to the new shape,
 *   3. update `normalize` and add a test in schemas.test.ts.
 */

export const PLAN_STORAGE_KEY = 'msp:plan'
export const SETTINGS_STORAGE_KEY = 'msp:settings'
export const ALL_STORAGE_KEYS = [PLAN_STORAGE_KEY, SETTINGS_STORAGE_KEY] as const

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

/** Keeps ids unique so React keys and reorder/delete stay correct even if data was hand-edited. */
function uniqueId(value: unknown, seen: Set<string>): string {
  let id = str(value)
  if (!id || seen.has(id)) id = createId()
  seen.add(id)
  return id
}

export function normalizePlan(data: unknown): SafetyPlan {
  const plan = createEmptyPlan()
  if (!isRecord(data)) return plan
  const seen = new Set<string>()

  for (const key of TEXT_SECTION_KEYS) {
    plan[key] = asArray(data[key]).flatMap((raw): TextItem[] => {
      if (!isRecord(raw)) return []
      const text = str(raw.text).trim()
      return text ? [{ id: uniqueId(raw.id, seen), text }] : []
    })
  }

  for (const key of CONTACT_SECTION_KEYS) {
    plan[key] = asArray(data[key]).flatMap((raw): ContactItem[] => {
      if (!isRecord(raw)) return []
      const name = str(raw.name).trim()
      if (!name) return []
      return [{ id: uniqueId(raw.id, seen), name, phone: str(raw.phone).trim(), detail: str(raw.detail).trim() }]
    })
  }

  plan.photos = asArray(data.photos).flatMap((raw): PhotoItem[] => {
    if (!isRecord(raw)) return []
    const dataUrl = str(raw.dataUrl)
    // Only accept inline images; never a remote URL that would make the app reach the network.
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) return []
    return [{ id: uniqueId(raw.id, seen), dataUrl, caption: str(raw.caption).trim() }]
  })

  return plan
}

function normalizePin(value: unknown): PinRecord | null {
  if (!isRecord(value)) return null
  const hash = str(value.hash)
  const salt = str(value.salt)
  const iterations = value.iterations
  if (!hash || !salt || typeof iterations !== 'number' || iterations < 1) return null
  return { hash, salt, iterations }
}

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

export function normalizeSettings(data: unknown): Settings {
  const defaults = createDefaultSettings()
  if (!isRecord(data)) return defaults
  return {
    language: oneOf(LANGUAGES, data.language, defaults.language),
    textSize: oneOf(TEXT_SIZES, data.textSize, defaults.textSize),
    theme: oneOf(THEMES, data.theme, defaults.theme),
    pin: normalizePin(data.pin),
    welcomeSeen: data.welcomeSeen === true,
  }
}

export const planSchema: StorageSchema<SafetyPlan> = {
  key: PLAN_STORAGE_KEY,
  version: 1,
  createDefault: createEmptyPlan,
  normalize: normalizePlan,
}

export const settingsSchema: StorageSchema<Settings> = {
  key: SETTINGS_STORAGE_KEY,
  version: 1,
  createDefault: createDefaultSettings,
  normalize: normalizeSettings,
}
