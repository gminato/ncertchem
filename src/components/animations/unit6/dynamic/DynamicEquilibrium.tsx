'use client'

import { RateBars, SealedVessel, type VesselSpecies } from '@/components/equilibrium'
import { curvePath, type TimePoint } from '@/components/equilibrium/geometry'
import { Label } from '@/components/vocab'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { approachPresets } from '@/lib/chem/approach-to-equilibrium'
import { deuteriumShare, dynamicModel, isotopologueFractions, PLOT_CONC } from './dynamic-steps'

export interface DynamicEquilibriumProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 580, height: 500 }
const VESSEL_X = 110
const BARS_Y = 300
const CURVE_Y = 296
const CAPTION_Y = 486

const SPECIES: VesselSpecies[] = [
  { id: 'H2', color: 'var(--el-N)', phase: 'gas', label: 'H₂' },
  { id: 'I2', color: 'var(--i2)', phase: 'gas', label: 'I₂' },
  { id: 'HI', color: 'var(--el-S)', phase: 'gas', label: 'HI' },
]

const model = dynamicModel()
const TIME_MAX = approachPresets().find((p) => p.id === 'h2-i2')!.tEnd

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

/** Fixed-scale rate config for RateBars: each picture is an exact state, so the bars show exact rates. */
function barConfig(rates: { forward: number; reverse: number }) {
  return {
    forwardStart: rates.forward,
    reverseStart: rates.reverse,
    equilibrium: model.pictures[0].rates.forward,
  }
}

function fmt(value: number, digits: number): string {
  return value.toFixed(digits).replace('-', '−')
}

function CurvePlot() {
  const left = 58
  const right = 496
  const top = 40
  const bottom = 134
  const cMax = PLOT_CONC
  const xOf = (t: number) => left + (t / TIME_MAX) * (right - left)
  const yOf = (c: number) => bottom - (c / cMax) * (bottom - top)
  const settle = model.settledAt
  return (
    <g>
      {/* Legend, along the top */}
      {CURVES.map((series, i) => {
        const x = left + i * 92
        return (
          <g key={`legend-${series.id}`} transform={`translate(${x}, 12)`}>
            <line x1={0} x2={22} y1={0} y2={0} stroke={series.color} strokeWidth={3} strokeDasharray={series.dash} />
            <Label x={28} y={0} fontSize={15} fill="var(--fg)" fontWeight={600}>
              <tspan className="sym">{series.label}</tspan>
            </Label>
          </g>
        )
      })}

      {/* Equilibrium band */}
      <rect x={xOf(settle)} y={top} width={Math.max(0, right - xOf(settle))} height={bottom - top} fill="var(--fwd)" opacity={0.1} />
      <Label x={right - 8} y={top + 14} textAnchor="end" fontSize={13} fontWeight={600} fill="var(--fwd)">
        equilibrium reached
      </Label>

      {/* Axes */}
      <line x1={left} x2={left} y1={top} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      {[0, 0.5, 1].map((f) => (
        <Label key={`yt-${f}`} x={left - 8} y={yOf(f * cMax)} textAnchor="end" fontSize={13} fill="var(--fg-muted)">
          {fmt(f * cMax, 2)}
        </Label>
      ))}
      {[0, 1, 2, 3, 4].map((t) => (
        <g key={`xt-${t}`}>
          <line x1={xOf(t)} x2={xOf(t)} y1={bottom} y2={bottom + 4} stroke="var(--fg-muted)" strokeWidth={1} />
          <Label x={xOf(t)} y={bottom + 18} textAnchor="middle" fontSize={13} fill="var(--fg-muted)">
            {t}
          </Label>
        </g>
      ))}
      <Label x={(left + right) / 2} y={bottom + 36} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
        time, s (concentration, mol L⁻¹)
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
 * Section 6.2 Scrolly. Steps 1 to 4 follow H₂ + I₂ ⇌ 2HI from reactants: the vessel and rate bars,
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
      <g transform={`translate(${VESSEL_X}, 0)`}>
        <SealedVessel
          species={SPECIES}
          counts={counts}
          seed={7}
          title="Sealed flask with H₂, I₂ and HI particles"
        />
      </g>

      {showCurves ? (
        <g transform={`translate(0, ${CURVE_Y})`}>
          <CurvePlot />
        </g>
      ) : (
        <g transform={`translate(${VESSEL_X}, ${BARS_Y})`}>
          <RateBars
            progress={0}
            config={barConfig(picture.rates)}
            forwardLabel="Forward rate"
            reverseLabel="Reverse rate"
            title={`Forward rate ${fmt(picture.rates.forward, 2)} and reverse rate ${fmt(picture.rates.reverse, 2)} mmol per litre per second`}
          />
          <Label x={0} y={150} fontSize={13} fill="var(--fg-muted)">
            rates in mmol L⁻¹ s⁻¹
          </Label>
        </g>
      )}

      <Label x={290} y={CAPTION_Y} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {CAPTIONS[index]}
      </Label>
    </svg>
  )
}
