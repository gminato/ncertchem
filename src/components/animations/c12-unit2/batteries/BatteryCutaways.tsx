'use client'

import type { ReactNode } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  BatteryCutaway,
  Electrode,
  Ion,
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
const LOAD = { x: 262, y: 72, width: 78, height: 40 }
const LOAD_Y = LOAD.y + LOAD.height / 2
const LOAD_LEFT = LOAD.x
const LOAD_RIGHT = LOAD.x + LOAD.width

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

function LoadBox() {
  return (
    <g>
      <rect x={LOAD.x} y={LOAD.y} width={LOAD.width} height={LOAD.height} rx={6} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
      <text x={LOAD.x + LOAD.width / 2} y={LOAD.y + 25} textAnchor="middle" {...LABEL}>bulb</text>
    </g>
  )
}

function DryCell({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  return (
    <g>
      <LoadBox />
      <Lead corners={[{ x: 212, y: 190 }, { x: 212, y: LOAD_Y }, { x: LOAD_LEFT, y: LOAD_Y }]} t={t} electrons={!reducedMotion} />
      <Lead corners={[{ x: LOAD_RIGHT, y: LOAD_Y }, { x: 368, y: LOAD_Y }, { x: 368, y: 190 }]} t={t} electrons={!reducedMotion} />
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
  return (
    <g>
      <LoadBox />
      <Lead corners={[{ x: 220, y: 236 }, { x: 220, y: LOAD_Y }, { x: LOAD_LEFT, y: LOAD_Y }]} t={t} electrons={!reducedMotion} />
      <Lead corners={[{ x: LOAD_RIGHT, y: LOAD_Y }, { x: 372, y: LOAD_Y }, { x: 372, y: 236 }]} t={t} electrons={!reducedMotion} />
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

function NickelCadmium({ t, reducedMotion }: { t: number; reducedMotion: boolean }) {
  // Cd (anode, left) and Ni(OH)3 (cathode, right) side by side across the can, as in cell notation.
  const stackLeft = 170
  const plateW = 115
  const sepW = 10
  const top = 170
  const plateH = 240
  const cdX = stackLeft
  const sepX = cdX + plateW
  const niX = sepX + sepW
  const cdTab = cdX + plateW / 2
  const niTab = niX + plateW / 2
  const bulb = { x: 251, y: 72, width: 78, height: 40 }
  const bulbY = bulb.y + bulb.height / 2
  return (
    <g>
      <BatteryCutaway x={140} y={140} width={300} height={300} shape="can" terminals={false}>
        <rect x={cdX} y={top} width={plateW} height={plateH} rx={3} fill="var(--metal-cd)" fillOpacity={0.85} />
        <rect x={sepX} y={top} width={sepW} height={plateH} fill="var(--surface-raised)" fillOpacity={0.9} />
        <rect x={niX} y={top} width={plateW} height={plateH} rx={3} fill="var(--metal-ni)" fillOpacity={0.85} />
      </BatteryCutaway>
      <rect x={bulb.x} y={bulb.y} width={bulb.width} height={bulb.height} rx={6} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={2} />
      <text x={bulb.x + bulb.width / 2} y={bulb.y + 25} textAnchor="middle" {...LABEL}>bulb</text>
      <Lead corners={[{ x: cdTab, y: top }, { x: cdTab, y: bulbY }, { x: bulb.x, y: bulbY }]} t={t} electrons={!reducedMotion} />
      <Lead corners={[{ x: bulb.x + bulb.width, y: bulbY }, { x: niTab, y: bulbY }, { x: niTab, y: top }]} t={t} electrons={!reducedMotion} />
      <Label x={130} y={262} anchor="end">Cd (−)</Label>
      <Label x={130} y={282} anchor="end" muted>negative plate</Label>
      <Label x={450} y={262}>Ni(OH)₃ (+)</Label>
      <Label x={450} y={282} muted>positive plate</Label>
      <Label x={290} y={462} anchor="middle" muted>Plates in moist alkali (NaOH or KOH)</Label>
      <Label x={28} y={506} muted>Cd is oxidised at the anode; Ni(OH)₃ is reduced at the cathode.</Label>
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
      scene = <NickelCadmium t={t} reducedMotion={reducedMotion} />
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
