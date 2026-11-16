'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import { fitScale, SubFormula } from '@/components/animations/unit9/family/formula'
import { ExplicitDrawing, hasExplicit } from '@/components/animations/unit9/family/explicit'
import { VocabDefs } from '@/components/vocab'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { hydrocarbonFamily, type HydrocarbonFamilyName } from '@/lib/chem/hydrocarbon-family'
import styles from './family-sorter.module.css'

/** The eight hydrocarbons to sort, as SMILES: open chains, rings, an aromatic ring. */
const DECK: readonly string[] = ['CC', 'C=C', 'CC#C', 'C1CCCCC1', 'C1=CCCCC1', 'CC1=CC=CC=C1', 'C#CCCC', 'CC(C)=C']
const FAMILIES: HydrocarbonFamilyName[] = ['Saturated', 'Alkene', 'Alkyne', 'Aromatic']

type Verdict = 'idle' | 'right' | 'wrong'


/**
 * The family sorter: a hydrocarbon drawn large, four family buttons, and the lib's verdict with its reasons.
 * The Learner sorts each molecule by its bonds and its ring; the lib names the family and says why.
 */
export function FamilySorter() {
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<HydrocarbonFamilyName | null>(null)
  const [verdict, setVerdict] = useState<Verdict>('idle')
  const [right, setRight] = useState(0)
  const [answered, setAnswered] = useState(0)

  const smiles = DECK[index]
  const graph = useMemo(() => parseSmiles(smiles), [smiles])
  const scale = fitScale(graph, 110, 440, 240)
  const lib = hydrocarbonFamily(graph)
  const name = nameOf(graph)
  const formula = molecularFormula(graph)
  const done = answered === DECK.length

  function pick(family: HydrocarbonFamilyName) {
    if (verdict !== 'idle') return
    setChoice(family)
    const ok = family === lib.family
    setVerdict(ok ? 'right' : 'wrong')
    setAnswered((n) => n + 1)
    if (ok) setRight((n) => n + 1)
  }

  function next() {
    setIndex((i) => (i + 1) % DECK.length)
    setChoice(null)
    setVerdict('idle')
  }

  function restart() {
    setIndex(0)
    setChoice(null)
    setVerdict('idle')
    setRight(0)
    setAnswered(0)
  }

  const feedback =
    verdict === 'right'
      ? `Right: ${name} is ${lib.family.toLowerCase()}, because it has ${lib.reasons.join(' and ')}.`
      : verdict === 'wrong'
        ? `Not quite. ${name} is ${lib.family.toLowerCase()}: it has ${lib.reasons.join(' and ')}.`
        : 'Choose a family for the molecule on screen.'

  return (
    <div className={styles.sorter} data-testid="family-sorter">
      <div className={styles.layout}>
        <figure className={styles.stage} style={{ margin: 0 }}>
          <svg viewBox="0 0 560 340" role="img" aria-label={`${name}, ${formula}`} className={styles.drawing} data-testid="sorter-drawing">
            <VocabDefs />
            {hasExplicit(smiles) ? (
              <ExplicitDrawing smiles={smiles} cx={280} cy={170} scale={110} />
            ) : (
              <SkeletalFormula
                graph={graph}
                scale={scale}
                x={280}
                y={168}
                highlightBonds={graph.bonds.flatMap((b, k) => (b.order > 1 ? [k] : []))}
              />
            )}
          </svg>
        </figure>

        <section className={styles.panel} aria-label="Sort the molecule">
          <h2 className={styles.title} data-testid="sorter-name">
            {name} (<SubFormula formula={formula} />)
          </h2>
          <p className={styles.heading}>Which family?</p>
          <div className={styles.row} role="group" aria-label="Families">
            {FAMILIES.map((f) => (
              <button
                key={f}
                type="button"
                className={styles.familyBtn}
                aria-pressed={choice === f}
                onClick={() => pick(f)}
                disabled={verdict !== 'idle' || done}
                data-testid="sorter-family"
              >
                {f}
              </button>
            ))}
          </div>
          <p className={verdict === 'right' ? styles.good : styles.note} role="status" data-testid="sorter-feedback">
            {done ? `Finished: ${right} of ${DECK.length} sorted correctly.` : feedback}
          </p>
          <div className={styles.row}>
            {!done && (
              <Button onClick={next} disabled={verdict === 'idle'}>
                Next molecule
              </Button>
            )}
            {done && <Button onClick={restart}>Sort them again</Button>}
          </div>
          <p className={styles.srOnly} aria-live="polite">
            {feedback} Score {right} of {answered}.
          </p>
        </section>
      </div>
      <SimulationControls>
        <p className={styles.footer}>
          Molecule {index + 1} of {DECK.length}. Score: {right} of {answered}.
        </p>
      </SimulationControls>
    </div>
  )
}
