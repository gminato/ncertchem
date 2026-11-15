import React, { forwardRef } from 'react'
import { tiltAngle } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const LE_CHATELIER_SIZE = { width: 360, height: 262 } as const

const PIVOT = { x: 180, y: 84 }
const ARM = 118
const HANG = 56

export type LeChatelierStress =
  | 'none'
  | 'add-reactant'
  | 'remove-reactant'
  | 'add-product'
  | 'remove-product'
  | 'compress'
  | 'expand'
  | 'heat'
  | 'cool'

const STRESS_TEXT: Record<LeChatelierStress, string> = {
  none: 'equilibrium',
  'add-reactant': 'add reactant',
  'remove-reactant': 'remove reactant',
  'add-product': 'add product',
  'remove-product': 'remove product',
  compress: 'compress',
  expand: 'expand',
  heat: 'heat',
  cool: 'cool',
}

export interface LeChatelierScaleProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The stress applied to the equilibrium. */
  stress?: LeChatelierStress
  /**
   * Which way the system shifts. Set it for compress, expand, heat and cool.
   * Adding a reactant or removing a product shifts to products by default, and the reverse otherwise.
   */
  shift?: 'products' | 'reactants'
  /** 0 = the beam shows the full stress, 1 = the beam has partly re-levelled as the system shifts. */
  progress?: number
  /** Formula or name for the reactant pan, for example "N₂ + 3H₂". */
  reactantLabel?: React.ReactNode
  /** Formula or name for the product pan, for example "2NH₃". */
  productLabel?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

/** Beam tilt side for each stress: -1 left pan down, +1 right pan down. Energy and volume stresses tip towards the favoured side. */
function tiltSide(stress: LeChatelierStress, shift: 'products' | 'reactants'): -1 | 0 | 1 {
  switch (stress) {
    case 'add-reactant':
    case 'remove-product':
      return -1
    case 'add-product':
    case 'remove-reactant':
      return 1
    case 'none':
      return 0
    default:
      return shift === 'products' ? 1 : -1
  }
}

function defaultShift(stress: LeChatelierStress): 'products' | 'reactants' {
  if (stress === 'add-reactant' || stress === 'remove-product') return 'products'
  if (stress === 'add-product' || stress === 'remove-reactant') return 'reactants'
  return 'products'
}

/** Dot count on each pan, so that the stressed pan visibly carries more material. */
function panLoads(stress: LeChatelierStress): { left: number; right: number } {
  const base = 4
  switch (stress) {
    case 'add-reactant':
      return { left: base + 3, right: base }
    case 'remove-reactant':
      return { left: base - 2, right: base }
    case 'add-product':
      return { left: base, right: base + 3 }
    case 'remove-product':
      return { left: base, right: base - 2 }
    default:
      return { left: base, right: base }
  }
}

function dotPositions(n: number): Array<{ x: number; y: number }> {
  // Four columns straddle the hanger line (x = 0) so no dot sits on it.
  const cols = 4
  return Array.from({ length: n }, (_, i) => ({
    x: (i % cols) * 11 - 16.5,
    y: -Math.floor(i / cols) * 10 - 6,
  }))
}

/** A two-pan balance that tips under stress and partly re-levels as the equilibrium shifts. */
export const LeChatelierScale = forwardRef<SVGGElement, LeChatelierScaleProps>(function LeChatelierScale(
  {
    stress = 'none',
    shift,
    progress = 1,
    reactantLabel = 'Reactants',
    productLabel = 'Products',
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const shiftTo = shift ?? defaultShift(stress)
  const side = tiltSide(stress, shiftTo)
  const angle = tiltAngle(side, progress)
  const rad = (angle * Math.PI) / 180
  const loads = panLoads(stress)

  // World position of a point on the beam at local x (lx) and hang depth (ly).
  const world = (lx: number, ly: number) => ({
    x: PIVOT.x + lx * Math.cos(rad) - ly * Math.sin(rad),
    y: PIVOT.y + lx * Math.sin(rad) + ly * Math.cos(rad),
  })
  const leftPan = world(-ARM, HANG)
  const rightPan = world(ARM, HANG)

  const pan = (lx: number, load: number, color: string) => (
    <g>
      <line x1={lx} y1={0} x2={lx} y2={HANG} stroke="var(--fg-muted)" strokeWidth={1.4} />
      <path d={`M ${lx - 50} ${HANG} L ${lx + 50} ${HANG} Q ${lx} ${HANG + 34} ${lx - 50} ${HANG} Z`} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={1.6} strokeLinejoin="round" />
      <g transform={`translate(${lx}, ${HANG})`}>
        {dotPositions(load).map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={4.2} fill={color} />
        ))}
      </g>
    </g>
  )

  const shiftText = shiftTo === 'products' ? 'shift → products' : 'shift → reactants'
  const top = stress === 'none' ? 'equilibrium' : `stress: ${STRESS_TEXT[stress]}`

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Balance showing reactants and products under stress'} {...rest}>
      {/* Stress label */}
      <text x={PIVOT.x} y={18} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
        {top}
      </text>

      {/* Stand */}
      <rect x={PIVOT.x - 46} y={PIVOT.y + 50} width={92} height={8} rx={4} fill="var(--fg-subtle)" opacity={0.6} />
      <polygon points={`${PIVOT.x},${PIVOT.y + 1} ${PIVOT.x - 12},${PIVOT.y + 46} ${PIVOT.x + 12},${PIVOT.y + 46}`} fill="var(--fg-muted)" />

      {/* Beam and pans */}
      <g transform={`translate(${PIVOT.x}, ${PIVOT.y}) rotate(${angle})`}>
        <rect x={-ARM - 8} y={-3} width={2 * ARM + 16} height={6} rx={3} fill="var(--fg-muted)" />
        <circle r={5} fill="var(--fg)" />
        {pan(-ARM, loads.left, 'var(--accent)')}
        {pan(ARM, loads.right, 'var(--fwd)')}
      </g>

      {/* Pan labels */}
      <text x={leftPan.x} y={leftPan.y + 50} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)" style={{ userSelect: 'none' }}>
        {reactantLabel}
      </text>
      <text x={rightPan.x} y={rightPan.y + 50} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fwd)" style={{ userSelect: 'none' }}>
        {productLabel}
      </text>

      {/* Shift pill */}
      <g transform="translate(180, 240)">
        <rect x={-88} y={-13} width={176} height={26} rx={13} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
          {stress === 'none' ? 'balanced' : shiftText}
        </text>
      </g>
    </g>
  )
})
