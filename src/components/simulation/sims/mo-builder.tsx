'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { MODiagram, MO_DIAGRAM_SIZE } from '@/components/molecule/MODiagram'
import {
  BUILDER_SPECIES,
  builderSpecies,
  builderState,
  formatOrder,
  levelOfElectron,
  orderSwitchNote,
  stabilityVerdict,
  type BuilderSpecies,
} from '@/lib/chem/mo-builder'
import styles from './mo-builder.module.css'

type OrderChoice = 'ncert' | 'mixed' | 'unmixed'

const ORDER_OPTIONS: { value: OrderChoice; label: string }[] = [
  { value: 'ncert', label: 'NCERT order' },
  { value: 'mixed', label: 'With 2s–2p mixing' },
  { value: 'unmixed', label: 'Without mixing' },
]

const PLAY_INTERVAL_MS = 650
const START_FORMULA = 'O₂'

/** The element symbol at the start of a formula, such as "O" for O₂⁺. */
function elementOf(formula: string): string {
  return /^[A-Z][a-z]?/.exec(formula)?.[0] ?? formula
}

function mixingFor(species: BuilderSpecies, choice: OrderChoice): boolean {
  if (choice === 'ncert') return species.ncertMixing
  return choice === 'mixed'
}

/**
 * MO builder: a species, one electron placed at a time into the molecular orbital diagram in
 * the Aufbau order with Hund's rule, and a live bond order, magnetism and stability reading.
 * The energy order can be switched to show why B₂ to N₂ use the mixed order.
 */
export function MOBuilder({ reducedMotion }: SimulationProps) {
  const [formula, setFormula] = useState(START_FORMULA)
  const [placed, setPlaced] = useState(0)
  const [choice, setChoice] = useState<OrderChoice>('ncert')
  const [playing, setPlaying] = useState(false)
  const [visited, setVisited] = useState<string[]>([START_FORMULA])
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)

  const species = builderSpecies(formula)
  const total = species.electrons
  const mixing = mixingFor(species, choice)
  const state = useMemo(() => builderState(total, placed, mixing), [total, placed, mixing])
  const lastLevel = levelOfElectron(state.levels, placed)
  const complete = placed === total
  const verdict = stabilityVerdict(state.bondOrder)
  const other = builderState(total, total, !mixing)
  const order = formatOrder(state.bondOrder)

  // Play adds one electron per tick. It stops at the last electron and when the simulation is off screen.
  const running = playing && placed < total
  useEffect(() => {
    if (!running || !active) return
    const id = window.setInterval(() => {
      setPlaced((n) => Math.min(total, n + 1))
    }, reducedMotion ? PLAY_INTERVAL_MS * 2 : PLAY_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [running, active, total, reducedMotion])

  const choose = (next: BuilderSpecies) => {
    setFormula(next.formula)
    setPlaced(0)
    setPlaying(false)
    setVisited((list) => (list.includes(next.formula) ? list : [...list, next.formula]))
  }

  const barData = visited.map((f) => {
    const s = builderSpecies(f)
    return { formula: f, order: builderState(s.electrons, s.electrons, s.ncertMixing).bondOrder }
  })

  const summary = [
    `${formula}: ${placed} of ${total} electrons placed.`,
    placed > 0 ? `Last electron in ${lastLevel ?? 'none'}.` : '',
    `Bond order ${order}.`,
    state.paramagnetic ? `Paramagnetic, with ${state.unpaired} unpaired electron${state.unpaired === 1 ? '' : 's'}.` : 'Diamagnetic.',
    complete ? verdict.text : 'Stability is judged once every electron is placed.',
  ]
    .filter(Boolean)
    .join(' ')

  const noteMixing = mixing ? 'With 2s–2p mixing' : 'Without mixing'
  const altLabel = mixing ? 'without-mixing' : 'mixed'

  return (
    <div className={styles.root} ref={rootRef} data-testid="mo-builder" data-formula={formula}>
      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${MO_DIAGRAM_SIZE.width} ${MO_DIAGRAM_SIZE.height}`}
          className={styles.diagram}
          role="img"
          aria-label={`Molecular orbital diagram of ${formula} with ${placed} of ${total} electrons placed`}
          data-testid="mo-builder-diagram"
          data-placed={placed}
        >
          <MODiagram
            levels={state.levels}
            mixing={mixing}
            highlight={lastLevel ? [lastLevel] : []}
            elementA={elementOf(formula)}
            elementB={elementOf(formula)}
          />
        </svg>

        <div className={styles.readouts}>
          <div className={styles.card} data-testid="mo-builder-order">
            <span className={styles.cardLabel}>Bond order</span>
            <span className={styles.bigValue}>{order}</span>
            <span className={styles.small}>
              {`(N_b − N_a) / 2 = (${state.levels.filter((l) => l.bonding).reduce((s, l) => s + l.electrons, 0)} − ${state.levels.filter((l) => !l.bonding).reduce((s, l) => s + l.electrons, 0)}) / 2`}
            </span>
          </div>
          <div className={styles.card} data-testid="mo-builder-magnetism">
            <span className={styles.cardLabel}>Magnetic nature</span>
            <span className={styles.value}>
              {state.paramagnetic ? `Paramagnetic (${state.unpaired} unpaired)` : 'Diamagnetic'}
            </span>
            <span className={styles.small}>{state.configuration || 'No electrons placed'}</span>
          </div>
          <div className={styles.card} data-testid="mo-builder-verdict">
            <span className={styles.cardLabel}>Stability</span>
            <span className={styles.value}>
              {complete ? (verdict.stable ? 'Stable' : 'Not stable') : 'Still filling'}
            </span>
            <span className={styles.small}>{complete ? verdict.text : 'Place all the electrons to judge stability.'}</span>
          </div>
        </div>

        <div className={styles.note} data-testid="mo-builder-note">
          <p>
            <strong>{noteMixing} order.</strong> {orderSwitchNote(mixing)}
          </p>
          {complete && (
            <p>
              {`With the ${altLabel} order, ${formula} would have ${other.unpaired} unpaired electron${other.unpaired === 1 ? '' : 's'} and would be ${other.paramagnetic ? 'paramagnetic' : 'diamagnetic'}. `}
              {state.paramagnetic === other.paramagnetic
                ? 'Both orders give the same magnetism here.'
                : 'The two orders disagree here, and the measured magnetism decides which is right.'}
            </p>
          )}
        </div>

        <div className={styles.barCard} data-testid="mo-builder-bars">
          <span className={styles.cardLabel}>Bond orders of the species you have visited</span>
          <div className={styles.bars} role="group" aria-label="Bond orders of visited species. Select a bar to open that species.">
            {barData.map((bar) => {
              const selected = bar.formula === formula
              return (
                <button
                  key={bar.formula}
                  type="button"
                  className={styles.bar}
                  aria-pressed={selected}
                  data-selected={selected ? 'true' : 'false'}
                  data-formula={bar.formula}
                  onClick={() => choose(builderSpecies(bar.formula))}
                >
                  <span className={styles.barValue}>{formatOrder(bar.order)}</span>
                  <span className={styles.barTrack}>
                    <span className={styles.barFill} style={{ height: `${Math.max(4, (bar.order / 3) * 100)}%` }} />
                  </span>
                  <span className={styles.barName}>{bar.formula}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>

      <SimulationControls>
        <div className={styles.controls}>
          <div role="group" aria-label="Choose a species" className={styles.tiles}>
            {BUILDER_SPECIES.map((s) => {
              const selected = s.formula === formula
              return (
                <button
                  key={s.formula}
                  type="button"
                  className={styles.tile}
                  aria-pressed={selected}
                  data-selected={selected ? 'true' : 'false'}
                  onClick={() => choose(s)}
                >
                  <span className={styles.tileFormula}>{s.formula}</span>
                  <span className={styles.tileCount}>{`${s.electrons} e⁻`}</span>
                </button>
              )
            })}
          </div>
          <div className={styles.row}>
            <Slider
              label="Electrons placed"
              value={placed}
              min={0}
              max={total}
              step={1}
              unit={`of ${total}`}
              onChange={(value) => {
                setPlaying(false)
                setPlaced(value)
              }}
            />
            <Segmented label="Energy order" options={ORDER_OPTIONS} value={choice} onChange={setChoice} />
          </div>
          <div className={styles.row}>
            <Button variant="secondary" disabled={complete} onClick={() => setPlaced((n) => Math.min(total, n + 1))}>
              Add an electron
            </Button>
            <Button variant="secondary" disabled={complete} onClick={() => setPlaying((p) => !p)}>
              {running ? 'Pause' : 'Play'}
            </Button>
            <Button variant="secondary" disabled={complete} onClick={() => setPlaced(total)}>
              Fill all
            </Button>
            <Button variant="secondary" disabled={placed === 0} onClick={() => setPlaced(0)}>
              Reset
            </Button>
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}

