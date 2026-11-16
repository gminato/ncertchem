'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button } from '@/components/controls'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ADDITION_ALKENES,
  ADDITION_REAGENTS,
  additionCase,
  type AdditionCase,
  type AdditionReagentId,
} from '@/lib/chem/addition-model'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
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

/** The ion or radical that joins the cation (ionic) or the species that carries the chain (radical). */
const SECOND_STEP: Partial<Record<AdditionReagentId, string>> = {
  HCl: 'Cl⁻',
  HBr: 'Br⁻',
  HI: 'I⁻',
  H2SO4: 'HSO₄⁻',
  H2O: 'H₂O, then −H⁺',
  'HBr-peroxide': '+ HBr, giving Br•',
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

/** A formula or equation rendered with KaTeX and mhchem. */
function Equation({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${tex}}`, { throwOnError: false }), [tex])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A small arrow between two drawings, with a label above it. */
function Arrow({ x0, x1, y, label }: { x0: number; x1: number; y: number; label?: string }) {
  return (
    <g className={styles.arrow}>
      <line x1={x0} x2={x1} y1={y} y2={y} />
      <path d={`M${x1 - 10},${y - 6} L${x1},${y} L${x1 - 10},${y + 6}`} fill="none" />
      {label && (
        <text x={(x0 + x1) / 2} y={y - 12} textAnchor="middle" className={styles.arrowLabel}>
          {label}
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

  const verdict = (() => {
    if (!c.asksCarbon) return `${meta?.label ?? reagentId} adds to both carbons of the C=C. The product is ${major.name}.`
    if (picked === null) return `Click the carbon of the C=C that the ${group} group joins.`
    if (c.correctCarbons.length === 2) return `Both carbons give the same product here, so either one is right: ${major.name}.`
    if (right) return `Right. The ${group} group joins carbon ${carbonNumber(c.majorCarbon ?? 0)}. ${c.reaction.why}`
    return `Not this carbon. In the major product the ${group} group sits on carbon ${carbonNumber(c.majorCarbon ?? 0)}. ${c.reaction.why}`
  })()

  // The strip: alkene, then the major intermediate, then the major product.
  const stripW = 560
  const cols = [96, 280, 464]
  const stripMolecules: { g: MolGraph; caption: string }[] = [
    { g: graph, caption: ionic ? 'Alkene + H⁺' : reagentId === 'HBr-peroxide' ? 'Alkene + Br•' : 'Alkene' },
    ...(majorCentre ? [{ g: majorCentre.graph, caption: `${majorCentre.kind === 'carbocation' ? 'Carbocation' : 'Radical'} on carbon ${carbonNumber(majorCentre.centre)}` }] : []),
    { g: major.graph, caption: major.name },
  ]
  const stripShown = answered && stripMolecules.length === 3

  const equation = c.reaction.equation
  const formulaOf = (g: MolGraph) => {
    try {
      return molecularFormula(g)
    } catch {
      return null
    }
  }

  const summary = `${alkene.id} with ${meta?.label ?? reagentId}. Major product: ${major.name}.${minors.length ? ` Minor: ${minors.map((m) => m.name).join(', ')}.` : ''}`

  const onKey = (event: KeyboardEvent<SVGCircleElement>, atom: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setPicked(atom)
    }
  }

  return (
    <div className={styles.predictor} data-testid="addition-predictor">
      <div className={styles.choices}>
        <div role="group" aria-label="Alkene" className={styles.group}>
          {ADDITION_ALKENES.map((a) => (
            <Button
              key={a.id}
              variant="secondary"
              aria-pressed={a.id === alkeneId}
              className={a.id === alkeneId ? styles.pressed : undefined}
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
              className={r.id === reagentId ? styles.pressed : undefined}
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
          {stripShown ? (
            <svg viewBox={`0 0 ${stripW} 176`} role="img" aria-label={`Route to ${major.name}: ${stripMolecules.map((m) => m.caption).join(', then ')}`} className={styles.drawing} data-testid="predictor-route">
              {stripMolecules.map((m, i) => {
                const s = fitScale(m.g, 150, 92, 40)
                return (
                  <g key={i}>
                    <SkeletalFormula graph={m.g} scale={s} x={cols[i]} y={78} />
                    <text x={cols[i]} y={162} textAnchor="middle" className={styles.colCaption}>
                      {m.caption}
                    </text>
                  </g>
                )
              })}
              <Arrow x0={cols[0] + 62} x1={cols[1] - 62} y={78} label={ionic ? 'H⁺' : 'Br•'} />
              <Arrow x0={cols[1] + 62} x1={cols[2] - 62} y={78} label={SECOND_STEP[reagentId]} />
            </svg>
          ) : (
            <svg viewBox="0 0 560 120" role="img" aria-label={`Product: ${major.name}`} className={styles.drawing} data-testid="predictor-route">
              <SkeletalFormula graph={graph} scale={fitScale(graph, 150, 80, 34)} x={140} y={60} />
              <Arrow x0={220} x1={340} y={60} label={meta?.label ?? ''} />
              <SkeletalFormula graph={major.graph} scale={fitScale(major.graph, 150, 80, 34)} x={420} y={60} />
            </svg>
          )}
        </figure>
      )}

      <div className={styles.readout}>
        <p className={`${styles.verdict} ${picked !== null && asks ? (right || !c.asksCarbon ? styles.good : styles.bad) : ''}`} data-testid="predictor-verdict">
          {verdict}
        </p>
        {answered && (
          <>
            <dl className={styles.facts}>
              <div>
                <dt>Major product</dt>
                <dd data-testid="predictor-major">
                  {major.name}
                  {formulaOf(major.graph) ? ` (${formulaOf(major.graph)})` : ''}
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
                <dd>{c.reaction.conditions}</dd>
              </div>
            </dl>
            {c.reaction.intermediates && c.reaction.intermediates.length > 0 && (
              <ul className={styles.list} data-testid="predictor-intermediates">
                {c.reaction.intermediates.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {equation && <p className={styles.eq}><Equation tex={equation} /></p>}
            {reagentId === 'Br2' && (
              <p className={styles.note}>{bromineTest(graph).observation}: {bromineTest(graph).reason}.</p>
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
