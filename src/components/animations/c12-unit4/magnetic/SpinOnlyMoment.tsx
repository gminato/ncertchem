'use client'

import type { ReactNode } from 'react'
import { TestTube } from '@/components/organic/lab/TestTube'
import { ConfigurationBoxes, MagnetBalance, SERIES_TONE } from '@/components/vocab/dblock'
import { PlotFrame, usePlotScale } from '@/components/vocab/kinetics'
import { formatMoment, spinOnlyMoment } from '@/lib/chem/dblock'
import {
  CR3_CONFIG,
  CR3_N,
  DIAMAGNETIC_PULL,
  FE2_CONFIG,
  FE2_PULL,
  clampStep,
  observedLadder,
  spinOnlyLadder,
  STEP_ARIA,
  type LadderPoint,
  type ObservedPoint,
} from './magnetic-steps'

export interface SpinOnlyMomentProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Cut between Steps: nothing tweens, so reduced motion needs no branch. */
  reducedMotion: boolean
}

const W = 580
const H = 540
const TONE = SERIES_TONE['3d']
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const LADDER = spinOnlyLadder()
const OBSERVED = observedLadder()
/** Measured points sit this far (in d units) to the right of their calculated point. */
const OBSERVED_OFFSET = 0.36

/** A text label in the panel. Ion charges and subscripts are Unicode (never caret notation). */
function Label({
  x,
  y,
  children,
  size = 16,
  anchor = 'start',
  weight = 400,
  muted = false,
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
  muted?: boolean
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{ fill: muted ? MUTED : INK, fontFamily: 'var(--font-sans)', fontSize: size, fontWeight: weight }}
    >
      {children}
    </text>
  )
}

/** Step 1: iron(II) drawn into the field, zinc(II) barely moves. */
function BalanceScene() {
  return (
    <g>
      <g transform="translate(-15 40) scale(1.15)">
        <MagnetBalance pull={FE2_PULL} />
      </g>
      <g transform="translate(275 40) scale(1.15)">
        <MagnetBalance pull={DIAMAGNETIC_PULL} />
      </g>
      <Label x={146} y={352} size={18} anchor="middle" weight={700}>
        Fe²⁺ (n = 4)
      </Label>
      <Label x={146} y={378} anchor="middle" muted>
        iron(II) sulphate
      </Label>
      <Label x={436} y={352} size={18} anchor="middle" weight={700}>
        Zn²⁺ (n = 0)
      </Label>
      <Label x={436} y={378} anchor="middle" muted>
        zinc(II) sulphate
      </Label>
      <Label x={290} y={404} size={15} anchor="middle" muted>
        Schematic, not to scale.
      </Label>
      <Label x={290} y={450} size={18} anchor="middle">
        Same balance, same magnet, different electrons.
      </Label>
      <Label x={290} y={480} anchor="middle" muted>
        Apparent weight rises for the iron sample only.
      </Label>
    </g>
  )
}

const RESPONSES = [
  {
    name: 'Diamagnetic',
    line1: 'all electrons paired',
    line2: 'weakly pushed out of the field',
    pull: -0.35,
  },
  {
    name: 'Paramagnetic',
    line1: 'unpaired electrons',
    line2: 'drawn into the field',
    pull: 0.5,
  },
  {
    name: 'Ferromagnetic',
    line1: 'very strong pull',
    line2: 'extreme form of paramagnetism',
    pull: 1,
  },
] as const

/** Step 2: three rows, each a tube displaced along a horizontal arrow (schematic). */
function ResponsesScene() {
  const REST_X = 330
  return (
    <g>
      {RESPONSES.map((row, k) => {
        const y0 = 16 + k * 172
        const cx = REST_X + row.pull * 70
        return (
          <g key={row.name}>
            <Label x={10} y={y0 + 34} size={20} weight={700}>
              {row.name}
            </Label>
            <Label x={10} y={y0 + 66} muted>
              {row.line1}
            </Label>
            <Label x={10} y={y0 + 92} muted>
              {row.line2}
            </Label>
            <line
              x1={REST_X}
              x2={REST_X}
              y1={y0 + 14}
              y2={y0 + 150}
              style={{ stroke: 'var(--fg-subtle)', strokeWidth: 1.5, strokeDasharray: '4 5' }}
            />
            <rect x={446} y={y0 + 14} width={14} height={140} rx={4} style={{ fill: 'var(--spec-red)' }} />
            <g transform={`translate(${cx - 11.2} ${y0 + 20}) scale(0.8)`}>
              <TestTube liquidLevel={0} precipitate={{ color: TONE, amount: 0.8, outline: true }} progress={1} />
            </g>
            <line
              x1={REST_X}
              x2={REST_X + row.pull * 70}
              y1={y0 + 160}
              y2={y0 + 160}
              style={{ stroke: TONE, strokeWidth: 3, strokeLinecap: 'round' }}
            />
            <circle cx={REST_X + row.pull * 70} cy={y0 + 160} r={4.5} style={{ fill: TONE }} />
          </g>
        )
      })}
      <Label x={446} y={20} anchor="middle" size={15} muted>
        field
      </Label>
    </g>
  )
}

/** Step 3: a paired orbital (spins cancel) beside single electrons (net moment). Fe²⁺ 3d⁶. */
function PairScene() {
  return (
    <g>
      <Label x={20} y={36} size={22} weight={700}>
        Fe²⁺  {FE2_CONFIG.display}
      </Label>
      <ConfigurationBoxes
        config={FE2_CONFIG.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))}
        highlight={{ subshell: '3d', orbitals: [0] }}
        x={20}
        y={96}
        width={540}
        maxSize={92}
      />
      <Label x={20} y={290} size={20}>
        The outlined orbital holds a pair: opposite spins cancel.
      </Label>
      <Label x={20} y={324} size={20}>
        The four single electrons each act as a magnet.
      </Label>
      <Label x={20} y={358} size={20} muted>
        Only unpaired electrons leave a net moment.
      </Label>
      <Label x={20} y={402} size={18} muted>
        Orbital motion adds almost nothing in these compounds,
      </Label>
      <Label x={20} y={428} size={18} muted>
        so the spins decide the response.
      </Label>
    </g>
  )
}

/** Step 4: Cr³⁺ 3d³, three parallel spins, and the formula worked in full. */
function CountScene() {
  const n = CR3_N
  const nn2 = n * (n + 2)
  const mu3 = formatMoment(spinOnlyMoment(n))
  const mu1 = formatMoment(spinOnlyMoment(1))
  return (
    <g>
      <Label x={20} y={36} size={22} weight={700}>
        Cr³⁺  {CR3_CONFIG.display}
      </Label>
      <ConfigurationBoxes
        config={CR3_CONFIG.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))}
        x={20}
        y={96}
        width={540}
        maxSize={92}
      />
      <Label x={20} y={290} size={24} weight={700}>
        μ = √(n(n + 2)) BM
      </Label>
      <Label x={20} y={330} size={21}>
        {`n = ${n}:  √(${n} × ${n + 2}) = √${nn2} = ${mu3} BM`}
      </Label>
      <Label x={20} y={364} size={18} muted>
        {`One unpaired electron (n = 1): √3 = ${mu1} BM`}
      </Label>
      <Label x={20} y={414} size={18} muted>
        The moment grows with the count of unpaired spins.
      </Label>
    </g>
  )
}

/** d6 to d9 fall away to the right, and their measured bars sit just right of each point, so their labels go left and below. */
const FALLING_FROM = 6
const FALLING_TO = 9

/** Ti³⁺ (d1) rises to the right under its own measured point, so its label goes right and below the line. */
function labelPlacement(d: number, px: number, py: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  if (d >= FALLING_FROM && d <= FALLING_TO) return { x: px - 12, y: py + 10, anchor: 'end' }
  if (d === 1) return { x: px + 10, y: py + 20, anchor: 'start' }
  return { x: px, y: py - 13, anchor: 'middle' }
}

/** The points and bars drawn inside the PlotFrame, in data coordinates. */
function Hill() {
  const s = usePlotScale()
  const path = LADDER.map((p, i) => `${i === 0 ? 'M' : 'L'}${s.x(p.d).toFixed(2)} ${s.y(p.mu).toFixed(2)}`).join(' ')
  return (
    <g>
      <path d={path} style={{ fill: 'none', stroke: TONE, strokeWidth: 3, strokeLinejoin: 'round' }} />
      {LADDER.map((p: LadderPoint) => (
        <g key={p.d}>
          <circle cx={s.x(p.d)} cy={s.y(p.mu)} r={6} style={{ fill: TONE }} />
          <text
            x={labelPlacement(p.d, s.x(p.d), s.y(p.mu)).x}
            y={labelPlacement(p.d, s.x(p.d), s.y(p.mu)).y}
            textAnchor={labelPlacement(p.d, s.x(p.d), s.y(p.mu)).anchor}
            style={{ fill: INK, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600 }}
          >
            {p.label}
          </text>
        </g>
      ))}
      {OBSERVED.map((o: ObservedPoint) => {
        const x = s.x(o.d + OBSERVED_OFFSET)
        if (o.range) {
          return (
            <g key={`${o.d}-${o.ion}`}>
              <line x1={x} x2={x} y1={s.y(o.lo)} y2={s.y(o.hi)} style={{ stroke: TONE, strokeWidth: 2.5 }} />
              <line x1={x - 5} x2={x + 5} y1={s.y(o.lo)} y2={s.y(o.lo)} style={{ stroke: TONE, strokeWidth: 2.5 }} />
              <line x1={x - 5} x2={x + 5} y1={s.y(o.hi)} y2={s.y(o.hi)} style={{ stroke: TONE, strokeWidth: 2.5 }} />
            </g>
          )
        }
        return (
          <circle
            key={`${o.d}-${o.ion}`}
            cx={x}
            cy={s.y(o.lo)}
            r={5.5}
            style={{ fill: 'var(--surface)', stroke: TONE, strokeWidth: 2.5 }}
          />
        )
      })}
    </g>
  )
}

/** Step 5: the hill from d¹ to d¹⁰, calculated points joined, measured values beside them. */
function HillScene() {
  return (
    <g>
      <PlotFrame
        x={78}
        y={24}
        width={470}
        height={330}
        domain={{ xMin: 0.5, xMax: 10.6, yMin: 0, yMax: 6.5 }}
        xTicks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        yTicks={[0, 1, 2, 3, 4, 5, 6]}
        yTickFormat={(v) => String(v)}
        xTitle="Number of d electrons"
        yTitle="μ / BM"
      >
        <Hill />
      </PlotFrame>
      <circle cx={92} cy={432} r={6} style={{ fill: TONE }} />
      <Label x={106} y={437} size={16}>
        spin-only, calculated: √(n(n + 2)) BM
      </Label>
      <circle cx={92} cy={462} r={5.5} style={{ fill: 'var(--surface)', stroke: TONE, strokeWidth: 2.5 }} />
      <Label x={106} y={467} size={16}>
        measured, Table 4.7 (bar = range)
      </Label>
      <Label x={20} y={500} size={16} muted>
        Points are joined only within the spin-only series.
      </Label>
    </g>
  )
}

/** The panel: one SVG per Scrolly, drawn for the Step given. */
export function SpinOnlyMoment({ step }: SpinOnlyMomentProps) {
  const s = clampStep(step)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={STEP_ARIA[s]}>
      {s === 0 && <BalanceScene />}
      {s === 1 && <ResponsesScene />}
      {s === 2 && <PairScene />}
      {s === 3 && <CountScene />}
      {s === 4 && <HillScene />}
    </svg>
  )
}
