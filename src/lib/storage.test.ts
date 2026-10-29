import { MemoryStorage } from '../test/utils'
import { backupKey, loadState, migrate, removeState, saveState, type StorageSchema } from './storage'

interface Note {
  title: string
  tags: string[]
}

/** A small schema with a migration history, to exercise the versioning machinery. */
const noteSchema: StorageSchema<Note> = {
  key: 'test:note',
  version: 3,
  createDefault: () => ({ title: '', tags: [] }),
  migrations: {
    // v1 stored `{ name }`; v2 renamed it to `title`.
    1: (data) => ({ title: (data as { name: string }).name }),
    // v3 added `tags`.
    2: (data) => ({ ...(data as object), tags: [] }),
  },
  normalize: (data) => {
    const value = (data ?? {}) as Partial<Note>
    return {
      title: typeof value.title === 'string' ? value.title : '',
      tags: Array.isArray(value.tags) ? value.tags.filter((t) => typeof t === 'string') : [],
    }
  },
}

const fixedNow = () => new Date('2026-01-02T03:04:05.000Z')

describe('saveState / loadState', () => {
  it('returns the default and "empty" when nothing is stored', () => {
    expect(loadState(noteSchema, new MemoryStorage())).toEqual({ value: { title: '', tags: [] }, status: 'empty' })
  })

  it('round-trips a value inside a versioned envelope', () => {
    const storage = new MemoryStorage()
    expect(saveState(noteSchema, { title: 'Hello', tags: ['a'] }, storage, fixedNow)).toEqual({ ok: true })

    expect(JSON.parse(storage.getItem('test:note')!)).toEqual({
      version: 3,
      savedAt: '2026-01-02T03:04:05.000Z',
      data: { title: 'Hello', tags: ['a'] },
    })
    expect(loadState(noteSchema, storage)).toEqual({ value: { title: 'Hello', tags: ['a'] }, status: 'loaded' })
  })

  it('migrates old data one version at a time', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:note', JSON.stringify({ version: 1, savedAt: '', data: { name: 'Old note' } }))

    expect(loadState(noteSchema, storage)).toEqual({ value: { title: 'Old note', tags: [] }, status: 'migrated' })
  })

  it('treats data saved without an envelope as version 0', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:note', JSON.stringify({ title: 'Bare', tags: ['x'] }))
    const schema = { ...noteSchema, version: 1, migrations: {} }

    expect(loadState(schema, storage)).toEqual({ value: { title: 'Bare', tags: ['x'] }, status: 'migrated' })
  })

  it('normalizes partial or malformed data instead of crashing', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:note', JSON.stringify({ version: 3, savedAt: '', data: { title: 42, tags: ['ok', 7] } }))

    expect(loadState(noteSchema, storage).value).toEqual({ title: '', tags: ['ok'] })
  })

  it('backs up corrupt JSON instead of throwing it away', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:note', '{not json')

    expect(loadState(noteSchema, storage)).toEqual({ value: { title: '', tags: [] }, status: 'recovered' })
    expect(storage.getItem(backupKey('test:note'))).toBe('{not json')
    // The original is left untouched until the person makes a change.
    expect(storage.getItem('test:note')).toBe('{not json')
  })

  it('backs up data written by a newer app version, then uses what it understands', () => {
    const storage = new MemoryStorage()
    const raw = JSON.stringify({ version: 99, savedAt: '', data: { title: 'Future', tags: [], extra: true } })
    storage.setItem('test:note', raw)

    expect(loadState(noteSchema, storage)).toEqual({ value: { title: 'Future', tags: [] }, status: 'recovered' })
    expect(storage.getItem(backupKey('test:note'))).toBe(raw)
  })

  it('reports a full device as a quota error', () => {
    const storage = new MemoryStorage(50)
    expect(saveState(noteSchema, { title: 'x'.repeat(100), tags: [] }, storage)).toEqual({ ok: false, reason: 'quota' })
  })

  it('reports blocked storage as unavailable', () => {
    expect(saveState(noteSchema, { title: 'x', tags: [] }, null)).toEqual({ ok: false, reason: 'unavailable' })
    expect(loadState(noteSchema, null).status).toBe('unavailable')
  })
})

describe('migrate', () => {
  it('skips versions that have no migration step', () => {
    const schema: StorageSchema<unknown> = {
      ...noteSchema,
      version: 4,
      migrations: { 3: (data) => ({ ...(data as object), upgraded: true }) },
    } as StorageSchema<unknown>
    expect(migrate(schema, { a: 1 }, 2)).toEqual({ a: 1, upgraded: true })
  })
})

describe('removeState', () => {
  it('removes values and their backups', () => {
    const storage = new MemoryStorage()
    storage.setItem('test:note', '1')
    storage.setItem(backupKey('test:note'), '2')
    storage.setItem('other', '3')

    removeState(['test:note'], storage)

    expect(storage.getItem('test:note')).toBeNull()
    expect(storage.getItem(backupKey('test:note'))).toBeNull()
    expect(storage.getItem('other')).toBe('3')
  })
})
