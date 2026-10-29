import { act, renderHook } from '@testing-library/react'
import type { StorageSchema } from '../lib/storage'
import { MemoryStorage } from '../test/utils'
import { usePersistentState } from './usePersistentState'

const counterSchema: StorageSchema<{ count: number }> = {
  key: 'test:counter',
  version: 1,
  createDefault: () => ({ count: 0 }),
  normalize: (data) => ({ count: typeof (data as { count?: unknown })?.count === 'number' ? (data as { count: number }).count : 0 }),
}

const stored = (storage: Storage) => JSON.parse(storage.getItem('test:counter') ?? 'null')?.data

describe('usePersistentState', () => {
  it('starts from the stored value', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:counter', JSON.stringify({ version: 1, savedAt: '', data: { count: 5 } }))

    const { result } = renderHook(() => usePersistentState(counterSchema, storage))

    expect(result.current[0]).toEqual({ count: 5 })
    expect(result.current[2].loadStatus).toBe('loaded')
  })

  it('does not write anything just by reading', () => {
    const storage = new MemoryStorage()
    renderHook(() => usePersistentState(counterSchema, storage))
    expect(storage.length).toBe(0)
  })

  it('saves synchronously on every update, including functional updates', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => usePersistentState(counterSchema, storage))

    act(() => {
      result.current[1]({ count: 1 })
    })
    expect(stored(storage)).toEqual({ count: 1 })

    act(() => {
      result.current[1]((previous) => ({ count: previous.count + 1 }))
      result.current[1]((previous) => ({ count: previous.count + 1 }))
    })
    expect(result.current[0]).toEqual({ count: 3 })
    expect(stored(storage)).toEqual({ count: 3 })
  })

  it('returns and exposes a quota error so callers can react', () => {
    const storage = new MemoryStorage(20) // too small for any envelope
    const { result } = renderHook(() => usePersistentState(counterSchema, storage))

    let saveResult
    act(() => {
      saveResult = result.current[1]({ count: 7 })
    })

    expect(saveResult).toEqual({ ok: false, reason: 'quota' })
    expect(result.current[2].lastSave).toEqual({ ok: false, reason: 'quota' })
    // The change is kept in memory so typed work isn't lost from the screen.
    expect(result.current[0].count).toBe(7)
  })

  it('clear() removes the stored value without writing a new one', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => usePersistentState(counterSchema, storage))
    act(() => {
      result.current[1]({ count: 7 })
    })

    act(() => {
      result.current[2].clear()
    })

    expect(result.current[0]).toEqual({ count: 0 })
    expect(storage.getItem('test:counter')).toBeNull()
  })

  it('picks up changes made in another tab', () => {
    const { result } = renderHook(() => usePersistentState(counterSchema, localStorage))

    act(() => {
      localStorage.setItem('test:counter', JSON.stringify({ version: 1, savedAt: '', data: { count: 42 } }))
      window.dispatchEvent(new StorageEvent('storage', { key: 'test:counter', storageArea: localStorage }))
    })

    expect(result.current[0]).toEqual({ count: 42 })
  })
})
