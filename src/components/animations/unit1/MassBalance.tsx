'use client'

import gsap from 'gsap'
import { Label, Vessel, VocabDefs } from '@/components/vocab'
import { morphAtoms, pairAtoms, invertPairing, placeMolecules, type MoleculeSite } from './atom-scene'
import { SceneView } from './SceneView'
import {
  MASS_BALANCE_PRODUCTS,
  MASS_BALANCE_REACTANTS,
  MASS_BALANCE_STEP_COUNT,
  atomTotals,
  massChangeReadout,
  massReadout,
  snapshotForStep,
  stepDescription,
  type MassBalanceSnapshot,
} from './mass-balance-steps'
import { clampStepIndex, useStepState } from './useStepState'
import styles from './scene.module.css'

export interface MassBalanceProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 460)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 460

/** Beam at y = 120, from x = 60 to 580; the fulcrum sits above the pillar at x = 320. */
const BEAM = { left: 60, right: 580, y: 120 }
const PILLAR_X = 320
/** Hangers hang from the beam to the pans. Each pan has two hangers at its edges. */
const LEFT_PAN = { x: 95, width: 130, y: 250 }
const RIGHT_PAN = { x: 415, width: 130, y: 250 }
const FLASK = { cx: 160, cy: 195, width: 96, height: 110 }
const WEIGHT_BLOCK = { x: 440, width: 80, height: 40 }
const LABEL_FONT = 15

/** Molecules inside the flask, scaled so that six fit comfortably. */
const FLASK_SCALE = 0.95
const REACTANT_SITES: MoleculeSite[] = [
  { formula: 'H2', cx: 140, cy: 222, scale: FLASK_SCALE },
  { formula: 'H2', cx: 180, cy: 222, scale: FLASK_SCALE },
  { formula: 'O2', cx: 160, cy: 200, scale: FLASK_SCALE },
]
const PRODUCT_SITES: MoleculeSite[] = [
  { formula: 'H2O', cx: 140, cy: 222, scale: FLASK_SCALE },
  { formula: 'H2O', cx: 180, cy: 222, scale: FLASK_SCALE },
]

const REACTANTS = placeMolecules(REACTANT_SITES)
const PRODUCTS = placeMolecules(PRODUCT_SITES)
/** Which product atom each reactant atom becomes. Element counts match, so this is total. */
const TARGET_OF = pairAtoms(REACTANTS.atoms, PRODUCTS.atoms)
/** Product bonds, re-expressed in reactant atom indices so they can be drawn on the morph. */
const INVERSE = invertPairing(TARGET_OF)
const PRODUCT_BONDS_ON_MORPH = PRODUCTS.bonds.map((bond) => ({ a: INVERSE[bond.a], b: INVERSE[bond.b] }))

const TALLY_TEXT = (() => {
  const before = atomTotals(MASS_BALANCE_REACTANTS)
  const after = atomTotals(MASS_BALANCE_PRODUCTS)
  return `H atoms ${before.H} → ${after.H}   ·   O atoms ${before.O} → ${after.O}`
})()

function build(step: number, state: MassBalanceSnapshot, _prev: number | null, onFrame: () => void) {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })
  tl.to(state, { progress: target.progress, duration: 1.6, ease: 'power1.inOut' }, 0)
  tl.to(state, { readout: target.readout, duration: 0.5, ease: 'power1.out' }, 0)
  tl.to(state, { tally: target.tally, duration: 0.5, ease: 'power1.out' }, 0)
  return tl
}

/**
 * MassBalance: a sealed flask on the left pan and weights on the right. The H2 and O2
 * inside the flask regroup into H2O, and the beam stays level throughout. The atoms are
 * drawn one by one, so the Learner can see that the same atoms are present before and after.
 */
export function MassBalance({ step, reducedMotion }: MassBalanceProps) {
  const active = clampStepIndex(step, MASS_BALANCE_STEP_COUNT)
  const view = useStepState<MassBalanceSnapshot>({
    step,
    stepCount: MASS_BALANCE_STEP_COUNT,
    reducedMotion,
    snapshot: snapshotForStep,
    build,
  })

  const atoms = morphAtoms(REACTANTS.atoms, PRODUCTS.atoms, TARGET_OF, view.progress)
  const bonds = [
    ...REACTANTS.bonds.map((bond) => ({ a: bond.a, b: bond.b, opacity: 1 - view.progress })),
    ...PRODUCT_BONDS_ON_MORPH.map((bond) => ({ a: bond.a, b: bond.b, opacity: view.progress })),
  ]

  const pillarTop = BEAM.y
  const pillarHeight = 380 - BEAM.y

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="A sealed flask on a level balance. Hydrogen and oxygen inside the flask become water, and the pan stays level."
        data-testid="mass-balance"
        data-step={active}
      >
        <VocabDefs idPrefix="mb" />

        {/* Pillar, base and fulcrum */}
        <rect x={PILLAR_X - 4} y={pillarTop} width={8} height={pillarHeight} rx={2} style={{ fill: 'var(--fg-subtle)' }} />
        <rect x={PILLAR_X - 90} y={380} width={180} height={12} rx={4} style={{ fill: 'var(--fg-subtle)' }} />
        <circle cx={PILLAR_X} cy={BEAM.y} r={7} style={{ fill: 'var(--surface)', stroke: 'var(--fg-muted)' }} strokeWidth={2} />

        {/* Beam, kept level: both pans carry 36.03 g */}
        <line
          x1={BEAM.left}
          x2={BEAM.right}
          y1={BEAM.y}
          y2={BEAM.y}
          strokeWidth={4}
          strokeLinecap="round"
          style={{ stroke: 'var(--fg-muted)' }}
        />

        {/* Hangers and pans */}
        {[LEFT_PAN, RIGHT_PAN].map((pan) => (
          <g key={`pan-${pan.x}`}>
            <line x1={pan.x} x2={pan.x} y1={BEAM.y} y2={pan.y} strokeWidth={1.6} style={{ stroke: 'var(--fg-subtle)' }} />
            <line
              x1={pan.x + pan.width}
              x2={pan.x + pan.width}
              y1={BEAM.y}
              y2={pan.y}
              strokeWidth={1.6}
              style={{ stroke: 'var(--fg-subtle)' }}
            />
            <rect
              x={pan.x}
              y={pan.y}
              width={pan.width}
              height={6}
              rx={3}
              style={{ fill: 'var(--fg-muted)' }}
            />
          </g>
        ))}

        {/* Weights on the right pan: a single block of 36.03 g */}
        <rect
          x={WEIGHT_BLOCK.x}
          y={RIGHT_PAN.y - WEIGHT_BLOCK.height}
          width={WEIGHT_BLOCK.width}
          height={WEIGHT_BLOCK.height}
          rx={4}
          style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }}
          strokeWidth={1}
        />
        <Label x={WEIGHT_BLOCK.x + WEIGHT_BLOCK.width / 2} y={RIGHT_PAN.y - WEIGHT_BLOCK.height / 2} fontSize={14} fill="var(--fg)">
          {massReadout()} g
        </Label>

        {/* Sealed flask on the left pan */}
        <Vessel variant="flask" width={FLASK.width} height={FLASK.height} x={FLASK.cx} y={FLASK.cy} liquid={false} />
        <rect
          x={FLASK.cx - 14}
          y={FLASK.cy - FLASK.height / 2 - 12}
          width={28}
          height={12}
          rx={2}
          style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }}
          strokeWidth={1}
        />
        <SceneView atoms={atoms} bonds={bonds} bondWidth={2.6} defsPrefix="mb" />

        {/* Captions under the pans and the readout line */}
        <Label x={FLASK.cx} y={272} fontSize={LABEL_FONT} fill="var(--fg-muted)">
          sealed flask
        </Label>
        <Label x={RIGHT_PAN.x + RIGHT_PAN.width / 2} y={272} fontSize={LABEL_FONT} fill="var(--fg-muted)">
          weights
        </Label>
        <Label x={PILLAR_X} y={82} fontSize={LABEL_FONT} fill="var(--fg-subtle)">
          level beam
        </Label>

        <g opacity={view.readout}>
          <Label x={WEIGHT_BLOCK.x + WEIGHT_BLOCK.width / 2 - 40} y={306} fontSize={16} fill="var(--fg)">
            change in mass = {massChangeReadout()} g
          </Label>
        </g>

        {/* Equation and atom tally, set below the base so that nothing crosses the pillar */}
        <Label x={PILLAR_X} y={418} fontSize={18} fill="var(--fg)">
          2 H<Label.Sub>2</Label.Sub> + O<Label.Sub>2</Label.Sub> → 2 H<Label.Sub>2</Label.Sub>O
        </Label>
        <g opacity={view.tally}>
          <Label x={PILLAR_X} y={446} fontSize={15} fill="var(--fg-muted)">
            {TALLY_TEXT}
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
