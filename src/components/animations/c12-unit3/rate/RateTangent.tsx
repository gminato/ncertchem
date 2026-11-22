'use client'

import type { ReactNode } from 'react'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  PlotCurve,
  PlotFrame,
  PlotLine,
  PlotPoint,
  RateMeter,
  VocabDefs,
  makePlotScale,
} from '@/components/vocab'
import {
  EXAMPLE_T_MAX,
  READOUTS,
  concA,
  concB,
  getRateStepState,
  tangentSlopeAt,
  type RateStepState,
} from './rate-steps'

export interface RateTangentProps {
  step: number
  reducedMotion: boolean
}

const SVG_W = 580
const SVG_H = 440
const FRAME = { x: 76, y: 24, width: 472, height: 300 }
const DOMAIN = { xMin: 0, xMax: EXAMPLE_T_MAX, yMin: 0, yMax: 0.1 }
const X_TICKS = [0, 100, 200, 300, 400, 500, 600]
const Y_TICKS = [0, 0.02, 0.04, 0.06, 0.08, 0.1]
const SCALE = makePlotScale(DOMAIN, { left: FRAME.x, top: FRAME.y, width: FRAME.width, height: FRAME.height })
const TANGENT_T = 250

/** Symbols in UI text: KaTeX italic through the .sym class. */
function Sym({ children }: { children: ReactNode }) {
  return <tspan className="sym">{children}</tspan>
}

const TEXT = { fontFamily: 'var(--font-sans)' } as const

/** The plot: curves, the chord or tangent, and the direct labels. */
function PlotScene({ state, t1, t2 }: { state: RateStepState; t1: number; t2: number }) {
  return (
    <PlotFrame
      x={FRAME.x}
      y={FRAME.y}
      width={FRAME.width}
      height={FRAME.height}
      domain={DOMAIN}
      xTicks={X_TICKS}
      yTicks={Y_TICKS}
      yTickFormat={(v) => v.toFixed(2)}
      xTitle="t / s"
      yTitle="[A] / mol L⁻¹"
    >
      <PlotCurve fn={concA} from={0} to={EXAMPLE_T_MAX} tone="reactant" width={3} />
      <PlotCurve fn={concB} from={0} to={EXAMPLE_T_MAX} tone="product" width={3} />
      <text x={SCALE.x(58)} y={SCALE.y(0.0965)} fontSize={16} fill="var(--kin-reactant)" style={TEXT}>
        <Sym>[A]</Sym>
      </text>
      <text x={SCALE.x(500)} y={SCALE.y(0.0745)} fontSize={16} fill="var(--kin-product)" style={TEXT}>
        <Sym>[B]</Sym>
      </text>
      {state.tangent ? (
        <g>
          <PlotLine through={{ x: TANGENT_T, y: concA(TANGENT_T) }} slope={tangentSlopeAt(TANGENT_T)} tone="neutral" width={2.2} />
          <PlotPoint at={{ x: TANGENT_T, y: concA(TANGENT_T) }} tone="accent" />
        </g>
      ) : (
        <g>
          {state.ghostChord ? (
            <PlotLine from={{ x: 200, y: concA(200) }} to={{ x: 300, y: concA(300) }} tone="neutral" width={2} dashed />
          ) : null}
          <PlotLine from={{ x: t1, y: concA(t1) }} to={{ x: t2, y: concA(t2) }} tone="accent" width={2.6} />
          <PlotPoint at={{ x: t1, y: concA(t1) }} tone="accent" />
          <PlotPoint at={{ x: t2, y: concA(t2) }} tone="accent" />
        </g>
      )}
    </PlotFrame>
  )
}

/** Readout rows under the plot (Steps 1–3). */
function PlotReadouts({ step }: { step: number }) {
  const rows: ReactNode[] = step === 0
    ? [
        <tspan key="a">Average rate over 0–500 s</tspan>,
        <tspan key="b" fill="var(--accent)" fontSize={18}>= {READOUTS.avgFull} mol L⁻¹ s⁻¹</tspan>,
      ]
    : step === 1
      ? [
          <tspan key="a">Faint chord, 200–300 s: {READOUTS.avgShort}</tspan>,
          <tspan key="b" fill="var(--accent)" fontSize={18}>Bold chord, 240–260 s: {READOUTS.avgNarrow} mol L⁻¹ s⁻¹</tspan>,
        ]
      : [
          <tspan key="a">Instantaneous rate at 250 s = −slope</tspan>,
          <tspan key="b" fill="var(--accent)" fontSize={18}>
            slope {READOUTS.tangentSlope}, so rate = +{READOUTS.instant} mol L⁻¹ s⁻¹
          </tspan>,
        ]
  return (
    <g fontSize={16} fill="var(--fg)" style={TEXT}>
      <text x={FRAME.x} y={392}>{rows[0]}</text>
      <text x={FRAME.x} y={418}>{rows[1]}</text>
    </g>
  )
}

/** The stoichiometry card for 3A → 2B (Steps 4–5). */
function StoichiometryCard({ units }: { units: boolean }) {
  const meters = [
    { y: 122, label: <>Reaction rate</>, value: 2.0, text: READOUTS.reaction, tone: 'accent' as const },
    { y: 198, label: <>−d<Sym>[A]</Sym>/dt</>, value: 6.0, text: READOUTS.dA, tone: 'reactant' as const },
    { y: 274, label: <>d<Sym>[B]</Sym>/dt</>, value: 4.0, text: READOUTS.dB, tone: 'product' as const },
  ]
  return (
    <g>
      <text x={290} y={58} textAnchor="middle" fontSize={28} fill="var(--fg)" style={TEXT}>
        3<Sym>A</Sym> → 2<Sym>B</Sym>
      </text>
      <text x={290} y={86} textAnchor="middle" fontSize={16} fill="var(--fg-muted)" style={TEXT}>
        One reaction rate sits behind every species
      </text>
      {meters.map((m) => (
        <RateMeter
          key={m.text}
          x={110}
          y={m.y}
          width={360}
          height={22}
          value={m.value}
          max={6.0}
          label={m.label}
          valueLabel={units ? `${m.text} mol L⁻¹ s⁻¹` : m.text}
          tone={m.tone}
        />
      ))}
      <text x={290} y={362} textAnchor="middle" fontSize={17} fill="var(--fg)" style={TEXT}>
        Rate = −(1/3) d<Sym>[A]</Sym>/dt = (1/2) d<Sym>[B]</Sym>/dt
      </text>
      {units ? (
        <g style={TEXT}>
          <rect x={60} y={378} width={230} height={50} rx={10} fill="var(--surface-raised)" stroke="var(--kin-grid)" />
          <text x={175} y={401} textAnchor="middle" fontSize={17} fill="var(--fg)">Molar: mol L⁻¹ s⁻¹</text>
          <text x={175} y={420} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">concentration ÷ time</text>
          <rect x={300} y={378} width={230} height={50} rx={10} fill="var(--surface-raised)" stroke="var(--kin-grid)" />
          <text x={415} y={401} textAnchor="middle" fontSize={17} fill="var(--fg)">Gas: atm s⁻¹</text>
          <text x={415} y={420} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">partial pressure ÷ time</text>
        </g>
      ) : null}
    </g>
  )
}

export function RateTangent({ step, reducedMotion }: RateTangentProps) {
  const state = getRateStepState(step)
  const t1 = useTweenedNumber(state.t1, reducedMotion)
  const t2 = useTweenedNumber(state.t2, reducedMotion)
  const isCard = state.index >= 3

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
    >
      <VocabDefs idPrefix="rate" />
      {isCard ? (
        <StoichiometryCard units={state.index === 4} />
      ) : (
        <g>
          <PlotScene state={state} t1={t1} t2={t2} />
          <PlotReadouts step={state.index} />
        </g>
      )}
    </svg>
  )
}
