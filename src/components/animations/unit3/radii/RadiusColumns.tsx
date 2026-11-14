'use client'

import type { CSSProperties, ReactNode } from 'react'

export interface RadiusColumnsProps {
  /** Number of equal columns, one per circle in the AtomSizeRow above. */
  count: number
  /** Inclusive range of columns to highlight, 0-based. Null highlights none. */
  active: readonly [number, number] | null
  /** Text per column, drawn under the row (for example Z_eff values). */
  footer?: readonly string[]
  footerTitle?: string
  reducedMotion: boolean
  children: ReactNode
}

/**
 * Lays column highlights and an optional footer row over an AtomSizeRow whose slots are
 * equal, so column i of the footer lines up with circle i. Highlights fade with CSS, which
 * is cut when reduced motion is requested.
 */
export function RadiusColumns({ count, active, footer, footerTitle, reducedMotion, children }: RadiusColumnsProps) {
  const span = 100 / count
  const transition = reducedMotion ? 'none' : 'opacity 500ms ease, transform 500ms ease'
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {children}
        {Array.from({ length: count }, (_, i) => {
          const on = active !== null && i >= active[0] && i <= active[1]
          const style: CSSProperties = {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${i * span}%`,
            width: `${span}%`,
            background: 'var(--electron)',
            opacity: on ? 0.1 : 0,
            borderRadius: 8,
            pointerEvents: 'none',
            transition,
          }
          return <div key={i} aria-hidden="true" style={style} />
        })}
      </div>
      {footer && (
        <div
          role="group"
          aria-label={footerTitle}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, marginTop: 6 }}
        >
          {footer.map((text, i) => {
            const on = active !== null && i >= active[0] && i <= active[1]
            return (
              <span
                key={i}
                className="sym"
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: on ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: on ? 700 : 500,
                  transition,
                }}
              >
                {text}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
