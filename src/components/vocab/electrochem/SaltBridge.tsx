import React, { forwardRef } from 'react'
import { bridgeCurve, driftAlong, type Point } from './geometry'

export interface SaltBridgeProps extends React.SVGAttributes<SVGGElement> {
  /** End inside the left half-cell. */
  start: Point
  /** End inside the right half-cell. */
  finish: Point
  /** Highest y of the arch (smaller is higher). */
  apex: number
  /** Tube width. */
  width?: number
  /** Draw cotton plugs at both ends. */
  plugs?: boolean
  /** Loop phase 0 to 1, set by the parent. Ions are still when it does not change. */
  t?: number
  /** Show drifting ions. */
  ions?: boolean
  /** Number of each ion type in the tube. */
  ionCount?: number
  /** Which end the cations (K⁺) drift towards. The anions drift the other way. */
  cationsTo?: 'from' | 'to'
  /** Caption above the arch, e.g. "KCl(aq) salt bridge". Pass it already formatted. */
  legend?: string
}

/**
 * An inverted-U salt bridge filled with KCl gel. Cations and anions drift in
 * opposite directions along the tube, toward the half-cell that needs them.
 */
export const SaltBridge = forwardRef<SVGGElement, SaltBridgeProps>(function SaltBridge(
  { start, finish, apex, width = 30, plugs = true, t = 0, ions = true, ionCount = 4, cationsTo = 'to', legend, className, ...rest },
  ref
) {
  const curve = bridgeCurve(start, finish, apex)
  const cationsForward = cationsTo === 'to'
  const cations = ions ? driftAlong(curve.points, ionCount, t, cationsForward) : []
  const anions = ions ? driftAlong(curve.points, ionCount, t + 0.5 / ionCount, !cationsForward) : []
  const midX = (start.x + finish.x) / 2

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      {/* Glass-like outer wall, then the gel */}
      <path d={curve.d} fill="none" stroke="var(--glass-wall)" strokeWidth={width + 4} strokeLinecap="round" />
      <path d={curve.d} fill="none" stroke="var(--salt-bridge)" strokeWidth={width} strokeLinecap="round" />
      <path
        d={curve.d}
        fill="none"
        stroke="var(--glass-sheen)"
        strokeOpacity={0.5}
        strokeWidth={3}
        strokeLinecap="round"
        transform={`translate(0 ${-width / 4})`}
      />
      {plugs &&
        [start, finish].map((p, i) => (
          <rect
            key={i}
            x={p.x - (width + 8) / 2}
            y={p.y - 6}
            width={width + 8}
            height={12}
            rx={4}
            fill="var(--surface)"
            stroke="var(--glass-wall)"
            strokeWidth={1.4}
          />
        ))}
      {cations.map((p, i) => (
        <circle key={`c${i}`} cx={p.x} cy={p.y} r={5} fill="var(--ion-cation)" stroke="var(--surface)" strokeWidth={1.2} />
      ))}
      {anions.map((p, i) => (
        <circle key={`a${i}`} cx={p.x} cy={p.y} r={5} fill="var(--ion-anion)" stroke="var(--surface)" strokeWidth={1.2} />
      ))}
      {legend && (
        <text x={midX} y={apex - width / 2 - 10} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {legend}
        </text>
      )}
    </g>
  )
})
