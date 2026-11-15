'use client'

import { useId } from 'react'
import { particleLayout } from '@/components/equilibrium/geometry'

/** Native size of the open dish, the same frame as SealedVessel (360 × 286). */
export const OPEN_DISH_SIZE = { width: 360, height: 286 } as const

const DISH = { x0: 70, x1: 290, top: 84, bottom: 236, surface: 156 }
const PARTICLE_R = 5

/**
 * Water in an open dish. Nothing closes the top, so vapour spreads into the room: the
 * drawing shows a few vapour particles drifting up and out, a small return arrow, and
 * the label that says no equilibrium forms. Native size is OPEN_DISH_SIZE; parents scale it.
 */
export function OpenDish({ title = 'Open dish of water' }: { title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fwdId = `od-fwd-${uid}`
  const revId = `od-rev-${uid}`
  const liquid = particleLayout(12, { x0: DISH.x0 + 18, x1: DISH.x1 - 18, y0: DISH.surface + 14, y1: DISH.bottom - 14 }, 7, 14)
  const vapour = particleLayout(4, { x0: 40, x1: 320, y0: 40, y1: 128 }, 11, 30)

  return (
    <g role="img" aria-label={title} data-testid="open-dish">
      <defs>
        <marker id={fwdId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--fwd)" />
        </marker>
        <marker id={revId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill="var(--rev)" />
        </marker>
      </defs>

      {/* Dish: an open top, so no lid or stopper */}
      <path
        d={`M ${DISH.x0} ${DISH.top} L ${DISH.x0 + 6} ${DISH.bottom - 14} Q ${DISH.x0 + 10} ${DISH.bottom} ${DISH.x0 + 30} ${DISH.bottom} L ${DISH.x1 - 30} ${DISH.bottom} Q ${DISH.x1 - 10} ${DISH.bottom} ${DISH.x1 - 6} ${DISH.bottom - 14} L ${DISH.x1} ${DISH.top}`}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2}
      />
      <path
        d={`M ${DISH.x0 + 2} ${DISH.surface} L ${DISH.x1 - 2} ${DISH.surface} L ${DISH.x1 - 6} ${DISH.bottom - 14} Q ${DISH.x1 - 10} ${DISH.bottom - 1} ${DISH.x1 - 30} ${DISH.bottom - 1} L ${DISH.x0 + 30} ${DISH.bottom - 1} Q ${DISH.x0 + 10} ${DISH.bottom - 1} ${DISH.x0 + 6} ${DISH.bottom - 14} Z`}
        fill="var(--liquid)"
      />
      <line x1={DISH.x0 + 2} x2={DISH.x1 - 2} y1={DISH.surface} y2={DISH.surface} strokeWidth={1.6} style={{ stroke: 'var(--liquid-edge)' }} />

      {liquid.map((p, i) => (
        <circle key={`l-${i}`} cx={p.x} cy={p.y} r={PARTICLE_R} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1} />
      ))}
      {vapour.map((p, i) => (
        <circle key={`v-${i}`} cx={p.x} cy={p.y} r={PARTICLE_R - 1} fill="var(--liquid-edge)" opacity={0.85} />
      ))}

      {/* Evaporation leaves the surface; the return arrow is short and dashed */}
      <line x1={112} y1={DISH.surface - 18} x2={112} y2={DISH.surface - 58} stroke="var(--fwd)" strokeWidth={2.4} markerEnd={`url(#${fwdId})`} />
      <line x1={250} y1={DISH.surface - 56} x2={250} y2={DISH.surface - 22} stroke="var(--rev)" strokeWidth={1.6} strokeDasharray="4 4" markerEnd={`url(#${revId})`} />

      <text x={180} y={24} textAnchor="middle" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
        Open to the room
      </text>
      <text x={180} y={262} textAnchor="middle" dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
        Vapour escapes, so no equilibrium forms
      </text>
    </g>
  )
}
