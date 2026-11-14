'use client'

import { useId } from 'react'
import styles from './controls.module.css'

export interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/** An on/off switch with a visible label, exposed as role="switch". */
export function Toggle({ label, checked, onChange, disabled = false, className }: ToggleProps) {
  const id = useId()
  return (
    <div className={`${styles.toggleRow} ${className ?? ''}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={styles.toggle}
        onClick={() => onChange(!checked)}
      />
      <label htmlFor={id} className={styles.toggleLabel}>
        {label}
      </label>
    </div>
  )
}
