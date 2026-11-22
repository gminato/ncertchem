import { backwardBarrier, catalystRateEnhancement, fractionAboveEa, formatSci, formatSig } from '@/lib/chem/kinetics'

/**
 * Deterministic state for each Step of the catalyst Scrolly (Section 3.4.1).
 * Example values in kJ mol⁻¹ are the Prose's; every number shown to the student comes from the libs.
 */

/** Temperature of the example, kelvin. */
export const T_K = 298
/** Forward activation energies and the enthalpy change of the example, kJ mol⁻¹. */
export const EA_UNCAT_KJ = 60
export const EA_CAT_KJ = 50
export const DH_KJ = -20
/** Unlabelled heights of the catalysed route's first hump and of its intermediate valley, kJ mol⁻¹. */
export const CAT_FIRST_HUMP_KJ = 30
export const CAT_VALLEY_KJ = 15
/** Uphill example: the products stand above the reactants (height only; no value is quoted). */
export const UPHILL_PRODUCTS_KJ = 20

export type CatalystScene = 'downhill' | 'uphill' | 'mb'

export interface CatalystStep {
  readonly index: number
  readonly scene: CatalystScene
  /** Uncatalysed curve drawn faintly, so the catalysed one leads. */
  readonly uncatFaint: boolean
  readonly catalysed: boolean
  readonly showEaArrow: boolean
  readonly showBackward: boolean
  readonly showDh: boolean
  readonly ariaLabel: string
}

export const CATALYST_STEPS: readonly CatalystStep[] = [
  { index: 0, scene: 'downhill', uncatFaint: false, catalysed: false, showEaArrow: true, showBackward: false, showDh: true,
    ariaLabel: 'Energy profile with one hump for the uncatalysed route, from reactants at zero to products 20 kJ per mol lower.' },
  { index: 1, scene: 'downhill', uncatFaint: true, catalysed: true, showEaArrow: false, showBackward: false, showDh: true,
    ariaLabel: 'Catalysed route added: two lower humps and a shallow valley, with the same end levels as the uncatalysed route.' },
  { index: 2, scene: 'mb', uncatFaint: false, catalysed: false, showEaArrow: false, showBackward: false, showDh: false,
    ariaLabel: 'Maxwell–Boltzmann curve with two threshold markers; the tail beyond the catalysed threshold is shaded more strongly.' },
  { index: 3, scene: 'downhill', uncatFaint: true, catalysed: true, showEaArrow: false, showBackward: true, showDh: true,
    ariaLabel: 'Backward barriers drawn for both routes from the product level; each is 10 kJ per mol lower on the catalysed route.' },
  { index: 4, scene: 'uphill', uncatFaint: true, catalysed: true, showEaArrow: false, showBackward: false, showDh: false,
    ariaLabel: 'Uphill profile: products above reactants. The catalysed route has a lower hump, but the end levels are unchanged.' },
]

/** Clamps a 0-based Scrolly step index into the table. */
export function catalystStep(step: number): CatalystStep {
  const i = Math.min(CATALYST_STEPS.length - 1, Math.max(0, Math.round(step)))
  return CATALYST_STEPS[i]
}

export interface CatalystNumbers {
  /** Rate factor for the 10 kJ mol⁻¹ fall, both directions, e.g. "56.6". */
  readonly rateFactor: string
  /** Backward barriers, kJ mol⁻¹. */
  readonly backwardUncatKJ: number
  readonly backwardCatKJ: number
  /** e^(−Eₐ/RT) for each forward barrier, as written in the Prose. */
  readonly fractionUncat: string
  readonly fractionCat: string
}

export function catalystNumbers(): CatalystNumbers {
  const kJ = (value: number) => value * 1000
  return {
    rateFactor: formatSig(catalystRateEnhancement(kJ(EA_UNCAT_KJ), kJ(EA_CAT_KJ), T_K), 3),
    backwardUncatKJ: backwardBarrier(kJ(EA_UNCAT_KJ), kJ(DH_KJ)) / 1000,
    backwardCatKJ: backwardBarrier(kJ(EA_CAT_KJ), kJ(DH_KJ)) / 1000,
    fractionUncat: formatSci(fractionAboveEa(kJ(EA_UNCAT_KJ), T_K), 3),
    fractionCat: formatSci(fractionAboveEa(kJ(EA_CAT_KJ), T_K), 3),
  }
}
