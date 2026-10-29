import { PIN_LENGTH } from '../lib/pin'

/** A masked numeric field for a 4-digit PIN. */
export function PinField({
  id,
  label,
  value,
  onChange,
  describedBy,
  autoFocus,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  describedBy?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={PIN_LENGTH}
        autoComplete="off"
        value={value}
        // Keep digits only, so a stray space or letter can't create an impossible PIN.
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        className="field max-w-48 text-2xl tracking-[0.4em]"
      />
    </div>
  )
}
