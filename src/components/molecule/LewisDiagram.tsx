import React, { forwardRef, type ReactNode } from 'react'
import { atomColor } from '../vocab/atom'
import { Label } from '../vocab/Label'
import { polygonPath } from './geometry'
import { layoutLewis, symbolClearance, type LewisAtomSpec, type LewisBondSpec } from './lewis-geometry'

export interface LewisAtom extends LewisAtomSpec {
  /** Lone pairs, drawn as two dots each. */
  lonePairs?: number
  /** Single electrons, drawn as one dot each. */
  unpaired?: number
  /** Formal charge, drawn as a small circled sign next to the atom. Zero or undefined draws none. */
  formalCharge?: number
  /** Ionic charge, drawn as a superscript after the symbol (for example Na⁺). */
  ionCharge?: ReactNode
  /**
   * One entry per lone pair. An origin id colours that pair's second electron
   * with the origin atom's element colour (Kössel and transfer views).
   */
  pairOrigins?: (string | null)[]
}

export interface LewisBracket {
  /** The atoms enclosed by the brackets. */
  atoms: string[]
  /** The charge written at the top right, outside the brackets. */
  charge?: ReactNode
}

export interface LewisTransfer {
  /** Donor and acceptor atom ids. An electron moves from `from` to `to`. */
  from: string
  to: string
}

export interface LewisDiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  atoms: LewisAtom[]
  bonds: LewisBondSpec[]
  /** Brackets with a charge, for ions such as Cl⁻ in NaCl or the whole of CO₃²⁻. */
  brackets?: LewisBracket[]
  /** A curved arrow showing one electron moving between two atoms. */
  transfer?: LewisTransfer
  /** A small badge per atom with the number of electrons it counts around itself. */
  octetBadges?: boolean
  /** Colour electron dots from their origin atom, rather than all in the foreground colour. */
  colourByOrigin?: boolean
  x?: number
  y?: number
  fontSize?: number
  /** Radius of each electron dot, in SVG units. */
  dotRadius?: number
  /** Half the gap between the two dots of a lone pair. Tight pairs read as one unit. */
  pairHalfGap?: number
  /** Distance from the symbol to the lone-pair dots. */
  lonePairRadius?: number
}

const BOND_STROKE = 1.5
const BOND_SPACING = 4
const DEFAULT_DOT_RADIUS = 1.9
const DEFAULT_PAIR_HALF_GAP = 2.2
const DEFAULT_LONE_PAIR_RADIUS = 9
const CHARGE_RADIUS = 6.5
const BRACKET_PAD = 24
const BRACKET_ARM = 6

function unitVector(dx: number, dy: number): { x: number; y: number; len: number } {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len, len }
}

function polar(cx: number, cy: number, deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/**
 * A Lewis structure: atoms as symbols, bonds as one to three lines, lone pairs
 * as dot pairs in free directions, optional formal charges and octet badges,
 * brackets for ions, and a transfer arrow for electrons moving between atoms.
 * Colours are CSS variables and nothing in it is baked-in prose.
 */
export const LewisDiagram = forwardRef<SVGGElement, LewisDiagramProps>(function LewisDiagram(
  {
    atoms,
    bonds,
    brackets = [],
    transfer,
    octetBadges = false,
    colourByOrigin = false,
    x = 0,
    y = 0,
    fontSize = 16,
    dotRadius = DEFAULT_DOT_RADIUS,
    pairHalfGap = DEFAULT_PAIR_HALF_GAP,
    lonePairRadius = DEFAULT_LONE_PAIR_RADIUS,
    className,
    style,
    ...rest
  },
  ref
) {
  const layouts = layoutLewis(atoms, bonds)
  const layoutById = new Map(layouts.map((l) => [l.id, l]))
  const atomById = new Map(atoms.map((a) => [a.id, a]))

  const dotFill = (origin: string | null | undefined): string => {
    if (!colourByOrigin || !origin) return 'var(--fg)'
    const source = atomById.get(origin)
    return source ? atomColor(source.element) : 'var(--fg)'
  }

  const bondLines = bonds.flatMap((bond, bi) => {
    const a = atomById.get(bond.a)
    const b = atomById.get(bond.b)
    if (!a || !b) return []
    const dir = unitVector(b.x - a.x, b.y - a.y)
    const order = bond.order ?? 1
    const normal = { x: -dir.y, y: dir.x }
    const offsets = order === 1 ? [0] : order === 2 ? [-BOND_SPACING / 2, BOND_SPACING / 2] : [-BOND_SPACING, 0, BOND_SPACING]
    const startGap = symbolClearance(a.element)
    const endGap = symbolClearance(b.element)
    return offsets.map((off, k) => ({
      key: `bond-${bi}-${k}`,
      x1: a.x + dir.x * startGap + normal.x * off,
      y1: a.y + dir.y * startGap + normal.y * off,
      x2: b.x - dir.x * endGap + normal.x * off,
      y2: b.y - dir.y * endGap + normal.y * off,
    }))
  })

  const dots: React.ReactNode[] = []
  for (const atom of atoms) {
    const layout = layoutById.get(atom.id)
    if (!layout) continue
    const ring = symbolClearance(atom.element) + lonePairRadius
    layout.lonePairAngles.forEach((angle, i) => {
      const centre = polar(atom.x, atom.y, angle, ring)
      const perp = { x: -Math.sin((angle * Math.PI) / 180), y: Math.cos((angle * Math.PI) / 180) }
      const origin = atom.pairOrigins?.[i] ?? null
      const first = { x: centre.x - perp.x * pairHalfGap, y: centre.y - perp.y * pairHalfGap }
      const second = { x: centre.x + perp.x * pairHalfGap, y: centre.y + perp.y * pairHalfGap }
      dots.push(
        <circle key={`lp-${atom.id}-${i}-a`} cx={first.x} cy={first.y} r={dotRadius} style={{ fill: 'var(--fg)' }} />,
        <circle key={`lp-${atom.id}-${i}-b`} cx={second.x} cy={second.y} r={dotRadius} style={{ fill: dotFill(origin) }} />
      )
    })
    layout.unpairedAngles.forEach((angle, i) => {
      const p = polar(atom.x, atom.y, angle, ring)
      dots.push(<circle key={`up-${atom.id}-${i}`} cx={p.x} cy={p.y} r={dotRadius} style={{ fill: dotFill(atom.id) }} />)
    })
  }

  const charges = atoms.flatMap((atom) => {
    const layout = layoutById.get(atom.id)
    if (!layout || layout.chargeAngle === undefined || !atom.formalCharge) return []
    const p = polar(atom.x, atom.y, layout.chargeAngle, symbolClearance(atom.element) + 15)
    const sign = atom.formalCharge > 0 ? '+' : '−'
    return [
      <g key={`fc-${atom.id}`} data-testid="formal-charge">
        <circle cx={p.x} cy={p.y} r={CHARGE_RADIUS} style={{ fill: 'var(--surface)', stroke: 'var(--fg-subtle)' }} strokeWidth={0.9} />
        <Label x={p.x} y={p.y} fontSize={10} fill="var(--fg)">
          {sign}
        </Label>
      </g>,
    ]
  })

  const badges = octetBadges
    ? atoms.flatMap((atom) => {
        const layout = layoutById.get(atom.id)
        if (!layout) return []
        const count = 2 * (atom.lonePairs ?? 0) + bonds.reduce((sum, bond) => {
          if (bond.a !== atom.id && bond.b !== atom.id) return sum
          return sum + 2 * (bond.order ?? 1)
        }, 0)
        const p = polar(atom.x, atom.y, layout.badgeAngle, symbolClearance(atom.element) + 26)
        return [
          <g key={`octet-${atom.id}`} data-testid="octet-badge">
            <rect
              x={p.x - 9}
              y={p.y - 7}
              width={18}
              height={14}
              rx={7}
              style={{ fill: 'var(--accent-soft)', stroke: 'var(--accent)' }}
              strokeWidth={0.7}
            />
            <Label x={p.x} y={p.y} fontSize={9} fill="var(--accent)">
              {String(count)}
            </Label>
          </g>,
        ]
      })
    : []

  const bracketShapes = brackets.map((bracket, i) => {
    const members = bracket.atoms.map((id) => atomById.get(id)).filter((a): a is LewisAtom => Boolean(a))
    if (members.length === 0) return null
    const x0 = Math.min(...members.map((a) => a.x)) - BRACKET_PAD
    const x1 = Math.max(...members.map((a) => a.x)) + BRACKET_PAD
    const y0 = Math.min(...members.map((a) => a.y)) - BRACKET_PAD
    const y1 = Math.max(...members.map((a) => a.y)) + BRACKET_PAD
    const stroke = { stroke: 'var(--fg)' }
    return (
      <g key={`bracket-${i}`} data-testid="lewis-bracket">
        <path
          d={`M${x0 + BRACKET_ARM},${y0} H${x0} V${y1} H${x0 + BRACKET_ARM}`}
          fill="none"
          strokeWidth={1.2}
          style={stroke}
        />
        <path
          d={`M${x1 - BRACKET_ARM},${y0} H${x1} V${y1} H${x1 - BRACKET_ARM}`}
          fill="none"
          strokeWidth={1.2}
          style={stroke}
        />
        {bracket.charge !== undefined && (
          <Label x={x1 + 4} y={y0 + 2} textAnchor="start" fontSize={12} fill="var(--fg)">
            {bracket.charge}
          </Label>
        )}
      </g>
    )
  })

  let transferShape: React.ReactNode = null
  if (transfer) {
    const a = atomById.get(transfer.from)
    const b = atomById.get(transfer.to)
    if (a && b) {
      const dir = unitVector(b.x - a.x, b.y - a.y)
      const normal = { x: dir.y, y: -dir.x }
      const bend = 22
      const cx = (a.x + b.x) / 2 + normal.x * bend
      const cy = (a.y + b.y) / 2 + normal.y * bend
      const startGap = symbolClearance(a.element) + 8
      const endGap = symbolClearance(b.element) + 4
      const sx = a.x + dir.x * startGap + normal.x * 4
      const sy = a.y + dir.y * startGap + normal.y * 4
      const ex = b.x - dir.x * endGap + normal.x * 4
      const ey = b.y - dir.y * endGap + normal.y * 4
      // Arrowhead along the tangent at the end of the quadratic curve.
      const tx = ex - cx
      const ty = ey - cy
      const tl = Math.hypot(tx, ty) || 1
      const ux = tx / tl
      const uy = ty / tl
      const head = 5
      const hx = ex - ux * head
      const hy = ey - uy * head
      const wing1 = { x: hx - uy * 3.2, y: hy + ux * 3.2 }
      const wing2 = { x: hx + uy * 3.2, y: hy - ux * 3.2 }
      transferShape = (
        <g data-testid="lewis-transfer">
          <path
            d={`M${sx},${sy} Q${cx},${cy} ${hx},${hy}`}
            fill="none"
            strokeWidth={1.3}
            strokeLinecap="round"
            style={{ stroke: 'var(--accent)' }}
          />
          <path
            d={polygonPath([
              { x: ex, y: ey },
              wing1,
              wing2,
            ])}
            style={{ fill: 'var(--accent)' }}
          />
          <circle cx={sx} cy={sy} r={dotRadius} style={{ fill: dotFill(transfer.from) }} />
        </g>
      )
    }
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      <g data-testid="lewis-bonds" style={{ stroke: 'var(--fg)' }} strokeWidth={BOND_STROKE} strokeLinecap="round">
        {bondLines.map((line) => (
          <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        ))}
      </g>
      {dots}
      {atoms.map((atom) => (
        <Label
          key={`sym-${atom.id}`}
          x={atom.x}
          y={atom.y}
          fontSize={fontSize}
          fill="var(--fg)"
          sup={atom.ionCharge}
          data-testid="lewis-atom"
        >
          {atom.element}
        </Label>
      ))}
      {charges}
      {badges}
      {bracketShapes}
      {transferShape}
    </g>
  )
})
