import type { PinRecord } from '../model/settings'

/**
 * PIN hashing with the browser's built-in Web Crypto API (PBKDF2 + SHA-256, random salt).
 *
 * Be honest about what this is: a 4-digit PIN has only 10,000 possibilities, so anyone with
 * access to the device's storage could try them all. The PIN is a privacy screen against a
 * casual look, not encryption. The plan itself is stored unencrypted. The UI says so.
 */

export const PIN_LENGTH = 4
export const PIN_ITERATIONS = 150_000

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return toBase64(new Uint8Array(bits))
}

export async function hashPin(pin: string, iterations = PIN_ITERATIONS): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new Error(`A PIN must be exactly ${PIN_LENGTH} digits.`)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { hash: await derive(pin, salt, iterations), salt: toBase64(salt), iterations }
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  if (!isValidPin(pin)) return false
  const candidate = await derive(pin, fromBase64(record.salt), record.iterations)
  // Constant-time comparison (not that it matters much at 4 digits, but it costs nothing).
  if (candidate.length !== record.hash.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i)
  return diff === 0
}
