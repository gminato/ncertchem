'use client'

import { PlotCurve, PlotFrame, PlotPoint, PlotSlopeTriangle, TONE_VAR } from '@/components/vocab'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import {
  EXAMPLE_K,
  ORDER_SPECS,
  SAMPLE_CONCS,
  X_MAX,
  Y_MAX,
  fmtRate,
  getOrderStepState,
  rateAt,
  specFor,
  thumbnailPoints,
  unitRuns,
  type CurveTone,
  type CurveVisibility,
  type OrderId,
  type Run,
} from './order-steps'

export interface OrderCurvesProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 520
const PLOT = { x: 84, y: 92, width: 462, height: 340 }
const DOMAIN = { xMin: 0, xMax: X_MAX, yMin: 0, yMax: Y_MAX }
const X_TICKS = [0, 0.25, 0.5, 0.75, 1]
const Y_TICKS = [0, 0.05, 0.1, 0.15, 0.2, 0.25]
const CARD_W = 260
const CARD_H = 190
const CARD_SLOTS: ReadonlyArray<readonly [number, number]> = [
  [24, 90],
  [296, 90],
  [24, 306],
  [296, 306],
]

const tick = (v: number) => v.toFixed(2)
const ORDER_IDS: readonly OrderId[] = ['zero', 'first', 'second', 'half']

function opacityOf(v: CurveVisibility): number {
  if (v === 'active') return 1
  if (v === 'faded') return 0.22
  return 0
}

/** Sample points for the active order: a flat row for zero order, otherwise one point per sample concentration. */
function SamplePoints({ id }: { id: OrderId }) {
  const spec = specFor(id)
  const tone: CurveTone = spec.tone
  if (id === 'zero') {
    return <PlotPoint at={{ x: 0.5, y: EXAMPLE_K }} tone={tone} label={fmtRate(rateAt(0, 0.5))} side="above" />
  }
  return (
    <g>
      {SAMPLE_CONCS.map((a) => {
        const r = rateAt(spec.order, a)
        return <PlotPoint key={a} at={{ x: a, y: r }} tone={tone} label={fmtRate(r)} side="left" />
      })}
    </g>
  )
}

function Thumbnail({ x, y, w, h, order, tone }: { x: number; y: number; w: number; h: number; order: number; tone: CurveTone }) {
  const d = thumbnailPoints(order)
    .map(([a, r], i) => `${i === 0 ? 'M' : 'L'}${(x + a * w).toFixed(1)} ${(y + h - (r / Y_MAX) * h).toFixed(1)}`)
    .join(' ')
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="var(--border)" strokeWidth={1.5} />
      <path d={d} fill="none" stroke={TONE_VAR[tone]} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  )
}

/** Draws runs as text: `sup` runs become real superscripts (Sup tspans). */
function RunText({ runs }: { runs: readonly Run[] }) {
  return (
    <>
      {runs.map((r, i) => (r.sup ? <Sup key={i}>{r.text}</Sup> : <tspan key={i}>{r.text}</tspan>))}
    </>
  )
}

function UnitCard({ x, y, id }: { x: number; y: number; id: OrderId }) {
  const spec = specFor(id)
  return (
    <g>
      <rect x={x} y={y} width={CARD_W} height={CARD_H} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={x + 18} y={y + 30} fontSize={18} fontWeight={600} fill={TONE_VAR[spec.tone]} fontFamily="var(--font-sans)">
        {spec.title}
      </text>
      <text x={x + 18} y={y + 56} fontSize={18} fill="var(--fg)" fontFamily="var(--font-sans)">
        <RunText runs={spec.rateLaw} />
      </text>
      <text x={x + 18} y={y + 82} fontSize={18} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {`k = ${fmtRate(EXAMPLE_K)}`}
      </text>
      <text x={x + 18} y={y + 106} fontSize={18} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        <RunText runs={unitRuns(spec.order)} />
      </text>
      <Thumbnail x={x + 18} y={y + 120} w={CARD_W - 36} h={56} order={spec.order} tone={spec.tone} />
    </g>
  )
}

export function OrderCurves({ step, reducedMotion }: OrderCurvesProps) {
  const state = getOrderStepState(step)
  const transition = reducedMotion ? 'none' : 'opacity 600ms ease'

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      role="img"
      aria-label={state.ariaLabel}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <text x={24} y={34} fontSize={22} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        <RunText runs={state.headerLaw} />
      </text>
      <text x={24} y={62} fontSize={18} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        <RunText runs={state.headerUnits} />
      </text>

      <g style={{ opacity: state.decoder ? 0 : 1, transition }} aria-hidden={state.decoder}>
        <PlotFrame
          x={PLOT.x}
          y={PLOT.y}
          width={PLOT.width}
          height={PLOT.height}
          domain={DOMAIN}
          xTicks={X_TICKS}
          yTicks={Y_TICKS}
          xTickFormat={tick}
          yTickFormat={tick}
          xTitle="[A] / mol L⁻¹"
          yTitle="Rate / mol L⁻¹ s⁻¹"
        >
          {ORDER_SPECS.map((spec) => (
            <g key={spec.id} style={{ opacity: opacityOf(state.curves[spec.id]), transition }}>
              <PlotCurve fn={(a) => rateAt(spec.order, a)} from={0} to={X_MAX} samples={80} tone={spec.tone} width={3.2} />
            </g>
          ))}
          {state.points ? (
            <g key={`points-${state.points}`} style={{ transition }}>
              <SamplePoints id={state.points} />
            </g>
          ) : null}
          {state.slope ? (
            <PlotSlopeTriangle at={{ x: 0.5, y: 0.1 }} dx={0.5} slope={EXAMPLE_K} dxLabel="0.50" dyLabel="0.100" tone="neutral" />
          ) : null}
        </PlotFrame>
      </g>

      <g style={{ opacity: state.decoder ? 1 : 0, transition }} aria-hidden={!state.decoder}>
        {CARD_SLOTS.map(([x, y], i) => (
          <UnitCard key={ORDER_IDS[i]} x={x} y={y} id={ORDER_IDS[i]} />
        ))}
      </g>
    </svg>
  )
}
