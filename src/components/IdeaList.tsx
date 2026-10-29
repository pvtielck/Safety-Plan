import { Lightbulb, Plus } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { SectionDef } from '../model/plan'

interface IdeaListProps {
  section: SectionDef
  /** Copies an idea into the "add" field so the person can reword it before adding. */
  onUse: (idea: string) => void
}

/**
 * Example prompts for a section. Ideas are never added straight to the plan: they go into the
 * input first, nudging people to put things in their own words.
 */
export function IdeaList({ section, onUse }: IdeaListProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const ideas = t(`sections.${section.key}.ideas`, { returnObjects: true }) as readonly string[]

  return (
    <section aria-labelledby={headingId} className="mt-8 rounded-2xl bg-accent-soft p-5 print:hidden">
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold">
        <Lightbulb aria-hidden="true" className="size-5 shrink-0" />
        {t(`sections.${section.key}.ideasTitle`)}
      </h2>
      <p className="mt-1 text-ink-muted">{t(`sections.${section.key}.ideasHint`)}</p>
      {section.ideasUsable ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <li key={idea}>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line-strong bg-surface px-4 py-1.5 text-left hover:bg-surface-muted"
                onClick={() => onUse(idea)}
                aria-label={t('builder.useIdeaLabel', { idea })}
              >
                <Plus aria-hidden="true" className="size-4 shrink-0" />
                {idea}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-6">
          {ideas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
