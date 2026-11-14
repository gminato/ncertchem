'use client'

import { useId, type CSSProperties } from 'react'
import styles from './controls.module.css'

export interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Unit shown after the readout, e.g. "K" or "nm". */
  unit?: string
  /** Formats the readout. Defaults to the step's decimal places. */
  format?: (value: number) => string
  id?: string
  disabled?: boolean
}

function decimalPlaces(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/**
 * A labelled range slider with a live readout. The native range input gives
 * arrow, Page Up/Down and Home/End keys for free.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  format,
  id,
  disabled = false,
}: SliderProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const span = max - min
  const pct = span === 0 ? 0 : ((value - min) / span) * 100
  const text = format
    ? format(value)
    : `${value.toFixed(decimalPlaces(step))}${unit ? ` ${unit}` : ''}`

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label htmlFor={inputId} className={styles.fieldLabel}>
          {label}
        </label>
        <output htmlFor={inputId} className={styles.readout}>
          {text}
        </output>
      </div>
      <input
        id={inputId}
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
