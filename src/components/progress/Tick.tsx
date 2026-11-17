export interface TickProps {
  /** Width and height, in CSS pixels. */
  size?: number
  className?: string
}

/**
 * The tick that marks a Complete Section, the same wherever Progress is shown. It is decorative,
 * so always put the words "Section complete" beside it, visible or for screen readers only.
 */
export function Tick({ size = 20, className }: TickProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-progress-tick=""
    >
      <circle cx="10" cy="10" r="10" fill="var(--success)" />
      <path
        d="M5.6 10.4l2.9 2.9 5.9-6.2"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
