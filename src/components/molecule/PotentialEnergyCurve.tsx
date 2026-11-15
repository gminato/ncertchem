import React, { forwardRef, useMemo } from 'react'
import { Label } from '../vocab/Label'
import { H2_MORSE, morseCurve, morseEnergy, type MorseParams } from './morse'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const PE_CURVE_SIZE = { width: 360, height: 262 } as const

const PLOT = { left: 72, right: 344, top: 52, bottom: 216 }
const R_MIN = 30
const R_MAX = 240
const E_MAX = 200
const E_MIN = -560
const TICK_SIZE = 13

function px(r: number): number {
  return PLOT.left + ((r - R_MIN) / (R_MAX - R_MIN)) * (PLOT.right - PLOT.left)
}

function py(e: number): number {
  return PLOT.top + ((E_MAX - e) / (E_MAX - E_MIN)) * (PLOT.bottom - PLOT.top)
}

/** Writes a number with a true minus sign (U+2212). */
function signed(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n)
}

export interface PotentialEnergyCurveProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Internuclear distance of the moving marker, in pm. Defaults to the bond length. */
  distance?: number
  /** Morse parameters for the bond. Defaults to H–H. */
  params?: MorseParams
  x?: number
  y?: number
}

/**
 * Energy against internuclear distance for the formation of a diatomic bond. Far apart the
 * energy is zero; as the atoms approach it falls to a minimum, which marks the bond length
 * (horizontal) and the bond enthalpy (vertical). The moving marker shows the energy at `distance`.
 */
export const PotentialEnergyCurve = forwardRef<SVGGElement, PotentialEnergyCurveProps>(function PotentialEnergyCurve(
  { distance, params = H2_MORSE, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const bondLength = params.re
  const minEnergy = -params.de
  const markerR = distance ?? bondLength
  const markerE = morseEnergy(markerR, params)

  const path = useMemo(() => {
    const pts = morseCurve(params, R_MIN, R_MAX, 120).map((p) => ({ x: px(p.r), y: py(Math.max(p.e, E_MIN)) }))
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  }, [params])

  const minX = px(bondLength)
  const minY = py(minEnergy)
  const zeroY = py(0)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      {/* Axes */}
      <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />

      {/* Distance ticks and title */}
      {[60, 120, 180, 240].map((r) => (
        <g key={`rt-${r}`}>
          <line x1={px(r)} y1={PLOT.bottom} x2={px(r)} y2={PLOT.bottom + 4} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={px(r)} y={PLOT.bottom + 16} fontSize={TICK_SIZE} fill="var(--fg-muted)">
            {r}
          </Label>
        </g>
      ))}
      <Label x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 36} fontSize={TICK_SIZE + 1} fill="var(--fg)">
        <tspan className="sym">r</tspan> / pm, internuclear distance
      </Label>

      {/* Energy ticks, with horizontal title above the axis */}
      {[0, -200, -400].map((e) => (
        <g key={`et-${e}`}>
          <line x1={PLOT.left - 4} y1={py(e)} x2={PLOT.left} y2={py(e)} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={PLOT.left - 8} y={py(e)} textAnchor="end" fontSize={TICK_SIZE} fill="var(--fg-muted)">
            {signed(e)}
          </Label>
        </g>
      ))}
      <Label x={PLOT.left - 8} y={PLOT.top - 22} textAnchor="start" fontSize={TICK_SIZE + 1} fill="var(--fg)">
        <tspan className="sym">E</tspan> / kJ mol⁻¹
      </Label>

      {/* Zero: the atoms far apart */}
      <line x1={PLOT.left} y1={zeroY} x2={PLOT.right} y2={zeroY} strokeWidth={0.9} strokeDasharray="3 3" style={{ stroke: 'var(--fg-subtle)' }} />

      {/* The bond length and bond enthalpy at the minimum */}
      <line x1={minX} y1={minY} x2={minX} y2={PLOT.bottom} strokeWidth={1} strokeDasharray="2 3" style={{ stroke: 'var(--fg-muted)' }} />
      <line x1={PLOT.left} y1={minY} x2={minX} y2={minY} strokeWidth={1} strokeDasharray="2 3" style={{ stroke: 'var(--fg-muted)' }} />
      <Label x={minX + 7} y={PLOT.bottom - 9} textAnchor="start" fontSize={TICK_SIZE} fill="var(--fg)" data-testid="bond-length">
        {`bond length ${bondLength} pm`}
      </Label>
      <Label x={PLOT.right} y={PLOT.top - 22} textAnchor="end" fontSize={TICK_SIZE} fill="var(--fg)" data-testid="bond-enthalpy">
        {`bond enthalpy ${params.de} kJ mol⁻¹`}
      </Label>

      {/* The curve */}
      <path d={path} fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--accent)' }} />

      {/* The minimum */}
      <circle cx={minX} cy={minY} r={4} style={{ fill: 'var(--accent)', stroke: 'var(--surface)' }} strokeWidth={1.5} />

      {/* The moving marker */}
      <line x1={px(markerR)} y1={py(markerE)} x2={px(markerR)} y2={PLOT.bottom} strokeWidth={0.9} style={{ stroke: 'var(--fg-subtle)' }} />
      <circle cx={px(markerR)} cy={py(markerE)} r={5.5} style={{ fill: 'var(--proton)', stroke: 'var(--surface)' }} strokeWidth={1.5} data-testid="pe-marker" />
    </g>
  )
})
