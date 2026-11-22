'use client'

import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  firstOrderTangentSlope,
  formatSci,
  formatSig,
  mulberry32,
} from '@/lib/chem/kinetics'
import {
  Particle,
  PlotCurve,
  PlotFrame,
  PlotGuide,
  PlotLine,
  PlotPoint,
  PlotSlopeTriangle,
  RateMeter,
  ReactionBox,
  type PlotTone,
} from '@/components/vocab'
import {
  K,
  MARK_TIMES,
  MAX_SLOTS,
  P_I,
  R0,
  concAt,
  flaskCounts,
  getFirstOrderStepState,
  lnAt,
  log10At,
  pressureAFromGauge,
  rateAt,
  type FirstOrderMode,
} from './firstorder-steps'

export interface FirstOrderPlotsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 540
const FRAME = { x: 78, y: 24, width: 470, height: 300 }
const T_MAX = 100
const X_TICKS = [0, 20, 40, 60, 80, 100]

const BOX = { x: 40, y: 24, width: 330, height: 300 }
const SLOT_R = 14
const SLOT_PAD = 26

/** Minus sign as U+2212 for tick labels. */
function tick(v: number): string {
  return String(Number(v.toFixed(3))).replace('-', '−')
}

const PLOT_FRAMES: Record<Exclude<FirstOrderMode, 'flask'>, {
  yMin: number
  yMax: number
  yTicks: number[]
  yTitle: string
}> = {
  conc: { yMin: 0, yMax: R0, yTicks: [0, 0.05, 0.1, 0.15, 0.2], yTitle: '[R] / mol L⁻¹' },
  ln: { yMin: -4.5, yMax: -1, yTicks: [-1, -2, -3, -4], yTitle: 'ln[R]' },
  log: { yMin: 0, yMax: 1.1, yTicks: [0, 0.25, 0.5, 0.75, 1], yTitle: 'log([R]₀/[R])' },
}

/** Slot positions inside the vessel, fixed by a seed so the drawing never shuffles. */
function slotPositions(count: number): Array<[number, number]> {
  const rnd = mulberry32(11)
  const span = SLOT_R + SLOT_PAD
  const out: Array<[number, number]> = []
  let guard = 0
  while (out.length < count && guard++ < 50000) {
    const x = span + rnd() * (BOX.width - 2 * span)
    const y = span + rnd() * (BOX.height - 2 * span)
    if (out.every(([px, py]) => (px - x) ** 2 + (py - y) ** 2 >= 30 * 30)) out.push([x, y])
  }
  return out
}
const SLOTS = slotPositions(MAX_SLOTS)

/** Concentration plot with the tangents, guides and points for the current Step. */
function ConcentrationPlot({ mode, tangents, guides }: { mode: Exclude<FirstOrderMode, 'flask'>; tangents: boolean; guides: boolean }) {
  const frame = PLOT_FRAMES[mode]
  const fn = mode === 'conc' ? concAt : mode === 'ln' ? lnAt : log10At
  const pointY = (t: number) => (mode === 'conc' ? concAt(t) : mode === 'ln' ? lnAt(t) : log10At(t))
  return (
    <PlotFrame
      x={FRAME.x}
      y={FRAME.y}
      width={FRAME.width}
      height={FRAME.height}
      domain={{ xMin: 0, xMax: T_MAX, yMin: frame.yMin, yMax: frame.yMax }}
      xTicks={X_TICKS}
      yTicks={frame.yTicks}
      xTickFormat={tick}
      yTickFormat={tick}
      xTitle="t / s"
      yTitle={frame.yTitle}
    >
      <PlotCurve fn={fn} from={0} to={T_MAX} tone="reactant" width={3} />
      {mode === 'ln' && (
        <PlotLine from={{ x: 0, y: lnAt(0) }} to={{ x: T_MAX, y: lnAt(0) - K * T_MAX }} tone="product" width={2.6} />
      )}
      {mode === 'log' && (
        <PlotLine from={{ x: 0, y: 0 }} to={{ x: T_MAX, y: (K / Math.LN10) * T_MAX }} tone="product" width={2.6} />
      )}
      {tangents && (
        <>
          <PlotLine from={{ x: 0, y: R0 }} to={{ x: 1 / K, y: 0 }} tone="accent" width={2} dashed />
          <PlotLine
            from={{ x: 45, y: concAt(60) + firstOrderTangentSlope(R0, K, 60) * -15 }}
            to={{ x: 75, y: concAt(60) + firstOrderTangentSlope(R0, K, 60) * 15 }}
            tone="accent"
            width={2}
            dashed
          />
        </>
      )}
      {guides &&
        MARK_TIMES.map((t) => <PlotGuide key={`g${t}`} at={{ x: t, y: pointY(t) }} to="x" tone="neutral" />)}
      {MARK_TIMES.map((t) => (
        <PlotPoint
          key={`p${t}`}
          at={{ x: t, y: pointY(t) }}
          tone={mode === 'conc' ? 'reactant' : 'product'}
          label={mode !== 'ln' && t === 0 ? undefined : formatSig(pointY(t), 3)}
          side={mode === 'log' ? 'se' : 'ne'}
        />
      ))}
      {mode !== 'conc' && (
        <PlotSlopeTriangle
          at={{ x: mode === 'ln' ? 30 : 20, y: pointY(mode === 'ln' ? 30 : 20) }}
          dx={20}
          slope={mode === 'ln' ? -K : K / Math.LN10}
          dxLabel="Δt = 20 s"
          dyLabel={mode === 'ln' ? `Δln[R] = ${formatSig(-K * 20, 3)}` : `Δ = ${formatSig(log10At(40) - log10At(20), 3)}`}
          tone="neutral"
        />
      )}
    </PlotFrame>
  )
}

/** Bars shrinking by the same ratio, on ONE shared scale with its unit. */
function FractionStrip() {
  const base = 500
  const scale = 100 / R0
  const bars = MARK_TIMES.map((t, i) => ({ t, x: 150 + i * 110, h: concAt(t) * scale, c: concAt(t) }))
  return (
    <g>
      <line x1={112} x2={112} y1={base} y2={base - 100} stroke="var(--fg-muted)" strokeWidth={2} />
      <line x1={106} x2={112} y1={base} y2={base} stroke="var(--fg-muted)" strokeWidth={2} />
      <line x1={106} x2={112} y1={base - 100} y2={base - 100} stroke="var(--fg-muted)" strokeWidth={2} />
      <text x={100} y={base + 5} textAnchor="end" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">0</text>
      <text x={100} y={base - 95} textAnchor="end" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">0.200</text>
      <text x={60} y={base - 112} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">[R] / mol L⁻¹</text>
      {bars.map((b, i) => (
        <g key={b.t}>
          <rect x={b.x} y={base - b.h} width={56} height={b.h} rx={5} fill="var(--kin-reactant)" opacity={0.85} />
          <text x={b.x + 28} y={base + 22} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">{b.t} s</text>
          {i > 0 && (
            <text x={b.x - 27} y={base - 110 + 20} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              ×{formatSig(concAt(b.t) / concAt(MARK_TIMES[i - 1]), 3)}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

function Readouts({ mode, tangents }: { mode: FirstOrderMode; tangents: boolean }) {
  const lines: string[] = []
  if (mode === 'conc' && tangents) {
    lines.push(`Rate at 0 s = ${formatSci(rateAt(0), 3)} mol L⁻¹ s⁻¹`)
    lines.push(`Rate at 60 s = ${formatSci(rateAt(60), 3)} mol L⁻¹ s⁻¹`)
    lines.push('Dashed tangents: slope = −k[R] at each instant')
  }
  if (mode === 'ln') {
    lines.push(`Slope = −k = −${formatSig(K, 3)} s⁻¹`)
    lines.push(`Intercept = ln[R]₀ = ${formatSig(lnAt(0), 3)}`)
  }
  if (mode === 'log') {
    lines.push(`Slope = k/2.303 = ${formatSig(K / Math.LN10, 3)} s⁻¹`)
    lines.push('A straight line through the origin')
  }
  return (
    <g>
      {lines.map((line, i) => (
        <text key={line} x={60} y={400 + i * 30} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
          {line}
        </text>
      ))}
    </g>
  )
}

/** Sealed flask: molecules track the pressure; the gauge reads pₜ. */
function Flask({ time }: { time: number }) {
  const c = flaskCounts(time)
  const pA = pressureAFromGauge(c.pT)
  const tones: PlotTone[] = []
  for (let i = 0; i < c.total; i++) tones.push(i < c.nA ? 'reactant' : 'product')
  return (
    <g>
      <ReactionBox x={BOX.x} y={BOX.y} width={BOX.width} height={BOX.height} radius={16}>
        {tones.map((tone, i) => {
          const [px, py] = SLOTS[i]
          const jx = 2.5 * Math.sin(time * 1.3 + i * 1.7)
          const jy = 2.5 * Math.cos(time * 1.1 + i * 2.3)
          return <Particle key={i} x={px + jx} y={py + jy} r={SLOT_R} tone={tone} />
        })}
      </ReactionBox>
      <text x={392} y={70} fontSize={17} fill="var(--fg)" fontFamily="var(--font-sans)">t = {Math.round(time)} s</text>
      <text x={392} y={100} fontSize={16} fill="var(--kin-reactant)" fontFamily="var(--font-sans)">A: {c.nA}</text>
      <text x={392} y={126} fontSize={16} fill="var(--kin-product)" fontFamily="var(--font-sans)">B + C: {c.total - c.nA}</text>
      <RateMeter x={60} y={346} width={460} height={30} value={c.pT} max={2 * P_I} label="pₜ / atm" valueLabel={`${formatSig(c.pT, 3)} atm`} tone="accent" />
      <Particle x={70} y={420} r={12} tone="reactant" />
      <text x={90} y={426} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">A (reactant)</text>
      <Particle x={250} y={420} r={12} tone="product" />
      <text x={270} y={426} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">B and C (products)</text>
      <text x={60} y={472} fontSize={17} fill="var(--fg)" fontFamily="var(--font-sans)">
        p<Sub>A</Sub> = 2p<Sub>i</Sub> − p<Sub>t</Sub> = {formatSig(pA, 3)} atm
      </text>
      <text x={60} y={502} fontSize={16} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {`pₜ climbs toward 2pᵢ = ${formatSig(2 * P_I, 3)} atm; at 0 s pᵢ = ${formatSig(P_I, 3)} atm`}
      </text>
    </g>
  )
}

export function FirstOrderPlots({ step, reducedMotion }: FirstOrderPlotsProps) {
  const state = getFirstOrderStepState(step)
  const time = useAmbientTime(reducedMotion)
  const flaskTime = useTweenedNumber(state.flaskTime, reducedMotion, 2.4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="First order reaction: plots of [R], ln[R] and log([R]₀/[R]) against time, and a sealed flask with a pressure gauge">
      {state.mode === 'flask' ? (
        <Flask time={flaskTime} />
      ) : (
        <>
          <ConcentrationPlot mode={state.mode} tangents={state.tangents} guides={state.guides} />
          {state.guides ? <FractionStrip /> : <Readouts mode={state.mode} tangents={state.tangents} />}
        </>
      )}
    </svg>
  )
}
