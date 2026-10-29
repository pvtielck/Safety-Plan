import { loadState } from '../lib/storage'
import { MemoryStorage } from '../test/utils'
import { createEmptyPlan } from './plan'
import { normalizePlan, normalizeSettings, planSchema, settingsSchema } from './schemas'
import { LANGUAGES } from './settings'

describe('normalizePlan', () => {
  it('returns an empty plan for anything that is not an object', () => {
    for (const value of [null, undefined, 'plan', 42, []]) {
      expect(normalizePlan(value)).toEqual(createEmptyPlan())
    }
  })

  it('keeps valid entries and drops malformed ones', () => {
    const plan = normalizePlan({
      warningSigns: [{ id: 'a', text: 'Real' }, { id: 'b', text: '   ' }, 'not an object', { text: 5 }],
      helpers: [{ id: 'h', name: 'Sam', phone: 555 }, { id: 'x', name: '' }],
      photos: [
        { id: 'p1', dataUrl: 'data:image/jpeg;base64,AAAA', caption: 'Luna' },
        { id: 'p2', dataUrl: 'https://tracker.example.com/pixel.gif', caption: 'remote' },
      ],
      unknownSection: [{ text: 'ignored' }],
    })

    expect(plan.warningSigns).toEqual([{ id: 'a', text: 'Real' }])
    expect(plan.helpers).toEqual([{ id: 'h', name: 'Sam', phone: '', detail: '' }])
    // Remote image URLs are rejected so a tampered plan can't make the app reach the network.
    expect(plan.photos).toEqual([{ id: 'p1', dataUrl: 'data:image/jpeg;base64,AAAA', caption: 'Luna' }])
    expect(plan).not.toHaveProperty('unknownSection')
  })

  it('gives entries unique ids even if stored ids are missing or duplicated', () => {
    const plan = normalizePlan({
      copingStrategies: [{ id: 'same', text: 'One' }, { id: 'same', text: 'Two' }, { text: 'Three' }],
    })
    const ids = plan.copingStrategies.map((i) => i.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids[0]).toBe('same')
  })
})

describe('normalizeSettings', () => {
  it('falls back to defaults for unknown values and never keeps a broken PIN record', () => {
    const settings = normalizeSettings({
      language: 'de',
      textSize: 'huge',
      theme: 'dark',
      pin: { hash: 'abc' },
      welcomeSeen: 'yes',
    })
    expect(settings).toMatchObject({ textSize: 'standard', theme: 'dark', pin: null, welcomeSeen: false })
    expect(LANGUAGES).toContain(settings.language)
  })

  it('keeps a complete PIN record', () => {
    const pin = { hash: 'h', salt: 's', iterations: 1000 }
    expect(normalizeSettings({ language: 'es', pin }).pin).toEqual(pin)
  })
})

describe('stored schemas', () => {
  it('load a version 1 plan saved by this app', () => {
    const storage = new MemoryStorage()
    const data = { ...createEmptyPlan(), reasonsForLiving: [{ id: 'r', text: 'My sister' }] }
    storage.setItem(planSchema.key, JSON.stringify({ version: 1, savedAt: '', data }))
    expect(loadState(planSchema, storage)).toEqual({ value: data, status: 'loaded' })
  })

  it('use separate keys for the plan and settings', () => {
    expect(planSchema.key).not.toBe(settingsSchema.key)
  })
})
