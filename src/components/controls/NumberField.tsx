'use client'

import { useId, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import styles from './controls.module.css'

export interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number | 'any'
  /** Unit suffix shown inside the field, e.g. "M" or "g mol⁻¹". */
  unit?: string
  /** Decimal places used when the field is tidied on blur. */
  precision?: number
  /**
   * Text shown while the field is not being edited, e.g. "2.000" or "1.204".
   * The numeric `value` is still what the field reports and clamps. While the
   * Learner types, the typed text is kept, so a formatted display never
   * interrupts typing.
   */
  displayValue?: string
  /** Called with the raw text on every keystroke, before any parsing or clamping. */
  onRawChange?: (raw: string) => void
  id?: string
  disabled?: boolean
}

function clampTo(value: number, min?: number, max?: number): number {
  let next = value
  if (min !== undefined) next = Math.max(min, next)
  if (max !== undefined) next = Math.min(max, next)
  return next
}

/**
 * A labelled number input with a unit suffix. Typing commits valid numbers as
 * they arrive. Blur or Enter tidies the text and clamps it to min and max.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 'any',
  unit,
  precision = 3,
  displayValue,
  onRawChange,
  id,
  disabled = false,
}: NumberFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const format = (v: number) => String(Number(v.toFixed(precision)))
  const shown = displayValue ?? format(value)

  // The text the Learner is typing. A change of `value` from outside always
  // re-syncs it. A change of the display text re-syncs it only while the field
  // is not focused, so a formatted display never breaks typing.
  const [draft, setDraft] = useState(shown)
  const [lastValue, setLastValue] = useState(value)
  const [lastShown, setLastShown] = useState(shown)
  const [focused, setFocused] = useState(false)
  if (value !== lastValue) {
    setLastValue(value)
    setLastShown(shown)
    setDraft(shown)
  } else if (!focused && shown !== lastShown) {
    setLastShown(shown)
    setDraft(shown)
  }

  const commit = (text: string) => {
    const parsed = Number(text)
    if (text.trim() === '' || Number.isNaN(parsed)) {
      setDraft(format(value))
      return
    }
    const next = clampTo(parsed, min, max)
    setDraft(format(next))
    setLastValue(next)
    if (next !== value) onChange(next)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value
    setDraft(text)
    onRawChange?.(text)
    const parsed = Number(text)
    if (text.trim() !== '' && !Number.isNaN(parsed)) {
      const next = clampTo(parsed, min, max)
      if (next !== value) {
        setLastValue(next)
        onChange(next)
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit(event.currentTarget.value)
  }

  return (
    <div className={styles.numberField}>
      <label htmlFor={inputId} className={styles.fieldLabel}>
        {label}
      </label>
      <div className={styles.numberRow}>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          className={styles.numberInput}
          value={draft}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false)
            // Forces the next render to show the formatted text again.
            setLastShown('')
            commit(event.currentTarget.value)
          }}
          onKeyDown={handleKeyDown}
        />
        {unit && <span className={styles.numberUnit}>{unit}</span>}
      </div>
    </div>
  )
}
