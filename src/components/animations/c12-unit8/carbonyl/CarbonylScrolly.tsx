'use client'

import type { ReactNode } from 'react'
import { drawingFrame, elementColour, type SkeletalMark, SkeletalFormula } from '@/components/organic'
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

type Pt = { x: number; y: number }

/** Bond length of the methanal drawing in Steps 1 and 2, in viewBox units. */
const PLANAR_BOND = 200
/** Height of the molecular plane in Step 1 (and the centre line of Step 2). */
const PLANE_Y = 250
/** Gap between a bond end and an atom letter. */
const ATOM_GAP = 13

/**
 * Methanal, H₂C=O, drawn in full: C at (x0, y), O to its right on the same line, and both H atoms
 * at 120° to the C=O bond. The hydrogens are drawn, so the three σ bonds can be seen.
 */
function methanal(x0: number, y: number, bond: number) {
  const dx = bond / 2
  const dy = (bond * Math.sqrt(3)) / 2
  return {
    c: { x: x0, y },
    o: { x: x0 + bond, y },
    h1: { x: x0 - dx, y: y - dy },
    h2: { x: x0 - dx, y: y + dy },
  }
}
type Methanal = ReturnType<typeof methanal>

/** Centres a methanal drawing on X: it runs from the H atoms (x0 - bond/2) to O (x0 + bond). */
function methanalCentred(X: number, y: number, bond: number): Methanal {
  return methanal(X - bond / 4, y, bond)
}

/** The part of segment a→b that is left after `from` is cut off the start and `to` off the end. */
function between(a: Pt, b: Pt, from: number, to: number) {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  return { x1: a.x + ux * from, y1: a.y + uy * from, x2: b.x - ux * to, y2: b.y - uy * to }
}

/** The C–H bonds, and the C=O bond (doubled, or single in the dipolar form). */
function MethanalBonds({ m, doubleBond }: { m: Methanal; doubleBond: boolean }) {
  const hs = [between(m.c, m.h1, ATOM_GAP, ATOM_GAP), between(m.c, m.h2, ATOM_GAP, ATOM_GAP)]
  const co = between(m.c, m.o, ATOM_GAP, ATOM_GAP)
  const offsets = doubleBond ? [-5, 5] : [0]
  return (
    <g stroke={INK} strokeWidth={2} strokeLinecap="round">
      {hs.map((l, i) => (
        <line key={`ch-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {offsets.map((d) => (
        <line key={`co-${d}`} x1={co.x1} y1={co.y1 + d} x2={co.x2} y2={co.y2 + d} />
      ))}
    </g>
  )
}

/** The letters of methanal, with optional charges: ⊕ up and right of C, ⊖ up and right of O. */
function MethanalAtoms({ m, carbonCharge, oxygenCharge }: { m: Methanal; carbonCharge?: string; oxygenCharge?: string }) {
  return (
    <g fontSize={18} textAnchor="middle" dominantBaseline="central">
      <text x={m.c.x} y={m.c.y} fill={INK}>C</text>
      <text x={m.o.x} y={m.o.y} fill={elementColour('O')}>O</text>
      <text x={m.h1.x} y={m.h1.y} fill={INK}>H</text>
      <text x={m.h2.x} y={m.h2.y} fill={INK}>H</text>
      {carbonCharge && (
        <text x={m.c.x + 9} y={m.c.y - 12} fontSize={14} textAnchor="start" fill={INK}>{carbonCharge}</text>
      )}
      {oxygenCharge && (
        <text x={m.o.x + 9} y={m.o.y - 12} fontSize={14} textAnchor="start" fill={INK}>{oxygenCharge}</text>
      )}
    </g>
  )
}

/** One lone pair: two dots side by side, 16 units out from the atom in direction (ux, uy). */
function LonePair({ x, y, ux, uy }: { x: number; y: number; ux: number; uy: number }) {
  const px = -uy * 3
  const py = ux * 3
  return (
    <g fill={INK}>
      <circle cx={x + ux * 16 + px} cy={y + uy * 16 + py} r={2.2} />
      <circle cx={x + ux * 16 - px} cy={y + uy * 16 - py} r={2.2} />
    </g>
  )
}

/** Neutral oxygen has two lone pairs, to the right; the O⁻ of the dipolar form has three. */
function OxygenPairs({ o, kind }: { o: Pt; kind: 'neutral' | 'anion' }) {
  const dirs = kind === 'neutral' ? [[0.707, -0.707], [0.707, 0.707]] : [[0, -1], [0, 1], [1, 0]]
  return (
    <g>
      {dirs.map(([ux, uy]) => (
        <LonePair key={`${ux},${uy}`} x={o.x} y={o.y} ux={ux} uy={uy} />
      ))}
    </g>
  )
}

function PlanarView() {
  const m = methanalCentred(W / 2, PLANE_Y, PLANAR_BOND)
  const r = 30
  const arcStart = { x: m.c.x + r, y: m.c.y }
  const arcEnd = { x: m.c.x + r * Math.cos((-2 * Math.PI) / 3), y: m.c.y + r * Math.sin((-2 * Math.PI) / 3) }
  const label = { x: m.c.x + 31, y: m.c.y - 54 }
  return (
    <g>
      <ellipse cx={W / 2} cy={PLANE_Y} rx={270} ry={230} fill={MUTED} fillOpacity={0.08} />
      <CarbonylHalo p={m.c} />
      <MethanalBonds m={m} doubleBond />
      <MethanalAtoms m={m} />
      <OxygenPairs o={m.o} kind="neutral" />
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
      />
      <Caption x={label.x} y={label.y + 5} size={14}>≈ 120°</Caption>
      <Caption y={500} size={16} weight={600}>{unit8Name(FORMALDEHYDE.smiles)} (formaldehyde)</Caption>
      <Caption y={H - 56}>Three σ bonds leave the carbonyl carbon, at about 120°</Caption>
      <Caption y={H - 28} fill={MUTED}>All four atoms lie in one plane</Caption>
    </g>
  )
}

function PiView() {
  const m = methanalCentred(W / 2, PLANE_Y, PLANAR_BOND)
  const mid = { x: (m.c.x + m.o.x) / 2, y: PLANE_Y }
  const half = PLANAR_BOND / 2
  const lobeY = 46
  return (
    <g>
      <ellipse cx={mid.x} cy={PLANE_Y - lobeY} rx={half + 20} ry={22} fill={ACCENT} fillOpacity={0.2} />
      <ellipse cx={mid.x} cy={PLANE_Y + lobeY} rx={half + 20} ry={22} fill={ACCENT} fillOpacity={0.2} />
      {[m.c, m.o].flatMap((p) => [
        <ellipse key={`up-${p.x}`} cx={p.x} cy={p.y - lobeY} rx={13} ry={22} fill={ACCENT} fillOpacity={0.55} />,
        <ellipse key={`dn-${p.x}`} cx={p.x} cy={p.y + lobeY} rx={13} ry={22} fill={ACCENT} fillOpacity={0.55} />,
      ])}
      <CarbonylHalo p={m.c} />
      <MethanalBonds m={m} doubleBond />
      <MethanalAtoms m={m} />
      <OxygenPairs o={m.o} kind="neutral" />
      <Caption y={500} size={16} weight={600}>p orbitals overlap sideways</Caption>
      <Caption y={H - 56}>The overlap forms the π bond, above and below the plane</Caption>
      <Caption y={H - 28} fill={MUTED}>Oxygen keeps its two lone pairs</Caption>
    </g>
  )
}

function PolarisedView() {
  const top = methanalCentred(W / 2, 150, 120)
  const left = methanalCentred(180, 400, 84)
  const right = methanalCentred(400, 400, 84)
  return (
    <g>
      <CarbonylHalo p={top.c} />
      <MethanalBonds m={top} doubleBond />
      <MethanalAtoms m={top} />
      <OxygenPairs o={top.o} kind="neutral" />
      <text x={top.c.x + 12} y={top.c.y + 22} fontSize={14} fill={INK}>δ⁺</text>
      <text x={top.o.x + 24} y={top.o.y + 5} fontSize={14} fill={INK}>δ⁻</text>

      <CarbonylHalo p={left.c} />
      <MethanalBonds m={left} doubleBond />
      <MethanalAtoms m={left} />
      <OxygenPairs o={left.o} kind="neutral" />
      <Caption x={180} y={500} size={14} fill={MUTED}>neutral form</Caption>

      <line x1={268} y1={400} x2={312} y2={400} stroke={INK} strokeWidth={1.5} />
      <polygon points="262,400 270,396 270,404" fill={INK} />
      <polygon points="318,400 310,396 310,404" fill={INK} />

      <CarbonylHalo p={right.c} />
      <MethanalBonds m={right} doubleBond={false} />
      <MethanalAtoms m={right} carbonCharge="⊕" oxygenCharge="⊖" />
      <OxygenPairs o={right.o} kind="anion" />
      <Caption x={400} y={500} size={14} fill={MUTED}>dipolar form</Caption>

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
