'use client'

import { useMemo, useState } from 'react'
import { Sub, Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Thermometer } from '@/components/vocab/Thermometer'
import {
  computeThermalColligativeState,
  getSolventConstant,
  NON_ELECTROLYTE_SOLUTES,
  type NonElectrolyteSolute,
} from '@/lib/chem/colligative-thermal'
import styles from './colligative-thermal-lab.module.css'

type SolventId = 'water' | 'ethanol' | 'benzene' | 'cyclohexane'
type SoluteId = NonElectrolyteSolute['id']

const SOLVENT_OPTIONS: readonly { value: SolventId; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'ethanol', label: 'Ethanol' },
  { value: 'benzene', label: 'Benzene' },
  { value: 'cyclohexane', label: 'Cyclohexane' },
]

const SOLUTE_OPTIONS: readonly { value: SoluteId; label: string }[] = NON_ELECTROLYTE_SOLUTES.map(
  (s) => ({
    value: s.id,
    label: s.name,
  })
)

const VIEW_W = 580
const VIEW_H = 356
const PLOT_LEFT = 64
const PLOT_RIGHT = 420
const PLOT_TOP = 48
const PLOT_BOTTOM = 252
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP
const P_MAX = 1.22

const THERM_X = 504
const THERM_BULB_Y = 296
const THERM_H = 224

const U_F0 = 0.36
const U_B0 = 0.72
const K_LIQ = 2.6
const V_F0 = Math.exp(K_LIQ * (U_F0 - U_B0))

function mapX(u: number): number {
  return PLOT_LEFT + u * PLOT_W
}

function mapY(v: number): number {
  return PLOT_BOTTOM - (v / P_MAX) * PLOT_H
}

function uToThermLevel(u: number): number {
  return Math.max(0.1, Math.min(0.95, 0.14 + 0.78 * u))
}

function levelToThermY(level: number): number {
  return THERM_BULB_Y - level * THERM_H
}

function samplePath(uStart: number, uEnd: number, steps: number, fn: (u: number) => number): string {
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const u = uStart + ((uEnd - uStart) * i) / steps
    const v = fn(u)
    if (v >= 0 && v <= P_MAX + 0.01) {
      parts.push(`${parts.length === 0 ? 'M' : 'L'} ${mapX(u).toFixed(1)} ${mapY(v).toFixed(1)}`)
    }
  }
  return parts.join(' ')
}

export function ColligativeThermalLab({ reducedMotion }: SimulationProps) {
  const [solventId, setSolventId] = useState<SolventId>('water')
  const [soluteId, setSoluteId] = useState<SoluteId>('glucose')
  const [molality, setMolality] = useState<number>(1.0)

  const solvent = useMemo(() => getSolventConstant(solventId), [solventId])
  const solute = useMemo(
    () => NON_ELECTROLYTE_SOLUTES.find((s) => s.id === soluteId) ?? NON_ELECTROLYTE_SOLUTES[0],
    [soluteId]
  )

  const state = useMemo(
    () => computeThermalColligativeState(solvent, solute, molality),
    [solvent, solute, molality]
  )

  // Smoothly tween visual curve displacements while keeping displayed numbers exact
  const targetDUb = 0.18 * Math.tanh(state.deltaTb / 6)
  const targetDUf = 0.24 * Math.tanh(state.deltaTf / 12)
  const dUb = useTweenedNumber(targetDUb, reducedMotion, 0.28)
  const dUf = useTweenedNumber(targetDUf, reducedMotion, 0.28)

  // Exact analytical relation connecting the 3 phase curves at the shifted intersections:
  // (1 - alphaVis) = exp(-K_LIQ * dUb) and K_SOLID = K_LIQ * (1 + dUb / dUf)
  const alphaVis = 1 - Math.exp(-K_LIQ * dUb)
  const ratioUbToUf =
    dUf > 1e-4 ? dUb / dUf : (0.18 / 6 / (0.24 / 12)) * (solvent.kb / solvent.kf)
  const kSolid = K_LIQ * (1 + Math.max(0.08, Math.min(3.5, ratioUbToUf)))

  const uF = U_F0 - dUf
  const uB = U_B0 + dUb
  const pureFn = (u: number) => Math.exp(K_LIQ * (u - U_B0))
  const solFn = (u: number) => (1 - alphaVis) * pureFn(u)
  const solidFn = (u: number) => V_F0 * Math.exp(kSolid * (u - U_F0))

  const xF0 = mapX(U_F0)
  const yF0 = mapY(V_F0)
  const xB0 = mapX(U_B0)
  const yAtm = mapY(1.0)
  const xF = mapX(uF)
  const yF = mapY(solidFn(uF))
  const xB = mapX(uB)

  const pureCeilingU = U_B0 + Math.log(P_MAX) / K_LIQ
  const solCeilingU = Math.min(0.97, uB + Math.log(P_MAX) / K_LIQ)

  const solidPath = samplePath(0.04, U_F0, 28, solidFn)
  const purePath = samplePath(U_F0, pureCeilingU, 40, pureFn)
  const hasShift = alphaVis > 0.004
  const solPath = hasShift ? samplePath(uF, solCeilingU, 44, solFn) : ''

  // Shaded band between pure and solution curves
  const bandPath = useMemo(() => {
    if (!hasShift) return ''
    const samples = 28
    const uEnd = Math.min(pureCeilingU, uB)
    const upper: string[] = []
    const lower: string[] = []
    for (let i = 0; i <= samples; i++) {
      const u = U_F0 + ((uEnd - U_F0) * i) / samples
      const vp = Math.min(P_MAX, Math.exp(K_LIQ * (u - U_B0)))
      const vs = Math.min(P_MAX, (1 - alphaVis) * vp)
      upper.push(`${i === 0 ? 'M' : 'L'} ${mapX(u).toFixed(1)} ${mapY(vp).toFixed(1)}`)
      lower.unshift(`L ${mapX(u).toFixed(1)} ${mapY(vs).toFixed(1)}`)
    }
    return `${upper.join(' ')} ${lower.join(' ')} Z`
  }, [hasShift, pureCeilingU, uB, alphaVis])

  // Prevent tick label overlap when shifts are small
  const xLabelTf = Math.min(xF, xF0 - 28)
  const xLabelTb = Math.max(xB, xB0 + 28)

  // Compact unboxed horizontal liquid-range bars below plot
  const barPureLeft = 152
  const barPureRight = 248
  const barPureWidth = barPureRight - barPureLeft
  const barLeftExt = (dUf / 0.24) * 44
  const barRightExt = (dUb / 0.18) * 38
  const totalWidening = state.deltaTf + state.deltaTb

  // Thermometer coordinates synchronized with uF and uB
  const thermYF0 = levelToThermY(uToThermLevel(U_F0))
  const thermYB0 = levelToThermY(uToThermLevel(U_B0))
  const thermYF = levelToThermY(uToThermLevel(uF))
  const thermYB = levelToThermY(uToThermLevel(uB))
  const thermLevel = uToThermLevel(uB)

  const liveSummary = `${solvent.name} with ${molality.toFixed(1)} mol per kg ${solute.name} (${state.soluteMassGPerKgSolvent.toFixed(1)} g per kg solvent). Relative vapour pressure lowering is ${state.rlvpExact.toFixed(4)}. Boiling point rises by ${state.deltaTb.toFixed(2)} K to ${state.solutionBoilingK.toFixed(2)} K. Freezing point drops by ${state.deltaTf.toFixed(2)} K to ${state.solutionFreezingK.toFixed(2)} K.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Solvent (NCERT Table 1.3)"
          options={SOLVENT_OPTIONS}
          value={solventId}
          onChange={setSolventId}
        />
        <Segmented
          label="Non-electrolyte solute (compare mass vs effect)"
          options={SOLUTE_OPTIONS}
          value={soluteId}
          onChange={setSoluteId}
        />
        <Slider
          label="Molality (m)"
          value={molality}
          min={0}
          max={3.0}
          step={0.1}
          unit="mol kg⁻¹"
          format={(v) => v.toFixed(1)}
          onChange={setMolality}
        />
      </div>

      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={liveSummary}
        >
          {/* Header status line */}
          <text
            x={20}
            y={24}
            fontSize={14.5}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            {solvent.name} ({solvent.formula})
          </text>
          <text
            x={560}
            y={24}
            textAnchor="end"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--accent)"
          >
            {solute.name}: {state.soluteMassGPerKgSolvent.toFixed(1)} g / kg solvent
          </text>

          {/* 1.013 bar reference line */}
          <line
            x1={PLOT_LEFT}
            y1={yAtm}
            x2={PLOT_RIGHT}
            y2={yAtm}
            stroke="var(--border)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text
            x={PLOT_LEFT + 10}
            y={yAtm - 8}
            fontSize={13.5}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            1.013 bar
          </text>

          {/* Vapour pressure lowering band */}
          {hasShift && <path d={bandPath} fill="var(--accent-soft)" opacity={0.65} />}

          {/* Open plot axes */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_LEFT}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={PLOT_RIGHT}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />

          {/* Y-axis label */}
          <text
            x={20}
            y={(PLOT_TOP + PLOT_BOTTOM) / 2}
            textAnchor="middle"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            transform={`rotate(-90 20 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
          >
            Vapour pressure (p)
          </text>

          {/* Pure drop lines */}
          <line
            x1={xF0}
            y1={yF0}
            x2={xF0}
            y2={PLOT_BOTTOM}
            stroke="var(--fg-subtle)"
            strokeWidth={1.25}
            strokeDasharray="4 4"
          />
          <line
            x1={xB0}
            y1={yAtm}
            x2={xB0}
            y2={PLOT_BOTTOM}
            stroke="var(--fg-subtle)"
            strokeWidth={1.25}
            strokeDasharray="4 4"
          />

          {/* Solution drop lines */}
          {hasShift && (
            <>
              <line
                x1={xF}
                y1={yF}
                x2={xF}
                y2={PLOT_BOTTOM}
                stroke="var(--coolant)"
                strokeWidth={1.75}
                strokeDasharray="4 4"
              />
              <line
                x1={xB}
                y1={yAtm}
                x2={xB}
                y2={PLOT_BOTTOM}
                stroke="var(--heat)"
                strokeWidth={1.75}
                strokeDasharray="4 4"
              />
            </>
          )}

          {/* Phase curves */}
          <path
            d={solidPath}
            fill="none"
            stroke="var(--coolant)"
            strokeWidth={2.75}
            strokeLinecap="round"
          />
          <path
            d={purePath}
            fill="none"
            stroke="var(--liquid-edge)"
            strokeWidth={2.75}
            strokeLinecap="round"
          />
          {hasShift && (
            <path
              d={solPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {/* Curve annotations */}
          <text
            x={76}
            y={216}
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--coolant)"
          >
            Solid
          </text>
          <text
            x={252}
            y={128}
            textAnchor="end"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--liquid-edge)"
          >
            Pure
          </text>
          {hasShift && (
            <text
              x={332}
              y={192}
              fontSize={13.5}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--accent)"
            >
              Solution
            </text>
          )}

          {/* Intersection dots */}
          <circle
            cx={xF0}
            cy={yF0}
            r={4.5}
            fill="var(--surface)"
            stroke="var(--liquid-edge)"
            strokeWidth={2}
          />
          <circle
            cx={xB0}
            cy={yAtm}
            r={4.5}
            fill="var(--surface)"
            stroke="var(--liquid-edge)"
            strokeWidth={2}
          />
          {hasShift && (
            <>
              <circle
                cx={xF}
                cy={yF}
                r={5.5}
                fill="var(--coolant)"
                stroke="var(--surface)"
                strokeWidth={1.75}
              />
              <circle
                cx={xB}
                cy={yAtm}
                r={5.5}
                fill="var(--heat)"
                stroke="var(--surface)"
                strokeWidth={1.75}
              />
            </>
          )}

          {/* Temperature axis ticks */}
          <text
            x={xF0}
            y={271}
            textAnchor="middle"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            T<Sub>f</Sub>
            <Sup>0</Sup>
          </text>
          <text
            x={xB0}
            y={271}
            textAnchor="middle"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            T<Sub>b</Sub>
            <Sup>0</Sup>
          </text>
          {hasShift && (
            <>
              <text
                x={xLabelTf}
                y={271}
                textAnchor="middle"
                fontSize={13.5}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--coolant)"
              >
                T<Sub>f</Sub>
              </text>
              <text
                x={xLabelTb}
                y={271}
                textAnchor="middle"
                fontSize={13.5}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--heat)"
              >
                T<Sub>b</Sub>
              </text>
            </>
          )}

          {/* Unboxed horizontal liquid-range comparison beneath plot */}
          <line
            x1={20}
            y1={288}
            x2={424}
            y2={288}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.7}
          />

          <text
            x={24}
            y={312}
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            Pure
          </text>
          <rect
            x={barPureLeft}
            y={302}
            width={barPureWidth}
            height={10}
            rx={5}
            fill="var(--liquid-edge)"
            opacity={0.75}
          />
          <text
            x={300}
            y={312}
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-mono)"
            fill="var(--fg-muted)"
          >
            {state.pureLiquidRangeK.toFixed(1)} K
          </text>

          <text
            x={24}
            y={338}
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            Solution
          </text>
          {barLeftExt > 0.5 && (
            <rect
              x={barPureLeft - barLeftExt}
              y={328}
              width={barLeftExt}
              height={10}
              rx={3}
              fill="var(--coolant)"
            />
          )}
          <rect
            x={barPureLeft}
            y={328}
            width={barPureWidth}
            height={10}
            fill="var(--accent)"
          />
          {barRightExt > 0.5 && (
            <rect
              x={barPureRight}
              y={328}
              width={barRightExt}
              height={10}
              rx={3}
              fill="var(--heat)"
            />
          )}
          <text
            x={300}
            y={338}
            fontSize={13.5}
            fontWeight={700}
            fontFamily="var(--font-mono)"
            fill="var(--fg)"
          >
            {state.solutionLiquidRangeK.toFixed(1)} K
          </text>

          {/* Hairline separator before live thermometer */}
          <line
            x1={444}
            y1={48}
            x2={444}
            y2={340}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.65}
          />

          {/* Compact live Thermometer liquid-range gauge */}
          <g>
            <text
              x={THERM_X}
              y={58}
              textAnchor="middle"
              fontSize={13.5}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              Liquid band
            </text>

            {/* Range ribbon alongside stem */}
            <rect
              x={THERM_X - 24}
              y={thermYB0}
              width={7}
              height={Math.max(4, thermYF0 - thermYB0)}
              rx={hasShift ? 1.5 : 3.5}
              fill={hasShift ? 'var(--accent)' : 'var(--liquid-edge)'}
              opacity={0.85}
            />
            {hasShift && thermYB0 - thermYB > 1.5 && (
              <rect
                x={THERM_X - 24}
                y={thermYB}
                width={7}
                height={thermYB0 - thermYB}
                rx={2.5}
                fill="var(--heat)"
              />
            )}
            {hasShift && thermYF - thermYF0 > 1.5 && (
              <rect
                x={THERM_X - 24}
                y={thermYF0}
                width={7}
                height={thermYF - thermYF0}
                rx={2.5}
                fill="var(--coolant)"
              />
            )}

            <Thermometer
              x={THERM_X}
              y={THERM_BULB_Y}
              height={THERM_H}
              bulbRadius={15}
              stemWidth={11}
              level={thermLevel}
              ticks={[0.25, 0.5, 0.75]}
            />

            {/* Pure reference marks */}
            <text
              x={THERM_X + 14}
              y={thermYB0 + 4.5}
              fontSize={13.5}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              T<Sub>b</Sub>
              <Sup>0</Sup>
            </text>
            <text
              x={THERM_X + 14}
              y={thermYF0 + 4.5}
              fontSize={13.5}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              T<Sub>f</Sub>
              <Sup>0</Sup>
            </text>

            {/* Shifted solution marks when clearly separated */}
            {hasShift && thermYB0 - thermYB > 13 && (
              <text
                x={THERM_X + 14}
                y={thermYB + 4.5}
                fontSize={13.5}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--heat)"
              >
                T<Sub>b</Sub>
              </text>
            )}
            {hasShift && thermYF - thermYF0 > 13 && (
              <text
                x={THERM_X + 14}
                y={thermYF + 4.5}
                fontSize={13.5}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--coolant)"
              >
                T<Sub>f</Sub>
              </text>
            )}

            {/* Total widening cue below bulb */}
            <text
              x={THERM_X}
              y={338}
              textAnchor="middle"
              fontSize={13.5}
              fontWeight={700}
              fontFamily="var(--font-mono)"
              fill={hasShift ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {hasShift ? `+${totalWidening.toFixed(2)} K` : 'Pure'}
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.metricsGrid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Solvent constants</span>
            <span className={styles.metricValue}>
              K<sub>b</sub> = {solvent.kb.toFixed(2)} · K<sub>f</sub> = {solvent.kf.toFixed(2)}
            </span>
            <span className={styles.metricSub}>
              K kg mol<sup>−1</sup>
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Relative lowering (Δp<sub>1</sub> / p<sub>1</sub>
              <sup>0</sup>)
            </span>
            <span className={`${styles.metricValue} ${styles.metricValueAccent}`}>
              {state.rlvpExact.toFixed(4)}
            </span>
            <span className={styles.metricSub}>
              {(state.rlvpExact * 100).toFixed(2)}% drop (= x<sub>2</sub>)
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Boiling elevation (ΔT<sub>b</sub>)
            </span>
            <span className={`${styles.metricValue} ${styles.metricValueHeat}`}>
              +{state.deltaTb.toFixed(2)} K
            </span>
            <span className={styles.metricSub}>
              T<sub>b</sub> = {state.solutionBoilingK.toFixed(2)} K (pure{' '}
              {solvent.boilingPointK.toFixed(2)} K)
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Freezing depression (ΔT<sub>f</sub>)
            </span>
            <span className={`${styles.metricValue} ${styles.metricValueCool}`}>
              −{state.deltaTf.toFixed(2)} K
            </span>
            <span className={styles.metricSub}>
              T<sub>f</sub> = {state.solutionFreezingK.toFixed(2)} K (pure{' '}
              {solvent.freezingPointK.toFixed(2)} K)
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>Solute mass per kg solvent</span>
            <span className={styles.metricValue}>
              {state.soluteMassGPerKgSolvent.toFixed(1)} g
            </span>
            <span className={styles.metricSub}>
              {solute.name} (M<sub>2</sub> = {solute.molarMassGPerMol.toFixed(2)} g mol
              <sup>−1</sup>)
            </span>
          </div>
        </div>

        <p className={styles.callout}>
          <strong>Colligative insight:</strong> Switch between Glucose, Sucrose, Urea and Ethylene
          glycol while keeping molality fixed. The required mass of solute shifts dramatically (from{' '}
          {(molality * 60.06).toFixed(1)} g for urea to {(molality * 342.3).toFixed(1)} g for
          sucrose), yet Δp<sub>1</sub>/p<sub>1</sub>
          <sup>0</sup>, ΔT<sub>b</sub> and ΔT<sub>f</sub> remain completely unchanged — only the
          particle count per kilogram of solvent matters.
        </p>

        <p className={styles.srOnly} aria-live="polite">
          {liveSummary}
        </p>
      </div>
    </div>
  )
}
