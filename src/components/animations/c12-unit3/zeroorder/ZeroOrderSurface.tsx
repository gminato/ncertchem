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
const RATE_X = 60
const RATE_FULL = 300
const RATE_Y = 244
const PLOT = { x: 88, y: 298, width: 460, height: 190 }
const T_MAX = 36

/** Gas slots above the surface, 7 across and 2 deep, with a fixed seeded jitter and order. */
const GAS_SLOTS: { x: number; y: number }[] = (() => {
  const rng = mulberry32(7)
  const slots: { x: number; y: number }[] = []
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 7; col++) {
      slots.push({
        x: 44 + col * 72 + (rng() - 0.5) * 12,
        y: 42 + row * 52 + (rng() - 0.5) * 8,
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
            r={11}
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
        domain={{ xMin: 0, xMax: T_MAX, yMin: 0, yMax: 0.9 }}
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
          <PlotSlopeTriangle at={{ x: 0, y: R0 }} dx={12} slope={-K} dxLabel="Δt = 12 s" dyLabel="Δ[R] = 0.30" tone="neutral" />
        )}
        {state.guides && <PlotGuide at={{ x: 12, y: idealConc(12) }} xLabel="12 s" yLabel="0.50" tone="neutral" />}
        {state.firstPoints && (
          <>
            <PlotPoint at={{ x: 0, y: R0 }} tone="reactant" label="[R]₀ = 0.80" side="right" />
            <PlotPoint at={{ x: 12, y: idealConc(12) }} tone="reactant" side="ne" />
          </>
        )}
        {state.id === 'sites-empty' && (
          <PlotPoint at={{ x: T_ZERO, y: 0 }} tone="neutral" label={`${T_ZERO} s`} side="above" />
        )}
      </PlotFrame>
    </svg>
  )
}
