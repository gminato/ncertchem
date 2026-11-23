'use client'

import type { ReactNode } from 'react'
import { drawingFrame, ResonanceSet, type SkeletalMark, SkeletalFormula } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  ACETALDEHYDE,
  ACETONE,
  ACETOPHENONE,
  BENZALDEHYDE,
  beatAt,
  CARBONYL_BEATS,
  CHLOROBUTANAL,
  type CarbonylBeat,
  DIPOLAR_FORM,
  FORMALDEHYDE,
  METHYLCYCLOHEXANECARBALDEHYDE,
} from './carbonyl-steps'

export interface CarbonylScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
const W = 580
const H = 640
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ACCENT = 'var(--accent)'
const SUBSCRIPT = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

function subscripted(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT[Number(d)])
}

function Caption({ x = W / 2, y, children, size = 14, fill = INK, weight = 400 }: {
  x?: number
  y: number
  children: ReactNode
  size?: number
  fill?: string
  weight?: number
}) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={weight} fill={fill}>
      {children}
    </text>
  )
}

/** Atom positions of a drawing placed at (x, y), in the same frame SkeletalFormula uses. */
function placed(smiles: string, scale: number, x: number, y: number) {
  const frame = drawingFrame(parseSmiles(smiles), scale)
  return (i: number) => ({ x: x + frame.points[i].x, y: y + frame.points[i].y })
}

/** A soft tone behind the carbonyl carbon: the electrophilic carbon, the same tone in every Step. */
function CarbonylHalo({ p }: { p: { x: number; y: number } }) {
  return <circle cx={p.x} cy={p.y} r={15} fill={ROLE_TONE.electrophilicCarbon} fillOpacity={0.3} />
}

function Molecule({ smiles, carbonyl, scale, x, y, locants, partialCharges }: {
  smiles: string
  carbonyl: number
  scale: number
  x: number
  y: number
  locants?: readonly SkeletalMark[]
  partialCharges?: readonly SkeletalMark[]
}) {
  const at = placed(smiles, scale, x, y)
  return (
    <g>
      <CarbonylHalo p={at(carbonyl)} />
      <SkeletalFormula
        graph={parseSmiles(smiles)}
        scale={scale}
        x={x}
        y={y}
        showLonePairs
        locants={locants}
        partialCharges={partialCharges}
      />
    </g>
  )
}

function PlanarView() {
  const scale = 90
  const cx = W / 2
  const cy = 250
  const at = placed(FORMALDEHYDE.smiles, scale, cx, cy)
  const c = at(0)
  const o = at(1)
  const phi = Math.atan2(o.y - c.y, o.x - c.x)
  const phiH = phi + (2 * Math.PI) / 3
  const r = 30
  const arcStart = { x: c.x + r * Math.cos(phi), y: c.y + r * Math.sin(phi) }
  const arcEnd = { x: c.x + r * Math.cos(phiH), y: c.y + r * Math.sin(phiH) }
  const labelAngle = phi + Math.PI / 3
  const label = { x: c.x + 62 * Math.cos(labelAngle), y: c.y + 62 * Math.sin(labelAngle) }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={200} ry={118} fill={MUTED} fillOpacity={0.08} />
      <Molecule smiles={FORMALDEHYDE.smiles} carbonyl={FORMALDEHYDE.carbonyl} scale={scale} x={cx} y={cy} />
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
      />
      <Caption x={label.x} y={label.y + 5} size={14}>≈ 120°</Caption>
      <Caption y={388} size={16} weight={600}>{unit8Name(FORMALDEHYDE.smiles)} (formaldehyde)</Caption>
      <Caption y={H - 56}>Three σ bonds leave the carbonyl carbon, at about 120°</Caption>
      <Caption y={H - 28} fill={MUTED}>All four atoms lie in one plane</Caption>
    </g>
  )
}

function PiView() {
  const scale = 90
  const cx = W / 2
  const cy = 250
  const at = placed(FORMALDEHYDE.smiles, scale, cx, cy)
  const c = at(0)
  const o = at(1)
  const mid = { x: (c.x + o.x) / 2, y: (c.y + o.y) / 2 }
  const half = Math.hypot(o.x - c.x, o.y - c.y) / 2
  const lobeY = 46
  return (
    <g>
      <ellipse cx={mid.x} cy={cy - lobeY} rx={half + 34} ry={22} fill={ACCENT} fillOpacity={0.2} />
      <ellipse cx={mid.x} cy={cy + lobeY} rx={half + 34} ry={22} fill={ACCENT} fillOpacity={0.2} />
      {[c, o].flatMap((p) => [
        <ellipse key={`up-${p.x}`} cx={p.x} cy={p.y - lobeY} rx={13} ry={22} fill={ACCENT} fillOpacity={0.55} />,
        <ellipse key={`dn-${p.x}`} cx={p.x} cy={p.y + lobeY} rx={13} ry={22} fill={ACCENT} fillOpacity={0.55} />,
      ])}
      <Molecule smiles={FORMALDEHYDE.smiles} carbonyl={FORMALDEHYDE.carbonyl} scale={scale} x={cx} y={cy} />
      <Caption y={388} size={16} weight={600}>p orbitals overlap sideways</Caption>
      <Caption y={H - 56}>The overlap forms the π bond, above and below the plane</Caption>
      <Caption y={H - 28} fill={MUTED}>Oxygen keeps its two lone pairs</Caption>
    </g>
  )
}

function PolarisedView() {
  return (
    <g>
      <Molecule
        smiles={FORMALDEHYDE.smiles}
        carbonyl={FORMALDEHYDE.carbonyl}
        scale={84}
        x={W / 2}
        y={190}
        partialCharges={[
          { atom: 0, label: 'δ⁺' },
          { atom: 1, label: 'δ⁻' },
        ]}
      />
      <ResonanceSet
        contributors={[{ graph: parseSmiles(FORMALDEHYDE.smiles) }, { graph: parseSmiles(DIPOLAR_FORM.smiles) }]}
        scale={56}
        x={W / 2}
        y={430}
      />
      <Caption y={H - 56}>δ⁺ on the carbon, δ⁻ on the oxygen</Caption>
      <Caption y={H - 28} fill={MUTED}>Neutral and dipolar forms; the real molecule is a blend</Caption>
    </g>
  )
}

function AldehydeKetoneView() {
  const scale = 62
  const left = 150
  const right = 430
  const y = 230
  return (
    <g>
      <line x1={W / 2} y1={120} x2={W / 2} y2={340} stroke={MUTED} strokeOpacity={0.35} strokeWidth={1} />
      <Molecule smiles={ACETALDEHYDE.smiles} carbonyl={ACETALDEHYDE.carbonyl} scale={scale} x={left} y={y} />
      <Molecule smiles={ACETONE.smiles} carbonyl={ACETONE.carbonyl} scale={scale} x={right} y={y} />
      <Caption x={left} y={345} size={16} weight={600}>{unit8Name(ACETALDEHYDE.smiles)}</Caption>
      <Caption x={left} y={370} fill={MUTED}>aldehyde: one H on the C=O</Caption>
      <Caption x={right} y={345} size={16} weight={600}>{unit8Name(ACETONE.smiles)}</Caption>
      <Caption x={right} y={370} fill={MUTED}>ketone: two C groups; acetone</Caption>
      <Caption y={H - 56}>The C=O unit is the same planar shape in both</Caption>
      <Caption y={H - 28} fill={MUTED}>Only the groups on the carbonyl carbon change</Caption>
    </g>
  )
}

function ChainNameView() {
  const locants: SkeletalMark[] = [
    { atom: 4, label: 'C1' },
    { atom: 3, label: 'C2 · α' },
    { atom: 1, label: 'C3 · β' },
  ]
  return (
    <g>
      <Molecule
        smiles={CHLOROBUTANAL.smiles}
        carbonyl={CHLOROBUTANAL.carbonyl}
        scale={72}
        x={W / 2}
        y={240}
        locants={locants}
      />
      <Caption y={378} size={16} weight={600}>{unit8Name(CHLOROBUTANAL.smiles)}</Caption>
      <Caption y={404} fill={MUTED}>common name: β-chlorobutyraldehyde</Caption>
      <Caption y={H - 56}>The chain is numbered from the CHO carbon, which is C1</Caption>
      <Caption y={H - 28} fill={MUTED}>α is next to the CHO group; β carries the chlorine</Caption>
    </g>
  )
}

function RingsView() {
  const rows = [
    { y: 118, molecule: BENZALDEHYDE, note: 'IUPAC accepts the name benzaldehyde' },
    { y: 308, molecule: METHYLCYCLOHEXANECARBALDEHYDE, note: '-carbaldehyde: ring numbered from CHO' },
    { y: 498, molecule: ACETOPHENONE, note: 'common name acetophenone, a phenone' },
  ]
  return (
    <g>
      {rows.map((row, i) => (
        <g key={row.molecule.smiles}>
          {i > 0 && <line x1={20} y1={row.y - 96} x2={W - 20} y2={row.y - 96} stroke={MUTED} strokeOpacity={0.3} />}
          <Molecule smiles={row.molecule.smiles} carbonyl={row.molecule.carbonyl} scale={40} x={130} y={row.y} />
          <text x={262} y={row.y - 14} fontSize={16} fontWeight={600} fill={INK}>{unit8Name(row.molecule.smiles)}</text>
          <text x={262} y={row.y + 10} fontSize={14} fill={MUTED}>{subscripted(row.molecule.formula)}</text>
          <text x={262} y={row.y + 32} fontSize={14} fill={MUTED}>{row.note}</text>
        </g>
      ))}
    </g>
  )
}

const BEAT_VIEW: Record<CarbonylBeat, () => ReactNode> = {
  planar: PlanarView,
  'pi-overlap': PiView,
  polarised: PolarisedView,
  'aldehyde-ketone': AldehydeKetoneView,
  'chain-name': ChainNameView,
  rings: RingsView,
}

export function CarbonylScrolly({ step }: CarbonylScrollyProps) {
  const beat = beatAt(step)
  const View = BEAT_VIEW[beat]
  const number = CARBONYL_BEATS.indexOf(beat) + 1
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Carbonyl group, Step ${number} of ${CARBONYL_BEATS.length}`}
      data-step={number - 1}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
