import React, { forwardRef } from 'react'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { DEFAULT_SCALE, drawingFrame, type Bounds } from './frame'
import { SkeletalFormula, skeletalBounds } from './SkeletalFormula'
import { ResonanceSet, resonanceBounds, type ResonanceContributor } from './ResonanceSet'
import { arenium, type Electrophile } from './hydrocarbon-fixture'
import type { Point } from './layout'

/** Default bond length in px for the arenium drawings. */
export const ARENIUM_SCALE = 44

/** Points of the dashed horseshoe that shows the delocalised + charge: ring positions 1 to 5, through the side away from position 0. */
export function horseshoePoints(points: readonly Point[], centre: Point, steps = 48): Point[] {
  const ang = (p: Point) => Math.atan2(p.y - centre.y, p.x - centre.x)
  const R = Math.hypot(points[0].x - centre.x, points[0].y - centre.y)
  const r = R * 0.6
  const a1 = ang(points[1])
  const a5 = ang(points[5])
  const a0 = ang(points[0])
  const wrap = (t: number) => Math.atan2(Math.sin(t), Math.cos(t))
  // The arc from a1 to a5 that does not pass position 0.
  let delta = wrap(a5 - a1)
  const offset = wrap(a0 - a1)
  const inside = (d: number) => (d >= 0 ? offset > 0 && offset < d : offset < 0 && offset > d)
  if (inside(delta)) delta = delta > 0 ? delta - 2 * Math.PI : delta + 2 * Math.PI
  const out: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a1 + (delta * i) / steps
    out.push({ x: centre.x + r * Math.cos(t), y: centre.y + r * Math.sin(t) })
  }
  return out
}

/**
 * Where things sit on the σ-complex, in the same frame as its skeletal drawing: the H on the
 * sp³ carbon (position 0), the midpoint of the bond from it into the ring, and a point a step
 * further out where a base can sit.
 */
export function areniumAnchors(graph: MolGraph, scale = ARENIUM_SCALE) {
  const frame = drawingFrame(graph, scale)
  const p0 = frame.points[0]
  const nbrs = frame.adj[0]
  const centre = frame.ringCentres[0]
  // The sp³ carbon's H points outward from the ring, turned away from the bonds it already has.
  const angleOf = (q: { x: number; y: number }) => Math.atan2(q.y - p0.y, q.x - p0.x)
  const taken = nbrs.map((q) => angleOf(frame.points[q]))
  const outward = Math.atan2(p0.y - centre.y, p0.x - centre.x)
  const wrap = (t: number) => Math.atan2(Math.sin(t), Math.cos(t))
  let best = outward
  let bestScore = -Infinity
  for (let k = 0; k < 360; k += 2) {
    const th = (k * Math.PI) / 180
    const sep = Math.min(...taken.map((t) => Math.abs(wrap(th - t))))
    const score = sep - 0.5 * Math.abs(wrap(th - outward))
    if (score > bestScore) {
      bestScore = score
      best = th
    }
  }
  const dir = { x: Math.cos(best), y: Math.sin(best) }
  const H = { x: p0.x + dir.x * scale * 0.95, y: p0.y + dir.y * scale * 0.95 }
  const p1 = frame.points[1]
  return {
    C0: p0,
    H,
    dir,
    bond01: { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
    base: { x: p0.x + dir.x * scale * 2.2, y: p0.y + dir.y * scale * 2.2 },
    frame,
  }
}

export interface AreniumIonProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The group that replaces H on the sp³ carbon. */
  electrophile?: Electrophile
  /** Shows the three resonance contributors (the charge on positions 2, 4 and 6 in turn) instead of the hybrid. */
  contributors?: boolean
  scale?: number
  x?: number
  y?: number
}

/** The bounds of an arenium drawing, for a parent viewBox. */
export function areniumBounds(electrophile: Electrophile, contributors = false, scale = ARENIUM_SCALE): Bounds {
  if (contributors) return resonanceBounds(areniumContributors(electrophile), undefined, scale, 70)
  const b = skeletalBounds(arenium(electrophile), scale)
  return { x: b.x - 24, y: b.y - 20, width: b.width + 48, height: b.height + 40 }
}

/** The three Kekulé contributors of the σ-complex: the cation on position 2, 4 or 6 (atoms 1, 3, 5). */
export function areniumContributors(electrophile: Electrophile): ResonanceContributor[] {
  return [{ graph: arenium(electrophile, 1) }, { graph: arenium(electrophile, 3) }, { graph: arenium(electrophile, 5) }]
}

/**
 * The σ-complex (arenium ion) of electrophilic substitution: the sp³ carbon carrying H and the
 * electrophile, with the positive charge spread over the other five ring carbons, drawn as a
 * dashed horseshoe with a +. The contributors view shows the three Kekulé forms with ResonanceSet.
 */
export const AreniumIon = forwardRef<SVGGElement, AreniumIonProps>(function AreniumIon(
  { electrophile = 'NO2', contributors = false, scale = ARENIUM_SCALE, x = 0, y = 0, ...rest },
  ref
) {
  if (contributors) {
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <ResonanceSet contributors={areniumContributors(electrophile)} scale={scale} arrowGap={70} />
      </g>
    )
  }
  const graph = arenium(electrophile)
  const a = areniumAnchors(graph, scale)
  const centre = a.frame.ringCentres[0]
  const arc = horseshoePoints(a.frame.points, centre)
  const overlay = (
    <g>
      <path d={`M${arc.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')}`} fill="none" stroke="var(--delta-plus)" strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" />
      {/* The + sits in the middle of the ring, where the delocalised charge is shared */}
      <text x={centre.x} y={centre.y} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        +
      </text>
      <text x={a.H.x} y={a.H.y} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
        H
      </text>
    </g>
  )
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <SkeletalFormula graph={graph} scale={scale} overlay={overlay} />
    </g>
  )
})
