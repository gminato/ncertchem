import { AVOGADRO } from './constants'
import { molarMass } from './formula'

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative number (received ${value})`)
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number (received ${value})`)
  }
}

/**
 * Converts a mass to an amount in moles: n = m / M.
 *
 * @param grams Mass in grams
 * @param formula Chemical formula, e.g. 'H2O'
 * @throws {RangeError} If the mass is negative or the formula is invalid
 */
export function massToMoles(grams: number, formula: string): number {
  assertNonNegative(grams, 'Mass')
  return grams / molarMass(formula)
}

/**
 * Converts an amount in moles to a mass: m = n × M.
 *
 * @param moles Amount in mol
 * @param formula Chemical formula, e.g. 'H2O'
 * @throws {RangeError} If the amount is negative or the formula is invalid
 */
export function molesToMass(moles: number, formula: string): number {
  assertNonNegative(moles, 'Amount')
  return moles * molarMass(formula)
}

/**
 * Number of entities in an amount of substance: N = n × N_A (N_A = 6.022 × 10²³ mol⁻¹).
 *
 * @throws {RangeError} If the amount is negative
 */
export function molesToParticles(moles: number): number {
  assertNonNegative(moles, 'Amount')
  return moles * AVOGADRO
}

/**
 * Amount of substance from a number of entities: n = N / N_A.
 *
 * @throws {RangeError} If the number of particles is negative
 */
export function particlesToMoles(particles: number): number {
  assertNonNegative(particles, 'Particle count')
  return particles / AVOGADRO
}

/**
 * Molarity: moles of solute per litre of solution.
 *
 * @param molesSolute Amount of solute in mol
 * @param litresSolution Volume of solution in litres (not solvent)
 * @throws {RangeError} If the amount is negative or the volume is not positive
 */
export function molarity(molesSolute: number, litresSolution: number): number {
  assertNonNegative(molesSolute, 'Amount of solute')
  assertPositive(litresSolution, 'Volume of solution')
  return molesSolute / litresSolution
}

/**
 * Molality: moles of solute per kilogram of solvent.
 *
 * @param molesSolute Amount of solute in mol
 * @param kgSolvent Mass of solvent in kilograms
 * @throws {RangeError} If the amount is negative or the solvent mass is not positive
 */
export function molality(molesSolute: number, kgSolvent: number): number {
  assertNonNegative(molesSolute, 'Amount of solute')
  assertPositive(kgSolvent, 'Mass of solvent')
  return molesSolute / kgSolvent
}

/**
 * Mole fraction of component A: x_A = n_A / n_total.
 *
 * @throws {RangeError} If n_A is negative, n_total is not positive, or n_A exceeds n_total
 */
export function moleFraction(molesA: number, molesTotal: number): number {
  assertNonNegative(molesA, 'Moles of component A')
  assertPositive(molesTotal, 'Total moles')
  if (molesA > molesTotal) {
    throw new RangeError('Moles of component A cannot exceed the total moles')
  }
  return molesA / molesTotal
}

/**
 * Dilution: M1 V1 = M2 V2. Returns the final volume V2 = M1 V1 / M2.
 * V1 and V2 must be in the same units, which are also the units of the result.
 *
 * @param M1 Molarity of the stock solution
 * @param V1 Volume of stock solution taken
 * @param M2 Target molarity
 * @throws {RangeError} If M1 or M2 is not positive, or V1 is negative
 */
export function dilutionVolume(M1: number, V1: number, M2: number): number {
  assertPositive(M1, 'Stock molarity M1')
  assertNonNegative(V1, 'Stock volume V1')
  assertPositive(M2, 'Target molarity M2')
  return (M1 * V1) / M2
}
