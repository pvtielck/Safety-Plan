import { useId, type ReactNode } from 'react'

interface ChoiceGroupProps<T extends string> {
  legend: ReactNode
  name: string
  value: T
  options: readonly { value: T; label: ReactNode; lang?: string }[]
  onChange: (value: T) => void
  /** Visually hide the legend (it is still read by screen readers). */
  hideLegend?: boolean
}

/** A set of native radio buttons styled as large, easy-to-tap choices. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  hideLegend = false,
}: ChoiceGroupProps<T>) {
  const id = useId()
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'field-label mb-3 text-lg'}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            lang={option.lang}
            className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border-2 border-line-strong bg-surface px-4 py-2 font-bold has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-ink has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name={`${name}-${id}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-5 accent-primary focus-visible:outline-none"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
