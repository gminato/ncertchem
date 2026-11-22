'use client'

import React from 'react'
import { CurvedArrow, SkeletalFormula, skeletalFrame } from '@/components/organic'
import { adjacency } from '@/components/organic/layout'
import type { Frame } from '@/components/organic/frame'
import { HALOGEN_TONE, ROLE_TONE } from '@/components/vocab/organic6'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  BROMOETHANE_SMILES,
  BUTANE_SMILES,
  ETHANE_SMILES,
  FACTS,
  SUBSTRATE_SMILES,
  substrateSites,
  zaitsevRows,
  type ZaitsevRow,
} from './elimination-steps'

export interface EliminationAndMetalsProps {
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 470
const FONT = 'var(--font-sans)'
const MUTED = 'var(--fg-muted)'
const INK = 'var(--fg)'
const BOND = 'var(--bond)'
const MG = 'var(--metal-mg)'
const NA = 'var(--metal-generic)'
const DELTA_PLUS = 'var(--delta-plus)'
const DELTA_MINUS = 'var(--delta-minus)'

interface Pt {
  x: number
  y: number
}

/** A skeletal drawing placed on the panel, with the geometry the overlays need. */
interface Mol {
  g: MolGraph
  scale: number
  x: number
  y: number
  frame: Frame
  adj: number[][]
}

function mol(g: MolGraph, scale: number, x: number, y: number): Mol {
  return { g, scale, x, y, frame: skeletalFrame(g, scale), adj: adjacency(g) }
}

/** Absolute panel position of an atom. */
function at(m: Mol, i: number): Pt {
  return { x: m.x + m.frame.points[i].x, y: m.y + m.frame.points[i].y }
}

/** A point d units away from atom i, pointing away from its neighbours. */
function out(m: Mol, i: number, d: number): Pt {
  const p = at(m, i)
  const nb = m.adj[i]
  let sx = 0
  let sy = 0
  for (const n of nb) {
    const q = at(m, n)
    sx += q.x - p.x
    sy += q.y - p.y
  }
  const len = Math.hypot(sx, sy) || 1
  const ux = nb.length ? -sx / len : 0
  const uy = nb.length ? -sy / len : -1
  return { x: p.x + ux * d, y: p.y + uy * d }
}

function mid(a: Pt, b: Pt, t = 0.5): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={W / 2} y={40} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill={INK}>
      {children}
    </text>
  )
}

function Label({
  x,
  y,
  children,
  size = 16,
  fill = INK,
  anchor = 'middle',
  weight = 500,
}: {
  x: number
  y: number
  children: React.ReactNode
  size?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fontFamily={FONT} fill={fill}>
      {children}
    </text>
  )
}

function Ring({ p, r, tone }: { p: Pt; r: number; tone: string }) {
  return <circle cx={p.x} cy={p.y} r={r} fill={tone} fillOpacity={0.16} stroke={tone} strokeWidth={2.5} />
}

function Legend({ items }: { items: { tone: string; text: string }[] }) {
  return (
    <g>
      {items.map((it, i) => {
        const y = 404 + i * 26
        return (
          <g key={it.text}>
            <circle cx={70} cy={y - 5} r={8} fill={it.tone} fillOpacity={0.5} stroke={it.tone} strokeWidth={2} />
            <Label x={90} y={y} anchor="start">
              {it.text}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/* ---------------------------------------------------------------- Step 1: name the carbons */

function StepNameCarbons() {
  const g = parseSmiles(SUBSTRATE_SMILES)
  const s = substrateSites(g)
  const m = mol(g, 96, 300, 230)
  return (
    <g>
      <Title>2-bromopentane</Title>
      <SkeletalFormula
        graph={g}
        scale={96}
        x={300}
        y={230}
        locants={[
          { atom: s.c1, label: 'C1' },
          { atom: s.c3, label: 'C3' },
          { atom: s.c4, label: 'C4' },
          { atom: s.c5, label: 'C5' },
          { atom: s.alpha, label: 'C2' },
        ]}
      />
      <Ring p={at(m, s.alpha)} r={24} tone={HALOGEN_TONE.Br} />
      <Ring p={at(m, s.c1)} r={24} tone={ROLE_TONE.betaHydrogen} />
      <Ring p={at(m, s.c3)} r={24} tone={ROLE_TONE.betaHydrogen} />
      <Legend
        items={[
          { tone: HALOGEN_TONE.Br, text: 'α-carbon: C2, which bears the bromine' },
          { tone: ROLE_TONE.betaHydrogen, text: 'β-carbons: C1 (3 H) and C3 (2 H)' },
          { tone: MUTED, text: 'C4 and C5: no hydrogen on them can leave' },
        ]}
      />
    </g>
  )
}

/* ---------------------------------------------------------------- Step 2: the base takes a proton */

function StepBase() {
  const g = parseSmiles(SUBSTRATE_SMILES)
  const s = substrateSites(g)
  const m = mol(g, 84, 290, 240)
  const alpha = at(m, s.alpha)
  const c3 = at(m, s.c3)
  const br = at(m, s.bromine)
  const cc = mid(alpha, c3)
  // The π bond forming between C2 and C3 is drawn as a second line on the top side of the C2–C3 bond.
  const dx = c3.x - alpha.x
  const dy = c3.y - alpha.y
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const off = 9
  const h = out(m, s.c3, 42)
  const h0 = out(m, s.c3, 16)
  return (
    <g>
      <Title>Alcoholic KOH removes H and Br</Title>
      <Label x={W / 2} y={84} fill={MUTED} size={16}>
        base: KOH dissolved in alcohol
      </Label>
      <SkeletalFormula graph={g} scale={84} x={290} y={240} />
      <line
        x1={alpha.x + nx * off}
        y1={alpha.y + ny * off}
        x2={c3.x + nx * off}
        y2={c3.y + ny * off}
        stroke={ROLE_TONE.betaHydrogen}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
      <Label x={h.x} y={h.y + 6} size={18} fill={INK} weight={600}>
        H
      </Label>
      <CurvedArrow from={h0} to={{ x: cc.x + nx * 14, y: cc.y + ny * 14 }} bend={0.35} />
      <CurvedArrow from={mid(alpha, br, 0.55)} to={out(m, s.bromine, 38)} bend={-0.35} kind="pair" />
      <Label x={out(m, s.bromine, 60).x} y={out(m, s.bromine, 60).y} size={18} fill={HALOGEN_TONE.Br} weight={600} anchor="start">
        Br⁻
      </Label>
      <Label x={W / 2} y={392} size={16} fill={INK}>
        The base takes the β-H; the π bond forms as Br⁻ leaves.
      </Label>
      <Label x={W / 2} y={418} size={16} fill={MUTED}>
        By-products: KBr and H₂O. The new double bond is C2=C3.
      </Label>
    </g>
  )
}

/* ---------------------------------------------------------------- Step 3: two alkenes, one winner */

function StepZaitsev({ rows }: { rows: ZaitsevRow[] }) {
  const cols = [150, 430]
  const barWidth = 230
  return (
    <g>
      <Title>Two alkenes, one winner</Title>
      {rows.slice(0, 2).map((row, i) => {
        const cx = cols[i]
        const g = parseSmiles(row.smiles)
        const pct = row.percent ?? 0
        return (
          <g key={row.smiles}>
            <SkeletalFormula graph={g} scale={54} x={cx} y={196} />
            <Label x={cx} y={262} size={18} weight={600}>
              {row.name}
            </Label>
            <Label x={cx} y={290} fill={MUTED}>
              {`${row.alkylGroups} alkyl group${row.alkylGroups === 1 ? '' : 's'} on C=C`}
            </Label>
            <rect x={cx - barWidth / 2} y={322} width={barWidth} height={26} rx={6} fill={INK} fillOpacity={0.08} />
            <rect
              x={cx - barWidth / 2}
              y={322}
              width={(barWidth * pct) / 100}
              height={26}
              rx={6}
              fill={row.zaitsev ? ROLE_TONE.betaHydrogen : MUTED}
              fillOpacity={row.zaitsev ? 0.75 : 0.5}
            />
            <Label x={cx} y={378} size={18} weight={600}>
              {`${pct} %`}
            </Label>
            <Label x={cx} y={402} size={15} fill={MUTED}>
              {row.zaitsev ? 'Zaitsev product' : 'minor product'}
            </Label>
          </g>
        )
      })}
      <Label x={W / 2} y={446} fill={MUTED} size={15}>
        Zaitsev rule: the alkene with more alkyl groups on the C=C is major.
      </Label>
    </g>
  )
}

/* ---------------------------------------------------------------- Step 4: magnesium steps in */

function StepMagnesium() {
  const g = parseSmiles(BROMOETHANE_SMILES)
  const c = 1
  const br = 2
  const m = mol(g, 78, 210, 250)
  const cPt = at(m, c)
  const brPt = at(m, br)
  const mg = out(m, c, 112)
  return (
    <g>
      <Title>Magnesium steps in</Title>
      <SkeletalFormula graph={g} scale={78} x={210} y={250} />
      <line x1={cPt.x} y1={cPt.y} x2={brPt.x} y2={brPt.y} stroke={MUTED} strokeWidth={3} strokeDasharray="7 6" opacity={0.6} />
      <line x1={cPt.x} y1={cPt.y} x2={mg.x} y2={mg.y} stroke={BOND} strokeWidth={3} strokeLinecap="round" />
      <line x1={mg.x} y1={mg.y} x2={brPt.x} y2={brPt.y} stroke={MG} strokeWidth={2.5} strokeDasharray="3 5" strokeLinecap="round" />
      <circle cx={mg.x} cy={mg.y} r={24} fill={MG} fillOpacity={0.2} stroke={MG} strokeWidth={2} />
      <Label x={mg.x} y={mg.y + 6} size={17} weight={600}>
        Mg
      </Label>
      <Label x={mg.x + 40} y={mg.y - 14} size={18} fill={DELTA_PLUS} weight={600}>
        δ⁺
      </Label>
      <Label x={cPt.x - 40} y={cPt.y + 44} size={18} fill={DELTA_MINUS} weight={600}>
        δ⁻
      </Label>
      <Label x={brPt.x + 2} y={brPt.y + 44} size={15} fill={MUTED}>
        Mg–Br ion pair
      </Label>
      <Label x={W / 2} y={392} size={18} weight={600}>
        CH₃CH₂MgBr: a Grignard reagent
      </Label>
      <Label x={W / 2} y={420} size={16} fill={MUTED}>
        C–Br gives way to C–Mg. The carbon is δ⁻, the magnesium δ⁺.
      </Label>
    </g>
  )
}

/* ---------------------------------------------------------------- Step 5: water undoes it */

function StepWater() {
  const ethyl = parseSmiles(ETHANE_SMILES)
  const e = mol(ethyl, 66, 170, 190)
  const c = at(e, 1)
  const mg = out(e, 1, 110)
  const br = { x: mg.x + 74, y: mg.y }
  const ethaneName = FACTS.ethane()
  return (
    <g>
      <Title>Water undoes it</Title>
      <SkeletalFormula graph={ethyl} scale={66} x={170} y={190} />
      <line x1={c.x} y1={c.y} x2={mg.x} y2={mg.y} stroke={BOND} strokeWidth={3} strokeLinecap="round" />
      <circle cx={mg.x} cy={mg.y} r={24} fill={MG} fillOpacity={0.2} stroke={MG} strokeWidth={2} />
      <Label x={mg.x} y={mg.y + 6} size={17} weight={600}>
        Mg
      </Label>
      <line x1={mg.x + 26} y1={mg.y} x2={br.x - 14} y2={br.y} stroke={MG} strokeWidth={2.5} strokeDasharray="3 5" strokeLinecap="round" />
      <Label x={br.x} y={br.y + 6} size={17} fill={HALOGEN_TONE.Br} weight={600}>
        Br
      </Label>
      <Label x={170} y={108} size={18} weight={600}>
        CH₃CH₂MgBr
      </Label>
      <circle cx={450} cy={150} r={30} fill={ROLE_TONE.base} fillOpacity={0.2} stroke={ROLE_TONE.base} strokeWidth={2} />
      <Label x={450} y={156} size={18} weight={600}>
        H₂O
      </Label>
      <CurvedArrow from={{ x: 420, y: 162 }} to={{ x: c.x + 4, y: c.y - 14 }} bend={0.3} />
      <SkeletalFormula graph={parseSmiles(ETHANE_SMILES)} scale={66} x={170} y={330} />
      <Label x={170} y={404} size={18} weight={600}>
        {`${ethaneName.name} (${formulaUnicode(ethaneName.formula)})`}
      </Label>
      <Label x={450} y={330} size={18} weight={600}>
        Mg(OH)Br
      </Label>
      <Label x={450} y={356} size={15} fill={MUTED}>
        left behind
      </Label>
      <Label x={W / 2} y={440} size={18} fill={ROLE_TONE.base} weight={600}>
        Keep it dry, or the reagent never reaches the next step.
      </Label>
    </g>
  )
}

/* ---------------------------------------------------------------- Step 6: two halves join */

function StepWurtz() {
  const bromoethane = parseSmiles(BROMOETHANE_SMILES)
  const butane = parseSmiles(BUTANE_SMILES)
  const butaneName = FACTS.butane()
  return (
    <g>
      <Title>Two halves join</Title>
      <SkeletalFormula graph={bromoethane} scale={52} x={150} y={150} />
      <SkeletalFormula graph={bromoethane} scale={52} x={430} y={150} />
      <Label x={W / 2} y={158} size={24} weight={600}>
        +
      </Label>
      <Label x={150} y={222} size={18} fill={NA} weight={600}>
        2 Na
      </Label>
      <Label x={430} y={222} size={18} fill={NA} weight={600}>
        2 Na
      </Label>
      <line x1={290} y1={236} x2={290} y2={300} stroke={MUTED} strokeWidth={2.5} />
      <polygon points="282,296 298,296 290,308" fill={MUTED} />
      <SkeletalFormula graph={butane} scale={56} x={290} y={352} />
      <Label x={W / 2} y={414} size={18} weight={600}>
        {`${butaneName.name} (${formulaUnicode(butaneName.formula)}) + 2 NaBr`}
      </Label>
      <Label x={W / 2} y={440} fill={MUTED} size={16}>
        Four carbons in the product: twice the two in each halide.
      </Label>
    </g>
  )
}

const STEP_LABELS = [
  'name the carbons',
  'base takes a proton',
  'two alkenes',
  'magnesium steps in',
  'water undoes it',
  'two halves join',
] as const

export function EliminationAndMetals({ step }: EliminationAndMetalsProps) {
  const rows = zaitsevRows()
  const k = Math.max(0, Math.min(STEP_LABELS.length - 1, step))
  let scene: React.ReactNode
  switch (k) {
    case 0:
      scene = <StepNameCarbons />
      break
    case 1:
      scene = <StepBase />
      break
    case 2:
      scene = <StepZaitsev rows={rows} />
      break
    case 3:
      scene = <StepMagnesium />
      break
    case 4:
      scene = <StepWater />
      break
    default:
      scene = <StepWurtz />
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={STEP_LABELS[k]} style={{ display: 'block' }}>
      {scene}
    </svg>
  )
}
