'use client'

import React from 'react'
import {
  IntermediateOrbital,
  InductiveChain,
  SkeletalFormula,
  deltaText,
  CurvedArrow,
  drawingFrame,
  subscriptDigits,
  type ResonanceContributor,
  type ResonanceHybrid,
} from '@/components/organic'
import { parseSmiles, toCondensed } from '@/lib/chem/molecule-parse'
import { resonanceSpecies } from '@/lib/chem/resonance-species'
import { ResonanceFigure } from './ResonanceFigure'
import { CHAIN_SMILES, cationLadder, inductiveNodes, type EffectStepKind } from './effects-steps'
import styles from './ElectronEffects.module.css'

export interface ElectronEffectsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
/** Vertical centre of the main drawing. */
const CENTRE_Y = 206
const FONT = 'var(--font-sans)'
const CATION_NAMES = ['tertiary', 'secondary', 'primary', 'methyl'] as const

/** The Steps in order (Section 8.7.4 to 8.7.9). */
const KINDS: readonly EffectStepKind[] = [
  'inductive',
  'carboxylate',
  'benzene',
  'donation',
  'withdrawal',
  'electromeric',
  'hyperconjugation',
]

/** The shared fade-in class, dropped under reduced motion so the Step is shown at once. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** Subscript digits in a condensed formula, e.g. CH3CH2 to CH₃CH₂. */
const sub = (text: string) => text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

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
          y={390 + i * 24}
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

/** One resonance figure: the forms of a species, with the curved arrows on the first form. */
function ResonanceDrawing({
  speciesId,
  count,
  scale,
  gap,
  arrows,
}: {
  speciesId: string
  count: number
  scale: number
  gap: number
  arrows: boolean
}) {
  const s = resonanceSpecies(speciesId)
  return (
    <ResonanceFigure
      speciesId={speciesId}
      count={count}
      scale={scale}
      gap={gap}
      arrows={arrows && s.pushes.length > 0 ? s.pushes[0] : undefined}
      showHybrid
      centreY={CENTRE_Y}
    />
  )
}

function InductiveStep() {
  return (
    <g>
      <Title>Inductive effect: a permanent pull along σ bonds</Title>
      <text x={VIEW_WIDTH / 2} y={96} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {sub(toCondensed(parseSmiles(CHAIN_SMILES)))}
      </text>
      <InductiveChain nodes={inductiveNodes()} spacing={84} x={VIEW_WIDTH / 2} y={CENTRE_Y + 4} />
      <Caption
        lines={[
          <React.Fragment key="a">Chlorine withdraws electrons (−I). The carbon next to it is {deltaText('δ+')}.</React.Fragment>,
          <React.Fragment key="b">
            Each bond further along is weaker: {deltaText('δδ+')}, then {deltaText('δδδ+')}, then none.
          </React.Fragment>,
        ]}
      />
    </g>
  )
}

/** Ethene with an H⁺ approaching C1, the π pair moving to C1, and the product CH₃–CH₂⁺ with the + on its carbon. */
function ElectromericStep() {
  const C1 = { x: 130, y: CENTRE_Y }
  const C2 = { x: 230, y: CENTRE_Y }
  const PA = { x: 400, y: CENTRE_Y }
  const PB = { x: 500, y: CENTRE_Y }
  const bond = (a: { x: number; y: number }, b: { x: number; y: number }, offset = 0) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const ux = (b.x - a.x) / len
    const uy = (b.y - a.y) / len
    const nx = -uy * offset
    const ny = ux * offset
    return { x1: a.x + ux * 16 + nx, y1: a.y + uy * 16 + ny, x2: b.x - ux * 16 + nx, y2: b.y - uy * 16 + ny }
  }
  const hs = (c: { x: number; y: number }, dx: number, ys: number[]) =>
    ys.map((dy) => ({ x: c.x + dx, y: c.y + dy }))
  const labelled = (x: number, y: number, text: string, extra?: React.ReactNode) => (
    <text x={x} y={y + 9} textAnchor="middle" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {text}
      {extra}
    </text>
  )
  const H = (p: { x: number; y: number }) => labelled(p.x, p.y, 'H')
  const hBonds = (c: { x: number; y: number }, list: { x: number; y: number }[]) =>
    list.map((h, i) => <line key={i} {...bond(c, h)} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />)
  const reactantH = [...hs(C1, -58, [-78, 78]), ...hs(C2, 58, [-78, 78])]
  const productH = [...hs(PA, -58, [-74, 74]), { x: PA.x, y: PA.y - 80 }, ...hs(PB, 58, [-74, 74])]
  const pi = { x: (C1.x + C2.x) / 2, y: C1.y }
  return (
    <g>
      <Title>Electromeric effect: a reagent starts the shift (+E)</Title>
      {/* reactant: H2C=CH2 with the four hydrogens */}
      <line {...bond(C1, C2, -5)} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <line {...bond(C1, C2, 5)} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      {hBonds(C1, reactantH.slice(0, 2))}
      {hBonds(C2, reactantH.slice(2))}
      {labelled(C1.x, C1.y, 'C')}
      {labelled(C2.x, C2.y, 'C')}
      {reactantH.map((h, i) => (
        <g key={`rh-${i}`}>{H(h)}</g>
      ))}
      {/* the H⁺ and the curved arrow from the π bond to C1 */}
      <text x={C1.x + 10} y={C1.y - 112} textAnchor="middle" fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        H⁺
      </text>
      <CurvedArrow from={{ x: pi.x - 6, y: pi.y - 18 }} to={{ x: C1.x + 10, y: C1.y - 22 }} bend={0.45} kind="pair" gap={4} />
      <text x={305} y={C1.y + 12} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="var(--fg-muted)">
        →
      </text>
      {/* product: CH3–CH2⁺, the + on the carbon */}
      <line {...bond(PA, PB)} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      {hBonds(PA, productH.slice(0, 3))}
      {hBonds(PB, productH.slice(3))}
      {labelled(PA.x, PA.y, 'C')}
      {labelled(
        PB.x,
        PB.y,
        'C',
        <tspan dx={2} dy={-14} fontSize={18}>
          ⁺
        </tspan>
      )}
      {productH.map((h, i) => (
        <g key={`ph-${i}`}>{H(h)}</g>
      ))}
      <text x={C1.x} y={CENTRE_Y + 118} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        ethene with a reagent
      </text>
      <text x={(PA.x + PB.x) / 2} y={CENTRE_Y + 118} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        ethyl cation, CH₃CH₂⁺
      </text>
      <Caption
        lines={[
          'The π pair moves to the carbon that takes the H⁺ (a curved arrow, +E).',
          'With no reagent near, the π pair stays put: the shift is temporary.',
        ]}
      />
    </g>
  )
}

function HyperconjugationStep() {
  const ladder = cationLadder()
  return (
    <g>
      <Title>Hyperconjugation in the ethyl cation</Title>
      <IntermediateOrbital kind="hyperconjugation" x={150} y={CENTRE_Y + 4} scale={58} />
      <g transform="translate(330, 118)">
        <text x={0} y={0} fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
          More α-H, more stable
        </text>
        {ladder.map((r, i) => (
          <g key={r.smiles} transform={`translate(0, ${40 + i * 56})`}>
            <text x={0} y={0} fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {r.label}
            </text>
            <text x={0} y={22} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
              {`${CATION_NAMES[i]}: ${r.alphaH} α-H`}
            </text>
          </g>
        ))}
      </g>
      <Caption
        lines={[
          'The C–H bonds of the methyl group overlap the empty p orbital.',
          'This spreads the + charge: no bond changes, so it is no-bond resonance.',
        ]}
      />
    </g>
  )
}

/**
 * The electron-effects Scrolly visual (Section 8.7.4). Steps 1 to 7 show the inductive chain,
 * resonance in acetate and benzene, +R in aniline, −R in nitrobenzene, the electromeric shift and
 * hyperconjugation. Each Step fades in; under reduced motion it is shown at once.
 */
export function ElectronEffects({ step, reducedMotion }: ElectronEffectsProps) {
  const index = Math.min(KINDS.length - 1, Math.max(0, Math.round(step)))
  const kind = KINDS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={ariaFor(kind)}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="electron-effects"
      data-step={index}
    >
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}

function renderStep(kind: EffectStepKind): React.ReactNode {
  switch (kind) {
    case 'inductive':
      return <InductiveStep />
    case 'carboxylate':
      return (
        <g>
          <Title>Acetate ion: the charge is shared by two oxygens</Title>
          <ResonanceDrawing speciesId="carboxylate" count={2} scale={46} gap={64} arrows />
          <Caption lines={['Two equal forms: the real ion is their hybrid, with each C–O bond 1½.', 'δ− marks the charge shared by the two oxygens.']} />
        </g>
      )
    case 'benzene':
      return (
        <g>
          <Title>Benzene: two equal Kekulé forms, one hybrid</Title>
          <ResonanceDrawing speciesId="benzene" count={2} scale={50} gap={72} arrows={false} />
          <Caption lines={['All six C–C bonds are equal, between a single and a double bond.', 'The hybrid is a hexagon with a circle inside the ring.']} />
        </g>
      )
    case 'donation':
      return (
        <g>
          <Title>Aniline: the NH₂ lone pair feeds the ring (+R)</Title>
          <ResonanceDrawing speciesId="aniline" count={3} scale={44} gap={60} arrows />
          <Caption lines={['Electron density rises at the ortho and para carbons: δ− there.', 'The ring is richer in electrons than benzene is.']} />
        </g>
      )
    case 'withdrawal':
      return (
        <g>
          <Title>Nitrobenzene: the ring feeds the NO₂ group (−R)</Title>
          <ResonanceDrawing speciesId="nitrobenzene" count={3} scale={44} gap={60} arrows />
          <Caption lines={['Electron density leaves the ortho and para carbons: δ+ there.', 'The positive carbons are where an electron-rich reagent attacks.']} />
        </g>
      )
    case 'electromeric':
      return <ElectromericStep />
    case 'hyperconjugation':
      return <HyperconjugationStep />
  }
}

function ariaFor(kind: EffectStepKind): string {
  switch (kind) {
    case 'inductive':
      return '1-chloropentane: chlorine pulls electrons along the chain, and the delta plus charge on each carbon fades with each bond'
    case 'carboxylate':
      return 'Acetate ion: two equal resonance forms joined by a double-headed arrow, curved arrows that move the charge, and the hybrid with each C-O bond 1.5 and delta minus on both oxygens'
    case 'benzene':
      return 'Benzene: two Kekule forms joined by a double-headed arrow, and the hybrid hexagon with an inscribed circle'
    case 'donation':
      return 'Aniline: the NH2 lone pair pushes electron density to the ortho and para carbons, shown as delta minus in the hybrid (+R)'
    case 'withdrawal':
      return 'Nitrobenzene: the ring pushes electron density into the nitro group, leaving delta plus on the ortho and para carbons (-R)'
    case 'electromeric':
      return 'Ethene with a hydrogen ion: the pi pair moves to the carbon that takes the ion, giving the ethyl cation'
    case 'hyperconjugation':
      return 'Ethyl cation: a C-H sigma bond overlaps the empty p orbital; a ladder shows that more alpha-hydrogens give a more stable carbocation'
  }
}
