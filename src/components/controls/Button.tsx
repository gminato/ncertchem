'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import styles from './controls.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

/** A text button. Primary uses the accent; secondary is quiet and outlined. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, type = 'button', ...rest },
  ref
) {
  const variantClass = variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary
  return (
    <button
      ref={ref}
      type={type}
      className={`${styles.button} ${variantClass} ${className ?? ''}`}
      {...rest}
    />
  )
})
