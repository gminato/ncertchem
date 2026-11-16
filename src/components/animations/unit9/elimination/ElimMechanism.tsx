'use client'

import React from 'react'
import { CurvedArrow, SkeletalFormula } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { eliminationFacts, alkyneReductions, ARROWS_BY_STEP, ELIMINATION_STEP_KINDS, type EliminationStepKind, type MechanismArrow } from './elimination-steps'
import styles from './Elimination.module.css'

export interface ElimMechanismProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 470
const FONT = 'var(--font-sans)'
const BOND = 'var(--fg)'
const SHRINK = 15

/** Bromoethane, drawn with its hydrogens in the cross layout of NCERT 9.34. */
const CB = { x: 170, y: 235 }
const CA = { x: 330, y: 235 }
const BR = { x: 480, y: 235 }
const H_LEFT = { x: 90, y: 235 }
const H_UP_B = { x: 170, y: 125 }
const H_DOWN_B = { x: 170, y: 345 }
const H_UP_A = { x: 330, y: 125 }
const H_DOWN_A = { x: 330, y: 345 }

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={44} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly React.ReactNode[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={VIEW_WIDTH / 2}
          y={VIEW_HEIGHT - 44 + i * 24}
          textAnchor="middle"
          fontSize={16}
          fontWeight={500}
          fontFamily={FONT}
          fill="var(--fg-muted)"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/** A bond between two points, shortened at each end so the labels keep clear of the line. */
function Bond({ a, b, shrinkA = SHRINK, shrinkB = SHRINK, offset = 0 }: { a: { x: number; y: number }; b: { x: number; y: number }; shrinkA?: number; shrinkB?: number; offset?: number }) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const nx = -uy * offset
  const ny = ux * offset
  return (
    <line
      x1={a.x + ux * shrinkA + nx}
      y1={a.y + uy * shrinkA + ny}
      x2={b.x - ux * shrinkB + nx}
      y2={b.y - uy * shrinkB + ny}
      stroke={BOND}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  )
}

function Atom({ at, text, colour = 'var(--fg)', size = 26 }: { at: { x: number; y: number }; text: string; colour?: string; size?: number }) {
  return (
    <text x={at.x} y={at.y + size * 0.36} textAnchor="middle" fontSize={size} fontWeight={600} fontFamily={FONT} fill={colour}>
      {text}
    </text>
  )
}

function Tag({ at, text }: { at: { x: number; y: number }; text: string }) {
  return (
    <text x={at.x} y={at.y} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
      {text}
    </text>
  )
}

/** Bromoethane as the mechanism draws it: β-carbon left, α-carbon carrying Br on the right. */
function Bromoethane({ withBetaH, polar, fadedH = false }: { withBetaH: boolean; polar: boolean; fadedH?: boolean }) {
  return (
    <g>
      <Bond a={CB} b={CA} />
      <Bond a={CA} b={BR} shrinkB={20} />
      <Bond a={CB} b={H_LEFT} shrinkA={SHRINK} shrinkB={SHRINK} />
      <Bond a={CB} b={H_UP_B} />
      <Bond a={CB} b={H_DOWN_B} />
      <Bond a={CA} b={H_UP_A} />
      <Bond a={CA} b={H_DOWN_A} />
      {withBetaH && <circle cx={H_UP_B.x} cy={H_UP_B.y} r={24} fill="var(--highlight)" opacity={0.55} />}
      <Atom at={CB} text="C" />
      <Atom at={CA} text="C" />
      <Atom at={BR} text="Br" colour="var(--atom-hal)" />
      <Atom at={H_LEFT} text="H" />
      <g opacity={fadedH ? 0.35 : 1}>
        <Atom at={H_UP_B} text="H" />
      </g>
      <Atom at={H_DOWN_B} text="H" />
      <Atom at={H_UP_A} text="H" />
      <Atom at={H_DOWN_A} text="H" />
      {polar && (
        <g>
          <text x={CA.x + 28} y={CA.y - 58} fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--delta-plus)">
            δ+
          </text>
          <text x={BR.x + 6} y={BR.y - 46} fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--delta-minus)">
            δ−
          </text>
        </g>
      )}
      <Tag at={{ x: CB.x, y: 390 }} text="β-carbon" />
      <Tag at={{ x: CA.x, y: 390 }} text="α-carbon" />
    </g>
  )
}

/** Step 1: the polar C–Br bond, with the α- and β-carbons named. */
function PolarStep() {
  return (
    <g>
      <Title>Bromoethane: the C–Br bond is polar</Title>
      <Bromoethane withBetaH={false} polar />
      <Caption lines={['Br pulls the shared pair, so α-carbon is δ+ and Br is δ−.', 'Hydrogens on the β-carbon are β-hydrogens: they can leave.']} />
    </g>
  )
}

/** Step 2: the base takes one β-hydrogen (the curved arrow starts at the base's lone pair). */
function BaseStep() {
  return (
    <g>
      <Title>The base takes a β-hydrogen</Title>
      <Bromoethane withBetaH polar={false} />
      <text x={112} y={80} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        OH⁻
      </text>
      <CurvedArrow from={{ x: 128, y: 92 }} to={{ x: 160, y: 112 }} bend={0.3} kind="pair" gap={4} />
      <text x={212} y={122} fontSize={18} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
        β-H
      </text>
      <Caption lines={['Alcoholic KOH supplies OH⁻, whose lone pair takes the β-H.', 'The C–H electron pair stays behind for the next step.']} />
    </g>
  )
}

/** Step 3: the concerted shift: the C–H pair forms the π bond as the C–Br pair goes to Br. */
function ConcertedStep() {
  return (
    <g>
      <Title>The π bond forms as Br leaves</Title>
      <Bromoethane withBetaH={false} polar={false} fadedH />
      <text x={112} y={80} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        OH⁻
      </text>
      <CurvedArrow from={{ x: 128, y: 92 }} to={{ x: 160, y: 112 }} bend={0.3} kind="pair" gap={4} />
      <CurvedArrow from={{ x: 184, y: 186 }} to={{ x: 252, y: 214 }} bend={0.4} kind="pair" gap={4} />
      <CurvedArrow from={{ x: 404, y: 214 }} to={{ x: 466, y: 214 }} bend={0.4} kind="pair" gap={4} />
      <text x={BR.x + 4} y={BR.y - 56} fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--atom-hal)">
        Br⁻
      </text>
      <Caption lines={['Base, C–H pair and C–Br pair all move in one step.', 'The new π bond forms between the two carbons; Br⁻ leaves.']} />
    </g>
  )
}

/** Ethene drawn with its four hydrogens, centred on (x, y): the C=C is double, the H's sit at 120°. */
function Ethene({ x, y, colour = 'var(--fg)', spread = 1 }: { x: number; y: number; colour?: string; spread?: number }) {
  const a = { x: x - 44 * spread, y }
  const b = { x: x + 44 * spread, y }
  const hs = [
    { x: x - 104 * spread, y: y - 80 },
    { x: x - 104 * spread, y: y + 80 },
    { x: x + 104 * spread, y: y - 80 },
    { x: x + 104 * spread, y: y + 80 },
  ]
  return (
    <g>
      <Bond a={a} b={b} offset={5} shrinkA={16} shrinkB={16} />
      <Bond a={a} b={b} offset={-5} shrinkA={16} shrinkB={16} />
      <Bond a={a} b={hs[0]} />
      <Bond a={a} b={hs[1]} />
      <Bond a={b} b={hs[2]} />
      <Bond a={b} b={hs[3]} />
      <Atom at={a} text="C" colour={colour} />
      <Atom at={b} text="C" colour={colour} />
      {hs.map((h, i) => (
        <Atom key={i} at={h} text="H" colour={colour} />
      ))}
    </g>
  )
}

/** Step 4: the product, ethene, with the salt and water that leave with it. */
function EtheneStep() {
  const facts = eliminationFacts()
  const outcome = facts.bromoethane
  const name = outcome.kind === 'reaction' ? outcome.reaction.products[0].name : 'ethene'
  return (
    <g>
      <Title>Ethene: a C=C bond, with KBr and water</Title>
      <Ethene x={230} y={235} />
      <text x={440} y={222} fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        + KBr
      </text>
      <text x={440} y={262} fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        + H₂O
      </text>
      <Caption lines={[`Product: ${name}, with KBr and water.`, 'The H and Br left from neighbouring carbons: C=C forms.']} />
    </g>
  )
}

/** Step 5: the vicinal dihalide with zinc: both halogens leave as ZnBr2 and ethene forms. */
function DihalideStep() {
  const facts = eliminationFacts()
  const outcome = facts.dibromoethane
  const name = outcome.kind === 'reaction' ? outcome.reaction.products[0].name : 'ethene'
  const c1 = { x: 96, y: 235 }
  const c2 = { x: 176, y: 235 }
  const br1 = { x: 30, y: 235 }
  const br2 = { x: 242, y: 235 }
  return (
    <g>
      <Title>Zinc removes two halogens from neighbours</Title>
      <Bond a={br1} b={c1} shrinkB={SHRINK} shrinkA={20} />
      <Bond a={c1} b={c2} />
      <Bond a={c2} b={br2} shrinkA={SHRINK} shrinkB={20} />
      <Bond a={c1} b={{ x: 96, y: 160 }} />
      <Bond a={c1} b={{ x: 96, y: 310 }} />
      <Bond a={c2} b={{ x: 176, y: 160 }} />
      <Bond a={c2} b={{ x: 176, y: 310 }} />
      <Atom at={br1} text="Br" colour="var(--atom-hal)" />
      <Atom at={br2} text="Br" colour="var(--atom-hal)" />
      <Atom at={c1} text="C" />
      <Atom at={c2} text="C" />
      <Atom at={{ x: 96, y: 160 }} text="H" />
      <Atom at={{ x: 96, y: 310 }} text="H" />
      <Atom at={{ x: 176, y: 160 }} text="H" />
      <Atom at={{ x: 176, y: 310 }} text="H" />
      <text x={290} y={242} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        + Zn
      </text>
      <line x1={318} y1={235} x2={356} y2={235} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 348 228 L 358 235 L 348 242" fill="none" stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={337} y={265} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
        ZnBr₂
      </text>
      <Ethene x={450} y={235} spread={0.8} />
      <Caption lines={[`Zn takes both halogens away as ZnBr₂. Product: ${name}.`, 'A single C–X bond gives no alkene this way.']} />
    </g>
  )
}

/** Step 6: an alcohol with conc. H2SO4: the –OH leaves as water and a β-hydrogen goes with it. */
function AlcoholStep() {
  const facts = eliminationFacts()
  const outcome = facts.ethanol
  const name = outcome.kind === 'reaction' ? outcome.reaction.products[0].name : 'ethene'
  const cb = { x: 95, y: 235 }
  const ca = { x: 190, y: 235 }
  const o = { x: 285, y: 235 }
  return (
    <g>
      <Title>Alcohol with conc. H₂SO₄: water leaves</Title>
      <Bond a={cb} b={ca} />
      <Bond a={ca} b={o} shrinkB={22} />
      <Bond a={cb} b={{ x: 40, y: 235 }} />
      <Bond a={cb} b={{ x: 95, y: 160 }} />
      <Bond a={cb} b={{ x: 95, y: 310 }} />
      <Bond a={ca} b={{ x: 190, y: 160 }} />
      <Bond a={ca} b={{ x: 190, y: 310 }} />
      <Atom at={{ x: 40, y: 235 }} text="H" />
      <Atom at={{ x: 95, y: 160 }} text="H" />
      <Atom at={{ x: 95, y: 310 }} text="H" />
      <Atom at={{ x: 190, y: 160 }} text="H" />
      <Atom at={{ x: 190, y: 310 }} text="H" />
      <Atom at={cb} text="C" />
      <Atom at={ca} text="C" />
      <Atom at={o} text="OH" colour="var(--atom-o)" />
      <text x={338} y={206} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
        conc. H₂SO₄
      </text>
      <line x1={312} y1={235} x2={356} y2={235} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 348 228 L 358 235 L 348 242" fill="none" stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={334} y={262} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        heat
      </text>
      <Ethene x={460} y={235} spread={0.8} />
      <text x={460} y={336} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        + H₂O
      </text>
      <Caption lines={[`Acid makes –OH a leaving group: water leaves. Product: ${name}.`, 'A β-hydrogen leaves with the –OH, so the C=C forms.']} />
    </g>
  )
}

/** Step 7: but-2-yne (linear, drawn by hand) with each reagent: Lindlar gives cis, sodium in ammonia trans. */
function AlkyneStep() {
  const { lindlar, sodiumAmmonia } = alkyneReductions()
  const row = (y: number, reagent: string, product: MolGraph, label: string) => (
    <g>
      <text x={46} y={y + 9} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH₃
      </text>
      <Bond a={{ x: 70, y }} b={{ x: 110, y }} shrinkA={0} shrinkB={0} />
      <Bond a={{ x: 110, y: y - 6 }} b={{ x: 190, y: y - 6 }} shrinkA={6} shrinkB={6} />
      <Bond a={{ x: 110, y }} b={{ x: 190, y }} shrinkA={6} shrinkB={6} />
      <Bond a={{ x: 110, y: y + 6 }} b={{ x: 190, y: y + 6 }} shrinkA={6} shrinkB={6} />
      <Bond a={{ x: 190, y }} b={{ x: 214, y }} shrinkA={0} shrinkB={0} />
      <text x={238} y={y + 9} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH₃
      </text>
      <text x={150} y={y + 40} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        but-2-yne
      </text>
      <line x1={270} y1={y} x2={322} y2={y} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M 314 ${y - 7} L 324 ${y} L 314 ${y + 7}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={296} y={y - 14} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        {reagent}
      </text>
      <Mol graph={product} x={430} y={y} scale={50} />
      <text x={430} y={y + 72} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {label}
      </text>
    </g>
  )
  return (
    <g>
      <Title>Alkynes: the reagent sets the geometry</Title>
      {row(150, 'H₂, Lindlar', lindlar.products[0].graph, lindlar.products[0].name)}
      {row(320, 'Na, liq. NH₃', sodiumAmmonia.products[0].graph, sodiumAmmonia.products[0].name)}
      <Caption lines={['Lindlar: both H add to one side of the triple bond, so cis.', 'Na in liquid NH₃ gives the trans alkene from the same alkyne.']} />
    </g>
  )
}

/** A skeletal drawing centred on (x, y) at the given scale. */
function Mol({ graph, x, y, scale }: { graph: MolGraph; x: number; y: number; scale: number }) {
  return <SkeletalFormula graph={graph} scale={scale} x={x} y={y} />
}

function renderStep(kind: EliminationStepKind): React.ReactNode {
  switch (kind) {
    case 'polar':
      return <PolarStep />
    case 'base':
      return <BaseStep />
    case 'concerted':
      return <ConcertedStep />
    case 'ethene':
      return <EtheneStep />
    case 'dihalide':
      return <DihalideStep />
    case 'alcohol':
      return <AlcoholStep />
    case 'alkynes':
      return <AlkyneStep />
  }
}

const ARROW_TEXT: Record<MechanismArrow, string> = {
  'base-to-H': 'base takes H',
  'CH-to-pi': 'C–H pair to π',
  'CBr-to-Br': 'C–Br pair to Br',
}

/**
 * The elimination Scrolly visual (Section 9.3.4). Steps 1 to 7: polarity, the base, the concerted
 * E2 shift, ethene, zinc on a dihalide, an alcohol with conc. H2SO4, and the two alkyne reductions.
 * Names and products come from the lib (elimination-steps.ts and the alkene maker).
 */
export function ElimMechanism({ step, reducedMotion }: ElimMechanismProps) {
  const index = Math.min(ELIMINATION_STEP_KINDS.length - 1, Math.max(0, Math.round(step)))
  const kind = ELIMINATION_STEP_KINDS[index]
  const arrows = ARROWS_BY_STEP[kind]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={ariaFor(kind, arrows)}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="elimination"
      data-step={index}
    >
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}

function ariaFor(kind: EliminationStepKind, arrows: readonly MechanismArrow[]): string {
  const subject = 'Bromoethane, CH3CH2Br'
  const shown = arrows.length === 0 ? '' : ` Arrows: ${arrows.map((a) => ARROW_TEXT[a]).join('; ')}.`
  switch (kind) {
    case 'polar':
      return `${subject}. The C–Br bond is polar: the carbon next to Br is delta plus and Br is delta minus.`
    case 'base':
      return `${subject}. A base takes a hydrogen from the beta-carbon.${shown}`
    case 'concerted':
      return `${subject}. The base removes the beta-hydrogen, the C–H pair forms a pi bond and the bromide leaves together.${shown}`
    case 'ethene':
      return 'Ethene, with KBr and water as the other products of the elimination.'
    case 'dihalide':
      return '1,2-dibromoethane and zinc give ethene and zinc bromide.'
    case 'alcohol':
      return 'Ethanol with conc. sulphuric acid and heat gives ethene and water.'
    case 'alkynes':
      return 'But-2-yne with Lindlar catalyst gives cis-but-2-ene; with sodium in liquid ammonia it gives trans-but-2-ene.'
  }
}
