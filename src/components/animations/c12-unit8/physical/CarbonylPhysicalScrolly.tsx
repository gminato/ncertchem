'use client'

import type { CSSProperties, ReactNode } from 'react'
import { deltaText, elementColour, SkeletalFormula } from '@/components/organic'
import { CARBONYL_BOILING_POINTS, unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  ACETONE_C,
  ACETONE_O,
  ACETONE_SMILES,
  atomAt,
  BUTANE_SMILES,
  CARBONYL_BEATS,
  type CarbonylBeat,
  LADDER_BOTTOM_Y,
  LADDER_TOP_Y,
  ladderRow,
  LADDER_ACTIVE_K,
  ladderY,
  outwardFrom,
  PENTANAL_C,
  PENTANAL_O,
  PENTANAL_SMILES,
  PROPAN1OL_O,
  PROPAN1OL_SMILES,
  PROPANAL_C,
  PROPANAL_O,
  PROPANAL_SMILES,
  type Placed,
  type Point,
  showsLadder,
  graphOf,
} from './carbonyl-steps'

export interface CarbonylPhysicalScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 560
const AXIS_X = 110
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const HBOND = 'var(--accent)'
const DELTA_PLUS = 'var(--delta-plus)'
const DELTA_MINUS = 'var(--lone-pair)'
const WATER_L = 34
const WATER_ANGLE = (104.5 * Math.PI) / 180
const LABEL_SIZE = 15
const NAME = (smiles: string) => ladderRow(smiles).name

const mol = (smiles: string, scale: number, cx: number, cy: number): Placed => ({ smiles, scale, cx, cy })

/** A molecule placed so that its atom `index` sits at `target` (SVG px). */
function placeAtom(smiles: string, scale: number, index: number, target: Point): Placed {
  const local = atomAt(mol(smiles, scale, 0, 0), index)
  return mol(smiles, scale, target.x - local.x, target.y - local.y)
}

function Name({ x, y, children, fill = INK }: { x: number; y: number; children: ReactNode; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={16} fill={fill}>
      {children}
    </text>
  )
}

function Drawn({ p, opacity = 1, style }: { p: Placed; opacity?: number; style?: CSSProperties }) {
  return (
    <g opacity={opacity} style={style}>
      <SkeletalFormula graph={graphOf(p.smiles)} scale={p.scale} x={p.cx} y={p.cy} showLonePairs />
    </g>
  )
}

/** A dashed line between two points, shortened so it stops short of labels. */
function Line({ a, b, stroke, dash, width = 2, trim = 0 }: { a: Point; b: Point; stroke: string; dash: string; width?: number; trim?: number }) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  return (
    <line
      x1={a.x + ux * trim}
      y1={a.y + uy * trim}
      x2={b.x - ux * trim}
      y2={b.y - uy * trim}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinecap="round"
    />
  )
}

function Ladder({ beat }: { beat: CarbonylBeat }) {
  const active = LADDER_ACTIVE_K[beat]
  return (
    <g>
      <line x1={AXIS_X} y1={LADDER_TOP_Y} x2={AXIS_X} y2={LADDER_BOTTOM_Y} stroke={MUTED} strokeWidth={2} />
      <text x={AXIS_X} y={22} textAnchor="middle" fontSize={LABEL_SIZE} fill={INK}>
        b.p. / K
      </text>
      {[260, 300, 340, 380].map((k) => (
        <g key={k}>
          <line x1={AXIS_X - 5} y1={ladderY(k)} x2={AXIS_X} y2={ladderY(k)} stroke={MUTED} strokeWidth={2} />
          <text x={AXIS_X - 10} y={ladderY(k) + 5} textAnchor="end" fontSize={LABEL_SIZE} fill={MUTED}>
            {k}
          </text>
        </g>
      ))}
      {CARBONYL_BOILING_POINTS.map((r) => {
        const on = active.includes(r.bpK)
        const y = ladderY(r.bpK)
        return (
          <g key={r.bpK}>
            <line x1={AXIS_X} x2={AXIS_X + 52} y1={y} y2={y} stroke={on ? HBOND : MUTED} strokeWidth={on ? 3 : 1.5} opacity={on ? 1 : 0.6} />
            <circle cx={AXIS_X} cy={y} r={on ? 5 : 3} fill={on ? HBOND : MUTED} />
            <text x={AXIS_X + 62} y={y + 5} fontSize={LABEL_SIZE} fill={on ? INK : MUTED}>
              {r.bpK} K
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** A water molecule: O at `at`, with one H pointing at `toward` (a hydrogen bond) and one at 104.5 degrees. */
function waterHydrogens(at: Point, toward: Point) {
  const a = Math.atan2(toward.y - at.y, toward.x - at.x)
  const h1 = { x: at.x + WATER_L * Math.cos(a), y: at.y + WATER_L * Math.sin(a) }
  const b = a + WATER_ANGLE
  const h2 = { x: at.x + WATER_L * Math.cos(b), y: at.y + WATER_L * Math.sin(b) }
  return { h1, h2, a }
}

function Water({ at, toward }: { at: Point; toward: Point }) {
  const { h1, h2, a } = waterHydrogens(at, toward)
  const bondStart = { x: h1.x + Math.cos(a) * 10, y: h1.y + Math.sin(a) * 10 }
  const bondEnd = { x: toward.x - Math.cos(a) * 14, y: toward.y - Math.sin(a) * 14 }
  return (
    <g>
      <line x1={at.x} y1={at.y} x2={h1.x} y2={h1.y} stroke={INK} strokeWidth={2} />
      <line x1={at.x} y1={at.y} x2={h2.x} y2={h2.y} stroke={INK} strokeWidth={2} />
      <Line a={bondStart} b={bondEnd} stroke={HBOND} dash="1 6" width={3.5} />
      <circle cx={at.x} cy={at.y} r={11} fill={SURFACE} />
      <text x={at.x} y={at.y + 5} textAnchor="middle" fontSize={LABEL_SIZE} fontWeight={600} fill={elementColour('O')}>
        O
      </text>
      {[h1, h2].map((h, i) => (
        <g key={i}>
          <circle cx={h.x} cy={h.y} r={9} fill={SURFACE} />
          <text x={h.x} y={h.y + 5} textAnchor="middle" fontSize={LABEL_SIZE} fill={INK}>
            H
          </text>
        </g>
      ))}
    </g>
  )
}

/** Unit vector from a molecule's centre through one of its atoms. */
function dirFrom(p: Placed, index: number): Point {
  const a = atomAt(p, index)
  const q = outwardFrom(p, index, 1)
  return { x: q.x - a.x, y: q.y - a.y }
}

/** Two waters, each H-bonded to one lone pair of the carbonyl O (210 and 330 degrees); a third water is H-bonded to the first. */
function AcetoneWithWaters({ p }: { p: Placed }) {
  const o = atomAt(p, ACETONE_O)
  const unit = (deg: number): Point => {
    const r = (deg * Math.PI) / 180
    return { x: Math.cos(r), y: Math.sin(r) }
  }
  const d1 = unit(210)
  const d2 = unit(330)
  const d3 = unit(230)
  const w1 = { x: o.x + d1.x * 112, y: o.y + d1.y * 112 }
  const w2 = { x: o.x + d2.x * 112, y: o.y + d2.y * 112 }
  const w3 = { x: w1.x + d3.x * 90, y: w1.y + d3.y * 90 }
  const lp1 = { x: o.x + d1.x * 22, y: o.y + d1.y * 22 }
  const lp2 = { x: o.x + d2.x * 22, y: o.y + d2.y * 22 }
  return (
    <g>
      <Drawn p={p} />
      <Water at={w1} toward={lp1} />
      <Water at={w2} toward={lp2} />
      <Water at={w3} toward={w1} />
      <Name x={p.cx} y={p.cy + 64}>
        {NAME(ACETONE_SMILES)}
      </Name>
    </g>
  )
}

/** Step 3: propanal's O sits directly below acetone's C, so one dashed line joins the O (δ⁻) to the C (δ⁺). */
function DipoleOverlay({ a, b }: { a: Placed; b: Placed }) {
  const aC = atomAt(a, PROPANAL_C)
  const bC = atomAt(b, ACETONE_C)
  const lab = (p: Point, text: string, fill: string) => (
    <text x={p.x} y={p.y} textAnchor="middle" fontSize={LABEL_SIZE} fill={fill}>
      {deltaText(text)}
    </text>
  )
  return (
    <g>
      <Line a={atomAt(a, PROPANAL_O)} b={bC} stroke={MUTED} dash="6 5" width={2.5} trim={12} />
      {lab({ x: aC.x - 6, y: aC.y + 26 }, 'δ⁺', DELTA_PLUS)}
      {lab(outwardFrom(a, PROPANAL_O, 24), 'δ⁻', DELTA_MINUS)}
      {lab({ x: bC.x - 26, y: bC.y - 6 }, 'δ⁺', DELTA_PLUS)}
      {lab(outwardFrom(b, ACETONE_O, 24), 'δ⁻', DELTA_MINUS)}
    </g>
  )
}

/** Step 4: one dotted hydrogen bond from the left molecule's O–H hydrogen to the right O's lone pair. */
function HydrogenBondOverlay({ a, b }: { a: Placed; b: Placed }) {
  const oa = atomAt(a, PROPAN1OL_O)
  const ob = atomAt(b, PROPAN1OL_O)
  return <Line a={{ x: oa.x + 26, y: oa.y - 6 }} b={{ x: ob.x, y: ob.y - 20 }} stroke={HBOND} dash="1 6" width={3.5} />
}

function Scene({ beat }: { beat: CarbonylBeat }) {
  switch (beat) {
    case 'ladder-all': {
      // Five molecules in even rows, highest boiling point on top; a thin leader joins each to its rung.
      const rows = [...CARBONYL_BOILING_POINTS].sort((x, y) => y.bpK - x.bpK)
      return (
        <g>
          {rows.map((r, i) => {
            const cy = 80 + i * 100
            return (
              <g key={r.smiles}>
                <Line a={{ x: 226, y: ladderY(r.bpK) }} b={{ x: 280, y: cy }} stroke={MUTED} dash="none" width={1.5} />
                <Drawn p={mol(r.smiles, 39, 340, cy)} />
                <Name x={340} y={cy + 50}>
                  {r.name}
                </Name>
              </g>
            )
          })}
        </g>
      )
    }
    case 'butane-alone': {
      // One butane in the middle, one neighbour above and one below, 60 units apart; each pair joined by four vertical contacts.
      const main = mol(BUTANE_SMILES, 39, 380, 290)
      const above = mol(BUTANE_SMILES, 39, 380, 230)
      const below = mol(BUTANE_SMILES, 39, 380, 350)
      return (
        <g>
          <Drawn p={above} opacity={0.45} />
          <Drawn p={below} opacity={0.45} />
          <Drawn p={main} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <Line a={atomAt(main, i)} b={atomAt(above, i)} stroke={MUTED} dash="4 4" trim={6} />
              <Line a={atomAt(main, i)} b={atomAt(below, i)} stroke={MUTED} dash="4 4" trim={6} />
            </g>
          ))}
          <text x={main.cx + 64} y={main.cy + 40} fontSize={16} fill={INK}>
            {NAME(BUTANE_SMILES)}
          </text>
        </g>
      )
    }
    case 'dipoles': {
      const a = placeAtom(PROPANAL_SMILES, 39, PROPANAL_O, { x: 390, y: 296 })
      const b = placeAtom(ACETONE_SMILES, 39, ACETONE_C, { x: 390, y: 236 })
      const bO = atomAt(b, ACETONE_O)
      return (
        <g>
          <Drawn p={a} />
          <Drawn p={b} />
          <DipoleOverlay a={a} b={b} />
          <Name x={a.cx} y={a.cy + 56}>
            {NAME(PROPANAL_SMILES)}
          </Name>
          <text x={b.cx + 52} y={bO.y + 4} fontSize={16} fill={INK}>
            {NAME(ACETONE_SMILES)}
          </text>
        </g>
      )
    }
    case 'hydrogen-bonds': {
      // Two propan-1-ol molecules side by side, the left O–H reaching the right O.
      const a = placeAtom(PROPAN1OL_SMILES, 39, PROPAN1OL_O, { x: 345, y: 250 })
      const b = placeAtom(PROPAN1OL_SMILES, 39, PROPAN1OL_O, { x: 485, y: 250 })
      return (
        <g>
          <Drawn p={a} />
          <Drawn p={b} />
          <HydrogenBondOverlay a={a} b={b} />
          <Name x={(a.cx + b.cx) / 2} y={a.cy + 72}>
            {NAME(PROPAN1OL_SMILES)}
          </Name>
        </g>
      )
    }
    case 'acetone-water': {
      return <AcetoneWithWaters p={placeAtom(ACETONE_SMILES, 39, ACETONE_O, { x: 380, y: 300 })} />
    }
    case 'pentanal-water': {
      const p = mol(PENTANAL_SMILES, 39, 230, 290)
      const o = atomAt(p, PENTANAL_O)
      const c = atomAt(p, PENTANAL_C)
      const d = dirFrom(p, PENTANAL_O)
      const len = Math.hypot(d.x, d.y) || 1
      const at = { x: o.x + (d.x / len) * 80, y: o.y + (d.y / len) * 80 }
      return (
        <g>
          {/* The whole chain in the muted tone; the C=O bond and its O are redrawn in ink, clipped to the right of the carbonyl carbon. */}
          <Drawn p={p} style={{ ['--fg' as string]: 'var(--fg-muted)' } as CSSProperties} />
          <clipPath id="c12u8-4-carbonyl-clip">
            <rect x={c.x - 1} y={0} width={W} height={H} />
          </clipPath>
          <g clipPath="url(#c12u8-4-carbonyl-clip)">
            <Drawn p={p} />
          </g>
          <Water at={at} toward={o} />
          <Name x={p.cx} y={p.cy + 62}>
            {unit8Name(PENTANAL_SMILES)}
          </Name>
        </g>
      )
    }
    default:
      return null
  }
}

/** One Scrolly panel: the ladder for Steps 1 to 4, then the water drawings for Steps 5 and 6. */
export function CarbonylPhysicalScrolly({ step }: CarbonylPhysicalScrollyProps) {
  const index = Math.min(CARBONYL_BEATS.length - 1, Math.max(0, Math.round(step)))
  const beat = CARBONYL_BEATS[index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Physical properties of aldehydes and ketones, Step ${index + 1} of ${CARBONYL_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {showsLadder(beat) ? <Ladder beat={beat} /> : null}
      <Scene beat={beat} />
    </svg>
  )
}
