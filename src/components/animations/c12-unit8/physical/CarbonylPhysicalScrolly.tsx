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
  nearestPair,
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

function rotateVec(v: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180
  return { x: v.x * Math.cos(r) - v.y * Math.sin(r), y: v.x * Math.sin(r) + v.y * Math.cos(r) }
}

/** An acetone with waters hydrogen-bonded to its carbonyl O, fanned out around it. */
function AcetoneCluster({ p, angles }: { p: Placed; angles: readonly number[] }) {
  const o = atomAt(p, ACETONE_O)
  const d = dirFrom(p, ACETONE_O)
  const len = Math.hypot(d.x, d.y) || 1
  const unit = { x: d.x / len, y: d.y / len }
  return (
    <g>
      <Drawn p={p} />
      {angles.map((deg) => {
        const v = rotateVec(unit, deg)
        const at = { x: o.x + v.x * 80, y: o.y + v.y * 80 }
        return <Water key={deg} at={at} toward={o} />
      })}
      <Name x={p.cx} y={p.cy + 64}>
        {NAME(ACETONE_SMILES)}
      </Name>
    </g>
  )
}

/** Step 3: propanal and acetone line up, with each δ⁺ carbon facing a δ⁻ oxygen. */
function DipoleOverlay({ a, b }: { a: Placed; b: Placed }) {
  const aC = atomAt(a, PROPANAL_C)
  const aO = atomAt(a, PROPANAL_O)
  const bC = atomAt(b, ACETONE_C)
  const bO = atomAt(b, ACETONE_O)
  const lab = (p: Point, text: string, fill: string) => (
    <text x={p.x} y={p.y} textAnchor="middle" fontSize={LABEL_SIZE} fill={fill}>
      {deltaText(text)}
    </text>
  )
  const aCl = outwardFrom(a, PROPANAL_C, 24)
  const aOl = outwardFrom(a, PROPANAL_O, 22)
  const bCl = outwardFrom(b, ACETONE_C, 24)
  const bOl = outwardFrom(b, ACETONE_O, 22)
  return (
    <g>
      <Line a={aO} b={bC} stroke={MUTED} dash="6 5" width={2.5} trim={12} />
      <Line a={bO} b={aC} stroke={MUTED} dash="6 5" width={2.5} trim={12} />
      {lab(aCl, 'δ⁺', DELTA_PLUS)}
      {lab(aOl, 'δ⁻', DELTA_MINUS)}
      {lab(bCl, 'δ⁺', DELTA_PLUS)}
      {lab(bOl, 'δ⁻', DELTA_MINUS)}
    </g>
  )
}

/** Step 4: two propan-1-ol molecules, one O–H hydrogen bonded to the other's oxygen. */
function HydrogenBondOverlay({ a, b }: { a: Placed; b: Placed }) {
  const oa = atomAt(a, PROPAN1OL_O)
  const ob = atomAt(b, PROPAN1OL_O)
  const len = Math.hypot(ob.x - oa.x, ob.y - oa.y) || 1
  const ux = (ob.x - oa.x) / len
  const uy = (ob.y - oa.y) / len
  // The H label sits 14 units to one side of the dotted line, clear of the O–C bond.
  const mx = (oa.x + ob.x) / 2
  const my = (oa.y + ob.y) / 2
  const hx = mx - uy * 14
  const hy = my + ux * 14
  return (
    <g>
      <Line a={oa} b={ob} stroke={HBOND} dash="1 6" width={3.5} trim={12} />
      <text x={hx} y={hy} textAnchor="middle" fontSize={LABEL_SIZE} fill={INK}>
        H
      </text>
    </g>
  )
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
      const main = mol(BUTANE_SMILES, 39, 420, 290)
      const left = mol(BUTANE_SMILES, 39, 300, 440)
      const right = mol(BUTANE_SMILES, 39, 505, 150)
      const [a1, a2] = nearestPair(main, left)
      const [b1, b2] = nearestPair(main, right)
      return (
        <g>
          <Drawn p={left} opacity={0.45} />
          <Drawn p={right} opacity={0.45} />
          <Drawn p={main} />
          <Line a={a1} b={a2} stroke={MUTED} dash="4 4" trim={4} />
          <Line a={b1} b={b2} stroke={MUTED} dash="4 4" trim={4} />
          <Name x={main.cx} y={main.cy + 60}>
            {NAME(BUTANE_SMILES)}
          </Name>
        </g>
      )
    }
    case 'dipoles': {
      const a = mol(PROPANAL_SMILES, 39, 300, 200)
      const b = mol(ACETONE_SMILES, 39, 470, 380)
      return (
        <g>
          <Drawn p={a} />
          <Drawn p={b} />
          <DipoleOverlay a={a} b={b} />
          <Name x={a.cx} y={a.cy + 56}>
            {NAME(PROPANAL_SMILES)}
          </Name>
          <Name x={b.cx} y={b.cy + 56}>
            {NAME(ACETONE_SMILES)}
          </Name>
        </g>
      )
    }
    case 'hydrogen-bonds': {
      const a = mol(PROPAN1OL_SMILES, 39, 300, 170)
      const b = mol(PROPAN1OL_SMILES, 39, 312, 214)
      return (
        <g>
          <Drawn p={a} />
          <Drawn p={b} />
          <HydrogenBondOverlay a={a} b={b} />
          <Name x={a.cx} y={a.cy - 34}>
            {NAME(PROPAN1OL_SMILES)}
          </Name>
          <Name x={b.cx} y={b.cy + 40}>
            {NAME(PROPAN1OL_SMILES)}
          </Name>
        </g>
      )
    }
    case 'acetone-water': {
      const a = mol(ACETONE_SMILES, 39, 190, 190)
      const b = mol(ACETONE_SMILES, 39, 420, 370)
      return (
        <g>
          <AcetoneCluster p={a} angles={[0, 60, -60]} />
          <AcetoneCluster p={b} angles={[0, 60, -60]} />
        </g>
      )
    }
    case 'pentanal-water': {
      const p = mol(PENTANAL_SMILES, 39, 230, 290)
      const o = atomAt(p, PENTANAL_O)
      const c = atomAt(p, PENTANAL_C)
      const d = dirFrom(p, PENTANAL_O)
      const len = Math.hypot(d.x, d.y) || 1
      const at = { x: o.x + (d.x / len) * 80, y: o.y + (d.y / len) * 80 }
      const mid = { x: (o.x + c.x) / 2, y: (o.y + c.y) / 2 }
      return (
        <g>
          {/* The whole chain in grey; the carbonyl end is redrawn in ink through a clip. */}
          <Drawn p={p} style={{ ['--fg' as string]: 'var(--fg-muted)' } as CSSProperties} />
          <clipPath id="c12u8-4-carbonyl-clip">
            <circle cx={mid.x} cy={mid.y} r={44} />
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
