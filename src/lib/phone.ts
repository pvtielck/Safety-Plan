/**
 * Builds tel: and sms: links from phone numbers as people type them
 * ("(323) 555-0100", "+52 55 1234 5678", "988").
 */

/** Keeps digits and a leading "+". Returns "" if there's nothing dialable. */
export function dialable(phone: string): string {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 3) return ''
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

export function telHref(phone: string): string | null {
  const number = dialable(phone)
  return number ? `tel:${number}` : null
}

/**
 * `sms:` link, optionally with a pre-filled message. The `?&body=` form is the one that works
 * on both iOS and Android.
 */
export function smsHref(phone: string, body?: string): string | null {
  const number = dialable(phone)
  if (!number) return null
  return body ? `sms:${number}?&body=${encodeURIComponent(body)}` : `sms:${number}`
}
