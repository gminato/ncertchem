'use client'

import gsap from 'gsap'
import { Atom, Label, Molecule, VocabDefs } from '@/components/vocab'
import { useStepState, clampStepIndex } from './useStepState'
import {
  MASS_STEPS,
  MOLECULAR_MASS_STEP_COUNT,
  atomicMassText,
  runningTotal,
  snapshotForStep,
  stepDescription,
  type MolecularMassSnapshot,
} from './molecular-mass-steps'
import styles from './scene.module.css'

export interface MolecularMassProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 380)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 380
const LEFT_CENTRE = { x: 150, y: 170 }
const LEDGER = { header: 64, first: 102, spacing: 32, symbolX: 330, massX: 452, sumX: 612 }
const TOTAL_Y = 312
const FONT = 16

/** Sodium chloride: a 4 x 4 patch of the lattice, Na and Cl alternating. */
const LATTICE = { x0: 90, y0: 110, spacing: 40, radius: 13, size: 4 }

function build(step: number, state: MolecularMassSnapshot, _prev: number | null, onFrame: () => void) {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })
  const change = Math.abs(target.added - state.added)
  if (change > 0) {
    tl.to(state, { added: target.added, duration: Math.max(0.3, 0.45 * change), ease: 'none' }, 0)
  }
  return tl
}

/**
 * MolecularMass: a molecule (or a patch of the NaCl lattice) on the left, and a ledger
 * on the right that adds the atomic masses one atom at a time. Each total is the sum
 * of the atoms, and the last total equals molarMass() for that formula.
 */
export function MolecularMass({ step, reducedMotion }: MolecularMassProps) {
  const active = clampStepIndex(step, MOLECULAR_MASS_STEP_COUNT)
  const current = MASS_STEPS[active]
  const view = useStepState<MolecularMassSnapshot>({
    step,
    stepCount: MOLECULAR_MASS_STEP_COUNT,
    reducedMotion,
    snapshot: snapshotForStep,
    build,
  })

  const shown = Math.min(current.atoms.length, Math.max(0, Math.floor(view.added + 1e-6)))
  const sum = runningTotal(current, shown)
  const isIonic = current.formula === 'NaCl'

  const rows = current.atoms.map((symbol, i) => ({
    key: i,
    symbol,
    y: LEDGER.first + i * LEDGER.spacing,
    lit: i < shown,
    sumAfter: runningTotal(current, i + 1),
  }))

  const latticeAtoms = Array.from({ length: LATTICE.size * LATTICE.size }, (_, index) => {
    const i = index % LATTICE.size
    const j = Math.floor(index / LATTICE.size)
    return {
      key: index,
      element: (i + j) % 2 === 0 ? 'Na' : 'Cl',
      x: LATTICE.x0 + i * LATTICE.spacing,
      y: LATTICE.y0 + j * LATTICE.spacing,
    }
  })

  const totalLabel = current.totalName === 'formula mass' ? 'formula mass' : 'molecular mass'

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="A molecule or an ionic lattice on the left, and a ledger on the right that adds up atomic masses to give the molecular or formula mass."
        data-testid="molecular-mass"
        data-step={active}
      >
        <VocabDefs idPrefix="mm" />

        {/* Left panel: the species */}
        {isIonic ? (
          <g className={styles.reveal}>
            {latticeAtoms.map((atom) => (
              <Atom key={atom.key} element={atom.element} x={atom.x} y={atom.y} r={LATTICE.radius} defsPrefix="mm" />
            ))}
            <rect
              x={LATTICE.x0 - 22}
              y={LATTICE.y0 - 22}
              width={LATTICE.spacing * 2 - 4}
              height={LATTICE.spacing + 44}
              rx={10}
              fill="none"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              style={{ stroke: 'var(--orbit-active)' }}
            />
            <Label x={LEFT_CENTRE.x} y={262} fontSize={14} fill="var(--fg-muted)">
              Na⁺ and Cl⁻ in a lattice
            </Label>
            <Label x={LEFT_CENTRE.x} y={TOTAL_Y + 8} fontSize={18} fill="var(--fg)">
              NaCl (one formula unit, dashed)
            </Label>
          </g>
        ) : (
          <g className={styles.reveal} key={current.formula}>
            <Molecule
              formula={current.formula}
              x={LEFT_CENTRE.x}
              y={LEFT_CENTRE.y}
              scale={current.formula === 'CH4' ? 2.1 : 2.6}
              style="ball-and-stick"
              defsPrefix="mm"
            />
            <Label x={LEFT_CENTRE.x} y={TOTAL_Y + 8} fontSize={18} fill="var(--fg)">
              {current.formula === 'CH4' ? (
                <>
                  CH<Label.Sub>4</Label.Sub>
                </>
              ) : (
                <>
                  H<Label.Sub>2</Label.Sub>O
                </>
              )}
            </Label>
          </g>
        )}

        {/* Right panel: the ledger */}
        <g>
          <Label x={LEDGER.symbolX} y={LEDGER.header} textAnchor="start" fontSize={14} fill="var(--fg-subtle)">
            atom
          </Label>
          <Label x={LEDGER.massX} y={LEDGER.header} textAnchor="end" fontSize={14} fill="var(--fg-subtle)">
            mass (u)
          </Label>
          <Label x={LEDGER.sumX} y={LEDGER.header} textAnchor="end" fontSize={14} fill="var(--fg-subtle)">
            running total (u)
          </Label>
          <line
            x1={LEDGER.symbolX}
            x2={LEDGER.sumX}
            y1={LEDGER.header + 14}
            y2={LEDGER.header + 14}
            strokeWidth={1}
            style={{ stroke: 'var(--border)' }}
          />

          {rows.map((row) => (
            <g key={row.key} opacity={row.lit ? 1 : 0.22}>
              <Label x={LEDGER.symbolX} y={row.y} textAnchor="start" fontSize={FONT} fill="var(--fg)">
                {row.symbol}
              </Label>
              <Label x={LEDGER.massX} y={row.y} textAnchor="end" fontSize={FONT} fill="var(--fg-muted)">
                {atomicMassText(row.symbol)}
              </Label>
              <Label x={LEDGER.sumX} y={row.y} textAnchor="end" fontSize={FONT} fill="var(--fg-muted)">
                {row.lit ? row.sumAfter.toFixed(3) : ''}
              </Label>
            </g>
          ))}

          <line
            x1={LEDGER.symbolX}
            x2={LEDGER.sumX}
            y1={TOTAL_Y - 22}
            y2={TOTAL_Y - 22}
            strokeWidth={1}
            style={{ stroke: 'var(--border)' }}
          />
          <Label x={LEDGER.symbolX} y={TOTAL_Y} textAnchor="start" fontSize={18} fill="var(--orbit-active)">
            {totalLabel}
          </Label>
          <Label x={LEDGER.sumX} y={TOTAL_Y} textAnchor="end" fontSize={18} fill="var(--orbit-active)">
            {sum.toFixed(3)} u
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
