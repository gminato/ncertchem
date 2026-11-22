import {
  formatSci,
  formatSig,
  fractionAboveEa,
  kAtT2,
  kJPerMolToJPerMol,
  lnKLine,
  preExponentialFrom,
  rateRatioForRise,
} from '@/lib/chem/kinetics'

/**
 * Step targets for the Arrhenius Scrolly. Every number comes from the kinetics lib.
 * The only quoted "fraction above Eₐ" is e^(−Eₐ/RT) (fractionAboveEa).
 */

export const ARRHENIUS_STEP_COUNT = 5

export const T_REF = 298
export const T_WARM = 308
export const T_HOT = 318
export const DT = 10

/** The worked reaction of the Prose: first order, Eₐ = 50.0 kJ mol⁻¹, k(298 K) = 3.00 × 10⁻⁴ s⁻¹. */
export const EA_KJ = 50.0
export const EA = kJPerMolToJPerMol(EA_KJ)
export const K_REF = 3.0e-4

export const A_FACTOR = preExponentialFrom(K_REF, EA, T_REF)
export const K_WARM = kAtT2(K_REF, T_REF, T_WARM, EA)
export const K_HOT = kAtT2(K_REF, T_REF, T_HOT, EA)
export const RATIO_RISE = rateRatioForRise(EA, T_REF, DT)
export const FRACTION_REF = fractionAboveEa(EA, T_REF)
export const LINE = lnKLine(A_FACTOR, EA)

/**
 * The drawn tail is enlarged: the true Eₐ/RT is 20.2, far off a chart in units of RT.
 * The Arrhenius fraction is printed beside it; the drawing is schematic.
 */
export const EA_DRAWN = 2.2
/**
 * Energy-profile levels (schematic, 0 to 1 panel units). The products sit a little below the
 * reactants: the drop is ΔrH / Eₐ of the barrier, with ΔrH ≈ −9.4 kJ mol⁻¹ for H₂ + I₂ → 2HI.
 */
export const REACTANT_LEVEL = 0.3
export const PEAK_LEVEL = 0.85
export const DH_KJ_DRAWN = -9.4
export const PRODUCT_LEVEL = REACTANT_LEVEL + (PEAK_LEVEL - REACTANT_LEVEL) * (DH_KJ_DRAWN / EA_KJ)
/** Width ratio between the drawn 298 K and 308 K curves (schematic, the true ratio is 1.03). */
export const SPREAD = 1.25
/** Dimensionless θ of the 298 K curve; its peak sits at θ/2 = 1. */
export const THETA_REF = 2

/** Plot units for the ln k plot: x = 1/T in 10⁻³ K⁻¹, y = ln(k / s⁻¹). */
export const LN_X_SCALE = 1000
export const LN_DOMAIN = { xMin: 3.1, xMax: 3.4, yMin: -9, yMax: -6 }

export function lnKAt(T: number): number {
  const k = T === T_REF ? K_REF : kAtT2(K_REF, T_REF, T, EA)
  return Math.log(k)
}

/** Plot x (10⁻³ K⁻¹) and y (ln k) for a temperature, from the lib. */
export function lnKPoint(T: number): { x: number; y: number } {
  return { x: LN_X_SCALE / T, y: lnKAt(T) }
}

/** Slope of ln k against x in plot units (10⁻³ K⁻¹): −Eₐ/R × 10⁻³. */
export const LN_SLOPE_PLOT = LINE.slope / LN_X_SCALE

export interface ArrheniusStepState {
  index: number
  box: 0 | 1
  profile: 0 | 1
  mbFirst: 0 | 1
  mbSecond: 0 | 1
  line: 0 | 1
}

const STATES: ArrheniusStepState[] = [
  { index: 0, box: 1, profile: 0, mbFirst: 0, mbSecond: 0, line: 0 },
  { index: 1, box: 0, profile: 1, mbFirst: 0, mbSecond: 0, line: 0 },
  { index: 2, box: 0, profile: 0, mbFirst: 1, mbSecond: 0, line: 0 },
  { index: 3, box: 0, profile: 0, mbFirst: 1, mbSecond: 1, line: 0 },
  { index: 4, box: 0, profile: 0, mbFirst: 0, mbSecond: 0, line: 1 },
]

/** The scene targets for a 0-based Step index (clamped to the range). */
export function getArrheniusStepState(step: number): ArrheniusStepState {
  const i = Math.min(Math.max(Math.round(step), 0), ARRHENIUS_STEP_COUNT - 1)
  return STATES[i]
}

/** Labels used on the drawing, formatted once from the lib values. */
export const LABELS = {
  fractionRef: formatSci(FRACTION_REF, 3),
  ratio: formatSig(RATIO_RISE, 3),
  slope: formatSci(LINE.slope, 3),
  intercept: formatSig(LINE.intercept, 4),
  eaKj: formatSig(EA_KJ, 3),
  dxPlot: formatSci(0.1e-3, 2),
  dyPlot: formatSig(LN_SLOPE_PLOT * 0.1, 3),
  A: formatSci(A_FACTOR, 3),
}
