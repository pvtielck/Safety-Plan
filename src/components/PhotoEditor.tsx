import { ImagePlus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_PHOTOS } from '../config/app'
import { useAnnouncer } from '../hooks/useAnnouncer'
import { useFlushOnUnmount } from '../hooks/useFlushOnUnmount'
import { compressImage } from '../lib/image'
import type { PhotoItem } from '../model/plan'
import { planActions } from '../model/planReducer'
import { useAppStore } from '../state/AppStore'
import { EntryList } from './EntryList'

function CaptionEditor({ item, close }: { item: PhotoItem; close: (savedLabel?: string) => void }) {
  const { t } = useTranslation()
  const { dispatch } = useAppStore()
  const [caption, setCaption] = useState(item.caption)
  const settled = useRef(false)
  const fieldRef = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => fieldRef.current?.focus(), [])

  useFlushOnUnmount(() => {
    if (!settled.current && caption.trim() !== item.caption) {
      dispatch({ type: 'updatePhotoCaption', id: item.id, caption })
    }
  })

  const save = () => {
    settled.current = true
    const trimmed = caption.trim()
    const changed = trimmed !== item.caption
    if (changed) dispatch({ type: 'updatePhotoCaption', id: item.id, caption: trimmed })
    close(changed ? trimmed || t('photos.defaultAlt') : undefined)
  }

  return (
    <form
      aria-label={t('entry.editHeading')}
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <img src={item.dataUrl} alt="" className="mb-3 max-h-40 rounded-xl" />
      <label htmlFor={id} className="field-label">
        {t('photos.captionLabel')}
      </label>
      <span id={`${id}-hint`} className="field-hint">
        {t('photos.captionHint')}
      </span>
      <input
        id={id}
        ref={fieldRef}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        className="field"
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

export function PhotoEditor() {
  const { t } = useTranslation()
  const { plan, dispatch } = useAppStore()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [message, announce] = useAnnouncer()
  const fileRef = useRef<HTMLInputElement>(null)
  const headingId = useId()
  const atLimit = plan.photos.length >= MAX_PHOTOS

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setAdding(true)
    try {
      const action = planActions.addPhoto(await compressImage(file), '')
      const result = dispatch(action)
      if (!result.ok && result.reason === 'quota') {
        // Don't keep a photo in memory that isn't saved; it would vanish on the next visit.
        dispatch({ type: 'remove', list: 'photos', id: action.item.id })
        setError(t('photos.noSpace'))
      } else {
        announce(t('photos.added'))
      }
    } catch {
      setError(t('photos.error'))
    } finally {
      setAdding(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section aria-labelledby={headingId} className="mt-10">
      <h2 id={headingId} className="text-xl font-bold">
        {t('photos.title')}
      </h2>
      <p className="mb-4 mt-1 text-ink-muted">{t('photos.intro')}</p>
      <p role="status" className="sr-only">
        {adding ? t('photos.adding') : message}
      </p>

      <EntryList
        list="photos"
        items={plan.photos}
        heading=""
        announce={announce}
        getLabel={(item) => item.caption || t('photos.defaultAlt')}
        renderItem={(item) => (
          <figure>
            <img
              src={item.dataUrl}
              alt={item.caption || t('photos.defaultAlt')}
              className="max-h-64 w-auto rounded-xl"
            />
            {item.caption && <figcaption className="mt-2 text-lg">{item.caption}</figcaption>}
          </figure>
        )}
        renderEditor={(item, close) => <CaptionEditor item={item} close={close} />}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <div className="mt-4">
        <button
          type="button"
          className="btn-secondary"
          disabled={atLimit || adding}
          aria-describedby={`${headingId}-limit`}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus aria-hidden="true" className="size-5" />
          {adding ? t('photos.adding') : t('photos.add')}
        </button>
        <p id={`${headingId}-limit`} className="mt-2 text-sm text-ink-muted">
          {t('photos.limit', { max: MAX_PHOTOS })}
        </p>
        {error && (
          <p role="alert" className="mt-2 font-bold text-warning-ink">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
