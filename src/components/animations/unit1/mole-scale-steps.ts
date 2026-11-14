import { molesToMass } from '@/lib/chem/mole'

/** Number of Steps in the MoleScale Scrolly Animation. */
export const MOLE_SCALE_STEP_COUNT = 5

export function clampMoleScaleStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(MOLE_SCALE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Opacity targets (0 to 1) for each group of the MoleScale picture. */
export interface MoleScaleTargets {
  /** A dozen eggs, the everyday counting unit. */
  dozen: number
  /** A ream of paper, drawn as a stack of sheets. */
  ream: number
  /** The logarithmic scale that places the mole far beyond both. */
  scale: number
  /** Three vessels, each holding one mole of a different substance. */
  vessels: number
  /** Matching particle-count tags under the vessels. */
  counts: number
}

/** Deterministic target state for each Step. Transitions tween from the current state. */
export function targetsForMoleScaleStep(step: number): MoleScaleTargets {
  switch (clampMoleScaleStep(step)) {
    case 0:
      return { dozen: 1, ream: 0, scale: 0, vessels: 0, counts: 0 }
    case 1:
      return { dozen: 0, ream: 1, scale: 0, vessels: 0, counts: 0 }
    case 2:
      return { dozen: 0, ream: 0, scale: 1, vessels: 0, counts: 0 }
    case 3:
      return { dozen: 0, ream: 0, scale: 0, vessels: 1, counts: 0 }
    default:
      return { dozen: 0, ream: 0, scale: 0, vessels: 1, counts: 1 }
  }
}

/** One substance in the side-by-side comparison of one mole. */
export interface MoleSubstance {
  formula: string
  label: string
  /** Decimal places for the mass of one mole, as the NCERT text quotes it. */
  massDecimals: number
}

/** The three substances of the one-mole comparison: water, sodium chloride and carbon. */
export const ONE_MOLE_SUBSTANCES: readonly MoleSubstance[] = [
  { formula: 'H2O', label: 'Water', massDecimals: 2 },
  { formula: 'NaCl', label: 'Sodium chloride', massDecimals: 1 },
  { formula: 'C', label: 'Carbon', massDecimals: 3 },
]

/** The mass of exactly one mole of a substance, as a display string. */
export function massOfOneMole(substance: MoleSubstance): string {
  const grams = molesToMass(1, substance.formula)
  return String(Number(grams.toFixed(substance.massDecimals)))
}

/**
 * The position of a count on the log scale, from 0 (one entity) to 1 (10²⁴).
 * The scale spans 24 decades so that a dozen, a ream and a mole all fit.
 */
export const LOG_SCALE_DECADES = 24

export function logScaleFraction(count: number): number {
  return Math.log10(count) / LOG_SCALE_DECADES
}
