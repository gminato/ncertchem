/**
 * Nernst equation for electrode and cell potentials (NCERT Class 12 Unit 2, Sec. 2.3.1, Eqs. 2.8 to 2.13).
 * Concentrations are in mol L⁻¹ and gas pressures in bar; the solid electrode has activity 1.
 * With T omitted, the 298 K form using 0.059 V is used (NCERT's convention). With T given, the exact
 * RT ln10 / (nF) slope is used.
 */

import { FARADAY, GAS_CONSTANT_J, NERNST_SLOPE_298 } from './ncert-c12-unit2-tables'

/** Coefficient of log₁₀ in the Nernst equation for n electrons: 0.059/n at 298 K, or RT ln10/(nF). */
export function nernstLog10Slope(n: number, tempK?: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`n must be a positive integer, got ${n}`)
  if (tempK === undefined) return NERNST_SLOPE_298 / n
  if (!(tempK > 0) || !Number.isFinite(tempK)) throw new RangeError(`Temperature must be positive, got ${tempK}`)
  return (GAS_CONSTANT_J * tempK * Math.LN10) / (n * FARADAY)
}

/** A species in a reaction quotient: concentration or partial pressure, with its stoichiometric power. */
export interface QuotientTerm {
  readonly value: number
  readonly power: number
}

function requirePositive(value: number, label: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be positive and finite, got ${value}`)
  }
}

/** Q = Π products^power / Π reactants^power. Throws on a non-positive concentration or pressure. */
export function reactionQuotient(products: readonly QuotientTerm[], reactants: readonly QuotientTerm[]): number {
  let q = 1
  for (const t of products) {
    requirePositive(t.value, 'Product activity')
    q *= t.value ** t.power
  }
  for (const t of reactants) {
    requirePositive(t.value, 'Reactant activity')
    q /= t.value ** t.power
  }
  return q
}

/**
 * Electrode potential for the reduction Mⁿ⁺ + ne⁻ → M(s):
 * E = E° + (RT/nF) ln[Mⁿ⁺] = E° + slope × log₁₀[Mⁿ⁺].
 */
export function electrodePotential(e0: number, n: number, cationMolPerL: number, tempK?: number): number {
  requirePositive(cationMolPerL, 'Cation concentration')
  return e0 + nernstLog10Slope(n, tempK) * Math.log10(cationMolPerL)
}

/** Cell EMF for reaction quotient Q: E = E°cell − (RT/nF) ln Q (Eq. 2.9). */
export function cellPotential(e0Cell: number, n: number, q: number, tempK?: number): number {
  requirePositive(q, 'Reaction quotient')
  return e0Cell - nernstLog10Slope(n, tempK) * Math.log10(q)
}

/**
 * Hydrogen electrode, 2H⁺ + 2e⁻ → H₂(g) at 1 bar: E = −0.059 pH at 298 K (n = 1 slope per proton).
 * Pass T for any other temperature.
 */
export function hydrogenElectrodePotential(pH: number, tempK?: number): number {
  return -nernstLog10Slope(1, tempK) * pH
}
