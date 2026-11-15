import React, { forwardRef, useId } from 'react'
import { latticeField, type Point } from '../thermo/geometry'
import { particleLayout } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const SEALED_VESSEL_SIZE = { width: 360, height: 286 } as const

const FLASK = { x0: 36, x1: 236, top: 30, bottom: 232 }
const PARTICLE_R = 5
const MIN_DIST = 14
const SURFACE_Y = 150
const SOLID_TOP = 196
const GAUGE = { cx: 300, cy: 104, r: 36 }

export interface VesselSpecies {
  id: string
  /** A CSS colour, normally a token such as var(--no2). */
  color: string
  /** Which phase the species lives in: gas above the surface, liquid below it, or a solid at the bottom. */
  phase: 'gas' | 'liquid' | 'solid'
  /** Legend text, e.g. a formula. Shown under the vessel. */
  label?: React.ReactNode
}

export interface SealedVesselProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Up to three species. Each gets its own colour in the particle layout. */
  species: readonly VesselSpecies[]
  /** Particle count for each species, in the same order as `species`. */
  counts: readonly number[]
  /** Seed for the particle positions. Same seed, same picture. */
  seed?: number
  /** Draws a liquid phase in the lower part of the flask. */
  liquid?: boolean
  /** Draws a solid phase at the bottom, below the liquid when both are shown. */
  solid?: boolean
  /** Arrows showing particles leaving and returning across a phase boundary. */
  exchange?: 'none' | 'evaporation' | 'dissolution'
  /** Pressure gauge on the right. `fraction` runs from 0 to 1 across the dial. */
  gauge?: { fraction: number; label: React.ReactNode }
  /** Accessible name for the whole vessel. */
  title?: string
  x?: number
  y?: number
}

/** Point on the dial at a fraction 0..1, sweeping 270° from lower left to lower right. */
function dialPoint(fraction: number, r: number): Point {
  const deg = -135 + Math.min(1, Math.max(0, fraction)) * 270
  const rad = (deg * Math.PI) / 180
  return { x: GAUGE.cx + r * Math.sin(rad), y: GAUGE.cy - r * Math.cos(rad) }
}

function arcPath(from: number, to: number, r: number): string {
  const a = dialPoint(from, r)
  const b = dialPoint(to, r)
  const large = to - from > 0.5 ? 1 : 0
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`
}

/**
 * A closed flask with gas above, liquid and solid below, and deterministic particles of
 * up to three species. Optional arrows show particles crossing the surface (evaporation,
 * condensation) or the solid face (dissolution, crystallisation), and a dial shows pressure.
 */
export const SealedVessel = forwardRef<SVGGElement, SealedVesselProps>(function SealedVessel(
  {
    species,
    counts,
    seed = 1,
    liquid = false,
    solid = false,
    exchange = 'none',
    gauge,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fwdId = `sv-fwd-${uid}`
  const revId = `sv-rev-${uid}`
  const sp = species.slice(0, 3)

  const gasBottom = liquid ? SURFACE_Y - 10 : FLASK.bottom - 10
  const liquidBottom = solid ? SOLID_TOP - 8 : FLASK.bottom - 8

  const placed = (() => {
    const gasBox = { x0: FLASK.x0 + 16, x1: FLASK.x1 - 16, y0: FLASK.top + 14, y1: gasBottom }
    const liqBox = { x0: FLASK.x0 + 16, x1: FLASK.x1 - 16, y0: SURFACE_Y + 14, y1: liquidBottom }
    const solBox = { x0: FLASK.x0 + 24, x1: FLASK.x1 - 24, y0: SOLID_TOP + 8, y1: FLASK.bottom - 8 }
    return sp.map((s, i) => {
      const n = Math.max(0, counts[i] ?? 0)
      const salt = seed * 31 + i * 97
      if (s.phase === 'solid') {
        const cols = Math.max(1, Math.ceil(Math.sqrt(n * 2)))
        const rows = Math.max(1, Math.ceil(n / cols))
        return latticeField(cols, rows, solBox, 0.06, salt).slice(0, n)
      }
      const box = s.phase === 'gas' ? gasBox : liqBox
      return particleLayout(n, box, salt, MIN_DIST)
    })
  })()

  const arrowsY = exchange === 'evaporation' ? SURFACE_Y : SOLID_TOP
  const showExchange = exchange !== 'none' && (exchange === 'evaporation' ? liquid : solid)

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      role="img"
      aria-label={title ?? 'Sealed vessel'}
      {...rest}
    >
      <defs>
        <marker id={fwdId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--fwd)" />
        </marker>
        <marker id={revId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--rev)" />
        </marker>
      </defs>

      {/* Stopper */}
      <rect x={110} y={10} width={52} height={FLASK.top - 10 + 4} rx={4} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.4} />

      {/* Glass body */}
      <rect
        x={FLASK.x0}
        y={FLASK.top}
        width={FLASK.x1 - FLASK.x0}
        height={FLASK.bottom - FLASK.top}
        rx={18}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2}
      />

      {/* Liquid */}
      {liquid && (
        <g>
          <rect
            x={FLASK.x0 + 1}
            y={SURFACE_Y}
            width={FLASK.x1 - FLASK.x0 - 2}
            height={FLASK.bottom - SURFACE_Y - 1}
            fill="var(--liquid)"
          />
          <line x1={FLASK.x0 + 1} x2={FLASK.x1 - 1} y1={SURFACE_Y} y2={SURFACE_Y} stroke="var(--liquid-edge)" strokeWidth={1.6} />
        </g>
      )}

      {/* Solid bed */}
      {solid && (
        <rect
          x={FLASK.x0 + 1}
          y={SOLID_TOP}
          width={FLASK.x1 - FLASK.x0 - 2}
          height={FLASK.bottom - SOLID_TOP - 1}
          fill="var(--precipitate)"
          opacity={0.9}
        />
      )}

      {/* Particles */}
      {sp.map((s, i) =>
        (placed[i] ?? []).map((p, j) => (
          <circle
            key={`${s.id}-${j}`}
            cx={p.x}
            cy={p.y}
            r={PARTICLE_R}
            fill={s.color}
            stroke="var(--surface)"
            strokeWidth={1}
          />
        ))
      )}

      {/* Exchange arrows: forward (--fwd) leaves, reverse (--rev) returns */}
      {showExchange && (
        <g>
          <line x1={104} y1={arrowsY + 22} x2={104} y2={arrowsY - 24} stroke="var(--fwd)" strokeWidth={2.4} markerEnd={`url(#${fwdId})`} />
          <line x1={150} y1={arrowsY - 24} x2={150} y2={arrowsY + 22} stroke="var(--rev)" strokeWidth={2.4} markerEnd={`url(#${revId})`} />
        </g>
      )}

      {/* Pressure gauge */}
      {gauge && (
        <g>
          <circle cx={GAUGE.cx} cy={GAUGE.cy} r={GAUGE.r + 6} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
          <path d={arcPath(0, 1, GAUGE.r)} fill="none" stroke="var(--border)" strokeWidth={4} strokeLinecap="round" />
          <path d={arcPath(0, Math.min(1, Math.max(0, gauge.fraction)), GAUGE.r)} fill="none" stroke="var(--fg-muted)" strokeWidth={4} strokeLinecap="round" />
          {(() => {
            const a = dialPoint(gauge.fraction, GAUGE.r - 8)
            return <line x1={GAUGE.cx} y1={GAUGE.cy} x2={a.x} y2={a.y} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
          })()}
          <circle cx={GAUGE.cx} cy={GAUGE.cy} r={3.5} fill="var(--fg)" />
          <text x={GAUGE.cx} y={GAUGE.cy + GAUGE.r + 26} textAnchor="middle" dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
            {gauge.label}
          </text>
        </g>
      )}

      {/* Legend */}
      {sp.some((s) => s.label) && (
        <g>
          {sp.map((s, i) => {
            const slot = 360 / (sp.length + 0.5)
            const cx = 180 + (i - (sp.length - 1) / 2) * slot
            return (
              <g key={`legend-${s.id}`} transform={`translate(${cx}, 266)`}>
                <circle cx={-34} cy={0} r={6} fill={s.color} stroke="var(--surface)" strokeWidth={1} />
                <text x={-22} y={0} dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
                  {s.label}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
})
