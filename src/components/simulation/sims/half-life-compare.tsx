'use client'

import { useState } from 'react'
import { Button, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { PlotCurve, PlotFrame, PlotGuide, PlotPoint } from '@/components/vocab'
import { roundToSigFigs } from '@/lib/chem/sigfigs'
import {
  firstOrderConc,
  firstOrderHalfLife,
  formatSig,
  fractionRemainingAfterHalfLives,
  rateConstantUnits,
  zeroOrderConc,
  zeroOrderHalfLife,
  zeroOrderTimeToZero,
} from '@/lib/chem/kinetics'
import styles from './half-life-compare.module.css'

const K_MIN = 0.025
const K_MAX = 0.1
const K_STEP = 0.005
const K_DEFAULT = 0.05
const R0_MIN = 0.5
const R0_MAX = 2
const R0_STEP = 0.05
const R0_DEFAULT = 1
const R0_REFERENCE = 1
const MAX_HALF_LIVES = 4

/** Both plots share one time axis and one concentration axis, so the two orders compare by eye. */
const T_MAX = 60
const C_MAX = 2.1
const X_TICKS = [0, 10, 20, 30, 40, 50, 60]
const Y_TICKS = [0, 0.5, 1, 1.5, 2]
const VB_W = 460
const VB_H = 340
const FRAME = { x: 66, y: 18, width: 370, height: 262 }
const DOMAIN = { xMin: 0, xMax: T_MAX, yMin: 0, yMax: C_MAX }

const num = (x: number) => formatSig(x, 3)
const yTick = (v: number) => roundToSigFigs(v, 2)
const xTick = (v: number) => String(v)

export function HalfLifeCompare(_unused?: SimulationProps) {
  const [k, setK] = useState(K_DEFAULT)
  const [r0, setR0] = useState(R0_DEFAULT)
  const [n, setN] = useState(0)

  // Zero order: t½ = [R]₀/2k (moves with [R]₀). First order: t½ = 0.693/k (fixed by k alone).
  const zeroHalf = zeroOrderHalfLife(r0, k)
  const zeroEnd = zeroOrderTimeToZero(r0, k)
  const zeroAtN = zeroOrderConc(r0, k, n * zeroHalf)
  const firstHalf = firstOrderHalfLife(k)
  const firstAtN = firstOrderConc(r0, k, n * firstHalf)
  const firstFraction = fractionRemainingAfterHalfLives(n)

  const showRef = Math.abs(r0 - R0_REFERENCE) > 1e-9
  const zeroRefEnd = zeroOrderTimeToZero(R0_REFERENCE, k)
  const zeroMarkerT = n * zeroHalf
  const firstMarkerT = n * firstHalf
  const unitsZero = rateConstantUnits(0).text
  const unitsFirst = rateConstantUnits(1).text

  const summary =
    `k = ${num(k)}. [R]₀ = ${num(r0)} mol L⁻¹. Zero order: t½ = ${num(zeroHalf)} s, ` +
    `which moves with [R]₀. First order: t½ = ${num(firstHalf)} s for any [R]₀. ` +
    `After ${n} half-li${n === 1 ? 'fe' : 'ves'}: zero order has ${num(zeroAtN)} mol L⁻¹ left; ` +
    `first order has ${roundToSigFigs(firstFraction * 100, 3)} % of its start left.`

  return (
    <div className={styles.root} data-half-life-compare>
      <div className={styles.controls}>
        <div className={styles.sliders}>
          <Slider
            label="Rate constant k"
            value={k}
            min={K_MIN}
            max={K_MAX}
            step={K_STEP}
            format={num}
            onChange={setK}
          />
          <Slider
            label="Starting concentration [R]₀"
            value={r0}
            min={R0_MIN}
            max={R0_MAX}
            step={R0_STEP}
            unit="mol L⁻¹"
            format={num}
            onChange={setR0}
          />
        </div>
        <div className={styles.stepper} role="group" aria-label="Count half-lives">
          <Button
            variant="secondary"
            onClick={() => setN((v) => Math.max(0, v - 1))}
            disabled={n === 0}
            aria-label="Fewer half-lives"
          >
            − 1 half-life
          </Button>
          <span className={styles.count}>
            Half-lives counted: <strong>{n}</strong>
          </span>
          <Button
            onClick={() => setN((v) => Math.min(MAX_HALF_LIVES, v + 1))}
            disabled={n === MAX_HALF_LIVES}
            aria-label="More half-lives"
          >
            + 1 half-life
          </Button>
        </div>
      </div>

      <p className={styles.note}>
        Dashed grey curves are the same reaction at [R]₀ = 1.00 mol L⁻¹, shown for comparison whenever [R]₀ changes.
      </p>

      <div className={styles.plots}>
        <figure className={styles.plotCard}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`Zero-order plot of [R] against time with k = ${num(k)} mol L⁻¹ s⁻¹ and [R]₀ = ${num(r0)} mol L⁻¹`}
          >
            <PlotFrame
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.width}
              height={FRAME.height}
              domain={DOMAIN}
              xTicks={X_TICKS}
              yTicks={Y_TICKS}
              xTickFormat={xTick}
              yTickFormat={yTick}
              xTitle="t / s"
              yTitle="[R] / mol L⁻¹"
            >
              {showRef && (
                <PlotCurve
                  fn={(t) => zeroOrderConc(R0_REFERENCE, k, t)}
                  from={0}
                  to={Math.min(zeroRefEnd, T_MAX)}
                  tone="neutral"
                  width={2}
                  dashed
                />
              )}
              <PlotCurve
                fn={(t) => zeroOrderConc(r0, k, t)}
                from={0}
                to={Math.min(zeroEnd, T_MAX)}
                tone="reactant"
                width={3.5}
              />
              {zeroHalf <= T_MAX && (
                <PlotGuide
                  at={{ x: zeroHalf, y: r0 / 2 }}
                  to="both"
                  tone="accent"
                  xLabel={`t½ = ${num(zeroHalf)} s`}
                />
              )}
              {n > 0 && zeroMarkerT <= T_MAX && (
                <PlotPoint at={{ x: zeroMarkerT, y: zeroAtN }} tone="product" />
              )}
            </PlotFrame>
          </svg>
          <figcaption className={styles.readout}>
            <h3 className={styles.heading}>Zero order</h3>
            <p>
              Rate = <i className={styles.sym}>k</i>, so the rate stays put while [R] falls.
            </p>
            <p>Units of k: {unitsZero}</p>
            <p>
              t½ = [R]₀ / 2<i className={styles.sym}>k</i> = {num(zeroHalf)} s
            </p>
            <p>
              After {n} half-live{n === 1 ? '' : 's'}: [R] = {num(zeroAtN)} mol L⁻¹
            </p>
          </figcaption>
        </figure>

        <figure className={styles.plotCard}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`First-order plot of [R] against time with k = ${num(k)} s⁻¹ and [R]₀ = ${num(r0)} mol L⁻¹`}
          >
            <PlotFrame
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.width}
              height={FRAME.height}
              domain={DOMAIN}
              xTicks={X_TICKS}
              yTicks={Y_TICKS}
              xTickFormat={xTick}
              yTickFormat={yTick}
              xTitle="t / s"
              yTitle="[R] / mol L⁻¹"
            >
              {showRef && (
                <PlotCurve
                  fn={(t) => firstOrderConc(R0_REFERENCE, k, t)}
                  from={0}
                  to={T_MAX}
                  tone="neutral"
                  width={2}
                  dashed
                />
              )}
              <PlotCurve fn={(t) => firstOrderConc(r0, k, t)} from={0} to={T_MAX} tone="reactant" width={3.5} />
              {firstHalf <= T_MAX && (
                <PlotGuide
                  at={{ x: firstHalf, y: r0 / 2 }}
                  to="both"
                  tone="accent"
                  xLabel={`t½ = ${num(firstHalf)} s`}
                />
              )}
              {n > 0 && firstMarkerT <= T_MAX && (
                <PlotPoint at={{ x: firstMarkerT, y: firstAtN }} tone="product" />
              )}
            </PlotFrame>
          </svg>
          <figcaption className={styles.readout}>
            <h3 className={styles.heading}>First order</h3>
            <p>
              Rate = <i className={styles.sym}>k</i>[R]
            </p>
            <p>Units of k: {unitsFirst}</p>
            <p>
              t½ = 0.693 / <i className={styles.sym}>k</i> = {num(firstHalf)} s, whatever [R]₀ is
            </p>
            <p>
              After {n} half-live{n === 1 ? '' : 's'}: fraction left (½)<sup>{n}</sup> = {num(firstFraction)}
            </p>
          </figcaption>
        </figure>
      </div>

      <p className={styles.summary} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
