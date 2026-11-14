'use client'

import { useId, useState, type ReactNode } from 'react'
import { Button, NumberField, Segmented, Slider } from '@/components/controls'
import { ElementTile } from '@/components/periodic'
import { PartialTable } from '@/components/animations/unit3/history/PartialTable'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { densityGcm3 } from '@/lib/chem/solid-density'
import {
  EKA_ALUMINIUM,
  EKA_SILICON,
  mean,
  nearestKnownNeighbours,
  percentError,
  type EkaElement,
  type Neighbours,
} from '@/lib/chem/mendeleev'
import type { ElementRecord } from '@/lib/chem/periodic-data'
import styles from './mendeleev-predict.module.css'

type Target = 'aluminium' | 'silicon'
type OxideChoice = 'E2O' | 'E2O3' | 'EO' | 'EO2'

const OXIDE_OPTIONS: readonly { value: OxideChoice; label: ReactNode }[] = [
  { value: 'E2O', label: <>E<sub>2</sub>O</> },
  { value: 'E2O3', label: <>E<sub>2</sub>O<sub>3</sub></> },
  { value: 'EO', label: <>EO</> },
  { value: 'EO2', label: <>EO<sub>2</sub></> },
]

const SPECS: Record<Target, EkaElement> = { aluminium: EKA_ALUMINIUM, silicon: EKA_SILICON }
const MASS_RANGE = { min: 40, max: 100, step: 0.1 } as const
const DENSITY_RANGE = { min: 1, max: 10, step: 0.1 } as const

/** Element symbol with its subscripts, for display only. */
function oxideLabel(formula: string) {
  const parts = formula.match(/[A-Z][a-z]?|\d+/g) ?? []
  return parts.map((part, i) => (/^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>))
}

interface Neighbourhood {
  left: ElementRecord
  right: ElementRecord
  above: ElementRecord
  below: ElementRecord
}

/** The four neighbours a Learner may average. Throws if the gap has no neighbour, which the data rules out. */
function requireNeighbourhood(n: Neighbours): Neighbourhood {
  if (!n.left || !n.right || !n.above || !n.below) throw new RangeError('Gap has no full neighbourhood')
  return { left: n.left, right: n.right, above: n.above, below: n.below }
}

/**
 * Predict like Mendeleev: the Learner estimates the properties of an eka-element from
 * its neighbours, then reveals Mendeleev's prediction and the value later measured.
 */
export function MendeleevPredict(_props: SimulationProps) {
  const uid = useId().replace(/:/g, '')
  const [target, setTarget] = useState<Target>('aluminium')
  const [revealed, setRevealed] = useState(false)
  const [estimates, setEstimates] = useState<Record<Target, { mass: number; density: number; oxide: OxideChoice }>>({
    aluminium: { mass: 70, density: 6, oxide: 'EO' },
    silicon: { mass: 72, density: 5, oxide: 'EO' },
  })

  const spec = SPECS[target]
  const hood = requireNeighbourhood(nearestKnownNeighbours(spec.row, spec.col))
  const est = estimates[target]
  const densityOf = (el: ElementRecord) => densityGcm3(el.Z) ?? NaN
  const horizontalMass = mean([hood.left.atomicMass, hood.right.atomicMass])
  const verticalMass = mean([hood.above.atomicMass, hood.below.atomicMass])
  const horizontalDensity = mean([densityOf(hood.left), densityOf(hood.right)])
  const verticalDensity = mean([densityOf(hood.above), densityOf(hood.below)])

  const setEstimate = (patch: Partial<(typeof estimates)[Target]>) =>
    setEstimates((prev) => ({ ...prev, [target]: { ...prev[target], ...patch } }))

  const choose = (next: Target) => {
    setTarget(next)
    setRevealed(false)
  }

  const oxideMatches = est.oxide === spec.predicted.oxide
  const found = spec.measured
  const rows = [
    {
      key: 'mass',
      label: 'Atomic mass / u',
      yours: est.mass.toFixed(1),
      predicted: spec.predicted.atomicMass.toString(),
      measured: found.atomicMass.toString(),
      yourError: percentError(est.mass, found.atomicMass),
      mendeleevError: percentError(spec.predicted.atomicMass, found.atomicMass),
    },
    {
      key: 'density',
      label: 'Density / g cm⁻³',
      yours: est.density.toFixed(2),
      predicted: spec.predicted.density.toString(),
      measured: found.density.toString(),
      yourError: percentError(est.density, found.density),
      mendeleevError: percentError(spec.predicted.density, found.density),
    },
  ]

  const summary = revealed
    ? `${spec.name}: your estimate of mass ${est.mass.toFixed(1)} u is ${rows[0].yourError.toFixed(1)} percent from the measured ${found.atomicMass} u. Mendeleev's ${spec.predicted.atomicMass} u was ${rows[0].mendeleevError.toFixed(1)} percent away. Density: your ${est.density.toFixed(2)} g cm⁻³ is ${rows[1].yourError.toFixed(1)} percent away, Mendeleev's ${spec.predicted.density} is ${rows[1].mendeleevError.toFixed(1)} percent away.`
    : `${spec.name}, at the gap in period ${spec.row}, group ${spec.col}. Average the neighbours and choose your estimates, then reveal.`

  return (
    <div className={styles.wrap} data-testid="mendeleev-predict" data-target={target}>
      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>

      <div className={styles.stage}>
        <PartialTable
          gapZ={[spec.found.Z]}
          focusZ={[hood.left.Z, hood.right.Z, hood.above.Z, hood.below.Z]}
          label={`Partial periodic table around the ${spec.name} gap, with its four neighbours`}
          dataTestId="predict-table"
        />
        <p className={styles.legend}>
          Outlined dashed cell: the gap. Blue cells: the neighbours {hood.left.symbol} (left), {hood.right.symbol}{' '}
          (right), {hood.above.symbol} (above), {hood.below.symbol} (below).
        </p>

        <div className={styles.neighbours} aria-label="Neighbours and their values">
          {(
            [
              ['Left', hood.left],
              ['Right', hood.right],
              ['Above', hood.above],
              ['Below', hood.below],
            ] as const
          ).map(([where, el]) => (
            <div key={where} className={styles.neighbour}>
              <span className={styles.neighbourWhere}>{where}</span>
              <span className={styles.neighbourName}>
                {el.symbol} <span className={styles.muted}>({el.atomicMass.toFixed(2)} u, {densityOf(el).toFixed(2)} g cm⁻³)</span>
              </span>
            </div>
          ))}
        </div>

        {revealed && (
          <div className={styles.reveal}>
            <div className={styles.averages} data-testid="averages">
              <p>
                Mean of left and right: <strong>{horizontalMass.toFixed(2)} u</strong>,{' '}
                {horizontalDensity.toFixed(2)} g cm⁻³. Mean of above and below: <strong>{verticalMass.toFixed(2)} u</strong>,{' '}
                {verticalDensity.toFixed(2)} g cm⁻³.
              </p>
            </div>
            <table className={styles.table} data-testid="results">
              <thead>
                <tr>
                  <th scope="col">Property</th>
                  <th scope="col">Your estimate</th>
                  <th scope="col">Mendeleev</th>
                  <th scope="col">Found (NCERT)</th>
                  <th scope="col">Your error</th>
                  <th scope="col">Mendeleev error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.label}</th>
                    <td>{r.yours}</td>
                    <td>{r.predicted}</td>
                    <td>{r.measured}</td>
                    <td>{r.yourError.toFixed(1)} %</td>
                    <td>{r.mendeleevError.toFixed(1)} %</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Oxide formula</th>
                  <td>{oxideLabel(est.oxide)}</td>
                  <td>{oxideLabel(spec.predicted.oxide)}</td>
                  <td>{oxideLabel(found.oxide)}</td>
                  <td>{oxideMatches ? 'matches' : 'no match'}</td>
                  <td>matches</td>
                </tr>
              </tbody>
            </table>
            <div className={styles.tiles}>
              <ElementTile element={{ ...spec.found, symbol: spec.symbol, name: spec.name, ncertName: spec.name }} predicted showMass={false} className={styles.tile} />
              <ElementTile element={spec.found} showMass={false} className={styles.tile} />
            </div>
            <p className={styles.dataNote}>Data: NCERT Table 3.3 for predictions and found values. Neighbour values: Data: PubChem.</p>
          </div>
        )}
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Predict"
            options={[
              { value: 'aluminium', label: 'Eka-aluminium' },
              { value: 'silicon', label: 'Eka-silicon' },
            ]}
            value={target}
            onChange={choose}
          />
          <div className={styles.inputs}>
            <Slider
              id={`mass-${uid}`}
              label="Estimated atomic mass"
              value={est.mass}
              min={MASS_RANGE.min}
              max={MASS_RANGE.max}
              step={MASS_RANGE.step}
              unit="u"
              format={(v) => v.toFixed(1)}
              onChange={(v) => setEstimate({ mass: v })}
            />
            <NumberField
              id={`density-${uid}`}
              label="Estimated density"
              value={est.density}
              min={DENSITY_RANGE.min}
              max={DENSITY_RANGE.max}
              step={DENSITY_RANGE.step}
              precision={2}
              unit="g cm⁻³"
              onChange={(v) => setEstimate({ density: v })}
            />
            <Segmented
              label="Oxide formula"
              options={OXIDE_OPTIONS}
              value={est.oxide}
              onChange={(v) => setEstimate({ oxide: v })}
            />
          </div>
          <div className={styles.buttons}>
            <Button onClick={() => setRevealed(true)} disabled={revealed}>
              Reveal
            </Button>
            <Button variant="secondary" onClick={() => setRevealed(false)} disabled={!revealed}>
              Hide results
            </Button>
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
