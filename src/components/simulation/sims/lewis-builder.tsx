'use client'

import { useMemo, useState } from 'react'
import { LewisDiagram, type LewisAtom as DiagramAtom } from '@/components/molecule/LewisDiagram'
import type { LewisBondSpec } from '@/components/molecule/lewis-geometry'
import { Button, NumberField } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import {
  LEWIS_BUILDER_SPECIES,
  applyFit,
  compareWithTarget,
  cycleBond,
  describeOctet,
  emptyLearner,
  fitLayout,
  adjustLonePairs,
  learnerElectronsPlaced,
  learnerElectronsRemaining,
  learnerFormalCharges,
  learnerOctets,
  learnerStage,
  learnerTotalElectrons,
  setCounted,
  stageMessage,
  toggleUnpaired,
  type LearnerState,
} from '@/lib/chem/lewis-learning'
import { lewisStructure, type LewisStructure } from '@/lib/chem/lewis'
import styles from './lewis-builder.module.css'

// Sized for the simulation stage: 560 units wide, read at about 14 px in the card.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 280
const FIT_PADDING = 56
const FIT_MAX_SCALE = 96
/** The diagram's bond clearances are sized for its 16-unit default symbol font. */
const SYMBOL_FONT = 16

const SUBSCRIPT: Readonly<Record<string, string>> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

/** Writes the digits of a conventional formula as subscripts, for example CO2 as CO₂. */
export function displayFormula(name: string): string {
  return name.replace(/\d/g, (d) => SUBSCRIPT[d] ?? d)
}

const BOND_NAME = ['no bond', 'single', 'double', 'triple'] as const

/** A formal charge with a true minus sign: +1, 0, −1. */
export function signedCharge(q: number): string {
  if (q === 0) return '0'
  return q > 0 ? `+${q}` : `−${Math.abs(q)}`
}

/** The charge of the whole species, written after the bracket: 2−, −, +. */
function chargeMark(charge: number): string {
  const sign = charge < 0 ? '−' : '+'
  const magnitude = Math.abs(charge)
  return magnitude > 1 ? `${magnitude}${sign}` : sign
}

/**
 * The Lewis structure builder. The Learner counts valence electrons, then bonds the atoms,
 * places lone pairs and completes the octets. Electron use, formal charges and octets are
 * recomputed from lewis.ts on every change, and the diagram is drawn by LewisDiagram.
 */
export function LewisBuilder() {
  const [speciesKey, setSpeciesKey] = useState<string>('H2O')
  const target: LewisStructure = useMemo(() => lewisStructure(speciesKey), [speciesKey])
  const [learner, setLearner] = useState<LearnerState>(() => emptyLearner(target))
  const [selected, setSelected] = useState(0)

  const chooseSpecies = (key: string) => {
    const next = lewisStructure(key)
    setSpeciesKey(key)
    setLearner(emptyLearner(next))
    setSelected(0)
  }

  const total = learnerTotalElectrons(learner)
  const placed = learnerElectronsPlaced(learner)
  const remaining = learnerElectronsRemaining(learner)
  const stage = learnerStage(learner, target)
  const charges = learnerFormalCharges(learner, target)
  const octets = learnerOctets(learner, target)
  const comparison = compareWithTarget(learner, target)
  const locked = stage === 'count'
  const name = displayFormula(target.name)

  const fit = fitLayout(
    target.atoms.map((a) => ({ x: a.x, y: a.y })),
    VIEW_WIDTH,
    VIEW_HEIGHT,
    FIT_PADDING,
    FIT_MAX_SCALE
  )
  const points = target.atoms.map((a) => applyFit(fit, { x: a.x, y: a.y }))

  // Formal charges mean something only once atoms are bonded. Before that they are not drawn.
  const anyBond = learner.orders.some((row) => row.some((order) => order > 0))
  const shownCharges = anyBond ? charges : charges.map(() => 0)

  const diagramAtoms: DiagramAtom[] = learner.atoms.map((atom, i) => ({
    id: `a${i}`,
    element: atom.element,
    x: points[i].x,
    y: points[i].y,
    lonePairs: atom.lonePairs,
    unpaired: atom.unpaired,
    formalCharge: shownCharges[i],
  }))
  const bonds: LewisBondSpec[] = []
  learner.atoms.forEach((_atom, i) => {
    learner.atoms.forEach((_other, j) => {
      if (j <= i) return
      const order = learner.orders[i][j]
      if (order > 0) bonds.push({ a: `a${i}`, b: `a${j}`, order: order as 1 | 2 | 3 })
    })
  })
  const brackets =
    target.charge !== 0
      ? [
          {
            atoms: learner.atoms.map((_a, i) => `a${i}`),
            charge: (
              <tspan fontSize={16} dy="-2">
                {chargeMark(target.charge)}
              </tspan>
            ),
          },
        ]
      : []

  const selectedAtom = learner.atoms[selected]
  const selectedPoint = points[selected]

  const verdict = (() => {
    if (stage === 'count' || stage === 'skeleton') return ''
    if (comparison.identical) return `This matches the standard Lewis structure of ${name}.`
    if (comparison.resonanceEquivalent) {
      return `This is another resonance form of ${name}: the same electrons, charges and octets, with the bonds in different places.`
    }
    if (stage === 'done') {
      return `Every electron is used and the octets are satisfied, but this is not the standard drawing of ${name}. Compare the bonds.`
    }
    return ''
  })()

  return (
    <div className={styles.root} data-species={speciesKey} data-stage={stage}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.stage}
        role="img"
        aria-label={`Lewis structure of ${name} as built so far: ${placed} of ${total} valence electrons placed.`}
        data-testid="lewis-builder"
      >
        <LewisDiagram
          atoms={diagramAtoms}
          bonds={bonds}
          brackets={brackets}
          fontSize={SYMBOL_FONT}
          dotRadius={2.2}
          pairHalfGap={2.8}
          lonePairRadius={10}
        />
        {selectedAtom && selectedPoint && (
          <circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r={34}
            className={styles.focusRing}
            data-testid="builder-focus"
          />
        )}
      </svg>

      <div className={styles.readout}>
        <p className={styles.message} aria-live="polite" data-testid="builder-message">
          {stageMessage(stage, remaining)}
          {verdict && <span className={styles.verdict}> {verdict}</span>}
        </p>

        <dl className={styles.tally} aria-label="Electron bookkeeping">
          <div>
            <dt>Valence electrons </dt>
            <dd data-testid="electrons-total">{total}</dd>
          </div>
          <div>
            <dt>placed </dt>
            <dd data-testid="electrons-placed">{placed}</dd>
          </div>
          <div>
            <dt>left </dt>
            <dd data-testid="electrons-left">{remaining}</dd>
          </div>
        </dl>

        <ul className={styles.atomList} aria-label="Formal charge and octet of each atom">
          {learner.atoms.map((atom, i) => (
            <li key={`atom-${i}`} className={styles.atomChip} data-testid="atom-chip">
              {i + 1}. {atom.element}: formal charge {anyBond ? signedCharge(charges[i]) : 'not yet'},{' '}
              {describeOctet(octets[i])}
            </li>
          ))}
        </ul>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <label>
            <span className={styles.groupLabel}>Species</span>
            <select
              className={styles.select}
              value={speciesKey}
              onChange={(e) => chooseSpecies(e.target.value)}
              data-testid="species-select"
            >
              {LEWIS_BUILDER_SPECIES.map((key) => (
                <option key={key} value={key}>
                  {displayFormula(lewisStructure(key).name)}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            label="Valence electrons you count"
            value={learner.counted ?? 0}
            min={0}
            max={80}
            step={1}
            precision={0}
            onChange={(value) => setLearner((prev) => setCounted(prev, value))}
          />

          <div role="group" aria-label="Choose an atom" className={styles.group}>
            <span className={styles.groupLabel}>Atom</span>
            {learner.atoms.map((atom, i) => (
              <button
                key={`pick-${i}`}
                type="button"
                className={styles.chip}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                {i + 1}. {atom.element}
              </button>
            ))}
          </div>

          <div role="group" aria-label={`Bonds from atom ${selected + 1}`} className={styles.group}>
            <span className={styles.groupLabel}>Bonds</span>
            {learner.atoms.map((other, j) => {
              if (j === selected || !selectedAtom) return null
              const order = learner.orders[selected][j]
              const label = `${j + 1}. ${other.element}`
              return (
                <button
                  key={`bond-${j}`}
                  type="button"
                  className={styles.chip}
                  disabled={locked}
                  aria-label={`Bond from ${selected + 1}. ${selectedAtom.element} to ${label}: ${BOND_NAME[order]}. Press to change.`}
                  onClick={() => setLearner((prev) => cycleBond(prev, selected, j))}
                >
                  {label}: {BOND_NAME[order]}
                </button>
              )
            })}
          </div>

          {selectedAtom && (
            <div role="group" aria-label={`Lone pairs on atom ${selected + 1}`} className={styles.group}>
              <span className={styles.groupLabel}>
                {selectedAtom.element} lone pairs: {selectedAtom.lonePairs}
              </span>
              <button
                type="button"
                className={styles.chip}
                disabled={locked || selectedAtom.lonePairs === 0}
                onClick={() => setLearner((prev) => adjustLonePairs(prev, selected, -1))}
              >
                Remove a pair
              </button>
              <button
                type="button"
                className={styles.chip}
                disabled={locked || selectedAtom.lonePairs >= 4}
                onClick={() => setLearner((prev) => adjustLonePairs(prev, selected, 1))}
              >
                Add a pair
              </button>
              <button
                type="button"
                className={styles.chip}
                aria-pressed={selectedAtom.unpaired === 1}
                disabled={locked}
                onClick={() => setLearner((prev) => toggleUnpaired(prev, selected))}
              >
                Unpaired electron
              </button>
            </div>
          )}

          <Button variant="secondary" onClick={() => setLearner(emptyLearner(target))}>
            Start again
          </Button>
        </div>
      </SimulationControls>
    </div>
  )
}
