import React, { forwardRef, useMemo } from 'react'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { freeAngle, type Point } from './layout'
import { DEFAULT_SCALE, drawingFrame, type Bounds } from './frame'
import { SkeletalFormula, type SkeletalMark } from './SkeletalFormula'
import { CurvedArrow } from './CurvedArrow'
import { bondAnchor, lonePairAnchor, type ArrowKind } from './arrows'

/** Where an arrow starts or ends on a drawn contributor. */
export type ArrowAnchor = { atom: number } | { bond: [number, number]; t?: number } | { lonePair: number }

export interface ResonanceArrowSpec {
  from: ArrowAnchor
  to: ArrowAnchor
  bend?: number
  kind?: ArrowKind
}

export interface ResonanceContributor {
  graph: MolGraph
  arrows?: readonly ResonanceArrowSpec[]
}

export interface ResonanceHybrid {
  graph: MolGraph
  /** Bonds of order 1.5: a solid line plus a dashed parallel line. */
  partialBonds?: readonly number[]
  /** Inscribed circle in each ring (benzene). */
  innerCircles?: boolean
  /** Partial charges such as δ− on the atoms that share the charge. */
  partialCharges?: readonly SkeletalMark[]
}

export interface ResonanceSetProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Two to four contributors, joined by the double-headed resonance arrow. */
  contributors: readonly ResonanceContributor[]
  /** Optional resonance hybrid, drawn below the row with dashed partial bonds. */
  hybrid?: ResonanceHybrid
  scale?: number
  /** Room between contributors for the resonance arrow, in pixels. */
  arrowGap?: number
  x?: number
  y?: number
}

const HYBRID_DROP = 34

function anchorPoint(points: readonly Point[], adj: readonly number[][], a: ArrowAnchor, scale: number): Point {
  if ('atom' in a) return points[a.atom]
  if ('bond' in a) return bondAnchor(points[a.bond[0]], points[a.bond[1]], a.t ?? 0.5)
  const atom = a.lonePair
  return lonePairAnchor(points[atom], freeAngle(points, adj, atom, []), 0.62 * scale)
}

/** Bounds of a resonance set for a parent viewBox, centred on the origin. */
export function resonanceBounds(
  contributors: readonly ResonanceContributor[],
  hybrid: ResonanceHybrid | undefined,
  scale = DEFAULT_SCALE,
  arrowGap = 84
): Bounds {
  const frames = contributors.map((c) => drawingFrame(c.graph, scale).bounds)
  const rowW = frames.reduce((s, f) => s + f.width, 0) + arrowGap * (frames.length - 1)
  const rowH = Math.max(...frames.map((f) => f.height))
  const top = -rowH / 2
  let bottom = rowH / 2
  let width = rowW
  if (hybrid) {
    const hb = drawingFrame(hybrid.graph, scale).bounds
    bottom = rowH / 2 + HYBRID_DROP + hb.height + 26
    width = Math.max(rowW, hb.width)
  }
  return { x: -width / 2, y: top, width, height: bottom - top }
}

export const ResonanceSet = forwardRef<SVGGElement, ResonanceSetProps>(function ResonanceSet(
  { contributors, hybrid, scale = DEFAULT_SCALE, arrowGap = 84, x = 0, y = 0, ...rest },
  ref
) {
  const layouts = useMemo(
    () =>
      contributors.map((c) => {
        const f = drawingFrame(c.graph, scale)
        return { frame: f, width: f.bounds.width, height: f.bounds.height }
      }),
    [contributors, scale]
  )
  const rowW = layouts.reduce((s, l) => s + l.width, 0) + arrowGap * (layouts.length - 1)
  const rowH = Math.max(...layouts.map((l) => l.height))
  const hybridFrame = useMemo(() => (hybrid ? drawingFrame(hybrid.graph, scale) : null), [hybrid, scale])
  const hybridY = rowH / 2 + HYBRID_DROP + (hybridFrame ? hybridFrame.bounds.height / 2 : 0)

  // Centre of each contributor, along the row.
  let cursor = -rowW / 2
  const centres = layouts.map((l) => {
    const cx = cursor + l.width / 2
    cursor += l.width + arrowGap
    return cx
  })

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {contributors.map((c, i) => {
        const f = layouts[i].frame
        const cx = centres[i]
        const arrows = c.arrows ?? []
        return (
          <g key={`c-${i}`}>
            <SkeletalFormula
              graph={c.graph}
              scale={scale}
              x={cx}
              y={0}
              showLonePairs
              overlay={
                arrows.length > 0 ? (
                  <g>
                    {arrows.map((a, k) => {
                      const s = anchorPoint(f.points, f.adj, a.from, scale)
                      const e = anchorPoint(f.points, f.adj, a.to, scale)
                      return (
                        <CurvedArrow
                          key={k}
                          from={s}
                          to={e}
                          bend={a.bend ?? 0.4}
                          kind={a.kind ?? 'pair'}
                          gap={4}
                        />
                      )
                    })}
                  </g>
                ) : undefined
              }
            />
          </g>
        )
      })}

      {/* Resonance arrows between neighbouring contributors */}
      {centres.slice(0, -1).map((c, i) => {
        const left = c + layouts[i].width / 2
        const right = centres[i + 1] - layouts[i + 1].width / 2
        const mx = (left + right) / 2
        const half = (right - left) * 0.3
        return (
          <g key={`ra-${i}`} stroke="var(--fg-muted)" fill="var(--fg-muted)" strokeWidth={2}>
            <line x1={mx - half} y1={0} x2={mx + half} y2={0} strokeLinecap="round" />
            <polygon points={`${mx - half - 3},0 ${mx - half + 9},-6 ${mx - half + 9},6`} stroke="none" />
            <polygon points={`${mx + half + 3},0 ${mx + half - 9},-6 ${mx + half - 9},6`} stroke="none" />
          </g>
        )
      })}

      {hybrid && hybridFrame && (
        <g transform={`translate(0, ${hybridY})`}>
          <SkeletalFormula
            graph={hybrid.graph}
            scale={scale}
            partialBonds={hybrid.partialBonds}
            innerCircles={hybrid.innerCircles}
            partialCharges={hybrid.partialCharges}
          />
          <text
            x={0}
            y={hybridFrame.bounds.height / 2 + 4}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize={14}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            Resonance hybrid
          </text>
        </g>
      )}
    </g>
  )
})
