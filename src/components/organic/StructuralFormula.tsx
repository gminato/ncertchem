import React, { forwardRef, useMemo } from 'react'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { freeAngle, type Point } from './layout'
import { completeGrid } from './grid'
import { condensedAtoms, condensedWidth } from './condensed'
import { SkeletalFormula, elementColour } from './SkeletalFormula'
import {
  DEFAULT_SCALE,
  LABEL_GAP,
  bondSegments,
  drawingFrame,
  hydrogensFirst,
  isLabelled,
  labelRuns,
  chargeText,
  lonePairPoint,
  type Bounds,
} from './frame'
import { ease, lerpPoint } from './morph'

export type StructuralMode = 'complete' | 'condensed' | 'bond-line'

/** Pixels per grid cell in the complete formula. */
export const COMPLETE_SCALE = 58

export interface StructuralFormulaProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  graph: MolGraph
  /** Which written form to show when `morph` is not given. Default complete. */
  mode?: StructuralMode
  /**
   * 0 to 1: morphs the complete formula (0) into the bond-line drawing (1). The hydrogens fade
   * and fold into their carbons, and the chain bends into its zig-zag. Overrides `mode`.
   */
  morph?: number
  /** Pixels per bond length in the bond-line drawing. */
  scale?: number
  /** Pixels per grid cell in the complete formula. */
  completeScale?: number
  x?: number
  y?: number
}

const CONDENSED_FONT = 22

/**
 * Bounds that hold for every morph frame: the union of the complete and bond-line drawings,
 * so a parent viewBox does not jump while the morph plays.
 */
export function structuralBounds(graph: MolGraph, scale = DEFAULT_SCALE, completeScale = COMPLETE_SCALE): Bounds {
  const bl = drawingFrame(graph, scale).bounds
  const cp = completeCentred(graph, completeScale)
  const pad = 0.6 * scale
  const xs = [bl.x, bl.x + bl.width, cp.bounds.x, cp.bounds.x + cp.bounds.width]
  const ys = [bl.y, bl.y + bl.height, cp.bounds.y, cp.bounds.y + cp.bounds.height]
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  return { x: x0 - 0.2 * pad, y: y0 - 0.2 * pad, width: x1 - x0 + 0.4 * pad, height: y1 - y0 + 0.4 * pad }
}

/** Bounds of the condensed line of text. */
export function condensedBounds(graph: MolGraph): Bounds {
  const atoms = condensedAtoms(graph)
  const w = atoms.reduce((s, a) => s + condensedWidth(a.text) * CONDENSED_FONT, 0)
  const h = CONDENSED_FONT * 3.4
  return { x: -w / 2 - 12, y: -h / 2, width: w + 24, height: h }
}

interface CompleteCentred {
  /** Centred pixel positions of heavy atoms and hydrogens. */
  heavy: Point[]
  hydrogens: { parent: number; pos: Point }[]
  bounds: Bounds
}

function completeCentred(graph: MolGraph, cs: number): CompleteCentred {
  const grid = completeGrid(graph)
  const all = [...grid.heavy, ...grid.hydrogens.map((h) => h.pos)]
  const minX = Math.min(...all.map((p) => p.x))
  const maxX = Math.max(...all.map((p) => p.x))
  const minY = Math.min(...all.map((p) => p.y))
  const maxY = Math.max(...all.map((p) => p.y))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const to = (p: Point): Point => ({ x: (p.x - cx) * cs, y: -(p.y - cy) * cs })
  const pad = 0.6 * cs
  const width = (maxX - minX) * cs + 2 * pad
  const height = (maxY - minY) * cs + 2 * pad
  return {
    heavy: grid.heavy.map(to),
    hydrogens: grid.hydrogens.map((h) => ({ parent: h.parent, pos: to(h.pos) })),
    bounds: { x: -width / 2, y: -height / 2, width, height },
  }
}

export const StructuralFormula = forwardRef<SVGGElement, StructuralFormulaProps>(function StructuralFormula(
  { graph, mode = 'complete', morph, scale = DEFAULT_SCALE, completeScale = COMPLETE_SCALE, x = 0, y = 0, ...rest },
  ref
) {
  const frame = useMemo(() => drawingFrame(graph, scale), [graph, scale])
  const complete = useMemo(() => completeCentred(graph, completeScale), [graph, completeScale])
  const condensed = useMemo(() => condensedAtoms(graph), [graph])

  const body = (() => {
    if (morph !== undefined) return <Morphed graph={graph} t={morph} frame={frame} complete={complete} scale={scale} completeScale={completeScale} />
    if (mode === 'bond-line') return <SkeletalFormula graph={graph} scale={scale} />
    if (mode === 'condensed') return <CondensedLine atoms={condensed} />
    return <Morphed graph={graph} t={0} frame={frame} complete={complete} scale={scale} completeScale={completeScale} />
  })()

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {body}
    </g>
  )
})

function CondensedLine({ atoms }: { atoms: ReturnType<typeof condensedAtoms> }) {
  const fs = CONDENSED_FONT
  const widths = atoms.map((a) => condensedWidth(a.text) * fs)
  const total = widths.reduce((s, w) => s + w, 0)
  // Estimated centre of each atom's text, used only for the branch labels above and below.
  const centres = widths.map((_, i) => -total / 2 + widths.slice(0, i).reduce((s, w) => s + w, 0) + widths[i] / 2)
  return (
    <g>
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fs}
        fontWeight={500}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
        style={{ userSelect: 'none' }}
      >
        {atoms.map((a) => a.text).join('')}
      </text>
      {atoms.map((a, i) => (
        <g key={a.atom}>
          {a.above.map((s, k) => (
            <text
              key={`up-${k}`}
              x={centres[i]}
              y={-fs * 1.05 - k * fs * 0.8}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.round(fs * 0.8)}
              fontWeight={500}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {s}
            </text>
          ))}
          {a.below.map((s, k) => (
            <text
              key={`dn-${k}`}
              x={centres[i]}
              y={fs * 1.05 + k * fs * 0.8}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.round(fs * 0.8)}
              fontWeight={500}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {s}
            </text>
          ))}
        </g>
      ))}
    </g>
  )
}

interface MorphedProps {
  graph: MolGraph
  t: number
  frame: ReturnType<typeof drawingFrame>
  complete: CompleteCentred
  scale: number
  completeScale: number
}

/**
 * The morphing drawing. At t = 0 it is the complete formula; at t = 1 the bond-line drawing.
 * Two stages: 0 to 0.5, the hydrogens slide into their carbons while still opaque and the carbon
 * letters leave; 0.5 to 1, the chain bends into its zig-zag and the bond-line labels arrive.
 */
function Morphed({ graph, t, frame, complete, scale, completeScale }: MorphedProps) {
  const T = Math.min(1, Math.max(0, t))
  const slide = ease(T / 0.5)
  const bend = ease((T - 0.5) / 0.5)
  const n = graph.atoms.length
  const pos: Point[] = Array.from({ length: n }, (_, a) => lerpPoint(complete.heavy[a], frame.points[a], bend))
  const csShrink = LABEL_GAP * completeScale
  const blShrink = LABEL_GAP * scale
  // Hydrogens stay opaque through the slide and vanish once they reach their carbon.
  const hydrogenOpacity = T < 0.45 ? 1 : 1 - ease((T - 0.45) / 0.05)
  // Carbon letters ghost to half opacity as the hydrogens fold in (0 to 0.5), so the chain still reads
  // as a chain at mid-frame; they leave completely during the bend (0.5 to 1).
  const carbonLetterOpacity = T <= 0.5 ? 1 - 0.5 * slide : 0.5 * (1 - ease((T - 0.5) * 2))
  const carbonShrinkScale = T <= 0.5 ? 1 : 1 - ease((T - 0.5) * 2)
  // Heteroatom letters stay through the slide and cross-fade with their bond-line labels in the bend.
  // The heteroatom letter is gone before its bond-line label starts, so the two never overlap.
  const heteroLetterOpacity = 1 - ease(Math.min(1, Math.max(0, (T - 0.5) / 0.15)))
  const bondLineLabelOpacity = ease(Math.min(1, Math.max(0, (T - 0.65) / 0.2)))
  const fs = Math.round(0.36 * scale)
  const hFs = Math.round(0.34 * scale)
  const lineW = Math.max(1.6, 0.045 * scale)

  // A carbon's bonds keep their clearance while its letter is visible, then lose it as the letter leaves.
  // A heteroatom keeps its letter until the bend, then takes its bond-line label's clearance.
  const shrinkOf = (a: number): number => {
    if (graph.atoms[a].element === 'C') return csShrink * carbonShrinkScale
    return csShrink + (blShrink - csShrink) * bend
  }

  return (
    <g>
      {graph.bonds.map((b, i) => {
        const segs = bondSegments(pos[b.a], pos[b.b], b.order, {
          shrinkA: shrinkOf(b.a),
          shrinkB: shrinkOf(b.b),
          spacing: 0.12 * scale,
        })
        return (
          <g key={`mb-${i}`}>
            {segs.map((s, k) => (
              <line key={k} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--fg)" strokeWidth={lineW} strokeLinecap="round" />
            ))}
          </g>
        )
      })}

      {/* Hydrogens slide into their parent atom, then disappear */}
      {hydrogenOpacity > 0.01 &&
        complete.hydrogens.map((h, k) => {
          const parent = pos[h.parent]
          const at = lerpPoint(h.pos, parent, slide)
          const hasBond = slide < 0.98
          const segs = hasBond ? bondSegments(parent, at, 1, { shrinkA: csShrink, shrinkB: csShrink }) : []
          return (
            <g key={`h-${k}`} opacity={hydrogenOpacity}>
              {segs.map((s, j) => (
                <line key={j} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--fg)" strokeWidth={lineW} strokeLinecap="round" />
              ))}
              <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="central" fontSize={hFs} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
                H
              </text>
            </g>
          )
        })}

      {graph.atoms.map((atom, a) => {
        const p = pos[a]
        const elements: React.ReactNode[] = []
        const isC = atom.element === 'C'
        const lettersOpacity = isC ? carbonLetterOpacity : heteroLetterOpacity
        if (lettersOpacity > 0.01) {
          elements.push(
            <text
              key="c"
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fs}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={atom.element === 'C' ? 'var(--fg)' : elementColour(atom.element)}
              opacity={lettersOpacity}
              style={{ userSelect: 'none' }}
            >
              {atom.element}
            </text>
          )
        }
        if (bondLineLabelOpacity > 0.01 && isLabelled(atom.element)) {
          const h = atom.hCount ?? 0
          elements.push(
            <text
              key="b"
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fs}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={elementColour(atom.element)}
              opacity={bondLineLabelOpacity}
              style={{ userSelect: 'none' }}
            >
              {labelRuns(atom.element, h, hydrogensFirst(frame.points, frame.adj, a)).map((r, k) =>
                r.script === 'sub' ? (
                  <tspan key={k} style={{ baselineShift: 'sub' }} fontSize={Math.round(fs * 0.72)}>
                    {r.text}
                  </tspan>
                ) : (
                  <tspan key={k}>{r.text}</tspan>
                )
              )}
            </text>
          )
        }
        if (atom.charge) {
          const c = lonePairPoint(p, freeAngle(frame.points, frame.adj, a, []), 0.64 * scale)
          elements.push(
            <g key="q">
              <circle cx={c.x} cy={c.y} r={0.17 * scale} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.2} />
              <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                {chargeText(atom.charge)}
              </text>
            </g>
          )
        }
        return <g key={`lab-${a}`}>{elements}</g>
      })}
    </g>
  )
}
