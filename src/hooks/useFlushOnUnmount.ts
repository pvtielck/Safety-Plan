import { useEffect, useRef } from 'react'

/**
 * Runs the latest `flush` when the component unmounts. Used for autosave: text typed into an
 * "add" or "edit" field is kept even if the person navigates away without pressing Save.
 * `flush` must be a no-op when there's nothing to save.
 */
export function useFlushOnUnmount(flush: () => void) {
  const latest = useRef(flush)
  useEffect(() => {
    latest.current = flush
  })
  useEffect(() => () => latest.current(), [])
}
