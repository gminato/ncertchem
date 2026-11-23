'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  REAGENTS,
  TARGETS,
  attempt,
  carbonCheck,
  nameOf,
  reagentLabel,
  routesFor,
  sameMolecule,
  startSmilesOf,
  STARTS,
  type ReagentId,
  type Rule,
} from '@/lib/chem/acid-synthesis-planner'
import styles from './acid-synthesis-planner.module.css'

type Mode = 'find' | 'try'

const SCALE = 38
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const sub = (n: number) => String(n).replace(/[0-9]/g, (d) => SUB[d])

const MODES = [
  { value: 'find', label: 'Find routes to a target' },
  { value: 'try', label: 'Try a starting material' },
] as const satisfies readonly { value: Mode; label: string }[]

/** A drawn start (top), an arrow with its reagent, and an outcome (bottom). */
interface Outcome {
  /** Heading for the bottom slot. */
  topSmiles: string
  topName: string
  reagent: ReagentId
  bottomSmiles: string | null
  bottomName: string
  /** Shown under the bottom slot when there is no product. */
  reason: string
  carbon: string
  note: string
}

export function AcidSynthesisPlanner() {
  const [mode, setMode] = useState<Mode>('find')
  const [targetId, setTargetId] = useState<string>(TARGETS[0].id)
  const [routeStart, setRouteStart] = useState<string | null>(null)
  const [tryStart, setTryStart] = useState<string>(STARTS[0].id)
  const [tryReagent, setTryReagent] = useState<ReagentId>(REAGENTS[0].id)

  const target = TARGETS.find((t) => t.id === targetId) ?? TARGETS[0]
  const targetName = nameOf(target.smiles)
  const routes = useMemo(() => routesFor(target.smiles), [target.smiles])
  const route: Rule | undefined = routes.find((r) => r.start === routeStart) ?? routes[0]

  let outcome: Outcome | null = null
  let formsTarget = false
  if (mode === 'find' && route && route.product) {
    const cc = carbonCheck(startSmilesOf(route.start), route.product)
    outcome = {
      topSmiles: startSmilesOf(route.start),
      topName: nameOf(startSmilesOf(route.start)),
      reagent: route.reagent,
      bottomSmiles: route.product,
      bottomName: nameOf(route.product),
      reason: '',
      carbon: `C${sub(cc.start)} → C${sub(cc.product)}`,
      note: route.carbonNote,
    }
    formsTarget = true
  } else if (mode === 'try') {
    const start = STARTS.find((s) => s.id === tryStart) ?? STARTS[0]
    const a = attempt(start.id, tryReagent)
    const cc = a.product ? carbonCheck(start.smiles, a.product) : null
    outcome = {
      topSmiles: start.smiles,
      topName: nameOf(start.smiles),
      reagent: tryReagent,
      bottomSmiles: a.product,
      bottomName: a.product ? nameOf(a.product) : '',
      reason: a.reason,
      carbon: cc ? `C${sub(cc.start)} → C${sub(cc.product)}` : '',
      note: a.rule?.carbonNote ?? '',
    }
    formsTarget = a.product !== null && sameMolecule(a.product, target.smiles)
  }

  const summary = !outcome
    ? `${targetName}: no route in this Section.`
    : mode === 'find'
      ? `${targetName}: ${routes.length} route${routes.length === 1 ? '' : 's'}. Shown: ${outcome.topName} with ${reagentLabel(outcome.reagent)}. Carbon count ${outcome.carbon}.`
      : outcome.bottomSmiles
        ? `${outcome.topName} with ${reagentLabel(outcome.reagent)} gives ${outcome.bottomName}. Target ${targetName} ${formsTarget ? 'forms' : 'does not form'}.`
        : `${outcome.topName} with ${reagentLabel(outcome.reagent)}: no acid. ${outcome.reason} Target ${targetName} does not form.`

  return (
    <div className={styles.root} data-testid="acid-synthesis-planner">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          {outcome && (() => {
            const top = parseSmiles(outcome.topSmiles)
            const hTop = skeletalBounds(top, SCALE).height
            const yTop = 14 + hTop / 2
            const nameTop = yTop + hTop / 2 + 20
            const arrowTop = nameTop + 14
            const arrowBottom = arrowTop + 40
            const bottom = outcome.bottomSmiles ? parseSmiles(outcome.bottomSmiles) : null
            const hBottom = bottom ? skeletalBounds(bottom, SCALE).height : 0
            const yBottom = arrowBottom + 16 + hBottom / 2
            const nameBottom = yBottom + hBottom / 2 + 20
            const carbonY = nameBottom + 26
            const noteY = carbonY + 22
            const height = bottom ? noteY + 14 : arrowBottom + 90
            return (
              <svg viewBox={`0 0 560 ${Math.ceil(height)}`} role="img" aria-label={summary} className={styles.drawing} data-testid="planner-drawing">
                <SkeletalFormula graph={top} scale={SCALE} x={280} y={yTop} />
                <text x={280} y={nameTop} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {outcome.topName}
                </text>
                <line x1={280} y1={arrowTop} x2={280} y2={arrowBottom} stroke="var(--fg-muted)" strokeWidth={2} />
                <path d={`M 272 ${arrowBottom - 10} L 280 ${arrowBottom} L 288 ${arrowBottom - 10}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2} strokeLinejoin="round" />
                <text x={296} y={arrowTop + 24} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {reagentLabel(outcome.reagent)}
                </text>
                {bottom ? (
                  <>
                    <SkeletalFormula graph={bottom} scale={SCALE} x={280} y={yBottom} />
                    <text x={280} y={nameBottom} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                      {outcome.bottomName}
                    </text>
                    <text x={280} y={carbonY} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
                      {`Carbon count ${outcome.carbon}`}
                    </text>
                    <text x={280} y={noteY} textAnchor="middle" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                      {outcome.note}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={280} y={arrowBottom + 44} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                      No acid forms
                    </text>
                    <text x={280} y={arrowBottom + 70} textAnchor="middle" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                      {outcome.reason}
                    </text>
                  </>
                )}
              </svg>
            )
          })()}
        </figure>

        <p className={styles.summary} aria-live="polite">
          {summary}
        </p>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented<Mode> label="Planner mode" options={MODES} value={mode} onChange={setMode} />
          <div className={styles.row} role="group" aria-label="Target acid">
            {TARGETS.map((t) => (
              <Button
                key={t.id}
                variant={t.id === target.id ? 'primary' : 'secondary'}
                aria-pressed={t.id === target.id}
                onClick={() => {
                  setTargetId(t.id)
                  setRouteStart(null)
                }}
              >
                {nameOf(t.smiles)}
              </Button>
            ))}
          </div>
          {mode === 'find' && routes.length > 1 && (
            <div className={styles.row} role="group" aria-label="Route">
              {routes.map((r) => (
                <Button
                  key={r.start}
                  variant={r.start === route?.start ? 'primary' : 'secondary'}
                  aria-pressed={r.start === route?.start}
                  onClick={() => setRouteStart(r.start)}
                >
                  {nameOf(startSmilesOf(r.start))}
                </Button>
              ))}
            </div>
          )}
          {mode === 'try' && (
            <div className={styles.pickers}>
              <label className={styles.field}>
                <span>Starting material</span>
                <select value={tryStart} onChange={(e) => setTryStart(e.target.value)}>
                  {STARTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {nameOf(s.smiles)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Reagent</span>
                <select value={tryReagent} onChange={(e) => setTryReagent(e.target.value as ReagentId)}>
                  {REAGENTS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      </SimulationControls>
    </div>
  )
}
