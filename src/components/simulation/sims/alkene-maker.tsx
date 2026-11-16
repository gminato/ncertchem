'use client'

import { useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame, type SkeletalMark } from '@/components/organic'
import {
  ALKENE_CASES,
  ALKENE_REAGENTS,
  describeStart,
  makeAlkenes,
  type AlkeneOutcome,
  type AlkeneReagent,
  type AlkeneStart,
} from '@/lib/chem/alkene-maker'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import styles from './alkene-maker.module.css'

/** Short reagent labels for the arrow. The full text is in the controls and the panel. */
const ARROW_LABEL: Record<AlkeneReagent, string> = {
  'alcoholic-koh': 'alc. KOH, Δ',
  zinc: 'Zn',
  'conc-h2so4': 'conc. H₂SO₄, Δ',
  lindlar: 'H₂, Lindlar',
  'sodium-ammonia': 'Na, liq. NH₃',
}

/** Scale that keeps the molecule inside its box, with bonds up to 46 units. */
function fitScale(g: MolGraph, maxWidth: number, maxHeight: number): number {
  const f = drawingFrame(g, 1)
  return Math.min(60, maxWidth / f.bounds.width, maxHeight / f.bounds.height)
}

/** Subscript digits for a formula such as C4H8. */
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (formula: string) => formula.replace(/[0-9]/g, (d) => SUB[d])

/** The β-hydrogen marks on the starting compound: one mark per β-carbon, with its hydrogen count. */
function startMarks(start: AlkeneStart): { highlight: number[]; marks: SkeletalMark[] } {
  const highlight: number[] = []
  const marks: SkeletalMark[] = []
  if (start.alpha !== undefined) {
    highlight.push(start.alpha)
    marks.push({ atom: start.alpha, label: 'α' })
  }
  for (const site of start.betaSites) {
    highlight.push(site.carbon)
    marks.push({ atom: site.carbon, label: `β (${site.hydrogens} H)` })
  }
  return { highlight, marks }
}

/** A one-line summary of what the lib gives, for the live region and the panel. */
function summaryOf(outcome: AlkeneOutcome): string {
  if (outcome.kind === 'no-reaction') return `No reaction. ${outcome.reason}`
  if (outcome.kind === 'not-modelled') return `Not modelled in this Section. ${outcome.reason}`
  const names = outcome.reaction.products.map((p) => p.name)
  const list = names.length === 1 ? `${names[0]}` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  const choice = names.length > 1 ? ' Every alkene that can form is listed; NCERT names no major one.' : ''
  return `Gives ${list}.${choice}`
}

/** The one-line answer shown above the panel text. The reason is shown on its own line below it. */
function shortSummary(outcome: AlkeneOutcome): string {
  if (outcome.kind === 'no-reaction') return 'No reaction with this reagent.'
  if (outcome.kind === 'not-modelled') return 'Not modelled in this Section.'
  return summaryOf(outcome)
}

/** KaTeX with mhchem for one equation from the lib (its string already holds \ce{…}). */
function equationHtml(eq: string): string {
  return katex.renderToString(eq, { throwOnError: false })
}

/**
 * The alkene maker (Section 9.3.4). Choose a starting compound and a reagent: the lib gives the
 * alkene(s), with the β-hydrogens of the starting compound highlighted. A pair that does not react
 * is explained, not drawn. Every name, product, equation and condition comes from the libraries.
 */
export function AlkeneMaker() {
  const [caseIndex, setCaseIndex] = useState(1)
  const [reagent, setReagent] = useState<AlkeneReagent>('alcoholic-koh')

  const chosen = ALKENE_CASES[caseIndex]
  const graph = useMemo(() => parseSmiles(chosen.smiles), [chosen.smiles])
  const start = useMemo(() => describeStart(graph), [graph])
  const outcome = useMemo(() => makeAlkenes(chosen.smiles, reagent), [chosen.smiles, reagent])
  const reagentLabel = ALKENE_REAGENTS.find((r) => r.id === reagent)?.label ?? reagent
  const summary = summaryOf(outcome)
  const { highlight, marks } = startMarks(start)

  const scale = fitScale(graph, 230, 270)
  const products = outcome.kind === 'reaction' ? outcome.reaction.products : []
  const single = products.length <= 1

  return (
    <div className={styles.namer} data-testid="alkene-maker">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 600 380" role="img" aria-label={`${start.name} with ${reagentLabel}. ${summary}`} className={styles.drawing} data-testid="alkene-drawing">
            <SkeletalFormula graph={graph} scale={scale} x={130} y={190} highlightAtoms={highlight} locants={marks} />
            {outcome.kind === 'reaction' ? (
              <g>
                <line x1={250} y1={190} x2={322} y2={190} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
                <path d="M 314 183 L 324 190 L 314 197" fill="none" stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                <text x={286} y={172} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {ARROW_LABEL[reagent]}
                </text>
                {products.map((p, i) => {
                  const y = single ? 190 : i === 0 ? 118 : 262
                  const pScale = fitScale(p.graph, 150, single ? 230 : 120)
                  return (
                    <g key={`${p.name}-${i}`}>
                      <SkeletalFormula graph={p.graph} scale={pScale} x={470} y={y} />
                      <text x={470} y={y + (single ? 92 : 70)} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                        {p.name}
                      </text>
                      {p.major && (
                        <text x={470} y={y + (single ? 112 : 90)} textAnchor="middle" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                          major product
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            ) : (
              <g>
                <text x={440} y={190} textAnchor="middle" fontSize={34} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {outcome.kind === 'no-reaction' ? 'No alkene' : 'Not modelled'}
                </text>
                <text x={440} y={222} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {reagentLabel}
                </text>
              </g>
            )}
          </svg>
          <figcaption className={styles.caption}>
            {start.name}, {subscript(start.formula)}. {start.betaSites.length > 0 ? 'Highlighted: α-carbon and the β-carbons with hydrogens.' : ''}
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading} data-testid="alkene-heading">
            {start.name} + {reagentLabel}
          </p>
          <p className={styles.summary} data-testid="alkene-summary">{shortSummary(outcome)}</p>
          {outcome.kind === 'reaction' && (
            <>
              <p className={styles.condition}>Conditions: {outcome.reaction.conditions}</p>
              <p className={styles.why}>{outcome.reaction.why}</p>
            </>
          )}
          {outcome.kind !== 'reaction' && <p className={styles.why}>{outcome.reason}</p>}
          {start.betaSites.length > 0 && (
            <p className={styles.beta} data-testid="alkene-beta">
              β-hydrogens: {start.betaSites.reduce((n, s) => n + s.hydrogens, 0)} in {start.betaSites.length} β-carbon{start.betaSites.length === 1 ? '' : 's'}.
            </p>
          )}
          <p className={styles.srOnly} aria-live="polite" data-testid="alkene-live">
            {start.name} with {reagentLabel}. {summary}
          </p>
        </div>
      </div>

      {outcome.kind === 'reaction' && (
        <div className={styles.equations} data-testid="alkene-equations">
          {outcome.reaction.equations.map((eq, i) => (
            <div key={i} className={styles.equation} dangerouslySetInnerHTML={{ __html: equationHtml(eq) }} />
          ))}
        </div>
      )}

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="Starting compound">
            {ALKENE_CASES.map((c, i) => {
              const name = describeStart(parseSmiles(c.smiles)).name
              return (
                <Button
                  key={c.id}
                  variant="secondary"
                  aria-pressed={i === caseIndex}
                  className={i === caseIndex ? styles.pressed : undefined}
                  onClick={() => setCaseIndex(i)}
                >
                  {name}
                </Button>
              )
            })}
          </div>
          <div className={styles.group} role="group" aria-label="Reagent">
            {ALKENE_REAGENTS.map((r) => (
              <Button
                key={r.id}
                variant="secondary"
                aria-pressed={r.id === reagent}
                className={r.id === reagent ? styles.pressed : undefined}
                onClick={() => setReagent(r.id)}
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
