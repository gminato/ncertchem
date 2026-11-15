import React, { forwardRef, type ReactNode } from 'react'
import { atomColor } from '../vocab/atom'
import { Label } from '../vocab/Label'
import { polygonPath } from './geometry'
import { layoutLewis, type LewisAtomSpec, type LewisBondSpec } from './lewis-geometry'

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
  /**
   * Half the centre-to-centre gap of a lone pair's two dots. Defaults to 1.1 × dotRadius,
   * so the two dots of a pair read as one unit.
   */
  pairHalfGap?: number
  /** Distance from the edge of the symbol to the lone-pair dots. */
  lonePairRadius?: number
}

const BOND_STROKE = 1.5
const BOND_SPACING = 4
const DEFAULT_DOT_RADIUS = 1.9
const DEFAULT_LONE_PAIR_RADIUS = 9
const CHARGE_RADIUS = 6.5
const CHARGE_OFFSET = 3
const BADGE_OFFSET = 22
/** Gap between a bond line and the glyph it ends at, as a fraction of the font size. */
const BOND_GAP_EM = 0.6
/** Gap between the outermost electron dot or charge and a bracket. */
const BRACKET_GAP = 6
const BRACKET_ARM = 6

function unitVector(dx: number, dy: number): { x: number; y: number; len: number } {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len, len }
}

function polar(cx: number, cy: number, deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** Half the drawn width or height of a symbol, estimated from the font size. */
function glyphHalf(element: string, fontSize: number): number {
  return fontSize * (element.length > 1 ? 0.62 : 0.42)
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
    pairHalfGap,
    lonePairRadius = DEFAULT_LONE_PAIR_RADIUS,
    className,
    style,
    ...rest
  },
  ref
) {
  const halfGap = pairHalfGap ?? 1.1 * dotRadius
  const layouts = layoutLewis(atoms, bonds)
  const layoutById = new Map(layouts.map((l) => [l.id, l]))
  const atomById = new Map(atoms.map((a) => [a.id, a]))

  // Radii around each atom, all measured from its centre. Bonds stop at the bond gap,
  // lone pairs and unpaired dots sit on the ring, formal charges and badges sit outside it.
  const ringOf = (atom: LewisAtom) => glyphHalf(atom.element, fontSize) + lonePairRadius
  const bondStopOf = (atom: LewisAtom) => glyphHalf(atom.element, fontSize) + BOND_GAP_EM * fontSize
  const chargeRingOf = (atom: LewisAtom) => ringOf(atom) + CHARGE_RADIUS + CHARGE_OFFSET
  /** The furthest any drawn mark of an atom reaches from its centre, used to pad brackets. */
  const reachOf = (atom: LewisAtom) => {
    const dotReach = ringOf(atom) + dotRadius
    if (!atom.formalCharge) return dotReach
    return Math.max(dotReach, chargeRingOf(atom) + CHARGE_RADIUS)
  }

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
    const startGap = bondStopOf(a)
    const endGap = bondStopOf(b)
    return offsets.map((off, k) => ({
      key: `bond-${bi}-${k}`,
      x1: a.x + dir.x * startGap + normal.x * off,
      y1: a.y + dir.y * startGap + normal.y * off,
      x2: b.x - dir.x * endGap + normal.x * off,
      y2: b.y - dir.y * endGap + normal.y * off,
    }))
  })

  const dots: React.ReactNode[] = []
  const unpairedAt = new Map<string, { x: number; y: number }[]>()
  for (const atom of atoms) {
    const layout = layoutById.get(atom.id)
    if (!layout) continue
    const ring = ringOf(atom)
    layout.lonePairAngles.forEach((angle, i) => {
      const centre = polar(atom.x, atom.y, angle, ring)
      const perp = { x: -Math.sin((angle * Math.PI) / 180), y: Math.cos((angle * Math.PI) / 180) }
      const origin = atom.pairOrigins?.[i] ?? null
      const first = { x: centre.x - perp.x * halfGap, y: centre.y - perp.y * halfGap }
      const second = { x: centre.x + perp.x * halfGap, y: centre.y + perp.y * halfGap }
      dots.push(
        <circle key={`lp-${atom.id}-${i}-a`} cx={first.x} cy={first.y} r={dotRadius} style={{ fill: 'var(--fg)' }} />,
        <circle key={`lp-${atom.id}-${i}-b`} cx={second.x} cy={second.y} r={dotRadius} style={{ fill: dotFill(origin) }} />
      )
    })
    const spots: { x: number; y: number }[] = []
    layout.unpairedAngles.forEach((angle, i) => {
      const p = polar(atom.x, atom.y, angle, ring)
      spots.push(p)
      dots.push(<circle key={`up-${atom.id}-${i}`} cx={p.x} cy={p.y} r={dotRadius} style={{ fill: dotFill(atom.id) }} />)
    })
    unpairedAt.set(atom.id, spots)
  }

  const charges = atoms.flatMap((atom) => {
    const layout = layoutById.get(atom.id)
    if (!layout || layout.chargeAngle === undefined || !atom.formalCharge) return []
    const p = polar(atom.x, atom.y, layout.chargeAngle, chargeRingOf(atom))
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
        const p = polar(atom.x, atom.y, layout.badgeAngle, ringOf(atom) + BADGE_OFFSET)
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
    // Pad each bracket by the reach of its furthest mark, so no dot or charge touches it.
    const pad = Math.max(...members.map(reachOf)) + BRACKET_GAP
    const x0 = Math.min(...members.map((a) => a.x)) - pad
    const x1 = Math.max(...members.map((a) => a.x)) + pad
    const y0 = Math.min(...members.map((a) => a.y)) - pad
    const y1 = Math.max(...members.map((a) => a.y)) + pad
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
      // The electron that moves is the donor's own unpaired dot, so the donor never shows two.
      const donorDot = unpairedAt.get(a.id)?.[0] ?? polar(a.x, a.y, -90, ringOf(a))
      const drawDonorDot = !unpairedAt.get(a.id)?.length
      // The arriving dot sits just outside the acceptor, on the side facing the donor.
      const toDonor = unitVector(a.x - b.x, a.y - b.y)
      const arrival = {
        x: b.x + toDonor.x * (ringOf(b) + 2 * dotRadius + 7),
        y: b.y + toDonor.y * (ringOf(b) + 2 * dotRadius + 7),
      }
      const mid = { x: (donorDot.x + arrival.x) / 2, y: (donorDot.y + arrival.y) / 2 }
      const chord = unitVector(arrival.x - donorDot.x, arrival.y - donorDot.y)
      const bend = 0.22 * chord.len
      const cx = mid.x + chord.y * bend
      const cy = mid.y - chord.x * bend
      const toCtrl = unitVector(cx - donorDot.x, cy - donorDot.y)
      const sx = donorDot.x + toCtrl.x * (dotRadius + 2)
      const sy = donorDot.y + toCtrl.y * (dotRadius + 2)
      const toCtrlEnd = unitVector(cx - arrival.x, cy - arrival.y)
      const ex = arrival.x + toCtrlEnd.x * (dotRadius + 4)
      const ey = arrival.y + toCtrlEnd.y * (dotRadius + 4)
      // Arrowhead along the tangent at the end of the quadratic curve.
      const tx = ex - cx
      const ty = ey - cy
      const tl = Math.hypot(tx, ty) || 1
      const ux = tx / tl
      const uy = ty / tl
      const head = 6
      const hx = ex - ux * head
      const hy = ey - uy * head
      const wing1 = { x: hx - uy * 3.6, y: hy + ux * 3.6 }
      const wing2 = { x: hx + uy * 3.6, y: hy - ux * 3.6 }
      transferShape = (
        <g data-testid="lewis-transfer">
          {drawDonorDot && <circle cx={donorDot.x} cy={donorDot.y} r={dotRadius} style={{ fill: dotFill(transfer.from) }} />}
          <path
            d={`M${sx},${sy} Q${cx},${cy} ${hx},${hy}`}
            fill="none"
            strokeWidth={1.8}
            strokeLinecap="round"
            style={{ stroke: 'var(--accent)' }}
          />
          <path d={polygonPath([{ x: ex, y: ey }, wing1, wing2])} style={{ fill: 'var(--accent)' }} />
          <circle cx={arrival.x} cy={arrival.y} r={dotRadius} style={{ fill: dotFill(transfer.from) }} />
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
