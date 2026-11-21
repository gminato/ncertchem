'use client'

import type { ReactNode } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  BatteryCutaway,
  Electrode,
  Ion,
  Voltmeter,
  Wire,
  type Point,
} from '@/components/vocab'
import {
  BATTERY_STEPS,
  fmtVolt,
  ncertVoltageOf,
  reactionText,
} from './battery-steps'

export interface BatteryCutawaysProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 546
const VIEW_Y = -26
/** Meter body centre and the top wiring row (meter terminals sit 22 px below the body). */
const METER = { x: 290, y: 50, width: 150, height: 64 }
const TERMINAL_Y = METER.y + METER.height / 2 + 22
const TERMINAL_LEFT = METER.x - 34
const TERMINAL_RIGHT = METER.x + 34

const LABEL = { fontSize: 15, fill: 'var(--fg)', fontFamily: 'var(--font-sans)' } as const
const MUTED = { fontSize: 15, fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' } as const

function Label({ x, y, anchor = 'start', muted = false, children }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; muted?: boolean; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor={anchor} {...(muted ? MUTED : LABEL)}>
      {children}
    </text>
  )
}

/** A wire between two electrode posts, routed through the top wiring row. */
function Lead({ corners, t, electrons, direction = 'forward' }: { corners: Point[]; t: number; electrons: boolean; direction?: 'forward' | 'reverse' }) {
  return <Wire corners={corners} t={t} electrons={electrons} dots={3} direction={direction} strokeWidth={3} />
}

/** Electrode metal shown with a coating on its lower part (0 = bare, 1 = fully coated). */
function Coating({ x, width, bottom, length, coverage }: { x: number; width: number; bottom: number; length: number; coverage: number }) {
  const h = length * coverage
  if (h <= 0.5) return null
  return (
    <rect x={x - width / 2 - 3} y={bottom - h} width={width + 6} height={h} rx={3} fill="var(--surface)" stroke="var(--fg-muted)" strokeWidth={1} strokeDasharray="3 2" />
  )
}

/** An Ion that drifts sideways with the ambient clock, so the solution reads as moving. */
function Drift({ x, y, span, phase, t, formula, charge, kind }: { x: number; y: number; span: number; phase: number; t: number; formula: string; charge: string; kind: 'cation' | 'anion' }) {
  const dx = span * Math.sin(t * 0.6 + phase)
  return <Ion x={x + dx} y={y} kind={kind} formula={formula} charge={charge} fontSize={14} />
}

function DryCell({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  const voltage = ncertVoltageOf('dry-cell')
  return (
    <g>
      <Voltmeter x={METER.x} y={METER.y} width={METER.width} height={METER.height} value={voltage} range={[0, 2]} unit="V" caption="Voltmeter" terminals plusSide="right" />
      <Lead corners={[{ x: 212, y: 190 }, { x: 212, y: TERMINAL_Y }, { x: TERMINAL_LEFT, y: TERMINAL_Y }]} t={t} electrons={!reducedMotion} />
      <Lead corners={[{ x: TERMINAL_RIGHT, y: TERMINAL_Y }, { x: 368, y: TERMINAL_Y }, { x: 368, y: 190 }]} t={t} electrons={!reducedMotion} />
      <BatteryCutaway x={150} y={140} width={280} height={290} shape="can" terminals={false}>
        <rect x={240} y={200} width={100} height={200} rx={6} fill="var(--metal-graphite)" fillOpacity={0.22} />
        <Electrode x={212} top={190} length={190} width={24} material="zn" role="anode" polarity="−" />
        <Electrode x={368} top={190} length={190} width={24} material="graphite" role="cathode" polarity="+" />
        {[0, 1, 2].map((i) => (
          <Drift key={i} x={252} y={250 + i * 50} span={10} phase={i * 2} t={reducedMotion ? 0 : t} formula="Zn" charge="2+" kind="cation" />
        ))}
      </BatteryCutaway>
      <Label x={138} y={300} anchor="end">Anode</Label>
      <Label x={138} y={320} anchor="end" muted>zinc can (−)</Label>
      <Label x={442} y={300}>Cathode</Label>
      <Label x={442} y={320} muted>graphite (+)</Label>
      <Label x={442} y={345} muted>in MnO₂ + C</Label>
      <Label x={442} y={365} muted>paste</Label>
    </g>
  )
}

function MercuryCell({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  const voltage = ncertVoltageOf('mercury-cell')
  return (
    <g>
      <Voltmeter x={METER.x} y={METER.y} width={METER.width} height={METER.height} value={voltage} range={[0, 2]} unit="V" caption="Voltmeter" terminals plusSide="right" />
      <Lead corners={[{ x: 220, y: 236 }, { x: 220, y: TERMINAL_Y }, { x: TERMINAL_LEFT, y: TERMINAL_Y }]} t={t} electrons={!reducedMotion} />
      <Lead corners={[{ x: TERMINAL_RIGHT, y: TERMINAL_Y }, { x: 372, y: TERMINAL_Y }, { x: 372, y: 236 }]} t={t} electrons={!reducedMotion} />
      <BatteryCutaway x={130} y={180} width={320} height={170} shape="can" terminals={false}>
        <rect x={300} y={226} width={130} height={80} rx={6} fill="var(--metal-graphite)" fillOpacity={0.22} />
        <Electrode x={220} top={236} length={60} width={30} material="zn" role="anode" polarity="−" />
        <Electrode x={372} top={236} length={60} width={22} material="graphite" role="cathode" polarity="+" />
      </BatteryCutaway>
      <Label x={118} y={252} anchor="end">Anode</Label>
      <Label x={118} y={272} anchor="end" muted>Zn(Hg) (−)</Label>
      <Label x={468} y={252}>Cathode</Label>
      <Label x={468} y={272} muted>HgO + C (+)</Label>
      <Label x={290} y={400} anchor="middle" muted>Paste of KOH and ZnO</Label>
    </g>
  )
}

function LeadCell({ t, reducedMotion, coverage, acid, recharge }: { t: number; reducedMotion: boolean; coverage: number; acid: number; recharge: boolean }) {
  const bottom = 390
  const plateLength = 220
  const pbX = 246
  const pbO2X = 356
  const pbRole = recharge ? 'cathode' : 'anode'
  const pbO2Role = recharge ? 'anode' : 'cathode'
  const barTop = 170
  const barHeight = 220
  const electrons = !reducedMotion
  return (
    <g>
      {recharge ? (
        <g>
          <rect x={262} y={72} width={78} height={40} rx={6} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
          <text x={301} y={97} textAnchor="middle" {...LABEL}>charger</text>
          <Lead corners={[{ x: pbO2X, y: 170 }, { x: pbO2X, y: 92 }, { x: 340, y: 92 }]} t={t} electrons={electrons} />
          <Lead corners={[{ x: 262, y: 92 }, { x: pbX, y: 92 }, { x: pbX, y: 170 }]} t={t} electrons={electrons} />
        </g>
      ) : (
        <g>
          <rect x={262} y={72} width={78} height={40} rx={6} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
          <text x={301} y={97} textAnchor="middle" {...LABEL}>load</text>
          <Lead corners={[{ x: pbX, y: 170 }, { x: pbX, y: 92 }, { x: 262, y: 92 }]} t={t} electrons={electrons} />
          <Lead corners={[{ x: 340, y: 92 }, { x: pbO2X, y: 92 }, { x: pbO2X, y: 170 }]} t={t} electrons={electrons} />
        </g>
      )}
      <BatteryCutaway x={165} y={150} width={250} height={270} shape="case" terminals={false}>
        <Electrode x={pbX} top={170} length={plateLength} width={22} material="pb" role={pbRole} polarity="−" />
        <Electrode x={pbO2X} top={170} length={plateLength} width={22} material="pbo2" role={pbO2Role} polarity="+" />
        <Coating x={pbX} width={22} bottom={bottom} length={plateLength} coverage={coverage} />
        <Coating x={pbO2X} width={22} bottom={bottom} length={plateLength} coverage={coverage} />
        {[0, 1, 2].map((i) => (
          <Drift key={i} x={301} y={300 + i * 30} span={18} phase={i * 2.1} t={reducedMotion ? 0 : t} formula="SO4" charge="2-" kind="anion" />
        ))}
      </BatteryCutaway>
      <Label x={165} y={444}>Pb (−)</Label>
      <Label x={415} y={444} anchor="end">PbO₂ (+)</Label>
      <rect x={462} y={barTop} width={26} height={barHeight} rx={4} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
      <rect x={462} y={barTop + barHeight * (1 - acid)} width={26} height={barHeight * acid} rx={4} fill="var(--accent)" fillOpacity={0.7} />
      <Label x={475} y={156} anchor="middle">H₂SO₄</Label>
      <Label x={475} y={412} anchor="middle" muted>strength</Label>
      <Label x={475} y={432} anchor="middle" muted>(illustrative)</Label>
    </g>
  )
}

function NickelCadmium() {
  const x = 212
  const w = 156
  const stripe = 54
  const top = 182
  const stripes = [
    { fill: 'var(--metal-ni)' },
    { fill: 'var(--surface-raised)' },
    { fill: 'var(--metal-cd)' },
    { fill: 'var(--surface-raised)' },
  ]
  return (
    <g>
      <BatteryCutaway x={190} y={150} width={200} height={280} shape="can" terminals={false}>
        {stripes.map((s, i) => (
          <rect key={i} x={x} y={top + i * stripe} width={w} height={stripe} fill={s.fill} fillOpacity={s.fill === 'var(--surface-raised)' ? 0.9 : 0.85} />
        ))}
      </BatteryCutaway>
      <Label x={178} y={262} anchor="end">Ni(OH)₃ (+)</Label>
      <Label x={178} y={282} anchor="end" muted>positive plate</Label>
      <Label x={402} y={262}>Cd (−)</Label>
      <Label x={402} y={282} muted>negative plate</Label>
      <Label x={290} y={458} anchor="middle" muted>Jelly-roll stack in moist alkali (NaOH or KOH)</Label>
    </g>
  )
}

export function BatteryCutaways({ step, reducedMotion }: BatteryCutawaysProps) {
  const index = Math.min(Math.max(0, Math.round(step)), BATTERY_STEPS.length - 1)
  const target = BATTERY_STEPS[index]
  const coverage = useTweenedNumber(target.targets.coverage, reducedMotion, 0.9)
  const acid = useTweenedNumber(target.targets.acid, reducedMotion, 0.9)
  const t = useAmbientTime(reducedMotion)

  let scene: ReactNode
  let captions: ReactNode
  switch (target.id) {
    case 'dry-cell':
      scene = <DryCell t={t} reducedMotion={reducedMotion} />
      captions = (
        <>
          <Label x={28} y={470} muted>Anode: {reactionText('dry-cell', 'anodeCe')}</Label>
          <Label x={28} y={492} muted>Cathode: {reactionText('dry-cell', 'cathodeCe')}</Label>
          <Label x={28} y={514} muted>Overall, about {fmtVolt(ncertVoltageOf('dry-cell'), 1)} V: {reactionText('dry-cell', 'overallCe')}</Label>
        </>
      )
      break
    case 'mercury-cell':
      scene = <MercuryCell t={t} reducedMotion={reducedMotion} />
      captions = (
        <>
          <Label x={28} y={440} muted>Anode: {reactionText('mercury-cell', 'anodeCe')}</Label>
          <Label x={28} y={462} muted>Cathode: {reactionText('mercury-cell', 'cathodeCe')}</Label>
          <Label x={28} y={484} muted>Overall, steady {fmtVolt(ncertVoltageOf('mercury-cell'), 2)} V: {reactionText('mercury-cell', 'overallCe')}</Label>
        </>
      )
      break
    case 'lead-discharge':
    case 'lead-recharge': {
      const recharge = target.id === 'lead-recharge'
      scene = <LeadCell t={t} reducedMotion={reducedMotion} coverage={coverage} acid={acid} recharge={recharge} />
      captions = recharge ? (
        <>
          <Label x={28} y={470} muted>On charge, the Pb plate is the cathode and the PbO₂ plate the anode.</Label>
          <Label x={28} y={492} muted>Overall: {reactionText('lead-storage', 'rechargeCe')}</Label>
        </>
      ) : (
        <>
          <Label x={28} y={470} muted>Anode: {reactionText('lead-storage', 'anodeCe')}</Label>
          <Label x={28} y={492} muted>Cathode: {reactionText('lead-storage', 'cathodeCe')}</Label>
          <Label x={28} y={514} muted>Overall: {reactionText('lead-storage', 'overallCe')}</Label>
        </>
      )
      break
    }
    case 'nickel-cadmium':
      scene = <NickelCadmium />
      captions = <Label x={28} y={484} muted>Overall, discharge: {reactionText('nickel-cadmium', 'overallCe')}</Label>
      break
  }

  return (
    <svg viewBox={`0 ${VIEW_Y} ${VIEW_W} ${VIEW_H}`} role="img" aria-label={target.ariaLabel} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {scene}
      {captions}
    </svg>
  )
}
