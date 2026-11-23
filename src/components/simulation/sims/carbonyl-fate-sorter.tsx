'use client'

import { useState } from 'react'
import { Segmented, type SegmentedOption } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { BenzeneRing, type RingSubstituent, SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  CARBONYLS,
  CONDITIONS,
  alphaHydrogenCaption,
  carbonylById,
  carbonylName,
  formulaOf,
  outcomeOf,
  productsOf,
  type CarbonylId,
  type ConditionId,
  type Outcome,
  type Product,
} from '@/lib/chem/carbonyl-fate'
import styles from './carbonyl-fate-sorter.module.css'

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
/** Formula text with subscript digits and a superscript charge, e.g. C7H5O2- to C₇H₅O₂⁻. */
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d]).replace(/-$/, '⁻')

const VERDICT: Record<Outcome, { title: string; sentence: string; caption: string }> = {
  cannizzaro: {
    title: 'Cannizzaro reaction',
    sentence: 'Half the aldehyde is reduced to an alcohol and half is oxidised to a carboxylate salt.',
    caption: 'Two molecules: one is reduced, one is oxidised',
  },
  'meta-substitution': {
    title: 'Ring substitution, meta',
    sentence: 'The nitro group enters the ring at the meta position to the C=O group.',
    caption: 'NO₂ goes meta to the C=O group',
  },
  none: {
    title: 'No reaction in this Section',
    sentence: 'None of the reactions in this Section applies to this compound under this condition.',
    caption: 'No reaction from this Section',
  },
}

/** The nitro product's ring: CHO at position 1, NO₂ (condensed) at position 3, meta to it. */
const NITRO_RING: readonly RingSubstituent[] = [
  { position: 1, label: 'CHO' },
  { position: 3, label: 'NO₂' },
]

const COMPOUND_OPTIONS: readonly SegmentedOption<CarbonylId>[] = CARBONYLS.map((c) => ({ value: c.id, label: carbonylName(c) }))
const CONDITION_OPTIONS: readonly SegmentedOption<ConditionId>[] = CONDITIONS.map((c) => ({ value: c.id, label: c.label }))

function ProductBlock({ p, x, y }: { p: Product; x: number; y: number }) {
  const label = p.name ?? (p.role === 'nitro' ? 'nitro product' : 'carboxylate salt')
  // The nitro ring is the NCERT-style ring, so NO₂ is a condensed label on the meta carbon. Its name sits below the ring.
  const nitro = p.role === 'nitro'
  return (
    <g>
      {p.condensed ? (
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontFamily="var(--font-sans)" fill="var(--fg)">
          {p.condensed}
        </text>
      ) : nitro ? (
        <BenzeneRing variant="kekule" substituents={NITRO_RING} x={x + 40} y={y} />
      ) : (
        <SkeletalFormula graph={parseSmiles(p.smiles)} scale={40} x={x} y={y} />
      )}
      <text x={x} y={y + (nitro ? 120 : 62)} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {label}
      </text>
      <text x={x} y={y + (nitro ? 144 : 86)} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {subscript(p.formula)}
      </text>
    </g>
  )
}

export function CarbonylFateSorter() {
  const [compoundId, setCompoundId] = useState<CarbonylId>('benzaldehyde')
  const [conditionId, setConditionId] = useState<ConditionId>('conc-alkali')

  const compound = carbonylById(compoundId)
  const conditionLabel = CONDITIONS.find((c) => c.id === conditionId)?.label ?? ''
  const outcome = outcomeOf(compound, conditionId)
  const products = productsOf(compound, conditionId)
  const name = carbonylName(compound)
  // Alpha-H compounds in concentrated alkali: no Cannizzaro reaction, so the verdict names the aldol route instead.
  const alpha = outcome === 'none' && conditionId === 'conc-alkali' && compound.alphaH
  const verdict = alpha
    ? { title: 'No Cannizzaro reaction', sentence: alphaHydrogenCaption(compound).join(' '), lines: alphaHydrogenCaption(compound) }
    : { ...VERDICT[outcome], lines: [VERDICT[outcome].caption] }
  const summary = `${name} with ${conditionLabel}: ${verdict.title}. ${verdict.sentence}`

  return (
    <div className={styles.root} data-testid="carbonyl-fate-sorter">
      <figure className={styles.stage}>
        <svg viewBox="0 0 560 430" role="img" aria-label={summary} className={styles.drawing} data-testid="carbonyl-fate-drawing">
          {compound.condensed ? (
            <text x={100} y={150} textAnchor="middle" dominantBaseline="middle" fontSize={26} fontFamily="var(--font-sans)" fill="var(--fg)">
              {compound.condensed}
            </text>
          ) : (
            <SkeletalFormula graph={parseSmiles(compound.smiles)} scale={40} x={100} y={150} />
          )}
          <text x={100} y={232} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {name}
          </text>
          <text x={100} y={256} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {subscript(formulaOf(compound.smiles))}
          </text>

          <line x1={200} y1={150} x2={290} y2={150} stroke="var(--fg-muted)" strokeWidth={2} />
          <polygon points="296,150 282,144 282,156" fill="var(--fg-muted)" />
          <text x={272} y={132} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {conditionLabel}
          </text>

          {products.length === 0 ? (
            <text x={435} y={150} textAnchor="middle" dominantBaseline="middle" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {alpha ? 'no Cannizzaro reaction' : 'no product'}
            </text>
          ) : (
            products.map((p, i) => <ProductBlock key={p.smiles} p={p} x={p.role === 'nitro' ? 400 : 435} y={p.role === 'nitro' ? 160 : i === 0 ? 120 : 270} />)
          )}

          {verdict.lines.map((line, i) => (
            <text key={line} x={280} y={380 + i * 20} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
              {line}
            </text>
          ))}
        </svg>
      </figure>

      <p className={styles.verdict} aria-live="polite">
        <strong>{verdict.title}.</strong> {verdict.sentence}
      </p>

      <SimulationControls>
        <Segmented<CarbonylId> label="Carbonyl compound" options={COMPOUND_OPTIONS} value={compoundId} onChange={setCompoundId} />
        <Segmented<ConditionId> label="Condition" options={CONDITION_OPTIONS} value={conditionId} onChange={setConditionId} />
      </SimulationControls>
    </div>
  )
}
