'use client'

import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { mulberry32 } from '@/lib/chem/kinetics'
import {
  CatalystSurface,
  Particle,
  PlotCurve,
  PlotFrame,
  PlotGuide,
  PlotLine,
  PlotPoint,
  PlotSlopeTriangle,
  ReactionBox,
  VocabDefs,
} from '@/components/vocab'
import {
  K,
  R0,
  T_ZERO,
  getZeroOrderStepState,
  idealConc,
  realConc,
} from './zeroorder-steps'

export interface ZeroOrderSurfaceProps {
  step: number
  reducedMotion: boolean
}

const SVG_H = 540
const BOX = { x: 30, y: 12, width: 520, height: 180 }
const SLAB = { x: 20, y: 118, width: 480, height: 52 }
/** Same radius for gas molecules and bound ones (CatalystSurface draws bound ones at 16 with 9 sites). */
const NH3_R = 16
const RATE_X = 60
const RATE_FULL = 300
const RATE_Y = 244
const PLOT = { x: 88, y: 298, width: 460, height: 190 }
const T_MAX = 36
const C_MAX = 0.9

/** Step 4 slope triangle: run from t = 14 s to 26 s, clear of the points at 0 s and 12 s and of the y-axis. */
const TRI_T0 = 14
const TRI_RUN = 12

const HALO = { stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' } as const

/** Data to SVG pixels for the plot window (the same box PlotFrame draws in). */
const plotX = (t: number) => PLOT.x + (t / T_MAX) * PLOT.width
const plotY = (c: number) => PLOT.y + PLOT.height - (c / C_MAX) * PLOT.height

/** Gas slots above the surface, 7 across and 2 deep, with a fixed seeded jitter and order. */
const GAS_SLOTS: { x: number; y: number }[] = (() => {
  const rng = mulberry32(7)
  const slots: { x: number; y: number }[] = []
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 7; col++) {
      slots.push({
        x: 44 + col * 72 + (rng() - 0.5) * 12,
        y: 44 + row * 40 + (rng() - 0.5) * 8,
      })
    }
  }
  // Seeded shuffle so the thinning gas does not empty the grid row by row.
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }
  return slots
})()

function RateArrow({ length }: { length: number }) {
  const x2 = RATE_X + RATE_FULL * length
  return (
    <g aria-hidden="true">
      <line x1={RATE_X} x2={x2 - 10} y1={RATE_Y} y2={RATE_Y} stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
      <polygon points={`${x2},${RATE_Y} ${x2 - 14},${RATE_Y - 7} ${x2 - 14},${RATE_Y + 7}`} fill="var(--accent)" />
      <text x={x2 + 12} y={RATE_Y + 5} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
        rate
      </text>
    </g>
  )
}

export function ZeroOrderSurface({ step, reducedMotion }: ZeroOrderSurfaceProps) {
  const state = getZeroOrderStepState(step)
  const lineReveal = useTweenedNumber(state.lineReveal, reducedMotion)
  const curveReveal = useTweenedNumber(state.curveReveal, reducedMotion)
  const rateLength = useTweenedNumber(state.rateLength, reducedMotion)
  const t = useAmbientTime(reducedMotion)

  const gasShown = GAS_SLOTS.slice(0, state.gas)
  const lineEnd = T_ZERO * lineReveal
  const curveEnd = T_MAX * curveReveal
  const triEnd = TRI_T0 + TRI_RUN
  const triTop = idealConc(TRI_T0)
  const triBottom = idealConc(triEnd)
  const triMidC = (triTop + triBottom) / 2

  return (
    <svg
      viewBox={`0 0 580 ${SVG_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
    >
      <VocabDefs idPrefix="zeroorder" />

      <ReactionBox x={BOX.x} y={BOX.y} width={BOX.width} height={BOX.height} radius={14}>
        <text x={14} y={24} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
          NH₃(g)
        </text>
        {gasShown.map((p, i) => (
          <Particle
            key={i}
            x={p.x + 4 * Math.sin(t * 0.9 + i * 1.7)}
            y={p.y + 3 * Math.cos(t * 1.3 + i * 2.1)}
            r={NH3_R}
            tone="reactant"
          />
        ))}
        <CatalystSurface x={SLAB.x} y={SLAB.y} width={SLAB.width} height={SLAB.height} occupied={[...state.occupied]} />
      </ReactionBox>
      <text x={BOX.x} y={214} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Pt strip: a fixed row of sites, each holding one NH₃ at most
      </text>

      <RateArrow length={rateLength} />

      <text x={300} y={281} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
        {state.readout}
      </text>

      <PlotFrame
        x={PLOT.x}
        y={PLOT.y}
        width={PLOT.width}
        height={PLOT.height}
        domain={{ xMin: 0, xMax: T_MAX, yMin: 0, yMax: C_MAX }}
        xTicks={[0, 8, 16, 24, 32]}
        yTicks={[0, 0.2, 0.4, 0.6, 0.8]}
        xTitle="t / s"
        yTitle="[R] / mol L⁻¹"
      >
        {lineEnd > 0.05 && (
          <PlotLine
            from={{ x: 0, y: R0 }}
            to={{ x: lineEnd, y: idealConc(lineEnd) }}
            tone="neutral"
            dashed
          />
        )}
        {curveReveal > 0.01 && (
          <PlotCurve fn={realConc} from={0} to={curveEnd} tone="reactant" width={3} />
        )}
        {state.slopeTriangle && state.id === 'straight-line' && (
          <PlotSlopeTriangle at={{ x: 4, y: idealConc(4) }} dx={8} slope={-K} dxLabel="Δt" dyLabel="Δ[R]" tone="neutral" />
        )}
        {state.slopeTriangle && state.id === 'two-points' && (
          <>
            <PlotSlopeTriangle at={{ x: TRI_T0, y: triTop }} dx={TRI_RUN} slope={-K} tone="neutral" />
            <text
              x={plotX(TRI_T0 + TRI_RUN / 2)}
              y={plotY(triBottom) + 20}
              textAnchor="middle"
              fontSize={15}
              fill="var(--fg)"
              {...HALO}
            >
              Δt = 12 s
            </text>
            <text
              x={plotX(TRI_T0) - 8}
              y={plotY(triMidC) + 5}
              textAnchor="end"
              fontSize={15}
              fill="var(--fg)"
              {...HALO}
            >
              Δ[R] = 0.30
            </text>
          </>
        )}
        {state.guides && <PlotGuide at={{ x: 12, y: idealConc(12) }} to="y" yLabel="0.50" tone="neutral" />}
        {/* The starting point shows from Step 1 on; the t = 12 s point joins it from Step 2. */}
        {(state.index === 0 || state.firstPoints) && (
          <PlotPoint at={{ x: 0, y: R0 }} tone="reactant" label="[R]₀ = 0.80" side="right" />
        )}
        {state.firstPoints && (
          <PlotPoint at={{ x: 12, y: idealConc(12) }} tone="reactant" label={state.guides ? '12 s' : undefined} side="ne" />
        )}
        {state.id === 'sites-empty' && <PlotPoint at={{ x: T_ZERO, y: 0 }} tone="neutral" />}
      </PlotFrame>
      {state.id === 'sites-empty' && (
        // Left of the 32 s marker, above the axis: the real curve and the ideal line both sit higher here.
        <text x={plotX(27.8)} y={plotY(0) - 4} textAnchor="end" fontSize={15} fill="var(--fg)" {...HALO}>
          {`${T_ZERO} s`}
        </text>
      )}
    </svg>
  )
}
