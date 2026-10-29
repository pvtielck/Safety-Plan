import { SECTIONS } from '../model/plan'
import { LANGUAGES } from '../model/settings'
import { resources } from '.'
import en from './locales/en.json'
import fr from './locales/fr.json'

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

const translations = LANGUAGES.filter((language) => language !== 'en').map(
  (language) => [language, resources[language].translation as Json] as const,
)

describe('translations', () => {
  it.each(translations)('%s has exactly the same keys as English', (_, locale) => {
    expect(shape(locale)).toEqual(shape(en as Json))
  })

  it('has no empty strings', () => {
    for (const language of LANGUAGES) {
      for (const text of strings(resources[language].translation as Json)) expect(text.trim()).not.toBe('')
    }
  })

  it.each(translations)('%s uses the same {{placeholders}} as English', (_, locale) => {
    const enShape = shape(en as Json)
    const get = (root: Json, path: string) =>
      path.split('.').reduce((node, key) => (node as Record<string, Json>)[key]!, root) as string
    const mismatched = Object.keys(enShape).filter(
      (path) =>
        enShape[path] === 'string' &&
        placeholders(get(locale, path)).join() !== placeholders(get(en as Json, path)).join(),
    )
    expect(mismatched).toEqual([])
  })

  it('French keeps ? ! : ; and « » attached to their words with a non-breaking space', () => {
    // A plain space would let "?" wrap onto a line of its own, especially at large text sizes.
    const loose = strings(fr as Json).filter((text) => / [?!:;»]|« /.test(text))
    expect(loose).toEqual([])
  })

  it('has content for every plan section, with at least three ideas each', () => {
    for (const { key } of SECTIONS) {
      for (const { translation: locale } of Object.values(resources)) {
        const section = locale.sections[key]
        expect(section.title).toBeTruthy()
        expect(section.explanation).toBeTruthy()
        expect(section.ideas.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
