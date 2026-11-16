'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button } from '@/components/controls'
import { SkeletalFormula, drawingFrame, type SkeletalMark } from '@/components/organic'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ADDITION_ALKENES,
  ADDITION_REAGENTS,
  additionCase,
  type AdditionCase,
  type AdditionIntermediate,
  type AdditionReagentId,
} from '@/lib/chem/addition-model'
import { carbonDegree, neighbours, parseSmiles } from '@/lib/chem/molecule-parse'
import { countsOf, formulaFromCounts, nameOf } from '@/lib/chem/hydrocarbon-species'
import { bromineTest } from '@/lib/chem/hydrocarbon-tests'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import styles from './addition-predictor.module.css'

type Pick = number | null

/** The group the reagent adds to the alkene, as the learner is asked to place it. */
const GROUP: Record<AdditionReagentId, string> = {
  H2: 'H',
  Br2: 'Br',
  HCl: 'Cl',
  HBr: 'Br',
  'HBr-peroxide': 'Br',
  HI: 'I',
  H2SO4: 'OSO₃H',
  H2O: 'OH',
}

const SUBSCRIPT: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six']

/** Digits after letters or a closing bracket become subscripts: H2SO4 reads H₂SO₄, and 273 K is unchanged. */
function subscripted(text: string): string {
  return text.replace(/([A-Za-z)])(\d+)/g, (_, letter: string, digits: string) => letter + digits.replace(/\d/g, (d) => SUBSCRIPT[d]))
}

/** The molecular formula of a product, from its atom counts, with real subscripts (C₄H₉Br). */
function formulaText(g: MolGraph): string {
  return subscripted(formulaFromCounts(countsOf(g)))
}

/** The reaction's condition text, with subscripts in its formulas (cold concentrated H₂SO₄). */
function conditionText(text: string): string {
  return subscripted(text)
}

/** The group, the ion or the species that follows the first step, with its own arrow label. */
function arrowLabels(reagentId: AdditionReagentId): { first: string; second: [string, string?] } {
  switch (reagentId) {
    case 'HCl':
      return { first: 'H⁺', second: ['Cl⁻'] }
    case 'HBr':
      return { first: 'H⁺', second: ['Br⁻'] }
    case 'HI':
      return { first: 'H⁺', second: ['I⁻'] }
    case 'H2SO4':
      return { first: 'H⁺', second: ['HSO₄⁻'] }
    case 'H2O':
      return { first: 'H⁺', second: ['H₂O', 'then −H⁺'] }
    case 'HBr-peroxide':
      return { first: 'Br•', second: ['+ HBr', 'gives Br•'] }
    default:
      return { first: '', second: [''] }
  }
}

/** Splits a caption into lines of at most `max` characters, breaking after spaces and hyphens. */
function wrapLines(text: string, max: number): string[] {
  const tokens = text.split(/(?<=[ -])/)
  const lines: string[] = []
  let line = ''
  for (const t of tokens) {
    if ((line + t).trim().length > max && line !== '') {
      lines.push(line.trim())
      line = t
    } else {
      line += t
    }
  }
  if (line.trim() !== '') lines.push(line.trim())
  return lines
}

/** The alkene's name and the carbocation's, read from the lib. Unparsed input is shown as a message. */
function safeCase(smiles: string, reagent: AdditionReagentId): AdditionCase | null {
  try {
    return additionCase(smiles, reagent)
  } catch {
    return null
  }
}

/** Scale that fits a molecule inside a box of the given size, never above `max` units per bond. */
function fitScale(g: MolGraph, width: number, height: number, max: number): number {
  const f = drawingFrame(g, 1)
  return Math.min(max, width / f.bounds.width, height / f.bounds.height)
}

/** The same molecule without its charge or radical, so the drawn mark can be placed by the component. */
function plain(g: MolGraph): MolGraph {
  return { ...g, atoms: g.atoms.map((a) => ({ ...a, charge: undefined, radical: undefined })) }
}

/** A plain-English sentence for an intermediate, from its carbon's degree and the lib's ranking. */
function intermediateSentence(i: AdditionIntermediate): string {
  const degree = carbonDegree(i.graph, i.centre)
  const alkyl = neighbours(i.graph, i.centre).filter((n) => i.graph.atoms[n.atom].element === 'C').length
  const kind = i.kind === 'carbocation' ? 'carbocation' : 'radical'
  const where = `${degree} ${kind} on carbon ${i.centre + 1}`
  if (!i.major) return `Minor: ${where}.`
  const groups = alkyl === 1 ? 'one alkyl group' : `${NUMBER_WORDS[alkyl] ?? alkyl} alkyl groups`
  return `Major: ${where}, more stable (${groups}).`
}

/** A formula or equation rendered with KaTeX and mhchem. */
function Equation({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${tex}}`, { throwOnError: false }), [tex])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A curved-free arrow between two drawings, with a label above it and an optional second label below. */
function Arrow({ x0, x1, y, top, bottom }: { x0: number; x1: number; y: number; top: string; bottom?: string }) {
  const mid = (x0 + x1) / 2
  return (
    <g className={styles.arrow}>
      <line x1={x0} x2={x1} y1={y} y2={y} />
      <path d={`M${x1 - 10},${y - 6} L${x1},${y} L${x1 - 10},${y + 6}`} fill="none" />
      <text x={mid} y={y - 12} textAnchor="middle" className={styles.arrowLabel}>
        {top}
      </text>
      {bottom && (
        <text x={mid} y={y + 22} textAnchor="middle" className={styles.arrowLabel}>
          {bottom}
        </text>
      )}
    </g>
  )
}

/**
 * The addition predictor. The learner picks an alkene and a reagent, then clicks the carbon of the C=C
 * that the reagent's group joins. The lib gives the major product, the two candidate carbocations (or
 * radicals) and the reason; the strip shows the route the major product takes. Every name, product,
 * equation and reason is from the lib.
 */
export function AdditionPredictor({ reducedMotion }: SimulationProps) {
  const [alkeneId, setAlkeneId] = useState<string>(ADDITION_ALKENES[1].id)
  const [reagentId, setReagentId] = useState<AdditionReagentId>('HBr')
  const [picked, setPicked] = useState<Pick>(null)

  const alkene = ADDITION_ALKENES.find((a) => a.id === alkeneId) ?? ADDITION_ALKENES[1]
  const c = safeCase(alkene.smiles, reagentId)
  const meta = ADDITION_REAGENTS.find((r) => r.id === reagentId)
  const asks = c?.asksCarbon ?? false
  const answered = c !== null && (!asks || picked !== null)
  const right = c !== null && picked !== null && c.correctCarbons.includes(picked)

  const chooseAlkene = (id: string) => {
    setAlkeneId(id)
    setPicked(null)
  }
  const chooseReagent = (id: AdditionReagentId) => {
    setReagentId(id)
    setPicked(null)
  }

  if (!c) {
    return <p className={styles.note}>This alkene and reagent are not modelled together.</p>
  }

  const graph = c.alkene
  const dCarbons = c.doubleCarbons
  const scale = fitScale(graph, 420, 200, 96)
  const frame = drawingFrame(graph, scale)
  const centre = { x: 280, y: 128 }
  const at = (atom: number) => ({ x: centre.x + frame.points[atom].x, y: centre.y + frame.points[atom].y })

  const major = c.reaction.products.find((p) => p.major) ?? c.reaction.products[0]
  const minors = c.reaction.products.filter((p) => p !== major)
  const majorCentre = c.intermediates.find((i) => i.major)
  const ionic = majorCentre?.kind === 'carbocation'
  const group = GROUP[reagentId]
  const carbonNumber = (atom: number) => atom + 1
  const symmetric = c.correctCarbons.length === 2

  const verdict = (() => {
    if (!c.asksCarbon) return `${meta?.label ?? reagentId} adds to both carbons of the C=C. The product is ${major.name}.`
    if (picked === null) return `Click the carbon of the C=C that the ${group} group joins.`
    if (symmetric) return `Both carbons give the same product here, so either one is right: ${major.name}.`
    if (right) return `Right. The ${group} group joins carbon ${carbonNumber(c.majorCarbon ?? 0)}. ${c.reaction.why}`
    return `Not this carbon. In the major product the ${group} group sits on carbon ${carbonNumber(c.majorCarbon ?? 0)}. ${c.reaction.why}`
  })()

  // The intermediate sentences: one for each carbon, or one line when the two carbons are equivalent.
  const intermediateLines = symmetric && majorCentre
    ? [`Both carbons give the same ${carbonDegree(majorCentre.graph, majorCentre.centre)} ${majorCentre.kind === 'carbocation' ? 'carbocation' : 'radical'}.`]
    : c.intermediates.map(intermediateSentence)

  // The route strip. Three cells: alkene, the major intermediate, the major product. Each has its own
  // column of width 120; the arrows sit between the cells and carry the reagent text.
  const cellX = [90, 280, 470]
  const labels = arrowLabels(reagentId)
  const alkeneCaption = ionic ? 'Alkene + H⁺' : reagentId === 'HBr-peroxide' ? 'Alkene + Br•' : 'Alkene'
  const cells: { g: MolGraph; mark?: SkeletalMark; caption: string; x: number }[] = majorCentre
    ? [
        { g: plain(graph), caption: alkeneCaption, x: cellX[0] },
        {
          g: plain(majorCentre.graph),
          mark: { atom: majorCentre.centre, label: majorCentre.kind === 'carbocation' ? '+' : '•' },
          caption: `${majorCentre.kind === 'carbocation' ? 'Carbocation' : 'Radical'} on carbon ${carbonNumber(majorCentre.centre)}`,
          x: cellX[1],
        },
        { g: plain(major.graph), caption: major.name, x: cellX[2] },
      ]
    : [
        { g: plain(graph), caption: 'Alkene', x: cellX[0] },
        { g: plain(major.graph), caption: major.name, x: cellX[2] },
      ]
  const cellScale = (g: MolGraph) => fitScale(g, 120, 80, 40)
  const stripHeight = 236

  const summary = `${alkene.id} with ${meta?.label ?? reagentId}. Major product: ${major.name}.${minors.length ? ` Minor: ${minors.map((m) => m.name).join(', ')}.` : ''}`

  const onKey = (event: KeyboardEvent<SVGCircleElement>, atom: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setPicked(atom)
    }
  }

  const equation = c.reaction.equation

  return (
    <div className={styles.predictor} data-testid="addition-predictor">
      <div className={styles.choices}>
        <div role="group" aria-label="Alkene" className={styles.group}>
          {ADDITION_ALKENES.map((a) => (
            <Button
              key={a.id}
              variant="secondary"
              aria-pressed={a.id === alkeneId}
              className={`${styles.chip} ${a.id === alkeneId ? styles.pressed : ''}`}
              onClick={() => chooseAlkene(a.id)}
            >
              {nameOf(parseSmiles(a.smiles))}
            </Button>
          ))}
        </div>
        <div role="group" aria-label="Reagent" className={styles.group}>
          {ADDITION_REAGENTS.map((r) => (
            <Button
              key={r.id}
              variant="secondary"
              aria-pressed={r.id === reagentId}
              className={`${styles.chip} ${r.id === reagentId ? styles.pressed : ''}`}
              onClick={() => chooseReagent(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <figure className={styles.stage}>
        <svg viewBox="0 0 560 256" role="img" aria-label={`${alkene.id}. ${verdict}`} className={styles.drawing} data-testid="predictor-alkene">
          <SkeletalFormula
            graph={graph}
            scale={scale}
            x={centre.x}
            y={centre.y}
            highlightBonds={c.asksCarbon ? graph.bonds.flatMap((b, i) => (b.order === 2 ? [i] : [])) : []}
            locants={dCarbons.map((atom) => ({ atom, label: String(carbonNumber(atom)) }))}
          />
          {c.asksCarbon &&
            dCarbons.map((atom) => {
              const p = at(atom)
              const isPicked = picked === atom
              return (
                <circle
                  key={atom}
                  cx={p.x}
                  cy={p.y}
                  r={26}
                  className={`${styles.hit} ${isPicked ? styles.hitPicked : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Carbon ${carbonNumber(atom)}`}
                  aria-pressed={isPicked}
                  data-testid={`carbon-${carbonNumber(atom)}`}
                  onClick={() => setPicked(atom)}
                  onKeyDown={(e) => onKey(e, atom)}
                />
              )
            })}
        </svg>
        <figcaption className={styles.caption}>
          {asks ? `Click carbon 1 or carbon 2 of the C=C to place the ${group}.` : `${meta?.label ?? reagentId} adds across the double bond.`}
        </figcaption>
      </figure>

      {answered && (
        <figure className={`${styles.stage} ${reducedMotion ? '' : styles.reveal}`}>
          <svg viewBox={`0 0 560 ${stripHeight}`} role="img" aria-label={`Route to ${major.name}`} className={`${styles.drawing} ${styles.route}`} data-testid="predictor-route">
            {cells.map((cell, i) => (
              <g key={i}>
                <SkeletalFormula graph={cell.g} scale={cellScale(cell.g)} x={cell.x} y={84} partialCharges={cell.mark ? [cell.mark] : undefined} />
                {wrapLines(cell.caption, 15).map((line, k) => (
                  <text key={k} x={cell.x} y={160 + k * 20} textAnchor="middle" className={styles.colCaption}>
                    {line}
                  </text>
                ))}
              </g>
            ))}
            {majorCentre ? (
              <>
                <Arrow x0={cellX[0] + 64} x1={cellX[1] - 64} y={84} top={labels.first} />
                <Arrow x0={cellX[1] + 64} x1={cellX[2] - 64} y={84} top={labels.second[0]} bottom={labels.second[1]} />
              </>
            ) : (
              <Arrow x0={cellX[0] + 64} x1={cellX[2] - 64} y={84} top={meta?.label ?? ''} />
            )}
          </svg>
        </figure>
      )}

      <div className={styles.readout}>
        <p className={`${styles.verdict} ${picked !== null && asks ? (right || symmetric ? styles.good : styles.bad) : ''}`} data-testid="predictor-verdict">
          {verdict}
        </p>
        {answered && (
          <>
            <dl className={styles.facts}>
              <div>
                <dt>Major product</dt>
                <dd data-testid="predictor-major">
                  {major.name} ({formulaText(major.graph)})
                </dd>
              </div>
              {minors.length > 0 && (
                <div>
                  <dt>Minor product</dt>
                  <dd>{minors.map((m) => m.name).join(', ')}</dd>
                </div>
              )}
              <div>
                <dt>Conditions</dt>
                <dd>{conditionText(c.reaction.conditions)}</dd>
              </div>
            </dl>
            {asks && intermediateLines.length > 0 && (
              <ul className={styles.list} data-testid="predictor-intermediates">
                {intermediateLines.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <p className={styles.eq}>
              <Equation tex={equation} />
            </p>
            {reagentId === 'Br2' && (
              <p className={styles.note}>
                {bromineTest(graph).observation}: {bromineTest(graph).reason}.
              </p>
            )}
          </>
        )}
        {asks && picked !== null && (
          <Button variant="secondary" onClick={() => setPicked(null)}>
            Try again
          </Button>
        )}
        <p className={styles.srOnly} aria-live="polite" data-testid="predictor-live">
          {summary}
        </p>
      </div>
    </div>
  )
}
