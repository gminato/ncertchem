'use client'

import { useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { ReactionScheme, layoutReactionScheme, type SchemePath } from '@/components/organic'
import { acidTest, ACID_TEST_SMILES, shortCondition, speciesFormula, toDisplay, type AcidBase, type AcidTest } from '@/lib/chem/alkyne-acid-test'
import { addToAlkyne, type Reaction } from '@/lib/chem/hydrocarbon-reactions'
import { condensedLabel, nameOf } from '@/lib/chem/hydrocarbon-species'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import styles from './alkyne-acid-test.module.css'

type Reagent = 'H2' | 'X2' | 'HX' | 'H2O'

const REAGENTS: { value: Reagent; label: string; text: string }[] = [
  { value: 'H2', label: 'H₂', text: 'H₂' },
  { value: 'X2', label: 'Br₂', text: 'Br₂' },
  { value: 'HX', label: 'HBr', text: 'HBr' },
  { value: 'H2O', label: 'H₂O, Hg²⁺', text: 'H₂O' },
]

const BASES: { value: AcidBase; label: string }[] = [
  { value: 'Na', label: 'Sodium' },
  { value: 'NaNH2', label: 'Sodamide' },
]

/** Each hydrocarbon of the list, with its drawing graph and its name from the lib. */
const CHOICES = ACID_TEST_SMILES.map((smiles) => {
  const graph = parseSmiles(smiles)
  return { value: smiles, graph, name: nameOf(graph) }
})

const SCHEME_WIDTH = 900
const SCHEME_MARGIN = 30

/** A mhchem equation from the lib (already wrapped in \ce{}), as KaTeX HTML. */
function equationHtml(ce: string): string {
  return katex.renderToString(ce, { throwOnError: false, displayMode: true })
}

/** The two steps of an addition, one scheme each: alkyne + reagent to the first product, then to the second. */
function additionSchemes(graph: MolGraph, reaction: Reaction, reagent: Reagent): [SchemePath, SchemePath] {
  const reagentText = REAGENTS.find((r) => r.value === reagent)?.text ?? ''
  const [first, second] = reaction.products
  const water = reagent === 'H2O'
  // The HX condition in the lib is a note, not a condition, so the arrow shows only the reagent for it.
  const firstArrow = reagent === 'HX' ? { reagents: reagentText } : { conditions: shortCondition(reaction.conditions) }
  const one: SchemePath = [
    [{ formula: speciesFormula(graph) }, { formula: reagentText }],
    firstArrow,
    [{ formula: speciesFormula(first.graph), tag: water ? 'enol' : 'first product' }],
  ]
  const two: SchemePath = [
    [{ formula: speciesFormula(first.graph) }, ...(water ? [] : [{ formula: reagentText }])],
    water ? { conditions: 'isomerisation' } : { reagents: reagentText },
    [{ formula: speciesFormula(second.graph), tag: water ? 'carbonyl' : 'second product' }],
  ]
  return [one, two]
}

function AcidPanel({ graph, base, result }: { graph: MolGraph; base: AcidBase; result: AcidTest }) {
  const name = nameOf(graph)
  const baseName = base === 'Na' ? 'sodium' : 'sodamide'
  const Name = name.charAt(0).toUpperCase() + name.slice(1)
  const verdict = result.reacts
    ? `${Name} reacts with ${baseName}. The terminal C–H is removed, and ${result.byproduct} escapes.`
    : `${Name} does not react with ${baseName}. ${result.reason}`
  return (
    <div className={styles.panel} data-testid="acid-panel">
      <h4 className={styles.panelTitle}>Sodium and sodamide test</h4>
      <div className={styles.drawingRow}>
        <div className={styles.drawing}>
          <p className={styles.formula} role="img" aria-label={`${name}: ${toDisplay(condensedLabel(graph))}`}>
            {toDisplay(condensedLabel(graph))}
          </p>
        </div>
        <div className={styles.verdict} aria-live="polite" data-testid="acid-verdict" data-reacts={result.reacts ? 'yes' : 'no'}>
          <p>{verdict}</p>
          {result.salt ? (
            <p className={styles.saltLine}>
              Product: <span className={styles.saltName}>{result.salt.name}</span> ({toDisplay(result.salt.label)})
            </p>
          ) : null}
        </div>
      </div>
      {result.equation ? (
        <div className={styles.equation} data-testid="acid-equation" dangerouslySetInnerHTML={{ __html: equationHtml(result.equation) }} />
      ) : null}
    </div>
  )
}

function AdditionPanel({ graph, reagent }: { graph: MolGraph; reagent: Reagent }) {
  if (!graph.bonds.some((b) => b.order === 3)) {
    return (
      <div className={styles.panel} data-testid="addition-panel">
        <h4 className={styles.panelTitle}>Addition, one step at a time</h4>
        <p className={styles.note}>{nameOf(graph)} has no C≡C, so this addition model does not apply. Pick an alkyne.</p>
      </div>
    )
  }
  const reaction = addToAlkyne(graph, reagent, { x: 'Br' })
  const schemes = additionSchemes(graph, reaction, reagent)
  // The schemes show every equation, so the addition panel prints no KaTeX lines of its own.
  const label = REAGENTS.find((r) => r.value === reagent)?.text ?? ''
  return (
    <div className={styles.panel} data-testid="addition-panel">
      <h4 className={styles.panelTitle}>Addition, one step at a time</h4>
      {schemes.map((scheme, i) => {
        const size = layoutReactionScheme(scheme, SCHEME_WIDTH)
        // The viewBox has a margin so that a text species centred near the edge is not cut.
        return (
          <svg
            key={i}
            viewBox={`${-SCHEME_MARGIN} 0 ${SCHEME_WIDTH + 2 * SCHEME_MARGIN} ${Math.ceil(size.height)}`}
            width="100%"
            role="img"
            aria-label={`Step ${i + 1} of the addition of ${label} to ${nameOf(graph)}`}
            className={styles.scheme}
          >
            <ReactionScheme sequence={scheme} maxWidth={SCHEME_WIDTH} x={(SCHEME_WIDTH - size.width) / 2} y={0} />
          </svg>
        )
      })}
      <p className={styles.summary} aria-live="polite">
        {reaction.products.length === 2
          ? `Two steps: ${reaction.products[0].name}, then ${reaction.products[1].name}.`
          : `One product: ${reaction.products[0].name}.`}
      </p>
    </div>
  )
}

export function AlkyneAcidTest(_props: SimulationProps) {
  const [smiles, setSmiles] = useState<string>('C#C')
  const [base, setBase] = useState<AcidBase>('Na')
  const [reagent, setReagent] = useState<Reagent>('X2')

  const choice = CHOICES.find((c) => c.value === smiles) ?? CHOICES[2]
  const result = useMemo(() => acidTest(choice.graph, base), [choice, base])

  return (
    <div className={styles.sim} data-testid="alkyne-acid-test">
      <div className={styles.controls}>
        <Segmented
          label="Hydrocarbon"
          options={CHOICES.map((c) => ({ value: c.value, label: c.name }))}
          value={smiles}
          onChange={setSmiles}
        />
        <Segmented label="Base for the test" options={BASES} value={base} onChange={setBase} />
        <Segmented label="Reagent for addition" options={REAGENTS.map((r) => ({ value: r.value, label: r.label }))} value={reagent} onChange={setReagent} />
      </div>
      <div className={styles.grid}>
        <AcidPanel graph={choice.graph} base={base} result={result} />
        <AdditionPanel graph={choice.graph} reagent={reagent} />
      </div>
    </div>
  )
}
