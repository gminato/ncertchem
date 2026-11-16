'use client'

import { stereoPath } from '@/components/organic'
import { Label } from '@/components/vocab'

/**
 * Full structural formulas with every hydrogen drawn, for the smallest hydrocarbons (methane, ethane, ethene,
 * ethyne), where a bare bond line tells the Learner nothing. Coordinates are in bond lengths; the drawing is
 * scaled by `scale` pixels per bond and centred on (cx, cy). Each atom is labelled, and each bond stops short of
 * the labels at both ends.
 */

export type Element = 'C' | 'H'
export interface ExplicitAtom {
  x: number
  y: number
  el: Element
}
export interface ExplicitBond {
  a: number
  b: number
  order: 1 | 2 | 3
  /** A solid or hashed wedge for a bond towards or away from the Learner (methane). */
  stereo?: 'wedge' | 'dash'
}
export interface ExplicitMolecule {
  atoms: ExplicitAtom[]
  bonds: ExplicitBond[]
}

const DEG = Math.PI / 180

/** A point at `angle` degrees from `c`, with y pointing down the page (so 90° is up). */
function polar(c: { x: number; y: number }, angle: number, length = 1): { x: number; y: number } {
  return { x: c.x + length * Math.cos(angle * DEG), y: c.y - length * Math.sin(angle * DEG) }
}

const C0 = { x: -0.5, y: 0 }
const C1 = { x: 0.5, y: 0 }

/** Carbons and hydrogens of each molecule, keyed by its SMILES as the family steps and the sorter write it. */
export const EXPLICIT: Record<string, ExplicitMolecule> = {
  C: {
    atoms: [
      { x: 0, y: 0, el: 'C' },
      { ...polar({ x: 0, y: 0 }, 90), el: 'H' },
      { ...polar({ x: 0, y: 0 }, 270), el: 'H' },
      { ...polar({ x: 0, y: 0 }, 15), el: 'H' },
      { ...polar({ x: 0, y: 0 }, 165), el: 'H' },
    ],
    bonds: [
      { a: 0, b: 1, order: 1, stereo: 'wedge' },
      { a: 0, b: 2, order: 1, stereo: 'dash' },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
    ],
  },
  CC: {
    atoms: [
      { ...C0, el: 'C' },
      { ...C1, el: 'C' },
      { ...polar(C0, 120), el: 'H' },
      { ...polar(C0, 180), el: 'H' },
      { ...polar(C0, 240), el: 'H' },
      { ...polar(C1, 60), el: 'H' },
      { ...polar(C1, 0), el: 'H' },
      { ...polar(C1, 300), el: 'H' },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
      { a: 1, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
    ],
  },
  'C=C': {
    atoms: [
      { ...C0, el: 'C' },
      { ...C1, el: 'C' },
      { ...polar(C0, 120), el: 'H' },
      { ...polar(C0, 240), el: 'H' },
      { ...polar(C1, 60), el: 'H' },
      { ...polar(C1, 300), el: 'H' },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
    ],
  },
  'C#C': {
    atoms: [
      { ...C0, el: 'C' },
      { ...C1, el: 'C' },
      { x: -1.5, y: 0, el: 'H' },
      { x: 1.5, y: 0, el: 'H' },
    ],
    bonds: [
      { a: 0, b: 1, order: 3 },
      { a: 0, b: 2, order: 1 },
      { a: 1, b: 3, order: 1 },
    ],
  },
}

/** True when the SMILES has an explicit drawing. */
export function hasExplicit(smiles: string): boolean {
  return smiles in EXPLICIT
}

/**
 * The drawing of a molecule with every atom. `scale` is the bond length in pixels, `cx` and `cy` the centre.
 * `stroke` is the bond colour. Bonds are shortened at both ends so that they stop at the labels.
 */
export function ExplicitDrawing({ smiles, cx, cy, scale, stroke = 'var(--sigma-bond)' }: { smiles: string; cx: number; cy: number; scale: number; stroke?: string }) {
  const mol = EXPLICIT[smiles]
  if (!mol) return null
  const px = (p: { x: number; y: number }) => ({ x: cx + p.x * scale, y: cy + p.y * scale })
  const clear = 0.26 * scale
  const width = Math.max(2.6, 0.045 * scale)
  const gap = 0.1 * scale

  const lines = mol.bonds.map((bond, i) => {
    const p = px(mol.atoms[bond.a])
    const q = px(mol.atoms[bond.b])
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
    const ux = (q.x - p.x) / len
    const uy = (q.y - p.y) / len
    const s = { x: p.x + ux * clear, y: p.y + uy * clear }
    const e = { x: q.x - ux * clear, y: q.y - uy * clear }
    if (bond.stereo) {
      return <path key={`b${i}`} d={stereoPath(s, e, bond.stereo, 0.15 * scale)} fill={bond.stereo === 'wedge' ? stroke : 'none'} stroke={bond.stereo === 'dash' ? stroke : 'none'} strokeWidth={1.6} />
    }
    const nx = -uy
    const ny = ux
    const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-gap / 2, gap / 2] : [-gap, 0, gap]
    return offsets.map((o, k) => (
      <line
        key={`b${i}-${k}`}
        x1={s.x + nx * o}
        y1={s.y + ny * o}
        x2={e.x + nx * o}
        y2={e.y + ny * o}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
      />
    ))
  })

  return (
    <g data-testid="explicit-drawing" data-smiles={smiles}>
      {lines}
      {mol.atoms.map((atom, i) => {
        const p = px(atom)
        return (
          <Label key={`a${i}`} x={p.x} y={p.y} fontSize={atom.el === 'C' ? 30 : 26} fill="var(--fg)">
            {atom.el}
          </Label>
        )
      })}
    </g>
  )
}
