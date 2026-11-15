import React, { forwardRef, useMemo } from 'react'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { freeAngle } from './layout'
import { deltaText } from './delta'
import {
  DEFAULT_SCALE,
  bondSegments,
  chargeText,
  drawingFrame,
  hydrogensFirst,
  isLabelled,
  labelRuns,
  lonePairAngles,
  lonePairCount,
  lonePairPoint,
  along,
  shrinkFor,
  stereoPath,
  type Bounds,
  type Frame,
} from './frame'

export interface SkeletalMark {
  atom: number
  label: string
}

export interface SkeletalFormulaProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  graph: MolGraph
  /** Pixels per bond length. */
  scale?: number
  /** Centre of the drawing in its parent's coordinates. */
  x?: number
  y?: number
  /** Two dots per lone pair on oxygen, nitrogen, sulfur and halogens. */
  showLonePairs?: boolean
  /** Soft wash behind atoms that belong to a group or the parent chain. */
  highlightAtoms?: readonly number[]
  /** Soft wash behind bonds (by index into graph.bonds). */
  highlightBonds?: readonly number[]
  /** Numbers next to atoms, e.g. IUPAC locants. */
  locants?: readonly SkeletalMark[]
  /** Partial-charge labels such as δ+ or δ−, placed away from the bonds. */
  partialCharges?: readonly SkeletalMark[]
  /** Bonds drawn dashed (e.g. the partial bonds of a resonance hybrid). */
  dashedBonds?: readonly number[]
  /** Extra SVG drawn in the same frame, such as curved arrows. */
  overlay?: React.ReactNode
}

/** Bounds of a skeletal drawing, for a parent viewBox. Centred on the origin. */
export function skeletalBounds(graph: MolGraph, scale = DEFAULT_SCALE): Bounds {
  return drawingFrame(graph, scale).bounds
}

/** The frame that a skeletal drawing and any overlay share (pixels, centred on 0,0). */
export function skeletalFrame(graph: MolGraph, scale = DEFAULT_SCALE): Frame {
  return drawingFrame(graph, scale)
}

const ELEMENT_COLOUR: Record<string, string> = {
  O: 'var(--atom-o)',
  N: 'var(--atom-n)',
  S: 'var(--atom-s)',
  P: 'var(--atom-p)',
  F: 'var(--atom-hal)',
  Cl: 'var(--atom-hal)',
  Br: 'var(--atom-hal)',
  I: 'var(--atom-hal)',
}

export function elementColour(element: string): string {
  return ELEMENT_COLOUR[element] ?? 'var(--fg)'
}

export const SkeletalFormula = forwardRef<SVGGElement, SkeletalFormulaProps>(function SkeletalFormula(
  {
    graph,
    scale = DEFAULT_SCALE,
    x = 0,
    y = 0,
    showLonePairs = false,
    highlightAtoms = [],
    highlightBonds = [],
    locants = [],
    partialCharges = [],
    dashedBonds = [],
    overlay,
    ...rest
  },
  ref
) {
  const frame = useMemo(() => drawingFrame(graph, scale), [graph, scale])
  const { points, adj, rings, ringCentres } = frame
  const fs = Math.round(0.36 * scale)
  const bondStroke = Math.max(1.6, 0.045 * scale)
  const spacing = 0.12 * scale
  const hiBonds = new Set(highlightBonds)
  const hiAtoms = new Set(highlightAtoms)
  const dashed = new Set(dashedBonds)

  const bondOrderSum = graph.atoms.map(() => 0)
  for (const b of graph.bonds) {
    bondOrderSum[b.a] += b.order
    bondOrderSum[b.b] += b.order
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Highlights sit underneath everything */}
      {graph.bonds.map((b, i) =>
        hiBonds.has(i) ? (
          <line
            key={`hb-${i}`}
            x1={points[b.a].x}
            y1={points[b.a].y}
            x2={points[b.b].x}
            y2={points[b.b].y}
            stroke="var(--highlight)"
            strokeWidth={0.5 * scale}
            strokeLinecap="round"
          />
        ) : null
      )}
      {graph.atoms.map((_, i) =>
        hiAtoms.has(i) ? (
          <circle key={`ha-${i}`} cx={points[i].x} cy={points[i].y} r={0.32 * scale} fill="var(--highlight)" />
        ) : null
      )}

      {/* Bonds */}
      {graph.bonds.map((b, i) => {
        const p = points[b.a]
        const q = points[b.b]
        const shrinkA = shrinkFor(graph.atoms[b.a].element, scale)
        const shrinkB = shrinkFor(graph.atoms[b.b].element, scale)
        const ring = rings.findIndex((r) => r.includes(b.a) && r.includes(b.b))
        const stroke = dashed.has(i) ? { strokeDasharray: `${0.1 * scale} ${0.09 * scale}` } : {}
        if (b.stereo) {
          const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
          const qs = along(p, q, 1 - shrinkB / len)
          return (
            <path
              key={`b-${i}`}
              d={stereoPath(p, qs, b.stereo, 0.1 * scale)}
              fill={b.stereo === 'wedge' ? 'var(--fg)' : 'none'}
              stroke="var(--fg)"
              strokeWidth={b.stereo === 'wedge' ? 0.8 : bondStroke}
              strokeLinejoin="round"
            />
          )
        }
        const segs = bondSegments(p, q, b.order, {
          shrinkA,
          shrinkB,
          spacing,
          ringCentre: ring >= 0 && b.order === 2 ? ringCentres[ring] : undefined,
        })
        return (
          <g key={`b-${i}`} {...stroke}>
            {segs.map((s, k) => (
              <line
                key={k}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="var(--fg)"
                strokeWidth={bondStroke}
                strokeLinecap="round"
              />
            ))}
          </g>
        )
      })}

      {/* Atom marks: labels, lone pairs, charges, radicals */}
      {graph.atoms.map((atom, i) => {
        const p = points[i]
        const h = atom.hCount ?? 0
        const charge = atom.charge ?? 0
        const radical = atom.radical ?? 0
        const nlp = showLonePairs ? lonePairCount(atom.element, charge, bondOrderSum[i], h, radical) : 0
        const lpAngles = lonePairAngles(points, adj, i, nlp)
        const lpRadius = 0.5 * scale
        const occupied = [...lpAngles]
        const chargeAngle = charge !== 0 ? freeAngle(points, adj, i, occupied) : null
        if (chargeAngle !== null) occupied.push(chargeAngle)
        const radicalAngle = radical > 0 ? freeAngle(points, adj, i, occupied) : null
        const markRadius = 0.64 * scale

        return (
          <g key={`a-${i}`}>
            {isLabelled(atom.element) && (
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fs}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill={elementColour(atom.element)}
                style={{ userSelect: 'none' }}
              >
                {labelRuns(atom.element, h, hydrogensFirst(points, adj, i)).map((r, k) =>
                  r.script === 'sub' ? (
                    <tspan key={k} style={{ baselineShift: 'sub' }} fontSize={Math.round(fs * 0.72)}>
                      {r.text}
                    </tspan>
                  ) : (
                    <tspan key={k}>{r.text}</tspan>
                  )
                )}
              </text>
            )}
            {lpAngles.flatMap((th, k) => {
              const c = lonePairPoint(p, th, lpRadius)
              const perp = th + Math.PI / 2
              const off = 0.1 * scale
              return [-1, 1].map((s) => (
                <circle
                  key={`lp-${k}-${s}`}
                  cx={c.x + Math.cos(perp) * off * s}
                  cy={c.y + Math.sin(perp) * off * s}
                  r={2.8}
                  fill="var(--fg)"
                />
              ))
            })}
            {chargeAngle !== null && (
              <g>
                <circle
                  cx={lonePairPoint(p, chargeAngle, markRadius).x}
                  cy={lonePairPoint(p, chargeAngle, markRadius).y}
                  r={0.17 * scale}
                  fill="var(--surface)"
                  stroke="var(--fg)"
                  strokeWidth={1.2}
                />
                <text
                  x={lonePairPoint(p, chargeAngle, markRadius).x}
                  y={lonePairPoint(p, chargeAngle, markRadius).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={15}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg)"
                >
                  {chargeText(charge)}
                </text>
              </g>
            )}
            {radicalAngle !== null && (
              <circle
                cx={lonePairPoint(p, radicalAngle, markRadius).x}
                cy={lonePairPoint(p, radicalAngle, markRadius).y}
                r={3.6}
                fill="var(--fg)"
              />
            )}
          </g>
        )
      })}

      {/* Locants and partial charges, each on a free side of its atom */}
      {locants.map((m, k) => {
        const extra: number[] = []
        const th = freeAngle(points, adj, m.atom, extra)
        const c = lonePairPoint(points[m.atom], th, 0.66 * scale)
        return (
          <text
            key={`loc-${k}`}
            x={c.x}
            y={c.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--locant)"
            style={{ userSelect: 'none' }}
          >
            {m.label}
          </text>
        )
      })}
      {partialCharges.map((m, k) => {
        const th = freeAngle(points, adj, m.atom, [])
        const c = lonePairPoint(points[m.atom], th, 0.74 * scale)
        const pos = m.label.includes('+')
        return (
          <text
            key={`dp-${k}`}
            x={c.x}
            y={c.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill={pos ? 'var(--delta-plus)' : 'var(--delta-minus)'}
            style={{ userSelect: 'none' }}
          >
            {deltaText(m.label)}
          </text>
        )
      })}

      {overlay}
    </g>
  )
})
