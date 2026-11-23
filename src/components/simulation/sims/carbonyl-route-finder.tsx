'use client'

import { useState } from 'react'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { ReactionScheme, reactionSchemeSize, type SchemePath } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  BYPRODUCTS,
  CLASSES,
  CONDENSED_TEXT,
  REAGENTS,
  outcome,
  type ReagentId,
  type SubstrateClass,
} from '@/lib/chem/carbonyl-routes'
import styles from './carbonyl-route-finder.module.css'

const SUBSCRIPT = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

function subscript(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT[Number(d)])
}

/**
 * Wide enough that every reaction fits on one row at the largest bond length (56 px), so reactant,
 * arrow and product read left to right. The widest case needs about 738 px of drawing.
 */
const DRAW_WIDTH = 760
const VIEW_WIDTH = 800
const MARGIN = 20

/** Condensed text for one- and two-carbon species, else the skeletal drawing from SMILES. */
const drawn = (smiles: string) => CONDENSED_TEXT[smiles] ?? parseSmiles(smiles)

export function CarbonylRouteFinder() {
  const [cls, setCls] = useState<SubstrateClass>('alcohol')
  const [smiles, setSmiles] = useState('CCCCO')
  const [reagentId, setReagentId] = useState<ReagentId>('oxidise')

  const classInfo = CLASSES.find((c) => c.cls === cls) ?? CLASSES[0]
  const reagent = REAGENTS.find((r) => r.id === reagentId) ?? REAGENTS[0]
  const substrateName = unit8Name(smiles)
  const formula = subscript(molecularFormula(parseSmiles(smiles)))
  const result = outcome(smiles, reagentId)

  const products =
    result.kind === 'product'
      ? result.products.map((p) =>
          BYPRODUCTS.includes(p) ? { formula: p } : { formula: drawn(p), tag: unit8Name(p) },
        )
      : [{ formula: 'no reaction' }]
  const path: SchemePath = [[{ formula: drawn(smiles), tag: substrateName }], { reagents: reagent.label }, products]

  const drawHeight = reactionSchemeSize(path, DRAW_WIDTH).height + 2 * MARGIN

  const summary =
    result.kind === 'product'
      ? `${substrateName} with ${reagent.label} gives ${result.names.join(' and ')}.`
      : `${substrateName} with ${reagent.label} gives no product.`

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <figure className={styles.stage} style={{ margin: 0 }}>
          <svg
            role="img"
            aria-label={summary}
            viewBox={`0 0 ${VIEW_WIDTH} ${drawHeight}`}
            className={styles.drawing}
          >
            <ReactionScheme sequence={path} maxWidth={DRAW_WIDTH} x={MARGIN} y={MARGIN} />
          </svg>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading}>{substrateName}</p>
          <p className={styles.formula}>{formula}</p>
          <p className={styles.summary}>{summary}</p>
          {result.kind === 'none' ? <p className={styles.reason}>{result.reason}</p> : null}
          <p className={styles.srOnly} aria-live="polite">
            {summary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="Starting material">
            <span className={styles.groupLabel}>Start with</span>
            {CLASSES.map((c) => (
              <Button
                key={c.cls}
                variant="secondary"
                aria-pressed={c.cls === cls}
                className={c.cls === cls ? styles.pressed : undefined}
                onClick={() => {
                  setCls(c.cls)
                  setSmiles(c.compounds[0])
                }}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Compound">
            <span className={styles.groupLabel}>Compound</span>
            {classInfo.compounds.map((s) => (
              <Button
                key={s}
                variant="secondary"
                aria-pressed={s === smiles}
                className={s === smiles ? styles.pressed : undefined}
                onClick={() => setSmiles(s)}
              >
                {unit8Name(s)}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Reagent">
            <span className={styles.groupLabel}>Reagent</span>
            {REAGENTS.map((r) => (
              <Button
                key={r.id}
                variant="secondary"
                aria-pressed={r.id === reagentId}
                className={r.id === reagentId ? styles.pressed : undefined}
                onClick={() => setReagentId(r.id)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
