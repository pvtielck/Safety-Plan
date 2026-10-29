import { Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnnouncer } from '../hooks/useAnnouncer'
import { useFlushOnUnmount } from '../hooks/useFlushOnUnmount'
import type { SectionDef, TextItem, TextSectionKey } from '../model/plan'
import { planActions } from '../model/planReducer'
import { useAppStore } from '../state/AppStore'
import { EntryList } from './EntryList'
import { IdeaList } from './IdeaList'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  inputRef?: Ref<HTMLTextAreaElement>
  error?: string
}

/** A short multi-line field. Enter adds the entry; Shift+Enter starts a new line. */
function TextField({ id, label, value, onChange, onSubmit, inputRef, error }: TextFieldProps) {
  const errorId = `${id}-error`
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      onSubmit()
    }
  }
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        ref={inputRef}
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        enterKeyHint="done"
        className="field resize-y"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1.5 font-bold text-warning-ink">
          {error}
        </p>
      )}
    </div>
  )
}

function TextItemEditor({
  section,
  item,
  close,
}: {
  section: TextSectionKey
  item: TextItem
  close: (savedLabel?: string) => void
}) {
  const { t } = useTranslation()
  const { dispatch } = useAppStore()
  const [text, setText] = useState(item.text)
  const [error, setError] = useState('')
  const settled = useRef(false)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const id = useId()

  useEffect(() => fieldRef.current?.focus(), [])

  // Autosave an unfinished edit if the person leaves the screen.
  useFlushOnUnmount(() => {
    if (!settled.current && text.trim() && text.trim() !== item.text) {
      dispatch({ type: 'updateText', section, id: item.id, text })
    }
  })

  const save = () => {
    const trimmed = text.trim()
    if (!trimmed) {
      setError(t('entry.empty'))
      return
    }
    settled.current = true
    if (trimmed !== item.text) dispatch({ type: 'updateText', section, id: item.id, text: trimmed })
    close(trimmed !== item.text ? trimmed : undefined)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      aria-label={t('entry.editHeading')}
    >
      <TextField
        id={id}
        label={t('entry.textLabel')}
        value={text}
        onChange={setText}
        onSubmit={save}
        error={error}
        inputRef={fieldRef}
      />
      <div className="mt-3 flex flex-wrap gap-2">
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

export function TextSectionEditor({ section }: { section: SectionDef & { kind: 'text' } }) {
  const { t } = useTranslation()
  const { plan, dispatch } = useAppStore()
  const [draft, setDraft] = useState('')
  const [message, announce] = useAnnouncer()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inputId = useId()
  const key = section.key

  // Autosave: anything typed but not yet added is kept when the person moves to another step.
  useFlushOnUnmount(() => {
    if (draft.trim()) dispatch(planActions.addText(key, draft))
  })

  const add = () => {
    const text = draft.trim()
    if (!text) {
      inputRef.current?.focus()
      return
    }
    dispatch(planActions.addText(key, text))
    setDraft('')
    announce(t('entry.added', { item: text }))
    inputRef.current?.focus()
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
        getLabel={(item) => item.text}
        renderItem={(item) => <p className="whitespace-pre-line text-lg">{item.text}</p>}
        renderEditor={(item, close) => <TextItemEditor section={key} item={item} close={close} />}
      />

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <TextField
          id={inputId}
          label={t(`sections.${key}.addLabel`)}
          value={draft}
          onChange={setDraft}
          onSubmit={add}
          inputRef={inputRef}
        />
        <button type="submit" className="btn-primary mt-3">
          <Plus aria-hidden="true" className="size-5" />
          {t('common.add')}
        </button>
      </form>

      <IdeaList
        section={section}
        onUse={(idea) => {
          setDraft(idea)
          inputRef.current?.focus()
        }}
      />
    </>
  )
}
