'use client'

import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Beaker, Electrode, SaltBridge, Voltmeter, Wire } from '@/components/vocab'
import {
  DELTA_G_DANIELL_KJ,
  E0_CU_AG,
  E0_DANIELL,
  LOG_K_CU_AG,
  LOG_K_DANIELL,
  N_F_DANIELL,
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

const BAR_ZERO_Y = 250
const BAR_PER_KJ = 0.6
const BAR_X = 240
const BAR_W = 120

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

export function CellRunsDown({ step, reducedMotion }: CellRunsDownProps) {
  const index = clampRundownStep(step)
  const state = getRundownStepState(index)
  const t = useAmbientTime(reducedMotion)

  const cellOp = useTweenedNumber(state.scene === 'cell' ? 1 : 0, reducedMotion, TWEEN_S)
  const logOp = useTweenedNumber(state.scene === 'log' ? 1 : 0, reducedMotion, TWEEN_S)
  const barTextOp = useTweenedNumber(state.scene === 'bar' ? 1 : 0, reducedMotion, TWEEN_S)
  const barLayerOp = useTweenedNumber(state.scene === 'bar' || state.scene === 'double' ? 1 : 0, reducedMotion, TWEEN_S)
  const doubleOp = useTweenedNumber(state.scene === 'double' ? 1 : 0, reducedMotion, TWEEN_S)

  const zinc = useTweenedNumber(state.zincProgress, reducedMotion, TWEEN_S)
  const copper = useTweenedNumber(state.copperProgress, reducedMotion, TWEEN_S)
  const blue = useTweenedNumber(state.blueFraction, reducedMotion, TWEEN_S)
  const cellV = useTweenedNumber(state.cellV, reducedMotion, TWEEN_S)
  const deltaG = useTweenedNumber(state.deltaGKJ, reducedMotion, TWEEN_S)

  const barHeight = -deltaG * BAR_PER_KJ
  const barLabelY = BAR_ZERO_Y + barHeight / 2

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
          legend="KCl(aq) salt bridge"
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

        <text x={LEFT_X + BEAKER_W / 2} y={502} textAnchor="middle" fontSize={16} fill="var(--fg)">
          ZnSO₄(aq)
        </text>
        <text x={RIGHT_X + BEAKER_W / 2} y={502} textAnchor="middle" fontSize={16} fill="var(--fg)">
          CuSO₄(aq)
        </text>
        <text x={LEFT_X + BEAKER_W / 2} y={524} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {state.zincNote}
        </text>
        <text x={RIGHT_X + BEAKER_W / 2} y={524} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {state.copperNote}
        </text>
        <text x={290} y={552} textAnchor="middle" fontSize={17} fill="var(--accent)">
          {state.readout}
        </text>
      </g>

      {/* Log scale: where the equilibrium constants of the two cells sit */}
      <g opacity={logOp} aria-hidden={state.scene !== 'log'}>
        <line x1={AXIS_X0} y1={AXIS_Y} x2={logToX(AXIS_MAX)} y2={AXIS_Y} stroke="var(--fg-muted)" strokeWidth={2} />
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={logToX(v)} y1={AXIS_Y} x2={logToX(v)} y2={AXIS_Y + 7} stroke="var(--fg-muted)" strokeWidth={2} />
            <text x={logToX(v)} y={AXIS_Y + 30} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
              {v}
            </text>
          </g>
        ))}
        <text x={290} y={352} textAnchor="middle" fontSize={16} fill="var(--fg)">
          log₁₀ K<tspan baselineShift="sub" fontSize="72%">c</tspan>
        </text>

        <line x1={logToX(LOG_K_CU_AG)} y1={AXIS_Y} x2={logToX(LOG_K_CU_AG)} y2={232} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <circle cx={logToX(LOG_K_CU_AG)} cy={AXIS_Y} r={8} fill="var(--accent)" />
        <text x={logToX(LOG_K_CU_AG)} y={200} textAnchor="middle" fontSize={16} fill="var(--fg)">
          Cu–Ag couple
        </text>
        <text x={logToX(LOG_K_CU_AG)} y={222} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {`E° = ${E0_CU_AG.toFixed(2)} V, log K = ${LOG_K_CU_AG.toFixed(1)}`}
        </text>

        <line x1={logToX(LOG_K_DANIELL)} y1={AXIS_Y} x2={logToX(LOG_K_DANIELL)} y2={178} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <circle cx={logToX(LOG_K_DANIELL)} cy={AXIS_Y} r={8} fill="var(--accent)" />
        <text x={logToX(LOG_K_DANIELL) + 4} y={146} textAnchor="end" fontSize={16} fill="var(--fg)">
          Daniell cell
        </text>
        <text x={logToX(LOG_K_DANIELL) + 4} y={168} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
          {`E° = ${E0_DANIELL.toFixed(2)} V, log K = ${LOG_K_DANIELL.toFixed(1)}`}
        </text>

        <text x={290} y={410} textAnchor="middle" fontSize={17} fill="var(--fg)">
          log₁₀ K = nE°cell / 0.059 V
        </text>
        <text x={290} y={438} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          A larger standard potential means a larger K
        </text>
      </g>

      {/* Energy bar: ΔrG° in kJ mol⁻¹, drawn downward from zero */}
      <g opacity={barTextOp} aria-hidden={state.scene !== 'bar'}>
        <text x={290} y={70} textAnchor="middle" fontSize={24} fill="var(--fg)">
          ΔrG° = −nFE°cell
        </text>
        <text x={290} y={104} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          {`nF = ${sciText(N_F_DANIELL, 2)} C mol⁻¹ for n = 2`}
        </text>
        <text x={290} y={128} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          {`E°cell = ${E0_DANIELL.toFixed(2)} V`}
        </text>
      </g>

      <g opacity={barLayerOp} aria-hidden={state.scene !== 'bar' && state.scene !== 'double'}>
        {[0, -100, -200, -300, -400].map((kj) => (
          <g key={kj}>
            <line x1={68} y1={kjToY(kj)} x2={BAR_X + BAR_W + 40} y2={kjToY(kj)} stroke="var(--border)" strokeWidth={1} />
            <text x={60} y={kjToY(kj) + 5} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
              {kj === 0 ? '0' : signed(kj, 0)}
            </text>
          </g>
        ))}
        <rect x={BAR_X} y={BAR_ZERO_Y} width={BAR_W} height={barHeight} rx={4} fill="var(--accent)" opacity={0.85} />
        <text x={BAR_X + BAR_W + 14} y={barLabelY + 6} fontSize={18} fill="var(--fg)">
          {`${signed(deltaG, 2)} kJ mol⁻¹`}
        </text>
      </g>

      {/* Doubled equation: two copies side by side, n goes 2 to 4, the voltmeter stays at 1.10 V */}
      <g opacity={doubleOp} aria-hidden={state.scene !== 'double'}>
        <Voltmeter
          x={METER_X}
          y={95}
          width={METER_W}
          height={METER_H}
          value={cellV}
          range={[0, 1.2]}
          decimals={2}
          terminals={false}
        />
        <text x={145} y={190} textAnchor="middle" fontSize={16} fill="var(--fg)">
          Zn + Cu²⁺ → Zn²⁺ + Cu
        </text>
        <text x={145} y={214} textAnchor="middle" fontSize={16} fill="var(--accent)">
          n = 2
        </text>
        <text x={435} y={190} textAnchor="middle" fontSize={16} fill="var(--fg)">
          2Zn + 2Cu²⁺ → 2Zn²⁺ + 2Cu
        </text>
        <text x={435} y={214} textAnchor="middle" fontSize={16} fill="var(--accent)">
          n = 4
        </text>
      </g>
    </svg>
  )
}
