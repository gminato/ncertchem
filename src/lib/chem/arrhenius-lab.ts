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

/** Drawn tail area at the reference temperature (schematic, not to scale). */
const DRAWN_TAIL_AT_REF = 0.15
const DRAWN_TAIL_MIN = 0.02
const DRAWN_TAIL_MAX = 0.6

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
 * Area of the drawn (schematic, enlarged) tail beyond Eₐ at a temperature. It is
 * proportional to e^(−Eₐ/RT) relative to 298 K, so the drawn tail doubles roughly
 * with each 10 K, clamped so that it stays on the plot. The true tail is far smaller.
 */
export function drawnTailArea(tempK: number, eaKj: number): number {
  const eaJ = eaKj * 1000
  const ratio = fractionAboveEa(eaJ, tempK) / fractionAboveEa(eaJ, ARRHENIUS_REF_T_K)
  return Math.min(DRAWN_TAIL_MAX, Math.max(DRAWN_TAIL_MIN, DRAWN_TAIL_AT_REF * ratio))
}
