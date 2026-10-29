import { createEmptyPlan, type SafetyPlan } from './plan'
import { planActions, planReducer } from './planReducer'

const planWith = (overrides: Partial<SafetyPlan>): SafetyPlan => ({ ...createEmptyPlan(), ...overrides })

const signs = planWith({
  warningSigns: [
    { id: 'a', text: 'First' },
    { id: 'b', text: 'Second' },
    { id: 'c', text: 'Third' },
  ],
})

describe('planReducer', () => {
  it('adds trimmed text entries with a fresh id', () => {
    const next = planReducer(createEmptyPlan(), planActions.addText('copingStrategies', '  Go for a walk  '))
    expect(next.copingStrategies).toHaveLength(1)
    expect(next.copingStrategies[0]!.text).toBe('Go for a walk')
    expect(next.copingStrategies[0]!.id).toBeTruthy()
  })

  it('ignores blank entries', () => {
    const plan = createEmptyPlan()
    expect(planReducer(plan, planActions.addText('warningSigns', '   '))).toBe(plan)
    expect(planReducer(plan, planActions.addContact('helpers', { name: ' ', phone: '555', detail: '' }))).toBe(plan)
  })

  it('updates text in place and never blanks an entry', () => {
    const next = planReducer(signs, { type: 'updateText', section: 'warningSigns', id: 'b', text: 'Changed ' })
    expect(next.warningSigns.map((i) => i.text)).toEqual(['First', 'Changed', 'Third'])
    expect(planReducer(signs, { type: 'updateText', section: 'warningSigns', id: 'b', text: '' })).toBe(signs)
  })

  it('adds and updates contacts', () => {
    let plan = planReducer(
      createEmptyPlan(),
      planActions.addContact('helpers', { name: ' Aunt Rosa ', phone: ' (323) 555-0100 ', detail: '' }),
    )
    const [rosa] = plan.helpers
    expect(rosa).toMatchObject({ name: 'Aunt Rosa', phone: '(323) 555-0100', detail: '' })

    plan = planReducer(plan, {
      type: 'updateContact',
      section: 'helpers',
      id: rosa!.id,
      fields: { name: 'Tía Rosa', phone: '3235550100', detail: 'Call after 5' },
    })
    expect(plan.helpers[0]).toEqual({ id: rosa!.id, name: 'Tía Rosa', phone: '3235550100', detail: 'Call after 5' })
  })

  it('moves entries up and down, and ignores moves past either end', () => {
    expect(planReducer(signs, { type: 'move', list: 'warningSigns', id: 'c', offset: -1 }).warningSigns.map((i) => i.id)).toEqual(
      ['a', 'c', 'b'],
    )
    expect(planReducer(signs, { type: 'move', list: 'warningSigns', id: 'a', offset: 1 }).warningSigns.map((i) => i.id)).toEqual(
      ['b', 'a', 'c'],
    )
    expect(planReducer(signs, { type: 'move', list: 'warningSigns', id: 'a', offset: -1 })).toBe(signs)
    expect(planReducer(signs, { type: 'move', list: 'warningSigns', id: 'c', offset: 1 })).toBe(signs)
  })

  it('removes an entry and can restore it to the same position', () => {
    const removed = planReducer(signs, { type: 'remove', list: 'warningSigns', id: 'b' })
    expect(removed.warningSigns.map((i) => i.id)).toEqual(['a', 'c'])

    const restored = planReducer(removed, {
      type: 'restore',
      list: 'warningSigns',
      item: { id: 'b', text: 'Second' },
      index: 1,
    })
    expect(restored).toEqual(signs)
    // Restoring twice doesn't duplicate.
    expect(planReducer(restored, { type: 'restore', list: 'warningSigns', item: { id: 'b', text: 'Second' }, index: 1 })).toBe(
      restored,
    )
  })

  it('adds photos and edits their captions', () => {
    let plan = planReducer(createEmptyPlan(), planActions.addPhoto('data:image/jpeg;base64,AAAA', ''))
    const id = plan.photos[0]!.id
    plan = planReducer(plan, { type: 'updatePhotoCaption', id, caption: ' My dog Luna ' })
    expect(plan.photos[0]).toEqual({ id, dataUrl: 'data:image/jpeg;base64,AAAA', caption: 'My dog Luna' })
  })

  it('does not mutate the previous plan', () => {
    const frozen = structuredClone(signs)
    planReducer(signs, { type: 'move', list: 'warningSigns', id: 'b', offset: 1 })
    planReducer(signs, { type: 'remove', list: 'warningSigns', id: 'a' })
    expect(signs).toEqual(frozen)
  })

  it('reset returns an empty plan', () => {
    expect(planReducer(signs, { type: 'reset' })).toEqual(createEmptyPlan())
  })
})
