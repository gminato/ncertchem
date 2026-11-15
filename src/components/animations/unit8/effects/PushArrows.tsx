import React from 'react'
import { CurvedArrow, bondAnchor, drawingFrame, freeAngle, lonePairAnchor, type Point } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import type { PushArrow } from '@/lib/chem/resonance-species'

/**
 * Curved arrows drawn over a skeletal drawing of `graph` at `scale`. The overlay goes inside a
 * SkeletalFormula (its `overlay` prop), so the points are in that drawing's own coordinates.
 */
export function PushArrowOverlay({
  graph,
  scale,
  arrows,
}: {
  graph: MolGraph
  scale: number
  arrows: readonly PushArrow[]
}): React.ReactElement {
  const frame = drawingFrame(graph, scale)
  const point = (end: PushArrow['from']): Point => {
    if ('atom' in end) return frame.points[end.atom]
    if ('bond' in end) return bondAnchor(frame.points[end.bond[0]], frame.points[end.bond[1]], end.t ?? 0.5)
    const atom = end.lonePair
    return lonePairAnchor(frame.points[atom], freeAngle(frame.points, frame.adj, atom, []), 0.62 * scale)
  }
  return (
    <g>
      {arrows.map((a, k) => (
        <CurvedArrow key={k} from={point(a.from)} to={point(a.to)} bend={0.45} kind={a.kind ?? 'pair'} gap={4} />
      ))}
    </g>
  )
}
