import styles from './AccessBadge.module.css'

export interface LockIconProps {
  /** Width and height in pixels. Defaults to 14. */
  size?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

/** Crisp padlock icon used as the Lock indicator for Paid Sections. */
export function LockIcon({ size = 14, className, 'aria-hidden': ariaHidden = true }: LockIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${styles.lock} ${className ?? ''}`.trim()}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
      <rect x="3" y="7" width="10" height="7" rx="1.75" />
    </svg>
  )
}

export interface AccessBadgeProps {
  access: 'free' | 'paid'
  className?: string
}

/** Shows a "Free" badge for a Free Section and a Lock indicator for a Paid Section. */
export function AccessBadge({ access, className }: AccessBadgeProps) {
  if (access === 'free') {
    return (
      <span className={`${styles.free} ${className ?? ''}`.trim()} data-access="free">
        Free
      </span>
    )
  }

  return (
    <span
      className={`${styles.paid} ${className ?? ''}`.trim()}
      data-access="paid"
      role="img"
      aria-label="Paid Section"
      title="Paid Section"
    >
      <LockIcon />
    </span>
  )
}
