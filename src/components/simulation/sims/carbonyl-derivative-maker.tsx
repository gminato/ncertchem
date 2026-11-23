'use client'

import { useState } from 'react'
import { Button, Segmented, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  CARBONYL_LABEL,
  REAGENT_LABEL,
  hydrolysis,
  outcome,
  reagentsFor,
  type CarbonylId,
  type ReagentId,
} from '@/lib/chem/carbonyl-derivatives'
import styles from './carbonyl-derivative-maker.module.css'

/** Pixels per bond length. At 42 the widest product (the 2,4-DNP hydrazone) fits the 560-unit viewBox at 14 px or more. */
const DRAW_SCALE = 42
const CARBONYL_OPTIONS = (['propanal', 'butanone'] as const).map((value) => ({ value, label: CARBONYL_LABEL[value] }))

export function CarbonylDerivativeMaker() {
  const [carbonyl, setCarbonyl] = useState<CarbonylId>('propanal')
  const [reagent, setReagent] = useState<ReagentId>('methanol2')
  const [hydrolyseBack, setHydrolyseBack] = useState(false)

  const options = reagentsFor(carbonyl)
  const chosen = options.includes(reagent) ? reagent : options[0]
  const product = outcome(carbonyl, chosen)
  const shown = hydrolyseBack && product.hydrolysable ? hydrolysis(product) : product
  const graph = parseSmiles(shown.drawnSmiles)
  const bottomLabel = shown.drawnName ?? shown.productFormula

  return (
    <div className={styles.root} data-testid="carbonyl-derivative-maker">
      <figure className={styles.stage}>
        <svg viewBox="0 0 560 360" role="img" aria-label={shown.summary} className={styles.drawing} data-testid="carbonyl-drawing">
          <text x={280} y={34} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {shown.classLabel}
          </text>
          <SkeletalFormula graph={graph} scale={DRAW_SCALE} x={280} y={180} highlightBonds={shown.highlightBonds} />
          <text x={280} y={340} textAnchor="middle" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {bottomLabel}
          </text>
        </svg>
        <p className={styles.summary} aria-live="polite">
          {shown.summary}
        </p>
        <p className={styles.equation}>{shown.equation}</p>
      </figure>

      <SimulationControls>
        <Segmented label="Carbonyl compound" options={CARBONYL_OPTIONS} value={carbonyl} onChange={setCarbonyl} />
        <div role="group" aria-label="Reagent" className={styles.reagents}>
          {options.map((r) => (
            <Button
              key={r}
              variant={r === chosen ? 'primary' : 'secondary'}
              aria-pressed={r === chosen}
              onClick={() => setReagent(r)}
            >
              {REAGENT_LABEL[r]}
            </Button>
          ))}
        </div>
        <Toggle
          label="Hydrolyse back with aqueous mineral acid"
          checked={hydrolyseBack && product.hydrolysable}
          disabled={!product.hydrolysable}
          onChange={setHydrolyseBack}
        />
      </SimulationControls>
    </div>
  )
}
