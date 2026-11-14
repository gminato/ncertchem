'use client'

import gsap from 'gsap'
import { Atom, Label, Molecule, VocabDefs } from '@/components/vocab'
import { morphAtoms, invertPairing, pairAtoms, placeMolecules, type MoleculeSite } from './atom-scene'
import { SceneView } from './SceneView'
import { useStepState } from './useStepState'
import {
  DALTON_STEP_COUNT,
  DALTON_REACTION_TEXT,
  snapshotForStep,
  stepDescription,
  type DaltonSnapshot,
} from './dalton-steps'
import { clampStepIndex } from './useStepState'
import styles from './scene.module.css'

export interface DaltonPostulatesProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 400)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 400
const LABEL_FONT = 16

/** Step 1: a 4 x 4 grid of one kind of atom, for postulate 1. */
const GRID = { cols: 4, rows: 4, spacing: 36, left: 70, top: 110 }

/** Step 2: rows of one element each, for postulate 2. */
const ELEMENT_ROWS: { element: string; name: string }[] = [
  { element: 'H', name: 'hydrogen' },
  { element: 'O', name: 'oxygen' },
  { element: 'C', name: 'carbon' },
]
const ELEMENT_ROW = { left: 170, spacing: 52, top: 100, count: 4 }

/** Step 4: the reaction morph, placed with the reactants on the left and products on the right. */
const REACTANT_SITES: MoleculeSite[] = [
  { formula: 'H2', cx: 110, cy: 130, scale: 1.5 },
  { formula: 'H2', cx: 110, cy: 250, scale: 1.5 },
  { formula: 'O2', cx: 250, cy: 190, scale: 1.5 },
]
const PRODUCT_SITES: MoleculeSite[] = [
  { formula: 'H2O', cx: 440, cy: 130, scale: 1.5 },
  { formula: 'H2O', cx: 440, cy: 250, scale: 1.5 },
]
const REACTANTS = placeMolecules(REACTANT_SITES)
const PRODUCTS = placeMolecules(PRODUCT_SITES)
const TARGET_OF = pairAtoms(REACTANTS.atoms, PRODUCTS.atoms)
const INVERSE = invertPairing(TARGET_OF)
const PRODUCT_BONDS_ON_MORPH = PRODUCTS.bonds.map((bond) => ({ a: INVERSE[bond.a], b: INVERSE[bond.b] }))

function build(step: number, state: DaltonSnapshot, _prev: number | null, onFrame: () => void) {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })
  tl.to(state, { morph: target.morph, duration: 1.6, ease: 'power1.inOut' }, 0)
  return tl
}

/**
 * DaltonPostulates: one Step for each of Dalton's four ideas. The first three are
 * static pictures; the fourth morphs the atoms of 2H2 + O2 into 2H2O.
 */
export function DaltonPostulates({ step, reducedMotion }: DaltonPostulatesProps) {
  const active = clampStepIndex(step, DALTON_STEP_COUNT)
  const view = useStepState<DaltonSnapshot>({
    step,
    stepCount: DALTON_STEP_COUNT,
    reducedMotion,
    snapshot: snapshotForStep,
    build,
  })

  const atoms = morphAtoms(REACTANTS.atoms, PRODUCTS.atoms, TARGET_OF, view.morph)
  const bonds = [
    ...REACTANTS.bonds.map((bond) => ({ a: bond.a, b: bond.b, opacity: 1 - view.morph })),
    ...PRODUCT_BONDS_ON_MORPH.map((bond) => ({ a: bond.a, b: bond.b, opacity: view.morph })),
  ]

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Four pictures of Dalton's ideas: indivisible atoms, identical atoms of each element, fixed ratios in water and carbon dioxide, and a reaction that regroups atoms without creating or destroying any."
        data-testid="dalton-postulates"
        data-step={active}
      >
        <VocabDefs idPrefix="dl" />

        {active === 0 && (
          <g className={styles.reveal}>
            {Array.from({ length: GRID.rows * GRID.cols }, (_, i) => {
              const col = i % GRID.cols
              const row = Math.floor(i / GRID.cols)
              return (
                <Atom
                  key={`grid-${i}`}
                  element="C"
                  x={GRID.left + col * GRID.spacing}
                  y={GRID.top + row * GRID.spacing}
                  r={12}
                  defsPrefix="dl"
                />
              )
            })}
            <Label x={GRID.left + 1.5 * GRID.spacing} y={GRID.top + 4 * GRID.spacing + 10} fontSize={LABEL_FONT} fill="var(--fg-muted)">
              many separate atoms
            </Label>
            <Atom element="C" x={470} y={200} r={70} defsPrefix="dl" />
            <Label x={470} y={300} fontSize={LABEL_FONT} fill="var(--fg-muted)">
              one atom: the smallest unit
            </Label>
          </g>
        )}

        {active === 1 && (
          <g className={styles.reveal}>
            {ELEMENT_ROWS.map((row, rowIndex) => {
              const y = ELEMENT_ROW.top + rowIndex * ELEMENT_ROW.spacing
              return (
                <g key={row.element}>
                  <Label x={90} y={y} textAnchor="start" fontSize={18} fill="var(--fg)">
                    {row.element}
                  </Label>
                  <Label x={120} y={y} textAnchor="start" fontSize={LABEL_FONT - 2} fill="var(--fg-subtle)">
                    {row.name}
                  </Label>
                  {Array.from({ length: ELEMENT_ROW.count }, (_, i) => (
                    <Atom
                      key={`${row.element}-${i}`}
                      element={row.element}
                      x={ELEMENT_ROW.left + i * ELEMENT_ROW.spacing + 40}
                      y={y}
                      defsPrefix="dl"
                    />
                  ))}
                </g>
              )
            })}
            <Label x={320} y={300} fontSize={LABEL_FONT} fill="var(--fg-muted)">
              same element, same atoms; different elements, different colour and size
            </Label>
          </g>
        )}

        {active === 2 && (
          <g className={styles.reveal}>
            <Molecule formula="H2O" x={170} y={170} scale={2.2} defsPrefix="dl" style="ball-and-stick" />
            <Label x={170} y={300} fontSize={18} fill="var(--fg)">
              H<Label.Sub>2</Label.Sub>O: H : O = 2 : 1
            </Label>
            <Molecule formula="CO2" x={470} y={170} scale={2.2} defsPrefix="dl" style="ball-and-stick" />
            <Label x={470} y={300} fontSize={18} fill="var(--fg)">
              CO<Label.Sub>2</Label.Sub>: C : O = 1 : 2
            </Label>
          </g>
        )}

        {active === 3 && (
          <g className={styles.reveal}>
            <SceneView atoms={atoms} bonds={bonds} bondWidth={3} defsPrefix="dl" />
            <Label x={320} y={60} fontSize={18} fill="var(--fg)">
              {DALTON_REACTION_TEXT}
            </Label>
            <Label x={320} y={340} fontSize={LABEL_FONT} fill="var(--fg-muted)">
              H atoms: 4 → 4   ·   O atoms: 2 → 2
            </Label>
          </g>
        )}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
