import {
  arrheniusK,
  fractionAboveEa,
  lnKLine,
  preExponentialFrom,
  rateRatioForRise,
} from './kinetics'

/** Slider ranges and defaults for the Arrhenius Lab. */
export const ARRHENIUS_TEMP_MIN_K = 280
export const ARRHENIUS_TEMP_MAX_K = 340
export const ARRHENIUS_EA_MIN_KJ = 20
export const ARRHENIUS_EA_MAX_KJ = 100
export const ARRHENIUS_DEFAULT_T_K = 298
export const ARRHENIUS_DEFAULT_EA_KJ = 50.0
/** The rate constant at the reference temperature (298 K) is held fixed, so A follows from Eₐ. */
export const ARRHENIUS_K_REF = 3.0e-4
export const ARRHENIUS_REF_T_K = 298

/** Enthalpy change of H₂ + I₂ → 2HI (gaseous I₂), kJ mol⁻¹. Drawn to scale against Eₐ, never labelled. */
export const ARRHENIUS_DH_KJ = -9.4

/** Drawn tail area at the reference temperature (schematic, not to scale). */
const DRAWN_TAIL_AT_REF = 0.15
const DRAWN_TAIL_MIN = 0.02
/** Power applied to the true ratio, so the drawn tail keeps growing across the slider range. */
const DRAWN_TAIL_EXPONENT = 0.35

export interface ArrheniusState {
  /** Activation energy, J mol⁻¹. */
  eaJ: number
  /** Pre-exponential factor, s⁻¹ (anchored so that k(298 K) = ARRHENIUS_K_REF). */
  A: number
  /** Rate constant at the chosen temperature, s⁻¹. */
  k: number
  /** Rate constant at T + 10 K, s⁻¹. */
  kNext: number
  /** k(T + 10 K) / k(T), from the lib. */
  ratio: number
  /** e^(−Eₐ/RT): the NCERT fraction of molecules with energy at or above Eₐ. */
  fraction: number
  /** e^(−Eₐ/R(T + 10 K)). */
  fractionNext: number
  /** Straight line of ln k against 1/T: slope −Eₐ/R, intercept ln A. */
  line: { slope: number; intercept: number }
  /** ln k at the chosen temperature. */
  lnK: number
  /** 1/T in K⁻¹ at the chosen temperature. */
  invT: number
}

export function deriveArrhenius(tempK: number, eaKj: number): ArrheniusState {
  const eaJ = eaKj * 1000
  const A = preExponentialFrom(ARRHENIUS_K_REF, eaJ, ARRHENIUS_REF_T_K)
  const k = arrheniusK(A, eaJ, tempK)
  const kNext = arrheniusK(A, eaJ, tempK + 10)
  return {
    eaJ,
    A,
    k,
    kNext,
    ratio: rateRatioForRise(eaJ, tempK, 10),
    fraction: fractionAboveEa(eaJ, tempK),
    fractionNext: fractionAboveEa(eaJ, tempK + 10),
    line: lnKLine(A, eaJ),
    lnK: Math.log(k),
    invT: 1 / tempK,
  }
}

/**
 * Area of the drawn tail beyond Eₐ at a temperature. It is schematic and enlarged, not to
 * scale: the true ratio e^(−Eₐ/RT) / e^(−Eₐ/R·298) is compressed by a power, so the drawn
 * tail grows with T across the whole slider range without saturating. Not proportional to
 * the true fraction; the true fraction is shown in the readout.
 */
export function drawnTailArea(tempK: number, eaKj: number): number {
  const eaJ = eaKj * 1000
  const ratio = fractionAboveEa(eaJ, tempK) / fractionAboveEa(eaJ, ARRHENIUS_REF_T_K)
  return Math.max(DRAWN_TAIL_MIN, DRAWN_TAIL_AT_REF * Math.pow(ratio, DRAWN_TAIL_EXPONENT))
}

/**
 * Range of ln k over the whole slider box (Eₐ and T), rounded out to whole numbers, so the
 * ln k plot's y-axis always contains the point. ln k is monotone in each slider, so the corners
 * give the extremes.
 */
export function lnKExtent(): { min: number; max: number } {
  const values: number[] = []
  for (const T of [ARRHENIUS_TEMP_MIN_K, ARRHENIUS_TEMP_MAX_K]) {
    for (const Ea of [ARRHENIUS_EA_MIN_KJ, ARRHENIUS_EA_MAX_KJ]) {
      values.push(deriveArrhenius(T, Ea).lnK)
    }
  }
  return { min: Math.floor(Math.min(...values)), max: Math.ceil(Math.max(...values)) }
}
