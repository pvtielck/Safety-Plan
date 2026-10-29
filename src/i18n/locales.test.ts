import { SECTIONS } from '../model/plan'
import en from './locales/en.json'
import es from './locales/es.json'

type Json = string | Json[] | { [key: string]: Json }

/** Flattens nested translations to "a.b.c" paths, noting arrays as such. */
function shape(value: Json, path = ''): Record<string, string> {
  if (typeof value === 'string') return { [path]: 'string' }
  if (Array.isArray(value)) return { [path]: 'array' }
  return Object.entries(value).reduce(
    (all, [key, child]) => ({ ...all, ...shape(child, path ? `${path}.${key}` : key) }),
    {} as Record<string, string>,
  )
}

function strings(value: Json): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  return Object.values(value).flatMap(strings)
}

const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()

describe('translations', () => {
  it('English and Spanish have exactly the same keys', () => {
    expect(shape(es as Json)).toEqual(shape(en as Json))
  })

  it('has no empty strings', () => {
    for (const text of [...strings(en as Json), ...strings(es as Json)]) expect(text.trim()).not.toBe('')
  })

  it('uses the same {{placeholders}} in both languages', () => {
    const enShape = shape(en as Json)
    const get = (root: Json, path: string) =>
      path.split('.').reduce((node, key) => (node as Record<string, Json>)[key]!, root) as string
    const mismatched = Object.keys(enShape).filter(
      (path) =>
        enShape[path] === 'string' &&
        placeholders(get(es as Json, path)).join() !== placeholders(get(en as Json, path)).join(),
    )
    expect(mismatched).toEqual([])
  })

  it('has content for every plan section, with at least three ideas each', () => {
    for (const { key } of SECTIONS) {
      for (const locale of [en, es]) {
        const section = locale.sections[key]
        expect(section.title).toBeTruthy()
        expect(section.explanation).toBeTruthy()
        expect(section.ideas.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
