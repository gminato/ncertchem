'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Button, Toggle } from '@/components/controls'
import { usePoseTween } from '@/components/animations/unit4/vsepr/usePoseTween'
import { bestView } from '@/components/animations/unit4/vsepr/vsepr-steps'
import {
  Molecule3D,
  Molecule3DFallback,
  type AngleArc3D,
  type LonePair3D,
  type Molecule3DAtom,
  type Molecule3DBond,
} from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { NCERT_SPECIES_DOMAINS, vseprClass } from '@/lib/chem/vsepr'
import {
  availableMoves,
  axNotation,
  bondAngleDeg,
  domainsFor,
  subscriptFormula,
  supportsSqueeze,
  type Pose,
  type V3,
  type VseprConfig,
} from '@/lib/chem/vsepr-morph'
import styles from './vsepr-builder.module.css'

/** The central atom's id, and the element drawn for it. It is neutral: the model is generic. */
const CENTRE = 'C'
/** The central element for each NCERT example, so the atom takes its element colour (as in the Scrolly). */
const CENTRAL_FOR_SPECIES: Record<string, string> = {
  CH4: 'C',
  CO2: 'C',
  NH3: 'N',
  H2O: 'O',
  PCl5: 'P',
  SF6: 'S',
  SF4: 'S',
  SO2: 'S',
  BF3: 'B',
  BeCl2: 'Be',
  XeF4: 'Xe',
  ClF3: 'Cl',
}
/** Used for a class with no NCERT example: a neutral colour. */
const DEFAULT_CENTRAL_ELEMENT = 'X'
/** The ligand drawn for each NCERT example: hydrogen for the three hydrides, chlorine for PCl5, fluorine otherwise. */
const LIGAND_FOR_SPECIES: Record<string, string> = { CH4: 'H', NH3: 'H', H2O: 'H', PCl5: 'Cl' }
const DEFAULT_LIGAND = 'F'

/** Distance of the camera from the centre. Each class's camera is the fitted view at this distance. */
const CAMERA_DISTANCE = 4

const INITIAL: VseprConfig = { bondPairs: 4, lonePairs: 0, squeeze: 0 }
const HINT_RIGHT: V3 = [1, 0, 0]
const HINT_UP: V3 = [0, 1, 0]

const formatAngle = (deg: number) => `${Number(deg.toFixed(1))}°`

/** Subscripted formula for a species name from the NCERT tables, e.g. "H2O" becomes "H₂O". */
const formulaText = (name: string) => subscriptFormula(name)

/** The NCERT species with this many bonding and lone pairs, for the example line. */
function examplesFor(config: VseprConfig): string[] {
  return Object.entries(NCERT_SPECIES_DOMAINS)
    .filter(([, d]) => d.bondPairs === config.bondPairs && d.lonePairs === config.lonePairs)
    .map(([name]) => name)
}

/** The arc is shown only where it reads cleanly: a bent or trigonal arrangement with two or more bonds. */
function arcApplies(config: VseprConfig): boolean {
  const domains = config.bondPairs + config.lonePairs
  return config.bondPairs >= 2 && domains <= 4 && !(config.bondPairs === 2 && config.lonePairs === 0)
}

/**
 * The camera for a class: the oblique view that keeps every domain apart (the same view the
 * Scrolly uses), so no bond foreshortens onto the atom.
 */
function cameraFor(config: VseprConfig): V3 {
  const view = bestView(domainsFor(config))
  return [view[0] * CAMERA_DISTANCE, view[1] * CAMERA_DISTANCE, view[2] * CAMERA_DISTANCE]
}

/** The ligand element for a class: the NCERT example's, if it has one. */
function ligandFor(config: VseprConfig): string {
  const example = examplesFor(config).find((name) => name in LIGAND_FOR_SPECIES)
  return example ? LIGAND_FOR_SPECIES[example] : DEFAULT_LIGAND
}

/** The central element for a class: the NCERT example's, if it has one. */
function centralFor(config: VseprConfig): string {
  const example = examplesFor(config).find((name) => name in CENTRAL_FOR_SPECIES)
  return example ? CENTRAL_FOR_SPECIES[example] : DEFAULT_CENTRAL_ELEMENT
}

/** The 3D model for a pose, derived from its slots: the central atom, bonds, lone-pair lobes and arc. */
function sceneFromPose(pose: Pose, config: VseprConfig) {
  const ligand = ligandFor(config)
  const atoms: Molecule3DAtom[] = [{ id: CENTRE, element: centralFor(config), position: [0, 0, 0] }]
  const bonds: Molecule3DBond[] = []
  const lonePairs: LonePair3D[] = []

  pose.slots.forEach((slot, index) => {
    if (slot.kind === 'bond' && slot.scale > 0.001) {
      const id = `L${index}`
      const position: V3 = [slot.dir[0] * slot.scale, slot.dir[1] * slot.scale, slot.dir[2] * slot.scale]
      atoms.push({ id, element: ligand, position })
      bonds.push({ a: CENTRE, b: id, order: 1 })
    } else if (slot.kind === 'lone') {
      lonePairs.push({ atom: CENTRE, direction: slot.dir })
    }
  })

  // The arc follows the class, not the morph: it is present for the whole transition, so its
  // label is never mounted and unmounted frame by frame. It joins the first two bonds still drawn.
  const drawn = pose.slots.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.kind === 'bond' && slot.scale > 0.001)
  const angleArcs: AngleArc3D[] =
    arcApplies(config) && drawn.length >= 2
      ? [
          {
            a: `L${drawn[0].index}`,
            centre: CENTRE,
            b: `L${drawn[1].index}`,
            label: formatAngle(bondAngleDeg(config)),
          },
        ]
      : []

  return { atoms, bonds, lonePairs, angleArcs }
}

/** A row with a label, the current count, and − and + buttons that are disabled when the move is not an NCERT class. */
function Stepper({
  label,
  singular,
  value,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: {
  label: string
  /** The word for one, for the button names: "bonding pair". */
  singular: string
  value: number
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <span className={styles.stepperLabel}>{label}</span>
      <Button variant="secondary" onClick={onDecrease} disabled={!canDecrease} aria-label={`Remove one ${singular}`}>
        −
      </Button>
      <span className={styles.stepperValue} aria-live="off">
        {value}
      </span>
      <Button variant="secondary" onClick={onIncrease} disabled={!canIncrease} aria-label={`Add one ${singular}`}>
        +
      </Button>
    </div>
  )
}

/** One line of the readout: a name and a value. */
function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowName}>{name}</dt>
      <dd className={styles.rowValue}>{children}</dd>
    </div>
  )
}

/**
 * The VSEPR Builder: the Learner adds or removes bonding pairs and lone pairs around a central
 * atom. The electron-pair geometry is drawn in 3D and morphs into the molecular shape, with the
 * lone pairs as translucent lobes. A readout gives AXₙEₘ, the two geometries, the ideal angle,
 * and a real example. The squeeze toggle shows lone pairs closing the bond angle.
 */
export function VseprBuilder({ reducedMotion }: SimulationProps) {
  const [config, setConfig] = useState<VseprConfig>(INITIAL)

  const moves = availableMoves(config)
  const squeezeOk = supportsSqueeze(config.bondPairs, config.lonePairs)
  const cls = vseprClass(config.bondPairs, config.lonePairs)
  const examples = examplesFor(config)
  const angleNow = bondAngleDeg(config)

  /** Changing the count keeps the squeeze only where NCERT gives an angle for the new class. */
  const change = (bondPairs: number, lonePairs: number) =>
    setConfig((prev) => ({
      bondPairs,
      lonePairs,
      squeeze: supportsSqueeze(bondPairs, lonePairs) ? prev.squeeze : 0,
    }))

  const target = useMemo(
    () => ({ domains: domainsFor(config), right: HINT_RIGHT, up: HINT_UP }),
    [config]
  )
  const pose = usePoseTween(target, reducedMotion)
  const scene = useMemo(() => sceneFromPose(pose, config), [pose, config])
  const camera = useMemo<V3>(() => cameraFor(config), [config])

  const notation = axNotation(config.bondPairs, config.lonePairs)
  const idealText = cls.idealAngles.map(formatAngle).join(' and ')
  const shapeText = `${notation}: ${cls.electronGeometry.toLowerCase()} electron-pair geometry, ${cls.molecularShape.toLowerCase()} shape, ideal angle ${idealText}${examples.length ? `, for example ${examples[0]}` : ''}.`
  const squeezeText = config.squeeze > 0 && squeezeOk ? ` With the squeeze on, the bond angle is ${formatAngle(angleNow)}.` : ''

  return (
    <>
      <div className={styles.wrap}>
        <Stage3DLazy
          label={`3D model of ${notation}, showing bonding pairs and lone pairs around a central atom`}
          cameraPosition={camera}
          cameraTo={camera}
          fallback={<Molecule3DFallback atoms={scene.atoms} bonds={scene.bonds} lonePairs={scene.lonePairs} angleArcs={scene.angleArcs} />}
        >
          <Molecule3D atoms={scene.atoms} bonds={scene.bonds} lonePairs={scene.lonePairs} angleArcs={scene.angleArcs} />
        </Stage3DLazy>

        <dl className={styles.readout} data-testid="vsepr-readout">
          <Row name="Notation">{notation}</Row>
          <Row name="Electron-pair geometry">{cls.electronGeometry}</Row>
          <Row name="Molecular shape">{cls.molecularShape}</Row>
          <Row name="Ideal angle">{idealText}</Row>
          {cls.reportedAngle !== null && (
            <Row name="Bond angle shown">
              {formatAngle(angleNow)}
              {config.squeeze > 0 ? ' (squeezed)' : ''}
            </Row>
          )}
          {examples.length > 0 && (
            <Row name="Example">
              {examples.map(formulaText).map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  {name}
                </span>
              ))}
            </Row>
          )}
        </dl>
        <p className={styles.note}>
          Repulsion decreases in the order lone pair–lone pair, then lone pair–bonding pair, then bonding pair–bonding pair. A multiple bond counts as one pair.
        </p>
        <p className={styles.srOnly} aria-live="polite">
          {shapeText}
          {squeezeText}
        </p>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <Stepper
            label="Bonding pairs"
            singular="bonding pair"
            value={config.bondPairs}
            canDecrease={moves.removeBond}
            canIncrease={moves.addBond}
            onDecrease={() => change(config.bondPairs - 1, config.lonePairs)}
            onIncrease={() => change(config.bondPairs + 1, config.lonePairs)}
          />
          <Stepper
            label="Lone pairs"
            singular="lone pair"
            value={config.lonePairs}
            canDecrease={moves.removeLonePair}
            canIncrease={moves.addLonePair}
            onDecrease={() => change(config.bondPairs, config.lonePairs - 1)}
            onIncrease={() => change(config.bondPairs, config.lonePairs + 1)}
          />
          <Toggle
            label="Squeeze the bond angle"
            checked={config.squeeze > 0 && squeezeOk}
            disabled={!squeezeOk}
            onChange={(on) => setConfig((prev) => ({ ...prev, squeeze: on ? 1 : 0 }))}
          />
        </div>
      </SimulationControls>
    </>
  )
}
