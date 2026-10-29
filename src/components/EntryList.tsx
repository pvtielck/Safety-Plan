import { ArrowDown, ArrowUp, Pencil, Trash2, Undo2 } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListItem, ListKey } from '../model/plan'
import { useAppStore } from '../state/AppStore'

type FocusTarget = { id: string; action: 'edit' | 'up' | 'down' } | { id: 'undo'; action: 'undo' }

interface EntryListProps<K extends ListKey> {
  list: K
  items: ListItem<K>[]
  /** Short text naming an item in button labels and announcements. */
  getLabel: (item: ListItem<K>) => string
  renderItem: (item: ListItem<K>) => ReactNode
  /** Inline editor. Call `close(saved)` when done; `saved` is the new label if something changed. */
  renderEditor: (item: ListItem<K>, close: (savedLabel?: string) => void) => ReactNode
  /** Visible heading for the list, e.g. "Your list". */
  heading: string
  /** Sends a message to the section's polite live region. */
  announce: (message: string) => void
}

/**
 * A reorderable list of plan entries. Reordering uses Move up / Move down buttons rather than
 * drag-and-drop, so it works with a keyboard, a switch, or a screen reader, and on small
 * touch screens. Every action moves focus somewhere sensible and is announced politely.
 */
export function EntryList<K extends ListKey>({
  list,
  items,
  getLabel,
  renderItem,
  renderEditor,
  heading,
  announce,
}: EntryListProps<K>) {
  const { t } = useTranslation()
  const { dispatch } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removed, setRemoved] = useState<{ item: ListItem<K>; index: number } | null>(null)
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reordering moves DOM nodes, which drops focus in most browsers. Put it back.
  useLayoutEffect(() => {
    const root = listRef.current
    if (!focusTarget || !root) return
    if (focusTarget.action === 'undo') {
      root.querySelector<HTMLButtonElement>('[data-action="undo"]')?.focus()
    } else {
      const entry = [...root.querySelectorAll<HTMLElement>('[data-entry-id]')].find(
        (element) => element.dataset.entryId === focusTarget.id,
      )
      const button = (action: string) => entry?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
      // If a moved item reached the top or bottom its button is now disabled, so fall back.
      const candidates = [focusTarget.action, focusTarget.action === 'up' ? 'down' : 'up', 'edit']
      candidates.map(button).find((b) => b && !b.disabled)?.focus()
    }
    setFocusTarget(null)
  }, [focusTarget, items])

  const move = (item: ListItem<K>, offset: -1 | 1) => {
    const from = items.findIndex((i) => i.id === item.id)
    const to = from + offset
    if (to < 0 || to >= items.length) return
    dispatch({ type: 'move', list, id: item.id, offset })
    setRemoved(null)
    announce(t('entry.moved', { item: getLabel(item), position: to + 1, total: items.length }))
    setFocusTarget({ id: item.id, action: offset === -1 ? 'up' : 'down' })
  }

  const remove = (item: ListItem<K>, index: number) => {
    dispatch({ type: 'remove', list, id: item.id })
    setRemoved({ item, index })
    announce(t('entry.removed', { item: getLabel(item) }))
    setFocusTarget({ id: 'undo', action: 'undo' })
  }

  const undo = () => {
    if (!removed) return
    dispatch({ type: 'restore', list, item: removed.item, index: removed.index })
    announce(t('entry.restored', { item: getLabel(removed.item) }))
    setFocusTarget({ id: removed.item.id, action: 'edit' })
    setRemoved(null)
  }

  const closeEditor = (id: string) => (savedLabel?: string) => {
    setEditingId(null)
    if (savedLabel) announce(t('entry.updated', { item: savedLabel }))
    setFocusTarget({ id, action: 'edit' })
  }

  return (
    <div ref={listRef}>
      {items.length > 0 && (
        <>
          {heading && <h2 className="mb-3 text-lg font-bold">{heading}</h2>}
          <ol className="space-y-3">
            {items.map((item, index) => {
              const label = getLabel(item)
              return (
                <li key={item.id} data-entry-id={item.id} className="card p-4 sm:p-4">
                  {editingId === item.id ? (
                    renderEditor(item, closeEditor(item.id))
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-ink"
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1 break-words">{renderItem(item)}</div>
                      </div>
                      <div className="-my-1 flex justify-end gap-0.5 self-end sm:self-start">
                        <button
                          type="button"
                          className="icon-btn"
                          data-action="up"
                          disabled={index === 0}
                          onClick={() => move(item, -1)}
                          aria-label={t('entry.moveUpLabel', { item: label })}
                        >
                          <ArrowUp aria-hidden="true" className="size-5" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          data-action="down"
                          disabled={index === items.length - 1}
                          onClick={() => move(item, 1)}
                          aria-label={t('entry.moveDownLabel', { item: label })}
                        >
                          <ArrowDown aria-hidden="true" className="size-5" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          data-action="edit"
                          onClick={() => {
                            setRemoved(null)
                            setEditingId(item.id)
                          }}
                          aria-label={t('entry.editLabel', { item: label })}
                        >
                          <Pencil aria-hidden="true" className="size-5" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          data-action="delete"
                          onClick={() => remove(item, index)}
                          aria-label={t('entry.deleteLabel', { item: label })}
                        >
                          <Trash2 aria-hidden="true" className="size-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}

      {removed && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-muted px-4 py-2">
          <span className="min-w-0 break-words">{t('entry.removed', { item: getLabel(removed.item) })}</span>
          <button type="button" className="btn-quiet min-h-11" data-action="undo" onClick={undo}>
            <Undo2 aria-hidden="true" className="size-5" />
            {t('common.undo')}
          </button>
        </div>
      )}
    </div>
  )
}
