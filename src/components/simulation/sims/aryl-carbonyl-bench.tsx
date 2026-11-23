'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { ReactionScheme, reactionSchemeSize, type SchemeArrow, type SchemePath, type SchemeSpecies } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  STARTS,
  displayName,
  outcomeLine,
  routeFor,
  routesFrom,
  type ReagentId,
  type Route,
  type StartId,
} from '@/lib/chem/aryl-carbonyl-bench'
import styles from './aryl-carbonyl-bench.module.css'

const SCHEME_WIDTH = 520

/** The drawn route: start, arrow, intermediate (when NCERT names one), arrow, product. */
function sequenceFor(route: Route): SchemePath {
  const start = STARTS.find((s) => s.id === route.start)
  if (!start) throw new Error(`Unknown starting material: ${route.start}`)
  const startSpecies: SchemeSpecies = { formula: parseSmiles(start.smiles) }
  const productSpecies: SchemeSpecies = { formula: parseSmiles(route.product), tag: route.outcome === 'acid' ? 'acid' : route.outcome }
  const path: (readonly SchemeSpecies[] | SchemeArrow)[] = [[startSpecies], route.arrows[0]]
  if (route.intermediate) {
    const mid = route.intermediate
    const midSpecies: SchemeSpecies =
      mid.kind === 'molecule' ? { formula: parseSmiles(mid.smiles), tag: 'intermediate' } : { formula: mid.label, tag: 'intermediate' }
    path.push([midSpecies], route.arrows[1])
  }
  path.push([productSpecies])
  return path
}

function intermediateLine(route: Route): string | null {
  const mid = route.intermediate
  if (!mid) return null
  if (mid.kind === 'molecule') return `Intermediate: ${mid.name}.`
  return `Intermediate: ${mid.label}. NCERT gives it no formula.`
}

export function ArylCarbonylBench() {
  const [start, setStart] = useState<StartId>('toluene')
  const [reagent, setReagent] = useState<ReagentId>('etard')

  const route = routeFor(start, reagent)
  const sequence = useMemo(() => sequenceFor(route), [route])
  const size = reactionSchemeSize(sequence, SCHEME_WIDTH)
  const startName = displayName(STARTS.find((s) => s.id === route.start)?.smiles ?? '')
  const answer = outcomeLine(route)
  const mid = intermediateLine(route)
  const summary = `${startName}, ${route.label}. ${answer}`

  function chooseStart(next: StartId) {
    setStart(next)
    setReagent(routesFrom(next)[0].reagent)
  }

  return (
    <div className={styles.root} data-testid="aryl-carbonyl-bench">
      <figure className={styles.stage}>
        <svg viewBox={`0 0 560 ${size.height + 40}`} role="img" aria-label={summary} className={styles.drawing}>
          <ReactionScheme sequence={sequence} maxWidth={SCHEME_WIDTH} x={20} y={20} />
        </svg>
      </figure>

      <div className={styles.output}>
        <p className={styles.summary} aria-live="polite">
          {answer}
        </p>
        <p className={styles.note}>{route.note}</p>
        {mid ? <p className={styles.note}>{mid}</p> : null}
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div role="group" aria-label="Starting material" className={styles.group}>
            {STARTS.map((s) => (
              <Button
                key={s.id}
                variant={s.id === start ? 'primary' : 'secondary'}
                aria-pressed={s.id === start}
                onClick={() => chooseStart(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <div role="group" aria-label="Reagent set" className={styles.group}>
            {routesFrom(start).map((r) => (
              <Button
                key={r.reagent}
                variant={r.reagent === route.reagent ? 'primary' : 'secondary'}
                aria-pressed={r.reagent === route.reagent}
                onClick={() => setReagent(r.reagent)}
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
