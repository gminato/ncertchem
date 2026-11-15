'use client'

import { useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, Segmented } from '@/components/controls'
import { EnthalpyDiagram, type EnthalpyLevel, type EnthalpyStep } from '@/components/thermo'
import { Label } from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { signedText } from '@/lib/chem/calorimetry-examples'
import {
  HESS_PUZZLES,
  SCALE_FACTORS,
  equationToCe,
  routeEquation,
  routeMatchesTarget,
  runningTotalsKJ,
  solutionRoute,
  termEquation,
  unmatchedSpecies,
  type RouteTerm,
} from '@/lib/chem/hess-puzzles'
import styles from './hess-builder.module.css'

/** Longest route the builder accepts. Four or fewer steps keep the diagram's labels apart. */
const MAX_STEPS = 6
/** Diagram size in its own units (the EnthalpyDiagram's drawing size). */
const DIAGRAM = { width: 384, height: 262 } as const

const PUZZLE_OPTIONS = HESS_PUZZLES.map((p, i) => ({ value: String(i), label: `Puzzle ${i + 1}` }))

/** Mhchem equation in KaTeX. The string comes from the tested equationToCe. */
function Chem({ ce }: { ce: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${ce}}`, { throwOnError: false }), [ce])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A factor as the Learner reads it: ×½, ×2 and so on. */
function factorText(factor: number): string {
  if (Math.abs(factor - 0.5) < 1e-9) return '×½'
  return `×${factor}`
}

/** Subscript digit for a step number, for the step names ΔH₁, ΔH₂ and so on. */
function subscript(n: number): string {
  return String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])
}

/**
 * Hess's-law builder. The Learner picks one of the known thermochemical equations, reverses or
 * scales it, and adds it to a route. The diagram draws the route level by level, with the running
 * ΔH. A route is correct when its net species balance matches the target. Show solution gives the
 * route that hess.ts's solver finds.
 */
export function HessBuilder(_props: SimulationProps) {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [route, setRoute] = useState<RouteTerm[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [reversed, setReversed] = useState(false)
  const [factor, setFactor] = useState<number>(1)
  const [showingSolution, setShowingSolution] = useState(false)

  const puzzle = HESS_PUZZLES[puzzleIndex]
  const totals = runningTotalsKJ(puzzle, route)
  const matched = routeMatchesTarget(puzzle, route)
  const unmatched = unmatchedSpecies(puzzle, route)
  const solution = useMemo(() => solutionRoute(puzzle), [puzzle])
  const net = routeEquation(puzzle, route)
  const finalDeltaH = totals.length > 0 ? totals[totals.length - 1] : 0

  const resetRoute = (next: RouteTerm[]) => {
    setRoute(next)
    setShowingSolution(false)
  }

  const choosePuzzle = (value: string) => {
    setPuzzleIndex(Number(value))
    setRoute([])
    setSelected(null)
    setReversed(false)
    setFactor(1)
    setShowingSolution(false)
  }

  const chooseEquation = (index: number) => {
    setSelected(index)
    setReversed(false)
    setFactor(1)
  }

  const addToRoute = () => {
    if (selected === null || route.length >= MAX_STEPS) return
    resetRoute([...route, { index: selected, factor: reversed ? -factor : factor }])
  }

  const showSolution = () => {
    setRoute(solution.route)
    setShowingSolution(true)
  }

  // Levels: the start at 0, then one level per step with the running ΔH.
  const levels: EnthalpyLevel[] = [
    { id: 'start', label: 'start', H: 0 },
    ...totals.map((H, i) => ({
      id: `after-${i + 1}`,
      label: i === totals.length - 1 && matched ? 'target' : `after step ${i + 1}`,
      H,
    })),
  ]
  const steps: EnthalpyStep[] = route.map((term, i) => ({
    id: `step-${i + 1}`,
    from: i === 0 ? 'start' : `after-${i}`,
    to: `after-${i + 1}`,
    column: i,
    dH: termEquation(puzzle, term).deltaHKJ,
    name: `ΔH${subscript(i + 1)}`,
  }))

  const readout = (() => {
    if (route.length === 0) {
      return 'No steps yet. Pick an equation, choose how to use it, and add it to the route.'
    }
    const prefix = showingSolution ? 'Solution shown. ' : ''
    if (matched) {
      return `${prefix}The route gives the target. Its ΔH is ${signedText(finalDeltaH, 1)} kJ mol⁻¹.`
    }
    const left = unmatched.map((sp) => sp.replace('C(graphite)', 'C(s)')).join(', ')
    return `${prefix}${route.length} step${route.length === 1 ? '' : 's'}, running ΔH ${signedText(finalDeltaH, 1)} kJ mol⁻¹. Species not yet balanced: ${left}.`
  })()

  return (
    <div className={styles.root} data-testid="hess-builder" data-puzzle={puzzle.id}>
      <div className={styles.column}>
        <section className={styles.target} aria-label="Target reaction">
          <p className={styles.eyebrow}>Target · difficulty {puzzle.difficulty} of 4</p>
          <p className={styles.prompt}>{puzzle.prompt}</p>
          <div className={styles.equationLine}>
            <Chem ce={equationToCe(puzzle.target)} />
          </div>
        </section>

        <div className={styles.tiles} role="group" aria-label="Known thermochemical equations">
          {puzzle.available.map((eq, i) => (
            <button
              key={eq.label}
              type="button"
              className={styles.tile}
              aria-pressed={selected === i}
              onClick={() => chooseEquation(i)}
              data-testid="hess-equation"
            >
              <Chem ce={equationToCe(eq)} />
              <span className={styles.tileDelta}>{signedText(eq.deltaHKJ, 2)} kJ mol⁻¹</span>
            </button>
          ))}
        </div>

        {selected !== null && (
          <div className={styles.selected} data-testid="hess-selected">
            <div className={styles.group} role="group" aria-label="Direction">
              <Button
                variant="secondary"
                aria-pressed={reversed}
                onClick={() => setReversed((r) => !r)}
              >
                Reverse
              </Button>
            </div>
            <div className={styles.group} role="group" aria-label="Scale factor">
              <span className={styles.groupLabel}>Scale</span>
              {SCALE_FACTORS.map((f) => (
                <Button
                  key={f}
                  variant="secondary"
                  aria-pressed={factor === f}
                  onClick={() => setFactor(f)}
                >
                  {factorText(f)}
                </Button>
              ))}
            </div>
            <Button
              variant="primary"
              disabled={route.length >= MAX_STEPS}
              onClick={addToRoute}
            >
              Add to route
            </Button>
          </div>
        )}

        {route.length > 0 && (
          <ol className={styles.route} aria-label="Route so far" data-testid="hess-route">
            {route.map((term, i) => {
              const source = puzzle.available[term.index]
              return (
                <li key={`${i}-${term.index}-${term.factor}`} className={styles.routeItem}>
                  <span>
                    <Chem ce={equationToCe(source)} />
                    {term.factor < 0 ? ' reversed' : ''}
                    {Math.abs(term.factor) !== 1 ? ` ${factorText(Math.abs(term.factor))}` : ''}
                  </span>
                  <span>{signedText(termEquation(puzzle, term).deltaHKJ, 1)}</span>
                </li>
              )
            })}
          </ol>
        )}

        <p className={`${styles.readout} ${matched ? styles.readoutDone : ''}`} aria-live="polite" data-testid="hess-readout">
          {readout}
        </p>
      </div>

      <div className={styles.column}>
        {route.length > 0 ? (
          <svg
            viewBox={`0 0 ${DIAGRAM.width} ${DIAGRAM.height}`}
            role="img"
            aria-label={`Enthalpy levels for the route so far: ${route.length} step${route.length === 1 ? '' : 's'}, running ΔH ${signedText(finalDeltaH, 1)} kJ mol⁻¹`}
            className={styles.diagram}
          >
            <EnthalpyDiagram
              columns={Math.max(3, route.length)}
              levels={levels}
              steps={steps}
              title="Route built level by level"
            />
          </svg>
        ) : (
          <svg viewBox={`0 0 ${DIAGRAM.width} ${DIAGRAM.height}`} role="img" aria-label="Empty route" className={styles.diagram}>
            <Label x={DIAGRAM.width / 2} y={DIAGRAM.height / 2} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
              Add a step to draw the route
            </Label>
          </svg>
        )}
      </div>

      <SimulationControls>
        <Segmented
          label="Puzzle"
          options={PUZZLE_OPTIONS}
          value={String(puzzleIndex)}
          onChange={choosePuzzle}
        />
        <Button variant="secondary" onClick={() => setRoute((r) => r.slice(0, -1))} disabled={route.length === 0}>
          Undo last step
        </Button>
        <Button variant="secondary" onClick={() => resetRoute([])} disabled={route.length === 0}>
          Clear route
        </Button>
        <Button variant="primary" onClick={showSolution} disabled={showingSolution}>
          Show solution
        </Button>
      </SimulationControls>
    </div>
  )
}
