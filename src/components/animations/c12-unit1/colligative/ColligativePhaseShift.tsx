'use client'

import type { ReactNode } from 'react'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Thermometer } from '@/components/vocab/Thermometer'
import {
  ATM_PRESSURE_V,
  clampColligativeStep,
  COLLIGATIVE_STEPS,
  PURE_BOILING_U,
  PURE_FREEZING_U,
  PURE_FREEZING_V,
  pureVapourPressure,
  solidVapourPressure,
  solutionVapourPressure,
  solveBoilingU,
  solveFreezingU,
} from './colligative-steps'

export interface ColligativePhaseShiftProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 540

const PLOT_LEFT = 62
const PLOT_RIGHT = 414
const PLOT_TOP = 46
const PLOT_BOTTOM = 382
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP
const P_MAX = 1.24

const THERM_X = 496
const THERM_BULB_Y = 414
const THERM_H = 316

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

function buildPath(uStart: number, uEnd: number, samples: number, fn: (u: number) => number): string {
  const pts: string[] = []
  for (let i = 0; i <= samples; i++) {
    const u = uStart + ((uEnd - uStart) * i) / samples
    const v = fn(u)
    if (v <= P_MAX + 0.01 && v >= 0) {
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${mapX(u).toFixed(1)} ${mapY(v).toFixed(1)}`)
    }
  }
  return pts.join(' ')
}

function buildShadedBand(uStart: number, uEnd: number, alpha: number): string {
  const samples = 36
  const upper: string[] = []
  const lower: string[] = []
  for (let i = 0; i <= samples; i++) {
    const u = uStart + ((uEnd - uStart) * i) / samples
    const vPure = Math.min(P_MAX, pureVapourPressure(u))
    const vSol = Math.min(P_MAX, solutionVapourPressure(u, alpha))
    upper.push(`${i === 0 ? 'M' : 'L'} ${mapX(u).toFixed(1)} ${mapY(vPure).toFixed(1)}`)
    lower.unshift(`L ${mapX(u).toFixed(1)} ${mapY(vSol).toFixed(1)}`)
  }
  return `${upper.join(' ')} ${lower.join(' ')} Z`
}

function renderStepEquation(index: number): ReactNode {
  switch (index) {
    case 0:
      return (
        <>
          Pure solvent freezes at T<Sub>f</Sub>
          <Sup>0</Sup> and boils at T<Sub>b</Sub>
          <Sup>0</Sup> (1.013 bar)
        </>
      )
    case 1:
      return (
        <>
          Δp<Sub>1</Sub> / p<Sub>1</Sub>
          <Sup>0</Sup> = (p<Sub>1</Sub>
          <Sup>0</Sup> − p<Sub>1</Sub>) / p<Sub>1</Sub>
          <Sup>0</Sup> = x<Sub>2</Sub>
        </>
      )
    case 2:
      return (
        <>
          ΔT<Sub>b</Sub> = T<Sub>b</Sub> − T<Sub>b</Sub>
          <Sup>0</Sup> = K<Sub>b</Sub> · m
        </>
      )
    case 3:
      return (
        <>
          ΔT<Sub>f</Sub> = T<Sub>f</Sub>
          <Sup>0</Sup> − T<Sub>f</Sub> = K<Sub>f</Sub> · m
        </>
      )
    case 4:
    default:
      return (
        <>
          M<Sub>2</Sub> = (1000 K<Sub>b</Sub> w<Sub>2</Sub>) / (ΔT<Sub>b</Sub> w<Sub>1</Sub>) · or ·
          (1000 K<Sub>f</Sub> w<Sub>2</Sub>) / (ΔT<Sub>f</Sub> w<Sub>1</Sub>)
        </>
      )
  }
}

/** Draw a delicate 6-spoke frost crystal centered at (cx, cy). */
function FrostCrystal({ cx, cy, r, opacity }: { cx: number; cy: number; r: number; opacity: number }) {
  const angles = [0, 60, 120]
  return (
    <g opacity={opacity} stroke="var(--coolant)" strokeWidth={1.5} strokeLinecap="round">
      {angles.map((deg) => {
        const rad = (deg * Math.PI) / 180
        const dx = Math.cos(rad) * r
        const dy = Math.sin(rad) * r
        return <line key={deg} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} />
      })}
      <circle cx={cx} cy={cy} r={1.8} fill="var(--coolant)" stroke="none" />
    </g>
  )
}

export function ColligativePhaseShift({ step, reducedMotion }: ColligativePhaseShiftProps) {
  const index = clampColligativeStep(step)
  const spec = COLLIGATIVE_STEPS[index]

  const alpha = useTweenedNumber(spec.loweringAlpha, reducedMotion, 0.55)
  const boilFocus = useTweenedNumber(spec.highlightBoiling ? 1 : 0, reducedMotion, 0.45)
  const freezeFocus = useTweenedNumber(spec.highlightFreezing ? 1 : 0, reducedMotion, 0.45)
  const deltaPFocus = useTweenedNumber(spec.showDeltaP ? 1 : 0, reducedMotion, 0.45)
  const t = useAmbientTime(reducedMotion)

  const showSolution = alpha > 0.008

  const uF = solveFreezingU(alpha)
  const vF = solidVapourPressure(uF)
  const uB = solveBoilingU(alpha)

  // Target thermometer mercury level per step
  const targetThermU =
    index === 0
      ? PURE_BOILING_U
      : index === 1
        ? 0.55
        : index === 2
          ? solveBoilingU(spec.loweringAlpha)
          : index === 3
            ? solveFreezingU(spec.loweringAlpha)
            : solveBoilingU(spec.loweringAlpha)
  const thermLevel = useTweenedNumber(uToThermLevel(targetThermU), reducedMotion, 0.55)

  const xF0 = mapX(PURE_FREEZING_U)
  const yF0 = mapY(PURE_FREEZING_V)
  const xB0 = mapX(PURE_BOILING_U)
  const yAtm = mapY(ATM_PRESSURE_V)
  const xF = mapX(uF)
  const yF = mapY(vF)
  const xB = mapX(uB)

  // Solid curve runs from cold end up to pure freezing point
  const solidPath = buildPath(0.06, PURE_FREEZING_U, 30, solidVapourPressure)
  // Pure solvent liquid curve runs from T_f^0 up to plot ceiling
  const pureMaxU =
    PURE_BOILING_U +
    (Math.log(P_MAX / ATM_PRESSURE_V) / Math.log(1 / PURE_FREEZING_V)) *
      (PURE_BOILING_U - PURE_FREEZING_U)
  const pureLiquidPath = buildPath(PURE_FREEZING_U, pureMaxU, 44, pureVapourPressure)

  // Solution curve runs from its lowered freezing point uF past uB up to ceiling
  const solMaxU = Math.min(
    0.97,
    uB +
      (Math.log(P_MAX / ATM_PRESSURE_V) / Math.log(1 / PURE_FREEZING_V)) *
        (PURE_BOILING_U - PURE_FREEZING_U)
  )
  const solutionPath = showSolution
    ? buildPath(uF, solMaxU, 48, (u) => solutionVapourPressure(u, alpha))
    : ''

  const bandPath = showSolution
    ? buildShadedBand(PURE_FREEZING_U, Math.min(pureMaxU, uB), alpha)
    : ''

  // Thermometer liquid-range anchor Y coordinates
  const thermYF0 = levelToThermY(uToThermLevel(PURE_FREEZING_U))
  const thermYB0 = levelToThermY(uToThermLevel(PURE_BOILING_U))
  const thermYF = levelToThermY(uToThermLevel(uF))
  const thermYB = levelToThermY(uToThermLevel(uB))

  const freezingOpacity = 0.45 + 0.55 * freezeFocus
  const boilingOpacity = 0.45 + 0.55 * boilFocus

  const showBoilFlame = index === 2
  const showFrost = index === 3
  const flameScale = reducedMotion ? 1 : 1 + 0.09 * Math.sin(t * 7.5)
  const pulseR = reducedMotion ? 9 : 8.5 + 3 * Math.sin(t * 3.2)

  // Prevent tick overlap during early transition
  const xLabelTf = Math.min(xF, xF0 - 28)
  const xLabelTb = Math.max(xB, xB0 + 28)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={spec.ariaLabel}
      data-testid="colligative-phase-shift"
      data-step={index}
    >
      <defs>
        <marker
          id="colligative-arrow-down"
          viewBox="0 0 8 8"
          refX="4"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 1 1 L 4 7 L 7 1 Z" fill="var(--rev)" />
        </marker>
        <marker
          id="colligative-arrow-boil"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 1 1 L 7 4 L 1 7 Z" fill="var(--heat)" />
        </marker>
        <marker
          id="colligative-arrow-freeze"
          viewBox="0 0 8 8"
          refX="2"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 7 1 L 1 4 L 7 7 Z" fill="var(--coolant)" />
        </marker>
      </defs>

      {/* 1.013 bar atmospheric reference line */}
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
        y={yAtm - 9}
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        1.013 bar (1 atm)
      </text>

      {/* Shaded vapour-pressure lowering band */}
      {showSolution && (
        <path
          d={bandPath}
          fill="var(--accent-soft)"
          opacity={0.42 + 0.43 * deltaPFocus}
        />
      )}

      {/* Open axes */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_LEFT}
        y2={PLOT_BOTTOM}
        stroke="var(--fg)"
        strokeWidth={1.6}
      />
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT}
        y2={PLOT_BOTTOM}
        stroke="var(--fg)"
        strokeWidth={1.6}
      />

      {/* Rotated Y-axis label */}
      <text
        x={20}
        y={(PLOT_TOP + PLOT_BOTTOM) / 2}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
        transform={`rotate(-90 20 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
      >
        Vapour pressure (p)
      </text>

      {/* Vertical drop lines for pure T_f^0 and T_b^0 */}
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

      {/* Vertical drop lines for solution T_f and T_b */}
      {showSolution && (
        <>
          <line
            x1={xF}
            y1={yF}
            x2={xF}
            y2={PLOT_BOTTOM}
            stroke="var(--coolant)"
            strokeWidth={1.3 + 0.6 * freezeFocus}
            strokeDasharray="4 4"
            opacity={freezingOpacity}
          />
          <line
            x1={xB}
            y1={yAtm}
            x2={xB}
            y2={PLOT_BOTTOM}
            stroke="var(--heat)"
            strokeWidth={1.3 + 0.6 * boilFocus}
            strokeDasharray="4 4"
            opacity={boilingOpacity}
          />
        </>
      )}

      {/* Solid solvent vapour-pressure curve */}
      <path
        d={solidPath}
        fill="none"
        stroke="var(--coolant)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text
        x={76}
        y={324}
        fontSize={14}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--coolant)"
      >
        Solid
      </text>

      {/* Pure solvent liquid curve */}
      <path
        d={pureLiquidPath}
        fill="none"
        stroke="var(--liquid-edge)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text
        x={256}
        y={170}
        textAnchor="end"
        fontSize={14}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--liquid-edge)"
      >
        Pure solvent
      </text>

      {/* Lowered solution liquid curve */}
      {showSolution && (
        <>
          <path
            d={solutionPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          <text
            x={338}
            y={254}
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--accent)"
          >
            Solution
          </text>
        </>
      )}

      {/* Step 1: Translucent drop arrows showing curve lowering Δp_1 */}
      {deltaPFocus > 0.04 && showSolution && (
        <g opacity={deltaPFocus}>
          {[0.48, 0.6, 0.72].map((uSample, idx) => {
            const ax = mapX(uSample)
            const yTop = mapY(pureVapourPressure(uSample))
            const yBot = mapY(solutionVapourPressure(uSample, alpha))
            if (yBot - yTop < 14) return null
            const bob = reducedMotion ? 0 : Math.sin(t * 2.8 + idx * 0.8) * 2
            return (
              <line
                key={uSample}
                x1={ax}
                y1={yTop + 4}
                x2={ax}
                y2={yBot - 6 + bob}
                stroke="var(--rev)"
                strokeWidth={idx === 1 ? 2.2 : 1.6}
                opacity={idx === 1 ? 0.95 : 0.55}
                markerEnd="url(#colligative-arrow-down)"
              />
            )
          })}
          <text
            x={mapX(0.6) + 10}
            y={(mapY(pureVapourPressure(0.6)) + mapY(solutionVapourPressure(0.6, alpha))) / 2 + 5}
            fontSize={14.5}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--rev)"
          >
            Δp<Sub>1</Sub>
          </text>
        </g>
      )}

      {/* Step 2 & 4: ΔT_b elevation bracket (well below both curves) */}
      {boilFocus > 0.04 && showSolution && xB - xB0 > 14 && (
        <g opacity={boilFocus}>
          <line
            x1={xB0 + 3}
            y1={336}
            x2={xB - 7}
            y2={336}
            stroke="var(--heat)"
            strokeWidth={2.4}
            markerEnd="url(#colligative-arrow-boil)"
          />
          <text
            x={(xB0 + xB) / 2}
            y={324}
            textAnchor="middle"
            fontSize={14.5}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--heat)"
          >
            ΔT<Sub>b</Sub>
          </text>
        </g>
      )}

      {/* Step 3 & 4: ΔT_f depression bracket (cleanly above freezing dots) */}
      {freezeFocus > 0.04 && showSolution && xF0 - xF > 14 && (
        <g opacity={freezeFocus}>
          <line
            x1={xF}
            y1={238}
            x2={xF}
            y2={yF - 8}
            stroke="var(--coolant)"
            strokeWidth={1.1}
            strokeDasharray="3 3"
          />
          <line
            x1={xF0}
            y1={238}
            x2={xF0}
            y2={yF0 - 8}
            stroke="var(--coolant)"
            strokeWidth={1.1}
            strokeDasharray="3 3"
          />
          <line
            x1={xF0 - 3}
            y1={238}
            x2={xF + 7}
            y2={238}
            stroke="var(--coolant)"
            strokeWidth={2.4}
            markerEnd="url(#colligative-arrow-freeze)"
          />
          <text
            x={(xF + xF0) / 2}
            y={226}
            textAnchor="middle"
            fontSize={14.5}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--coolant)"
          >
            ΔT<Sub>f</Sub>
          </text>
        </g>
      )}

      {/* Pure intersection markers */}
      <circle
        cx={xF0}
        cy={yF0}
        r={5}
        fill="var(--surface)"
        stroke="var(--liquid-edge)"
        strokeWidth={2.2}
      />
      <circle
        cx={xB0}
        cy={yAtm}
        r={5}
        fill="var(--surface)"
        stroke="var(--liquid-edge)"
        strokeWidth={2.2}
      />

      {/* Solution intersection markers with pulsing spotlight rings */}
      {showSolution && (
        <>
          {freezeFocus > 0.1 && (
            <circle
              cx={xF}
              cy={yF}
              r={pulseR}
              fill="var(--coolant)"
              fillOpacity={0.22 * freezeFocus}
            />
          )}
          <circle
            cx={xF}
            cy={yF}
            r={5 + freezeFocus}
            fill="var(--coolant)"
            stroke="var(--surface)"
            strokeWidth={1.8}
            opacity={freezingOpacity}
          />
          {boilFocus > 0.1 && (
            <circle
              cx={xB}
              cy={yAtm}
              r={pulseR}
              fill="var(--heat)"
              fillOpacity={0.22 * boilFocus}
            />
          )}
          <circle
            cx={xB}
            cy={yAtm}
            r={5 + boilFocus}
            fill="var(--heat)"
            stroke="var(--surface)"
            strokeWidth={1.8}
            opacity={boilingOpacity}
          />
        </>
      )}

      {/* Temperature axis tick labels */}
      <text
        x={xF0}
        y={404}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        T<Sub>f</Sub>
        <Sup>0</Sup>
      </text>
      <text
        x={xB0}
        y={404}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        T<Sub>b</Sub>
        <Sup>0</Sup>
      </text>

      {showSolution && (
        <>
          <text
            x={xLabelTf}
            y={404}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--coolant)"
            opacity={freezingOpacity}
          >
            T<Sub>f</Sub>
          </text>
          <text
            x={xLabelTb}
            y={404}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--heat)"
            opacity={boilingOpacity}
          >
            T<Sub>b</Sub>
          </text>
        </>
      )}

      <text
        x={(PLOT_LEFT + PLOT_RIGHT) / 2}
        y={434}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        Temperature (T) →
      </text>

      {/* Subtle hairline separating phase diagram and synchronized thermometer */}
      <line
        x1={436}
        y1={56}
        x2={436}
        y2={456}
        stroke="var(--border)"
        strokeWidth={1}
        opacity={0.6}
      />

      {/* Synchronized Thermometer panel (right side) */}
      <g>
        <text
          x={THERM_X}
          y={66}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          Liquid range
        </text>

        {/* Liquid-range vertical band alongside thermometer stem */}
        {/* Pure liquid window */}
        <rect
          x={THERM_X - 28}
          y={thermYB0}
          width={9}
          height={Math.max(4, thermYF0 - thermYB0)}
          rx={showSolution ? 2 : 4.5}
          fill={showSolution ? 'var(--accent)' : 'var(--liquid-edge)'}
          opacity={0.85}
        />

        {/* Expanded boiling-point tip (warm) */}
        {showSolution && thermYB0 - thermYB > 1.5 && (
          <rect
            x={THERM_X - 28}
            y={thermYB}
            width={9}
            height={thermYB0 - thermYB}
            rx={3}
            fill="var(--heat)"
            opacity={0.55 + 0.45 * boilFocus}
          />
        )}

        {/* Expanded freezing-point tip (cool) */}
        {showSolution && thermYF - thermYF0 > 1.5 && (
          <rect
            x={THERM_X - 28}
            y={thermYF0}
            width={9}
            height={thermYF - thermYF0}
            rx={3}
            fill="var(--coolant)"
            opacity={0.55 + 0.45 * freezeFocus}
          />
        )}

        {/* Real Thermometer primitive */}
        <Thermometer
          x={THERM_X}
          y={THERM_BULB_Y}
          height={THERM_H}
          bulbRadius={19}
          stemWidth={14}
          level={thermLevel}
          ticks={[0.25, 0.4, 0.55, 0.7, 0.85]}
        />

        {/* Pure T_b^0 and T_f^0 reference ticks & labels */}
        <line
          x1={THERM_X - 30}
          y1={thermYB0}
          x2={THERM_X + 12}
          y2={thermYB0}
          stroke="var(--fg-subtle)"
          strokeWidth={1.1}
          strokeDasharray="2 2"
        />
        <text
          x={THERM_X + 16}
          y={thermYB0 + 5}
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          T<Sub>b</Sub>
          <Sup>0</Sup>
        </text>

        <line
          x1={THERM_X - 30}
          y1={thermYF0}
          x2={THERM_X + 12}
          y2={thermYF0}
          stroke="var(--fg-subtle)"
          strokeWidth={1.1}
          strokeDasharray="2 2"
        />
        <text
          x={THERM_X + 16}
          y={thermYF0 + 5}
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          T<Sub>f</Sub>
          <Sup>0</Sup>
        </text>

        {/* Solution elevated T_b label on thermometer */}
        {showSolution && thermYB0 - thermYB > 14 && (
          <g opacity={boilingOpacity}>
            <line
              x1={THERM_X - 30}
              y1={thermYB}
              x2={THERM_X + 12}
              y2={thermYB}
              stroke="var(--heat)"
              strokeWidth={1.6}
            />
            <text
              x={THERM_X + 16}
              y={thermYB + 5}
              fontSize={14}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--heat)"
            >
              T<Sub>b</Sub>
            </text>
          </g>
        )}

        {/* Solution depressed T_f label on thermometer */}
        {showSolution && thermYF - thermYF0 > 14 && (
          <g opacity={freezingOpacity}>
            <line
              x1={THERM_X - 30}
              y1={thermYF}
              x2={THERM_X + 12}
              y2={thermYF}
              stroke="var(--coolant)"
              strokeWidth={1.6}
            />
            <text
              x={THERM_X + 16}
              y={thermYF + 5}
              fontSize={14}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--coolant)"
            >
              T<Sub>f</Sub>
            </text>
          </g>
        )}

        {/* Step 2: Subtle flickering flame beneath bulb */}
        {showBoilFlame && (
          <g transform={`translate(${THERM_X}, 468) scale(1, ${flameScale.toFixed(3)})`}>
            <path
              d="M 0 -27 C 10 -15 11 -4 0 0 C -11 -4 -10 -15 0 -27 Z"
              fill="var(--heat)"
              opacity={0.85}
            />
            <path
              d="M 0 -18 C 5 -10 5 -3 0 -1 C -5 -3 -5 -10 0 -18 Z"
              fill="var(--surface)"
              opacity={0.65}
            />
          </g>
        )}

        {/* Step 3: Shimmering frost crystals around bulb */}
        {showFrost && (
          <g>
            <FrostCrystal
              cx={THERM_X - 32}
              cy={THERM_BULB_Y + 8}
              r={8}
              opacity={reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(t * 3.0)}
            />
            <FrostCrystal
              cx={THERM_X + 34}
              cy={THERM_BULB_Y + 6}
              r={7.5}
              opacity={reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(t * 3.0 + 2.1)}
            />
            <FrostCrystal
              cx={THERM_X}
              cy={THERM_BULB_Y + 38}
              r={8.5}
              opacity={reducedMotion ? 0.85 : 0.55 + 0.35 * Math.sin(t * 3.0 + 4.2)}
            />
          </g>
        )}

        {/* Step 4: Clean summary cue under thermometer */}
        {spec.showRangeComparison && (
          <text
            x={THERM_X}
            y={462}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--accent)"
          >
            +ΔT<Sub>b</Sub> &amp; −ΔT<Sub>f</Sub>
          </text>
        )}
      </g>

      {/* Understated single-line bottom working formula */}
      <text
        x={VIEW_W / 2}
        y={514}
        textAnchor="middle"
        fontSize={14.5}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {renderStepEquation(index)}
      </text>
    </svg>
  )
}
