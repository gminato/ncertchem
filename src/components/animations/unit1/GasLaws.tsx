'use client'

import gsap from 'gsap'
import { Label, Vessel, VocabDefs } from '@/components/vocab'
import {
  invertPairing,
  morphAtoms,
  pairAtoms,
  placeMolecules,
  type MoleculeSite,
} from './atom-scene'
import { SceneView } from './SceneView'
import { useStepState } from './useStepState'
import {
  GAS_LAWS_STEP_COUNT,
  snapshotForStep,
  stepDescription,
  volumeRatioText,
  type GasLawsSnapshot,
} from './gas-laws-steps'
import { clampStepIndex } from './useStepState'
import styles from './scene.module.css'

export interface GasLawsProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 460)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 460

/** Cylinders stand on a common base at y = 400. One unit volume is 110 units tall. */
const BASE_Y = 400
const UNIT = 110
const CYLINDER_WIDTH = 110
const CYLINDERS = {
  h2: { cx: 115, units: 2 },
  o2: { cx: 320, units: 1 },
  h2o: { cx: 525, units: 2 },
} as const

/** Close-up boxes: one unit volume each, in a row. */
const BOX = { y: 175, height: 170, width: 96 }
const BOX_X = { a: 16, b: 120, c: 256, d: 400, e: 512 } as const
const BOX_CENTRE = { x: 320, y: 260 }

/** Molecule sites inside each box, two per box (equal numbers per unit volume). */
const ROWS = [BOX.y + 57, BOX.y + 113]
/** Molecules in a box are drawn large enough that their atoms read clearly, even when split. */
const BOX_MOLECULE_SCALE = 1.25
const molecule = (formula: string, cx: number, cy: number): MoleculeSite => ({
  formula,
  cx,
  cy,
  scale: BOX_MOLECULE_SCALE,
})
const REACTANT_SITES: MoleculeSite[] = [
  molecule('H2', BOX_X.a + 48, ROWS[0]),
  molecule('H2', BOX_X.a + 48, ROWS[1]),
  molecule('H2', BOX_X.b + 48, ROWS[0]),
  molecule('H2', BOX_X.b + 48, ROWS[1]),
  molecule('O2', BOX_X.c + 48, ROWS[0]),
  molecule('O2', BOX_X.c + 48, ROWS[1]),
]
const PRODUCT_SITES: MoleculeSite[] = [
  molecule('H2O', BOX_X.d + 48, ROWS[0]),
  molecule('H2O', BOX_X.d + 48, ROWS[1]),
  molecule('H2O', BOX_X.e + 48, ROWS[0]),
  molecule('H2O', BOX_X.e + 48, ROWS[1]),
]

const PRODUCTS = placeMolecules(PRODUCT_SITES)
const REACTANTS_AT_REST = placeMolecules(REACTANT_SITES)
/** Each reactant atom becomes one product atom of the same element. */
const TARGET_OF = pairAtoms(REACTANTS_AT_REST.atoms, PRODUCTS.atoms)
const INVERSE = invertPairing(TARGET_OF)
const PRODUCT_BONDS_ON_MORPH = PRODUCTS.bonds.map((bond) => ({ a: INVERSE[bond.a], b: INVERSE[bond.b] }))

const KEYS = ['ratio', 'zoom', 'split', 'join'] as const

/**
 * The tween runs the changing properties one after another. Going forward it goes
 * ratio, zoom, split, join; going back it runs in reverse, so that atoms are never
 * regrouped before they are split.
 */
function build(step: number, state: GasLawsSnapshot, _prev: number | null, onFrame: () => void) {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })
  const net = KEYS.reduce((sum, key) => sum + (target[key] - state[key]), 0)
  const order = net >= 0 ? [...KEYS] : [...KEYS].reverse()
  let at = 0
  for (const key of order) {
    if (state[key] === target[key]) continue
    const duration = key === 'join' ? 1.4 : 0.7
    tl.to(state, { [key]: target[key], duration, ease: 'power2.inOut' } as gsap.TweenVars, at)
    at += duration * 0.75
  }
  return tl
}

/**
 * GasLaws: three gas cylinders in the ratio 2 : 1 : 2 (Gay-Lussac), a close-up that
 * shows the same number of molecules in every unit volume (Avogadro), and the diatomic
 * molecules splitting into atoms and regrouping as water.
 */
export function GasLaws({ step, reducedMotion }: GasLawsProps) {
  const active = clampStepIndex(step, GAS_LAWS_STEP_COUNT)
  const view = useStepState<GasLawsSnapshot>({
    step,
    stepCount: GAS_LAWS_STEP_COUNT,
    reducedMotion,
    snapshot: snapshotForStep,
    build,
  })

  const reactants = placeMolecules(REACTANT_SITES, view.split)
  const atoms = morphAtoms(reactants.atoms, PRODUCTS.atoms, TARGET_OF, view.join)
  const reactantBondOpacity = (1 - view.split) * (1 - view.join)
  const bonds = [
    ...reactants.bonds.map((bond) => ({ a: bond.a, b: bond.b, opacity: reactantBondOpacity })),
    ...PRODUCT_BONDS_ON_MORPH.map((bond) => ({ a: bond.a, b: bond.b, opacity: view.join })),
  ]

  const cylinderLayer = 1 - view.zoom
  const zoomScale = 0.92 + 0.08 * view.zoom
  const cylinderTop = (units: number) => BASE_Y - units * UNIT
  const cylinderCentreY = (units: number) => BASE_Y - (units * UNIT) / 2

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Three gas cylinders: two volumes of hydrogen and one of oxygen react to give two volumes of water vapour. Zoomed in, each unit volume holds the same number of molecules, and the diatomic molecules split and regroup."
        data-testid="gas-laws"
        data-step={active}
      >
        <VocabDefs idPrefix="gl" />

        {/* Layer 1: the three cylinders, with volume labels and the ratio banner */}
        <g opacity={cylinderLayer}>
          {(
            [
              { key: 'h2', formula: 'H2', units: CYLINDERS.h2.units, cx: CYLINDERS.h2.cx },
              { key: 'o2', formula: 'O2', units: CYLINDERS.o2.units, cx: CYLINDERS.o2.cx },
              { key: 'h2o', formula: 'H2O', units: CYLINDERS.h2o.units, cx: CYLINDERS.h2o.cx },
            ] as const
          ).map((cyl) => (
            <g key={cyl.key}>
              <Vessel
                variant="cylinder"
                width={CYLINDER_WIDTH}
                height={cyl.units * UNIT}
                x={cyl.cx}
                y={cylinderCentreY(cyl.units)}
                liquid={false}
              />
              {cyl.units > 1 && (
                <line
                  x1={cyl.cx - CYLINDER_WIDTH / 2}
                  x2={cyl.cx + CYLINDER_WIDTH / 2}
                  y1={cylinderTop(cyl.units) + UNIT}
                  y2={cylinderTop(cyl.units) + UNIT}
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                  style={{ stroke: 'var(--glass-wall)' }}
                />
              )}
              <Label x={cyl.cx} y={BASE_Y + 28} fontSize={17} fill="var(--fg)">
                {cyl.formula === 'H2O' ? (
                  <>
                    H<Label.Sub>2</Label.Sub>O(g)
                  </>
                ) : (
                  <>
                    {cyl.formula.slice(0, 1)}
                    <Label.Sub>{cyl.formula.slice(1)}</Label.Sub>(g)
                  </>
                )}
              </Label>
            </g>
          ))}

          <Label x={217} y={cylinderCentreY(1)} fontSize={28} fill="var(--fg-muted)">
            +
          </Label>
          <Label x={422} y={cylinderCentreY(1)} fontSize={28} fill="var(--fg-muted)">
            →
          </Label>
        </g>

        <g opacity={view.ratio * cylinderLayer}>
          <Label x={320} y={62} fontSize={20} fill="var(--orbit-active)">
            volume ratio {volumeRatioText()}
          </Label>
          <Label x={CYLINDERS.h2.cx} y={cylinderTop(2) - 16} fontSize={15} fill="var(--fg-muted)">
            2 volumes
          </Label>
          <Label x={CYLINDERS.o2.cx} y={cylinderTop(1) - 16} fontSize={15} fill="var(--fg-muted)">
            1 volume
          </Label>
          <Label x={CYLINDERS.h2o.cx} y={cylinderTop(2) - 16} fontSize={15} fill="var(--fg-muted)">
            2 volumes
          </Label>
        </g>

        {/* Layer 2: the close-up, one unit volume per box, with the molecules inside */}
        <g
          opacity={view.zoom}
          transform={`translate(${BOX_CENTRE.x} ${BOX_CENTRE.y}) scale(${zoomScale}) translate(${-BOX_CENTRE.x} ${-BOX_CENTRE.y})`}
        >
          {(
            [
              { key: 'a', x: BOX_X.a, label: 'H2' },
              { key: 'b', x: BOX_X.b, label: 'H2' },
              { key: 'c', x: BOX_X.c, label: 'O2' },
              { key: 'd', x: BOX_X.d, label: 'H2O' },
              { key: 'e', x: BOX_X.e, label: 'H2O' },
            ] as const
          ).map((box) => (
            <g key={box.key}>
              <rect
                x={box.x}
                y={BOX.y}
                width={BOX.width}
                height={BOX.height}
                rx={8}
                style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }}
                strokeWidth={1.2}
              />
              <Label x={box.x + BOX.width / 2} y={BOX.y + BOX.height + 18} fontSize={16} fill="var(--fg)">
                {box.label === 'H2O' ? (
                  <>
                    H<Label.Sub>2</Label.Sub>O
                  </>
                ) : (
                  <>
                    {box.label.slice(0, 1)}
                    <Label.Sub>{box.label.slice(1)}</Label.Sub>
                  </>
                )}
              </Label>
            </g>
          ))}

          <Label x={236} y={BOX.y + BOX.height / 2} fontSize={26} fill="var(--fg-muted)">
            +
          </Label>
          <Label x={376} y={BOX.y + BOX.height / 2} fontSize={26} fill="var(--fg-muted)">
            →
          </Label>

          <SceneView atoms={atoms} bonds={bonds} bondWidth={3} defsPrefix="gl" />

          <Label x={320} y={BOX.y + BOX.height + 50} fontSize={15} fill="var(--fg-muted)">
            one unit volume of each gas: two molecules in every box
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
