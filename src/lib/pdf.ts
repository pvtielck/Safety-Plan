import type { jsPDF } from 'jspdf'

/**
 * Builds a printable PDF of the plan entirely on the device. Nothing is uploaded.
 *
 * The caller passes already-translated strings, so this file only does layout. jsPDF's
 * built-in fonts cover Latin-1, which is enough for English, Spanish, and French (á, ñ, ¿, ç,
 * «...). Characters outside it (emoji, other scripts) are dropped from the PDF, so Korean and
 * Chinese aren't offered a PDF at all (see PDF_LANGUAGES). The Print option keeps everything,
 * and the README notes this limitation.
 */

export interface PdfStep {
  number: number
  title: string
  /** One string per entry. Contacts are pre-formatted, e.g. "Rosa — (323) 555-0100 — aunt". */
  entries: string[]
  emptyText: string
  /** Extra lines after the person's own entries (crisis lines in step 5). */
  extra?: { heading: string; entries: string[] }
  photos?: { dataUrl: string; caption: string }[]
}

export interface PdfContent {
  title: string
  intro: string
  madeOn: string
  footer: string
  steps: PdfStep[]
}

const PAGE = { width: 612, height: 792 } // US Letter, in points
const MARGIN = 54
const CONTENT_WIDTH = PAGE.width - MARGIN * 2
const INK: [number, number, number] = [30, 30, 30]
const MUTED: [number, number, number] = [90, 90, 90]
const ACCENT: [number, number, number] = [44, 107, 101]

const REPLACEMENTS: Record<string, string> = {
  '\u2018': "'", // left single quote
  '\u2019': "'", // right single quote / apostrophe
  '\u201c': '"', // left double quote
  '\u201d': '"', // right double quote
  '\u2013': '-', // en dash
  '\u2014': '-', // em dash
  '\u2026': '...', // ellipsis
  '\u2022': '-', // bullet
  '\u00a0': ' ', // non-breaking space
  '\u202f': ' ', // narrow non-breaking space (French)
  '\u0153': 'oe', // \u0153, as in "c\u0153ur" (not in Latin-1)
  '\u0152': 'OE', // \u0152
}

/** Printable ASCII, Latin-1 letters and symbols, and newlines. */
const isDrawable = (code: number) => code === 10 || (code >= 0x20 && code <= 0x7e) || (code >= 0xa1 && code <= 0xff)

/** Keeps text within the Latin-1 range the built-in PDF fonts can draw. */
export function toPdfText(text: string): string {
  return [...text.normalize('NFC')]
    .map((char) => REPLACEMENTS[char] ?? (char === '\t' ? ' ' : char))
    .filter((char) => isDrawable(char.codePointAt(0) ?? 0))
    .join('')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export async function createPlanPdf(content: PdfContent): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  doc.setProperties({ title: toPdfText(content.title) })
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - MARGIN - 24) {
      doc.addPage()
      y = MARGIN
    }
  }

  const write = (text: string, options: { size: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number }) => {
    const { size, bold = false, color = INK, indent = 0, gap = 4 } = options
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(toPdfText(text), CONTENT_WIDTH - indent) as string[]
    const lineHeight = size * 1.35
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, MARGIN + indent, y + size)
      y += lineHeight
    }
    y += gap
  }

  const bulletList = (entries: string[]) => {
    for (const entry of entries) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      ensureSpace(17)
      doc.setTextColor(...ACCENT)
      doc.text('-', MARGIN + 6, y + 12)
      write(entry, { size: 12, indent: 18, gap: 3 })
    }
  }

  write(content.title, { size: 24, bold: true, color: ACCENT, gap: 2 })
  write(content.madeOn, { size: 10, color: MUTED, gap: 8 })
  write(content.intro, { size: 12, gap: 14 })

  for (const step of content.steps) {
    ensureSpace(60)
    doc.setDrawColor(210, 200, 190)
    doc.line(MARGIN, y, PAGE.width - MARGIN, y)
    y += 10
    write(`${step.number}. ${step.title}`, { size: 15, bold: true, gap: 6 })

    if (step.entries.length === 0 && !step.photos?.length) {
      write(step.emptyText, { size: 11, color: MUTED, gap: 6 })
    } else {
      bulletList(step.entries)
    }

    if (step.extra) {
      y += 4
      write(step.extra.heading, { size: 11, bold: true, color: MUTED, gap: 4 })
      bulletList(step.extra.entries)
    }

    if (step.photos?.length) {
      const size = 118
      const gap = 14
      const perRow = Math.floor((CONTENT_WIDTH + gap) / (size + gap))
      for (let i = 0; i < step.photos.length; i += perRow) {
        const row = step.photos.slice(i, i + perRow)
        ensureSpace(size + 34)
        let tallestCaption = 0
        row.forEach((photo, column) => {
          const x = MARGIN + column * (size + gap)
          const { width, height } = doc.getImageProperties(photo.dataUrl)
          const scale = Math.min(size / width, size / height)
          doc.addImage(photo.dataUrl, 'JPEG', x, y, width * scale, height * scale)
          if (photo.caption) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(...MUTED)
            const lines = (doc.splitTextToSize(toPdfText(photo.caption), size) as string[]).slice(0, 2)
            doc.text(lines, x, y + size + 12)
            tallestCaption = Math.max(tallestCaption, lines.length * 12)
          }
        })
        y += size + tallestCaption + 16
      }
    }
    y += 8
  }

  // Footer on every page: the care disclaimer and page numbers.
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(toPdfText(content.footer), MARGIN, PAGE.height - MARGIN / 2)
    doc.text(`${page} / ${pages}`, PAGE.width - MARGIN, PAGE.height - MARGIN / 2, { align: 'right' })
  }

  return doc
}

export async function downloadPlanPdf(content: PdfContent, fileName: string) {
  const doc = await createPlanPdf(content)
  doc.save(fileName)
}
