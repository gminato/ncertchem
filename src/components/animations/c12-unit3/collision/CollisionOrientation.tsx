'use client'

import type { ReactNode } from 'react'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { CollisionFlash, MaxwellBoltzmannCurve, Particle, ReactionBox } from '@/components/vocab/kinetics'
import {
  ONE_IN_ENERGETIC,
  TEXT_EFFECTIVE,
  TEXT_HIGH,
  TEXT_LOW,
  approachPhase,
  closestPairs,
  drift,
  flashOpacity,
  particleHomes,
  type Bounds,
  type Point,
} from './collision-steps'

export interface CollisionOrientationProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 400
const LABEL = 20
const NOTE = 16

/** Labels sit beside strokes, never on them: a halo keeps them legible over the drawing. */
function Label({ x, y, anchor = 'middle', size = LABEL, children, fill = 'var(--fg)' }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; size?: number; children: ReactNode; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
      {children}
    </text>
  )
}

function Pill({ x, y, w, good, text }: { x: number; y: number; w: number; good: boolean; text: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={36} rx={18} fill="var(--surface-raised)" stroke={good ? 'var(--success)' : 'var(--caution)'} strokeWidth={2} />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={17} fill="var(--fg)">
        {text}
      </text>
    </g>
  )
}

/** Vessel bounds for particle homes: inset so drift never leaves the walls. */
function innerBounds(x: number, y: number, w: number, h: number, inset = 40): Bounds {
  return { x0: x + inset, y0: y + inset, x1: x + w - inset, y1: y + h - inset }
}

/** Step 1 (index 0): a crowded box with collisions flashing; most are gentle bounces. */
function CrowdedBox({ t }: { t: number }) {
  const bx = 30
  const by = 36
  const bw = 520
  const bh = 290
  const homes = particleHomes(11, 20, innerBounds(bx, by, bw, bh), 46)
  const pts: Point[] = homes.map((h, i) => drift(h, i, t))
  const pairs = closestPairs(homes, 5)
  return (
    <g>
      <ReactionBox x={bx} y={by} width={bw} height={bh} radius={18}>
        {pts.map((p, i) => (
          <Particle key={i} x={p.x - bx} y={p.y - by} r={12} tone={i % 2 === 0 ? 'reactant' : 'product'} />
        ))}
        {pairs.map(([i, j], k) => (
          <CollisionFlash
            key={k}
            x={(pts[i].x + pts[j].x) / 2 - bx}
            y={(pts[i].y + pts[j].y) / 2 - by}
            size={20}
            effective={false}
            opacity={flashOpacity(k, t)}
          />
        ))}
      </ReactionBox>
      <Label x={290} y={354}>
        <tspan>Z</tspan>
        <Sub>AB</Sub>
        <tspan> = collisions per second per unit volume</tspan>
      </Label>
      <g>
        <Particle x={150} y={386} r={8} tone="reactant" />
        <Label x={166} y={392} anchor="start" size={NOTE}>
          A
        </Label>
        <Particle x={232} y={386} r={8} tone="product" />
        <Label x={248} y={392} anchor="start" size={NOTE}>
          B
        </Label>
        <CollisionFlash x={330} y={386} size={11} effective={false} />
        <Label x={346} y={392} anchor="start" size={NOTE}>
          a collision
        </Label>
      </g>
    </g>
  )
}

/** Step 2 (index 1): a gentle pair bounces apart, and the energy fractions from the lib. */
function GentleBox({ t }: { t: number }) {
  const bx = 20
  const by = 50
  const bw = 260
  const bh = 280
  const homes = particleHomes(23, 12, innerBounds(bx, by, bw, bh), 50)
  const pts: Point[] = homes.map((h, i) => drift(h, i, t))
  const pairs = closestPairs(homes, 2)
  return (
    <g>
      <ReactionBox x={bx} y={by} width={bw} height={bh} radius={18}>
        {pts.map((p, i) => (
          <Particle key={i} x={p.x - bx} y={p.y - by} r={12} tone={i % 2 === 0 ? 'reactant' : 'product'} />
        ))}
        {pairs.map(([i, j], k) => (
          <CollisionFlash
            key={k}
            x={(pts[i].x + pts[j].x) / 2 - bx}
            y={(pts[i].y + pts[j].y) / 2 - by}
            size={18}
            effective={false}
            opacity={flashOpacity(k, t)}
          />
        ))}
      </ReactionBox>
      <Label x={165} y={352}>
        a gentle pair bounces apart
      </Label>
      <Label x={330} y={34} anchor="start" size={17}>
        fraction with E ≥ <tspan fontStyle="italic">E</tspan>ₐ, 300 K
      </Label>
      <MaxwellBoltzmannCurve x={352} y={50} width={200} height={150} temperatures={[300]} ea={2.2} shadeTails eaLabel="Eₐ" xTitle="E / RT" yTitle="fraction of molecules" />
      <Label x={330} y={276} anchor="start">
        <tspan fontStyle="italic">E</tspan>
        <tspan>ₐ = 10 kJ mol</tspan>
        <Sup>−1</Sup>
      </Label>
      <Label x={330} y={300} anchor="start">
        <tspan>{TEXT_LOW}</tspan>
      </Label>
      <Label x={330} y={326} anchor="start">
        <tspan fontStyle="italic">E</tspan>
        <tspan>ₐ = 50 kJ mol</tspan>
        <Sup>−1</Sup>
      </Label>
      <Label x={330} y={350} anchor="start">
        <tspan>{TEXT_HIGH}</tspan>
      </Label>
      <Label x={330} y={380} anchor="start" size={NOTE} fill="var(--fg-muted)">
        tail shading is schematic
      </Label>
    </g>
  )
}

/** CH₃Br, drawn in its orientation frame: Br on the left, the three H atoms on the right and above. */
function MethylBromide({ cx = 260, cy = 190 }: { cx?: number; cy?: number }) {
  const C = { x: cx, y: cy }
  const Br = { x: cx - 105, y: cy }
  const H1 = { x: cx + 40, y: cy - 62 }
  const H2 = { x: cx + 40, y: cy + 62 }
  const H3 = { x: cx - 8, y: cy - 72 }
  const bond = (a: Point, b: Point, dashed = false) => (
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--bond)" strokeWidth={5} strokeLinecap="round" strokeDasharray={dashed ? '6 6' : undefined} />
  )
  const hydrogen = (p: Point, faded = false) => (
    <circle cx={p.x} cy={p.y} r={10} fill="var(--surface)" stroke="var(--fg-muted)" strokeWidth={2} opacity={faded ? 0.5 : 1} />
  )
  return (
    <g>
      {bond(C, H3)}
      {bond(C, H1)}
      {bond(C, H2)}
      {bond(C, Br, true)}
      {hydrogen(H3, true)}
      <circle cx={C.x} cy={C.y} r={15} fill="var(--fg)" opacity={0.85} />
      <Particle x={Br.x} y={Br.y} r={20} tone="catalyst" />
      {hydrogen(H1)}
      {hydrogen(H2)}
      <Label x={Br.x} y={Br.y + 46}>
        Br
      </Label>
      <Label x={C.x - 14} y={C.y + 38} anchor="end">
        C
      </Label>
      <Label x={H1.x + 18} y={H1.y + 6} anchor="start">
        H
      </Label>
      <Label x={H2.x + 18} y={H2.y + 6} anchor="start">
        H
      </Label>
      <Label x={40} y={112} anchor="start">
        CH<Sub>3</Sub>Br
      </Label>
    </g>
  )
}

/** Steps 3 and 4 (indices 2 and 3): the orientation example, wrong end then right end. */
function Orientation({ t, rightEnd }: { t: number; rightEnd: boolean }) {
  const s = approachPhase(t)
  const cy = 190
  const ionX = rightEnd ? 304 : 120 - 30 * (1 - s)
  const ion = { x: ionX, y: cy }
  return (
    <g>
      <MethylBromide />
      {rightEnd ? (
        <line x1={260} y1={cy} x2={ion.x} y2={cy} stroke="var(--kin-flash)" strokeWidth={5} strokeLinecap="round" strokeDasharray="6 6" />
      ) : null}
      <Particle x={ion.x} y={ion.y} r={13} tone="neutral" />
      <Label x={rightEnd ? ion.x + 16 : ion.x} y={cy - 26} anchor={rightEnd ? 'start' : 'middle'}>
        OH<Sup>−</Sup>
      </Label>
      <CollisionFlash x={rightEnd ? 304 : 124} y={cy} size={26} effective={rightEnd} opacity={rightEnd ? 1 : 0.3 + 0.7 * s} />
      {rightEnd ? (
        <>
          <Particle x={150} y={342} r={13} tone="catalyst" />
          <Label x={172} y={348} anchor="start">
            Br<Sup>−</Sup>
          </Label>
          <rect x={266} y={318} width={230} height={48} rx={24} fill="var(--surface-raised)" stroke="var(--kin-flash)" strokeWidth={2.4} />
          <text x={381} y={349} textAnchor="middle" fontSize={LABEL} fill="var(--fg)">
            CH<Sub>3</Sub>OH
          </text>
          <Pill x={30} y={44} w={190} good text="energy: enough" />
          <Pill x={250} y={44} w={250} good text="orientation: right" />
          <Label x={290} y={302}>
            products: CH<Sub>3</Sub>OH and Br<Sup>−</Sup>
          </Label>
        </>
      ) : (
        <>
          <Pill x={30} y={44} w={190} good text="energy: enough" />
          <Pill x={250} y={44} w={250} good={false} text="orientation: wrong" />
          <Label x={290} y={346}>
            it bounces back: no CH<Sub>3</Sub>OH
          </Label>
        </>
      )}
    </g>
  )
}

const DOT_COUNT = 20
const DOT_SPACING = 18
const DOT_X0 = 196

/** Step 5 (index 4): the rate factor built one factor at a time. Dots are schematic; the numbers are exact. */
function RateFactor({ t }: { t: number }) {
  const rows: Array<{ y: number; lit: number[]; litFill: string }> = [
    { y: 96, lit: Array.from({ length: 40 }, (_, k) => k), litFill: 'var(--fg-muted)' },
    { y: 176, lit: [3, 25], litFill: 'var(--fg)' },
    { y: 256, lit: [3], litFill: 'var(--kin-flash)' },
  ]
  const dots = (rowY: number, lit: number[], litFill: string, rowIndex: number) =>
    Array.from({ length: 40 }, (_, k) => {
      const col = k % DOT_COUNT
      const line = Math.floor(k / DOT_COUNT)
      const x = DOT_X0 + col * DOT_SPACING
      const y = rowY + line * DOT_SPACING
      const isLit = lit.includes(k)
      const pulse = isLit ? 0.7 + 0.3 * Math.sin(2 * t + k + rowIndex) : 1
      return <circle key={k} cx={x} cy={y} r={5} fill={isLit ? litFill : 'var(--fg-subtle)'} opacity={isLit ? pulse : 0.35} />
    })
  return (
    <g>
      {rows.map((row, r) => (
        <g key={r}>{dots(row.y, row.lit, row.litFill, r)}</g>
      ))}
      <Label x={24} y={106} anchor="start">
        <tspan>Z</tspan>
        <Sub>AB</Sub>
      </Label>
      <Label x={196} y={148} anchor="start" size={17}>
        all collisions per second
      </Label>
      <Label x={24} y={186} anchor="start">
        × e<Sup>−Eₐ/RT</Sup>
      </Label>
      <Label x={196} y={226} anchor="start" size={17}>
        energetic: {TEXT_LOW}, about 1 in {ONE_IN_ENERGETIC}
      </Label>
      <Label x={24} y={266} anchor="start">
        × <tspan fontStyle="italic">P</tspan>
      </Label>
      <Label x={196} y={306} anchor="start" size={17}>
        well aimed too: {TEXT_EFFECTIVE} (P = 0.25)
      </Label>
      <Label x={290} y={354} size={22}>
        <tspan fontStyle="italic">Rate</tspan>
        <tspan> = </tspan>
        <tspan fontStyle="italic">P</tspan>
        <tspan fontStyle="italic">Z</tspan>
        <Sub>AB</Sub>
        <tspan> e</tspan>
        <Sup>−Eₐ/RT</Sup>
      </Label>
      <Label x={290} y={386} size={NOTE} fill="var(--fg-muted)">
        Dots are schematic. The numbers are exact.
      </Label>
    </g>
  )
}

export function CollisionOrientation({ step, reducedMotion }: CollisionOrientationProps) {
  const t = useAmbientTime(reducedMotion)
  const k = Math.min(4, Math.max(0, Math.round(step)))
  let scene: ReactNode
  switch (k) {
    case 0:
      scene = <CrowdedBox t={t} />
      break
    case 1:
      scene = <GentleBox t={t} />
      break
    case 2:
      scene = <Orientation t={t} rightEnd={false} />
      break
    case 3:
      scene = <Orientation t={t} rightEnd />
      break
    default:
      scene = <RateFactor t={t} />
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={ARIA[k]}>
      {scene}
    </svg>
  )
}

const ARIA = [
  'A box of A and B particles, with collisions flashing; most are gentle bounces.',
  'A gentle collision bounces apart; a Maxwell–Boltzmann curve shows the energy fraction above Eₐ at 300 K.',
  'An energetic OH⁻ ion hits the bromine end of CH₃Br and bounces back: no CH₃OH forms.',
  'The same ion attacks the carbon from the side opposite bromine, and CH₃OH and Br⁻ form.',
  'The rate factor built up: Z, times e^(−Eₐ/RT), times P, gives Rate = P Z e^(−Eₐ/RT).',
]
