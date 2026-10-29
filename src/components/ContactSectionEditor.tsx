import { Phone, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnnouncer } from '../hooks/useAnnouncer'
import { useFlushOnUnmount } from '../hooks/useFlushOnUnmount'
import type { ContactItem, ContactSectionKey, SectionDef } from '../model/plan'
import { planActions, type ContactFields } from '../model/planReducer'
import { useAppStore } from '../state/AppStore'
import { CrisisResourceList } from './CrisisResourceList'
import { EntryList } from './EntryList'
import { IdeaList } from './IdeaList'

const EMPTY: ContactFields = { name: '', phone: '', detail: '' }

interface ContactInputsProps {
  section: ContactSectionKey
  values: ContactFields
  onChange: (values: ContactFields) => void
  nameError?: string
  nameRef?: Ref<HTMLInputElement>
}

function ContactInputs({ section, values, onChange, nameError, nameRef }: ContactInputsProps) {
  const { t } = useTranslation()
  const id = useId()
  const set = (field: keyof ContactFields) => (event: { target: { value: string } }) =>
    onChange({ ...values, [field]: event.target.value })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-name`} className="field-label">
          {t(`sections.${section}.nameLabel`)}
        </label>
        <input
          id={`${id}-name`}
          ref={nameRef}
          value={values.name}
          onChange={set('name')}
          autoComplete="off"
          className="field"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? `${id}-name-error` : undefined}
        />
        {nameError && (
          <p id={`${id}-name-error`} className="mt-1.5 font-bold text-warning-ink">
            {nameError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="field-label">
          {t('contact.phoneLabel')} <span className="font-normal text-ink-muted">({t('common.optional')})</span>
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={values.phone}
          onChange={set('phone')}
          className="field"
        />
      </div>
      <div>
        <label htmlFor={`${id}-detail`} className="field-label">
          {t(`sections.${section}.detailLabel`)}{' '}
          <span className="font-normal text-ink-muted">({t('common.optional')})</span>
        </label>
        <input
          id={`${id}-detail`}
          autoComplete="off"
          value={values.detail}
          onChange={set('detail')}
          className="field"
        />
      </div>
    </div>
  )
}

function ContactItemEditor({
  section,
  item,
  close,
}: {
  section: ContactSectionKey
  item: ContactItem
  close: (savedLabel?: string) => void
}) {
  const { t } = useTranslation()
  const { dispatch } = useAppStore()
  const [values, setValues] = useState<ContactFields>({ name: item.name, phone: item.phone, detail: item.detail })
  const [nameError, setNameError] = useState('')
  const settled = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => nameRef.current?.focus(), [])

  const changed = () =>
    values.name.trim() !== item.name || values.phone.trim() !== item.phone || values.detail.trim() !== item.detail

  useFlushOnUnmount(() => {
    if (!settled.current && values.name.trim() && changed()) {
      dispatch({ type: 'updateContact', section, id: item.id, fields: values })
    }
  })

  const save = () => {
    if (!values.name.trim()) {
      setNameError(t('contact.nameRequired'))
      nameRef.current?.focus()
      return
    }
    settled.current = true
    const didChange = changed()
    if (didChange) dispatch({ type: 'updateContact', section, id: item.id, fields: values })
    close(didChange ? values.name.trim() : undefined)
  }

  return (
    <form
      aria-label={t('entry.editHeading')}
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <ContactInputs
        section={section}
        values={values}
        onChange={setValues}
        nameError={nameError}
        nameRef={nameRef}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="btn-primary">
          {t('entry.saveChanges')}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            settled.current = true
            close()
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

export function ContactSummary({ item }: { item: ContactItem }) {
  return (
    <>
      <p className="text-lg font-bold">{item.name}</p>
      {item.phone && (
        <p className="flex items-center gap-1.5">
          <Phone aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
          {item.phone}
        </p>
      )}
      {item.detail && <p className="text-ink-muted">{item.detail}</p>}
    </>
  )
}

export function ContactSectionEditor({ section }: { section: SectionDef & { kind: 'contact' } }) {
  const { t } = useTranslation()
  const { plan, dispatch } = useAppStore()
  const [draft, setDraft] = useState<ContactFields>(EMPTY)
  const [nameError, setNameError] = useState('')
  const [message, announce] = useAnnouncer()
  const nameRef = useRef<HTMLInputElement>(null)
  const key = section.key

  // Autosave: a contact typed but not yet added is kept when the person moves to another step.
  useFlushOnUnmount(() => {
    if (draft.name.trim()) dispatch(planActions.addContact(key, draft))
  })

  const add = () => {
    if (!draft.name.trim()) {
      setNameError(t('contact.nameRequired'))
      nameRef.current?.focus()
      return
    }
    dispatch(planActions.addContact(key, draft))
    announce(t('entry.added', { item: draft.name.trim() }))
    setDraft(EMPTY)
    setNameError('')
    nameRef.current?.focus()
  }

  return (
    <>
      <p role="status" className="sr-only">
        {message}
      </p>
      <EntryList
        list={key}
        items={plan[key]}
        heading={t('builder.yourList')}
        announce={announce}
        getLabel={(item) => item.name}
        renderItem={(item) => <ContactSummary item={item} />}
        renderEditor={(item, close) => <ContactItemEditor section={key} item={item} close={close} />}
      />

      <form
        className="card mt-6 bg-surface-muted"
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <h2 className="mb-4 text-lg font-bold">{t(`sections.${key}.addLabel`)}</h2>
        <ContactInputs
          section={key}
          values={draft}
          onChange={(values) => {
            setDraft(values)
            if (nameError && values.name.trim()) setNameError('')
          }}
          nameError={nameError}
          nameRef={nameRef}
        />
        <button type="submit" className="btn-primary mt-4">
          <Plus aria-hidden="true" className="size-5" />
          {t('common.add')}
        </button>
      </form>

      <IdeaList
        section={section}
        onUse={(idea) => {
          setDraft((current) => ({ ...current, name: idea }))
          nameRef.current?.focus()
        }}
      />

      {section.showsCrisisResources && (
        <section aria-labelledby="crisis-included" className="mt-8">
          <h2 id="crisis-included" className="mb-3 text-lg font-bold">
            {t('sections.professionals.crisisIncluded')}
          </h2>
          <CrisisResourceList variant="compact" />
        </section>
      )}
    </>
  )
}
