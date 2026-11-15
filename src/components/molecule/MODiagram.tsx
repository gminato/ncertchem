import React, { forwardRef, type ReactNode } from 'react'
import { Label } from '../vocab/Label'
import {
  AO_ENERGY,
  MO_CORRELATION,
  distributeElectrons,
  moLevels,
  type AOKey,
  type MOElectrons,
  type MOKey,
  type MOOrder,
} from './mo-levels'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const MO_DIAGRAM_SIZE = { width: 360, height: 352 } as const

const COLUMN_A_END = 140
const COLUMN_B_START = 220
const CENTRE_X = MO_DIAGRAM_SIZE.width / 2
const SIGMA_HALF = 18
const PI_OUTER = 27
const PI_CENTRE = 15
const LINE_WIDTH_PI = 24
const AO_HALF = 25
const TOP_E = 96
const BOTTOM_E = -8
const SCALE = 2.6
const Y_TOP = 40
const Y_ZERO = Y_TOP + TOP_E * SCALE
const ARROW_HALF = 5.5
const ARROW_HEAD = 2.2
const ARROW_SPREAD = 4.5

/** Vertical position for a schematic energy. Higher energy is higher on the page. */
export function moY(energy: number): number {
  return Y_ZERO - energy * SCALE
}

export interface MODiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Whether s-p mixing puts pi2p below sigma2p (mixed) or above it (unmixed). */
  order: MOOrder
  /** Electrons per MO. For pi2p and pi*2p the count is the total for the two orbitals. */
  electrons?: MOElectrons
  /** MOs to outline, such as the ones that decide bond order or magnetism. */
  highlight?: MOKey[]
  /** Element symbols above the two atomic columns. */
  elementA?: string
  elementB?: string
  /** Readout slots: the bond order and magnetism values, supplied by the caller. */
  bondOrder?: ReactNode
  magnetism?: ReactNode
  x?: number
  y?: number
}

/** Spin arrow centred on a point on the MO line: up for +½, down for −½. */
function SpinArrow({ x, y, direction }: { x: number; y: number; direction: 'up' | 'down' }) {
  const tailY = direction === 'up' ? y + ARROW_HALF : y - ARROW_HALF
  const tipY = direction === 'up' ? y - ARROW_HALF : y + ARROW_HALF
  const headY = direction === 'up' ? tipY + ARROW_HEAD * 2 : tipY - ARROW_HEAD * 2
  return (
    <g>
      <path d={`M${x},${tailY} L${x},${tipY}`} strokeWidth={1.6} strokeLinecap="round" style={{ stroke: 'var(--electron)' }} />
      <path
        d={`M${x - ARROW_HEAD},${headY} L${x},${tipY} L${x + ARROW_HEAD},${headY}`}
        fill="none"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--electron)' }}
      />
    </g>
  )
}

/** Electrons in one orbital, drawn as up and down arrows on the line. */
function OrbitalElectrons({ x, y, count }: { x: number; y: number; count: number }) {
  if (count <= 0) return null
  if (count === 1) return <SpinArrow x={x} y={y} direction="up" />
  return (
    <>
      <SpinArrow x={x - ARROW_SPREAD} y={y} direction="up" />
      <SpinArrow x={x + ARROW_SPREAD} y={y} direction="down" />
    </>
  )
}

/**
 * The MO energy diagram for a homonuclear diatomic: atomic orbitals of the two
 * atoms on the sides, molecular orbitals in the centre, dashed correlation lines
 * between them, and electrons as spin arrows. Labels sit above their lines and
 * the orbitals' levels follow the schematic energies in mo-levels.ts.
 */
export const MODiagram = forwardRef<SVGGElement, MODiagramProps>(function MODiagram(
  { order, electrons = {}, highlight = [], elementA = 'A', elementB = 'B', bondOrder, magnetism, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const levels = moLevels(order)
  const highlighted = new Set(highlight)

  const aoLevels = (Object.keys(AO_ENERGY) as AOKey[]).map((key) => ({ key, yy: moY(AO_ENERGY[key]) }))

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      {/* Column headers */}
      <Label x={(COLUMN_A_END + 90) / 2} y={18} fontSize={14} fill="var(--fg)">
        {elementA}
      </Label>
      <Label x={(COLUMN_B_START + 270) / 2} y={18} fontSize={14} fill="var(--fg)">
        {elementB}
      </Label>

      {/* Atomic orbitals */}
      {(['A', 'B'] as const).map((side) => {
        const isA = side === 'A'
        const x0 = isA ? 90 : COLUMN_B_START
        const x1 = isA ? COLUMN_A_END : 270
        return aoLevels.map((ao) => (
          <g key={`ao-${side}-${ao.key}`}>
            <line x1={x0} y1={ao.yy} x2={x1} y2={ao.yy} strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} />
            <Label
              x={isA ? x0 - 8 : x1 + 8}
              y={ao.yy}
              textAnchor={isA ? 'end' : 'start'}
              fontSize={11}
              fill="var(--fg-muted)"
            >
              {ao.key}
            </Label>
          </g>
        ))
      })}

      {/* Correlation lines and molecular orbitals */}
      {levels.map((level) => {
        const yy = moY(level.energy)
        const ao = aoLevels.find((a) => a.key === MO_CORRELATION[level.key])
        const leftEnd = level.degeneracy === 2 ? CENTRE_X - PI_OUTER : CENTRE_X - SIGMA_HALF
        const rightEnd = level.degeneracy === 2 ? CENTRE_X + PI_OUTER : CENTRE_X + SIGMA_HALF
        const isHighlighted = highlighted.has(level.key)
        const electronCount = electrons[level.key] ?? 0
        const labelY = yy - 11
        const correlation = ao && (
          <g key={`corr-${level.key}`}>
            <line x1={COLUMN_A_END} y1={ao.yy} x2={leftEnd} y2={yy} strokeWidth={0.9} strokeDasharray="2.5 3" style={{ stroke: 'var(--fg-subtle)' }} />
            <line x1={rightEnd} y1={yy} x2={COLUMN_B_START} y2={ao.yy} strokeWidth={0.9} strokeDasharray="2.5 3" style={{ stroke: 'var(--fg-subtle)' }} />
          </g>
        )
        const highlightBox = isHighlighted && (
          <rect
            x={leftEnd - 6}
            y={labelY - 9}
            width={rightEnd - leftEnd + 12}
            height={22}
            rx={6}
            style={{ fill: 'var(--accent-soft)', stroke: 'var(--accent)' }}
            strokeWidth={0.8}
          />
        )

        if (level.degeneracy === 1) {
          return (
            <g key={`mo-${level.key}`} data-testid="mo-level" data-mo={level.key}>
              {correlation}
              {highlightBox}
              <line x1={CENTRE_X - SIGMA_HALF} y1={yy} x2={CENTRE_X + SIGMA_HALF} y2={yy} strokeWidth={1.8} style={{ stroke: 'var(--fg)' }} />
              <OrbitalElectrons x={CENTRE_X} y={yy} count={electronCount} />
              <MOLabel x={CENTRE_X} y={labelY} base="σ" star={level.key.includes('*')} sub={level.key.replace('*', '').replace('s', '')} />
            </g>
          )
        }

        // The pi pair: two degenerate orbitals side by side, with their own electrons.
        const perOrbital = distributeElectrons(electronCount, 2)
        const centres = [CENTRE_X - PI_CENTRE, CENTRE_X + PI_CENTRE]
        const labels = ['x', 'y']
        return (
          <g key={`mo-${level.key}`} data-testid="mo-level" data-mo={level.key}>
            {correlation}
            {highlightBox}
            {centres.map((c, k) => (
              <g key={`pi-${k}`}>
                <line x1={c - LINE_WIDTH_PI / 2} y1={yy} x2={c + LINE_WIDTH_PI / 2} y2={yy} strokeWidth={1.8} style={{ stroke: 'var(--fg)' }} />
                <OrbitalElectrons x={c} y={yy} count={perOrbital[k]} />
                <MOLabel x={c} y={labelY} base={level.key.includes('*') ? 'π*' : 'π'} sub={`2p${labels[k]}`} />
              </g>
            ))}
          </g>
        )
      })}

      {/* Readout slots, filled in by the caller */}
      {bondOrder !== undefined && (
        <Label x={CENTRE_X - 72} y={MO_DIAGRAM_SIZE.height - 14} fontSize={12} fill="var(--fg)" data-testid="mo-bond-order">
          <tspan fill="var(--fg-muted)">Bond order </tspan>
          {bondOrder}
        </Label>
      )}
      {magnetism !== undefined && (
        <Label x={CENTRE_X + 72} y={MO_DIAGRAM_SIZE.height - 14} fontSize={12} fill="var(--fg)" data-testid="mo-magnetism">
          {magnetism}
        </Label>
      )}
    </g>
  )
})

/**
 * An MO label: a base symbol (σ, σ*, π or π*) with the orbital subscript after it.
 * The subscript is drawn lower, and the pi orbital names carry their x or y.
 */
function MOLabel({ x, y, base, star = false, sub }: { x: number; y: number; base: string; star?: boolean; sub: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-sans)" fontSize={11} style={{ fill: 'var(--fg)' }}>
      {base}
      {star && '*'}
      <tspan dy="0.32em" fontSize="0.72em" style={{ fill: 'var(--fg-muted)' }}>
        {sub}
      </tspan>
    </text>
  )
}
