import React, { forwardRef, useId, type ReactNode } from 'react'
import type { Point } from './geometry'

export interface BatteryCutawayProps extends React.SVGAttributes<SVGGElement> {
  /** Top-left corner of the case. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** `can` is a cylindrical cell with elliptical caps. `case` is a rectangular case. */
  shape?: 'can' | 'case'
  /** Internals drawn in parent coordinates. They are clipped to the cut-open interior. */
  children?: ReactNode
  /** Show the cap terminals. */
  terminals?: boolean
}

/** Positions of the + and − cap terminals for a case placed at (x, y). */
export function batteryTerminals(x: number, y: number, width: number): { plus: Point; minus: Point } {
  return { plus: { x: x + width * 0.3, y: y - 12 }, minus: { x: x + width * 0.7, y: y - 12 } }
}

/**
 * A cut-away battery body. The case is drawn as a shell with its interior open,
 * and `children` (the electrodes, paste and separator) are drawn inside it. The
 * component adds no chemistry of its own; the Section decides what goes inside.
 */
export const BatteryCutaway = forwardRef<SVGGElement, BatteryCutawayProps>(function BatteryCutaway(
  { x = 0, y = 0, width = 180, height = 220, shape = 'can', children, terminals = true, className, ...rest },
  ref
) {
  const clipId = `battery-cut-${useId().replace(/:/g, '')}`
  const inset = 8
  const cap = shape === 'can' ? width * 0.12 : 0
  const innerX = x + inset
  const innerY = y + inset + cap
  const innerW = width - inset * 2
  const innerH = height - inset * 2 - cap * 2
  const body =
    shape === 'can'
      ? `M${x} ${y + cap} A${width / 2} ${cap} 0 0 1 ${x + width} ${y + cap} V${y + height - cap} A${width / 2} ${cap} 0 0 1 ${x} ${y + height - cap} Z`
      : null
  const t = terminals ? batteryTerminals(x, y, width) : null

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <defs>
        <clipPath id={clipId}>
          <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={shape === 'can' ? 0 : 4} />
        </clipPath>
      </defs>
      {t && (
        <g>
          <circle cx={t.plus.x} cy={t.plus.y} r={6} fill="var(--proton)" stroke="var(--glass-wall)" strokeWidth={1.2} />
          <circle cx={t.minus.x} cy={t.minus.y} r={6} fill="var(--fg)" stroke="var(--glass-wall)" strokeWidth={1.2} />
        </g>
      )}
      {/* Shell: the cut-open case, with the interior showing */}
      {body ? (
        <path d={body} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
      ) : (
        <rect x={x} y={y} width={width} height={height} rx={10} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
      )}
      <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={shape === 'can' ? 0 : 4} fill="var(--surface)" fillOpacity={0.55} />
      <g clipPath={`url(#${clipId})`}>{children}</g>
      <rect
        x={innerX}
        y={innerY}
        width={innerW}
        height={innerH}
        rx={shape === 'can' ? 0 : 4}
        fill="none"
        stroke="var(--glass-wall)"
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
    </g>
  )
})
