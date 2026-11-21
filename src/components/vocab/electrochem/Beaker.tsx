import React, { forwardRef } from 'react'
import { clamp01 } from './geometry'
import { SOLUTION_FILL, type SolutionTint } from './materials'

export interface BeakerProps extends React.SVGAttributes<SVGGElement> {
  /** Top-left corner of the beaker's outer glass, in the parent's coordinates. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Liquid level from 0 (empty) to 1 (near the rim). Clamped. */
  level?: number
  tint?: SolutionTint
  /** Optional caption set below the beaker. Pass it already formatted, e.g. "ZnSO₄(aq)". */
  label?: string
}

const WALL = 4
const HEADROOM = 12
const RADIUS = 12

/** Where the parts of a beaker sit, so a parent can place electrodes and bridges against it. */
export function beakerGeometry(props: Pick<BeakerProps, 'x' | 'y' | 'width' | 'height' | 'level'>) {
  const { x = 0, y = 0, width = 150, height = 180, level = 0.7 } = props
  const bottom = y + height
  const innerTop = y + HEADROOM
  const innerBottom = bottom - WALL
  const liquidTop = innerBottom - clamp01(level) * (innerBottom - innerTop)
  return {
    left: x,
    right: x + width,
    centreX: x + width / 2,
    rimY: y,
    bottomY: bottom,
    liquidTop,
    innerLeft: x + WALL,
    innerRight: x + width - WALL,
    innerBottom,
  }
}

/**
 * A glass beaker with a liquid fill, a meniscus and a glass highlight. The
 * (x, y) origin is the top-left of the outer glass. It has no animation of its own.
 */
export const Beaker = forwardRef<SVGGElement, BeakerProps>(function Beaker(
  { x = 0, y = 0, width = 150, height = 180, level = 0.7, tint = 'clear', label, className, ...rest },
  ref
) {
  const g = beakerGeometry({ x, y, width, height, level })
  const liquidColour = SOLUTION_FILL[tint]
  const hasLiquid = clamp01(level) > 0
  const r = RADIUS
  const left = g.left
  const right = g.right
  const bottom = g.bottomY
  // Glass outline: straight walls with a rounded base.
  const glass = `M${left} ${g.rimY} V${bottom - r} Q${left} ${bottom} ${left + r} ${bottom} H${right - r} Q${right} ${bottom} ${right} ${bottom - r} V${g.rimY}`
  const lt = g.liquidTop
  const lx1 = g.innerLeft
  const lx2 = g.innerRight
  const lb = g.innerBottom
  const liquid = `M${lx1} ${lt} H${lx2} V${lb - (r - WALL)} Q${lx2} ${lb} ${lx2 - (r - WALL)} ${lb} H${lx1 + (r - WALL)} Q${lx1} ${lb} ${lx1} ${lb - (r - WALL)} Z`

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      {hasLiquid && (
        <path
          d={liquid}
          fill={liquidColour ?? 'var(--liquid)'}
          fillOpacity={liquidColour ? 0.42 : 1}
        />
      )}
      {/* Back wall of the glass, so the liquid reads as inside it */}
      <path d={glass} fill="var(--glass-fill)" fillOpacity={0.18} />
      {hasLiquid && (
        <path
          d={`M${lx1 + 2} ${lt} H${lx2 - 2}`}
          stroke="var(--liquid-edge)"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      )}
      <path d={glass} fill="none" stroke="var(--glass-wall)" strokeWidth={2} strokeLinejoin="round" />
      {/* Rim line, with a small spout on the right */}
      <path
        d={`M${left - 1} ${g.rimY} H${right + 1} M${right} ${g.rimY} L${right + 7} ${g.rimY - 5}`}
        stroke="var(--glass-wall)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${left + 7} ${g.rimY + 14} V${bottom - 26}`}
        stroke="var(--glass-sheen)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {label && (
        <text
          x={g.centreX}
          y={bottom + 24}
          textAnchor="middle"
          fontSize={15}
          fill="var(--fg-muted)"
        >
          {label}
        </text>
      )}
    </g>
  )
})
