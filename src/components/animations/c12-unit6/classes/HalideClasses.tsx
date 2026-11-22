'use client'

import { SkeletalFormula, along, boundingBox, drawingFrame, freeAngle, layout2D, shrinkFor, type Frame } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { describeStep, clampStep, FRAME_ATTACH, FRAME_SMILES } from './halide-classes-steps'

export interface HalideClassesProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  /** Each Step is a cut to its target state, so there is no tween to switch off. */
  reducedMotion: boolean
}

const W = 580
const H = 400

/** A drawing fills at most this share of its column (the visual bar: 60 to 75 %). */
const FILL = 0.66
/** Atom labels are 0.36 × scale: 40 gives 14-unit labels, which render at 13 px or more in a 3-column panel (R4). */
const MIN_SCALE = 40
const MAX_SCALE = 96
/** Highlight wash radius in scale units: small, so it sits under the carbon and not over a C=C stroke (A3). */
const WASH = 0.24

const FRAME = parseSmiles(FRAME_SMILES)

const LAYOUT = {
  1: { cy: 150, maxH: 230, nameY: 300, classY: 328, formulaY: 354, font: 16, formulaFont: 15 },
  2: { cy: 112, maxH: 196, nameY: 236, classY: 262, formulaY: 288, font: 15, formulaFont: 14 },
  3: { cy: 112, maxH: 196, nameY: 236, classY: 262, formulaY: 288, font: 14, formulaFont: 14 },
} as const

/** The scale at which this molecule's skeleton fills its column, kept between the label floor and the cap. */
function fitScale(graph: MolGraph, colW: number, maxH: number): number {
  const box = boundingBox(layout2D(graph))
  const fit = Math.min(MAX_SCALE, (FILL * colW) / Math.max(box.width, 1), maxH / Math.max(box.height, 1))
  return Math.max(MIN_SCALE, Math.round(fit))
}

/** The bromine of a frame panel: drawn like SkeletalFormula draws a halogen, on the frame's own atom positions. */
function BromineOnFrame({ frame, atom, scale }: { frame: Frame; atom: number; scale: number }) {
  const p = frame.points[atom]
  const th = freeAngle(frame.points, frame.adj, atom, [])
  const q = { x: p.x + scale * Math.cos(th), y: p.y + scale * Math.sin(th) }
  const end = along(p, q, 1 - shrinkFor('Br', scale) / scale)
  return (
    <g>
      <line
        x1={p.x}
        y1={p.y}
        x2={end.x}
        y2={end.y}
        stroke="var(--fg)"
        strokeWidth={Math.max(1.6, 0.045 * scale)}
        strokeLinecap="round"
      />
      <text
        x={q.x}
        y={q.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.round(0.36 * scale)}
        fontFamily="var(--font-sans)"
        fill="var(--atom-hal)"
      >
        Br
      </text>
    </g>
  )
}

/** One scale for every panel of a frame Step, fitted to the frame plus the bromine on each of its atoms. */
function fitFrame(attach: readonly number[], colW: number, maxH: number): number {
  const unit = drawingFrame(FRAME, 1)
  const pts = [...unit.points]
  for (const atom of attach) {
    const p = unit.points[atom]
    const th = freeAngle(unit.points, unit.adj, atom, [])
    pts.push({ x: p.x + Math.cos(th), y: p.y + Math.sin(th) })
  }
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const w = Math.max(...xs) - Math.min(...xs) + 1
  const h = Math.max(...ys) - Math.min(...ys) + 1
  return Math.max(MIN_SCALE, Math.round(Math.min(MAX_SCALE, (FILL * colW) / w, maxH / h)))
}

export function HalideClasses({ step }: HalideClassesProps) {
  const s = clampStep(step)
  const panels = describeStep(s)
  const count = panels.length as 1 | 2 | 3
  const layout = LAYOUT[count]
  const colW = W / count
  const attach = FRAME_ATTACH[s] as readonly number[] | undefined
  const frameScale = attach ? fitFrame(attach, colW, layout.maxH) : 0
  const label = panels.map((p) => `${p.name}, ${p.classLabel}`).join('; ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', height: 'auto' }}>
      {panels.map((p, i) => {
        const cx = colW * (i + 0.5)
        // Steps 1 and 2: one frame, the same drawing in every panel; only the bromine's carbon moves.
        // Other Steps: each molecule at its own fitted scale.
        const graph = attach ? FRAME : p.graph
        const scale = attach ? frameScale : fitScale(p.graph, colW, layout.maxH)
        const wash = attach ? [attach[i]] : p.highlight
        const frame = drawingFrame(graph, scale)
        return (
          <g key={p.smiles}>
            <g transform={`translate(${cx}, ${layout.cy})`}>
              {wash.map((atom) => (
                <circle
                  key={`w-${atom}`}
                  cx={frame.points[atom].x}
                  cy={frame.points[atom].y}
                  r={WASH * scale}
                  fill="var(--highlight)"
                />
              ))}
              <SkeletalFormula
                graph={graph}
                scale={scale}
                overlay={attach ? <BromineOnFrame frame={frame} atom={attach[i]} scale={scale} /> : undefined}
              />
            </g>
            <text x={cx} y={layout.nameY} textAnchor="middle" fontSize={layout.font} fill="var(--fg)">
              {p.name}
            </text>
            <text x={cx} y={layout.classY} textAnchor="middle" fontSize={layout.font} fill="var(--accent)">
              {p.classLabel}
            </text>
            <text x={cx} y={layout.formulaY} textAnchor="middle" fontSize={layout.formulaFont} fill="var(--fg-muted)">
              {p.formula}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
