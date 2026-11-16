import React from 'react'
import { benzeneVertices } from '@/components/organic'

/** Ring radius in the units of the parent group: the same R as the shared BenzeneRing. */
export const HYBRID_R = 92
/** The inscribed circle of the hybrid: 0.6 of the ring radius, centred, so it clears the six edges. */
export const HYBRID_CIRCLE_R = 0.6 * HYBRID_R

/**
 * Benzene drawn as the hybrid: a flat hexagon of six equal bonds with one circle inside, centred on the origin.
 * The circle sits well inside the edges (0.6 R, against an apothem of 0.87 R), so it reads as a circle of
 * delocalised electrons, not as a second ring.
 */
export function HybridBenzene() {
  const points = benzeneVertices(HYBRID_R)
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
  return (
    <g>
      <polygon points={points} fill="none" stroke="var(--fg)" strokeWidth={3.2} strokeLinejoin="round" />
      <circle r={HYBRID_CIRCLE_R} fill="none" stroke="var(--fg)" strokeWidth={2} />
    </g>
  )
}
