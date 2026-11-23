'use client'

import type { ReactNode } from 'react'
import { type Frame, SkeletalFormula, skeletalFrame } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  CUT_BOND,
  HALOFORM_METHYL,
  REACTING_ATOM,
  REDOX_BEATS,
  REDOX_FORMULA,
  REDOX_NAME,
  REDOX_SMILES,
  type RedoxBeat,
  type RedoxSmilesKey,
  redoxGraph,
} from './redox-steps'

export interface CarbonylRedoxScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
const W = 580
const H = 560
const SCALE = 40
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SHADE = 'var(--highlight)'
const SILVER = 'var(--fg-muted)'
const BLUE_LIQUID = 'color-mix(in srgb, var(--accent) 28%, transparent)'
const CLEAR_LIQUID = 'color-mix(in srgb, var(--fg-muted) 8%, transparent)'
const BRICK = 'color-mix(in srgb, var(--delta-plus) 70%, var(--ox))'

const GRAPH = {} as Record<RedoxSmilesKey, MolGraph>
const FRAME = {} as Record<RedoxSmilesKey, Frame>
for (const key of Object.keys(REDOX_SMILES) as RedoxSmilesKey[]) {
  GRAPH[key] = redoxGraph(key)
  FRAME[key] = skeletalFrame(GRAPH[key], SCALE)
}

interface Pt {
  x: number
  y: number
}

/** Screen point of atom i when the drawing is centred on (x, y). */
function at(key: RedoxSmilesKey, x: number, y: number, i: number): Pt {
  const p = FRAME[key].points[i]
  return { x: x + p.x, y: y + p.y }
}

function bondIndex(key: RedoxSmilesKey, a: number, b: number): number {
  return GRAPH[key].bonds.findIndex((bd) => (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a))
}

/** Subscript digits for a plain formula such as C4H8O. */
function sub(formula: string): string {
  return formula.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])
}

function Mol({
  k,
  x,
  y,
  shade,
  bonds = [],
  dim = false,
}: {
  k: RedoxSmilesKey
  x: number
  y: number
  shade?: number[]
  bonds?: number[]
  dim?: boolean
}) {
  const atom = REACTING_ATOM[k]
  const hl = shade ?? (atom === undefined ? [] : [atom])
  return (
    <g opacity={dim ? 0.45 : 1}>
      <SkeletalFormula graph={GRAPH[k]} scale={SCALE} x={x} y={y} highlightAtoms={hl} highlightBonds={bonds} />
    </g>
  )
}

/** The H on a carbonyl carbon, placed on the side away from its two neighbours. */
function CarbonylH({ k, x, y, c, n1, n2 }: { k: RedoxSmilesKey; x: number; y: number; c: number; n1: number; n2: number }) {
  const p = at(k, x, y, c)
  const a = at(k, x, y, n1)
  const b = at(k, x, y, n2)
  const ox = p.x - (a.x + b.x) / 2
  const oy = p.y - (a.y + b.y) / 2
  const len = Math.hypot(ox, oy) || 1
  const hx = p.x + (ox / len) * 24
  const hy = p.y + (oy / len) * 24
  return (
    <text x={hx} y={hy + 5} textAnchor="middle" fontSize={15} fill={INK}>
      H
    </text>
  )
}

/** A short bar across a bond, marking where it is cut. */
function CutMark({ k, x, y, a, b }: { k: RedoxSmilesKey; x: number; y: number; a: number; b: number }) {
  const p = at(k, x, y, a)
  const q = at(k, x, y, b)
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
  const ux = (q.x - p.x) / len
  const uy = (q.y - p.y) / len
  const h = 10
  return (
    <line
      x1={mx + uy * h}
      y1={my - ux * h}
      x2={mx - uy * h}
      y2={my + ux * h}
      stroke="var(--delta-plus)"
      strokeWidth={3}
      strokeLinecap="round"
    />
  )
}

function Arrow({ x1, y1, x2, y2, label, lx, ly }: { x1: number; y1: number; x2: number; y2: number; label?: string; lx: number; ly: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={MUTED} strokeWidth={2.2} markerEnd="url(#redox-head)" />
      {label ? (
        <text x={lx} y={ly} fontSize={15} fill={INK}>
          {label}
        </text>
      ) : null}
    </g>
  )
}

/** Name and formula under or beside a molecule. (x, y) is the baseline of the name. */
function Name({ x, y, k, anchor = 'middle', fill = INK }: { x: number; y: number; k: RedoxSmilesKey; anchor?: 'start' | 'middle'; fill?: string }) {
  const name = REDOX_NAME[k]
  const formula = k === 'propanoate' ? 'C₃H₅NaO₂' : sub(REDOX_FORMULA[k])
  return (
    <g>
      <text x={x} y={y} textAnchor={anchor} fontSize={16} fill={fill}>
        {name ?? 'sodium propanoate'}
      </text>
      <text x={x} y={y + 20} textAnchor={anchor} fontSize={14} fill={MUTED}>
        {formula}
      </text>
    </g>
  )
}

function Caption({ x, y, children, anchor = 'middle' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={14} fill={MUTED}>
      {children}
    </text>
  )
}

function ShadeKey({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x} y={y - 11} width={14} height={14} rx={3} fill={SHADE} stroke={MUTED} strokeWidth={0.6} />
      <text x={x + 22} y={y} fontSize={14} fill={MUTED}>
        {text}
      </text>
    </g>
  )
}

/** A test tube: glass outline, liquid, and optional silver mirror or precipitate. */
function Tube({ x, top, bottom, liquid, mirror = false, precipitate }: { x: number; top: number; bottom: number; liquid: string; mirror?: boolean; precipitate?: string }) {
  const r = 15
  const liqTop = top + 36
  const glass = `M${x - r} ${top} V${bottom - r} A${r} ${r} 0 0 0 ${x + r} ${bottom - r} V${top}`
  const fill = `M${x - r} ${liqTop} V${bottom - r} A${r} ${r} 0 0 0 ${x + r} ${bottom - r} V${liqTop} Z`
  return (
    <g>
      <path d={fill} fill={liquid} />
      {mirror ? (
        <path
          d={`M${x - 12} ${bottom - 80} Q${x - 13} ${bottom - 24} ${x} ${bottom - 14} Q${x + 13} ${bottom - 24} ${x + 12} ${bottom - 80}`}
          fill="none"
          stroke={SILVER}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ) : null}
      {precipitate ? <ellipse cx={x} cy={bottom - 17} rx={14} ry={7} fill={precipitate} /> : null}
      <path d={glass} fill="none" stroke={MUTED} strokeWidth={2} />
    </g>
  )
}

function ReductionStrip() {
  return (
    <g>
      <Mol k="butanal" x={170} y={110} />
      <Name x={300} y={115} k="butanal" anchor="start" />
      <Arrow x1={170} y1={150} x2={170} y2={262} lx={185} ly={210} label="NaBH₄ or LiAlH₄, or H₂ with a catalyst" />
      <Mol k="butanol" x={170} y={300} />
      <Name x={300} y={305} k="butanol" anchor="start" />
      <Arrow x1={170} y1={340} x2={170} y2={452} lx={185} ly={400} label="Clemmensen or Wolff–Kishner" />
      <Mol k="butane" x={170} y={490} />
      <Name x={300} y={478} k="butane" anchor="start" />
      <Caption x={300} y={524} anchor="start">
        the C=O carbon is now CH₂
      </Caption>
      <ShadeKey x={150} y={553} text="shaded: the carbon of the C=O group" />
    </g>
  )
}

function AldehydeOrKetone() {
  return (
    <g>
      <Mol k="butanal" x={150} y={120} />
      <CarbonylH k="butanal" x={150} y={120} c={3} n1={2} n2={4} />
      <Name x={150} y={200} k="butanal" />
      <Arrow x1={150} y1={240} x2={150} y2={325} lx={165} ly={287} label="[O], oxidation" />
      <Mol k="butanoicAcid" x={150} y={380} />
      <Name x={150} y={450} k="butanoicAcid" />
      <Mol k="pentanone" x={430} y={120} dim />
      <Name x={430} y={200} k="pentanone" fill={MUTED} />
      <Caption x={430} y={250}>no H on the C=O carbon</Caption>
      <ShadeKey x={150} y={545} text="shaded: the carbonyl carbon" />
    </g>
  )
}

function TollensTest() {
  return (
    <g>
      <text x={290} y={36} textAnchor="middle" fontSize={15} fill={INK}>
        Tollens&apos; reagent: silver ions in ammonia, alkaline
      </text>
      <Mol k="butanal" x={150} y={120} />
      <Name x={150} y={200} k="butanal" />
      <Tube x={150} top={250} bottom={470} liquid={CLEAR_LIQUID} mirror />
      <Mol k="pentanone" x={430} y={120} />
      <Name x={430} y={200} k="pentanone" />
      <Tube x={430} top={250} bottom={470} liquid={CLEAR_LIQUID} />
      <Caption x={150} y={498}>silver mirror on the glass</Caption>
      <Caption x={150} y={520}>butanal → butanoate ion</Caption>
      <Caption x={430} y={498}>no change, stays clear</Caption>
    </g>
  )
}

function FehlingTest() {
  return (
    <g>
      <text x={290} y={30} textAnchor="middle" fontSize={14} fill={INK}>
        Fehling&apos;s A: aqueous CuSO₄
      </text>
      <text x={290} y={50} textAnchor="middle" fontSize={14} fill={INK}>
        Fehling&apos;s B: alkaline sodium potassium tartrate (Rochelle salt)
      </text>
      <text x={290} y={70} textAnchor="middle" fontSize={14} fill={INK}>
        mixed in equal amounts: blue
      </text>
      <Mol k="butanal" x={150} y={140} />
      <Name x={150} y={215} k="butanal" />
      <Tube x={150} top={255} bottom={470} liquid={BLUE_LIQUID} precipitate={BRICK} />
      <Mol k="pentanone" x={430} y={140} />
      <Name x={430} y={215} k="pentanone" />
      <Tube x={430} top={255} bottom={470} liquid={BLUE_LIQUID} />
      <Caption x={150} y={500}>heat: reddish-brown precipitate</Caption>
      <Caption x={430} y={500}>stays blue</Caption>
    </g>
  )
}

function KetoneCleavage() {
  return (
    <g>
      <Mol k="pentanone" x={290} y={120} shade={[REACTING_ATOM.pentanone ?? 2]} />
      <CutMark k="pentanone" x={290} y={120} a={CUT_BOND[0]} b={CUT_BOND[1]} />
      <Name x={290} y={185} k="pentanone" />
      <Arrow x1={290} y1={225} x2={290} y2={300} lx={300} ly={265} label="strong oxidant, heat" />
      <Mol k="propanoicAcid" x={150} y={370} shade={[2]} />
      <Name x={150} y={440} k="propanoicAcid" />
      <Caption x={150} y={482}>carbonyl C and one ethyl</Caption>
      <Mol k="ethanoicAcid" x={430} y={370} shade={[1]} />
      <Name x={430} y={440} k="ethanoicAcid" />
      <Caption x={430} y={482}>from the cut-off ethyl</Caption>
      <ShadeKey x={150} y={530} text="shaded: the carbon that changes" />
    </g>
  )
}

function HaloformTest() {
  const bond = bondIndex('butanone', HALOFORM_METHYL[0], HALOFORM_METHYL[1])
  return (
    <g>
      <Mol k="butanone" x={150} y={120} shade={[HALOFORM_METHYL[1]]} bonds={[bond]} />
      <Name x={150} y={195} k="butanone" />
      <Arrow x1={200} y1={232} x2={290} y2={318} lx={262} ly={262} label="NaOI (sodium hypoiodite)" />
      <Mol k="triiodomethane" x={150} y={390} />
      <Name x={150} y={470} k="triiodomethane" />
      <ellipse cx={240} cy={392} rx={16} ry={10} fill="var(--ox)" />
      <Caption x={150} y={510}>yellow solid</Caption>
      <text x={300} y={398} textAnchor="middle" fontSize={24} fill={INK}>
        +
      </text>
      <Mol k="propanoate" x={430} y={390} shade={[]} />
      <Name x={430} y={470} k="propanoate" />
      <Caption x={430} y={510}>with Na⁺</Caption>
      <text x={290} y={540} textAnchor="middle" fontSize={15} fill={INK}>
        CH₃COCH₂CH₃ + 3NaOI → CH₃CH₂COONa + CHI₃ (s) + 2NaOH
      </text>
    </g>
  )
}

const BEAT_VIEW: Record<RedoxBeat, () => ReactNode> = {
  'reduction-strip': ReductionStrip,
  'aldehyde-or-ketone': AldehydeOrKetone,
  tollens: TollensTest,
  fehling: FehlingTest,
  'ketone-cleavage': KetoneCleavage,
  haloform: HaloformTest,
}

export function CarbonylRedoxScrolly({ step }: CarbonylRedoxScrollyProps) {
  const index = Math.min(REDOX_BEATS.length - 1, Math.max(0, Math.round(step)))
  const beat = REDOX_BEATS[index]
  const View = BEAT_VIEW[beat]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Reduction and oxidation of aldehydes and ketones, Step ${index + 1} of ${REDOX_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        <marker id="redox-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={MUTED} />
        </marker>
      </defs>
      <View />
    </svg>
  )
}
