'use client'

import { useId } from 'react'
import { Label } from '@/components/vocab'
import { phGradientStops, phTint, powerOfTen } from '@/components/equilibrium/geometry'

export interface PhAxisProps {
  /** Left and right ends of the bar, in SVG units. The bar spans pH 0 to pH 14 between them. */
  x0: number
  x1: number
  /** Top of the bar. */
  y: number
  /** pH the pointer marks. */
  pH: number
  /** Neutral pH of the current temperature, drawn as a dashed line. */
  neutralPH: number
  /** Caption under the neutral line. */
  neutralCaption: string
  /** Bar height in SVG units. */
  height?: number
  /** Callout text above the pointer, e.g. "pH 2.00". */
  callout: string
  /** Substances placed on the bar as dots, each at its pH. */
  markers?: readonly { pH: number; name: string }[]
}

/** pH of a point on the bar, clamped to 0 to 14. */
export function xOfPH(pH: number, x0: number, x1: number): number {
  return x0 + (Math.min(14, Math.max(0, pH)) / 14) * (x1 - x0)
}

/**
 * The 0 to 14 pH bar on the universal-indicator gradient, with integer pH ticks, a second row of
 * [H₃O⁺] powers of ten at every second pH, a dashed neutral line and a pointer with a callout.
 * Ticks are at integer pH, so [H₃O⁺] = 10⁻ⁿ falls exactly under pH n.
 */
export function PhAxis({ x0, x1, y, pH, neutralPH, neutralCaption, height = 28, callout, markers = [] }: PhAxisProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const gradId = `ph-axis-${uid}`
  const px = xOfPH(pH, x0, x1)
  const nx = xOfPH(neutralPH, x0, x1)
  const calloutW = 112
  const calloutX = Math.min(x1 - calloutW / 2, Math.max(x0 + calloutW / 2, px))
  return (
    <g data-testid="ph-axis">
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          {phGradientStops().map((s) => (
            <stop key={s.offset} offset={s.offset} style={{ stopColor: s.token }} />
          ))}
        </linearGradient>
      </defs>

      <Label x={x0 - 14} y={y + height / 2} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
        pH
      </Label>
      <Label x={12} y={y + height + 46} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
        <tspan className="sym">[H₃O⁺]</tspan>
      </Label>

      <rect x={x0} y={y} width={x1 - x0} height={height} rx={height / 2} fill={`url(#${gradId})`} stroke="var(--border)" strokeWidth={1} />

      {Array.from({ length: 15 }, (_, n) => {
        const tx = xOfPH(n, x0, x1)
        return (
          <g key={`tick-${n}`}>
            <line x1={tx} x2={tx} y1={y + height} y2={y + height + 5} stroke="var(--fg-muted)" strokeWidth={1} />
            <Label x={tx} y={y + height + 20} fontSize={14} fill="var(--fg-muted)">
              {n}
            </Label>
            {n % 2 === 0 && (
              <Label x={tx} y={y + height + 46} fontSize={14} fill="var(--fg-muted)">
                {powerOfTen(-n)}
              </Label>
            )}
          </g>
        )
      })}

      <line x1={nx} x2={nx} y1={y - 6} y2={y + height + 6} stroke="var(--fg)" strokeWidth={1.4} strokeDasharray="4 4" />
      <Label x={nx} y={y + height + 74} fontSize={14} fill="var(--fg)" fontWeight={600}>
        {neutralCaption}
      </Label>

      {markers.map((m) => (
        <circle key={m.name} cx={xOfPH(m.pH, x0, x1)} cy={y - 17} r={5} fill={phTint(m.pH)} stroke="var(--fg)" strokeWidth={1.2}>
          <title>{`${m.name}: pH ${m.pH}`}</title>
        </circle>
      ))}

      <line x1={px} x2={px} y1={y - 9} y2={y + height + 2} stroke="var(--fg)" strokeWidth={2.4} />
      <polygon points={`${px},${y + 2} ${px - 7},${y - 9} ${px + 7},${y - 9}`} fill="var(--fg)" />
      <rect x={calloutX - calloutW / 2} y={y - 50} width={calloutW} height={24} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <Label x={calloutX} y={y - 38} fontSize={15} fill="var(--fg)" fontWeight={700}>
        {callout}
      </Label>
    </g>
  )
}
