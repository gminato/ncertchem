import React, { forwardRef } from 'react'
import type { Point } from './layout'
import {
  arrowHeadPoints,
  arrowShaftPath,
  curvedArrowGeometry,
  type ArrowKind,
} from './arrows'

export interface CurvedArrowProps extends Omit<React.SVGAttributes<SVGGElement>, 'children' | 'from' | 'to'> {
  /** Start of the arrow, in the parent's coordinates (e.g. a bond midpoint). */
  from: Point
  /** End of the arrow: where the electrons go (an atom, a bond midpoint or a free site). */
  to: Point
  /** Curvature as a fraction of the chord. Positive bends left of the direction of travel. Default 0.35. */
  bend?: number
  /** `pair` (full head, two electrons) or `radical` (half head, one electron). */
  kind?: ArrowKind
  /** 0 to 1: how much of the arrow is drawn in. The head appears at the end. */
  progress?: number
  /** Pixels cut from each end. */
  gap?: number
  headSize?: number
  strokeWidth?: number
}

/** Curved electron-movement arrow in --e-arrow. Drawn in with `progress`. */
export const CurvedArrow = forwardRef<SVGGElement, CurvedArrowProps>(function CurvedArrow(
  { from, to, bend = 0.35, kind = 'pair', progress = 1, gap = 4, headSize = 12, strokeWidth = 2.4, ...rest },
  ref
) {
  const geo = curvedArrowGeometry(from, to, { bend, kind, gap, headSize })
  const p = Math.min(1, Math.max(0, progress))
  const headOpacity = Math.min(1, Math.max(0, (p - 0.9) / 0.1))
  return (
    <g ref={ref} {...rest}>
      <path
        d={arrowShaftPath(geo)}
        pathLength={1}
        fill="none"
        stroke="var(--e-arrow)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
      <polygon
        points={arrowHeadPoints(geo)}
        fill="var(--e-arrow)"
        stroke="var(--e-arrow)"
        strokeWidth={0.8}
        strokeLinejoin="round"
        opacity={headOpacity}
      />
    </g>
  )
})
