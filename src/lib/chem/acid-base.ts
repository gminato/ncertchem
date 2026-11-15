/**
 * Acids, bases, pH, buffers, salt hydrolysis, polyprotic acids and titration curves for NCERT
 * Class 11 Unit 6 (Equilibrium), Sections 6.10 to 6.12 (Problems 6.12 to 6.25).
 *
 * Concentrations are in mol L⁻¹ and constants are at 298 K unless a temperature is given. Where a
 * formula is an approximation NCERT uses (for example x ≪ c), an exact quadratic is solved instead
 * and the approximation's validity is reported.
 */

import { vantHoffK } from './equilibrium'

/** Kw at 298 K, the ionic product of water (Section 6.11.1). */
const KW_298 = 1e-14

/**
 * Enthalpy change of the autoionisation of water, +55.84 kJ mol⁻¹. This standard tabulated value is
 * not given in NCERT; it is used only to make Kw rise with temperature, as NCERT states.
 */
const WATER_IONISATION_DELTA_H_KJ = 55.84

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number (received ${value})`)
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be zero or a positive number (received ${value})`)
  }
}

/**
 * Ionic product of water, Kw, at a temperature (Section 6.11.1). At 298 K it is 1.0 × 10⁻¹⁴; it
 * rises with temperature, approximated by the van 't Hoff equation with ΔH° = +55.84 kJ mol⁻¹.
 *
 * @param temperatureK Temperature in kelvin, default 298
 * @throws {RangeError} If the temperature is not positive
 */
export function kw(temperatureK = 298): number {
  assertPositive('temperature', temperatureK)
  return vantHoffK(KW_298, 298, temperatureK, WATER_IONISATION_DELTA_H_KJ)
}

/**
 * pH = −log₁₀[H⁺] (equation 6.27).
 *
 * @throws {RangeError} If the concentration is not positive
 */
export function pH(hConc: number): number {
  assertPositive('[H⁺]', hConc)
  return -Math.log10(hConc)
}

/**
 * pOH = −log₁₀[OH⁻].
 *
 * @throws {RangeError} If the concentration is not positive
 */
export function pOH(ohConc: number): number {
  assertPositive('[OH⁻]', ohConc)
  return -Math.log10(ohConc)
}

/** pKa = −log₁₀ Ka (equation 6.31). @throws {RangeError} If Ka is not positive */
export function pKa(ka: number): number {
  assertPositive('Ka', ka)
  return -Math.log10(ka)
}

/** pKb = −log₁₀ Kb (equation 6.34). @throws {RangeError} If Kb is not positive */
export function pKb(kb: number): number {
  assertPositive('Kb', kb)
  return -Math.log10(kb)
}

/**
 * Ka of the conjugate acid from Kb of the base, Ka = Kw / Kb (equation 6.36). Ka and Kb of a
 * conjugate pair multiply to Kw.
 *
 * @param kb Kb of the base, positive
 * @param kwValue Kw at the temperature of interest, default 1.0 × 10⁻¹⁴
 * @throws {RangeError} If either value is not positive
 */
export function kaFromKb(kb: number, kwValue = KW_298): number {
  assertPositive('Kb', kb)
  assertPositive('Kw', kwValue)
  return kwValue / kb
}

/**
 * pH of a strong acid at concentration c, including the water contribution, which matters below
 * about 10⁻⁶ M. Charge balance gives [H⁺] = c + Kw/[H⁺], so [H⁺] = (c + √(c² + 4Kw)) / 2. For 10⁻⁸ M
 * HCl this gives pH 6.98 (Problem 6.17).
 *
 * @throws {RangeError} If c is not positive
 */
export function strongAcidPH(c: number, temperatureK = 298): number {
  assertPositive('concentration', c)
  const hConc = (c + Math.sqrt(c * c + 4 * kw(temperatureK))) / 2
  return -Math.log10(hConc)
}

/**
 * pH of a strong base at concentration c, including water, by the same charge balance as
 * strongAcidPH with [OH⁻] in place of [H⁺].
 *
 * @throws {RangeError} If c is not positive
 */
export function strongBasePH(c: number, temperatureK = 298): number {
  assertPositive('concentration', c)
  const kwValue = kw(temperatureK)
  const ohConc = (c + Math.sqrt(c * c + 4 * kwValue)) / 2
  return -Math.log10(kwValue / ohConc)
}

/** Result of a weak acid calculation. `approximationValid` is true when α < 5 %. */
export interface WeakAcidResult {
  /** Degree of ionisation α = ionised / initial concentration. */
  alpha: number
  hConc: number
  pH: number
  approximationValid: boolean
}

/** Result of a weak base calculation. `approximationValid` is true when α < 5 %. */
export interface WeakBaseResult {
  alpha: number
  ohConc: number
  pH: number
  approximationValid: boolean
}

/**
 * pH of a weak acid HA of concentration c and Ka, from the exact quadratic x² + Ka x − Ka c = 0
 * (Section 6.11.3). The approximation x ≪ c is not used; approximationValid reports whether it would
 * have been accepted (α < 5 %). Reproduces Problem 6.18 (HF, α = 0.119, pH 2.62) and Problem 6.20.
 *
 * @throws {RangeError} If c or Ka is not positive
 */
export function weakAcid(c: number, ka: number): WeakAcidResult {
  assertPositive('concentration', c)
  assertPositive('Ka', ka)
  const hConc = (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2
  const alpha = hConc / c
  return { alpha, hConc, pH: -Math.log10(hConc), approximationValid: alpha < 0.05 }
}

/**
 * pH of a weak base B of concentration c and Kb, from x² + Kb x − Kb c = 0 for [OH⁻] (Section 6.11.4).
 * Reproduces Problem 6.23 (0.05 M NH3, α = 0.0188, pH 10.97).
 *
 * @throws {RangeError} If c or Kb is not positive
 */
export function weakBase(c: number, kb: number): WeakBaseResult {
  assertPositive('concentration', c)
  assertPositive('Kb', kb)
  const ohConc = (-kb + Math.sqrt(kb * kb + 4 * kb * c)) / 2
  const alpha = ohConc / c
  const pHValue = -Math.log10(KW_298 / ohConc)
  return { alpha, ohConc, pH: pHValue, approximationValid: alpha < 0.05 }
}

/** Salt types for hydrolysis (Section 6.11.9). */
export type SaltType = 'strong-strong' | 'weak-acid-strong-base' | 'strong-acid-weak-base' | 'weak-weak'

/** Constants needed for a salt type: ka for a weak acid part, kb for a weak base part. */
export interface SaltConstants {
  ka?: number
  kb?: number
}

/**
 * pH of a salt solution from hydrolysis (Section 6.11.9): strong–strong 7; weak acid with strong base
 * 7 + ½(pKa + log c); strong acid with weak base 7 − ½(pKb + log c); weak–weak 7 + ½(pKa − pKb).
 * Reproduces Problem 6.25 (ammonium acetate, 7.005).
 *
 * @param type Which parts of the salt are weak
 * @param c Salt concentration, positive
 * @param constants ka and/or kb as the salt type requires
 * @throws {RangeError} If c is not positive or a required constant is missing
 */
export function saltHydrolysisPH(type: SaltType, c: number, constants: SaltConstants = {}): number {
  assertPositive('concentration', c)
  if (type === 'strong-strong') return 7
  if (type === 'weak-acid-strong-base') {
    if (constants.ka === undefined) throw new RangeError('A weak acid salt needs ka')
    return 7 + 0.5 * (pKa(constants.ka) + Math.log10(c))
  }
  if (type === 'strong-acid-weak-base') {
    if (constants.kb === undefined) throw new RangeError('A weak base salt needs kb')
    return 7 - 0.5 * (pKb(constants.kb) + Math.log10(c))
  }
  if (constants.ka === undefined || constants.kb === undefined) {
    throw new RangeError('A weak–weak salt needs both ka and kb')
  }
  return 7 + 0.5 * (pKa(constants.ka) - pKb(constants.kb))
}

/**
 * Henderson–Hasselbalch equation for an acidic buffer, pH = pKa + log(c_salt / c_acid) (equation
 * 6.39 style, Section 6.12.1).
 *
 * @param pKaValue pKa of the weak acid
 * @param cSalt Concentration of the conjugate base (the salt), positive
 * @param cAcid Concentration of the weak acid, positive
 * @throws {RangeError} If a concentration is not positive
 */
export function hendersonPH(pKaValue: number, cSalt: number, cAcid: number): number {
  assertPositive('salt concentration', cSalt)
  assertPositive('acid concentration', cAcid)
  return pKaValue + Math.log10(cSalt / cAcid)
}

/**
 * Exact [H⁺] and pH of a weak acid of concentration c and Ka in the presence of its conjugate base at
 * cCommon (the common-ion case, Section 6.11.8 and Problem 6.22). Solves
 * h² + (cCommon + Ka)h − Ka·c = 0 for h = [H⁺].
 *
 * @param c Weak acid concentration, positive
 * @param ka Ka of the weak acid, positive
 * @param cCommon Concentration of the conjugate base from another source, zero or positive
 * @throws {RangeError} If c or Ka is not positive, or cCommon is negative
 */
export function commonIonWeakAcid(c: number, ka: number, cCommon: number): { hConc: number; pH: number } {
  assertPositive('concentration', c)
  assertPositive('Ka', ka)
  assertNonNegative('common-ion concentration', cCommon)
  const b = cCommon + ka
  const hConc = (-b + Math.sqrt(b * b + 4 * ka * c)) / 2
  return { hConc, pH: -Math.log10(hConc) }
}

/** A buffer made of a weak acid and its salt in one solution. */
export interface BufferState {
  pKa: number
  acidMoles: number
  saltMoles: number
  volumeL: number
}

/** A strong acid or strong base added to a buffer, in moles. */
export interface BufferAddition {
  kind: 'acid' | 'base'
  moles: number
}

/**
 * pH of a buffer after adding a strong acid or base (Section 6.12, the resistance of a buffer). Within
 * the buffer capacity the added H⁺ or OH⁻ converts salt to acid, or acid to salt, and Henderson–Hasselbalch
 * applies. Beyond the capacity the excess strong acid or base sets the pH directly. Volume changes on
 * addition are neglected.
 *
 * @throws {RangeError} If the buffer has no acid or no salt, a volume is not positive, or moles are negative
 */
export function bufferAfterAddition(buffer: BufferState, addition: BufferAddition): number {
  assertPositive('acid moles', buffer.acidMoles)
  assertPositive('salt moles', buffer.saltMoles)
  assertPositive('volume', buffer.volumeL)
  assertNonNegative('added moles', addition.moles)

  if (addition.kind === 'acid') {
    if (addition.moles <= buffer.saltMoles) {
      const salt = buffer.saltMoles - addition.moles
      const acid = buffer.acidMoles + addition.moles
      return buffer.pKa + Math.log10(salt / acid)
    }
    const excess = (addition.moles - buffer.saltMoles) / buffer.volumeL
    return -Math.log10(excess)
  }

  if (addition.moles <= buffer.acidMoles) {
    const acid = buffer.acidMoles - addition.moles
    const salt = buffer.saltMoles + addition.moles
    return buffer.pKa + Math.log10(salt / acid)
  }
  const excessOH = (addition.moles - buffer.acidMoles) / buffer.volumeL
  return 14 + Math.log10(excessOH)
}

/**
 * Species fractions of a polyprotic acid H_nA at a given pH (Section 6.11.6). Index i is the number
 * of protons removed: index 0 is H_nA, index n is Aⁿ⁻. Each fraction is α_i = (term_i) / Σ terms, with
 * term_i = [H⁺]^(n−i) × Ka1 … Ka_i.
 *
 * @param pHValue pH of the solution
 * @param kas Ka1 … Kan, all positive, in order
 * @throws {RangeError} If the list is empty or a constant is not positive
 */
export function polyprotic(pHValue: number, kas: readonly number[]): number[] {
  if (kas.length === 0) throw new RangeError('At least one ionisation constant is required')
  kas.forEach((ka, index) => assertPositive(`Ka${index + 1}`, ka))
  const n = kas.length
  const h = 10 ** -pHValue
  const terms: number[] = []
  for (let i = 0; i <= n; i++) {
    let term = h ** (n - i)
    for (let j = 0; j < i; j++) term *= kas[j]
    terms.push(term)
  }
  const total = terms.reduce((sum, term) => sum + term, 0)
  return terms.map((term) => term / total)
}

/**
 * pH of a polyprotic acid solution of concentration c from its charge balance,
 * [H⁺] = Σ i·c·α_i + Kw/[H⁺], solved by bisection on log₁₀[H⁺] (Section 6.11.6).
 *
 * @throws {RangeError} If c or a constant is not positive, or the list is empty
 */
export function polyproticPH(c: number, kas: readonly number[]): number {
  assertPositive('concentration', c)
  if (kas.length === 0) throw new RangeError('At least one ionisation constant is required')
  const balance = (logH: number): number => {
    const hConc = 10 ** logH
    const fractions = polyprotic(-logH, kas)
    const protons = fractions.reduce((sum, fraction, index) => sum + index * c * fraction, 0)
    return hConc - protons - KW_298 / hConc
  }
  let low = -14
  let high = 0
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2
    if (balance(mid) > 0) high = mid
    else low = mid
  }
  return -(low + high) / 2
}

/** One point on a titration curve. */
export interface TitrationPoint {
  volumeMl: number
  pH: number
}

/** Parameters of a titration curve: analyte in the flask, titrant from the burette. */
export interface TitrationCurveParams {
  analyte: 'strong-acid' | 'weak-acid'
  /** Ka of the weak acid; required for 'weak-acid'. */
  ka?: number
  analyteMolarity: number
  analyteVolumeMl: number
  /** Strong base titrant, molarity. */
  titrantMolarity: number
  /** Volumes of titrant added, mL. */
  addedVolumesMl: readonly number[]
}

/**
 * pH against the volume of strong base added, for a strong acid or a weak acid (Figure 6.x style
 * graph). Before the equivalence point the weak acid is treated as a buffer, using the exact
 * common-ion quadratic; at the equivalence point the salt hydrolyses; beyond it the excess base sets
 * the pH. A strong acid gives pH 7 at equivalence.
 *
 * @throws {RangeError} On a non-positive molarity or volume, a negative added volume, or a weak
 *   acid without a positive Ka
 */
export function titrationCurve(params: TitrationCurveParams): TitrationPoint[] {
  assertPositive('analyte molarity', params.analyteMolarity)
  assertPositive('analyte volume', params.analyteVolumeMl)
  assertPositive('titrant molarity', params.titrantMolarity)
  if (params.analyte === 'weak-acid') {
    if (params.ka === undefined) throw new RangeError('A weak acid titration needs ka')
    assertPositive('Ka', params.ka)
  }
  const analyteMoles = params.analyteMolarity * (params.analyteVolumeMl / 1000)
  const equivalenceTolerance = 1e-12

  return params.addedVolumesMl.map((addedMl) => {
    assertNonNegative('added volume', addedMl)
    const titrantMoles = params.titrantMolarity * (addedMl / 1000)
    const totalL = (params.analyteVolumeMl + addedMl) / 1000
    const remaining = analyteMoles - titrantMoles

    if (Math.abs(remaining) < equivalenceTolerance) {
      return {
        volumeMl: addedMl,
        pH: params.analyte === 'strong-acid' ? 7 : saltHydrolysisPH('weak-acid-strong-base', analyteMoles / totalL, { ka: params.ka }),
      }
    }

    if (remaining > 0) {
      if (params.analyte === 'strong-acid') {
        return { volumeMl: addedMl, pH: strongAcidPH(remaining / totalL) }
      }
      const acidConc = remaining / totalL
      const saltConc = titrantMoles / totalL
      const result = commonIonWeakAcid(acidConc, params.ka as number, saltConc)
      return { volumeMl: addedMl, pH: result.pH }
    }

    return { volumeMl: addedMl, pH: strongBasePH(-remaining / totalL) }
  })
}
