import { Download, MessageSquareText, Pencil, Phone, Plus, Printer, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { crisisConfig } from '../config/crisisResources'
import { CrisisResourceList, crisisActionLabel } from '../components/CrisisResourceList'
import type { Route } from '../hooks/useHashRoute'
import { useLanguage } from '../i18n/useLanguage'
import { smsHref, telHref } from '../lib/phone'
import type { PdfContent } from '../lib/pdf'
import { SECTIONS, isPlanEmpty, type ContactItem, type SafetyPlan, type SectionDef } from '../model/plan'
import type { Language } from '../model/settings'
import { useAppStore } from '../state/AppStore'

type T = ReturnType<typeof useTranslation>['t']

function formatDate(date: Date, language: Language) {
  return date.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
}

function ContactCard({ item }: { item: ContactItem }) {
  const { t } = useTranslation()
  const tel = telHref(item.phone)
  const sms = smsHref(item.phone)
  return (
    <li className="rounded-xl bg-surface-muted p-4">
      <p className="text-xl font-bold">{item.name}</p>
      {item.detail && <p className="text-lg text-ink-muted">{item.detail}</p>}
      {item.phone && <p className="mt-1 text-lg">{item.phone}</p>}
      {tel && sms && (
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <a href={tel} className="btn-primary min-w-32" aria-label={t('contact.call', { name: item.name })}>
            <Phone aria-hidden="true" className="size-5" />
            {t('contact.callShort')}
          </a>
          <a href={sms} className="btn-secondary min-w-32" aria-label={t('contact.text', { name: item.name })}>
            <MessageSquareText aria-hidden="true" className="size-5" />
            {t('contact.textShort')}
          </a>
        </div>
      )}
    </li>
  )
}

function PlanStep({ section, plan, onEdit }: { section: SectionDef; plan: SafetyPlan; onEdit: () => void }) {
  const { t } = useTranslation()
  const photos = section.kind === 'text' && section.allowsPhotos ? plan.photos : []
  const isEmpty = plan[section.key].length === 0 && photos.length === 0
  const headingId = `plan-step-${section.step}`

  return (
    <li className="card">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary print:border print:border-black print:bg-white print:text-black"
        >
          {section.step}
        </span>
        <h2 id={headingId} className="min-w-0 flex-1 pt-1 text-xl font-bold leading-snug sm:text-2xl">
          <span className="sr-only">{t('plan.step', { number: section.step })}: </span>
          {t(`sections.${section.key}.planTitle`)}
        </h2>
        <button
          type="button"
          className="icon-btn -mr-2 -mt-1 print:hidden"
          onClick={onEdit}
          aria-label={t('plan.editStep', { number: section.step })}
        >
          <Pencil aria-hidden="true" className="size-5" />
        </button>
      </div>

      {isEmpty && (
        <div className="mt-3 pl-13">
          <p className="text-ink-muted">{t('plan.nothingYet')}</p>
          <button type="button" className="btn-quiet -ml-3 mt-1 print:hidden" onClick={onEdit}>
            <Plus aria-hidden="true" className="size-5" />
            {t('plan.addToStep')}
          </button>
        </div>
      )}

      {section.kind === 'text' && plan[section.key].length > 0 && (
        <ul className="mt-4 space-y-2.5 text-xl leading-relaxed">
          {plan[section.key].map((item) => (
            <li key={item.id} className="flex gap-3">
              <span aria-hidden="true" className="mt-3 size-2 shrink-0 rounded-full bg-primary print:bg-black" />
              <span className="min-w-0 whitespace-pre-line break-words">{item.text}</span>
            </li>
          ))}
        </ul>
      )}

      {section.kind === 'contact' && plan[section.key].length > 0 && (
        <ul className="mt-4 space-y-3">
          {plan[section.key].map((item) => (
            <ContactCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      {section.kind === 'contact' && section.showsCrisisResources && (
        <div className="mt-5">
          <h3 className="mb-3 text-lg font-bold">{t('sections.professionals.crisisIncluded')}</h3>
          <CrisisResourceList variant="compact" />
        </div>
      )}

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id}>
              <figure>
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || t('photos.defaultAlt')}
                  className="aspect-square w-full rounded-xl object-cover print:aspect-auto print:max-h-40 print:object-contain"
                />
                {photo.caption && <figcaption className="mt-1.5 text-lg">{photo.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function buildPdfContent(plan: SafetyPlan, t: T, language: Language, now = new Date()): PdfContent {
  const contactLine = (item: ContactItem) => [item.name, item.phone, item.detail].filter(Boolean).join(' — ')
  return {
    title: t('app.name'),
    intro: t('plan.intro'),
    madeOn: t('export.madeOn', { date: formatDate(now, language) }),
    footer: t('export.notCare'),
    steps: SECTIONS.map((section) => ({
      number: section.step,
      title: t(`sections.${section.key}.planTitle`),
      emptyText: t('plan.nothingYet'),
      entries:
        section.kind === 'text'
          ? plan[section.key].map((item) => item.text)
          : plan[section.key].map(contactLine),
      extra:
        section.kind === 'contact' && section.showsCrisisResources
          ? {
              heading: t('sections.professionals.crisisIncluded'),
              entries: crisisConfig.resources.map(
                (resource) =>
                  `${resource.name[language]}: ${resource.actions.map((action) => crisisActionLabel(action, language, t)).join(' / ')}`,
              ),
            }
          : undefined,
      photos:
        section.kind === 'text' && section.allowsPhotos
          ? plan.photos.map((photo) => ({ dataUrl: photo.dataUrl, caption: photo.caption }))
          : undefined,
    })),
  }
}

function ExportPanel({ plan }: { plan: SafetyPlan }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')

  const downloadPdf = async () => {
    setStatus('working')
    try {
      const { downloadPlanPdf } = await import('../lib/pdf')
      const date = new Date().toISOString().slice(0, 10)
      await downloadPlanPdf(buildPdfContent(plan, t, language), `${t('export.fileName')}-${date}.pdf`)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section aria-labelledby="export-heading" className="card mt-8 print:hidden">
      <h2 id="export-heading" className="text-xl font-bold">
        {t('export.title')}
      </h2>
      <p className="mt-2">{t('export.body')}</p>
      <p className="mt-3 flex gap-2 rounded-xl bg-surface-muted p-3 text-ink-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t('export.privacy')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="size-5" />
          {t('export.print')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => void downloadPdf()} disabled={status === 'working'}>
          <Download aria-hidden="true" className="size-5" />
          {status === 'working' ? t('export.making') : t('export.pdf')}
        </button>
      </div>
      <p role="status" className={status === 'error' ? 'mt-3 font-bold text-warning-ink' : 'mt-3 text-ink-muted'}>
        {status === 'done' ? t('export.done') : status === 'error' ? t('export.error') : ''}
      </p>
    </section>
  )
}

export function PlanScreen({ navigate }: { navigate: (route: Route) => void }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { plan } = useAppStore()
  const [today] = useState(() => new Date())

  if (isPlanEmpty(plan)) {
    return (
      <>
        <h1 tabIndex={-1} className="text-3xl font-bold">
          {t('app.name')}
        </h1>
        <div className="card mt-6">
          <h2 className="text-xl font-bold">{t('plan.emptyTitle')}</h2>
          <p className="mt-2 text-lg">{t('plan.emptyBody')}</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate({ name: 'build', step: 1 })}>
            {t('welcome.start')}
          </button>
        </div>
        <section aria-labelledby="empty-crisis" className="mt-8">
          <h2 id="empty-crisis" className="mb-3 text-lg font-bold">
            {t('sections.professionals.crisisIncluded')}
          </h2>
          <CrisisResourceList variant="compact" />
        </section>
      </>
    )
  }

  return (
    <>
      {/* Print-only header. */}
      <p className="mb-2 hidden text-sm print:block">{t('export.madeOn', { date: formatDate(today, language) })}</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 tabIndex={-1} className="text-3xl font-bold sm:text-4xl">
          {t('app.name')}
        </h1>
        <button type="button" className="btn-secondary print:hidden" onClick={() => navigate({ name: 'build', step: 1 })}>
          <Pencil aria-hidden="true" className="size-5" />
          {t('plan.edit')}
        </button>
      </div>
      <p className="mt-3 text-xl leading-relaxed">{t('plan.intro')}</p>

      <ol className="mt-6 space-y-5">
        {SECTIONS.map((section) => (
          <PlanStep
            key={section.key}
            section={section}
            plan={plan}
            onEdit={() => navigate({ name: 'build', step: section.step })}
          />
        ))}
      </ol>

      <p className="mt-6 hidden text-sm print:block">{t('export.notCare')}</p>
      <ExportPanel plan={plan} />
    </>
  )
}
