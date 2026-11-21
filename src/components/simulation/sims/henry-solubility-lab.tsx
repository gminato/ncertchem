'use client'

import { useState, type ReactNode } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { Vessel, VocabDefs } from '@/components/vocab'
import { Thermometer } from '@/components/vocab/Thermometer'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  HENRY_GAS_METADATA,
  dissolvedMillimolesPerLitreWater,
  henryMoleFraction,
  interpolatedKhKbar,
} from '@/lib/chem/henry-law'
import type { HenryGas } from '@/lib/chem/henry-law'
import styles from './henry-solubility-lab.module.css'

const GAS_OPTIONS: readonly { value: HenryGas; label: string }[] = [
  { value: 'O2', label: 'O₂' },
  { value: 'N2', label: 'N₂' },
  { value: 'CO2', label: 'CO₂' },
  { value: 'He', label: 'He' },
]

const GAS_COLOR_TOKEN: Record<HenryGas, string> = {
  O2: 'var(--ox)',
  N2: 'var(--spot-2)',
  CO2: 'var(--spot-3)',
  He: 'var(--spot-4)',
}

const HEADSPACE_SLOTS: readonly [number, number][] = [
  [0.14, 0.22], [0.36, 0.30], [0.62, 0.20], [0.84, 0.34], [0.22, 0.66],
  [0.48, 0.72], [0.74, 0.64], [0.88, 0.80], [0.12, 0.82], [0.30, 0.16],
  [0.56, 0.46], [0.40, 0.52], [0.80, 0.18], [0.20, 0.44], [0.66, 0.84],
  [0.72, 0.44], [0.36, 0.84], [0.50, 0.26], [0.16, 0.54], [0.86, 0.54],
]

const LIQUID_SLOTS: readonly [number, number][] = [
  [0.16, 0.22], [0.44, 0.30], [0.72, 0.24], [0.28, 0.58], [0.58, 0.66],
  [0.84, 0.54], [0.18, 0.78], [0.48, 0.50], [0.34, 0.38], [0.78, 0.78],
  [0.64, 0.38], [0.40, 0.82], [0.86, 0.28], [0.22, 0.44], [0.54, 0.84],
  [0.70, 0.64], [0.14, 0.62], [0.36, 0.20], [0.60, 0.20], [0.82, 0.42],
  [0.26, 0.74], [0.50, 0.68], [0.74, 0.48], [0.42, 0.64],
]

const MAX_P_BAR = 5.0
const MIN_P_BAR = 0.2

// Cylinder geometry (centred at x=142, y=184; w=146, h=232)
const CYL_CX = 142
const CYL_CY = 184
const CYL_W = 146
const CYL_H = 232
const CYL_LEFT = CYL_CX - CYL_W / 2 // 69
const CYL_RIGHT = CYL_CX + CYL_W / 2 // 215
const CYL_TOP = CYL_CY - CYL_H / 2 // 68
const CYL_BOTTOM = CYL_CY + CYL_H / 2 // 300
const LIQUID_LEVEL = 0.44
const LIQUID_Y = CYL_BOTTOM - LIQUID_LEVEL * CYL_H // 197.92

// Plot geometry (borderless right panel)
const PLOT_LEFT = 304
const PLOT_RIGHT = 556
const PLOT_TOP = 64
const PLOT_BOTTOM = 286
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP

function SvgGasFormula({ gas }: { gas: HenryGas }) {
  if (gas === 'O2') return <>O<Sub>2</Sub></>
  if (gas === 'N2') return <>N<Sub>2</Sub></>
  if (gas === 'CO2') return <>CO<Sub>2</Sub></>
  return <>He</>
}

function HtmlGasFormula({ gas }: { gas: HenryGas }) {
  if (gas === 'O2') return <>O<sub>2</sub></>
  if (gas === 'N2') return <>N<sub>2</sub></>
  if (gas === 'CO2') return <>CO<sub>2</sub></>
  return <>He</>
}

function formatSciPlain(value: number): string {
  if (value === 0) return '0'
  const exp = Math.floor(Math.log10(value))
  const mantissa = value / 10 ** exp
  return `${mantissa.toFixed(2)} times 10 to the power ${exp}`
}

function formatSciHtml(value: number): ReactNode {
  if (value === 0) return '0'
  const exp = Math.floor(Math.log10(value))
  const mantissa = value / 10 ** exp
  return (
    <>
      {mantissa.toFixed(2)} × 10<sup>{exp}</sup>
    </>
  )
}

function formatAxisTickSvg(value: number): ReactNode {
  if (value >= 1e-3) {
    return (
      <>
        {(value * 1e3).toFixed(1)}×10<Sup>−3</Sup>
      </>
    )
  }
  return (
    <>
      {(value * 1e5).toFixed(0)}×10<Sup>−5</Sup>
    </>
  )
}

function buildTakeaway(
  gas: HenryGas,
  pressureBar: number,
  tempK: number,
  mmolPerL: number,
): ReactNode {
  if (gas === 'O2') {
    const coldMmol = dissolvedMillimolesPerLitreWater(
      henryMoleFraction(pressureBar, interpolatedKhKbar('O2', 283)),
    )
    const warmMmol = dissolvedMillimolesPerLitreWater(
      henryMoleFraction(pressureBar, interpolatedKhKbar('O2', 313)),
    )
    if (tempK <= 293) {
      return (
        <>
          Cool water ({tempK} K) keeps K<sub>H</sub>(O<sub>2</sub>) low, holding{' '}
          {mmolPerL.toFixed(2)} mmol L<sup>−1</sup> — nearly{' '}
          {(coldMmol / warmMmol).toFixed(1)}× the oxygen capacity at 313 K. That is why
          aquatic species thrive better in cold waters.
        </>
      )
    }
    return (
      <>
        Warming water to {tempK} K raises K<sub>H</sub>(O<sub>2</sub>) because gas
        dissolution is exothermic, dropping dissolved oxygen to {mmolPerL.toFixed(2)} mmol L
        <sup>−1</sup> compared with {coldMmol.toFixed(2)} mmol L<sup>−1</sup> at 283 K.
      </>
    )
  }
  if (gas === 'N2') {
    const heMmol = dissolvedMillimolesPerLitreWater(
      henryMoleFraction(pressureBar, interpolatedKhKbar('He', tempK)),
    )
    return (
      <>
        At {pressureBar.toFixed(1)} bar (comparable to deep-water diving pressures), N
        <sub>2</sub> dissolves at {mmolPerL.toFixed(2)} mmol L<sup>−1</sup> — almost{' '}
        {(mmolPerL / heMmol).toFixed(1)}× more than He ({heMmol.toFixed(2)} mmol L
        <sup>−1</sup>), explaining why rapid ascent risks nitrogen bubbles (bends).
      </>
    )
  }
  if (gas === 'CO2') {
    return (
      <>
        CO<sub>2</sub> has a very small K<sub>H</sub> (
        {interpolatedKhKbar('CO2', tempK).toFixed(2)} kbar), dissolving{' '}
        {mmolPerL.toFixed(1)} mmol L<sup>−1</sup> at {pressureBar.toFixed(1)} bar. Sealing
        soda bottles under high CO<sub>2</sub> pressure and serving them chilled maximises
        fizz.
      </>
    )
  }
  const n2Mmol = dissolvedMillimolesPerLitreWater(
    henryMoleFraction(pressureBar, interpolatedKhKbar('N2', tempK)),
  )
  return (
    <>
      Helium has the highest K<sub>H</sub> ({interpolatedKhKbar('He', tempK).toFixed(1)}{' '}
      kbar) among these gases, keeping dissolved He to just {mmolPerL.toFixed(2)} mmol L
      <sup>−1</sup> vs {n2Mmol.toFixed(2)} mmol L<sup>−1</sup> for N<sub>2</sub> — ideal for
      diluting deep-sea scuba tanks (11.7% He, 56.2% N<sub>2</sub>, 32.1% O<sub>2</sub>).
    </>
  )
}

export function HenrySolubilityLab({ reducedMotion }: SimulationProps) {
  const [gas, setGas] = useState<HenryGas>('O2')
  const [pressureBar, setPressureBar] = useState<number>(1.0)
  const [tempK, setTempK] = useState<number>(293)
  const t = useAmbientTime(reducedMotion)

  const meta = HENRY_GAS_METADATA[gas]
  const khKbar = interpolatedKhKbar(gas, tempK)
  const x = henryMoleFraction(pressureBar, khKbar)
  const mmolPerL = dissolvedMillimolesPerLitreWater(x)
  const gasColor = GAS_COLOR_TOKEN[gas]

  // Piston height responds directly to partial pressure (higher pressure -> lower piston)
  const pRatio = (pressureBar - MIN_P_BAR) / (MAX_P_BAR - MIN_P_BAR)
  const pistonY = 82 + pRatio * 68
  const headspaceTop = pistonY + 12
  const headspaceH = Math.max(24, LIQUID_Y - headspaceTop - 6)

  // Thermometer level synced smoothly to temperature slider (283 K..313 K)
  const tempLevel = 0.22 + ((tempK - 283) / 30) * 0.68

  // Headspace particle count scales with pressure (4..20)
  const headspaceCount = Math.max(4, Math.min(HEADSPACE_SLOTS.length, Math.round(4 + pRatio * 16)))

  // Dissolved particle count scales with x / plotMaxX so changes in p AND T are clearly visible
  const xNorm = Math.min(1, x / meta.plotMaxX)
  const dissolvedCount = Math.max(
    1,
    Math.min(LIQUID_SLOTS.length, Math.round(1 + xNorm * (LIQUID_SLOTS.length - 1))),
  )

  // Compute plot line endpoints clipped cleanly to [0, plotMaxX] x [0, MAX_P_BAR]
  const computeLineEnd = (kVal: number) => {
    const xAtMaxP = henryMoleFraction(MAX_P_BAR, kVal)
    if (xAtMaxP <= meta.plotMaxX) {
      return {
        x2: PLOT_LEFT + (xAtMaxP / meta.plotMaxX) * PLOT_W,
        y2: PLOT_TOP,
      }
    }
    const pAtMaxX = meta.plotMaxX * kVal * 1000
    return {
      x2: PLOT_RIGHT,
      y2: PLOT_BOTTOM - (pAtMaxX / MAX_P_BAR) * PLOT_H,
    }
  }

  const activeEnd = computeLineEnd(khKbar)
  const refEnd = computeLineEnd(meta.referenceKhKbar)

  const dotX = PLOT_LEFT + Math.min(1, x / meta.plotMaxX) * PLOT_W
  const dotY = PLOT_BOTTOM - (pressureBar / MAX_P_BAR) * PLOT_H
  const tempColor = tempK <= 293 ? 'var(--coolant)' : tempK >= 303 ? 'var(--heat)' : 'var(--accent)'
  const motionSpeed = 1.2 + ((tempK - 283) / 30) * 1.4

  const takeaway = buildTakeaway(gas, pressureBar, tempK, mmolPerL)
  const liveSummary = `${meta.name} at ${pressureBar.toFixed(1)} bar and ${tempK} K: Henry constant ${khKbar.toFixed(2)} kbar, dissolved mole fraction ${formatSciPlain(x)}, concentration ${mmolPerL.toFixed(2)} millimoles per litre of water.`

  return (
    <div className={styles.sim} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <div className={styles.controls}>
        <Segmented
          label="Gas solute"
          options={GAS_OPTIONS}
          value={gas}
          onChange={setGas}
        />
        <div className={styles.sliders}>
          <Slider
            label="Partial pressure (p)"
            value={pressureBar}
            min={MIN_P_BAR}
            max={MAX_P_BAR}
            step={0.1}
            unit="bar"
            format={(v) => v.toFixed(1)}
            onChange={setPressureBar}
          />
          <Slider
            label="Temperature (T)"
            value={tempK}
            min={283}
            max={313}
            step={1}
            unit="K"
            format={(v) => `${Math.round(v)}`}
            onChange={setTempK}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 368"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={liveSummary}
        >
          <VocabDefs idPrefix="hsl" />

          {/* Left panel title */}
          <text
            x={CYL_CX}
            y={26}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={700}
          >
            Pressurised Cylinder (<SvgGasFormula gas={gas} />)
          </text>

          {/* Sleek Thermometer synced to temperature slider */}
          <Thermometer
            x={34}
            y={280}
            height={148}
            bulbRadius={12}
            stemWidth={8.5}
            level={tempLevel}
            ticks={[0.25, 0.5, 0.75]}
          />
          <text
            x={34}
            y={316}
            textAnchor="middle"
            fill={tempColor}
            fontFamily="var(--font-mono)"
            fontSize={14}
            fontWeight={700}
          >
            {tempK} K
          </text>
          <text
            x={34}
            y={336}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize={14}
          >
            {(tempK - 273.15).toFixed(0)} °C
          </text>

          {/* Gas headspace tint */}
          <rect
            x={CYL_LEFT + 2}
            y={pistonY + 11}
            width={CYL_W - 4}
            height={Math.max(8, LIQUID_Y - (pistonY + 11))}
            fill="var(--vapour)"
            opacity={0.55 + pRatio * 0.35}
          />

          {/* Real Glass Cylinder Vessel */}
          <Vessel
            variant="cylinder"
            width={CYL_W}
            height={CYL_H}
            x={CYL_CX}
            y={CYL_CY}
            level={LIQUID_LEVEL}
            liquid
            graduated
          />

          {/* Piston rod & sealing plate */}
          <line
            x1={CYL_CX}
            y1={46}
            x2={CYL_CX}
            y2={pistonY}
            stroke="var(--fg-muted)"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <rect
            x={CYL_LEFT + 3}
            y={pistonY}
            width={CYL_W - 6}
            height={11}
            rx={2.5}
            fill="var(--fg-muted)"
          />

          {/* Pressure badge sitting on piston */}
          <rect
            x={CYL_CX - 46}
            y={pistonY - 24}
            width={92}
            height={22}
            rx={4}
            fill="var(--accent)"
          />
          <text
            x={CYL_CX}
            y={pistonY - 8}
            textAnchor="middle"
            fill="var(--accent-fg)"
            fontFamily="var(--font-mono)"
            fontSize={14}
            fontWeight={700}
          >
            {pressureBar.toFixed(1)} bar
          </text>

          {/* Living gas molecules drifting gently in headspace */}
          {HEADSPACE_SLOTS.slice(0, headspaceCount).map(([nx, ny], idx) => {
            const dx = reducedMotion ? 0 : Math.sin(t * motionSpeed + idx * 1.8) * 4.5
            const dy = reducedMotion ? 0 : Math.cos(t * motionSpeed * 1.15 + idx * 2.1) * Math.min(4, headspaceH * 0.14)
            const cx = Math.max(CYL_LEFT + 11, Math.min(CYL_RIGHT - 11, CYL_LEFT + 14 + nx * (CYL_W - 28) + dx))
            const cy = Math.max(
              headspaceTop + 6,
              Math.min(LIQUID_Y - 7, headspaceTop + 6 + ny * Math.max(12, headspaceH - 10) + dy),
            )
            return (
              <g key={`hs-${idx}`}>
                <circle cx={cx} cy={cy} r={4.5} fill={gasColor} stroke="var(--atom-rim)" strokeWidth={0.9} />
                <circle cx={cx} cy={cy} r={4.5} fill="url(#hsl-sphere-shading)" style={{ pointerEvents: 'none' }} />
              </g>
            )
          })}

          {/* Dissolved gas spheres drifting gently in water */}
          {LIQUID_SLOTS.slice(0, dissolvedCount).map(([nx, ny], idx) => {
            const dx = reducedMotion ? 0 : Math.sin(t * 1.1 + idx * 2.3) * 3.8
            const dy = reducedMotion ? 0 : Math.cos(t * 0.95 + idx * 1.7) * 3.0
            const cx = CYL_LEFT + 14 + nx * (CYL_W - 28) + dx
            const cy = LIQUID_Y + 14 + ny * (CYL_BOTTOM - LIQUID_Y - 28) + dy
            return (
              <g key={`liq-${idx}`}>
                <circle cx={cx} cy={cy} r={4.5} fill={gasColor} stroke="var(--atom-rim)" strokeWidth={0.9} />
                <circle cx={cx} cy={cy} r={4.5} fill="url(#hsl-sphere-shading)" style={{ pointerEvents: 'none' }} />
              </g>
            )
          })}

          {/* Subtle rising bubbles when water is warmer than reference */}
          {tempK > meta.referenceTempK &&
            [0.15, 0.55, 0.85].map((phase, bi) => {
              const u = reducedMotion ? 0.35 + bi * 0.22 : (t * 0.5 + phase) % 1
              const bx = CYL_LEFT + 34 + bi * 38 + (reducedMotion ? 0 : Math.sin(t * 2.8 + bi) * 2.5)
              const by = CYL_BOTTOM - 16 - u * (CYL_BOTTOM - LIQUID_Y - 12)
              return (
                <circle
                  key={`warm-bub-${bi}`}
                  cx={bx}
                  cy={by}
                  r={3.2}
                  fill="none"
                  stroke="var(--heat)"
                  strokeWidth={1.4}
                  opacity={0.25 + 0.7 * Math.sin(u * Math.PI)}
                />
              )
            })}

          {/* Subtle dissolved caption under cylinder */}
          <text
            x={CYL_CX}
            y={326}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            {mmolPerL >= 10 ? mmolPerL.toFixed(1) : mmolPerL.toFixed(2)} mmol L<Sup>−1</Sup>
          </text>

          {/* Subtle vertical divider between cylinder and plot */}
          <line x1={236} y1={42} x2={236} y2={336} stroke="var(--border)" strokeWidth={1} opacity={0.75} />

          {/* RIGHT PANEL: Borderless Henry's-Law Plot */}
          <text
            x={PLOT_LEFT + PLOT_W / 2}
            y={26}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={700}
          >
            Henry&apos;s Law: p = K<Sub>H</Sub> · x (<SvgGasFormula gas={gas} />)
          </text>

          {/* Inline borderless legend directly under plot title */}
          <g transform={`translate(${PLOT_LEFT + 6}, 46)`}>
            <line x1={0} y1={0} x2={20} y2={0} stroke={gasColor} strokeWidth={2.8} strokeLinecap="round" />
            <text
              x={26}
              y={5}
              fill="var(--fg)"
              fontFamily="var(--font-mono)"
              fontSize={14}
            >
              T = {tempK} K
            </text>
            <line
              x1={122}
              y1={0}
              x2={142}
              y2={0}
              stroke="var(--fg-subtle)"
              strokeWidth={1.8}
              strokeDasharray="4 4"
            />
            <text
              x={148}
              y={5}
              fill="var(--fg-muted)"
              fontFamily="var(--font-mono)"
              fontSize={14}
            >
              Ref {meta.referenceTempK} K
            </text>
          </g>

          {/* Horizontal pressure gridlines */}
          {[1, 2, 3, 4, 5].map((pTick) => {
            const gy = PLOT_BOTTOM - (pTick / MAX_P_BAR) * PLOT_H
            return (
              <g key={`pt-${pTick}`}>
                <line
                  x1={PLOT_LEFT}
                  y1={gy}
                  x2={PLOT_RIGHT}
                  y2={gy}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
                <text
                  x={PLOT_LEFT - 10}
                  y={gy + 5}
                  textAnchor="end"
                  fill="var(--fg-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize={14}
                >
                  {pTick}
                </text>
              </g>
            )
          })}

          {/* Vertical x-axis ticks */}
          {[0.5, 1].map((frac) => {
            const gx = PLOT_LEFT + frac * PLOT_W
            return (
              <g key={`xt-${frac}`}>
                <line
                  x1={gx}
                  y1={PLOT_TOP}
                  x2={gx}
                  y2={PLOT_BOTTOM}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
                <text
                  x={gx}
                  y={PLOT_BOTTOM + 21}
                  textAnchor={frac === 1 ? 'end' : 'middle'}
                  fill="var(--fg-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize={14}
                >
                  {formatAxisTickSvg(meta.plotMaxX * frac)}
                </text>
              </g>
            )
          })}
          <text
            x={PLOT_LEFT}
            y={PLOT_BOTTOM + 21}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize={14}
          >
            0
          </text>

          {/* Crisp open L-axes */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_LEFT}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={PLOT_RIGHT}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />

          {/* Axis labels */}
          <text
            x={PLOT_LEFT - 40}
            y={PLOT_TOP + PLOT_H / 2}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            transform={`rotate(-90 ${PLOT_LEFT - 40} ${PLOT_TOP + PLOT_H / 2})`}
          >
            Partial pressure p (bar)
          </text>
          <text
            x={PLOT_LEFT + PLOT_W / 2}
            y={346}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Dissolved mole fraction x
          </text>

          {/* Reference temperature slope line (dashed) */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={refEnd.x2}
            y2={refEnd.y2}
            stroke="var(--fg-subtle)"
            strokeWidth={1.8}
            strokeDasharray="5 5"
          />

          {/* Active Henry's-law slope line */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={activeEnd.x2}
            y2={activeEnd.y2}
            stroke={gasColor}
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Dashed projections & live operating dot */}
          <line
            x1={PLOT_LEFT}
            y1={dotY}
            x2={dotX}
            y2={dotY}
            stroke="var(--accent)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <line
            x1={dotX}
            y1={dotY}
            x2={dotX}
            y2={PLOT_BOTTOM}
            stroke="var(--accent)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <circle
            cx={dotX}
            cy={dotY}
            r={6.5}
            fill={gasColor}
            stroke="var(--surface)"
            strokeWidth={2}
          />
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Henry&apos;s constant K<sub>H</sub> (<HtmlGasFormula gas={gas} />, {tempK} K)
            </span>
            <span className={styles.metricValue}>{khKbar.toFixed(2)} kbar</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Dissolved mole fraction (x)</span>
            <span className={styles.metricValue}>{formatSciHtml(x)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Dissolved <HtmlGasFormula gas={gas} /> in 1 L water
            </span>
            <span className={styles.metricValue}>
              {mmolPerL >= 10 ? mmolPerL.toFixed(1) : mmolPerL.toFixed(2)} mmol L<sup>−1</sup>
            </span>
          </div>
        </div>
        <p className={styles.takeaway}>
          <strong>Chemistry takeaway:</strong> {takeaway}
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
