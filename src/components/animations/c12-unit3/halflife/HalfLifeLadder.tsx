'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Sub, Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { PlotCurve, PlotFrame, PlotLine, PlotPoint, usePlotScale } from '@/components/vocab'
import { firstOrderConc, fractionRemainingAfterHalfLives } from '@/lib/chem/kinetics'
import {
  HL_K,
  HL_R0,
  HL_R0_DOUBLE,
  HL_T_MAX,
  T_HALF_FIRST,
  T_HALF_ZERO,
  T_HALF_ZERO_DOUBLE,
  T_ZERO_END,
  T_ZERO_END_DOUBLE,
  UNITS_FIRST,
  UNITS_ZERO,
  firstCurve,
  firstMarkerTime,
  fmtSig,
  getHalfLifeStepState,
  zeroCurve,
  type HalfLifeStepState,
} from './half-life-steps'

export interface HalfLifeLadderProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 420
const FRAME = { x: 92, y: 60, width: 456, height: 300 }
const X_TICKS = [0, 10, 20, 30, 40]
const MARKER_LABELS = ['½', '¼', '⅛'] as const
const TIME_LABELS = ['t½ = ' + fmtSig(T_HALF_FIRST) + ' s', fmtSig(2 * T_HALF_FIRST) + ' s', fmtSig(3 * T_HALF_FIRST) + ' s'] as const

/** Symbols in SVG text use the site's italic `sym` class. */
function S({ children }: { children: ReactNode }) {
  return <tspan className="sym">{children}</tspan>
}

/** Text gets a halo the colour of the surface, as the vocab labels do. */
const HALO = { stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const }

/**
 * Dashed drop-lines to both axes. The time label sits BESIDE its line (left or right), so no guide runs through it.
 */
function Guide({ at, xLabel, xSide = 'left', yLabel, stroke = 'var(--fg-muted)' }: { at: { x: number; y: number }; xLabel?: ReactNode; xSide?: 'left' | 'right'; yLabel?: ReactNode; stroke?: string }) {
  const s = usePlotScale()
  const px = s.x(at.x)
  const py = s.y(at.y)
  const { left, top, height } = s.box
  const bottom = top + height
  const toLeft = xSide === 'left'
  return (
    <g aria-hidden="true">
      <line x1={px} x2={px} y1={py} y2={bottom} stroke={stroke} strokeWidth={1.6} strokeDasharray="5 5" />
      <line x1={left} x2={px} y1={py} y2={py} stroke={stroke} strokeWidth={1.6} strokeDasharray="5 5" />
      {xLabel !== undefined && (
        <text x={toLeft ? px - 5 : px + 5} y={bottom - 8} textAnchor={toLeft ? 'end' : 'start'} fontSize={14} fill="var(--fg)" {...HALO}>
          {xLabel}
        </text>
      )}
      {yLabel !== undefined && (
        <text x={left + 8} y={py - 7} textAnchor="start" fontSize={14} fill="var(--fg)" {...HALO}>
          {yLabel}
        </text>
      )}
    </g>
  )
}

/**
 * Slope triangle for the falling zero-order line. Its labels sit clear of the legs and of the guides:
 * the Δ[R] drop beside the rise leg (two lines, unit under the number), the Δt run below the run leg.
 */
function ZeroSlope({ at, dx }: { at: { x: number; y: number }; dx: number }) {
  const s = usePlotScale()
  const x1 = s.x(at.x)
  const y1 = s.y(at.y)
  const x2 = s.x(at.x + dx)
  const y2 = s.y(at.y - HL_K * dx)
  const legX = x1 - 8
  return (
    <g aria-hidden="true">
      <path d={`M${x1} ${y1} V${y2} H${x2}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2} strokeLinejoin="round" />
      <text x={(x1 + x2) / 2} y={Math.max(y1, y2) + 20} textAnchor="middle" fontSize={15} fill="var(--fg)" {...HALO}>
        {fmtSig(dx)} s
      </text>
      <text x={legX} y={(y1 + y2) / 2 - 2} textAnchor="end" fontSize={15} fill="var(--fg)" {...HALO}>
        <tspan x={legX}>−{fmtSig(HL_K * dx)}</tspan>
        <tspan x={legX} dy="1.25em">mol L⁻¹</tspan>
      </text>
    </g>
  )
}

/** Opacity with a CSS tween between Steps; reduced motion cuts. */
function fade(opacity: number, reducedMotion: boolean): CSSProperties {
  return { opacity, transition: reducedMotion ? 'none' : 'opacity 600ms ease' }
}

/** The area between the curve and the level at the start of interval n: the amount used up in that half-life. */
function ConsumedBand({ n, opacity, reducedMotion }: { n: number; opacity: number; reducedMotion: boolean }) {
  const s = usePlotScale()
  const a = (n - 1) * T_HALF_FIRST
  const b = n * T_HALF_FIRST
  const top = HL_R0 * fractionRemainingAfterHalfLives(n - 1)
  const xs = Array.from({ length: 33 }, (_, i) => a + ((b - a) * i) / 32)
  const back = [...xs]
    .reverse()
    .map((t) => `L${s.x(t).toFixed(2)} ${s.y(firstOrderConc(HL_R0, HL_K, t)).toFixed(2)}`)
    .join(' ')
  const d = `M${s.x(a).toFixed(2)} ${s.y(top).toFixed(2)} L${s.x(b).toFixed(2)} ${s.y(top).toFixed(2)} ${back} Z`
  return <path d={d} fill="var(--kin-reactant)" fillOpacity={0.22} stroke="none" style={fade(opacity, reducedMotion)} />
}

/** The first-order markers for one starting amount: a dot per half-life, with its guide on the first curve only. */
function FirstMarkers({ R0, count, labelled, tone, guideLabels = true }: { R0: number; count: number; labelled: boolean; tone: "reactant" | "product"; guideLabels?: boolean }) {
  return (
    <g>
      {[1, 2, 3].map((n) => {
        const t = firstMarkerTime(n)
        const r = R0 * fractionRemainingAfterHalfLives(n)
        return (
          <g key={n} style={{ opacity: count >= n ? 1 : 0, transition: 'opacity 600ms ease' }}>
            {labelled ? (
              <Guide at={{ x: t, y: r }} xLabel={guideLabels ? TIME_LABELS[n - 1] : undefined} yLabel={guideLabels ? `${MARKER_LABELS[n - 1]} · ${fmtSig(r)}` : undefined} />
            ) : null}
            <PlotPoint at={{ x: t, y: r }} tone={tone} />
          </g>
        )
      })}
    </g>
  )
}

/**
 * The [R]₀ = 1.00 label, just above its dashed reference line (Step 3). From t = 20 s on, the 2.00 curve
 * has already dropped below the line, so the space above it is clear.
 */
function RefLabel() {
  const s = usePlotScale()
  return (
    <text x={s.x(20)} y={s.y(HL_R0) - 10} fontSize={15} fill="var(--fg)" {...HALO}>
      <S>[R]</S>
      <Sub>0</Sub> = 1.00
    </text>
  )
}

function PlotLayer({ step, reducedMotion }: { step: HalfLifeStepState; reducedMotion: boolean }) {
  const yTicks = step.yMax > 1.5 ? [0, 0.5, 1, 1.5, 2] : [0, 0.5, 1]
  return (
    <g style={fade(step.plot, reducedMotion)}>
      <PlotFrame
        x={FRAME.x}
        y={FRAME.y}
        width={FRAME.width}
        height={FRAME.height}
        domain={{ xMin: 0, xMax: HL_T_MAX, yMin: 0, yMax: step.yMax }}
        xTicks={X_TICKS}
        yTicks={yTicks}
        yTickFormat={fmtSig}
        xTitle="t / s"
        yTitle={
          <>
            <S>[R]</S> / mol L⁻¹
          </>
        }
      >
        {/* First order, [R]₀ = 1.00 mol L⁻¹, with its half-life markers and consumed bands. */}
        <g style={fade(step.first1, reducedMotion)}>
          <PlotCurve fn={firstCurve(HL_R0)} from={0} to={HL_T_MAX} tone="reactant" />
          {[1, 2, 3].map((n) => (
            <ConsumedBand key={n} n={n} opacity={step.bands > 0 ? 1 : 0} reducedMotion={reducedMotion} />
          ))}
          <FirstMarkers R0={HL_R0} count={step.markers} labelled tone="reactant" guideLabels={step.first2 === 0} />
          <PlotPoint at={{ x: 5, y: firstOrderConc(HL_R0, HL_K, 5) }} tone="reactant" />
          <RefLabel />
        </g>

        {/* First order, [R]₀ = 2.00 mol L⁻¹: the same half-lives, a different starting height. */}
        <g style={fade(step.first2, reducedMotion)}>
          <PlotLine through={{ x: 0, y: HL_R0 }} slope={0} tone="neutral" dashed />
          <PlotCurve fn={firstCurve(HL_R0_DOUBLE)} from={0} to={HL_T_MAX} tone="product" />
          <FirstMarkers R0={HL_R0_DOUBLE} count={step.markers} labelled={false} tone="product" />
          <PlotPoint at={{ x: 5, y: firstOrderConc(HL_R0_DOUBLE, HL_K, 5) }} tone="product" label={<><S>[R]</S><Sub>0</Sub> = 2.00</>} side="ne" />
        </g>

        {/* Zero order, [R]₀ = 1.00 mol L⁻¹: a straight line, reaching zero at 20.0 s. */}
        <g style={fade(step.zero1, reducedMotion)}>
          <PlotCurve fn={zeroCurve(HL_R0)} from={0} to={T_ZERO_END} tone="reactant" />
          <Guide at={{ x: T_HALF_ZERO, y: HL_R0 / 2 }} xLabel={`t½ = ${fmtSig(T_HALF_ZERO)} s`} yLabel={fmtSig(HL_R0 / 2)} />
          <g style={fade(step.slope, reducedMotion)}>
            <ZeroSlope at={{ x: 8, y: zeroCurve(HL_R0)(8) }} dx={10} />
          </g>
        </g>

        {/* Zero order, [R]₀ = 2.00 mol L⁻¹: the same slope, twice as long. */}
        <g style={fade(step.zero2, reducedMotion)}>
          <PlotCurve fn={zeroCurve(HL_R0_DOUBLE)} from={0} to={T_ZERO_END_DOUBLE} tone="product" />
          <Guide
            at={{ x: T_HALF_ZERO_DOUBLE, y: HL_R0_DOUBLE / 2 }}
            xSide="right"
            xLabel={`t½ = ${fmtSig(T_HALF_ZERO_DOUBLE)} s`}
            yLabel={fmtSig(HL_R0_DOUBLE / 2)}
            stroke="var(--kin-product)"
          />
          <PlotPoint at={{ x: 4, y: zeroCurve(HL_R0_DOUBLE)(4) }} tone="product" label={<><S>[R]</S><Sub>0</Sub> = 2.00</>} side="ne" />
        </g>
      </PlotFrame>
    </g>
  )
}

/** Caption above the plot: one short line per Step, with the lib's numbers. */
function Caption({ step }: { step: HalfLifeStepState }) {
  const text = (() => {
    switch (step.id) {
      case 'one-half-life':
        return (
          <>
            <S>[R]</S> reaches {fmtSig(HL_R0 * fractionRemainingAfterHalfLives(1))} mol L⁻¹ at <S>t</S>½ = {fmtSig(T_HALF_FIRST)} s
          </>
        )
      case 'each-interval':
        return (
          <>
            Drop in <S>[R]</S> each half-life: {[1, 2, 3].map((n) => fmtSig(HL_R0 * (fractionRemainingAfterHalfLives(n - 1) - fractionRemainingAfterHalfLives(n)))).join(', ')} mol L⁻¹
          </>
        )
      case 'double-start':
        return (
          <>
            Doubling <S>[R]</S>
            <Sub>0</Sub> leaves the first-order <S>t</S>½ unchanged
          </>
        )
      case 'zero-line':
        return (
          <>
            Zero order: a straight line, slope <S>−k</S>, <S>t</S>½ = {fmtSig(T_HALF_ZERO)} s
          </>
        )
      case 'zero-double':
        return (
          <>
            Doubling <S>[R]</S>
            <Sub>0</Sub> doubles <S>t</S>½: {fmtSig(T_HALF_ZERO)} s becomes {fmtSig(T_HALF_ZERO_DOUBLE)} s
          </>
        )
      case 'orders-card':
        return <>Zero order and first order, side by side</>
    }
  })()
  return (
    <text x={16} y={32} fontSize={17} fill="var(--fg)" fontFamily="var(--font-sans)">
      {text}
    </text>
  )
}

const COL_ZERO = 178
const COL_FIRST = 392
const ROW_TOP = 138
const ROW_H = 52

const ROWS: Array<{ label: string; zero: ReactNode; first: ReactNode }> = [
  {
    label: 'Rate law',
    zero: (
      <>
        rate = <S>k</S>
      </>
    ),
    first: (
      <>
        rate = <S>k</S>
        <S>[R]</S>
      </>
    ),
  },
  {
    label: 'Integrated law',
    zero: (
      <>
        <S>[R]</S> = <S>[R]</S>
        <Sub>0</Sub> − <S>kt</S>
      </>
    ),
    first: (
      <>
        <S>[R]</S> = <S>[R]</S>
        <Sub>0</Sub> <S>e</S>
        <Sup>
          −<S>kt</S>
        </Sup>
      </>
    ),
  },
  {
    label: 'Straight-line plot',
    zero: (
      <>
        <S>[R]</S> against <S>t</S>
      </>
    ),
    first: (
      <>
        ln <S>[R]</S> against <S>t</S>
      </>
    ),
  },
  {
    label: 'Half-life',
    zero: (
      <>
        <S>[R]</S>
        <Sub>0</Sub> / 2<S>k</S>
      </>
    ),
    first: <>0.693 / <S>k</S></>,
  },
  { label: 'Units of k', zero: UNITS_ZERO, first: UNITS_FIRST },
]

/** Table 3.4 in a compact form: two columns, one row per property, with a thumbnail of each plot shape. */
function OrdersCard({ step, reducedMotion }: { step: HalfLifeStepState; reducedMotion: boolean }) {
  return (
    <g style={fade(step.card, reducedMotion)}>
      <text x={COL_ZERO} y={62} fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        Zero order
      </text>
      <text x={COL_FIRST} y={62} fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        First order
      </text>
      <PlotFrame x={COL_ZERO + 12} y={70} width={120} height={56} xTicks={[]} yTicks={[]} domain={{ xMin: 0, xMax: T_ZERO_END, yMin: 0, yMax: HL_R0 }} grid={false}>
        <PlotCurve fn={zeroCurve(HL_R0)} from={0} to={T_ZERO_END} tone="reactant" width={2.5} />
      </PlotFrame>
      <PlotFrame x={COL_FIRST + 12} y={70} width={120} height={56} xTicks={[]} yTicks={[]} domain={{ xMin: 0, xMax: HL_T_MAX, yMin: 0, yMax: HL_R0 }} grid={false}>
        <PlotCurve fn={firstCurve(HL_R0)} from={0} to={HL_T_MAX} tone="reactant" width={2.5} />
      </PlotFrame>
      {ROWS.map((row, i) => {
        const top = ROW_TOP + i * ROW_H
        return (
          <g key={row.label}>
            <line x1={16} x2={W - 16} y1={top} y2={top} stroke="var(--kin-grid)" strokeWidth={1} />
            <text x={16} y={top + 33} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {row.label}
            </text>
            <text x={COL_ZERO} y={top + 33} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {row.zero}
            </text>
            <text x={COL_FIRST} y={top + 33} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {row.first}
            </text>
          </g>
        )
      })}
      <line x1={16} x2={W - 16} y1={ROW_TOP + ROWS.length * ROW_H} y2={ROW_TOP + ROWS.length * ROW_H} stroke="var(--kin-grid)" strokeWidth={1} />
    </g>
  )
}

/**
 * Half-life ladder for Section 3.3.3. One SVG: the first-order curve with its half-lives (Steps 1–3),
 * the zero-order straight lines (Steps 4–5), and the Table 3.4 card (Step 6). Target state per Step
 * comes from half-life-steps.ts; the groups fade between Steps.
 */
export function HalfLifeLadder({ step, reducedMotion }: HalfLifeLadderProps) {
  const state = getHalfLifeStepState(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={state.ariaLabel}
      data-step={state.index}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <Caption step={state} />
      <PlotLayer step={state} reducedMotion={reducedMotion} />
      <OrdersCard step={state} reducedMotion={reducedMotion} />
    </svg>
  )
}
