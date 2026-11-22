'use client'

import { useState } from 'react'
import { CatalystSurface, Particle, PlotCurve, PlotFrame, PlotPoint, PlotSlopeTriangle, ReactionBox, niceTicks } from '@/components/vocab'
import { Slider } from '@/components/controls'
import {
  averageRate,
  formatSig,
  mulberry32,
  rateConstantUnits,
  zeroOrderConc,
  zeroOrderTangentSlope,
  zeroOrderTimeToZero,
} from '@/lib/chem/kinetics'
import styles from './zero-order-lab.module.css'

const VB_W = 580
const VB_H = 350
const VESSEL = { x: 0, y: 30, width: 240, height: 262 }
const SURFACE = { x: 0, y: 304, width: 240, height: 22 }
const PLOT = { x: 312, y: 30, width: 252, height: 262 }
const SITES = 8
const MOLECULES = 24
const UNIT_K = rateConstantUnits(0).text

// Fixed positions for the molecules in the vessel (seeded, so the picture never jitters on re-render).
const rng = mulberry32(12)
const SLOTS = Array.from({ length: MOLECULES }, (_, i) => ({
  x: 20 + (i % 6) * 40 + (rng() - 0.5) * 8,
  y: 34 + Math.floor(i / 6) * 64 + (rng() - 0.5) * 10,
}))

/** Zero-order lab: [R] falls in a straight line at rate k, and a two-point readout returns k. */
export function ZeroOrderLab() {
  const [R0, setR0] = useState(0.8)
  const [k, setK] = useState(0.025)
  const [t, setT] = useState(10)
  const [t1, setT1] = useState(0)
  const [t2, setT2] = useState(12)

  const tZero = zeroOrderTimeToZero(R0, k)
  const tMax = Math.max(1, Math.ceil(tZero))
  const tNow = Math.min(t, tMax)
  const tA = Math.min(t1, tMax)
  const tB = Math.min(t2, tMax)

  const R = zeroOrderConc(R0, k, tNow)
  const P = R0 - R
  const slope = zeroOrderTangentSlope(k)
  const Ra = zeroOrderConc(R0, k, tA)
  const Rb = zeroOrderConc(R0, k, tB)
  const measured = tB > tA ? averageRate(Ra, Rb, tA, tB) : null
  const canTriangle = tB > tA && tB <= tZero

  // Leave room past the zero crossing for its t label.
  const xMax = Math.max(10, Math.ceil((tZero * 1.3) / 10) * 10)
  const xTicks = niceTicks(0, xMax, 4)
  const molecules = Math.round((MOLECULES * R) / R0)
  const surface = Array.from({ length: SITES }, () => R > 0)

  const kText = `${formatSig(k, 3)} ${UNIT_K}`
  const slopeText = `${formatSig(slope, 3)} ${UNIT_K}`
  const measuredText = measured === null ? 'choose two different times' : `${formatSig(measured, 3)} ${UNIT_K}`
  const summary =
    `Initial [R] ${formatSig(R0, 3)} mol L⁻¹, k ${kText}. ` +
    `At t = ${formatSig(tNow, 3)} s, [R] = ${formatSig(R, 3)} mol L⁻¹ and [P] = ${formatSig(P, 3)} mol L⁻¹. ` +
    `The line reaches zero at t = ${formatSig(tZero, 3)} s. ` +
    (measured === null ? 'Choose two different times to measure k.' : `k from the two times: ${measuredText}.`)

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.sliderGrid}>
          <Slider label="Initial [R]₀" value={R0} min={0.2} max={1} step={0.01} unit="mol L⁻¹" onChange={setR0} />
          <Slider label="Rate constant k" value={k} min={0.005} max={0.05} step={0.001} unit={UNIT_K} onChange={setK} />
          <Slider label="Time t" value={tNow} min={0} max={tMax} step={0.5} unit="s" onChange={setT} />
          <Slider label="First time t₁" value={tA} min={0} max={tMax} step={0.5} unit="s" onChange={setT1} />
          <Slider label="Second time t₂" value={tB} min={0} max={tMax} step={0.5} unit="s" onChange={setT2} />
        </div>
      </div>

      <div className={styles.stage}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="Molecules over a saturated surface, and the straight-line plot of [R] against time">
          <text x={120} y={20} textAnchor="middle" className={styles.caption}>
            Gas above the surface
          </text>
          <ReactionBox x={VESSEL.x} y={VESSEL.y} width={VESSEL.width} height={VESSEL.height} radius={12}>
            {SLOTS.map((p, i) => (
              <Particle key={i} x={p.x} y={p.y} r={11} tone={i < molecules ? 'reactant' : 'product'} />
            ))}
          </ReactionBox>
          <CatalystSurface x={SURFACE.x} y={SURFACE.y} width={SURFACE.width} height={SURFACE.height} occupied={surface} />
          <text x={120} y={345} textAnchor="middle" className={styles.caption}>
            Surface sites: all busy while [R] &gt; 0
          </text>

          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={{ xMin: 0, xMax, yMin: 0, yMax: 1 }}
            xTicks={xTicks}
            yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            yTickFormat={(v) => v.toFixed(1)}
            xTitle="t / s"
            yTitle="[R] / mol L⁻¹"
            grid
          >
            <PlotCurve fn={(x) => zeroOrderConc(R0, k, x)} from={0} to={tZero} tone="reactant" width={3} />
            <PlotCurve fn={(x) => R0 - zeroOrderConc(R0, k, x)} from={0} to={tZero} tone="product" width={2.4} dashed />
            <PlotPoint at={{ x: tZero, y: 0 }} tone="reactant" label={`t = ${formatSig(tZero, 3)} s`} side="ne" />
            {tB > tA && (
              <>
                <PlotPoint at={{ x: tA, y: Ra }} tone="accent" label="t₁" side="ne" />
                <PlotPoint at={{ x: tB, y: Rb }} tone="catalyst" label="t₂" side="ne" />
              </>
            )}
            {canTriangle && (
              <PlotSlopeTriangle at={{ x: tA, y: Ra }} dx={tB - tA} slope={slope} dxLabel="Δt" tone="neutral" />
            )}
            <PlotPoint at={{ x: tNow, y: R }} tone="reactant" />
          </PlotFrame>
        </svg>

        <ul className={styles.legend}>
          <li>
            <span className={styles.swatchReactant} aria-hidden="true" />
            Reactant R (solid)
          </li>
          <li>
            <span className={styles.swatchProduct} aria-hidden="true" />
            Product P (dashed)
          </li>
          <li>
            <span className={styles.swatchSurface} aria-hidden="true" />
            Surface site
          </li>
        </ul>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>Slope of [R] vs t</dt>
          <dd>{slopeText}</dd>
        </div>
        <div>
          <dt>Intercept [R]₀</dt>
          <dd>{formatSig(R0, 3)} mol L⁻¹</dd>
        </div>
        <div>
          <dt>Time to [R] = 0</dt>
          <dd>{formatSig(tZero, 3)} s</dd>
        </div>
        <div>
          <dt>[R] at t</dt>
          <dd>{formatSig(R, 3)} mol L⁻¹</dd>
        </div>
        <div>
          <dt>[P] at t</dt>
          <dd>{formatSig(P, 3)} mol L⁻¹</dd>
        </div>
        <div>
          <dt>k from t₁ and t₂</dt>
          <dd>{measuredText}</dd>
        </div>
      </dl>

      <p className={styles.note}>
        Every point of this line has the same slope, so the rate is k at every time. The line is ideal: it stops at [R] = 0 at t = [R]₀/k.
        Real curves bend before that once the surface stops being saturated.
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
