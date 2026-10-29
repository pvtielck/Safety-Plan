import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getStorage,
  loadState,
  removeState,
  saveState,
  type LoadStatus,
  type SaveResult,
  type StorageSchema,
} from '../lib/storage'

export type Updater<T> = T | ((previous: T) => T)

export interface PersistenceControls<T> {
  /** What happened when the value was first read from storage. */
  loadStatus: LoadStatus
  /** The result of the most recent save. */
  lastSave: SaveResult
  /**
   * Deletes the stored value (and its backup) without writing a new one. The in-memory value
   * becomes `inMemory`, or the schema default.
   */
  clear: (inMemory?: T) => void
}

/**
 * Like `useState`, but the value is read from and written to localStorage through a
 * versioned schema.
 *
 * Saving happens synchronously inside the setter (not in an effect), so:
 *   - every change is on disk before the next paint, even if the page is closed right after;
 *   - the setter returns the `SaveResult`, letting callers react to a full disk (for example,
 *     by not adding a photo that doesn't fit).
 *
 * Changes made in another tab are picked up through the `storage` event.
 */
export function usePersistentState<T>(
  schema: StorageSchema<T>,
  storage: Storage | null = getStorage(),
): [T, (update: Updater<T>) => SaveResult, PersistenceControls<T>] {
  const [initial] = useState(() => loadState(schema, storage))
  const [value, setValue] = useState<T>(initial.value)
  const [lastSave, setLastSave] = useState<SaveResult>(
    initial.status === 'unavailable' ? { ok: false, reason: 'unavailable' } : { ok: true },
  )
  const valueRef = useRef(value)

  const update = useCallback(
    (next: Updater<T>): SaveResult => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(valueRef.current) : next
      if (Object.is(resolved, valueRef.current)) return { ok: true }
      valueRef.current = resolved
      const result = saveState(schema, resolved, storage)
      setLastSave(result)
      setValue(resolved)
      return result
    },
    [schema, storage],
  )

  const clear = useCallback(
    (inMemory?: T) => {
      removeState([schema.key], storage)
      const next = inMemory ?? schema.createDefault()
      valueRef.current = next
      setLastSave({ ok: true })
      setValue(next)
    },
    [schema, storage],
  )

  useEffect(() => {
    if (!storage) return
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== storage || (event.key !== schema.key && event.key !== null)) return
      // key === null means another tab called localStorage.clear().
      const next = loadState(schema, storage).value
      valueRef.current = next
      setValue(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [schema, storage])

  return [value, update, { loadStatus: initial.status, lastSave, clear }]
}
