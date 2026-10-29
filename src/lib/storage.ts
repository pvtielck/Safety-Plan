/**
 * Versioned localStorage persistence.
 *
 * Each value is stored as an envelope: `{ version, savedAt, data }`. On load, older versions
 * are upgraded one step at a time through the schema's migrations, and the result is always
 * passed through `normalize`, so a half-written or hand-edited value can never crash the app.
 *
 * A safety plan is precious, so nothing here silently throws data away: if stored data can't
 * be read (corrupt JSON, or a version newer than this app understands), the raw value is
 * copied to a backup key before the app falls back to a fresh value.
 */

export interface StorageSchema<T> {
  key: string
  /** The version this build of the app writes. Bump it when the stored shape changes. */
  version: number
  createDefault: () => T
  /** `migrations[n]` upgrades data stored at version `n` to version `n + 1`. */
  migrations?: Readonly<Record<number, (data: unknown) => unknown>>
  /** Turns unknown data (possibly partial or malformed) into a valid `T`. */
  normalize: (data: unknown) => T
}

export interface Envelope {
  version: number
  savedAt: string
  data: unknown
}

export type LoadStatus =
  /** Nothing stored yet. */
  | 'empty'
  | 'loaded'
  /** Stored at an older version and upgraded. */
  | 'migrated'
  /** Unreadable data was backed up and replaced with a fresh value. */
  | 'recovered'
  /** localStorage is blocked (e.g. some private-browsing modes). Changes won't persist. */
  | 'unavailable'

export interface LoadResult<T> {
  value: T
  status: LoadStatus
}

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' }

export const backupKey = (key: string) => `${key}:backup`

/** Returns localStorage, or null if the browser blocks access to it. */
export function getStorage(): Storage | null {
  try {
    const storage = window.localStorage
    void storage.length // Throws in browsers that block storage access.
    return storage
  } catch {
    return null
  }
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Envelope).version === 'number' &&
    Number.isInteger((value as Envelope).version) &&
    'data' in value
  )
}

function backup(storage: Storage, key: string, raw: string) {
  try {
    storage.setItem(backupKey(key), raw)
  } catch {
    // Out of space for a backup too; the original value is left untouched in that case
    // because we never overwrite it until the user makes a change.
  }
}

/** Upgrades `data` from `fromVersion` to the schema's current version. */
export function migrate<T>(schema: StorageSchema<T>, data: unknown, fromVersion: number): unknown {
  let current = data
  for (let v = fromVersion; v < schema.version; v++) {
    const step = schema.migrations?.[v]
    if (step) current = step(current)
  }
  return current
}

export function loadState<T>(schema: StorageSchema<T>, storage: Storage | null = getStorage()): LoadResult<T> {
  if (!storage) return { value: schema.createDefault(), status: 'unavailable' }

  const raw = storage.getItem(schema.key)
  if (raw === null) return { value: schema.createDefault(), status: 'empty' }

  try {
    const parsed: unknown = JSON.parse(raw)
    // Data saved without an envelope is treated as version 0.
    const envelope: Envelope = isEnvelope(parsed) ? parsed : { version: 0, savedAt: '', data: parsed }

    if (envelope.version > schema.version) {
      // Written by a newer version of the app (e.g. after a rollback). Keep a copy, then use
      // whatever this version can understand.
      backup(storage, schema.key, raw)
      return { value: schema.normalize(envelope.data), status: 'recovered' }
    }
    if (envelope.version < schema.version) {
      return { value: schema.normalize(migrate(schema, envelope.data, envelope.version)), status: 'migrated' }
    }
    return { value: schema.normalize(envelope.data), status: 'loaded' }
  } catch {
    backup(storage, schema.key, raw)
    return { value: schema.createDefault(), status: 'recovered' }
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22)
  )
}

export function saveState<T>(
  schema: StorageSchema<T>,
  value: T,
  storage: Storage | null = getStorage(),
  now: () => Date = () => new Date(),
): SaveResult {
  if (!storage) return { ok: false, reason: 'unavailable' }
  const envelope: Envelope = { version: schema.version, savedAt: now().toISOString(), data: value }
  try {
    storage.setItem(schema.key, JSON.stringify(envelope))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' }
  }
}

/** Removes the given keys and their backups. */
export function removeState(keys: readonly string[], storage: Storage | null = getStorage()) {
  if (!storage) return
  for (const key of keys) {
    storage.removeItem(key)
    storage.removeItem(backupKey(key))
  }
}
