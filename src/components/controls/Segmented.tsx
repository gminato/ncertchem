'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './controls.module.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

export interface SegmentedProps<T extends string> {
  /** Accessible name of the group. */
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * A segmented choice of 2 to 4 options. It behaves as a radio group: arrow
 * keys move the selection, and Tab enters and leaves the group.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const select = (index: number) => {
    const next = options[index]
    onChange(next.value)
    buttons.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1
    let target: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      target = index === last ? 0 : index + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      target = index === 0 ? last : index - 1
    } else if (event.key === 'Home') {
      target = 0
    } else if (event.key === 'End') {
      target = last
    }
    if (target !== null) {
      event.preventDefault()
      select(target)
    }
  }

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div role="radiogroup" aria-label={label} className={`${styles.segmented} ${className ?? ''}`}>
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === selectedIndex ? 0 : -1}
            className={styles.segment}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
