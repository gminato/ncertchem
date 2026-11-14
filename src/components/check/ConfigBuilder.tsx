'use client'

import { useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/controls/Button'
import { Segmented } from '@/components/controls/Segmented'
import { OrbitalBox, type OrbitalSpin } from '@/components/vocab/OrbitalBox'
import { electronConfiguration } from '@/lib/chem/quantum'
import {
  RULE_NAME,
  addElectron,
  builderLabels,
  countsOf,
  describeOrbital,
  elementBySymbol,
  emptyBuilderState,
  totalElectrons,
  unpairedCount,
  validateBuilder,
  type BuilderState,
  type BuilderViolation,
  type SpinChoice,
} from '@/lib/chem/orbital-builder'
import { checkStorageKey, readCheckDone, subscribeCheckDone, writeCheckDone } from './checkStorage'
import styles from './ConfigBuilder.module.css'

export interface ConfigBuilderProps {
  /** The chemical symbol of the element, such as "N", "O" or "Fe". */
  element: string
  /** Position of this Check in its Section, used in the storage key. Defaults to the element. */
  n?: number | string
}

/** Orbital box geometry, in CSS pixels. */
const CELL = 40
const GAP = 8
const PAD = 6
const MAX_TRIES = 2

const SPIN_OPTIONS: { value: SpinChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'up', label: 'Spin ↑' },
  { value: 'down', label: 'Spin ↓' },
]

type Outcome =
  | { kind: 'correct' }
  | { kind: 'wrong'; violations: BuilderViolation[] }
  | { kind: 'revealed'; violations: BuilderViolation[] }

function slugFromPath(pathname: string | null): string {
  const segments = (pathname ?? '').split('/').filter(Boolean)
  return segments[segments.length - 1] ?? 'page'
}

/**
 * ConfigBuilder: a Check in which the Learner builds the ground-state orbital
 * diagram of an element. Clicking an orbital adds an electron. Auto gives up,
 * then down, then clears. A fixed spin adds that spin on purpose, which lets a
 * Pauli violation happen. Check names the rule broken and highlights the subshell.
 * Completion is stored in this browser, as for Check.
 */
export function ConfigBuilder({ element, n }: ConfigBuilderProps) {
  const pathname = usePathname()
  const questionId = useId()
  const info = elementBySymbol(element)
  const Z = info?.Z ?? 0

  const storageKey = checkStorageKey(slugFromPath(pathname), n ?? `config-${element}`)
  const completed = useSyncExternalStore(
    subscribeCheckDone,
    () => readCheckDone(storageKey),
    () => false
  )

  const [state, setState] = useState<BuilderState>(() => emptyBuilderState())
  const [spin, setSpin] = useState<SpinChoice>('auto')
  const [rejection, setRejection] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [tries, setTries] = useState(0)
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>([])

  if (!info) {
    return (
      <section className={styles.card} data-testid="config-builder">
        <p className={styles.feedbackWrong}>Unknown element: {element}.</p>
      </section>
    )
  }

  const locked = outcome?.kind === 'correct' || outcome?.kind === 'revealed'
  const total = totalElectrons(state)
  // Only the subshell of the rule being named is highlighted, so the learner fixes one thing at a time.
  const namedLabel = outcome && outcome.kind !== 'correct' ? outcome.violations[0]?.label ?? null : null
  const violated = new Set<string>(namedLabel ? [namedLabel] : [])
  const counts = countsOf(state)
  const ground = electronConfiguration(Z).text
  const isException = Z === 24 || Z === 29

  const changed = () => {
    setOutcome(null)
    setRejection(null)
  }

  const add = (label: string, orbital: number) => {
    if (locked) return
    const edit = addElectron(state, label, orbital, spin)
    if (edit.rejected) {
      setRejection(edit.rejected.message)
      return
    }
    setState(edit.state)
    changed()
  }

  const focusCell = (row: number, col: number) => {
    cellRefs.current[row]?.[col]?.focus()
  }

  const onCellKey = (event: KeyboardEvent<HTMLButtonElement>, row: number, col: number) => {
    const rowCount = state.length
    const colCount = state[row].orbitals.length
    switch (event.key) {
      case 'ArrowLeft':
        focusCell(row, Math.max(0, col - 1))
        break
      case 'ArrowRight':
        focusCell(row, Math.min(colCount - 1, col + 1))
        break
      case 'ArrowUp':
        if (row > 0) focusCell(row - 1, Math.min(col, state[row - 1].orbitals.length - 1))
        break
      case 'ArrowDown':
        if (row < rowCount - 1) focusCell(row + 1, Math.min(col, state[row + 1].orbitals.length - 1))
        break
      default:
        return
    }
    event.preventDefault()
  }

  const check = () => {
    if (locked) return
    if (total === 0) {
      setRejection('Add some electrons first, then press Check.')
      return
    }
    const result = validateBuilder(state, Z)
    if (result.valid) {
      setOutcome({ kind: 'correct' })
      writeCheckDone(storageKey)
      return
    }
    const nextTries = tries + 1
    setTries(nextTries)
    setOutcome({
      kind: nextTries >= MAX_TRIES ? 'revealed' : 'wrong',
      violations: result.violations,
    })
  }

  const startAgain = () => {
    setState(emptyBuilderState())
    setTries(0)
    changed()
  }

  const firstViolation = outcome && outcome.kind !== 'correct' ? outcome.violations[0] : null
  const moreViolations = outcome && outcome.kind !== 'correct' ? outcome.violations.length - 1 : 0

  const question = (
    <>
      {`Build the ground-state orbital diagram of ${info.name} (${info.symbol}, `}
      <span className="sym">Z</span>
      {` = ${Z}). Add electrons to the boxes, then press Check.`}
    </>
  )
  const explanation = [
    `${info.name} (${info.symbol}) has the ground-state configuration ${ground}.`,
    `It has ${unpairedCount(state)} unpaired electron${unpairedCount(state) === 1 ? '' : 's'}.`,
    isException
      ? 'It is one of the exceptions: one 4s electron moves into 3d, so that the d subshell is half filled or completely filled.'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={styles.card} aria-labelledby={questionId} data-testid="config-builder" data-status={outcome?.kind ?? 'idle'}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Check</span>
        {completed && <span className={styles.doneTag}>Answered</span>}
      </header>

      <p id={questionId} className={styles.question}>
        {question}
      </p>

      <div className={styles.board} role="region" aria-label={`Orbital boxes for ${info.name}`}>
        {builderLabels().map((label, row) => {
          const subshell = state[row]
          const isViolated = violated.has(label)
          const boxes: OrbitalSpin[] = subshell.orbitals.map((o) => ({
            up: o.includes('up'),
            down: o.includes('down'),
          }))
          const width = boxes.length * CELL + (boxes.length - 1) * GAP
          return (
            <div
              key={label}
              className={styles.row}
              role="group"
              aria-label={`${label} subshell, ${counts.get(label) ?? 0} of ${boxes.length * 2} electrons`}
              data-subshell={label}
              data-state={isViolated ? 'violation' : 'ok'}
            >
              <span className={styles.rowLabel} aria-hidden="true">
                {label}
              </span>
              <div className={styles.cells} style={{ width, height: CELL }}>
                <svg
                  className={styles.boxSvg}
                  style={{ left: -PAD, top: -PAD, width: width + PAD * 2, height: CELL + PAD * 2 }}
                  viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${CELL + PAD * 2}`}
                  aria-hidden="true"
                  focusable="false"
                >
                  <OrbitalBox
                    orbitals={boxes}
                    state={isViolated ? 'violation' : 'ok'}
                    size={CELL}
                    gap={GAP}
                  />
                </svg>
                {subshell.orbitals.map((spins, col) => (
                  <button
                    key={`${label}-${col}`}
                    type="button"
                    ref={(el) => {
                      ;(cellRefs.current[row] ??= [])[col] = el
                    }}
                    className={styles.cell}
                    style={{ left: col * (CELL + GAP), width: CELL, height: CELL }}
                    aria-label={`${label} orbital ${col + 1} of ${subshell.orbitals.length}: ${describeOrbital(spins)}`}
                    disabled={locked}
                    onClick={() => add(label, col)}
                    onKeyDown={(event) => onCellKey(event, row, col)}
                    data-testid="config-cell"
                  >
                    {spins.length === 2 && spins[0] === spins[1] && (
                      <span className={styles.badge} aria-hidden="true">
                        2×
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.controls}>
        <Segmented
          label="Spin of the next electron"
          options={SPIN_OPTIONS}
          value={spin}
          onChange={(value) => setSpin(value)}
        />
        <p className={styles.count} aria-live="polite">
          {total} of {Z} electrons placed
        </p>
      </div>

      <p className={styles.hint}>
        Auto adds ↑, then ↓, then clears the box. A fixed spin adds that spin on purpose. Arrow keys move
        between boxes; Space or Enter adds an electron.
      </p>

      <div className={styles.actions}>
        {outcome?.kind === 'revealed' ? (
          <Button variant="secondary" onClick={startAgain}>
            Start again
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={startAgain} disabled={total === 0 || locked}>
              Clear
            </Button>
            <Button onClick={check} disabled={total === 0 || locked}>
              Check
            </Button>
          </>
        )}
      </div>

      <div role="status" aria-live="polite" className={styles.feedback}>
        {rejection && <p className={styles.feedbackWrong}>{rejection}</p>}
        {outcome?.kind === 'correct' && (
          <p className={styles.feedbackRight}>Correct. {explanation}</p>
        )}
        {firstViolation && (
          <div className={styles.feedbackWrong}>
            <p className={styles.ruleName}>Rule broken: {RULE_NAME[firstViolation.rule]}</p>
            <p>{firstViolation.message}</p>
            {moreViolations > 0 && (
              <p className={styles.more}>
                {moreViolations} more issue{moreViolations === 1 ? '' : 's'} below. Fix this one first, then check again.
              </p>
            )}
            {outcome?.kind === 'wrong' && moreViolations === 0 && (
              <p className={styles.more}>Fix this, then check again.</p>
            )}
          </div>
        )}
        {outcome?.kind === 'revealed' && (
          <p className={styles.feedbackGentle}>
            The ground state is <strong>{ground}</strong>. {explanation}
          </p>
        )}
      </div>
    </section>
  )
}
