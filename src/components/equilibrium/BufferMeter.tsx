import React, { forwardRef } from 'react'
import { phTint } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const BUFFER_METER_SIZE = { width: 420, height: 236 } as const

const METER_ANGLE = 70

/** Needle angle for a pH from 0 (far left) to 14 (far right), in degrees from vertical. */
export function needleAngle(pH: number): number {
  const p = Math.min(14, Math.max(0, pH))
  return -METER_ANGLE + (p / 14) * 2 * METER_ANGLE
}

export interface BufferMeterProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Strong acid (or base, if negative) added, in mmol. */
  added: number
  /** pH of pure water after the addition. */
  pHWater: number
  /** pH of the buffer after the same addition. */
  pHBuffer: number
  title?: string
  x?: number
  y?: number
}

interface MeterProps {
  cx: number
  cy: number
  pH: number
  label: React.ReactNode
}

function Meter({ cx, cy, pH, label }: MeterProps) {
  const r = 58
  const arc = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const a = arc(-METER_ANGLE)
  const b = arc(METER_ANGLE)
  const needle = needleAngle(pH)
  const tip = (() => {
    const rad = ((needle - 90) * Math.PI) / 180
    return { x: cx + (r - 12) * Math.cos(rad), y: cy + (r - 12) * Math.sin(rad) }
  })()
  return (
    <g>
      <path
        d={`M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`}
        fill="none"
        stroke="var(--border)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="var(--fg)" />
      <text x={a.x - 4} y={a.y + 8} textAnchor="end" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>0</text>
      <text x={b.x + 4} y={b.y + 8} textAnchor="start" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>14</text>
      <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
        {pH.toFixed(1)}
      </text>
      <text x={cx} y={cy + 46} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
        {label}
      </text>
    </g>
  )
}

interface BeakerProps {
  x: number
  tint: string
}

function SmallBeaker({ x, tint }: BeakerProps) {
  const top = 164
  const bottom = 226
  return (
    <g>
      <path
        d={`M ${x - 46} ${top} L ${x - 46} ${bottom - 12} Q ${x - 46} ${bottom} ${x - 34} ${bottom} L ${x + 34} ${bottom} Q ${x + 46} ${bottom} ${x + 46} ${bottom - 12} L ${x + 46} ${top}`}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <rect x={x - 45} y={top + 22} width={90} height={bottom - top - 33} fill={tint} opacity={0.55} style={{ transition: 'fill 0.4s ease' }} />
    </g>
  )
}

/**
 * Two beakers and two needle meters: water and a buffer, each given the same strong acid.
 * Water's pH drops sharply; the buffer barely moves. Both meters read 0 to 14.
 */
export const BufferMeter = forwardRef<SVGGElement, BufferMeterProps>(function BufferMeter(
  { added, pHWater, pHBuffer, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const sign = added < 0 ? 'base' : 'acid'
  const amount = Math.abs(added)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Water and buffer pH after the same addition'} {...rest}>
      <text x={210} y={22} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
        Added {amount.toFixed(1)} mmol strong {sign}
      </text>

      <Meter cx={105} cy={100} pH={pHWater} label="water" />
      <Meter cx={315} cy={100} pH={pHBuffer} label="buffer" />

      <SmallBeaker x={105} tint={phTint(pHWater)} />
      <SmallBeaker x={315} tint={phTint(pHBuffer)} />
    </g>
  )
})
