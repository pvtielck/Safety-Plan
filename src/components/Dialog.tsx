import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Extra classes for the title, e.g. to tint it. */
  titleClassName?: string
  /** Applied to the <dialog>, e.g. to identify it in tests. */
  'data-testid'?: string
}

/**
 * A modal built on the native <dialog> element, which gives us focus trapping, Escape to
 * close, an inert background, and correct screen reader semantics for free.
 */
export function Dialog({ open, onClose, title, children, titleClassName = '', ...rest }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { t } = useTranslation()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Native <dialog> focuses the first focusable element (the close button). Content can
      // mark a better starting point, such as "Call 988", with data-autofocus.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // The backdrop click is a mouse convenience; keyboard users close with Escape or the button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // Clicking the dimmed backdrop (the <dialog> itself, outside the content) closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
      data-testid={rest['data-testid']}
    >
      {open && (
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={titleId} className={`pt-2 text-2xl font-bold leading-snug ${titleClassName}`}>
              {title}
            </h2>
            <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label={t('common.close')}>
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
