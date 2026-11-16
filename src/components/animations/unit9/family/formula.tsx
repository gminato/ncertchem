'use client'

import { Label, LabelSub, LabelSup } from '@/components/vocab'
import { drawingFrame } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** One run of a formula: plain text, a subscript or a superscript. */
export type FormulaPiece = string | { sub: string } | { sup: string }

/**
 * Splits a formula such as 'C2H6' into runs, with each digit run written as a subscript. Pass `sup`
 * to make a superscript run (for sp³), or use the explicit pieces for a general formula (CₙH₂ₙ₊₂).
 */
export function formulaPieces(formula: string): FormulaPiece[] {
  return formula.split(/(\d+)/).filter((t) => t !== '').map((t) => (/^\d+$/.test(t) ? { sub: t } : t))
}

/** An SVG text line with real subscripts and superscripts, e.g. C₂H₆ or CₙH₂ₙ₊₂. */
export function Formula({ pieces, x, y, fontSize = 22, anchor = 'middle', fill = 'var(--fg)' }: { pieces: FormulaPiece[]; x: number; y: number; fontSize?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string }) {
  return (
    <Label x={x} y={y} fontSize={fontSize} textAnchor={anchor} fill={fill}>
      {pieces.map((p, i) => (typeof p === 'string' ? <tspan key={i}>{p}</tspan> : 'sub' in p ? <LabelSub key={i}>{p.sub}</LabelSub> : <LabelSup key={i}>{p.sup}</LabelSup>))}
    </Label>
  )
}

/**
 * Bond length (pixels) that fills a box: the molecule's own extent at scale 1, without label padding,
 * fitted into `width` × `height` and capped at `max`.
 */
export function fitScale(g: MolGraph, max: number, width: number, height: number): number {
  const f = drawingFrame(g, 1)
  const xs = f.points.map((p) => p.x)
  const ys = f.points.map((p) => p.y)
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  return Math.min(max, width / Math.max(w, 1), height / Math.max(h, 1))
}

/**
 * The unit direction in which a label sits clear of every bond of an atom: the candidate direction (in 10° steps)
 * whose nearest bond is furthest away. An atom with no bonds gets a label above it.
 */
export function clearDirection(points: readonly { x: number; y: number }[], adj: readonly number[][], a: number): { x: number; y: number } {
  if (adj[a].length === 0) return { x: 0, y: -1 }
  const bondAngles = adj[a].map((n) => Math.atan2(points[n].y - points[a].y, points[n].x - points[a].x))
  let best = { x: 0, y: -1 }
  let bestScore = -1
  for (let k = 0; k < 36; k++) {
    const t = (k * Math.PI) / 18
    let score = Math.PI
    for (const b of bondAngles) {
      let d = Math.abs(t - b) % (2 * Math.PI)
      d = Math.min(d, 2 * Math.PI - d)
      score = Math.min(score, d)
    }
    if (score > bestScore + 1e-9) {
      bestScore = score
      best = { x: Math.cos(t), y: Math.sin(t) }
    }
  }
  return best
}

/** A formula as text with each digit run in a <sub>, e.g. C₅H₁₂ written as C<sub>5</sub>H<sub>12</sub>. */
export function SubFormula({ formula }: { formula: string }) {
  return (
    <>
      {formula.split(/(\d+)/).filter((t) => t !== '').map((t, i) => (/^\d+$/.test(t) ? <sub key={i}>{t}</sub> : <span key={i}>{t}</span>))}
    </>
  )
}
