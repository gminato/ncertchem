'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/controls'
import { FunctionalGroupBadge, SkeletalFormula, skeletalFrame, subscriptDigits } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { GROUP_TABLE, type GroupId, type RingClass } from '@/lib/chem/classification'
import { SORTER_GROUP_OPTIONS, sorterDeck, type SorterCard } from '@/lib/chem/classification-examples'
import styles from './functional-group-sorter.module.css'

const VIEW_WIDTH = 340
const VIEW_HEIGHT = 250
const CX = VIEW_WIDTH / 2
const CY = 140
const SCALE = 34

const CLASSES: { key: RingClass; label: string }[] = [
  { key: 'acyclic', label: 'Acyclic' },
  { key: 'alicyclic', label: 'Alicyclic' },
  { key: 'aromatic', label: 'Aromatic' },
  { key: 'heterocyclic', label: 'Heterocyclic' },
]

const DECK = sorterDeck()

const sub = (formula: string) => formula.replace(/\d+/g, (d) => subscriptDigits(Number(d)))
const groupName = (g: GroupId | 'none') => (g === 'none' ? 'no functional group (a hydrocarbon)' : GROUP_TABLE[g].name)
const className = (c: RingClass) => CLASSES.find((x) => x.key === c)?.label.toLowerCase() ?? c

/**
 * The feedback sentence for one answer. Each part is from the lib: the class and group of the card.
 */
function feedback(card: SorterCard, cls: RingClass | null, group: GroupId | 'none' | null): string {
  const classOk = cls === card.ringClass
  const groupOk = group === card.group
  const molecule = card.name ?? sub(card.formula)
  const classPart = classOk
    ? `Class: ${className(card.ringClass)}.`
    : `Class: ${className(card.ringClass)}, not ${className(cls as RingClass)}.`
  const groupPart = groupOk
    ? `Group: ${groupName(card.group)}.`
    : `Group: ${groupName(card.group)}, not ${groupName(group as GroupId | 'none')}.`
  return `${molecule}. ${classPart} ${groupPart}`
}

/**
 * Functional-group sorter (Section 8.4): a deck of molecules, each to be placed in its class (acyclic,
 * alicyclic, aromatic or heterocyclic) and given its principal functional group. Check shows the
 * answer, with the group highlighted on the drawing and named by the lib. The score counts the
 * first check of each card.
 */
export function FunctionalGroupSorter(_props: SimulationProps) {
  const [index, setIndex] = useState(0)
  const [cls, setCls] = useState<RingClass | null>(null)
  const [group, setGroup] = useState<GroupId | 'none' | null>(null)
  const [checked, setChecked] = useState(false)
  const [scored, setScored] = useState<Record<number, boolean>>({})
  const [message, setMessage] = useState('Pick a class and a functional group, then check.')
  const card = DECK[index]
  const done = index >= DECK.length

  const frame = useMemo(() => (done ? null : skeletalFrame(card.graph, SCALE)), [card, done])

  const correctFirstTry = Object.values(scored).filter(Boolean).length
  const answered = Object.keys(scored).length

  const check = () => {
    if (!cls || !group) return
    const right = cls === card.ringClass && group === card.group
    setChecked(true)
    setMessage(feedback(card, cls, group))
    if (!(index in scored)) setScored((s) => ({ ...s, [index]: right }))
  }

  const next = () => {
    setIndex((i) => i + 1)
    setCls(null)
    setGroup(null)
    setChecked(false)
    setMessage('Pick a class and a functional group, then check.')
  }

  const restart = () => {
    setIndex(0)
    setScored({})
    setCls(null)
    setGroup(null)
    setChecked(false)
    setMessage('Pick a class and a functional group, then check.')
  }

  if (done) {
    return (
      <div className={styles.sim} data-testid="sorter">
        <p className={styles.summary} aria-live="polite" data-testid="sorter-score">
          Finished. {correctFirstTry} of {DECK.length} cards right on the first check.
        </p>
        <SimulationControls>
          <Button variant="primary" onClick={restart}>
            Deal the deck again
          </Button>
        </SimulationControls>
      </div>
    )
  }

  const anchorAtom = card.groupAtoms[0]
  const badgeAnchor = frame && anchorAtom !== undefined ? frame.points[anchorAtom] : null
  const showGroup = checked && card.group !== 'none' && badgeAnchor !== null

  return (
    <div className={styles.sim} data-testid="sorter" data-card={index}>
      <div className={styles.header}>
        <span className={styles.count} data-testid="sorter-count">
          Card {index + 1} of {DECK.length}
        </span>
        <span className={styles.score} data-testid="sorter-tally">
          First-check score: {correctFirstTry} of {answered}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={`${card.name ?? sub(card.formula)}, formula ${sub(card.formula)}`}
        className={styles.drawing}
        data-testid="sorter-drawing"
      >
        <SkeletalFormula
          graph={card.graph}
          scale={SCALE}
          x={CX}
          y={CY}
          highlightAtoms={checked ? card.groupAtoms : []}
          highlightBonds={[]}
        />
        {showGroup && badgeAnchor ? (
          <FunctionalGroupBadge
            label={`${GROUP_TABLE[card.group as GroupId].label}  ${GROUP_TABLE[card.group as GroupId].name}`}
            x={CX}
            y={30}
            anchor={{ x: CX + badgeAnchor.x, y: CY + badgeAnchor.y }}
            data-testid="sorter-badge"
          />
        ) : null}
        <text x={CX} y={VIEW_HEIGHT - 14} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
          {card.name ?? sub(card.formula)}
        </text>
      </svg>

      <div role="group" aria-label="Class" className={styles.row}>
        {CLASSES.map((c) => (
          <Button
            key={c.key}
            variant={cls === c.key ? 'primary' : 'secondary'}
            aria-pressed={cls === c.key}
            onClick={() => {
              setCls(c.key)
              setChecked(false)
            }}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div role="group" aria-label="Functional group" className={styles.groups}>
        {SORTER_GROUP_OPTIONS.map((g) => (
          <Button
            key={g}
            variant={group === g ? 'primary' : 'secondary'}
            aria-pressed={group === g}
            onClick={() => {
              setGroup(g)
              setChecked(false)
            }}
          >
            {g === 'none' ? 'None' : GROUP_TABLE[g].name}
          </Button>
        ))}
      </div>

      <SimulationControls>
        <Button variant="primary" onClick={check} disabled={!cls || !group}>
          Check
        </Button>
        <Button variant="secondary" onClick={next} disabled={!checked}>
          Next card
        </Button>
      </SimulationControls>

      <p className={styles.feedback} aria-live="polite" data-testid="sorter-feedback">
        {message}
      </p>
    </div>
  )
}
