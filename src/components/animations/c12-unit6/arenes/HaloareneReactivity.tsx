'use client'

import type { CSSProperties, ReactNode } from 'react'
import { CurvedArrow, SkeletalFormula, drawingFrame, along, type Point, type SkeletalMark } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ARENE_NAMES,
  ARENE_SMILES,
  ARENE_STEP_COUNT,
  carbanionSites,
  chlorineBondComparison,
  formulaOf,
  ladderCards,
  nitroVerdict,
  PARA_CARBANION_CONTRIBUTORS,
} from './haloarene-steps'

export interface HaloareneReactivityProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 480
const TEXT: CSSProperties = { fill: 'var(--fg)', fontFamily: 'var(--font-sans)' }
const MUTED: CSSProperties = { fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }
const MINUS = '−'

interface MolProps {
  smiles: string
  x: number
  y: number
  scale: number
  showLonePairs?: boolean
  highlightAtoms?: number[]
  partialBonds?: number[]
  partialCharges?: SkeletalMark[]
  overlay?: ReactNode
}

/** A structure drawn by the shared organic component, centred on (x, y). */
function Mol({ smiles, x, y, scale, ...rest }: MolProps) {
  return <SkeletalFormula graph={parseSmiles(smiles)} scale={scale} x={x} y={y} {...rest} />
}

/** Position of atom i of a drawn molecule, in the parent's coordinates. */
function atomAt(smiles: string, scale: number, x: number, y: number, i: number): Point {
  const frame = drawingFrame(parseSmiles(smiles), scale)
  return { x: x + frame.points[i].x, y: y + frame.points[i].y }
}

function ringCentreAt(smiles: string, scale: number, x: number, y: number): Point {
  const frame = drawingFrame(parseSmiles(smiles), scale)
  return { x: x + frame.ringCentres[0].x, y: y + frame.ringCentres[0].y }
}

/**
 * Charge marks just outside each listed ring atom, pushed straight out from the ring centre so they
 * sit beside their carbon and clear of its bonds. Drawn in the structure's own frame (use as overlay).
 */
function outwardCharges(smiles: string, scale: number, atoms: number[], label: string): ReactNode {
  const frame = drawingFrame(parseSmiles(smiles), scale)
  const c = frame.ringCentres[0]
  return atoms.map((a) => {
    const p = frame.points[a]
    const dx = p.x - c.x
    const dy = p.y - c.y
    const len = Math.hypot(dx, dy) || 1
    const q = { x: p.x + (dx / len) * 0.32 * scale, y: p.y + (dy / len) * 0.32 * scale }
    return (
      <text key={a} x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" style={{ fill: 'var(--delta-minus)' }}>
        {label}
      </text>
    )
  })
}

/** Text label at the 14-unit minimum (rendered size ≥ 13 px at the 570 px panel). */
function Label({
  x,
  y,
  children,
  muted = false,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: ReactNode
  muted?: boolean
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text x={x} y={y} fontSize={14} textAnchor={anchor} style={muted ? MUTED : TEXT}>
      {children}
    </text>
  )
}

/** Dimension card around one ladder or product drawing. */
function Card({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={12} fill="none" stroke="var(--border)" strokeWidth={1.4} />
}

function Step0() {
  const scale = 100
  const cx = 290
  const cy = 240
  const cl = atomAt(ARENE_SMILES.chlorobenzene, scale, cx, cy, 0)
  const c1 = atomAt(ARENE_SMILES.chlorobenzene, scale, cx, cy, 1)
  const c2 = atomAt(ARENE_SMILES.chlorobenzene, scale, cx, cy, 2)
  const centre = ringCentreAt(ARENE_SMILES.chlorobenzene, scale, cx, cy)
  // Lone pair sits on the side of Cl away from the ring.
  const outX = cl.x - centre.x
  const outY = cl.y - centre.y
  const outLen = Math.hypot(outX, outY) || 1
  const from = { x: cl.x + (outX / outLen) * 16, y: cl.y + (outY / outLen) * 16 }
  const to = along(along(c1, c2, 0.5), centre, 0.22)
  return (
    <>
      <Label x={W / 2} y={34}>Cl lone pair overlaps the ring π system</Label>
      <Mol smiles={ARENE_SMILES.chlorobenzene} x={cx} y={cy} scale={scale} showLonePairs partialBonds={[0]} highlightAtoms={[0]} />
      <CurvedArrow from={from} to={to} kind="pair" bend={0.35} />
      <Label x={W / 2} y={424}>The C–Cl bond gets partial double-bond character (dashed line).</Label>
      <Label x={W / 2} y={450} muted>A bond with that character is harder to break.</Label>
    </>
  )
}

function Step1() {
  const { sp3Pm, sp2Pm, differencePm } = chlorineBondComparison()
  const k = 2.4
  const x0 = 100
  return (
    <>
      <Label x={W / 2} y={34}>C–Cl bond length, drawn to one scale</Label>
      <Mol smiles={ARENE_SMILES.chloroethane} x={150} y={108} scale={46} showLonePairs />
      <Mol smiles={ARENE_SMILES.chlorobenzene} x={430} y={108} scale={46} showLonePairs />
      <Label x={150} y={186} muted>sp³ carbon</Label>
      <Label x={430} y={186} muted>sp² ring carbon</Label>
      <line x1={x0} y1={296} x2={x0 + sp3Pm * k} y2={296} stroke={ROLE_TONE.sp3} strokeWidth={12} strokeLinecap="round" />
      <line x1={x0} y1={346} x2={x0 + sp2Pm * k} y2={346} stroke={ROLE_TONE.sp2} strokeWidth={12} strokeLinecap="round" />
      <Label x={x0} y={270} anchor="start">{`sp³ C–Cl: ${sp3Pm} pm`}</Label>
      <Label x={x0} y={320} anchor="start">{`sp² C–Cl (ring): ${sp2Pm} pm`}</Label>
      <Label x={W / 2} y={398}>{`The ring bond is ${differencePm} pm shorter.`}</Label>
      <Label x={W / 2} y={428}>A phenyl cation has no resonance to spread its +,</Label>
      <Label x={W / 2} y={452}>so SN1 is ruled out.</Label>
    </>
  )
}

function nitroText(n: number): string {
  if (n === 0) return 'no nitro group'
  return `${n} nitro ${n === 1 ? 'group' : 'groups'}`
}

function Step2() {
  const cards = ladderCards()
  // Two rows of cards: the trinitro drawing is tall, so its card is taller.
  const pos = [
    { x: 10, y: 34, h: 168 },
    { x: 300, y: 34, h: 168 },
    { x: 10, y: 212, h: 256 },
    { x: 300, y: 212, h: 256 },
  ]
  return (
    <>
      <Label x={W / 2} y={24}>Nitro groups ortho or para to Cl lower the temperature</Label>
      {cards.map((c, i) => {
        const p = pos[i]
        // The dinitro drawing sits a little lower so its top nitro group clears the card label.
        const cy = p.y + (p.h === 168 ? 74 : i === 2 ? 130 : 112)
        const base = p.y + p.h
        return (
          <g key={c.smiles}>
            <Card x={p.x} y={p.y} w={270} h={p.h} />
            <Mol smiles={c.smiles} x={p.x + 135} y={cy} scale={38} showLonePairs />
            {p.h === 168 ? (
              <>
                <Label x={p.x + 135} y={base - 26}>{nitroText(c.nitroGroups)}</Label>
                <Label x={p.x + 135} y={base - 6}>{c.conditions}</Label>
              </>
            ) : (
              <>
                {/* Labels sit along the bottom edge: the top-left nitro O lone pairs would sit under a top caption. */}
                <Label x={p.x + 14} y={base - 34} anchor="start">{nitroText(c.nitroGroups)}</Label>
                <Label x={p.x + 14} y={base - 12} anchor="start">{c.conditions}</Label>
              </>
            )}
          </g>
        )
      })}
    </>
  )
}

/** Caption lines under a card: the charge either reaches the NO₂ carbon or never does. */
function verdictLines(v: { chargeReachesNitroCarbon: boolean }): string[] {
  return v.chargeReachesNitroCarbon ? [`${MINUS} reaches this carbon`] : ['The charge never reaches', 'the NO₂ carbon']
}

function Step3() {
  const sites = carbanionSites()
  const scale = 38
  // Para card: a ring-carbon form and the nitro-O form (scale 38 keeps atom labels at 14 px).
  const paraCells = [
    { smiles: PARA_CARBANION_CONTRIBUTORS.c2, caption: `${MINUS} on C2`, y: 118 },
    { smiles: PARA_CARBANION_CONTRIBUTORS.nitroO, caption: `${MINUS} on a nitro O, via C4`, y: 268 },
  ]
  const para = verdictLines(nitroVerdict(4))
  const meta = verdictLines(nitroVerdict(3))
  return (
    <>
      <Label x={W / 2} y={28}>{`OH⁻ attacks C1. The ring then carries ${MINUS} on C${sites.join(', C')}.`}</Label>
      <Card x={10} y={50} w={270} h={390} />
      {paraCells.map((c) => (
        <g key={c.caption}>
          <Mol smiles={c.smiles} x={145} y={c.y} scale={scale} showLonePairs />
          <Label x={145} y={c.y + 76}>{c.caption}</Label>
        </g>
      ))}
      <Label x={145} y={374}>NO₂ at C4, para to Cl</Label>
      {para.map((t, i) => (
        <Label key={`p${i}`} x={145} y={398 + i * 18}>{t}</Label>
      ))}
      <Label x={145} y={436}>{nitroVerdict(4).activated ? 'activated' : 'not activated'}</Label>

      <Card x={340} y={50} w={230} h={390} />
      <Mol
        smiles={ARENE_SMILES.meta3Nitro}
        x={455}
        y={190}
        scale={40}
        showLonePairs
        overlay={outwardCharges(ARENE_SMILES.meta3Nitro, 40, sites, MINUS)}
      />
      <Label x={455} y={374}>NO₂ at C3, meta to Cl</Label>
      {meta.map((t, i) => (
        <Label key={`m${i}`} x={455} y={398 + i * 18}>{t}</Label>
      ))}
      <Label x={455} y={436}>{nitroVerdict(3).activated ? 'activated' : 'not activated'}</Label>
      <Label x={W / 2} y={462}>Charge on the nitro carbon is stabilised; a meta nitro never gets it.</Label>
    </>
  )
}

function Step4() {
  const ortho = [2, 6]
  const para = [4]
  return (
    <>
      <Label x={W / 2} y={28}>Bromobenzene: an electrophile enters o and p</Label>
      <Mol
        smiles={ARENE_SMILES.bromobenzene}
        x={290}
        y={128}
        scale={56}
        showLonePairs
        highlightAtoms={[...ortho, ...para]}
        partialCharges={[
          ...ortho.map((a) => ({ atom: a, label: 'o' })),
          ...para.map((a) => ({ atom: a, label: 'p' })),
        ]}
      />
      <Label x={W / 2} y={236} muted>−I effect: the halogen pulls electrons out (slower)</Label>
      <Label x={W / 2} y={260} muted>+R effect: lone pairs push electrons to o and p</Label>
      <Label x={W / 2} y={296}>conc. HNO₃ / conc. H₂SO₄</Label>
      <Mol smiles={ARENE_SMILES.bromo4Nitro} x={150} y={356} scale={38} showLonePairs />
      <Mol smiles={ARENE_SMILES.bromo2Nitro} x={430} y={356} scale={38} showLonePairs />
      <Label x={150} y={440}>major</Label>
      <Label x={430} y={440}>minor</Label>
      <Label x={150} y={466}>{ARENE_NAMES.bromo4Nitro}</Label>
      <Label x={430} y={466}>{ARENE_NAMES.bromo2Nitro}</Label>
    </>
  )
}

function Step5() {
  return (
    <>
      <Label x={W / 2} y={28}>Sodium couples carbon fragments in dry ether</Label>
      <Mol smiles={ARENE_SMILES.chlorobenzene} x={92} y={112} scale={38} showLonePairs />
      <Label x={202} y={120}>+</Label>
      <Mol smiles={ARENE_SMILES.chloroethane} x={254} y={112} scale={38} showLonePairs />
      <line x1={330} y1={112} x2={376} y2={112} stroke="var(--fg-muted)" strokeWidth={2} />
      <Label x={353} y={96}>2 Na</Label>
      <Mol smiles={ARENE_SMILES.ethylbenzene} x={478} y={112} scale={38} />
      <Label x={W / 2} y={190}>Wurtz–Fittig: a ring bonds to a chain</Label>
      <Mol smiles={ARENE_SMILES.bromobenzene} x={110} y={262} scale={38} showLonePairs />
      <Label x={216} y={270}>+</Label>
      <Mol smiles={ARENE_SMILES.bromobenzene} x={290} y={262} scale={38} showLonePairs />
      <line x1={290} y1={298} x2={290} y2={326} stroke="var(--fg-muted)" strokeWidth={2} />
      <Label x={312} y={318} anchor="start">2 Na</Label>
      <Mol smiles={ARENE_SMILES.biphenyl} x={290} y={386} scale={38} />
      <Label x={W / 2} y={446}>{formulaOf(ARENE_SMILES.biphenyl)}</Label>
      <Label x={W / 2} y={470}>Fittig: each C–X bond breaks; one new C–C bond forms.</Label>
    </>
  )
}

const STEPS = [Step0, Step1, Step2, Step3, Step4, Step5] as const

/** Scrolly panel for Section 6.7.2: one drawing per Step, all from the lead libs and the shared organic set. */
export function HaloareneReactivity({ step, reducedMotion }: HaloareneReactivityProps) {
  const index = Math.min(Math.max(Math.trunc(step), 0), ARENE_STEP_COUNT - 1)
  const Scene = STEPS[index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Reactions of haloarenes, drawn one Step at a time"
      style={{ width: '100%', height: 'auto', display: 'block', transition: reducedMotion ? 'none' : 'opacity 0.5s ease' }}
    >
      <Scene />
    </svg>
  )
}
