import { smsHref, telHref } from '../lib/phone'
import { LANGUAGES } from '../model/settings'
import { crisisConfig } from './crisisResources'

describe('crisis resources config', () => {
  it('includes 988, the Crisis Text Line, the LA County help line, and 911', () => {
    const numbers = crisisConfig.resources.flatMap((r) => r.actions.map((a) => `${a.kind}:${a.number}`))
    expect(numbers).toEqual(expect.arrayContaining(['call:988', 'text:988', 'text:741741', 'call:18008547771', 'call:911']))
  })

  it('has every name and description in every supported language', () => {
    const missing = crisisConfig.resources.flatMap((resource) =>
      LANGUAGES.flatMap((language) => [
        ...(resource.name[language] ? [] : [`${resource.id} name (${language})`]),
        ...(resource.description[language] ? [] : [`${resource.id} description (${language})`]),
      ]),
    )
    expect(missing).toEqual([])
    for (const language of LANGUAGES) expect(crisisConfig.region[language]).toBeTruthy()
  })

  it('builds a working link for every action', () => {
    for (const { actions } of crisisConfig.resources) {
      for (const action of actions) {
        const href = action.kind === 'call' ? telHref(action.number) : smsHref(action.number, action.body?.en)
        expect(href).toMatch(/^(tel|sms):\d+/)
      }
    }
  })

  it('marks only 911 as an emergency (the only red styling in the app)', () => {
    expect(crisisConfig.resources.filter((r) => r.emergency).map((r) => r.id)).toEqual(['emergency'])
  })

  it('records when the numbers were last checked', () => {
    expect(crisisConfig.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
