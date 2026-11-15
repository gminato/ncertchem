'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/controls'
import { SkeletalFormula, skeletalBounds, subscriptDigits } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  FAMILY_IDS,
  alkaneIsomerCount,
  compareMembers,
  isomerFamily,
  relationPhrase,
  type FamilyId,
  type FamilyMember,
  type IsomerFamily,
} from '@/lib/chem/isomer-families'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import styles from './isomer-explorer.module.css'

/** Pixels per bond in the cards. At the card width this keeps labels at about 14 px. */
const SCALE = 40
const PAD = 10

/** A formula with real subscripts, e.g. C₇H₁₆. */
const sub = (formula: string) => formula.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** A condensed formula with subscripts; a ring has no condensed form, so its formula is shown. */
function condensedText(m: FamilyMember): string {
  return m.condensed ? m.condensed.replace(/\d+/g, (d) => subscriptDigits(Number(d))) : sub(molecularFormula(m.graph))
}

/** One viewBox for every card of a family, so bonds have the same length in all of them. */
function sharedViewBox(family: IsomerFamily): string {
  let halfW = 0
  let halfH = 0
  for (const m of family.members) {
    const b = skeletalBounds(m.graph, SCALE)
    halfW = Math.max(halfW, b.width / 2)
    halfH = Math.max(halfH, b.height / 2)
  }
  return `${-halfW - PAD} ${-halfH - PAD} ${2 * (halfW + PAD)} ${2 * (halfH + PAD)}`
}

/** What the readout says, from the picks. Relations come from the lib. */
function readout(family: IsomerFamily, picks: number[]): string {
  const names = picks.map((i) => family.members[i].name)
  if (picks.length === 2) {
    const [a, b] = picks.map((i) => family.members[i])
    const { relation } = compareMembers(a, b)
    return `${a.name} and ${b.name} are ${relationPhrase(relation)}.`
  }
  if (picks.length === 1) return `Picked ${names[0]}. Pick one more to compare it.`
  return family.complete
    ? `${sub(family.formula)}: ${family.members.length} isomers are drawn. Pick two to compare them.`
    : `${sub(family.formula)}: a selection of isomers is drawn. Pick two to compare them.`
}

/**
 * Isomer explorer (Section 8.6): the isomers of a formula drawn in a grid, named by the lib. Pick
 * two to have the lib name their relation (chain, position, functional, metamerism). Picking a
 * third replaces the first pick.
 */
export function IsomerExplorer(_props: SimulationProps) {
  const [formulaId, setFormulaId] = useState<FamilyId>('C7H16')
  const [picks, setPicks] = useState<number[]>([])
  const family = useMemo(() => isomerFamily(formulaId), [formulaId])
  const viewBox = useMemo(() => sharedViewBox(family), [family])

  const choose = (id: FamilyId) => {
    setFormulaId(id)
    setPicks([])
  }

  const toggle = (index: number) => {
    setPicks((current) => {
      if (current.includes(index)) return current.filter((i) => i !== index)
      if (current.length < 2) return [...current, index]
      return [current[1], index]
    })
  }

  // An alkane formula CnH(2n+2) is counted by the enumeration, as a check on the drawn set.
  const alkane = /^C(\d+)H(\d+)$/.exec(family.id)
  const enumerated =
    alkane && Number(alkane[2]) === 2 * Number(alkane[1]) + 2 ? alkaneIsomerCount(Number(alkane[1])) : null
  const count = enumerated !== null
    ? `Counted by enumeration: ${enumerated} structural isomers of ${sub(family.formula)}.`
    : family.complete
      ? `All ${family.members.length} saturated, acyclic isomers of ${sub(family.formula)} are drawn.`
      : `This is a selection, not the full list of ${sub(family.formula)} isomers.`

  return (
    <div className={styles.sim} data-testid="isomer-explorer">
      <SimulationControls>
        <div role="group" aria-label="Formula" className={styles.formulas}>
          {FAMILY_IDS.map((id) => (
            <Button
              key={id}
              variant={id === formulaId ? 'primary' : 'secondary'}
              aria-pressed={id === formulaId}
              onClick={() => choose(id)}
            >
              {sub(id)}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={() => setPicks([])} disabled={picks.length === 0}>
          Clear picks
        </Button>
      </SimulationControls>

      <p className={styles.readout} aria-live="polite" data-testid="isomer-readout">
        {readout(family, picks)}
      </p>

      <ul className={styles.grid} aria-label={`Isomers of ${sub(family.formula)}`}>
        {family.members.map((m, i) => {
          const picked = picks.includes(i)
          const order = picks.indexOf(i)
          return (
            <li key={m.name}>
              <button
                type="button"
                className={styles.card}
                aria-pressed={picked}
                aria-label={`${m.name}, ${condensedText(m)}`}
                data-picked={picked ? 'true' : 'false'}
                onClick={() => toggle(i)}
              >
                <svg viewBox={viewBox} role="img" aria-hidden="true" className={styles.drawing}>
                  <SkeletalFormula graph={m.graph} scale={SCALE} />
                </svg>
                <span className={styles.name}>
                  {m.name}
                  {picked ? <span className={styles.badge}>{order + 1}</span> : null}
                </span>
                <span className={styles.formula}>{condensedText(m)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className={styles.count} data-testid="isomer-count">
        {count}
      </p>
    </div>
  )
}
