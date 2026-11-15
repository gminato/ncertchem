'use client'

import { Label } from '@/components/vocab'
import { formatSci } from '@/components/equilibrium/geometry'

export interface KwSeesawProps {
  /** Centre of the pivot, SVG units. */
  cx: number
  /** Pivot height, SVG units. */
  cy: number
  /** Half the beam length, SVG units. */
  half: number
  /** pH; the H₃O⁺ side sits lower when pH is below pOH. */
  pH: number
  /** pOH = pKw − pH. */
  pOH: number
  /** [H₃O⁺] and [OH⁻] in mol L⁻¹, for the pan labels. */
  hPlus: number
  oh: number
  /** Kw at the temperature, for the caption. */
  kwValue: number
  /** Temperature in K, for the caption. */
  temperatureK: number
}

/** Beam tilt in degrees per pH unit of imbalance (pOH − pH), clamped to ±14°. */
export function seesawAngle(pH: number, pOH: number): number {
  return Math.max(-14, Math.min(14, pOH - pH))
}

/**
 * A seesaw for Kw. Each pan carries a concentration on a log scale: H₃O⁺ on the left, OH⁻ on the
 * right. A ten-fold rise in [H₃O⁺] lowers [OH⁻] ten-fold, and the beam is level only when the two
 * are equal, which is neutral water. The pan labels counter-rotate so they stay upright.
 */
export function KwSeesaw({ cx, cy, half, pH, pOH, hPlus, oh, kwValue, temperatureK }: KwSeesawProps) {
  const angle = seesawAngle(pH, pOH)
  const tray = 12
  const verdict = Math.abs(pH - pOH) < 0.005 ? 'level: [H₃O⁺] = [OH⁻]' : pH < pOH ? 'H₃O⁺ side heavier' : 'OH⁻ side heavier'
  return (
    <g data-testid="kw-seesaw" data-angle={angle.toFixed(2)}>
      {/* Fixed stand */}
      <polygon points={`${cx},${cy} ${cx - 14},${cy + 30} ${cx + 14},${cy + 30}`} fill="var(--fg-muted)" />
      <rect x={cx - 60} y={cy + 30} width={120} height={6} rx={3} fill="var(--fg-muted)" />

      <g transform={`translate(${cx}, ${cy}) rotate(${-angle})`} style={{ transition: 'none' }}>
        <line x1={-half} x2={half} y1={0} y2={0} stroke="var(--fg)" strokeWidth={4} strokeLinecap="round" />
        {[-1, 1].map((side) => {
          const ex = side * half
          return (
            <g key={side}>
              <line x1={ex} x2={ex} y1={0} y2={tray} stroke="var(--fg-subtle)" strokeWidth={1.5} />
              <rect x={ex - 62} y={tray} width={124} height={12} rx={6} fill={side < 0 ? 'var(--acid)' : 'var(--base)'} opacity={0.9} />
              <g transform={`rotate(${angle} ${ex} ${tray + 28})`}>
                <Label x={ex} y={tray + 26} fontSize={15} fill="var(--fg)" textAnchor="middle">
                  <tspan className="sym">{side < 0 ? '[H₃O⁺]' : '[OH⁻]'}</tspan>
                </Label>
                <Label x={ex} y={tray + 46} fontSize={14} fill="var(--fg)" textAnchor="middle">
                  {formatSci(side < 0 ? hPlus : oh, 2)} M
                </Label>
              </g>
            </g>
          )
        })}
      </g>

      <circle cx={cx} cy={cy} r={6} fill="var(--fg)" />
      <Label x={cx} y={cy + 120} fontSize={15} fill="var(--fg)" fontWeight={600}>
        <tspan className="sym">K</tspan>
        <tspan dy="0.32em" fontSize="0.75em">w</tspan>
        <tspan dy="-0.32em"> = {formatSci(kwValue, 1)} at {Math.round(temperatureK)} K</tspan>
      </Label>
      <Label x={cx} y={cy + 142} fontSize={14} fill="var(--fg-muted)">
        {verdict}
      </Label>
    </g>
  )
}
