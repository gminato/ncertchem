'use client'

import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Beaker, Electrode, SaltBridge, Voltmeter, Wire } from '@/components/vocab'
import {
  DELTA_G_FE_NI_DOUBLED_KJ,
  DELTA_G_FE_NI_KJ,
  E0_DANIELL,
  E0_FE_NI,
  LOG_K_DANIELL,
  LOG_K_FE_NI,
  N_F_TWO,
  clampRundownStep,
  getRundownStepState,
  sciText,
} from './cell-runs-down-steps'

export interface CellRunsDownProps {
  step: number
  reducedMotion: boolean
}

const BEAKER_Y = 250
const BEAKER_H = 230
const BEAKER_W = 200
const BEAKER_LEVEL = 0.78
const LEFT_X = 30
const RIGHT_X = 350
const ZN_X = 85
const CU_X = 495
const ELECTRODE_TOP = 200
const ELECTRODE_LENGTH = 270
const SALT_START = { x: 170, y: 390 }
const SALT_FINISH = { x: 410, y: 390 }
const SALT_APEX = 190
const METER_X = 290
const METER_Y = 80
const METER_W = 220
const METER_H = 120

const AXIS_Y = 300
const AXIS_X0 = 60
const AXIS_PER_UNIT = 11.5
const AXIS_MAX = 40

/** Energy-bar axis: 0 at the top, bars hang down to −80 kJ mol⁻¹ (330 units, so the axis fills the panel). */
const BAR_ZERO_Y = 150
const BAR_PER_KJ = 4.125
const BAR_AXIS_X0 = 80
const BAR_AXIS_X1 = 540
const BAR_TICKS = [0, -20, -40, -60, -80] as const
/** Single bar (Step 5), centred on the axis. */
const SINGLE_BAR_X = 225
const SINGLE_BAR_W = 170
/** Paired bars (Step 6), n = 2 on the left and n = 4 on the right. */
const PAIR_LEFT_X = 130
const PAIR_RIGHT_X = 340
const PAIR_BAR_W = 150

const TWEEN_S = 0.5

function logToX(logK: number): number {
  return AXIS_X0 + logK * AXIS_PER_UNIT
}

function kjToY(kj: number): number {
  return BAR_ZERO_Y - kj * BAR_PER_KJ
}

function signed(value: number, decimals: number): string {
  return value.toFixed(decimals).replace('-', '−')
}

function EnergyBar({ x, width, kj }: { x: number; width: number; kj: number }) {
  return (
    <rect x={x} y={BAR_ZERO_Y} width={width} height={-kj * BAR_PER_KJ} rx={4} fill="var(--accent)" opacity={0.85} />
  )
}

/** Value inside the bar end (two lines), then the equation and n under the axis. */
function BarCaption({ cx, kj, lines, n }: { cx: number; kj: number; lines: readonly [string, string]; n: number }) {
  return (
    <g>
      <text x={cx} y={kjToY(kj) - 42} textAnchor="middle" fontSize={24} fill="var(--accent-fg)">
        {signed(kj, 2)}
      </text>
      <text x={cx} y={kjToY(kj) - 16} textAnchor="middle" fontSize={24} fill="var(--accent-fg)">
        kJ mol⁻¹
      </text>
      <text x={cx} y={500} textAnchor="middle" fontSize={23} fill="var(--fg)">
        {lines[0]}
      </text>
      <text x={cx} y={524} textAnchor="middle" fontSize={23} fill="var(--fg)">
        {lines[1]}
      </text>
      <text x={cx} y={548} textAnchor="middle" fontSize={23} fill="var(--accent)">
        {`n = ${n}`}
      </text>
    </g>
  )
}

export function CellRunsDown({ step, reducedMotion }: CellRunsDownProps) {
  const index = clampRundownStep(step)
  const state = getRundownStepState(index)
  const t = useAmbientTime(reducedMotion)

  const cellOp = useTweenedNumber(state.scene === 'cell' ? 1 : 0, reducedMotion, TWEEN_S)
  const logOp = useTweenedNumber(state.scene === 'log' ? 1 : 0, reducedMotion, TWEEN_S)
  const axisOp = useTweenedNumber(state.scene === 'bar' || state.scene === 'double' ? 1 : 0, reducedMotion, TWEEN_S)
  const barTitleOp = useTweenedNumber(state.scene === 'bar' ? 1 : 0, reducedMotion, TWEEN_S)
  const singleOp = useTweenedNumber(state.scene === 'bar' ? 1 : 0, reducedMotion, TWEEN_S)
  const doubleTitleOp = useTweenedNumber(state.scene === 'double' ? 1 : 0, reducedMotion, TWEEN_S)
  const doubleOp = useTweenedNumber(state.scene === 'double' ? 1 : 0, reducedMotion, TWEEN_S)

  const zinc = useTweenedNumber(state.zincProgress, reducedMotion, TWEEN_S)
  const copper = useTweenedNumber(state.copperProgress, reducedMotion, TWEEN_S)
  const blue = useTweenedNumber(state.blueFraction, reducedMotion, TWEEN_S)
  const cellV = useTweenedNumber(state.cellV, reducedMotion, TWEEN_S)

  return (
    <svg
      viewBox="0 0 580 560"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
      data-testid="cell-runs-down"
      data-step={index}
    >
      {/* Cell scene: a Daniell cell that runs down and reaches equilibrium */}
      <g opacity={cellOp} aria-hidden={state.scene !== 'cell'}>
        <Beaker x={LEFT_X} y={BEAKER_Y} width={BEAKER_W} height={BEAKER_H} level={BEAKER_LEVEL} tint="clear" />
        <Beaker x={RIGHT_X} y={BEAKER_Y} width={BEAKER_W} height={BEAKER_H} level={BEAKER_LEVEL} tint="clear" />
        <Beaker
          x={RIGHT_X}
          y={BEAKER_Y}
          width={BEAKER_W}
          height={BEAKER_H}
          level={BEAKER_LEVEL}
          tint="blue"
          opacity={blue}
        />

        <SaltBridge
          start={SALT_START}
          finish={SALT_FINISH}
          apex={SALT_APEX}
          width={30}
          t={t}
          ions={state.flowing}
          ionCount={4}
          cationsTo="to"
          legend="KCl in agar gel"
        />

        <Electrode
          x={ZN_X}
          top={ELECTRODE_TOP}
          length={ELECTRODE_LENGTH}
          width={18}
          material="zn"
          thinning={zinc}
          role="anode"
          polarity="−"
        />
        <Electrode
          x={CU_X}
          top={ELECTRODE_TOP}
          length={ELECTRODE_LENGTH}
          width={18}
          material="cu"
          plating={copper}
          depositMaterial="cu"
          role="cathode"
          polarity="+"
        />

        <Wire
          corners={[
            { x: ZN_X, y: ELECTRODE_TOP },
            { x: ZN_X, y: METER_Y },
            { x: METER_X - METER_W / 2, y: METER_Y },
          ]}
          t={t}
          electrons={state.flowing}
          dots={4}
          direction="forward"
        />
        <Wire
          corners={[
            { x: METER_X + METER_W / 2, y: METER_Y },
            { x: CU_X, y: METER_Y },
            { x: CU_X, y: ELECTRODE_TOP },
          ]}
          t={t}
          electrons={state.flowing}
          dots={4}
          direction="forward"
        />

        <Voltmeter
          x={METER_X}
          y={METER_Y}
          width={METER_W}
          height={METER_H}
          value={cellV}
          range={[0, 1.2]}
          decimals={2}
          terminals={false}
        />

        <text x={LEFT_X + BEAKER_W / 2} y={502} textAnchor="middle" fontSize={23} fill="var(--fg)">
          ZnSO₄(aq)
        </text>
        <text x={RIGHT_X + BEAKER_W / 2} y={502} textAnchor="middle" fontSize={23} fill="var(--fg)">
          CuSO₄(aq)
        </text>
        <text x={LEFT_X + BEAKER_W / 2} y={524} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
          {state.zincNote}
        </text>
        <text x={RIGHT_X + BEAKER_W / 2} y={524} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
          {state.copperNote}
        </text>
        <text x={290} y={552} textAnchor="middle" fontSize={24} fill="var(--accent)">
          {state.readout}
        </text>
      </g>

      {/* Log scale: where the equilibrium constants of the two cells sit */}
      <g opacity={logOp} aria-hidden={state.scene !== 'log'}>
        <line x1={AXIS_X0} y1={AXIS_Y} x2={logToX(AXIS_MAX)} y2={AXIS_Y} stroke="var(--fg-muted)" strokeWidth={2} />
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={logToX(v)} y1={AXIS_Y} x2={logToX(v)} y2={AXIS_Y + 7} stroke="var(--fg-muted)" strokeWidth={2} />
            <text x={logToX(v)} y={AXIS_Y + 30} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
              {v}
            </text>
          </g>
        ))}
        <text x={290} y={352} textAnchor="middle" fontSize={23} fill="var(--fg)">
          log₁₀ K<tspan baselineShift="sub" fontSize="72%">c</tspan>
        </text>

        <line x1={logToX(LOG_K_FE_NI)} y1={AXIS_Y} x2={logToX(LOG_K_FE_NI)} y2={236} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <circle cx={logToX(LOG_K_FE_NI)} cy={AXIS_Y} r={8} fill="var(--accent)" />
        <text x={logToX(LOG_K_FE_NI) - 4} y={206} textAnchor="start" fontSize={23} fill="var(--fg)">
          Fe–Ni couple
        </text>
        <text x={logToX(LOG_K_FE_NI) - 4} y={230} textAnchor="start" fontSize={23} fill="var(--fg-muted)">
          E°<Sub>cell</Sub>
          {` = ${E0_FE_NI.toFixed(2)} V, log K = ${LOG_K_FE_NI.toFixed(1)}`}
        </text>

        <line x1={logToX(LOG_K_DANIELL)} y1={AXIS_Y} x2={logToX(LOG_K_DANIELL)} y2={178} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <circle cx={logToX(LOG_K_DANIELL)} cy={AXIS_Y} r={8} fill="var(--accent)" />
        <text x={logToX(LOG_K_DANIELL) + 4} y={146} textAnchor="end" fontSize={23} fill="var(--fg)">
          Daniell cell
        </text>
        <text x={logToX(LOG_K_DANIELL) + 4} y={168} textAnchor="end" fontSize={23} fill="var(--fg-muted)">
          E°<Sub>cell</Sub>
          {` = ${E0_DANIELL.toFixed(2)} V, log K = ${LOG_K_DANIELL.toFixed(1)}`}
        </text>

        <text x={290} y={410} textAnchor="middle" fontSize={24} fill="var(--fg)">
          log₁₀ K = nE°<Sub>cell</Sub> / 0.059 V
        </text>
        <text x={290} y={438} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
          A larger standard potential means a larger K
        </text>
      </g>

      {/* Energy-bar axis, shared by Step 5 (one bar) and Step 6 (two bars) */}
      <g opacity={axisOp} aria-hidden={state.scene !== 'bar' && state.scene !== 'double'}>
        {BAR_TICKS.map((kj) => (
          <g key={kj}>
            <line
              x1={BAR_AXIS_X0}
              y1={kjToY(kj)}
              x2={BAR_AXIS_X1}
              y2={kjToY(kj)}
              stroke={kj === 0 ? 'var(--fg-muted)' : 'var(--border)'}
              strokeWidth={kj === 0 ? 2 : 1}
            />
            <text x={BAR_AXIS_X0 - 10} y={kjToY(kj) + 8} textAnchor="end" fontSize={23} fill="var(--fg-muted)">
              {kj === 0 ? '0' : signed(kj, 0)}
            </text>
          </g>
        ))}
        <text x={BAR_AXIS_X0} y={134} textAnchor="start" fontSize={23} fill="var(--fg-muted)">
          Δ<Sub>r</Sub>G°, kJ mol⁻¹
        </text>
      </g>

      {/* Step 5: one bar, n = 2 */}
      <g opacity={singleOp} aria-hidden={state.scene !== 'bar'}>
        <g opacity={barTitleOp}>
          <text x={290} y={40} textAnchor="middle" fontSize={28} fill="var(--fg)">
            Δ<Sub>r</Sub>G° = −nFE°<Sub>cell</Sub>
          </text>
          <text x={290} y={72} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
            {`nF = ${sciText(N_F_TWO, 2)} C mol⁻¹ for n = 2`}
          </text>
          <text x={290} y={96} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
            {`E°cell = ${E0_FE_NI.toFixed(2)} V`}
          </text>
        </g>
        <EnergyBar x={SINGLE_BAR_X} width={SINGLE_BAR_W} kj={DELTA_G_FE_NI_KJ} />
        <BarCaption
          cx={SINGLE_BAR_X + SINGLE_BAR_W / 2}
          kj={DELTA_G_FE_NI_KJ}
          lines={['Fe + Ni²⁺', '→ Fe²⁺ + Ni']}
          n={2}
        />
      </g>

      {/* Step 6: two bars on the same axis, n = 2 and n = 4 */}
      <g opacity={doubleOp} aria-hidden={state.scene !== 'double'}>
        <g opacity={doubleTitleOp}>
          <text x={290} y={40} textAnchor="middle" fontSize={28} fill="var(--fg)">
            Δ<Sub>r</Sub>G° = −nFE°<Sub>cell</Sub>
          </text>
          <text x={290} y={72} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
            n doubles from 2 to 4, so Δ<Sub>r</Sub>G° doubles
          </text>
          <text x={290} y={96} textAnchor="middle" fontSize={23} fill="var(--fg-muted)">
            {`E°cell = ${E0_FE_NI.toFixed(2)} V in both: only n changes`}
          </text>
        </g>
        <EnergyBar x={PAIR_LEFT_X} width={PAIR_BAR_W} kj={DELTA_G_FE_NI_KJ} />
        <EnergyBar x={PAIR_RIGHT_X} width={PAIR_BAR_W} kj={DELTA_G_FE_NI_DOUBLED_KJ} />
        <BarCaption
          cx={PAIR_LEFT_X + PAIR_BAR_W / 2}
          kj={DELTA_G_FE_NI_KJ}
          lines={['Fe + Ni²⁺', '→ Fe²⁺ + Ni']}
          n={2}
        />
        <BarCaption
          cx={PAIR_RIGHT_X + PAIR_BAR_W / 2}
          kj={DELTA_G_FE_NI_DOUBLED_KJ}
          lines={['2Fe + 2Ni²⁺', '→ 2Fe²⁺ + 2Ni']}
          n={4}
        />
      </g>
    </svg>
  )
}
