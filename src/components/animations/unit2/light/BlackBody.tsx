'use client'

import { Label, SpectrumStrip, VocabDefs } from '@/components/vocab'
import { planckRadiance, peakWavelengthNm } from '@/lib/chem/black-body'
import { superscript } from '@/lib/chem/mole-bridge'
import {
  CURVE_TEMPERATURES_K,
  PLOT_NM,
  PLOT_RADIANCE,
  blackBodyStepDescription,
  clampBlackBodyStep,
  curveFractions,
  curvesForStep,
  peakLabelNm,
  plotFractionX,
  plotFractionY,
} from './black-body-steps'
import styles from './light.module.css'

export interface BlackBodyProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540

/** The plot frame, in SVG units. Curves are drawn inside it. */
const PLOT = { left: 92, right: 430, top: 120, bottom: 400 }
const plotX = (nm: number) => PLOT.left + plotFractionX(nm) * (PLOT.right - PLOT.left)
const plotY = (radiance: number) => PLOT.bottom - plotFractionY(radiance) * (PLOT.bottom - PLOT.top)

/** Stroke colour for each temperature. Only tokens are used, so both themes stay consistent. */
const CURVE_STROKE: Readonly<Record<number, string>> = {
  3000: 'var(--fg-subtle)',
  4000: 'var(--fg-muted)',
  5000: 'var(--accent)',
  6000: 'var(--orbit-active)',
}

const X_TICKS_NM = [500, 1000, 1500, 2000, 2500, 3000] as const
const Y_TICK_EXPONENTS = [10, 11, 12, 13, 14] as const

const VISIBLE = { from: 380, to: 750 } as const

/** The cavity of Step 0, in SVG units. */
const CAVITY = { left: 170, right: 470, top: 170, bottom: 400, holeLeft: 300, holeRight: 340 }

/** Path of the cavity walls. The top wall is left open at the tiny hole. */
const CAVITY_PATH = `M${CAVITY.holeLeft},${CAVITY.top} H${CAVITY.left} V${CAVITY.bottom} H${CAVITY.right} V${CAVITY.top} H${CAVITY.holeRight}`

function CurvePath({ temperatureK }: { temperatureK: number }) {
  const points = curveFractions(temperatureK)
  const d = points
    .map((p, i) => {
      const x = PLOT.left + p.x * (PLOT.right - PLOT.left)
      const y = PLOT.bottom - p.y * (PLOT.bottom - PLOT.top)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <path
      d={d}
      className={styles.curve}
      style={{ stroke: CURVE_STROKE[temperatureK] ?? 'var(--accent)' }}
      data-testid="bb-curve"
      data-temperature={temperatureK}
    />
  )
}

/** The plot frame: axes, log-scale ticks and axis titles. */
function Frame() {
  return (
    <g>
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} className={styles.axis} />
      <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} className={styles.axis} />
      {Y_TICK_EXPONENTS.map((exp) => {
        const y = plotY(Math.pow(10, exp))
        return (
          <g key={`y-${exp}`}>
            <line x1={PLOT.left - 6} x2={PLOT.left} y1={y} y2={y} className={styles.axis} />
            <Label x={PLOT.left - 10} y={y} textAnchor="end" fontSize={15} fill="var(--fg-subtle)">
              10{superscript(exp)}
            </Label>
          </g>
        )
      })}
      {X_TICKS_NM.map((nm) => {
        const x = plotX(nm)
        return (
          <g key={`x-${nm}`}>
            <line x1={x} x2={x} y1={PLOT.bottom} y2={PLOT.bottom + 6} className={styles.axis} />
            <Label x={x} y={PLOT.bottom + 26} fontSize={15} fill="var(--fg-subtle)">
              {nm}
            </Label>
          </g>
        )
      })}
      <Label x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 56} fontSize={16}>
        Wavelength <tspan className="sym">λ</tspan> / nm
      </Label>
      <Label x={PLOT.left} y={PLOT.top - 22} textAnchor="start" fontSize={15}>
        Spectral radiance <tspan className="sym">B</tspan>
        <tspan dy="0.3em" fontSize="0.75em" className="sym">λ</tspan>
        <tspan dy="-0.3em"> (W sr⁻¹ m⁻³)</tspan>
      </Label>
    </g>
  )
}

/**
 * BlackBody: a cavity with a tiny hole (Step 0), the Planck curve at 3000 K with
 * its peak (Step 1), four curves that rise and shift to shorter wavelengths as
 * the temperature rises (Step 2), and Planck's quantised energy steps (Step 3).
 * Every curve is computed by planckRadiance in src/lib/chem/black-body.ts.
 */
export function BlackBody({ step, reducedMotion }: BlackBodyProps) {
  const active = clampBlackBodyStep(step)
  const enter = reducedMotion ? undefined : styles.enter
  const curves = curvesForStep(active)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={blackBodyStepDescription(active)}
        data-testid="black-body"
        data-step={active}
      >
        <VocabDefs idPrefix="bb" />

        {active === 0 && (
          <g className={enter}>
            <rect
              x={CAVITY.left}
              y={CAVITY.top}
              width={CAVITY.right - CAVITY.left}
              height={CAVITY.bottom - CAVITY.top}
              className={styles.glow}
            />
            <path d={CAVITY_PATH} className={styles.cavity} fill="none" />
            {[
              [292, 90, 310, 150],
              [320, 70, 320, 150],
              [348, 90, 330, 150],
            ].map(([x1, y1, x2, y2]) => (
              <line key={`ray-${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.ray} />
            ))}
            {[
              [230, 300],
              [392, 262],
              [262, 372],
              [400, 362],
            ].map(([cx, cy]) => (
              <circle key={`hit-${cx}-${cy}`} cx={cx} cy={cy} r={5} style={{ fill: 'var(--fg-muted)' }} />
            ))}
            <Label x={320} y={58} fontSize={16}>
              Light enters a tiny hole
            </Label>
            <Label x={320} y={452} fontSize={16}>
              The walls absorb it, so the hole looks black.
            </Label>
            <Label x={320} y={486} fontSize={16}>
              A black body absorbs all light, and emits by its temperature alone.
            </Label>
          </g>
        )}

        {active === 1 && (
          <g className={enter}>
            <Frame />
            <CurvePath temperatureK={3000} />
            {(() => {
              const peak = peakWavelengthNm(3000)
              const radiance = planckRadiance(peak * 1e-9, 3000)
              return (
                <g>
                  <circle cx={plotX(peak)} cy={plotY(radiance)} r={5} style={{ fill: 'var(--accent)' }} />
                  <Label x={plotX(peak)} y={plotY(radiance) - 24} fontSize={16}>
                    peak {peakLabelNm(3000)} nm
                  </Label>
                </g>
              )
            })()}
            <SpectrumStrip
              x={plotX(VISIBLE.from)}
              y={PLOT.bottom - 14}
              width={plotX(VISIBLE.to) - plotX(VISIBLE.from)}
              height={10}
              rangeNm={[VISIBLE.from, VISIBLE.to]}
              mode="continuous"
              ticks={[]}
              idPrefix="bb-visible"
            />
            <Label x={(plotX(VISIBLE.from) + plotX(VISIBLE.to)) / 2} y={PLOT.bottom - 26} fontSize={15} fill="var(--fg)">
              visible
            </Label>
            <Label x={PLOT.right + 20} y={PLOT.top + 28} textAnchor="start" fontSize={16} fill="var(--fg)">
              3000 K
            </Label>
            <Label x={PLOT.right + 20} y={PLOT.top + 56} textAnchor="start" fontSize={15}>
              mostly infrared
            </Label>
          </g>
        )}

        {active === 2 && (
          <g className={enter}>
            <Frame />
            {CURVE_TEMPERATURES_K.map((t) => {
              const peak = peakWavelengthNm(t)
              return (
                <line
                  key={`guide-${t}`}
                  x1={plotX(peak)}
                  x2={plotX(peak)}
                  y1={plotY(planckRadiance(peak * 1e-9, t))}
                  y2={PLOT.bottom}
                  className={styles.guide}
                />
              )
            })}
            {curves.map((t) => (
              <CurvePath key={t} temperatureK={t} />
            ))}
            <Legend curves={curves} />
          </g>
        )}

        {active === 3 && (
          <g className={enter}>
            <path
              d="M70,400 L270,140"
              className={styles.guide}
              strokeWidth={2}
            />
            <Label x={170} y={112} fontSize={16} fill="var(--fg-subtle)">
              Classical: any energy
            </Label>
            {[400, 336, 272, 208, 144].map((y, i) => (
              <line
                key={`rung-${i}`}
                x1={340}
                x2={470}
                y1={y}
                y2={y}
                className={styles.rung}
              />
            ))}
            {[
              <>E = 0</>,
              <>
                <tspan className="sym">E</tspan> = <tspan className="sym">h</tspan>
                <tspan className="sym">ν</tspan>
              </>,
              <>
                <tspan className="sym">E</tspan> = 2<tspan className="sym">h</tspan>
                <tspan className="sym">ν</tspan>
              </>,
              <>
                <tspan className="sym">E</tspan> = 3<tspan className="sym">h</tspan>
                <tspan className="sym">ν</tspan>
              </>,
              <>…</>,
            ].map((text, i) => (
              <Label key={i} x={486} y={[400, 336, 272, 208, 144][i]} textAnchor="start" fontSize={16} fill="var(--fg)">
                {text}
              </Label>
            ))}
            <Label x={400} y={112} fontSize={16} fill="var(--fg)">
              Planck: steps of hν only
            </Label>
            <Label x={70} y={470} textAnchor="start" fontSize={16}>
              <tspan className="sym">h</tspan> = 6.626 × 10⁻³⁴ J s is Planck’s constant.
            </Label>
          </g>
        )}
      </svg>
    </div>
  )
}

/** Legend for the curves on the Step: swatch, temperature, and the peak wavelength. */
function Legend({ curves }: { curves: readonly number[] }) {
  return (
    <g>
      {curves.map((t, i) => {
        const y = PLOT.top + 26 + i * 52
        return (
          <g key={`legend-${t}`}>
            <line
              x1={PLOT.right + 20}
              x2={PLOT.right + 48}
              y1={y}
              y2={y}
              className={styles.curve}
              style={{ stroke: CURVE_STROKE[t] ?? 'var(--accent)' }}
            />
            <Label x={PLOT.right + 58} y={y} textAnchor="start" fontSize={16} fill="var(--fg)">
              {t} K
            </Label>
            <Label x={PLOT.right + 58} y={y + 20} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
              peak {peakLabelNm(t)} nm
            </Label>
          </g>
        )
      })}
    </g>
  )
}
