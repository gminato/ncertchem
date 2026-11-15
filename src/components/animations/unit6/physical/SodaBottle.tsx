'use client'

import { useId } from 'react'

/** Native size of the bottle drawing; parents scale it. */
export const SODA_BOTTLE_SIZE = { width: 360, height: 344 } as const
/** Shift that brings the cap clear of the top edge of the native frame. */
const DROP = 40

const BODY = { x0: 116, x1: 244, top: 112, bottom: 300 }
const NECK = { x0: 158, x1: 202, top: 44 }
const LIQUID_TOP = 136
const BUBBLE_COUNT = 16

/** Fixed bubble columns and starting phases, so the picture is the same on every render. */
const BUBBLES = Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
  x: BODY.x0 + 18 + ((i * 53) % 100) * ((BODY.x1 - BODY.x0 - 36) / 100),
  phase: ((i * 0.618) % 1),
  r: 2.6 + ((i * 7) % 4) * 0.6,
}))

export interface SodaBottleProps {
  /** 0 with the cap on, 1 with the cap lifted clear of the neck. */
  open: number
  /** Share of the bubbles still shown, 0 (none) to 1 (all): tracks the dissolved CO₂ that is left. */
  fizz: number
  /** Seconds since the cap came off. Drives the bubbles rising through the liquid. */
  time: number
  /** When true, the bubbles stay where they start. */
  reducedMotion?: boolean
  title?: string
}

/**
 * A soda bottle with a gas headspace above the liquid. Bubbles rise from the liquid while CO₂ is
 * leaving it; the cap lifts clear when the bottle is opened. The bubble count tracks the dissolved
 * CO₂ that is left (the `fizz` share), so the picture falls quiet as the solution comes to equilibrium with air.
 */
export function SodaBottle({ open, fizz, time, reducedMotion = false, title = 'Soda bottle' }: SodaBottleProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const capLift = Math.min(1, Math.max(0, open))
  const share = Math.min(1, Math.max(0, fizz))
  const bottleBottom = BODY.bottom
  // Bubbles travel in a band just above the bottom of the liquid and never reach the surface.
  const span = bottleBottom - 14 - (LIQUID_TOP + 20)
  const bubbleClip = `sb-clip-${uid}`
  const body = `M ${NECK.x0} ${NECK.top} L ${NECK.x0} 84 Q ${NECK.x0} ${BODY.top} ${BODY.x0 + 6} ${BODY.top} L ${BODY.x0} ${BODY.top + 8} L ${BODY.x0} ${BODY.bottom - 18} Q ${BODY.x0} ${BODY.bottom} ${BODY.x0 + 18} ${BODY.bottom} L ${BODY.x1 - 18} ${BODY.bottom} Q ${BODY.x1} ${BODY.bottom} ${BODY.x1} ${BODY.bottom - 18} L ${BODY.x1} ${BODY.top + 8} L ${BODY.x1 - 6} ${BODY.top} Q ${NECK.x1} ${BODY.top} ${NECK.x1} 84 L ${NECK.x1} ${NECK.top} Z`

  return (
    <g role="img" aria-label={title} data-testid="soda-bottle" transform={`translate(0, ${DROP})`}>
      <defs>
        <clipPath id={bubbleClip}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* Bottle body and neck */}
      <path d={body} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />

      {/* Liquid, with dissolved CO₂ shown as bubbles rising from the bottom */}
      <g clipPath={`url(#${bubbleClip})`}>
        <rect x={BODY.x0} y={LIQUID_TOP} width={BODY.x1 - BODY.x0} height={BODY.bottom - LIQUID_TOP} fill="var(--liquid)" />
        <line x1={BODY.x0} x2={BODY.x1} y1={LIQUID_TOP} y2={LIQUID_TOP} strokeWidth={1.4} style={{ stroke: 'var(--liquid-edge)' }} />
        {BUBBLES.map((b, i) => {
          const visible = (i + 0.5) / BUBBLE_COUNT <= share
          if (!visible) return null
          const along = reducedMotion ? 0 : time * 18
          const y = bottleBottom - 14 - ((b.phase * span + along) % span)
          return <circle key={`b-${i}`} cx={b.x} cy={y} r={b.r} fill="var(--liquid-edge)" opacity={0.9} />
        })}
      </g>

      {/* Cap: sits on the neck, then lifts clear and tilts when the bottle is opened */}
      <g transform={`translate(${-50 * capLift}, ${-34 * capLift}) rotate(${-28 * capLift} 180 ${NECK.top - 6})`}>
        <rect x={NECK.x0 - 8} y={NECK.top - 24} width={NECK.x1 - NECK.x0 + 16} height={24} rx={5} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.4} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <line key={`ridge-${k}`} x1={NECK.x0 - 4 + k * 8} x2={NECK.x0 - 4 + k * 8} y1={NECK.top - 20} y2={NECK.top - 4} strokeWidth={1} style={{ stroke: 'var(--glass-wall)' }} />
        ))}
      </g>
    </g>
  )
}
