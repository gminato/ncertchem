'use client'

import { SealedVessel, type VesselSpecies } from '@/components/equilibrium'
import { curvePath, ratesEqual, type TimePoint } from '@/components/equilibrium/geometry'
import { Label } from '@/components/vocab'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { approachPresets } from '@/lib/chem/approach-to-equilibrium'
import { deuteriumShare, dynamicModel, isotopologueFractions, PLOT_CONC, type RatePair } from './dynamic-steps'

export interface DynamicEquilibriumProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 580, height: 500 }
const CAPTION_Y = 486

/**
 * The SealedVessel draws its flask in a 200 × 202 box at (36, 30) of its native 360 × 286 frame.
 * These transforms scale that flask to fill the left of the panel (Steps 1 to 3) or to sit small
 * above the curves (Step 4).
 */
const FLASK_FULL = 'translate(-44, -8) scale(1.6)'
const FLASK_SMALL = 'translate(-17, -14) scale(0.85)'

const SPECIES: VesselSpecies[] = [
  { id: 'H2', color: 'var(--el-N)', phase: 'gas' },
  { id: 'I2', color: 'var(--i2)', phase: 'gas' },
  { id: 'HI', color: 'var(--el-S)', phase: 'gas' },
]

const model = dynamicModel()
const TIME_MAX = approachPresets().find((p) => p.id === 'h2-i2')!.tEnd

/** One rate bar of the vertical gauge is drawn on this fixed scale, so bars compare across Steps. */
const RATE_SCALE = model.pictures[0].rates.forward * 1.08

/** The curves at every 20th sample: 0.02 s apart, enough to draw a smooth line. */
const CURVES: Array<{ id: string; label: string; color: string; dash?: string; points: TimePoint[] }> = [
  { id: 'H2', label: '[H₂]', color: 'var(--el-N)', points: [] },
  { id: 'I2', label: '[I₂]', color: 'var(--i2)', dash: '7 5', points: [] },
  { id: 'HI', label: '[HI]', color: 'var(--el-S)', points: [] },
].map((series) => ({
  ...series,
  points: model.run.samples
    .filter((_, i) => i % 20 === 0)
    .map((s) => [s.time, s.concentrations[series.id]] as TimePoint),
}))

/** The four pictures of Steps 1 to 4 in Section 6.2, with the caption that goes with each. */
const CAPTIONS = [
  'Reactants only: the forward rate is at its largest.',
  'HI has formed, so the reverse rate has started to grow.',
  'The rates have met. Both are equal at equilibrium.',
  'The curves are flat, but both reactions still run in the flask.',
] as const

function fmt(value: number, digits: number): string {
  return value.toFixed(digits).replace('-', '−')
}

/** Two full-height bars for the forward and reverse rates, on the fixed RATE_SCALE. */
function VerticalRates({ forward, reverse }: RatePair) {
  const top = 104
  const base = 400
  const height = base - top
  const columns = [
    { x: 378, value: forward, name: 'forward', color: 'var(--fwd)' },
    { x: 470, value: reverse, name: 'reverse', color: 'var(--rev)' },
  ]
  return (
    <g>
      <Label x={440} y={30} fontSize={15} fill="var(--fg-muted)">
        rates, mmol L⁻¹ s⁻¹
      </Label>
      {ratesEqual(forward, reverse) && (
        <g>
          <rect x={378} y={48} width={156} height={26} rx={13} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.4} />
          <Label x={456} y={61} fontSize={14} fontWeight={600} fill="var(--fg)">
            equal rates
          </Label>
        </g>
      )}
      {columns.map((c) => {
        const h = Math.min(1, Math.max(0, c.value / RATE_SCALE)) * height
        const cx = c.x + 32
        return (
          <g key={c.name}>
            <rect x={c.x} y={top} width={64} height={height} rx={8} fill="var(--surface-raised)" />
            <rect x={c.x} y={base - h} width={64} height={Math.max(h, 0)} rx={8} fill={c.color} />
            <Label x={cx} y={base - h - 14} fontSize={16} fontWeight={600} fill="var(--fg)">
              {fmt(c.value, 2)}
            </Label>
            <Label x={cx} y={base + 22} fontSize={16} fontWeight={600} fill={c.color}>
              {c.name}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/** Two horizontal bars for Step 4, where the rates are equal and the bars are the same length. */
function HorizontalRates({ forward, reverse }: RatePair) {
  const x0 = 250
  const w = 300
  const rows = [
    { name: 'forward', value: forward, color: 'var(--fwd)', y: 46 },
    { name: 'reverse', value: reverse, color: 'var(--rev)', y: 102 },
  ]
  return (
    <g>
      <Label x={x0} y={18} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
        rates, mmol L⁻¹ s⁻¹
      </Label>
      {rows.map((r) => {
        const len = Math.min(1, Math.max(0, r.value / RATE_SCALE)) * w
        return (
          <g key={r.name}>
            <Label x={x0} y={r.y} textAnchor="start" fontSize={16} fontWeight={600} fill={r.color}>
              {r.name}
            </Label>
            <Label x={x0 + w} y={r.y} textAnchor="end" fontSize={16} fontWeight={600} fill="var(--fg)">
              {fmt(r.value, 2)}
            </Label>
            <rect x={x0} y={r.y + 10} width={w} height={22} rx={6} fill="var(--surface-raised)" />
            <rect x={x0} y={r.y + 10} width={Math.max(0, len)} height={22} rx={6} fill={r.color} />
          </g>
        )
      })}
      {ratesEqual(forward, reverse) && (
        <g>
          <rect x={x0 + w / 2 - 66} y={150} width={132} height={26} rx={13} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.4} />
          <Label x={x0 + w / 2} y={163} fontSize={14} fontWeight={600} fill="var(--fg)">
            equal rates
          </Label>
        </g>
      )}
    </g>
  )
}

const LEGEND_LABELS = ['H₂', 'I₂', 'HI'] as const

/** Species legend under the flask, with a coloured dot for each species. */
function VesselLegend() {
  return (
    <g>
      {SPECIES.map((s, i) => {
        const x = 40 + i * 96
        return (
          <g key={s.id} transform={`translate(${x}, 392)`}>
            <circle cx={0} cy={0} r={7} fill={s.color} />
            <Label x={14} y={0} textAnchor="start" fontSize={16} fontWeight={600} fill="var(--fg)">
              {LEGEND_LABELS[i]}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/** Curves of [H₂], [I₂] and [HI] against time, across the full width of the panel (Step 4). */
function CurvePlot() {
  const left = 84
  const right = 556
  const top = 236
  const bottom = 420
  const cMax = PLOT_CONC
  const xOf = (t: number) => left + (t / TIME_MAX) * (right - left)
  const yOf = (c: number) => bottom - (c / cMax) * (bottom - top)
  const settle = model.settledAt
  return (
    <g>
      {/* Legend, along the top */}
      {CURVES.map((series, i) => {
        const x = left + i * 100
        return (
          <g key={`legend-${series.id}`} transform={`translate(${x}, 214)`}>
            <line x1={0} x2={24} y1={0} y2={0} stroke={series.color} strokeWidth={3} strokeDasharray={series.dash} />
            <Label x={32} y={0} textAnchor="start" fontSize={16} fill="var(--fg)" fontWeight={600}>
              <tspan className="sym">{series.label}</tspan>
            </Label>
          </g>
        )
      })}

      {/* Equilibrium band */}
      <rect x={xOf(settle)} y={top} width={Math.max(0, right - xOf(settle))} height={bottom - top} fill="var(--fwd)" opacity={0.1} />
      <Label x={right - 8} y={top + 14} textAnchor="end" fontSize={14} fontWeight={600} fill="var(--fwd)">
        equilibrium reached
      </Label>

      {/* Axes */}
      <line x1={left} x2={left} y1={top} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      {[0, 0.5, 1].map((f) => (
        <g key={`yt-${f}`}>
          <line x1={left - 4} x2={left} y1={yOf(f * cMax)} y2={yOf(f * cMax)} stroke="var(--fg-muted)" strokeWidth={1} />
          <Label x={left - 8} y={yOf(f * cMax)} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
            {fmt(f * cMax, 2)}
          </Label>
        </g>
      ))}
      {[0, 1, 2, 3, 4].filter((t) => t <= TIME_MAX).map((t) => (
        <g key={`xt-${t}`}>
          <line x1={xOf(t)} x2={xOf(t)} y1={bottom} y2={bottom + 4} stroke="var(--fg-muted)" strokeWidth={1} />
          <Label x={xOf(t)} y={bottom + 18} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
            {t}
          </Label>
        </g>
      ))}
      <Label x={(left + right) / 2} y={bottom + 38} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        time / s
      </Label>
      <Label x={26} y={(top + bottom) / 2} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" transform={`rotate(-90 26 ${(top + bottom) / 2})`}>
        concentration / mol L⁻¹
      </Label>

      {/* Curves */}
      {CURVES.map((series) => (
        <path
          key={series.id}
          d={curvePath(series.points, xOf, yOf)}
          fill="none"
          stroke={series.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={series.dash}
        />
      ))}
    </g>
  )
}

function IsotopeColumns({ share }: { share: number }) {
  const fractions = isotopologueFractions(share)
  const base = 380
  const maxH = 250
  const names = ['NH₃', 'NH₂D', 'NHD₂', 'ND₃'] as const
  const centres = [120, 237, 353, 470]
  return (
    <g>
      <Label x={290} y={34} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Ammonia after the D₂ mixing
      </Label>
      <Label x={290} y={62} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {`share of D among the N–H positions, p = ${fmt(share, 2)}`}
      </Label>
      <line x1={80} x2={520} y1={base} y2={base} stroke="var(--fg-muted)" strokeWidth={1.4} />
      {fractions.map((f, i) => {
        const h = f * maxH
        const cx = centres[i]
        const tint = i === 0 ? 'var(--el-S)' : 'var(--acid)'
        return (
          <g key={names[i]}>
            <rect x={cx - 38} y={base - h} width={76} height={Math.max(h, 0)} rx={6} fill={tint} opacity={i === 0 ? 0.55 : 0.9} />
            <Label x={cx} y={base - h - 16} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
              {`${fmt(f * 100, 1)} %`}
            </Label>
            <Label x={cx} y={base + 24} textAnchor="middle" fontSize={16} fill="var(--fg)">
              {names[i]}
            </Label>
          </g>
        )
      })}
      <Label x={290} y={438} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {`Share of D atoms with equal H and D atoms: p = ${fmt(share, 2)}`}
      </Label>
    </g>
  )
}

/**
 * Section 6.2 Scrolly. Steps 1 to 4 follow H₂ + I₂ ⇌ 2HI from reactants: the flask and rate bars,
 * then the curves. Step 5 shows the deuterium tracer in ammonia.
 */
export function DynamicEquilibrium({ step, reducedMotion }: DynamicEquilibriumProps) {
  const index = Math.min(4, Math.max(0, Math.round(step)))
  const isotopeShare = deuteriumShare(1, 1)
  const share = useTweenedNumber(index === 4 ? isotopeShare : 0, reducedMotion, 1.4)

  if (index === 4) {
    return (
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label="Columns showing NH3, NH2D, NHD2 and ND3 after mixing with deuterium, rising from none to the statistical share"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        data-testid="dynamic-equilibrium"
        data-step={index}
      >
        <IsotopeColumns share={share} />
        <Label x={290} y={VIEW.height - 14} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          Mixing H₂ / N₂ / NH₃ with D₂ / N₂ / ND₃ scrambles the atoms.
        </Label>
      </svg>
    )
  }

  const picture = model.pictures[index]
  const counts = picture.counts
  const showCurves = index === 3

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={`Flask of H₂, I₂ and HI particles at time ${fmt(picture.t, 2)} s, with the forward and reverse rates`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="dynamic-equilibrium"
      data-step={index}
    >
      <g transform={showCurves ? FLASK_SMALL : FLASK_FULL}>
        <SealedVessel species={SPECIES} counts={counts} seed={7} title="Sealed flask with H₂, I₂ and HI particles" />
      </g>

      {showCurves ? (
        <g>
          <HorizontalRates forward={picture.rates.forward} reverse={picture.rates.reverse} />
          <CurvePlot />
        </g>
      ) : (
        <g>
          <VesselLegend />
          <VerticalRates forward={picture.rates.forward} reverse={picture.rates.reverse} />
        </g>
      )}

      <Label x={290} y={CAPTION_Y} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {CAPTIONS[index]}
      </Label>
    </svg>
  )
}
