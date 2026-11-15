import React, { forwardRef, useId } from 'react'
import { latticeField } from '../thermo/geometry'
import { particleLayout } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const SOLUBILITY_BEAKER_SIZE = { width: 240, height: 262 } as const

const BEAKER = { x0: 36, x1: 204, top: 36, bottom: 216 }
const LIQUID_TOP = 62
const SOLID_MAX = 46
const FALLBACK = ['var(--acid)', 'var(--base)', 'var(--fwd)']

export interface SolubilityIon {
  /** Ion symbol, e.g. Ag⁺ or Cl⁻. Use <span className="sym"> for symbols. */
  label: React.ReactNode
  /** Number of this ion in solution. */
  count: number
  /** Dot colour. Defaults to a distinct token per position. */
  color?: string
}

export interface SolubilityBeakerProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The ions in solution and how many of each. */
  ionCounts: readonly SolubilityIon[]
  /** Q against Ksp: below (more solid dissolves), equal (saturated), above (precipitate forms). */
  qVsKsp: 'below' | 'equal' | 'above'
  /** Amount of undissolved solid, 0 to 1. Grows when precipitate forms, shrinks when it dissolves. */
  solidAmount?: number
  seed?: number
  title?: string
  x?: number
  y?: number
}

const BADGE_TEXT: Record<SolubilityBeakerProps['qVsKsp'], { text: string; tone: string }> = {
  below: { text: 'Q < Ksp: more dissolves', tone: 'var(--fwd)' },
  equal: { text: 'Q = Ksp: saturated', tone: 'var(--fg)' },
  above: { text: 'Q > Ksp: precipitates', tone: 'var(--rev)' },
}

/**
 * A saturated solution over undissolved solid, with ions in solution. Two arrows show
 * dissolution and precipitation at the solid surface, and a badge reads Q against Ksp.
 */
export const SolubilityBeaker = forwardRef<SVGGElement, SolubilityBeakerProps>(function SolubilityBeaker(
  { ionCounts, qVsKsp, solidAmount = 0.5, seed = 3, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fwdId = `sb-fwd-${uid}`
  const revId = `sb-rev-${uid}`
  const sa = Math.min(1, Math.max(0, solidAmount))
  const solidH = SOLID_MAX * sa
  const solidTop = BEAKER.bottom - 6 - solidH
  const badge = BADGE_TEXT[qVsKsp]

  // Ions in solution, one dot per ion, in a region above the solid.
  const total = ionCounts.reduce((acc, ion) => acc + Math.max(0, ion.count), 0)
  const spots = particleLayout(total, { x0: BEAKER.x0 + 14, x1: BEAKER.x1 - 14, y0: LIQUID_TOP + 12, y1: solidTop - 10 }, seed, 16)
  const colored: Array<{ x: number; y: number; color: string }> = []
  let k = 0
  ionCounts.forEach((ion, i) => {
    for (let n = 0; n < Math.max(0, ion.count); n++) {
      const p = spots[k++]
      if (p) colored.push({ ...p, color: ion.color ?? FALLBACK[i % FALLBACK.length] })
    }
  })

  // Crystals: a lattice of small rotated squares that fills the solid region.
  const rows = Math.max(1, Math.round(sa * 3))
  const crystals = sa > 0 ? latticeField(8, rows, { x0: BEAKER.x0 + 8, x1: BEAKER.x1 - 8, y0: solidTop, y1: BEAKER.bottom - 8 }, 0.12, seed + 5) : []

  const legendSlot = 240 / Math.max(1, ionCounts.length)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? `Saturated solution, Q ${qVsKsp} Ksp`} {...rest}>
      <defs>
        <marker id={fwdId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--fwd)" />
        </marker>
        <marker id={revId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--rev)" />
        </marker>
      </defs>

      {/* Legend */}
      {ionCounts.map((ion, i) => (
        <g key={`lg-${i}`} transform={`translate(${legendSlot * i + legendSlot / 2}, 14)`} fontFamily="var(--font-sans)" fontSize={14} style={{ userSelect: 'none' }}>
          <circle cx={-30} cy={0} r={5} fill={ion.color ?? FALLBACK[i % FALLBACK.length]} />
          <text x={-20} y={0.5} dominantBaseline="central" fill="var(--fg)">
            {ion.label} × {ion.count}
          </text>
        </g>
      ))}

      {/* Beaker, solution and solid */}
      <path
        d={`M ${BEAKER.x0} ${BEAKER.top} L ${BEAKER.x0} ${BEAKER.bottom - 14} Q ${BEAKER.x0} ${BEAKER.bottom} ${BEAKER.x0 + 14} ${BEAKER.bottom} L ${BEAKER.x1 - 14} ${BEAKER.bottom} Q ${BEAKER.x1} ${BEAKER.bottom} ${BEAKER.x1} ${BEAKER.bottom - 14} L ${BEAKER.x1} ${BEAKER.top}`}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect x={BEAKER.x0 + 1} y={LIQUID_TOP} width={BEAKER.x1 - BEAKER.x0 - 2} height={BEAKER.bottom - LIQUID_TOP - 1} fill="var(--liquid)" />
      <line x1={BEAKER.x0} x2={BEAKER.x1} y1={LIQUID_TOP} y2={LIQUID_TOP} stroke="var(--liquid-edge)" strokeWidth={1.4} />
      {solidH > 0 && (
        <rect x={BEAKER.x0 + 1} y={solidTop} width={BEAKER.x1 - BEAKER.x0 - 2} height={BEAKER.bottom - solidTop - 1} fill="var(--precipitate)" opacity={0.85} />
      )}
      {crystals.map((c, i) => (
        <rect
          key={`c-${i}`}
          x={c.x - 4}
          y={c.y - 4}
          width={8}
          height={8}
          fill="var(--precipitate)"
          stroke="var(--fg-subtle)"
          strokeWidth={0.8}
          transform={`rotate(${(i * 37) % 90} ${c.x} ${c.y})`}
        />
      ))}

      {/* Ions */}
      {colored.map((c, i) => (
        <circle key={`i-${i}`} cx={c.x} cy={c.y} r={4.6} fill={c.color} stroke="var(--surface)" strokeWidth={1} />
      ))}

      {/* Dissolution (forward, up into solution) and precipitation (reverse, down onto the solid) */}
      {sa > 0 && (
        <g>
          <line x1={92} y1={solidTop + 20} x2={92} y2={solidTop - 10} stroke="var(--fwd)" strokeWidth={2.4} markerEnd={`url(#${fwdId})`} />
          <line x1={148} y1={solidTop - 10} x2={148} y2={solidTop + 20} stroke="var(--rev)" strokeWidth={2.4} markerEnd={`url(#${revId})`} />
        </g>
      )}

      {/* Q against Ksp badge */}
      <g transform="translate(120, 244)">
        <rect x={-106} y={-12} width={212} height={24} rx={12} fill="var(--surface)" stroke={badge.tone} strokeWidth={1.4} />
        <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill={badge.tone} style={{ userSelect: 'none' }}>
          {badge.text}
        </text>
      </g>
    </g>
  )
})
