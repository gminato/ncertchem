'use client'

import { Label } from '@/components/vocab'
import { deltaGForExponent, K_LADDER_T, kLadderSteps, signed } from './gibbs-steps'
import { useTweenedNumber } from './useTweenedNumber'

export interface KLadderProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 300
const AXIS_Y = 110
const X0 = 50
const SPAN = 480
const N_MIN = -10
const N_MAX = 10
const STEPS = kLadderSteps()

/** Position on the log axis for log₁₀K = n. Each decade is the same width. */
const xFor = (n: number) => X0 + (SPAN * (n - N_MIN)) / (N_MAX - N_MIN)

/** Ticks every two decades, from 10⁻¹⁰ to 10¹⁰. */
const TICKS: number[] = []
for (let n = N_MIN; n <= N_MAX; n += 2) TICKS.push(n)

/**
 * A log₁₀K axis from 10⁻¹⁰ to 10¹⁰, with ΔG° read off under each tick at 298 K. The marker and bar
 * move between the Steps. Right of K = 1 favours products (ΔG° < 0); left of it favours reactants.
 */
export function KLadder({ step, reducedMotion }: KLadderProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  const exponent = useTweenedNumber(current.exponent, reducedMotion, 1.0)
  const deltaG = deltaGForExponent(current.exponent)

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Log scale of the equilibrium constant from 10 to the minus 10 to 10 to the 10, with the marker at ${current.title}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="gibbs-k-ladder"
      data-step={index}
    >
      <Label x={VIEW_WIDTH / 2} y={18} fontSize={16} fill="var(--fg)">
        <tspan className="sym">K</tspan> against <tspan className="sym">ΔG°</tspan> at {K_LADDER_T} K
      </Label>

      {/* Regions: reactants favoured on the left, products on the right */}
      <rect x={X0} y={AXIS_Y - 34} width={xFor(0) - X0} height={68} rx={6} style={{ fill: 'var(--heat)' }} opacity={0.12} />
      <rect x={xFor(0)} y={AXIS_Y - 34} width={xFor(N_MAX) - xFor(0)} height={68} rx={6} style={{ fill: 'var(--work)' }} opacity={0.14} />
      <Label x={(X0 + xFor(0)) / 2} y={AXIS_Y - 20} fontSize={13} fill="var(--fg-muted)">
        Reactants favoured
      </Label>
      <Label x={(xFor(0) + xFor(N_MAX)) / 2} y={AXIS_Y - 20} fontSize={13} fill="var(--fg-muted)">
        Products favoured
      </Label>

      {/* The log axis */}
      <line x1={X0} y1={AXIS_Y} x2={xFor(N_MAX)} y2={AXIS_Y} strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={xFor(0)} y1={AXIS_Y - 34} x2={xFor(0)} y2={AXIS_Y + 34} strokeWidth={1} strokeDasharray="3 3" style={{ stroke: 'var(--fg-muted)' }} />

      {/* The bar from K = 1 to the current K, drawn in log units */}
      <rect
        x={Math.min(xFor(0), xFor(exponent))}
        y={AXIS_Y - 5}
        width={Math.abs(xFor(exponent) - xFor(0))}
        height={10}
        rx={5}
        style={{ fill: exponent >= 0 ? 'var(--work)' : 'var(--heat)' }}
        opacity={0.7}
      />

      {TICKS.map((n) => (
        <g key={`t-${n}`}>
          <line x1={xFor(n)} y1={AXIS_Y - 6} x2={xFor(n)} y2={AXIS_Y + 6} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={xFor(n)} y={AXIS_Y + 28} fontSize={13} fill="var(--fg-muted)">
            10
            <Label.Sup>{n < 0 ? `−${Math.abs(n)}` : `${n}`}</Label.Sup>
          </Label>
          <Label x={xFor(n)} y={AXIS_Y + 50} fontSize={13} fill="var(--fg-muted)">
            {(() => {
              const g = deltaGForExponent(n)
              return Math.abs(g) < 0.05 ? '0.0' : signed(g)
            })()}
          </Label>
        </g>
      ))}
      <Label x={VIEW_WIDTH / 2} y={AXIS_Y + 72} fontSize={12} fill="var(--fg-subtle)">
        Under each rung: <tspan className="sym">ΔG°</tspan> in kJ mol⁻¹
      </Label>

      {/* Marker */}
      <circle cx={xFor(exponent)} cy={AXIS_Y} r={7} style={{ fill: 'var(--fg)', stroke: 'var(--surface)' }} strokeWidth={1.5} />

      {/* Readout for the current Step */}
      <Label x={VIEW_WIDTH / 2} y={226} fontSize={17} fill="var(--fg)">
        {current.title}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={248} fontSize={14} fill="var(--fg-muted)">
        {current.body}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={270} fontSize={14} fill="var(--fg)">
        <tspan className="sym">ΔG°</tspan> = {signed(deltaG)} kJ mol⁻¹ at {K_LADDER_T} K
      </Label>
    </svg>
  )
}
