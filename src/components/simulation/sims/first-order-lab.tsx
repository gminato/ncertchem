'use client'

import { useState } from 'react'
import { Segmented, Slider, Toggle } from '@/components/controls'
import {
  PlotCurve,
  PlotFrame,
  PlotLine,
  PlotPoint,
  Particle,
  RateMeter,
  ReactionBox,
  Stopwatch,
  niceTicks,
} from '@/components/vocab'
import { firstOrderConc, firstOrderTangentSlope, formatSci, formatSig, lnConc, log10Ratio } from '@/lib/chem/kinetics'
import {
  DEFAULT_K,
  DEFAULT_R0,
  DEFAULT_T,
  P_INITIAL,
  T_MAX,
  T_MIN,
  VESSEL_A0,
  plotDomain,
  readConcentration,
  readPressure,
  vesselCounts,
  type PlotMode,
} from './first-order-lab-model'
import styles from './first-order-lab.module.css'

const MODE_OPTIONS = [
  { value: 'conc', label: '[R] vs t' },
  { value: 'ln', label: 'ln[R] vs t' },
  { value: 'log', label: 'log([R]₀/[R]) vs t' },
] as const

const MODE_TITLE: Record<PlotMode, string> = {
  conc: '[R] / mol L⁻¹',
  ln: 'ln([R] / mol L⁻¹)',
  log: 'log₁₀([R]₀/[R])',
}

const TIME_TICKS = [0, 20, 40, 60, 80, 100, 120]

/** The drawn vessel: 24 fixed sites in a 6 × 4 grid, with a small fixed offset per site so the molecules look loose. */
const VESSEL = { x: 20, y: 28, width: 300, height: 300 }
const SITES = Array.from({ length: VESSEL_A0 * 2 }, (_, i) => {
  const col = i % 6
  const row = Math.floor(i / 6)
  return {
    x: 30 + col * 46 + ((i * 7) % 5 - 2) * 3,
    y: 40 + row * 70 + ((i * 3) % 5 - 2) * 3,
  }
})

function sci(value: number): string {
  return formatSci(value, 3)
}

export function FirstOrderLab() {
  const [R0, setR0] = useState(DEFAULT_R0)
  const [k, setK] = useState(DEFAULT_K)
  const [t, setT] = useState(DEFAULT_T)
  const [mode, setMode] = useState<PlotMode>('conc')
  const [pressure, setPressure] = useState(false)

  const c = readConcentration(R0, k, t)
  const p = readPressure(k, t)
  const dom = plotDomain(mode, R0, k)
  const yTicks = niceTicks(dom.yMin, dom.yMax, 4).filter((v) => v >= dom.yMin - 1e-9 && v <= dom.yMax + 1e-9)
  const counts = vesselCounts(k, t)

  const cursorY = mode === 'conc' ? c.R : mode === 'ln' ? lnConc(c.R) : log10Ratio(R0, c.R)

  const liveSummary = pressure
    ? `At ${t} s, total pressure pₜ = ${formatSig(p.pT, 3)} atm and partial pressure pₐ = ${formatSig(p.pA, 3)} atm, out of a ceiling of ${formatSig(p.pCeiling, 3)} atm. k from the readings is ${formatSig(p.kFromReading, 3)} s⁻¹.`
    : `At ${t} s, [R] = ${formatSig(c.R, 3)} mol L⁻¹, rate = k[R] = ${sci(c.rate)} mol L⁻¹ s⁻¹. k from this reading is ${formatSig(c.kFromReading, 3)} s⁻¹.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.sliderGrid}>
          <Slider label="[R]₀" unit="mol L⁻¹" value={R0} min={0.05} max={0.4} step={0.01} onChange={setR0} format={(v) => formatSig(v, 3)} />
          <Slider label="Rate constant k" unit="s⁻¹" value={k} min={0.005} max={0.1} step={0.001} onChange={setK} format={(v) => formatSig(v, 3)} />
          <Slider label="Time t" unit="s" value={t} min={T_MIN} max={T_MAX} step={1} onChange={setT} />
        </div>
        <div className={styles.choices}>
          {pressure ? null : <Segmented label="Plot" options={MODE_OPTIONS} value={mode} onChange={setMode} />}
          <Toggle label={`Pressure mode (gas A(g) → B(g) + C(g), pᵢ = ${formatSig(P_INITIAL, 3)} atm)`} checked={pressure} onChange={setPressure} />
        </div>
      </div>

      <div className={styles.stage}>
        {pressure ? (
          <svg className={styles.scene} viewBox="0 0 520 380" role="img" aria-label="Sealed vessel with A, B and C molecules, a stopwatch and pressure meters">
            <ReactionBox x={VESSEL.x} y={VESSEL.y} width={VESSEL.width} height={VESSEL.height} caption="Sealed vessel, constant volume">
              {Array.from({ length: counts.reactant }, (_, i) => (
                <Particle key={`a${i}`} x={SITES[i].x} y={SITES[i].y} r={9} tone="reactant" />
              ))}
              {Array.from({ length: 2 * counts.productEach }, (_, j) => {
                const site = SITES[counts.reactant + j]
                return <Particle key={`p${j}`} x={site.x} y={site.y} r={9} tone={j % 2 === 0 ? 'product' : 'accent'} />
              })}
            </ReactionBox>
            <Stopwatch x={372} y={40} size={96} seconds={t} digits={0} />
            <RateMeter x={332} y={214} width={168} height={26} value={p.pT} max={p.pCeiling} label={<>Total, p<tspan dy="0.3em">t</tspan></>} valueLabel={`${formatSig(p.pT, 3)} atm`} tone="accent" />
            <RateMeter x={332} y={300} width={168} height={26} value={p.pA} max={p.pCeiling} label={<>Partial, p<tspan dy="0.3em">A</tspan></>} valueLabel={`${formatSig(p.pA, 3)} atm`} tone="reactant" />
          </svg>
        ) : (
          <svg className={styles.scene} viewBox="0 0 520 380" role="img" aria-label={`Plot of ${MODE_TITLE[mode]} against time with the cursor at ${t} seconds`}>
            <PlotFrame
              x={84}
              y={24}
              width={420}
              height={300}
              domain={{ xMin: 0, xMax: T_MAX, yMin: dom.yMin, yMax: dom.yMax }}
              xTicks={TIME_TICKS}
              yTicks={yTicks}
              xTickFormat={(v) => String(v)}
              yTickFormat={(v) => formatSig(v, 2)}
              xTitle="t / s"
              yTitle={MODE_TITLE[mode]}
            >
              {mode === 'conc' && (
                <>
                  <PlotCurve fn={(x) => firstOrderConc(R0, k, x)} from={0} to={T_MAX} tone="reactant" width={3} />
                  <PlotLine through={{ x: t, y: c.R }} slope={firstOrderTangentSlope(R0, k, t)} tone="product" dashed />
                </>
              )}
              {mode === 'ln' && <PlotLine through={{ x: 0, y: Math.log(R0) }} slope={-k} tone="reactant" width={3} />}
              {mode === 'log' && <PlotLine through={{ x: 0, y: 0 }} slope={k / 2.303} tone="product" width={3} />}
              <PlotPoint at={{ x: t, y: cursorY }} tone={mode === 'log' ? 'product' : 'reactant'} label={mode === 'conc' ? `[R] = ${formatSig(c.R, 3)}` : undefined} side={t > 80 ? 'nw' : 'ne'} />
            </PlotFrame>
          </svg>
        )}
      </div>

      <div className={styles.readout}>
        <div className={styles.results}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{pressure ? 'Total pressure pₜ' : <><span className="sym">[R]</span> at {t} s</>}</span>
            <span className={styles.statValue}>{pressure ? `${formatSig(p.pT, 3)} atm` : `${formatSig(c.R, 3)} mol L⁻¹`}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              {pressure ? (
                <>Partial pressure p<span className={styles.sub}>A</span></>
              ) : (
                <>Rate = <span className="sym">k</span>[<span className="sym">R</span>]</>
              )}
            </span>
            <span className={styles.statValue}>{pressure ? `${formatSig(p.pA, 3)} atm` : `${sci(c.rate)} mol L⁻¹ s⁻¹`}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <span className="sym">k</span> from this reading
            </span>
            <span className={styles.statValue}>{formatSig(pressure ? p.kFromReading : c.kFromReading, 3)} s⁻¹</span>
          </div>
        </div>
        <p className={styles.note}>
          {pressure
            ? `The vessel draws the same gas ratio as the readings: each A that decomposes gives one B and one C, so the drawn counts round the exact values. The scale runs from 0 to 2pᵢ = ${formatSig(p.pCeiling, 3)} atm.`
            : 'The curve is the reaction; the dashed line is the tangent, whose slope is −k[R]. Switch the plot to see the straight lines that give k.'}
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
