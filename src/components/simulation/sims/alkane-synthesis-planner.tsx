'use client'

import { useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { ReactionScheme } from '@/components/organic/ReactionScheme'
import type { SchemePath, SchemeSpecies } from '@/components/organic/hydrocarbon-geometry'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { fitScheme } from '@/components/animations/unit9/preparation/scheme-fit'
import { drawnSpecies, sodiumSaltLabel, startingSpecies, subscript } from '@/components/animations/unit9/preparation/alkane-routes-steps'
import {
  MATERIAL_MENU,
  ROUTE_LABELS,
  TARGET_MENU,
  carbonCount,
  graphOf,
  planAlkaneSynthesis,
  type MenuItem,
  type PlannerRoute,
} from '@/lib/chem/alkane-planner'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import styles from './alkane-synthesis-planner.module.css'

const ROUTES = Object.keys(ROUTE_LABELS) as PlannerRoute[]
/** Routes whose starting materials are carboxylic acids, used as their sodium salts. */
const SALT_ROUTES: readonly PlannerRoute[] = ['decarboxylate', 'kolbe']
const REAGENT: Record<PlannerRoute, { above: string; below: string }> = {
  hydrogenate: { above: 'H₂', below: 'Pt/Pd/Ni' },
  reduce: { above: 'H₂', below: 'Zn, H⁺' },
  wurtz: { above: '2 Na', below: 'dry ether' },
  decarboxylate: { above: 'NaOH, CaO', below: 'heat' },
  kolbe: { above: 'electrolysis', below: 'of the aqueous sodium salt' },
}

/** The drawing is laid out to this width in viewBox units, then scaled up to fill it. */
const SCHEME_WIDTH = 580
const VIEW_WIDTH = 600

/** The menu item with this id, falling back to the first. */
function pick(menu: readonly MenuItem[], id: string): MenuItem {
  return menu.find((m) => m.id === id) ?? menu[0]
}

/** The label of a starting material: the salt name for the acid routes, with the acid it came from. */
function materialLabel(route: PlannerRoute, item: MenuItem): string {
  const name = nameOf(graphOf(item))
  if (!SALT_ROUTES.includes(route)) return name
  return `sodium ${name.replace(/oic acid$/, 'oate')} (from ${name})`
}

/** The starting material as a species in the drawing: a salt for the acid routes. */
function materialSpecies(route: PlannerRoute, item: MenuItem): SchemeSpecies {
  const g = graphOf(item)
  if (SALT_ROUTES.includes(route)) return { formula: subscript(sodiumSaltLabel(g)), tag: `${carbonCount(g)} C` }
  return startingSpecies(g)
}

/** An mhchem equation from the lib, rendered with KaTeX. */
function equationHtml(ce: string): string {
  return katex.renderToString(ce, { throwOnError: false })
}

/**
 * The alkane synthesis planner: choose a target, a route and the starting materials. The lib says
 * whether the route gives the target, lists every product, and writes the carbon arithmetic.
 */
export function AlkaneSynthesisPlanner(_: SimulationProps) {
  const [targetId, setTargetId] = useState('pentane')
  const [route, setRoute] = useState<PlannerRoute>('wurtz')
  const [aId, setAId] = useState('bromomethane')
  const [bId, setBId] = useState('1-bromobutane')

  const target = pick(TARGET_MENU, targetId)
  const menu = MATERIAL_MENU[route]
  const a = pick(menu, aId)
  const b = pick(menu, bId)
  const materials = route === 'wurtz' ? [a.smiles, b.smiles] : [a.smiles]

  const plan = planAlkaneSynthesis(route, target.smiles, materials)
  const targetName = nameOf(parseSmiles(target.smiles))

  let scheme: SchemePath | null = null
  if (plan.outcome !== 'none') {
    const starts: SchemeSpecies[] = route === 'wurtz' ? [startingSpecies(graphOf(a)), startingSpecies(graphOf(b))] : [materialSpecies(route, a)]
    const ends: SchemeSpecies[] = plan.products.map((p) => {
      return drawnSpecies(p.graph, p.isTarget ? `${p.carbons} C · target` : `${p.carbons} C`)
    })
    scheme = [starts, { reagents: REAGENT[route].above, conditions: REAGENT[route].below }, ends]
  }
  const fit = scheme ? fitScheme(scheme, SCHEME_WIDTH) : null

  const summary = plan.outcome === 'none' ? plan.headline : `${plan.headline} ${plan.carbonArithmetic}`

  return (
    <div className={styles.wrap} data-testid="planner">
      <SimulationControls>
        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Target alkane</span>
            <select value={target.id} onChange={(e) => setTargetId(e.target.value)} data-testid="planner-target">
              {TARGET_MENU.map((m) => (
                <option key={m.id} value={m.id}>
                  {nameOf(graphOf(m))}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Route</span>
            <select
              value={route}
              onChange={(e) => {
                const next = e.target.value as PlannerRoute
                setRoute(next)
                setAId(MATERIAL_MENU[next][0].id)
                setBId(MATERIAL_MENU[next][Math.min(1, MATERIAL_MENU[next].length - 1)].id)
              }}
              data-testid="planner-route"
            >
              {ROUTES.map((r) => (
                <option key={r} value={r}>
                  {ROUTE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{route === 'wurtz' ? 'First alkyl halide' : 'Starting material'}</span>
            <select value={a.id} onChange={(e) => setAId(e.target.value)} data-testid="planner-a">
              {menu.map((m) => (
                <option key={m.id} value={m.id}>
                  {materialLabel(route, m)}
                </option>
              ))}
            </select>
          </label>
          {route === 'wurtz' && (
            <label className={styles.field}>
              <span>Second alkyl halide</span>
              <select value={b.id} onChange={(e) => setBId(e.target.value)} data-testid="planner-b">
                {menu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {materialLabel(route, m)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </SimulationControls>

      <div className={styles.stage}>
        <p className={styles.targetLine}>
          Target: <strong>{targetName}</strong>
        </p>
        {scheme && fit && (
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${Math.ceil(fit.height) + 24}`}
            className={styles.drawing}
            role="img"
            aria-label={summary}
            data-testid="planner-drawing"
          >
            <g transform={`translate(${(VIEW_WIDTH - fit.width) / 2}, 12) scale(${fit.scale})`}>
              <ReactionScheme sequence={scheme} maxWidth={fit.layoutWidth} />
            </g>
          </svg>
        )}

        {plan.outcome !== 'none' && (
          <div className={styles.equations} aria-label="Balanced equation">
            <div className={styles.equation} dangerouslySetInnerHTML={{ __html: equationHtml(plan.equation) }} data-testid="planner-equation" />
            {plan.equations.length > 1 && (
              <p className={styles.note}>Each product forms in its own equation: {plan.equations.length} channels.</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.summary} aria-live="polite" data-testid="planner-summary" data-summary={summary}>
        <p className={`${styles.verdict} ${styles[plan.outcome]}`} data-testid="planner-verdict">
          {plan.headline}
        </p>
        {plan.outcome !== 'none' && (
          <>
            <p className={styles.line}>
              <span className={styles.key}>Conditions</span> {plan.conditions}
            </p>
            <p className={styles.line} data-testid="planner-arithmetic">
              <span className={styles.key}>Carbons</span> {plan.carbonArithmetic}
            </p>
            <ul className={styles.products}>
              {plan.products.map((p) => (
                <li key={p.name} className={p.isTarget ? styles.hit : undefined}>
                  {p.name} <span className={styles.formula}>{subscript(p.formula)}</span>
                  {p.isTarget ? ' (target)' : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
