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
import { useStepState, clampStepIndex } from './useStepState'
import {
  GAS_LAWS_STEP_COUNT,
  snapshotForStep,
  stepDescription,
  volumeRatioText,
  type GasLawsSnapshot,
} from './gas-laws-steps'
import styles from './scene.module.css'

export interface GasLawsProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 600 x 500). Content spans y = 44 to 460 so the card is filled.
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 500
const LABEL = 16

/** Cylinders stand on a common base at y = 420. One unit volume is 150 units tall. */
const BASE_Y = 420
const UNIT = 150
const CYLINDER_WIDTH = 120
const CYLINDERS = {
  h2: { cx: 110, units: 2 },
  o2: { cx: 300, units: 1 },
  h2o: { cx: 490, units: 2 },
} as const

/** Close-up boxes: one unit volume each, in one row across the full width. */
const BOX = { y: 110, height: 300, width: 92 }
const BOX_X = { a: 23, b: 133, c: 259, d: 385, e: 495 } as const
const PLUS_X = 248
const ARROW_X = 375
const BOX_CENTRE_Y = 260

/** Two molecules per box, one third and two thirds of the way down. */
const ROWS = [BOX.y + BOX.height / 3, BOX.y + (2 * BOX.height) / 3]
/** Molecules are drawn larger than in the cylinders, so that their atoms read clearly when split. */
const BOX_MOLECULE_SCALE = 1.4
const molecule = (formula: string, cx: number, cy: number): MoleculeSite => ({
  formula,
  cx,
  cy,
  scale: BOX_MOLECULE_SCALE,
})
const REACTANT_SITES: MoleculeSite[] = [
  molecule('H2', BOX_X.a + BOX.width / 2, ROWS[0]),
  molecule('H2', BOX_X.a + BOX.width / 2, ROWS[1]),
  molecule('H2', BOX_X.b + BOX.width / 2, ROWS[0]),
  molecule('H2', BOX_X.b + BOX.width / 2, ROWS[1]),
  molecule('O2', BOX_X.c + BOX.width / 2, ROWS[0]),
  molecule('O2', BOX_X.c + BOX.width / 2, ROWS[1]),
]
const PRODUCT_SITES: MoleculeSite[] = [
  molecule('H2O', BOX_X.d + BOX.width / 2, ROWS[0]),
  molecule('H2O', BOX_X.d + BOX.width / 2, ROWS[1]),
  molecule('H2O', BOX_X.e + BOX.width / 2, ROWS[0]),
  molecule('H2O', BOX_X.e + BOX.width / 2, ROWS[1]),
]

const PRODUCTS = placeMolecules(PRODUCT_SITES)
const REACTANTS_AT_REST = placeMolecules(REACTANT_SITES)
/** Each reactant atom becomes one product atom of the same element. */
const TARGET_OF = pairAtoms(REACTANTS_AT_REST.atoms, PRODUCTS.atoms)
const INVERSE = invertPairing(TARGET_OF)
const PRODUCT_BONDS_ON_MORPH = PRODUCTS.bonds.map((bond) => ({ a: INVERSE[bond.a], b: INVERSE[bond.b] }))

const KEYS = ['ratio', 'zoom', 'split', 'join'] as const

/** Caption for the close-up, chosen by Step so that the intermediate state is named. */
const CLOSE_UP_CAPTION = [
  '',
  '',
  'one unit volume of each gas: two molecules in every box',
  'molecules split into atoms',
  'atoms regroup into H₂O',
]

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
              <Label x={cyl.cx} y={BASE_Y + 34} fontSize={18} fill="var(--fg)">
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

          <Label x={205} y={cylinderCentreY(1)} fontSize={30} fill="var(--fg-muted)">
            +
          </Label>
          <Label x={395} y={cylinderCentreY(1)} fontSize={30} fill="var(--fg-muted)">
            →
          </Label>
        </g>

        <g opacity={view.ratio * cylinderLayer}>
          <Label x={300} y={44} fontSize={22} fill="var(--orbit-active)">
            volume ratio {volumeRatioText()}
          </Label>
          <Label x={CYLINDERS.h2.cx} y={cylinderTop(2) - 16} fontSize={LABEL} fill="var(--fg-muted)">
            2 volumes
          </Label>
          <Label x={CYLINDERS.o2.cx} y={cylinderTop(1) - 16} fontSize={LABEL} fill="var(--fg-muted)">
            1 volume
          </Label>
          <Label x={CYLINDERS.h2o.cx} y={cylinderTop(2) - 16} fontSize={LABEL} fill="var(--fg-muted)">
            2 volumes
          </Label>
        </g>

        {/* Layer 2: the close-up, one unit volume per box, with the molecules inside */}
        <g
          opacity={view.zoom}
          transform={`translate(300 ${BOX_CENTRE_Y}) scale(${zoomScale}) translate(-300 ${-BOX_CENTRE_Y})`}
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
                rx={10}
                style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }}
                strokeWidth={1.2}
              />
              <Label x={box.x + BOX.width / 2} y={BOX.y + BOX.height + 28} fontSize={18} fill="var(--fg)">
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

          <Label x={PLUS_X} y={BOX.y + BOX.height / 2} fontSize={30} fill="var(--fg-muted)">
            +
          </Label>
          <Label x={ARROW_X} y={BOX.y + BOX.height / 2} fontSize={30} fill="var(--fg-muted)">
            →
          </Label>

          <SceneView atoms={atoms} bonds={bonds} bondWidth={3.4} defsPrefix="gl" />

          <Label x={300} y={74} fontSize={17} fill="var(--fg-muted)">
            {CLOSE_UP_CAPTION[active]}
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
