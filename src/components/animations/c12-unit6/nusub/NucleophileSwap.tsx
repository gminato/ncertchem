'use client'

import { SkeletalFormula, skeletalFrame } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  AGCN_ROW,
  AGNO2_ROW,
  CARBON_ATOM,
  CAROUSEL,
  CYANIDE_FORMS,
  ETHYL_NITRITE,
  HALOGEN_ATOM,
  ISOCYANIDE,
  KCN_ROW,
  KNO2_ROW,
  NITRILE,
  NITRITE_SMILES,
  NITROETHANE,
  SUBSTRATE_SMILES,
} from './nusub-steps'

export interface NucleophileSwapProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 400
const CAPTION_Y = 378
const MAIN = 16
const SECONDARY = 15

type Graph = ReturnType<typeof parseSmiles>
interface Point {
  x: number
  y: number
}

const SUB_GRAPH = parseSmiles(SUBSTRATE_SMILES)

/** Pixel position of atom i when a skeletal drawing is centred at (cx, cy). */
function atomAt(g: Graph, scale: number, cx: number, cy: number, i: number): Point {
  const p = skeletalFrame(g, scale).points[i]
  return { x: cx + p.x, y: cy + p.y }
}

function Arrow({ x1, y1, x2, y2, dashed = false }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const head = 9
  const bx = x2 - head * Math.cos(a)
  const by = y2 - head * Math.sin(a)
  const px = -Math.sin(a) * (head / 2)
  const py = Math.cos(a) * (head / 2)
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        stroke="var(--fg-muted)"
        strokeWidth={2}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill="var(--fg-muted)" />
    </g>
  )
}

function Caption({ children }: { children: string }) {
  return (
    <text x={W / 2} y={CAPTION_Y} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
      {children}
    </text>
  )
}

function StepSubstrate() {
  const cx = 290
  const cy = 190
  const c = atomAt(SUB_GRAPH, 60, cx, cy, CARBON_ATOM)
  return (
    <g>
      <SkeletalFormula
        graph={SUB_GRAPH}
        scale={60}
        x={cx}
        y={cy}
        partialCharges={[
          { atom: CARBON_ATOM, label: 'δ⁺' },
          { atom: HALOGEN_ATOM, label: 'δ⁻' },
        ]}
      />
      <Caption>The C–Br bond is polar: carbon δ⁺, bromine δ⁻</Caption>
    </g>
  )
}

function StepApproach() {
  const cx = 340
  const cy = 190
  const c = atomAt(SUB_GRAPH, 56, cx, cy, CARBON_ATOM)
  const nuX = 120
  const nuY = 190
  return (
    <g>
      <text x={nuX} y={nuY + 6} textAnchor="middle" fontSize={MAIN + 2} fill={ROLE_TONE.nucleophile}>
        Nu⁻
      </text>
      <circle cx={nuX + 26} cy={nuY - 7} r={2.8} fill={ROLE_TONE.nucleophile} />
      <circle cx={nuX + 26} cy={nuY + 7} r={2.8} fill={ROLE_TONE.nucleophile} />
      <Arrow x1={nuX + 42} y1={nuY} x2={c.x - 26} y2={c.y} dashed />
      <SkeletalFormula
        graph={SUB_GRAPH}
        scale={56}
        x={cx}
        y={cy}
        partialCharges={[
          { atom: CARBON_ATOM, label: 'δ⁺' },
          { atom: HALOGEN_ATOM, label: 'δ⁻' },
        ]}
      />
      <text x={c.x} y={c.y + 40} textAnchor="middle" fontSize={MAIN} fill={ROLE_TONE.electrophilicCarbon}>
        C
      </text>
      <Caption>The lone pair points at the δ⁺ carbon; the C–Br bond is still whole</Caption>
    </g>
  )
}

function StepCarousel() {
  const rows = [62, 150, 238, 326]
  return (
    <g>
      <SkeletalFormula graph={SUB_GRAPH} scale={38} x={78} y={205} />
      {CAROUSEL.map((item, k) => {
        const y = rows[k]
        return (
          <g key={item.product.smiles}>
            <Arrow x1={130} y1={205} x2={160} y2={y} />
            <text x={165} y={y + 5} fontSize={MAIN} fill={ROLE_TONE.nucleophile}>
              {item.reagent.split(' (')[0]}
            </text>
            <Arrow x1={250} y1={y} x2={284} y2={y} />
            <SkeletalFormula graph={parseSmiles(item.product.smiles)} scale={38} x={330} y={y} />
            <text x={402} y={y - 2} fontSize={MAIN} fill="var(--fg)">
              {item.product.name ?? item.product.formula}
            </text>
            <text x={402} y={y + 18} fontSize={SECONDARY} fill="var(--fg-muted)">
              {item.productClass}
            </text>
          </g>
        )
      })}
      <Caption>Bromoethane stays; the reagent decides the product</Caption>
    </g>
  )
}

function StepCyanide() {
  const top = 105
  return (
    <g>
      <text x={W / 2} y={34} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        Cyanide: two contributing structures
      </text>
      <SkeletalFormula graph={parseSmiles(CYANIDE_FORMS[0])} scale={38} x={150} y={top} showLonePairs />
      <text x={290} y={top + 6} textAnchor="middle" fontSize={MAIN + 4} fill="var(--fg-muted)">
        ↔
      </text>
      <SkeletalFormula graph={parseSmiles(CYANIDE_FORMS[1])} scale={38} x={430} y={top} showLonePairs />
      <text x={150} y={top + 62} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        lone pair on C
      </text>
      <text x={430} y={top + 62} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        lone pair on N
      </text>
      <Arrow x1={160} y1={270} x2={232} y2={270} />
      <text x={196} y={250} textAnchor="middle" fontSize={SECONDARY} fill={ROLE_TONE.nucleophile}>
        KCN, through C
      </text>
      <SkeletalFormula graph={SUB_GRAPH} scale={38} x={100} y={270} />
      <SkeletalFormula graph={parseSmiles(NITRILE.smiles)} scale={38} x={380} y={270} />
      <text x={380} y={322} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        {NITRILE.name}
      </text>
      <text x={380} y={342} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${formulaUnicode(NITRILE.formula)} · ${KCN_ROW.productClass.toLowerCase()}`}
      </text>
      <Caption>The free cyanide ion attacks through carbon</Caption>
    </g>
  )
}

function StepIsocyanide() {
  return (
    <g>
      <text x={W / 2} y={34} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        Same ion, other end: AgCN attacks through N
      </text>
      <SkeletalFormula graph={parseSmiles(NITRILE.smiles)} scale={38} x={150} y={160} />
      <text x={150} y={250} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        {NITRILE.name}
      </text>
      <text x={150} y={272} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${formulaUnicode(NITRILE.formula)} · ${KCN_ROW.productClass.toLowerCase()}`}
      </text>
      <text x={290} y={166} textAnchor="middle" fontSize={MAIN + 4} fill="var(--fg-muted)">
        vs
      </text>
      <SkeletalFormula graph={parseSmiles(ISOCYANIDE.smiles)} scale={38} x={430} y={160} />
      <text x={430} y={250} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        isocyanide
      </text>
      <text x={430} y={272} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${formulaUnicode(ISOCYANIDE.formula)} · ${AGCN_ROW.productClass.toLowerCase()}`}
      </text>
      <text x={290} y={320} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg)">
        Same atoms, same formula, joined in a different way
      </text>
      <Caption>AgCN is mainly covalent, so its nitrogen end is free to attack</Caption>
    </g>
  )
}

function StepNitrite() {
  return (
    <g>
      <text x={W / 2} y={34} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        Nitrite: two doors
      </text>
      <SkeletalFormula graph={parseSmiles(NITRITE_SMILES)} scale={38} x={290} y={84} showLonePairs />
      <text x={290} y={160} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${KNO2_ROW.reagent} (O)  ·  ${AGNO2_ROW.reagent} (N)`}
      </text>
      <Arrow x1={246} y1={172} x2={182} y2={212} />
      <Arrow x1={334} y1={172} x2={398} y2={212} />
      <text x={200} y={196} textAnchor="end" fontSize={SECONDARY} fill={ROLE_TONE.nucleophile}>
        through O
      </text>
      <text x={380} y={196} textAnchor="start" fontSize={SECONDARY} fill={ROLE_TONE.nucleophile}>
        through N
      </text>
      <SkeletalFormula graph={parseSmiles(ETHYL_NITRITE.smiles)} scale={38} x={140} y={250} showLonePairs />
      <text x={140} y={322} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        {KNO2_ROW.productClass.toLowerCase()}
      </text>
      <text x={140} y={342} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${formulaUnicode(ETHYL_NITRITE.formula)} · ${KNO2_ROW.product}`}
      </text>
      <SkeletalFormula graph={parseSmiles(NITROETHANE.smiles)} scale={38} x={440} y={250} showLonePairs />
      <text x={440} y={322} textAnchor="middle" fontSize={MAIN} fill="var(--fg)">
        {NITROETHANE.name}
      </text>
      <text x={440} y={342} textAnchor="middle" fontSize={SECONDARY} fill="var(--fg-muted)">
        {`${formulaUnicode(NITROETHANE.formula)} · ${AGNO2_ROW.productClass.toLowerCase()}`}
      </text>
    </g>
  )
}

const STEPS = [StepSubstrate, StepApproach, StepCarousel, StepCyanide, StepIsocyanide, StepNitrite] as const

export function NucleophileSwap({ step }: NucleophileSwapProps) {
  const Step = STEPS[Math.min(Math.max(step, 0), STEPS.length - 1)]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Nucleophilic substitution on bromoethane, one Step at a time"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      fontFamily="var(--font-sans)"
    >
      <Step />
    </svg>
  )
}
