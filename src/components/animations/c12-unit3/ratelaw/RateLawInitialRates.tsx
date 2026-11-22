'use client'

import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Particle, RateMeter, ReactionBox, Stopwatch } from '@/components/vocab'
import { particleCount, placeParticles, getRateLawStepState, K_LABEL, PARTICLE_SLOTS, type RateLawStepState } from './ratelaw-steps'

export interface RateLawInitialRatesProps {
  step: number
  reducedMotion: boolean
}

const SVG_H = 540
const FONT = 'var(--font-sans)'
const BOX = { x: 24, y: 44, width: 330, height: 290, radius: 16 }
const METER_MAX = 0.8
/** Ambient bob amplitude in box units; zero under reduced motion. */
const BOB = 3

const NO_TONE = 'reactant' as const
const O2_TONE = 'neutral' as const

function Legend() {
  return (
    <g>
      <Particle x={34} y={358} r={8} tone={NO_TONE} />
      <text x={50} y={363} fontSize={16} fill="var(--fg)" fontFamily={FONT}>NO</text>
      <Particle x={100} y={358} r={8} tone={O2_TONE} />
      <text x={116} y={363} fontSize={16} fill="var(--fg)" fontFamily={FONT}>O₂</text>
    </g>
  )
}

function Vessel({
  state, noConc, o2Conc, rate, time, reducedMotion,
}: { state: RateLawStepState; noConc: number; o2Conc: number; rate: number; time: number; reducedMotion: boolean }) {
  const { no, o2 } = placeParticles(particleCount(noConc), particleCount(o2Conc))
  const bobAt = (i: number) => (reducedMotion ? 0 : Math.sin(time * 1.6 + i * 1.7) * BOB)

  return (
    <g>
      <text x={24} y={28} fontSize={17} fill="var(--fg)" fontFamily={FONT}>{state.headline}</text>

      <ReactionBox x={BOX.x} y={BOX.y} width={BOX.width} height={BOX.height} radius={BOX.radius}>
        {no.map((slot) => {
          const p = PARTICLE_SLOTS[slot]
          return <Particle key={`no-${slot}`} x={p.x} y={p.y + bobAt(2 * slot)} r={14} tone={NO_TONE} />
        })}
        {o2.map((slot) => {
          const p = PARTICLE_SLOTS[slot]
          return <Particle key={`o2-${slot}`} x={p.x} y={p.y + bobAt(2 * slot + 1)} r={14} tone={O2_TONE} />
        })}
      </ReactionBox>
      <Legend />

      <Stopwatch x={380} y={40} size={170} seconds={reducedMotion ? 0 : time % 60} digits={1} />
      <text x={465} y={240} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily={FONT}>elapsed time</text>
      <text x={380} y={276} fontSize={16} fill="var(--fg)" fontFamily={FONT}>[NO] = {noConc.toFixed(2)} mol L⁻¹</text>
      <text x={380} y={302} fontSize={16} fill="var(--fg)" fontFamily={FONT}>[O₂] = {o2Conc.toFixed(2)} mol L⁻¹</text>

      <RateMeter
        x={24}
        y={392}
        width={532}
        height={18}
        value={rate}
        max={METER_MAX}
        tone="product"
        label="Initial rate of NO₂ formation"
        valueLabel={`${rate.toFixed(3)} mol L⁻¹ s⁻¹`}
      />

      {state.ratioTag !== null ? (
        <text x={24} y={486} fontSize={20} fill="var(--accent)" fontFamily={FONT}>
          {state.ratioTag} the rate of experiment 1
        </text>
      ) : (
        <text x={24} y={486} fontSize={17} fill="var(--fg-muted)" fontFamily={FONT}>
          Reference point for every comparison
        </text>
      )}
      {state.showLaw ? (
        <text x={24} y={520} fontSize={20} fill="var(--fg)" fontFamily={FONT}>
          Rate = <tspan className="sym">k</tspan>[NO]²[O₂] with <tspan className="sym">k</tspan> = {K_LABEL} mol⁻² L² s⁻¹
        </text>
      ) : null}
    </g>
  )
}

function Chip({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={220} height={36} rx={18} fill="var(--accent)" fillOpacity={0.2} stroke="var(--accent)" strokeWidth={1.5} />
      <text x={x + 110} y={y + 24} textAnchor="middle" fontSize={17} fill="var(--fg)" fontFamily={FONT}>{label}</text>
    </g>
  )
}

function ExponentCards() {
  const cardStyle = { fill: 'var(--surface-raised)', stroke: 'var(--kin-grid)', strokeWidth: 1.5 }
  return (
    <g>
      <rect x={24} y={56} width={252} height={250} rx={16} {...cardStyle} />
      <rect x={304} y={56} width={252} height={250} rx={16} {...cardStyle} />
      <text x={150} y={92} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily={FONT}>Balanced equation</text>
      <text x={430} y={92} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily={FONT}>Rate law</text>
      <text x={150} y={150} textAnchor="middle" fontSize={24} fill="var(--fg)" fontFamily={FONT}>2NO + O₂ → 2NO₂</text>
      <text x={430} y={150} textAnchor="middle" fontSize={22} fill="var(--fg)" fontFamily={FONT}>
        Rate = <tspan className="sym">k</tspan>[NO]²[O₂]
      </text>
      <Chip x={40} y={196} label="NO: coefficient 2" />
      <Chip x={40} y={244} label="O₂: coefficient 1" />
      <Chip x={320} y={196} label="NO: exponent 2" />
      <Chip x={320} y={244} label="O₂: exponent 1" />
      <line x1={260} y1={214} x2={320} y2={214} stroke="var(--kin-grid)" strokeWidth={2} strokeDasharray="5 5" />
      <line x1={260} y1={262} x2={320} y2={262} stroke="var(--kin-grid)" strokeWidth={2} strokeDasharray="5 5" />
      <text x={290} y={372} textAnchor="middle" fontSize={17} fill="var(--fg)" fontFamily={FONT}>
        The exponents came from four measurements.
      </text>
      <text x={290} y={398} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily={FONT}>
        For this reaction they agree. That is not a rule.
      </text>
      <rect x={150} y={436} width={280} height={44} rx={22} fill="var(--surface-raised)" stroke="var(--accent)" strokeWidth={1.5} />
      <text x={290} y={464} textAnchor="middle" fontSize={19} fill="var(--fg)" fontFamily={FONT}>
        <tspan className="sym">k</tspan> = {K_LABEL} mol⁻² L² s⁻¹
      </text>
    </g>
  )
}

export function RateLawInitialRates({ step, reducedMotion }: RateLawInitialRatesProps) {
  const state = getRateLawStepState(step)
  const noConc = useTweenedNumber(state.noMolPerL, reducedMotion)
  const o2Conc = useTweenedNumber(state.o2MolPerL, reducedMotion)
  const rate = useTweenedNumber(state.rate, reducedMotion)
  const time = useAmbientTime(reducedMotion)

  return (
    <svg
      viewBox={`0 0 580 ${SVG_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
    >
      {state.scene === 'exponents' ? (
        <ExponentCards />
      ) : (
        <Vessel state={state} noConc={noConc} o2Conc={o2Conc} rate={rate} time={time} reducedMotion={reducedMotion} />
      )}
    </svg>
  )
}
