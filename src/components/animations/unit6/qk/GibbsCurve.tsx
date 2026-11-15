'use client'

import { Label } from '@/components/vocab'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { R_J_PER_MOL_K } from '@/lib/chem/pv-work'
import { AB_DELTA_G0_KJ, AB_TEMPERATURE_K, gibbsAt, gibbsCurve, gqSteps } from './gq-steps'

export interface GibbsCurveProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 436
const X0 = 84
const X1 = 536
const Y0 = 84
const Y1 = 292
const G_MIN = -6
const STEPS = gqSteps()
const CURVE = gibbsCurve(220)

const xOf = (xi: number) => X0 + xi * (X1 - X0)
const yOf = (G: number) => Y0 + (G / G_MIN) * (Y1 - Y0)

const signed = (v: number, digits = 2) => {
  const text = Math.abs(v).toFixed(digits)
  if (Number(text) === 0) return text
  return v < 0 ? `−${text}` : `+${text}`
}

/**
 * The molar Gibbs energy of the A ⇌ B model against the extent ξ. The slope of the curve is ΔG, so the
 * marker rolls downhill when ΔG is negative and uphill when it is positive, and it stops at the
 * minimum, which is equilibrium. The Steps show ΔG = ΔG° + RT ln Q at four extents.
 */
export function GibbsCurve({ step, reducedMotion }: GibbsCurveProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  const xi = useTweenedNumber(current.xi, reducedMotion, 1.1)
  const G = gibbsAt(xi)
  const RT = (R_J_PER_MOL_K * AB_TEMPERATURE_K) / 1000
  const tone = current.deltaG < 0 ? 'var(--fwd)' : current.deltaG > 0 ? 'var(--rev)' : 'var(--fg)'
  const minimum = STEPS[2]
  const arrowFrom = xOf(current.xi)
  const arrowTo = arrowFrom + (current.deltaG < 0 ? 64 : current.deltaG > 0 ? -64 : 0)
  const path = CURVE.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.xi).toFixed(2)},${yOf(p.G).toFixed(2)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Gibbs energy of the mixture against extent for ΔG° = ${AB_DELTA_G0_KJ.toFixed(2)} kJ per mole at 298 kelvin. ${current.title}. ΔG = ${signed(current.deltaG)} kJ per mole.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="qk-gibbs-visual"
      data-step={index}
    >
      <Label x={VIEW_WIDTH / 2} y={20} fontSize={17} fill="var(--fg)">
        Gibbs energy <tspan className="sym">G</tspan> against extent <tspan className="sym">ξ</tspan>
      </Label>

      {/* Axes */}
      <line x1={X0} y1={Y0} x2={X0} y2={Y1} strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />
      {[0, -2, -4, -6].map((g) => (
        <g key={`g${g}`}>
          <line x1={X0 - 5} x2={X0} y1={yOf(g)} y2={yOf(g)} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={X0 - 12} y={yOf(g)} fontSize={13} textAnchor="end" fill="var(--fg-muted)">
            {g === 0 ? '0' : `−${Math.abs(g)}`}
          </Label>
        </g>
      ))}
      <Label x={X0 - 52} y={(Y0 + Y1) / 2} fontSize={14} fill="var(--fg-muted)" transform={`rotate(-90 ${X0 - 52} ${(Y0 + Y1) / 2})`}>
        G (kJ mol⁻¹)
      </Label>
      {[0, 0.25, 0.5, 0.75, 1].map((xi) => (
        <g key={`x${xi}`}>
          <line x1={xOf(xi)} x2={xOf(xi)} y1={Y1} y2={Y1 + 5} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={xOf(xi)} y={Y1 + 20} fontSize={13} fill="var(--fg-muted)">
            {xi === 0 ? '0' : xi === 1 ? '1' : xi.toFixed(2)}
          </Label>
        </g>
      ))}
      <Label x={(X0 + X1) / 2} y={Y1 + 42} fontSize={14} fill="var(--fg-muted)">
        extent <tspan className="sym">ξ</tspan>: the fraction of A converted to B
      </Label>

      {/* The curve and the equilibrium minimum */}
      <line x1={xOf(minimum.xi)} x2={xOf(minimum.xi)} y1={Y0} y2={Y1} strokeDasharray="4 4" strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
      <path d={path} fill="none" strokeWidth={3} strokeLinejoin="round" style={{ stroke: 'var(--accent)' }} />

      {/* Direction arrow and marker */}
      {current.deltaG !== 0 && (
        <g style={{ stroke: tone, fill: tone }}>
          <line x1={arrowFrom + (current.deltaG < 0 ? 16 : -16)} x2={arrowTo} y1={yOf(G) - 26} y2={yOf(G) - 26} strokeWidth={2.4} />
          <polygon
            points={`${arrowTo},${yOf(G) - 26} ${arrowTo - (current.deltaG < 0 ? 9 : -9)},${yOf(G) - 31} ${arrowTo - (current.deltaG < 0 ? 9 : -9)},${yOf(G) - 21}`}
            stroke="none"
          />
        </g>
      )}
      <circle cx={xOf(xi)} cy={yOf(G)} r={9} strokeWidth={2} style={{ fill: tone, stroke: 'var(--surface)' }} />

      {/* Readout for this Step */}
      <Label x={VIEW_WIDTH / 2} y={370} fontSize={17} fill="var(--fg)">
        {current.title}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={396} fontSize={15} fill="var(--fg)">
        <tspan className="sym">ΔG</tspan> = {signed(AB_DELTA_G0_KJ)} + {RT.toFixed(3)} × ln {current.Q.toPrecision(3)}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={421} fontSize={15} fill="var(--fg)">
        = {signed(current.deltaG)} kJ mol⁻¹
      </Label>
    </svg>
  )
}
