'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Button, Toggle } from '@/components/controls'
import { usePoseTween } from '@/components/animations/unit4/vsepr/usePoseTween'
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
const CENTRE_ELEMENT = 'X'
const LIGAND_ELEMENT = 'F'

/** Camera for each class, so the shape reads clearly. The default suits the classes not listed. */
const DEFAULT_CAMERA: V3 = [4.4, 2.4, 5.2]
/** Pulls the camera in so the molecule fills the stage. 1 is the preset distance. */
const ZOOM = 0.8
const CAMERA: Record<string, V3> = {
  '2,0': [5.2, 1.4, 2.6],
  '3,0': [1.6, 2.8, 5.2],
  '4,0': [4.4, 2.4, 5.2],
  '5,0': [3.8, 1.6, 5.6],
  '6,0': [4.4, 2.6, 5.0],
  '2,1': [1.6, 2.8, 5.2],
  '3,1': [4.4, 2.4, 5.2],
  '2,2': [4.2, 1.2, 3.4],
  '4,1': [3.2, 2.0, 5.0],
  '3,2': [2.4, 3.6, 4.4],
  '5,1': [3.4, 2.6, 4.8],
  '4,2': [1.6, 2.8, 5.2],
}

const INITIAL: VseprConfig = { bondPairs: 4, lonePairs: 0, squeeze: 0 }
/** The Stage's starting camera. CameraFrame moves it to each class's camera after that. */
const START_CAMERA: V3 = DEFAULT_CAMERA.map((v) => v * ZOOM) as V3
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

/** Moves the camera smoothly to `position` when it changes, and aims it at the centre. */
function CameraFrame({ position }: { position: V3 }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const goal = useRef(new Vector3(...position))
  const moving = useRef(false)

  useEffect(() => {
    goal.current.set(position[0], position[1], position[2])
    moving.current = true
    invalidate()
  }, [position, invalidate])

  useFrame(() => {
    if (!moving.current) return
    camera.position.lerp(goal.current, 0.14)
    camera.lookAt(0, 0, 0)
    if (camera.position.distanceTo(goal.current) < 0.002) {
      camera.position.copy(goal.current)
      camera.lookAt(0, 0, 0)
      moving.current = false
    } else {
      invalidate()
    }
  })
  return null
}

/** The 3D model for a pose, derived from its slots: the central atom, bonds, lone-pair lobes and arc. */
function sceneFromPose(pose: Pose, config: VseprConfig) {
  const atoms: Molecule3DAtom[] = [{ id: CENTRE, element: CENTRE_ELEMENT, position: [0, 0, 0] }]
  const bonds: Molecule3DBond[] = []
  const lonePairs: LonePair3D[] = []

  pose.slots.forEach((slot, index) => {
    if (slot.kind === 'bond' && slot.scale > 0.001) {
      const id = `L${index}`
      const position: V3 = [slot.dir[0] * slot.scale, slot.dir[1] * slot.scale, slot.dir[2] * slot.scale]
      atoms.push({ id, element: LIGAND_ELEMENT, position })
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
  const camera = useMemo<V3>(
    () => (CAMERA[`${config.bondPairs},${config.lonePairs}`] ?? DEFAULT_CAMERA).map((v) => v * ZOOM) as V3,
    [config.bondPairs, config.lonePairs]
  )

  const notation = axNotation(config.bondPairs, config.lonePairs)
  const exampleText = examples.length > 0 ? examples.map(formulaText).join(', ') : ''
  const idealText = cls.idealAngles.map(formatAngle).join(' and ')
  const shapeText = `${notation}: ${cls.electronGeometry.toLowerCase()} electron-pair geometry, ${cls.molecularShape.toLowerCase()} shape, ideal angle ${idealText}${examples.length ? `, for example ${examples[0]}` : ''}.`
  const squeezeText = config.squeeze > 0 && squeezeOk ? ` With the squeeze on, the bond angle is ${formatAngle(angleNow)}.` : ''

  return (
    <>
      <div className={styles.wrap}>
        <Stage3DLazy
          label={`3D model of ${notation}, showing bonding pairs and lone pairs around a central atom`}
          cameraPosition={START_CAMERA}
          fallback={<Molecule3DFallback atoms={scene.atoms} bonds={scene.bonds} lonePairs={scene.lonePairs} angleArcs={scene.angleArcs} />}
        >
          <CameraFrame position={camera} />
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
