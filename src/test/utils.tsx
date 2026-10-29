import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { PLAN_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../model/schemas'
import { createEmptyPlan, type SafetyPlan } from '../model/plan'
import { createDefaultSettings, type Settings } from '../model/settings'
import { AppStoreProvider } from '../state/AppStore'

/**
 * An in-memory Storage with an optional size limit, for testing quota handling without
 * touching the real localStorage.
 */
export class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  private quotaChars: number

  constructor(quotaChars = Number.POSITIVE_INFINITY) {
    this.quotaChars = quotaChars
  }

  get length() {
    return this.items.size
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  setItem(key: string, value: string) {
    const used = [...this.items.entries()]
      .filter(([k]) => k !== key)
      .reduce((total, [k, v]) => total + k.length + v.length, 0)
    if (used + key.length + value.length > this.quotaChars) {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
    this.items.set(key, String(value))
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  clear() {
    this.items.clear()
  }
}

export function seedStorage(
  storage: Storage,
  { plan, settings }: { plan?: Partial<SafetyPlan>; settings?: Partial<Settings> } = {},
) {
  if (plan) {
    storage.setItem(
      PLAN_STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: '', data: { ...createEmptyPlan(), ...plan } }),
    )
  }
  if (settings) {
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: '', data: { ...createDefaultSettings(), language: 'en', ...settings } }),
    )
  }
}

export function readStored<T = unknown>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key)
  return raw === null ? null : (JSON.parse(raw) as { data: T }).data
}

/** Renders UI inside the app store, backed by a fresh in-memory storage. */
export function renderWithStore(
  ui: ReactElement,
  {
    storage = new MemoryStorage(),
    plan,
    settings,
    ...options
  }: { storage?: Storage; plan?: Partial<SafetyPlan>; settings?: Partial<Settings> } & RenderOptions = {},
) {
  seedStorage(storage, { plan, settings: settings ?? { language: 'en' } })
  return { storage, ...render(<AppStoreProvider storage={storage}>{ui}</AppStoreProvider>, options) }
}
