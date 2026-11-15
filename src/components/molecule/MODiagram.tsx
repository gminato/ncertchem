import React, { forwardRef, type ReactNode } from 'react'
import type { MOOccupancy } from '../../lib/chem/molecular-orbitals'
import { AO_ENERGY, correlatedAO, drawnOrbitalCounts, levelEnergy } from './mo-levels'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const MO_DIAGRAM_SIZE = { width: 640, height: 440 } as const

const W = MO_DIAGRAM_SIZE.width
const H = MO_DIAGRAM_SIZE.height
const CX = W / 2
const Y_TOP = 46
const SCALE = 2.6
const Y_ZERO = Y_TOP + 136 * SCALE

/** Horizontal extents of the MO lines. The σ line is one bar; the π pair is two bars side by side. */
const SIGMA_HALF = 40
const PI_CENTRE = 30
const PI_HALF = 22
const AO_A = { from: 70, to: 210 }
const AO_B = { from: 430, to: 570 }
const LABEL_SIZE = 14.5
const ARROW_HALF = 6.5
const ARROW_SPREAD = 6

/** Vertical position for a schematic energy. Higher energy is higher on the page. */
export function moY(energy: number): number {
  return Y_ZERO - energy * SCALE
}

export interface MODiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Occupied levels from src/lib/chem/molecular-orbitals.ts, lowest energy first. */
  levels: readonly MOOccupancy[]
  /** Mixed order puts π2p below σ2p (N₂ and lighter); unmixed puts σ2p below π2p (O₂ and heavier). */
  mixing: boolean
  /** Level labels to outline, such as π*2p. */
  highlight?: readonly string[]
  elementA?: string
  elementB?: string
  /** Bond order and magnetism readouts, supplied by the caller. */
  bondOrder?: ReactNode
  magnetism?: ReactNode
  x?: number
  y?: number
}

/** A spin arrow on an MO line: up for +½, down for −½. Drawn thick enough to read on dark surfaces. */
function SpinArrow({ x, y, direction }: { x: number; y: number; direction: 'up' | 'down' }) {
  const tailY = direction === 'up' ? y + ARROW_HALF : y - ARROW_HALF
  const tipY = direction === 'up' ? y - ARROW_HALF : y + ARROW_HALF
  const headY = direction === 'up' ? tipY + 4 : tipY - 4
  return (
    <g data-spin={direction === 'up' ? '+1/2' : '-1/2'}>
      <path d={`M${x},${tailY} L${x},${tipY}`} strokeWidth={2.4} strokeLinecap="round" style={{ stroke: 'var(--electron)' }} />
      <path
        d={`M${x - 3.6},${headY} L${x},${tipY} L${x + 3.6},${headY}`}
        fill="none"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--electron)' }}
      />
    </g>
  )
}

/** Electrons of one orbital on its line: one arrow, or an up and a down arrow. */
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

/** A level label above its line: base symbol (σ, σ*, π, π*), then the orbital subscript. */
function LevelLabel({ x, y, label, sub }: { x: number; y: number; label: string; sub: string }) {
  const star = label.includes('*')
  const base = label.startsWith('σ') ? 'σ' : 'π'
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--font-sans)"
      fontSize={LABEL_SIZE}
      style={{ fill: 'var(--fg)' }}
    >
      {base}
      {star && '*'}
      <tspan dy="0.34em" fontSize="0.74em" style={{ fill: 'var(--fg-muted)' }}>
        {sub}
      </tspan>
    </text>
  )
}

/**
 * The MO energy diagram for a homonuclear diatomic. The atomic orbitals of the two atoms sit
 * in the outer columns, the molecular orbitals in the centre, dashed lines correlate them, and
 * electrons are spin arrows on the MO lines. Every label sits above its line, clear of the
 * arrows and the correlation lines.
 */
export const MODiagram = forwardRef<SVGGElement, MODiagramProps>(function MODiagram(
  { levels, mixing, highlight = [], elementA = 'A', elementB = 'B', bondOrder, magnetism, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const highlighted = new Set(highlight)
  const aoRows = (Object.keys(AO_ENERGY) as (keyof typeof AO_ENERGY)[]).map((key) => ({ key, yy: moY(AO_ENERGY[key]) }))
  const ordered = [...levels].sort((a, b) => levelEnergy(a.label, mixing) - levelEnergy(b.label, mixing))

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      <Header x={(AO_A.from + AO_A.to) / 2} label={elementA} />
      <Header x={(AO_B.from + AO_B.to) / 2} label={elementB} />

      {/* Atomic orbitals, both atoms */}
      {[AO_A, AO_B].map((col, side) =>
        aoRows.map((ao) => {
          const isA = side === 0
          const edge = isA ? col.from : col.to
          return (
            <g key={`ao-${side}-${ao.key}`}>
              <line x1={col.from} y1={ao.yy} x2={col.to} y2={ao.yy} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
              <text
                x={isA ? edge - 8 : edge + 8}
                y={ao.yy}
                textAnchor={isA ? 'end' : 'start'}
                dominantBaseline="central"
                fontFamily="var(--font-sans)"
                fontSize={LABEL_SIZE}
                style={{ fill: 'var(--fg-muted)' }}
              >
                <tspan className="sym">{ao.key}</tspan>
              </text>
            </g>
          )
        })
      )}

      {/* Molecular orbitals with correlation lines */}
      {ordered.map((level) => {
        const yy = moY(levelEnergy(level.label, mixing))
        const ao = aoRows.find((a) => a.key === correlatedAO(level.label)) ?? aoRows[0]
        const isPi = level.degeneracy === 2
        const isHighlighted = highlighted.has(level.label)
        const labelY = yy - 19
        const leftEnd = isPi ? CX - PI_CENTRE - PI_HALF : CX - SIGMA_HALF
        const rightEnd = isPi ? CX + PI_CENTRE + PI_HALF : CX + SIGMA_HALF
        const counts = drawnOrbitalCounts(level.electrons, level.unpaired, level.degeneracy)
        const dash = { strokeDasharray: '3 3.5', strokeWidth: 1, style: { stroke: 'var(--fg-subtle)' } }
        const highlightBox = isHighlighted && (
          <rect
            x={leftEnd - 6}
            y={labelY - 12}
            width={rightEnd - leftEnd + 12}
            height={yy - labelY + 20}
            rx={7}
            strokeWidth={1}
            style={{ fill: 'var(--accent-soft)', stroke: 'var(--accent)' }}
          />
        )

        if (!isPi) {
          return (
            <g key={`mo-${level.label}`} data-testid="mo-level" data-mo={level.label}>
              <line x1={AO_A.to} y1={ao.yy} x2={leftEnd} y2={yy} {...dash} />
              <line x1={rightEnd} y1={yy} x2={AO_B.from} y2={ao.yy} {...dash} />
              {highlightBox}
              <line x1={leftEnd} y1={yy} x2={rightEnd} y2={yy} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
              <OrbitalElectrons x={CX} y={yy} count={counts[0]} />
              <LevelLabel x={CX} y={labelY} label={level.label} sub={level.label.replace('*', '').replace('σ', '').replace('π', '')} />
            </g>
          )
        }

        const centres = [CX - PI_CENTRE, CX + PI_CENTRE]
        return (
          <g key={`mo-${level.label}`} data-testid="mo-level" data-mo={level.label}>
            <line x1={AO_A.to} y1={ao.yy} x2={leftEnd} y2={yy} {...dash} />
            <line x1={rightEnd} y1={yy} x2={AO_B.from} y2={ao.yy} {...dash} />
            {highlightBox}
            {centres.map((c, k) => (
              <g key={`pi-${k}`}>
                <line x1={c - PI_HALF} y1={yy} x2={c + PI_HALF} y2={yy} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
                <OrbitalElectrons x={c} y={yy} count={counts[k]} />
                <LevelLabel x={c} y={labelY} label={level.label} sub={`2p${k === 0 ? 'x' : 'y'}`} />
              </g>
            ))}
          </g>
        )
      })}

      {/* Readouts */}
      <line x1={60} y1={H - 42} x2={W - 60} y2={H - 42} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
      {bondOrder !== undefined && (
        <g data-testid="mo-bond-order">
          <text x={230} y={H - 16} textAnchor="end" fontFamily="var(--font-sans)" fontSize={14} style={{ fill: 'var(--fg-muted)' }}>
            Bond order
          </text>
          <text x={242} y={H - 15} fontFamily="var(--font-sans)" fontSize={17} fontWeight={600} style={{ fill: 'var(--fg)' }}>
            {bondOrder}
          </text>
        </g>
      )}
      {magnetism !== undefined && (
        <g data-testid="mo-magnetism">
          <text x={410} y={H - 16} textAnchor="end" fontFamily="var(--font-sans)" fontSize={14} style={{ fill: 'var(--fg-muted)' }}>
            Magnetism
          </text>
          <text x={422} y={H - 15} fontFamily="var(--font-sans)" fontSize={15} fontWeight={600} style={{ fill: 'var(--fg)' }}>
            {magnetism}
          </text>
        </g>
      )}
    </g>
  )
})

function Header({ x, label }: { x: number; label: string }) {
  return (
    <text x={x} y={22} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={15} fontWeight={600} style={{ fill: 'var(--fg)' }}>
      {label}
    </text>
  )
}
