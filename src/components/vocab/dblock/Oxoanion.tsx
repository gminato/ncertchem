import React, { forwardRef } from 'react'
import { ION_COLOUR_TOKEN, SERIES_TONE, type IonColourKey } from './tones'

/** Length of every metal–oxygen bond in the drawing, in SVG units. */
export const OXO_BOND = 40
/** Radii of the atom discs: metal and oxygen. */
export const OXO_RADIUS = { metal: 12, oxygen: 11 } as const

export type OxoanionKind = 'cro4' | 'cr2o7' | 'mno4' | 'mno4-2'
export type BondStyle = 'plain' | 'wedge' | 'dash'

export interface OxoAtom {
  element: 'Cr' | 'Mn' | 'O'
  x: number
  y: number
}

export interface OxoBond {
  /** Index of the metal (or bridging O) in `atoms`. */
  a: number
  /** Index of the oxygen in `atoms`. */
  b: number
  style: BondStyle
}

export interface OxoanionGeometry {
  atoms: OxoAtom[]
  bonds: OxoBond[]
  /** Indices of the metal atoms in `atoms`. */
  metals: number[]
  /** Formal charge of the ion. */
  charge: number
  /** Ion as written in Unicode. */
  label: string
}

const SPEC: Record<OxoanionKind, { metal: 'Cr' | 'Mn'; charge: number; label: string }> = {
  cro4: { metal: 'Cr', charge: -2, label: 'CrO₄²⁻' },
  cr2o7: { metal: 'Cr', charge: -2, label: 'Cr₂O₇²⁻' },
  mno4: { metal: 'Mn', charge: -1, label: 'MnO₄⁻' },
  'mno4-2': { metal: 'Mn', charge: -2, label: 'MnO₄²⁻' },
}

/** Oxoanion kinds in the order the Section pages use them. */
export const OXOANION_KINDS = ['cro4', 'cr2o7', 'mno4', 'mno4-2'] as const

/** Point at `deg` (0 = right, 90 = up, as on a graph) from (cx, cy), one bond length away, in SVG coordinates. */
function at(cx: number, cy: number, deg: number): { x: number; y: number } {
  const r = (deg * Math.PI) / 180
  return { x: cx + OXO_BOND * Math.cos(r), y: cy - OXO_BOND * Math.sin(r) }
}

/** Four bonds of a tetrahedral centre, drawn as the usual 2D picture: two in the plane, one wedge (towards the reader), one dash (away). */
const TETRA: [number, BondStyle][] = [
  [0, 'plain'],
  [180, 'plain'],
  [90, 'wedge'],
  [270, 'dash'],
]

/**
 * Atoms and bonds of one oxoanion in a 2D projection. Pure, so the drawing and the tests share it.
 * Cr₂O₇²⁻ is two tetrahedra sharing one bridging O (the Cr–O–Cr angle is bent, 140°).
 */
export function oxoanionGeometry(kind: OxoanionKind): OxoanionGeometry {
  const spec = SPEC[kind]
  const atoms: OxoAtom[] = []
  const bonds: OxoBond[] = []
  const metals: number[] = []

  /** Adds a metal at (cx, cy) with an oxygen on each of `dirs`. Returns the metal's index. */
  const addCentre = (element: 'Cr' | 'Mn', cx: number, cy: number, dirs: [number, BondStyle][]): number => {
    atoms.push({ element, x: cx, y: cy })
    const m = atoms.length - 1
    metals.push(m)
    for (const [deg, style] of dirs) {
      const p = at(cx, cy, deg)
      atoms.push({ element: 'O', x: p.x, y: p.y })
      bonds.push({ a: m, b: atoms.length - 1, style })
    }
    return m
  }

  if (kind === 'cr2o7') {
    atoms.push({ element: 'O', x: 0, y: 0 })
    const bridge = 0
    const left = at(0, 0, 160)
    const right = at(0, 0, 20)
    const crL = addCentre('Cr', left.x, left.y, [
      [180, 'plain'],
      [90, 'wedge'],
      [270, 'dash'],
    ])
    const crR = addCentre('Cr', right.x, right.y, [
      [0, 'plain'],
      [90, 'wedge'],
      [270, 'dash'],
    ])
    bonds.push({ a: crL, b: bridge, style: 'plain' }, { a: crR, b: bridge, style: 'plain' })
  } else {
    addCentre(spec.metal, 0, 0, TETRA)
  }

  return { atoms, bonds, metals, charge: spec.charge, label: spec.label }
}

/** Number of oxygen atoms in the ion. */
export function oxoCount(geom: OxoanionGeometry): number {
  return geom.atoms.filter((a) => a.element === 'O').length
}

/** Oxidation state of the metal, from the charge with O at −2 (all metals share it, as in these ions). */
export function oxoanionOxidationState(kind: OxoanionKind): number {
  const g = oxoanionGeometry(kind)
  return (g.charge + 2 * oxoCount(g)) / g.metals.length
}

/** Bounding box of the atom discs, for layout and the tint. */
export function oxoanionBounds(kind: OxoanionKind): { minX: number; maxX: number; minY: number; maxY: number } {
  const g = oxoanionGeometry(kind)
  const r = OXO_RADIUS.oxygen
  return {
    minX: Math.min(...g.atoms.map((a) => a.x)) - r,
    maxX: Math.max(...g.atoms.map((a) => a.x)) + r,
    minY: Math.min(...g.atoms.map((a) => a.y)) - r,
    maxY: Math.max(...g.atoms.map((a) => a.y)) + r,
  }
}

/** Points of a wedge bond: narrow at the metal, wide at the oxygen. */
function wedgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const w0 = 1.5
  const w1 = 5
  return `M${x1 + nx * w0} ${y1 + ny * w0} L${x2 + nx * w1} ${y2 + ny * w1} L${x2 - nx * w1} ${y2 - ny * w1} L${x1 - nx * w0} ${y1 - ny * w0} Z`
}

export interface OxoanionProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  kind: OxoanionKind
  /** Position of the drawing's origin (the bridging O for Cr₂O₇²⁻, the metal otherwise). */
  x?: number
  y?: number
  /** Solution colour behind the ion, from the ion colour tokens. */
  tint?: IonColourKey
  /** Oxidation state above each metal, e.g. +6. */
  showOxidationState?: boolean
  /** Draw the charged formula under the ion. */
  showLabel?: boolean
}

/** An oxoanion as a 2D tetrahedral drawing, with its formula and optional oxidation state. */
export const Oxoanion = forwardRef<SVGGElement, OxoanionProps>(function Oxoanion(
  { kind, x = 0, y = 0, tint, showOxidationState = false, showLabel = true, ...rest },
  ref
) {
  const g = oxoanionGeometry(kind)
  const b = oxoanionBounds(kind)
  const metalTone = SERIES_TONE['3d']
  const ox = oxoanionOxidationState(kind)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-oxoanion={kind} {...rest}>
      {tint && (
        <rect
          x={b.minX - 18}
          y={b.minY - 14}
          width={b.maxX - b.minX + 36}
          height={b.maxY - b.minY + 28}
          rx={18}
          style={{ fill: ION_COLOUR_TOKEN[tint] }}
        />
      )}
      {g.bonds.map((bond, i) => {
        const p = g.atoms[bond.a]
        const q = g.atoms[bond.b]
        if (bond.style === 'wedge') {
          return <path key={i} d={wedgePath(p.x, p.y, q.x, q.y)} style={{ fill: 'var(--fg-muted)' }} />
        }
        return (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            style={{
              stroke: 'var(--fg-muted)',
              strokeWidth: 2.5,
              strokeLinecap: 'round',
              strokeDasharray: bond.style === 'dash' ? '4 4' : undefined,
            }}
          />
        )
      })}
      {g.atoms.map((atom, i) => {
        const isMetal = atom.element !== 'O'
        const r = isMetal ? OXO_RADIUS.metal : OXO_RADIUS.oxygen
        return (
          <g key={i}>
            <circle
              cx={atom.x}
              cy={atom.y}
              r={r}
              style={{ fill: isMetal ? metalTone : 'var(--ion-anion)', stroke: 'var(--glass-wall)', strokeWidth: 1 }}
            />
            <text
              x={atom.x}
              y={atom.y + 5}
              textAnchor="middle"
              fontSize={14}
              style={{ fill: 'var(--surface)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            >
              {atom.element}
            </text>
          </g>
        )
      })}
      {showOxidationState &&
        g.metals.map((m) => {
          const a = g.atoms[m]
          return (
            <text
              key={m}
              x={a.x + 26}
              y={a.y - 22}
              textAnchor="start"
              fontSize={14}
              style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            >
              {`+${ox}`}
            </text>
          )
        })}
      {showLabel && (
        <text
          x={0}
          y={b.maxY + 22}
          textAnchor="middle"
          fontSize={16}
          style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
        >
          {g.label}
        </text>
      )}
    </g>
  )
})
