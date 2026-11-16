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
import { TWO_CARBON_SMILES, TwoCarbonDrawing } from './alkene-maker-c2'
import styles from './alkene-maker.module.css'

/** Short reagent labels for the arrow. The full text is in the controls and the panel. */
const ARROW_LABEL: Record<AlkeneReagent, string> = {
  'alcoholic-koh': 'alc. KOH, Δ',
  zinc: 'Zn',
  'conc-h2so4': 'conc. H₂SO₄, Δ',
  lindlar: 'H₂, Lindlar',
  'sodium-ammonia': 'Na, liq. NH₃',
}

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** Digits after a letter or a bracket become subscripts: H2SO4 reads H₂SO₄. Words from the lib are otherwise unchanged. */
export function subscriptText(text: string): string {
  return text.replace(/(?<=[A-Za-z)])\d+/g, (d) => d.replace(/\d/g, (c) => SUB[c]))
}

/** Subscript digits for a formula such as C4H8, for the caption. */
const subscript = (formula: string) => formula.replace(/[0-9]/g, (d) => SUB[d])

/** Scale that keeps the molecule inside its box, with bonds up to 60 units. */
function fitScale(g: MolGraph, maxWidth: number, maxHeight: number): number {
  const f = drawingFrame(g, 1)
  return Math.min(60, maxWidth / f.bounds.width, maxHeight / f.bounds.height)
}

/** The α-carbon and the β-carbons (with their hydrogen counts) of the starting compound, as skeletal marks. */
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

/** Labels for the terminal carbons of a product (CH₃, CH₂), so the ends of cis and trans chains are visible. */
function terminalMarks(g: MolGraph): SkeletalMark[] {
  const marks: SkeletalMark[] = []
  g.atoms.forEach((a, i) => {
    if (a.element !== 'C') return
    const heavy = g.bonds.filter((b) => b.a === i || b.b === i).length
    if (heavy !== 1) return
    const h = a.hCount ?? 0
    if (h > 0) marks.push({ atom: i, label: `CH${subscript(String(h))}` })
  })
  return marks
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

/** Splits text into lines of at most `width` characters, at word breaks. */
function wrap(text: string, width: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > width && line) {
      out.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) out.push(line)
  return out
}

/** KaTeX with mhchem for one equation from the lib (its string already holds \ce{…}). */
function equationHtml(eq: string): string {
  return katex.renderToString(eq, { throwOnError: false })
}

/** A product or substrate drawing: two-carbon compounds with every H shown, others as skeletal drawings. */
function Drawing({
  g,
  x,
  y,
  box,
  marks,
  highlight,
  alphaLabel,
  betaLabel,
  c2Scale = 1,
}: {
  g: MolGraph
  x: number
  y: number
  box: [number, number]
  marks: SkeletalMark[]
  highlight: number[]
  alphaLabel?: string
  betaLabel?: string
  /** Scale of the two-carbon drawings, which are in design units. */
  c2Scale?: number
}) {
  const kind = TWO_CARBON_SMILES[canonicalSmiles(g)]
  if (kind) {
    return <TwoCarbonDrawing kind={kind} x={x} y={y} scale={c2Scale} alphaLabel={alphaLabel} betaLabel={betaLabel} />
  }
  return <SkeletalFormula graph={g} scale={fitScale(g, box[0], box[1])} x={x} y={y} highlightAtoms={highlight} locants={marks} />
}

/** The SMILES key of a two-carbon graph, or '' for anything else. Only the four C2 compounds are keyed. */
function canonicalSmiles(g: MolGraph): string {
  const c = g.atoms.filter((a) => a.element === 'C').length
  if (c !== 2) return ''
  const hal = g.atoms.filter((a) => a.element === 'Br').length
  const o = g.atoms.filter((a) => a.element === 'O').length
  const double = g.bonds.some((b) => b.order === 2)
  if (double) return 'C=C'
  if (hal === 2) return 'BrCCBr'
  if (hal === 1) return 'CCBr'
  if (o === 1) return 'CCO'
  return ''
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
  const betaTotal = start.betaSites.reduce((n, s) => n + s.hydrogens, 0)
  const products = outcome.kind === 'reaction' ? outcome.reaction.products : []
  const single = products.length <= 1

  return (
    <div className={styles.namer} data-testid="alkene-maker">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 600 380" role="img" aria-label={`${start.name} with ${reagentLabel}. ${summary}`} className={styles.drawing} data-testid="alkene-drawing">
            <Drawing
              g={graph}
              x={125}
              y={190}
              box={[230, 280]}
              c2Scale={0.62}
              marks={marks}
              highlight={highlight}
              alphaLabel="α-carbon"
              betaLabel={start.betaSites.length ? `β-carbon: ${start.betaSites[0].hydrogens} H` : undefined}
            />
            {outcome.kind === 'reaction' ? (
              <g>
                <text x={292} y={170} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {ARROW_LABEL[reagent]}
                </text>
                <line x1={256} y1={190} x2={326} y2={190} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
                <path d="M 318 183 L 328 190 L 318 197" fill="none" stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                {products.map((p, i) => {
                  const y = single ? 190 : i === 0 ? 112 : 268
                  const box: [number, number] = single ? [230, 250] : [230, 118]
                  const nameY = y + (single ? 150 : 76)
                  return (
                    <g key={`${p.name}-${i}`}>
                      <Drawing g={p.graph} x={470} y={y} box={box} marks={terminalMarks(p.graph)} highlight={[]} />
                      <text x={470} y={nameY} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                        {p.name}
                      </text>
                      {p.major && (
                        <text x={470} y={nameY + 22} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                          major product
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            ) : (
              <g>
                <text x={440} y={150} textAnchor="middle" fontSize={34} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {outcome.kind === 'no-reaction' ? 'No alkene' : 'Not modelled'}
                </text>
                {wrap(outcome.reason, 30).map((line, i) => (
                  <text key={i} x={440} y={186 + i * 23} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
                    {subscriptText(line)}
                  </text>
                ))}
              </g>
            )}
          </svg>
          <figcaption className={styles.caption}>
            {start.name}, {subscript(start.formula)}.
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading} data-testid="alkene-heading">
            {start.name} + {reagentLabel}
          </p>
          <p className={styles.summary} data-testid="alkene-summary">{shortSummary(outcome)}</p>
          {outcome.kind === 'reaction' && (
            <>
              <p className={styles.condition}>Conditions: {subscriptText(outcome.reaction.conditions)}</p>
              <p className={styles.why}>{subscriptText(outcome.reaction.why)}</p>
            </>
          )}
          {outcome.kind !== 'reaction' && <p className={styles.why}>{subscriptText(outcome.reason)}</p>}
          {start.betaSites.length > 0 && (
            <p className={styles.beta} data-testid="alkene-beta">
              β-hydrogens: {betaTotal} in {start.betaSites.length} β-carbon{start.betaSites.length === 1 ? '' : 's'}.
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
