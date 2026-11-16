/**
 * Pure data for the ethane-rotation Scrolly (Section 9.2.4): the five Steps, the back-carbon angle each
 * Step shows, and the name the lib gives that angle. The drawings read it, and the tests check it.
 */

import { conformationName, ETHANE_TORSIONAL_BARRIER_KJ } from '@/lib/chem/conformations'

/** The view a Step shows: the rotatable 3D model, the sawhorse, the Newman projection, or the energy curve. */
export type EthaneStepKind = 'model' | 'sawhorse' | 'newman' | 'energy'

export interface EthaneStep {
  kind: EthaneStepKind
  /** The H–C–C–H dihedral angle this Step shows, in degrees. The drawing tweens to it from the last Step's angle. */
  dihedral: number
}

/**
 * The Steps in order. 1: staggered ethane in 3D. 2: the back carbon turns to 0°. 3: the same eclipsed form as a
 * sawhorse. 4: the Newman projection turns to 60°. 5: the marker rides the energy curve over the barrier to the
 * eclipsed form at 120°, which is the same form as 0°.
 */
export const ETHANE_STEPS: readonly EthaneStep[] = [
  { kind: 'model', dihedral: 60 },
  { kind: 'model', dihedral: 0 },
  { kind: 'sawhorse', dihedral: 0 },
  { kind: 'newman', dihedral: 60 },
  { kind: 'energy', dihedral: 120 },
]

export const ETHANE_STEP_COUNT = ETHANE_STEPS.length

/** The Step at an index, clamped to the Steps that exist. */
export function ethaneStep(index: number): EthaneStep {
  const i = Math.min(ETHANE_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return ETHANE_STEPS[i]
}

/** The lib's name for a dihedral, for captions: 'eclipsed', 'staggered' or 'skew'. */
export function ethaneConformer(dihedral: number): ReturnType<typeof conformationName> {
  return conformationName(dihedral)
}

/** The barrier the energy Step brackets, in kJ mol⁻¹, from the lib. */
export const ETHANE_STEP_BARRIER = ETHANE_TORSIONAL_BARRIER_KJ
