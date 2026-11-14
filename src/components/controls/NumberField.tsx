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
  id,
  disabled = false,
}: NumberFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const format = (v: number) => String(Number(v.toFixed(precision)))

  // The text the Learner is typing. It re-syncs whenever the value changes from outside.
  const [draft, setDraft] = useState(() => format(value))
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(format(value))
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
          onBlur={(event) => commit(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        {unit && <span className={styles.numberUnit}>{unit}</span>}
      </div>
    </div>
  )
}
