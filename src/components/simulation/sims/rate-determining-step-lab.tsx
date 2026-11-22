'use client'

import { useRef, useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Button, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { Particle, PlotCurve, PlotFrame, PlotGuide, PlotPoint, ReactionBox } from '@/components/vocab'
import { mulberry32 } from '@/lib/chem/orbital-density'
import { formatSig, twoStepSeries } from '@/lib/chem/kinetics'
import { intermediatePeak, slowerStep } from '@/lib/chem/rate-determining-step'
import styles from './rate-determining-step-lab.module.css'

/** Starting concentration of A, mol L⁻¹. Fixed, so the Prose and the lab use the same value. */
const A0 = 1
const T_MAX = 30
const DEFAULT_K1 = 0.1
const DEFAULT_K2 = 1
const DEFAULT_T = 10
const K_MIN = 0.01
const K_MAX = 2
/** Dots drawn for A0: each dot is A0 / DOTS mol L⁻¹. */
const DOTS = 40
const COLS = 8
const ROWS = 5

const BOX_W = 150
const BOX_H = 150
const BOX_Y = 18
const BOX_X = [12, 215, 418] as const
const PAD = 16
const DOT_R = 5.5

/** Fixed dot slots inside a vessel, with a small seeded jitter (no Math.random). */
const SLOTS: readonly { x: number; y: number }[] = (() => {
  const rand = mulberry32(7)
  const cellW = (BOX_W - 2 * PAD) / COLS
  const cellH = (BOX_H - 2 * PAD) / ROWS
  return Array.from({ length: DOTS }, (_, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    return {
      x: PAD + (col + 0.5) * cellW + (rand() - 0.5) * 3,
      y: PAD + (row + 0.5) * cellH + (rand() - 0.5) * 3,
    }
  })
})()

const PLOT = { x: 64, y: 250, width: 496, height: 214 }
const Y_MAX = 1.1

function dotsFor(concentration: number): number {
  return Math.max(0, Math.min(DOTS, Math.round((concentration / A0) * DOTS)))
}

function presetLabel(step: 'step1' | 'step2'): string {
  return step === 'step1' ? 'Preset: step 1 slow' : 'Preset: step 2 slow'
}

export function RateDeterminingStepLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const wobble = useAmbientTime(reducedMotion || !active)

  const [k1, setK1] = useState(DEFAULT_K1)
  const [k2, setK2] = useState(DEFAULT_K2)
  const [t, setT] = useState(DEFAULT_T)

  const now = twoStepSeries(A0, k1, k2, t)
  const peak = intermediatePeak(A0, k1, k2)
  const which = slowerStep(k1, k2)
  const rateA = k1 * now.A
  const rateP = k2 * now.I
  const tFmt = formatSig(t, 3)

  const summary =
    which === 'step1'
      ? `Step 1 is the slower step, so it sets the overall rate. The intermediate stays small: its largest value is ${formatSig(peak.I, 3)} mol L⁻¹.`
      : which === 'step2'
        ? `Step 2 is the slower step. The intermediate I builds up: its largest value is ${formatSig(peak.I, 3)} mol L⁻¹, at t = ${formatSig(peak.t, 3)} s.`
        : 'Both steps are equally fast, so the intermediate builds up and drains at the same pace.'

  const xTicks = [0, 5, 10, 15, 20, 25, 30]
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  const vessel = (index: 0 | 1 | 2, conc: number) => {
    const count = dotsFor(conc)
    const tone = index === 0 ? 'reactant' : index === 1 ? 'catalyst' : 'product'
    return (
      <ReactionBox x={BOX_X[index]} y={BOX_Y} width={BOX_W} height={BOX_H}>
        {SLOTS.slice(0, count).map((s, i) => {
          const dx = reducedMotion ? 0 : Math.sin(wobble * 1.3 + i * 1.7) * 1.2
          const dy = reducedMotion ? 0 : Math.cos(wobble * 1.1 + i * 2.3) * 1.2
          return <Particle key={i} x={s.x + dx} y={s.y + dy} r={DOT_R} tone={tone} />
        })}
      </ReactionBox>
    )
  }

  return (
    <div className={styles.sim} ref={rootRef}>
      <div className={styles.controls}>
        <div className={styles.sliderGrid}>
          <Slider label="Rate constant k₁ (step 1)" unit="s⁻¹" value={k1} min={K_MIN} max={K_MAX} step={0.01} onChange={setK1} />
          <Slider label="Rate constant k₂ (step 2)" unit="s⁻¹" value={k2} min={K_MIN} max={K_MAX} step={0.01} onChange={setK2} />
          <Slider label="Time" unit="s" value={t} min={0} max={T_MAX} step={0.1} onChange={setT} />
        </div>
        <div className={styles.presets}>
          <Button variant="secondary" onClick={() => { setK1(DEFAULT_K1); setK2(DEFAULT_K2) }}>
            {presetLabel('step1')}
          </Button>
          <Button variant="secondary" onClick={() => { setK1(DEFAULT_K2); setK2(DEFAULT_K1) }}>
            {presetLabel('step2')}
          </Button>
        </div>
      </div>

      <svg
        className={styles.svg}
        viewBox="0 0 580 520"
        role="img"
        aria-label={`Vessels A, I and P hold ${formatSig(now.A, 2)}, ${formatSig(now.I, 2)} and ${formatSig(now.P, 2)} mol per litre at ${tFmt} seconds, with a plot of the three concentrations against time.`}
      >
        {/* Mechanism pipeline: A → I → P */}
        {vessel(0, now.A)}
        {vessel(1, now.I)}
        {vessel(2, now.P)}

        <g className={styles.arrow}>
          <line x1={166} y1={BOX_Y + BOX_H / 2} x2={206} y2={BOX_Y + BOX_H / 2} />
          <path d={`M206 ${BOX_Y + BOX_H / 2 - 6} L214 ${BOX_Y + BOX_H / 2} L206 ${BOX_Y + BOX_H / 2 + 6} Z`} />
          <text x={186} y={BOX_Y + BOX_H / 2 - 12} textAnchor="middle" className={styles.label}>k₁</text>
        </g>
        <g className={styles.arrow}>
          <line x1={369} y1={BOX_Y + BOX_H / 2} x2={409} y2={BOX_Y + BOX_H / 2} />
          <path d={`M409 ${BOX_Y + BOX_H / 2 - 6} L417 ${BOX_Y + BOX_H / 2} L409 ${BOX_Y + BOX_H / 2 + 6} Z`} />
          <text x={389} y={BOX_Y + BOX_H / 2 - 12} textAnchor="middle" className={styles.label}>k₂</text>
        </g>

        <text x={BOX_X[0] + BOX_W / 2} y={BOX_Y + BOX_H + 26} textAnchor="middle" className={styles.label}>
          [A] = {formatSig(now.A, 3)}
        </text>
        <text x={BOX_X[1] + BOX_W / 2} y={BOX_Y + BOX_H + 26} textAnchor="middle" className={styles.label}>
          [I] = {formatSig(now.I, 3)}
        </text>
        <text x={BOX_X[2] + BOX_W / 2} y={BOX_Y + BOX_H + 26} textAnchor="middle" className={styles.label}>
          [P] = {formatSig(now.P, 3)}
        </text>

        {/* Concentration against time */}
        <PlotFrame
          x={PLOT.x}
          y={PLOT.y}
          width={PLOT.width}
          height={PLOT.height}
          domain={{ xMin: 0, xMax: T_MAX, yMin: 0, yMax: Y_MAX }}
          xTicks={xTicks}
          yTicks={yTicks}
          yTickFormat={(v) => formatSig(v, 2)}
          xTitle="t / s"
          yTitle="[X] / mol L⁻¹"
        >
          <PlotCurve fn={(x) => twoStepSeries(A0, k1, k2, x).A} from={0} to={T_MAX} tone="reactant" />
          <PlotCurve fn={(x) => twoStepSeries(A0, k1, k2, x).I} from={0} to={T_MAX} tone="catalyst" />
          <PlotCurve fn={(x) => twoStepSeries(A0, k1, k2, x).P} from={0} to={T_MAX} tone="product" />
          <PlotGuide at={{ x: t, y: 0 }} to="x" tone="neutral" />
          <PlotPoint at={{ x: t, y: now.A }} tone="reactant" />
          <PlotPoint at={{ x: t, y: now.I }} tone="catalyst" />
          <PlotPoint at={{ x: t, y: now.P }} tone="product" />
        </PlotFrame>
      </svg>

      <ul className={styles.legend} aria-label="Curve key">
        <li><span className={styles.swatchReactant} aria-hidden="true" />A, reactant</li>
        <li><span className={styles.swatchCatalyst} aria-hidden="true" />I, intermediate</li>
        <li><span className={styles.swatchProduct} aria-hidden="true" />P, product</li>
      </ul>

      <dl className={styles.readout}>
        <div>
          <dt>Rate = k₁[A] (A used up)</dt>
          <dd>{formatSig(rateA, 3)} mol L⁻¹ s⁻¹</dd>
        </div>
        <div>
          <dt>k₂[I] (P formed)</dt>
          <dd>{formatSig(rateP, 3)} mol L⁻¹ s⁻¹</dd>
        </div>
        <div>
          <dt>Largest [I]</dt>
          <dd>{formatSig(peak.I, 3)} mol L⁻¹ at {formatSig(peak.t, 3)} s</dd>
        </div>
      </dl>

      <p className={styles.summary} aria-live="polite">
        {summary} At t = {tFmt} s: [A] = {formatSig(now.A, 3)}, [I] = {formatSig(now.I, 3)}, [P] = {formatSig(now.P, 3)} mol L⁻¹.
      </p>
    </div>
  )
}
