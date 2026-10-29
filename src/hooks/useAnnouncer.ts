import { useCallback, useState } from 'react'

/**
 * Message for a polite live region. Repeating the same message (e.g. adding two identical
 * entries) still changes the region's text, so screen readers announce it again.
 */
export function useAnnouncer(): [string, (message: string) => void] {
  const [message, setMessage] = useState('')
  const announce = useCallback(
    (next: string) => setMessage((previous) => (previous === next ? `${next}\u00a0` : next)),
    [],
  )
  return [message, announce]
}
