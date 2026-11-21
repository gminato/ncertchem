import React, { forwardRef } from 'react'
import { Beaker, beakerGeometry } from './Beaker'
import { GasBubbles } from './Ion'
import { METAL_FILL } from './materials'

export interface HydrogenElectrodeProps extends React.SVGAttributes<SVGGElement> {
  /** Top-left corner of the outer beaker. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Loop phase 0 to 1 for the H₂ bubbles. */
  t?: number
  /** Caption under the beaker, e.g. "1 M H⁺(aq)". Pass it already formatted. */
  label?: string
  /** Caption at the gas inlet, e.g. "H₂ (1 bar)". Pass it already formatted. */
  gasLabel?: string
}

/**
 * The standard hydrogen electrode: a platinised Pt foil in 1 M H⁺(aq), inside a
 * glass jacket that H₂ at 1 bar flows into. It is a fixed drawing; `t` only moves the bubbles.
 */
export const HydrogenElectrode = forwardRef<SVGGElement, HydrogenElectrodeProps>(function HydrogenElectrode(
  { x = 0, y = 0, width = 170, height = 200, t = 0, label, gasLabel, className, ...rest },
  ref
) {
  const g = beakerGeometry({ x, y, width, height, level: 0.74 })
  const cx = g.centreX
  const jacketW = 36
  const jacketTop = y - 44
  const jacketBottom = g.liquidTop + 46
  const foilTop = g.liquidTop + 22
  const foilH = 44
  const stipple = Array.from({ length: 22 }, (_, i) => {
    const gx = cx - 7 + ((i * 37) % 15)
    const gy = foilTop + 3 + ((i * 53) % (foilH - 6))
    return { gx, gy }
  })
  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <Beaker x={x} y={y} width={width} height={height} level={0.74} tint="clear" label={label} />
      {/* Jacket: a glass tube dipping into the solution, open at the bottom */}
      <rect
        x={cx - jacketW / 2}
        y={jacketTop}
        width={jacketW}
        height={jacketBottom - jacketTop}
        rx={6}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={1.8}
      />
      <line
        x1={cx - jacketW / 2 + 5}
        x2={cx - jacketW / 2 + 5}
        y1={jacketTop + 10}
        y2={jacketBottom - 16}
        stroke="var(--glass-sheen)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* Gas inlet at the top of the jacket, with H₂ flowing in from the right */}
      <path d={`M${cx + jacketW / 2} ${jacketTop + 26} H${cx + 62}`} stroke="var(--glass-wall)" strokeWidth={6} strokeLinecap="round" />
      <path d={`M${cx + jacketW / 2} ${jacketTop + 26} H${cx + 62}`} stroke="var(--glass-fill)" strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M${cx + 44} ${jacketTop + 20} L${cx + 50} ${jacketTop + 26} L${cx + 44} ${jacketTop + 32}`} fill="none" stroke="var(--fg-muted)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {gasLabel && (
        <text x={cx + 66} y={jacketTop + 31} fontSize={14} fill="var(--fg)">
          {gasLabel}
        </text>
      )}
      {/* Pt wire up through the jacket, and the platinised foil */}
      <line x1={cx} x2={cx} y1={jacketTop - 26} y2={foilTop} stroke="var(--metal-pt)" strokeWidth={3} />
      <rect x={cx - 14} y={foilTop} width={28} height={foilH} rx={2} fill={METAL_FILL.pt} stroke="var(--glass-wall)" strokeWidth={1.2} />
      {stipple.map((p, i) => (
        <circle key={i} cx={p.gx} cy={p.gy} r={1.3} fill="var(--fg-subtle)" fillOpacity={0.55} />
      ))}
      <GasBubbles x={cx} y={foilTop} width={18} height={jacketTop + 30 - foilTop} count={4} t={t} />
    </g>
  )
})
