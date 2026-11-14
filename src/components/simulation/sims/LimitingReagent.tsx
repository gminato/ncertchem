'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Button, Segmented, Slider } from '@/components/controls'
import { Label, Molecule, ParticleBox, VocabDefs } from '@/components/vocab'
import { useIsActive } from '@/components/simulation/useIsActive'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  MAX_EVENTS,
  MAX_MOLECULES,
  PHASE,
  REACTOR,
  REACTION_OPTIONS,
  RESERVOIR,
  SITE,
  buildReactorPlan,
  cellCentre,
  clampCount,
  formulaLabel,
  frameAt,
  optionById,
  summaryText,
  type ReactorPlan,
} from './limiting-reagent-plan'
import { clamp01 } from './limiting-reagent-plan'
import styles from './LimitingReagent.module.css'

/** Length of the whole reaction, in seconds, at normal speed. */
const RUN_SECONDS = 3.6

type Status = 'idle' | 'running' | 'done'

/**
 * The limiting-reagent reactor. Two reactant bands sit on the left, unreacted
 * molecules stay there, and the reaction site on the right has one cell per
 * whole reaction event. Pressing React gathers each event's molecules in a
 * cell, rearranges them into products, and leaves the leftovers glowing.
 */
export function LimitingReagent({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  const [optionId, setOptionId] = useState(REACTION_OPTIONS[0].id)
  const option = optionById(optionId)
  const [counts, setCounts] = useState<Record<string, number>>(option.defaults)
  const [status, setStatus] = useState<Status>('idle')
  const [t, setT] = useState(0)

  const tweenValue = useRef({ t: 0 })
  const tween = useRef<gsap.core.Tween | null>(null)

  const plan: ReactorPlan = useMemo(() => buildReactorPlan(option, counts), [option, counts])
  const { outcome } = plan
  const noReaction = outcome.events === 0

  // Pause the run while the Simulation is off screen or the tab is hidden.
  useEffect(() => {
    if (!tween.current) return
    if (active) tween.current.resume()
    else tween.current.pause()
  }, [active])

  // Reduced motion: a run that is in progress is shown at its result at once.
  // The tween is stopped here; the displayed state is derived, so no setState is needed.
  useEffect(() => {
    if (!reducedMotion || status !== 'running') return
    tween.current?.kill()
    tween.current = null
    tweenValue.current.t = 1
  }, [reducedMotion, status])
  const settled = reducedMotion && status === 'running'
  const shownStatus: Status = settled ? 'done' : status
  const shownT = settled ? 1 : t

  useEffect(() => {
    return () => {
      tween.current?.kill()
    }
  }, [])

  const reset = () => {
    tween.current?.kill()
    tween.current = null
    tweenValue.current.t = 0
    setT(0)
    setStatus('idle')
  }

  const chooseReaction = (id: string) => {
    reset()
    setOptionId(id)
    setCounts(optionById(id).defaults)
  }

  const setCount = (formula: string, value: number) => {
    reset()
    setCounts((prev) => ({ ...prev, [formula]: clampCount(value) }))
  }

  const resetAll = () => {
    reset()
    setCounts(option.defaults)
  }

  const react = () => {
    if (status !== 'idle' || noReaction) return
    if (reducedMotion) {
      setT(1)
      setStatus('done')
      return
    }
    setStatus('running')
    tweenValue.current.t = 0
    tween.current?.kill()
    tween.current = gsap.to(tweenValue.current, {
      t: 1,
      duration: RUN_SECONDS,
      ease: 'none',
      onUpdate: () => setT(tweenValue.current.t),
      onComplete: () => {
        tween.current = null
        setStatus('done')
      },
    })
    if (!active) tween.current.pause()
  }

  const frames = frameAt(plan, shownT)
  const finished = shownStatus === 'done'
  const clipId = `limit-clip-${uid}`
  const limitingFormula = outcome.limiting

  return (
    <div ref={rootRef} className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${REACTOR.width} ${REACTOR.height}`}
        className={styles.svg}
        role="img"
        aria-label={`Reactor for ${option.label}: ${plan.molecules.length} molecules before or after the run, with the limiting reagent labelled`}
        data-testid="limiting-reagent-reactor"
        data-status={shownStatus}
      >
        <VocabDefs idPrefix="limit" />
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={REACTOR.width} height={REACTOR.height} rx={16} />
          </clipPath>
        </defs>

        <ParticleBox items={[]} width={REACTOR.width} height={REACTOR.height} defsPrefix="limit" />

        {/* Divider between the reservoir and the reaction site */}
        <line
          x1={(RESERVOIR.right + SITE.left) / 2}
          x2={(RESERVOIR.right + SITE.left) / 2}
          y1={14}
          y2={REACTOR.height - 14}
          strokeDasharray="3 5"
          style={{ stroke: 'var(--border)' }}
        />

        {/* One faint cell per possible whole reaction event */}
        {Array.from({ length: MAX_EVENTS }, (_, i) => {
          const c = cellCentre(i)
          return (
            <rect
              key={`cell-${i}`}
              x={c.x - SITE.cellWidth / 2 + 6}
              y={c.y - SITE.cellHeight / 2 + 6}
              width={SITE.cellWidth - 12}
              height={SITE.cellHeight - 12}
              rx={10}
              strokeWidth={1}
              strokeDasharray="2 4"
              style={{ stroke: 'var(--border)', fill: 'none' }}
            />
          )
        })}

        {/* Reaction flash in each cell that reacts */}
        {plan.cells.map((c, i) => {
          const flash = Math.sin(Math.PI * clamp01((t - PHASE.gatherEnd) / (PHASE.consumeEnd - PHASE.gatherEnd)))
          if (flash <= 0.001) return null
          return (
            <circle
              key={`flash-${i}`}
              cx={c.x}
              cy={c.y}
              r={18 + 16 * flash}
              strokeWidth={2}
              style={{ stroke: 'var(--orbit-active)', fill: 'none', opacity: flash * 0.8 }}
            />
          )
        })}

        <g clipPath={`url(#${clipId})`}>
          {frames.map((f) => {
            const scale = 0.8
            return (
              <g key={f.id} opacity={f.opacity} data-molecule={f.formula}>
                {f.glow && (
                  <circle
                    cx={f.x}
                    cy={f.y}
                    r={30}
                    strokeWidth={1.5}
                    style={{
                      fill: 'var(--caution-soft)',
                      stroke: 'var(--caution)',
                      filter: 'drop-shadow(0 0 calc(4px * var(--glow-strength)) var(--caution))',
                    }}
                  />
                )}
                <Molecule
                  formula={f.formula}
                  style="ball-and-stick"
                  x={f.x}
                  y={f.y}
                  scale={scale}
                  defsPrefix="limit"
                />
              </g>
            )
          })}
        </g>

        {/* Reservoir band labels; the limiting reagent gets a caution tag */}
        {option.reaction.reactants.map((r, k) => {
          const isLimiting = r.formula === limitingFormula
          return (
            <Label
              key={`band-${r.formula}`}
              x={RESERVOIR.left + 10}
              y={RESERVOIR.bandTop[k] + 16}
              textAnchor="start"
              fontSize={16}
              halo
              fill={isLimiting ? 'var(--caution)' : 'var(--fg-muted)'}
              data-testid={isLimiting ? 'limiting-label' : undefined}
            >
              {formulaLabel(r.formula)}
              {isLimiting ? ' · limiting reagent' : ''}
            </Label>
          )
        })}

      </svg>

      <p className={styles.caption}>
        Molecules react only in whole events: each event uses every coefficient once, so leftovers are whole numbers.
      </p>

      <table className={styles.table} aria-label={`Result for ${option.label}`}>
        <thead>
          <tr>
            <th scope="col">Species</th>
            <th scope="col">Consumed</th>
            <th scope="col">Remaining</th>
            <th scope="col">Produced</th>
          </tr>
        </thead>
        <tbody>
          {option.reaction.reactants.map((r) => (
            <tr key={`row-${r.formula}`} className={r.formula === limitingFormula ? styles.limitingRow : undefined}>
              <th scope="row">
                {formulaLabel(r.formula)}
                {r.formula === limitingFormula && <span className={styles.badge}>limiting</span>}
              </th>
              <td>{outcome.consumed[r.formula]}</td>
              <td>{outcome.remaining[r.formula]}</td>
              <td className={styles.dash}>—</td>
            </tr>
          ))}
          {option.reaction.products.map((p) => (
            <tr key={`row-${p.formula}`}>
              <th scope="row">{formulaLabel(p.formula)}</th>
              <td className={styles.dash}>—</td>
              <td className={styles.dash}>—</td>
              <td>{outcome.produced[p.formula]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.srOnly} aria-live="polite">
        {summaryText(plan, finished)}
      </p>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Reaction"
            options={REACTION_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            value={option.id}
            onChange={chooseReaction}
          />
          <div className={styles.sliders}>
            {option.reaction.reactants.map((r) => (
              <Slider
                key={`slider-${option.id}-${r.formula}`}
                id={`limit-${uid}-${r.formula}`}
                label={`${formulaLabel(r.formula)} molecules`}
                value={counts[r.formula] ?? 0}
                min={0}
                max={MAX_MOLECULES}
                step={1}
                onChange={(v) => setCount(r.formula, v)}
              />
            ))}
          </div>
          <div className={styles.buttons}>
            <Button onClick={react} disabled={shownStatus !== 'idle' || noReaction}>
              {shownStatus === 'running' ? 'Reacting…' : 'React'}
            </Button>
            <Button variant="secondary" onClick={resetAll}>
              Reset
            </Button>
          </div>
          {noReaction && <p className={styles.note}>One reactant is missing, so nothing reacts.</p>}
        </div>
      </SimulationControls>
    </div>
  )
}
