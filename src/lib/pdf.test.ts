import { createPlanPdf, toPdfText, type PdfContent } from './pdf'

describe('toPdfText', () => {
  it('keeps Spanish characters', () => {
    expect(toPdfText('¿Señales? ¡Sí! Ñandú, acción')).toBe('¿Señales? ¡Sí! Ñandú, acción')
  })

  it('swaps typographic punctuation for plain equivalents and drops emoji', () => {
    expect(toPdfText('“Hi” — it’s me \u{1F600}…')).toBe('"Hi" - it\'s me ...')
  })

  it('keeps line breaks and collapses tabs and double spaces', () => {
    expect(toPdfText('one\ntwo\tthree  four')).toBe('one\ntwo three four')
  })
})

describe('createPlanPdf', () => {
  const content: PdfContent = {
    title: 'My Safety Plan',
    intro: 'Start with step 1.',
    madeOn: 'Made on January 2, 2026',
    footer: 'This plan does not replace professional care.',
    steps: [
      { number: 1, title: 'Notice my warning signs', entries: ['I stop sleeping'], emptyText: 'Nothing added yet.' },
      {
        number: 5,
        title: 'Contact a professional',
        entries: [],
        emptyText: 'Nothing added yet.',
        extra: { heading: 'Crisis lines', entries: ['988 Suicide & Crisis Lifeline: Call 988'] },
      },
    ],
  }

  it('builds a PDF on the device with every section in it', async () => {
    const doc = await createPlanPdf(content)
    const output = doc.output()
    expect(output.startsWith('%PDF-')).toBe(true)
    for (const text of ['My Safety Plan', 'I stop sleeping', 'Nothing added yet.', 'Call 988', 'replace professional care']) {
      expect(output).toContain(text)
    }
  })

  it('adds pages for long plans and numbers them', async () => {
    const long = { ...content, steps: [{ ...content.steps[0]!, entries: Array.from({ length: 80 }, (_, i) => `Entry ${i + 1}`) }] }
    const doc = await createPlanPdf(long)
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
    expect(doc.output()).toContain(`1 / ${doc.getNumberOfPages()}`)
  })
})
