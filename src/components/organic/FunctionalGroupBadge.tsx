import React, { forwardRef } from 'react'
import { condensedWidth } from './condensed'

export interface FunctionalGroupBadgeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Text on the chip, e.g. "–OH  alcohol". */
  label: string
  /** Centre of the chip, in the parent's coordinates. */
  x: number
  y: number
  /** The atom the chip marks. A leader line joins the chip to it when given. */
  anchor?: { x: number; y: number }
  /** Chip tone: the accent (default) or the highlight wash. */
  tone?: 'accent' | 'highlight'
}

const FONT = 15

/** Small label chip that names a functional group on a structure, with a leader to its atom. */
export const FunctionalGroupBadge = forwardRef<SVGGElement, FunctionalGroupBadgeProps>(function FunctionalGroupBadge(
  { label, x, y, anchor, tone = 'accent', ...rest },
  ref
) {
  const w = Math.max(40, condensedWidth(label) * FONT + 22)
  const h = 26
  const stroke = tone === 'accent' ? 'var(--accent)' : 'var(--ox)'
  const ink = tone === 'accent' ? 'var(--accent)' : 'var(--fg)'
  return (
    <g ref={ref} {...rest}>
      {anchor && (
        <line
          // The leader starts clear of the atom's letter, so it never strikes through it.
          x1={Math.abs(anchor.x - x) > Math.abs(anchor.y - y) ? anchor.x + Math.sign(x - anchor.x) * 16 : anchor.x}
          y1={Math.abs(anchor.x - x) > Math.abs(anchor.y - y) ? anchor.y : anchor.y + Math.sign(y - anchor.y) * 14}
          x2={Math.abs(anchor.x - x) > Math.abs(anchor.y - y) ? (anchor.x < x ? x - w / 2 : x + w / 2) : x}
          y2={Math.abs(anchor.x - x) > Math.abs(anchor.y - y) ? y : y + (anchor.y < y ? -h / 2 : h / 2)}
          stroke={stroke}
          strokeWidth={1.4}
          strokeDasharray="3 3"
          opacity={0.8}
        />
      )}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={6}
        fill="var(--surface)"
        stroke={stroke}
        strokeWidth={1.4}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={FONT}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={ink}
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
})
