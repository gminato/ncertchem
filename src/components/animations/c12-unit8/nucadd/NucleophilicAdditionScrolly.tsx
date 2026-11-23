'use client'

import type { ReactNode } from 'react'
import { bondAnchor, CurvedArrow, drawingFrame, lonePairPoint, outwardAngle, type Point, SkeletalFormula } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ADDUCT_TEXT,
  ALKOXIDE_O,
  CYANIDE_TEXT,
  CYANOHYDRIN_SMILES,
  ETHANAL_CARBONYL_C,
  ETHANAL_O,
  ETHANAL_SMILES,
  NUC_ADD_BEATS,
  type NucAddBeat,
  PROPANONE_CARBONYL_C,
  PROPANONE_METHYLS,
  PROPANONE_SMILES,
  TETRAHEDRAL_ALKOXIDE_SMILES,
} from './nucleophilic-addition-steps'

export interface NucleophilicAdditionScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Unused: every Step is a cut between fixed target states, so there is no tween to switch off. */
  reducedMotion?: boolean
}

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
const W = 580
const H = 480
const SCALE = 72
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const NUCLEOPHILE = ROLE_TONE.nucleophile
const ARROW_GAP = 10

/** Absolute position of atom `i` of a SMILES drawn with its centre at (cx, cy). */
function atomAt(smiles: string, scale: number, cx: number, cy: number, i: number): Point {
  const f = drawingFrame(parseSmiles(smiles), scale)
  return { x: cx + f.points[i].x, y: cy + f.points[i].y }
}

/** A point a little outside atom `i`, along the direction its bonds leave free: the lone pair. */
function lonePairAt(smiles: string, scale: number, cx: number, cy: number, i: number, radius = 0.5 * scale): Point {
  const f = drawingFrame(parseSmiles(smiles), scale)
  const th = outwardAngle(f.points, f.adj, i)
  const p = lonePairPoint(f.points[i], th, radius)
  return { x: cx + p.x, y: cy + p.y }
}

/** Moves `to` back along the line from `from` by `gap` pixels, so a line stops short of a label. */
function stopShort(from: Point, to: Point, gap: number): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy) || 1
  return { x: to.x - (dx / d) * gap, y: to.y - (dy / d) * gap }
}

function Label({ x, y, children, fill = INK, size = 18, anchor = 'middle' }: { x: number; y: number; children: ReactNode; fill?: string; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill}>
      {children}
    </text>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <Label x={W / 2} y={H - 22} fill={MUTED} size={18}>{children}</Label>
}

/** Dashed line for a nucleophile still on its way in. */
function Approach({ from, to }: { from: Point; to: Point }) {
  const end = stopShort(from, to, 16)
  return <line x1={from.x} y1={from.y} x2={end.x} y2={end.y} stroke={NUCLEOPHILE} strokeWidth={2} strokeDasharray="5 5" />
}

/** Short straight arrow for electron release: a line with a full head at `to`. */
function PushArrow({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy) || 1
  const ux = dx / d
  const uy = dy / d
  const bx = to.x - ux * 11
  const by = to.y - uy * 11
  const head = `${to.x},${to.y} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}`
  return (
    <g stroke="var(--e-arrow)" fill="var(--e-arrow)">
      <line x1={from.x} y1={from.y} x2={bx} y2={by} strokeWidth={2} />
      <polygon points={head} stroke="none" />
    </g>
  )
}

/** Reaction arrow drawn with a plain line, one head or two. */
function ReactionArrow({ x1, y1, x2, y2, double = false }: { x1: number; y1: number; x2: number; y2: number; double?: boolean }) {
  const h = (tx: number, ty: number, dir: 1 | -1) => {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1
    const ux = ((x2 - x1) / d) * dir
    const uy = ((y2 - y1) / d) * dir
    const bx = tx - ux * 10
    const by = ty - uy * 10
    return `${tx},${ty} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}`
  }
  return (
    <g stroke={INK} fill={INK}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} />
      <polygon points={h(x2, y2, 1)} stroke="none" />
      {double ? <polygon points={h(x1, y1, -1)} stroke="none" /> : null}
    </g>
  )
}

function Sketch({ smiles, cx, cy, scale = SCALE, partial, lonePairs = true }: { smiles: string; cx: number; cy: number; scale?: number; partial?: { atom: number; label: string }[]; lonePairs?: boolean }) {
  return (
    <SkeletalFormula
      graph={parseSmiles(smiles)}
      x={cx}
      y={cy}
      scale={scale}
      showLonePairs={lonePairs}
      partialCharges={partial}
    />
  )
}

/** Step 1: ethanal in plane, cyanide ion approaching from above. */
function Approaching() {
  const c = atomAt(ETHANAL_SMILES, SCALE, 250, 270, ETHANAL_CARBONYL_C)
  const from = { x: 420, y: 138 }
  return (
    <g>
      <Sketch smiles={ETHANAL_SMILES} cx={250} cy={270} partial={[{ atom: ETHANAL_CARBONYL_C, label: 'δ+' }, { atom: ETHANAL_O, label: 'δ−' }]} />
      <Label x={420} y={120} fill={NUCLEOPHILE} size={24}>{CYANIDE_TEXT}</Label>
      <Approach from={from} to={c} />
      <Caption>Cyanide comes in above the plane</Caption>
    </g>
  )
}

/** Step 2: the two curved arrows of the addition. */
function CurvedPair() {
  const c = atomAt(ETHANAL_SMILES, SCALE, 250, 270, ETHANAL_CARBONYL_C)
  const o = atomAt(ETHANAL_SMILES, SCALE, 250, 270, ETHANAL_O)
  const pi = bondAnchor(c, o)
  const lp = { x: 432, y: 136 }
  return (
    <g>
      <Sketch smiles={ETHANAL_SMILES} cx={250} cy={270} partial={[{ atom: ETHANAL_CARBONYL_C, label: 'δ+' }, { atom: ETHANAL_O, label: 'δ−' }]} />
      <Label x={420} y={120} fill={NUCLEOPHILE} size={24}>{CYANIDE_TEXT}</Label>
      <CurvedArrow from={lp} to={c} bend={-0.35} gap={ARROW_GAP} />
      <CurvedArrow from={pi} to={o} bend={0.4} gap={ARROW_GAP} />
      <Caption>Two curved arrows, two electron pairs</Caption>
    </g>
  )
}

/** Step 3: the tetrahedral alkoxide, the carbon now sp³. */
function Alkoxide() {
  return (
    <g>
      <Sketch smiles={TETRAHEDRAL_ALKOXIDE_SMILES} cx={250} cy={270} />
      <Caption>sp³ carbon: four single bonds, O⁻ on the carbon</Caption>
    </g>
  )
}

/** Step 4: O⁻ takes the proton from H–A; A⁻ leaves; the neutral product forms. */
function Protonation() {
  const alk = { cx: 170, cy: 220, scale: 64 }
  const lp = lonePairAt(TETRAHEDRAL_ALKOXIDE_SMILES, alk.scale, alk.cx, alk.cy, ALKOXIDE_O, 0.42 * alk.scale)
  const h = { x: 380, y: 112 }
  const a = { x: 500, y: 112 }
  return (
    <g>
      <Sketch smiles={TETRAHEDRAL_ALKOXIDE_SMILES} cx={alk.cx} cy={alk.cy} scale={alk.scale} />
      <Label x={h.x} y={h.y + 6} size={22}>H</Label>
      <line x1={h.x + 14} y1={h.y} x2={a.x - 14} y2={a.y} stroke={INK} strokeWidth={2} />
      <Label x={a.x} y={a.y + 6} size={22}>A</Label>
      <CurvedArrow from={lp} to={{ x: h.x - 6, y: h.y - 14 }} bend={0.3} gap={6} />
      <CurvedArrow from={bondAnchor({ x: h.x + 14, y: h.y }, { x: a.x - 14, y: a.y })} to={{ x: a.x - 8, y: a.y - 12 }} bend={0.6} gap={2} />
      <Label x={a.x + 4} y={a.y - 40} size={18}>A⁻</Label>
      <ReactionArrow x1={230} y1={350} x2={330} y2={350} />
      <Sketch smiles={CYANOHYDRIN_SMILES} cx={440} cy={350} scale={58} />
      <Caption>Neutral product: CH₃CH(OH)CN</Caption>
    </g>
  )
}

/** Step 5: ethanal (one CH₃) against propan-2-one (two CH₃) with the approach crowded. */
function AldehydeVsKetone() {
  const eC = atomAt(ETHANAL_SMILES, 64, 150, 250, ETHANAL_CARBONYL_C)
  const eMe = atomAt(ETHANAL_SMILES, 64, 150, 250, 0)
  const kC = atomAt(PROPANONE_SMILES, 64, 430, 250, PROPANONE_CARBONYL_C)
  const kM = PROPANONE_METHYLS.map((i) => atomAt(PROPANONE_SMILES, 64, 430, 250, i))
  return (
    <g>
      <Sketch smiles={ETHANAL_SMILES} cx={150} cy={250} scale={64} />
      <Sketch smiles={PROPANONE_SMILES} cx={430} cy={250} scale={64} />
      <Label x={150} y={384} fill={NUCLEOPHILE} size={22}>{CYANIDE_TEXT}</Label>
      <Label x={430} y={384} fill={NUCLEOPHILE} size={22}>{CYANIDE_TEXT}</Label>
      <Approach from={{ x: 150, y: 368 }} to={eC} />
      <Approach from={{ x: 430, y: 368 }} to={kC} />
      <PushArrow from={stopShort(eC, eMe, 16)} to={stopShort(eMe, eC, 16)} />
      {kM.map((m, i) => (
        <PushArrow key={i} from={stopShort(kC, m, 16)} to={stopShort(m, kC, 16)} />
      ))}
      <Label x={430} y={424} fill={MUTED} size={18}>crowded</Label>
      <Label x={150} y={424} fill={MUTED} size={18}>one CH₃, one H</Label>
      <Caption>Two CH₃ groups block the approach to the ketone</Caption>
    </g>
  )
}

/** Step 6: the two named additions, one above the other. */
function NamedAdditions() {
  return (
    <g>
      <Sketch smiles={ETHANAL_SMILES} cx={110} cy={130} scale={46} />
      <ReactionArrow x1={180} y1={130} x2={360} y2={130} />
      <Label x={270} y={112} size={18}>HCN, base</Label>
      <Sketch smiles={CYANOHYDRIN_SMILES} cx={440} cy={130} scale={46} />
      <Sketch smiles={ETHANAL_SMILES} cx={110} cy={330} scale={46} />
      <ReactionArrow x1={180} y1={330} x2={330} y2={330} double />
      <Label x={255} y={312} size={18}>NaHSO₃</Label>
      <Label x={456} y={336} size={18}>{ADDUCT_TEXT}</Label>
      <Caption>Nucleophile first, then a proton</Caption>
    </g>
  )
}

const VIEWS: Record<NucAddBeat, () => ReactNode> = {
  approach: Approaching,
  'curved-arrows': CurvedPair,
  alkoxide: Alkoxide,
  protonation: Protonation,
  'aldehyde-vs-ketone': AldehydeVsKetone,
  'named-additions': NamedAdditions,
}

export function NucleophilicAdditionScrolly({ step }: NucleophilicAdditionScrollyProps) {
  const index = Math.min(NUC_ADD_BEATS.length - 1, Math.max(0, Math.round(step)))
  const beat = NUC_ADD_BEATS[index]
  const View = VIEWS[beat]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Nucleophilic addition to the carbonyl group, Step ${index + 1} of ${NUC_ADD_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
