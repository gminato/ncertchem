// Single source for the numbers in the Section 2.4.2 Prose (variation of conductivity with concentration)
// and in the Kohlrausch Lab. KCl points are the dilute rows of Table 2.3; λ° values are Table 2.4 ion sums;
// the acetic acid point is the author's own illustrative measurement, not an NCERT worked example.

import { NCERT_KCL_CONDUCTIVITY } from './ncert-c12-unit2-tables'
import {
  degreeOfDissociation,
  dissociationConstantFromAlpha,
  fitDebyeHuckelOnsager,
  lambda0Electrolyte,
} from './conductance'

export interface KClPoint {
  /** Concentration, mol L⁻¹. */
  readonly c: number
  /** Molar conductivity Λm, S cm² mol⁻¹. */
  readonly lambdaScm2: number
}

/** Table 2.3 rows at 0.10 and 0.010 mol L⁻¹. The 1.0 mol L⁻¹ row lies outside the dilute range and is not fitted. */
export const KCL_DILUTE_POINTS: readonly KClPoint[] = NCERT_KCL_CONDUCTIVITY.filter((r) => r.molPerL <= 0.1).map(
  (r) => ({ c: r.molPerL, lambdaScm2: r.lambdaScm2 }),
)

/** Straight line through the two dilute points: Λm = Λ°m − A √c. */
const kclFit = fitDebyeHuckelOnsager(KCL_DILUTE_POINTS)
/** Intercept Λ°m of the two-point line, S cm² mol⁻¹. */
export const KCL_LAMBDA0_LINE: number = kclFit.lambda0Scm2
/** Slope magnitude A, S cm² mol⁻¹ (mol L⁻¹)^−½. */
export const KCL_A_LINE: number = kclFit.A

/** Volume in cm³ that holds one mole at concentration c (mol L⁻¹): V = 1000 / c. Λm = κV then has units S cm² mol⁻¹. */
export function volumePerMoleCm3(molPerL: number): number {
  if (!(molPerL > 0)) throw new RangeError(`Concentration must be positive, got ${molPerL}`)
  return 1000 / molPerL
}

/** Λ°m(CH₃COOH) = λ°(H⁺) + λ°(CH₃COO⁻) from Table 2.4, S cm² mol⁻¹. */
export const ACETIC_LAMBDA0: number = lambda0Electrolyte([
  { ion: 'H+', count: 1 },
  { ion: 'CH3COO-', count: 1 },
])

/** Illustrative measured molar conductivity of acetic acid. */
export const ACETIC_MEASURED = { c: 0.02, lambdaScm2: 9.6 } as const
/** α = Λm / Λ°m at the measured point. */
export const ACETIC_ALPHA: number = degreeOfDissociation(ACETIC_MEASURED.lambdaScm2, ACETIC_LAMBDA0)
/** Ka = cα² / (1 − α) at the measured point. */
export const ACETIC_KA: number = dissociationConstantFromAlpha(ACETIC_MEASURED.c, ACETIC_ALPHA)

/** Λ°m(MgCl₂) = λ°(Mg²⁺) + 2 λ°(Cl⁻) from Table 2.4, S cm² mol⁻¹. */
export const MGCL2_LAMBDA0: number = lambda0Electrolyte([
  { ion: 'Mg2+', count: 1 },
  { ion: 'Cl-', count: 2 },
])
