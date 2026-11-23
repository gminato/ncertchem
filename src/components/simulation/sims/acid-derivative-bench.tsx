'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  BENCH_ACIDS,
  BENCH_REAGENTS,
  REAGENT_LABEL,
  acidSmiles,
  benchOutcome,
  highlightedBonds,
  type AcidId,
  type ReagentId,
} from '@/lib/chem/acid-derivative-bench'
import styles from './acid-derivative-bench.module.css'

/** Subscript digits in a formula, e.g. C4H8O2. */
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

/** One drawing scale for every structure, so an atom label renders at 14 units or more. */
const SCALE = 40
const VIEW_W = 560
const VIEW_H = 420
const CX = VIEW_W / 2

export function AcidDerivativeBench() {
  const [acid, setAcid] = useState<AcidId>('butanoic')
  const [reagent, setReagent] = useState<ReagentId>('socl2')

  const acidSmi = acidSmiles(acid)
  const acidGraph = useMemo(() => parseSmiles(acidSmi), [acidSmi])
  const acidName = unit8Name(acidSmi)
  const acidFormula = molecularFormula(acidGraph)

  const outcome = useMemo(() => benchOutcome(acid, reagent), [acid, reagent])
  const product = outcome.product
  const productGraph = useMemo(() => (outcome.product ? parseSmiles(outcome.product.smiles) : null), [outcome])
  const highlights = useMemo(() => highlightedBonds(acidGraph, outcome.bondBroken), [acidGraph, outcome])

  const reagentLabel = REAGENT_LABEL[reagent]
  const productText = product ? product.name : 'no reaction'
  const summary = `${acidName} with ${reagentLabel}: ${productText}. Bond broken: ${outcome.bondBroken}. Carbon count ${outcome.carbonsBefore} to ${outcome.carbonsAfter}. ${outcome.note}`
  const byProducts = outcome.byProducts.length ? outcome.byProducts.map(subscript).join(', ') : 'none'

  const productBox = productGraph ? skeletalBounds(productGraph, SCALE) : null

  return (
    <div className={styles.root} data-testid="acid-derivative-bench">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={summary} className={styles.drawing} data-testid="acid-derivative-drawing">
            <text x={CX} y={26} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {acidName}
            </text>
            <SkeletalFormula graph={acidGraph} scale={SCALE} x={CX} y={92} highlightBonds={highlights} />
            <path d={`M${CX} 138 L${CX} 214`} stroke="var(--fg-muted)" strokeWidth={2} fill="none" />
            <polygon points={`${CX - 8},212 ${CX},226 ${CX + 8},212`} fill="var(--fg-muted)" />
            <text x={CX + 16} y={166} textAnchor="start" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {reagentLabel}
            </text>
            {productGraph && product && productBox ? (
              <g>
                {productGraph.atoms.length > 1 ? (
                  <SkeletalFormula graph={productGraph} scale={SCALE} x={CX} y={278} />
                ) : (
                  <text x={CX} y={290} textAnchor="middle" fontSize={28} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                    {subscript(product.formula)}
                  </text>
                )}
                <text x={CX} y={362} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {product.name}
                </text>
                {productGraph.atoms.length > 1 && (
                  <text x={CX} y={384} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                    {subscript(product.formula)}
                  </text>
                )}
                <text x={CX} y={404} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {`By-products: ${byProducts}`}
                </text>
              </g>
            ) : (
              <g>
                <text x={CX} y={278} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
                  No reaction
                </text>
                <text x={CX} y={304} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {outcome.conditions}
                </text>
              </g>
            )}
          </svg>
          <figcaption className={styles.caption}>
            {acidName}, {subscript(acidFormula)}.
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading}>{acidName}</p>
          <p className={styles.verdict}>{productText}</p>
          <p className={styles.summary}>{outcome.note}</p>
          <dl className={styles.facts}>
            <dt>Bond broken</dt>
            <dd data-testid="acid-derivative-bond">{outcome.bondBroken}</dd>
            <dt>Carbon count</dt>
            <dd data-testid="acid-derivative-carbons">{`${outcome.carbonsBefore} → ${outcome.carbonsAfter}`}</dd>
            <dt>By-products</dt>
            <dd>{byProducts}</dd>
            <dt>Conditions</dt>
            <dd>{outcome.conditions}</dd>
          </dl>
          <p className={styles.srOnly} aria-live="polite" data-testid="acid-derivative-live">
            {summary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Acid"
            options={BENCH_ACIDS.map((a) => ({ value: a.id, label: a.label }))}
            value={acid}
            onChange={setAcid}
          />
          <div className={styles.group} role="group" aria-label="Reagent">
            {BENCH_REAGENTS.map((r) => (
              <Button
                key={r}
                variant="secondary"
                aria-pressed={reagent === r}
                className={reagent === r ? styles.pressed : undefined}
                onClick={() => setReagent(r)}
              >
                {REAGENT_LABEL[r]}
              </Button>
            ))}
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
