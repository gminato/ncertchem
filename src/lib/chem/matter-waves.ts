import { PLANCK } from './constants'

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number (received ${value})`)
  }
}

/**
 * Returns the de Broglie wavelength λ = h / (m v) in metres (NCERT Class 11, Unit 2,
 * equation 2.22).
 *
 * @param massKg Mass of the particle in kilograms
 * @param speedMs Speed of the particle in m/s
 * @throws {RangeError} If the mass or speed is not a positive finite number
 */
export function deBroglieWavelength(massKg: number, speedMs: number): number {
  requirePositive(massKg, 'Mass')
  requirePositive(speedMs, 'Speed')
  return PLANCK / (massKg * speedMs)
}

/**
 * Returns the minimum uncertainty in velocity (m/s) for a given position uncertainty,
 * from Δx · Δp ≥ h / 4π with Δp = m Δv, so Δv ≥ h / (4π m Δx).
 *
 * @param massKg Mass of the particle in kilograms
 * @param deltaXm Uncertainty in position in metres
 * @throws {RangeError} If the mass or position uncertainty is not a positive finite number
 */
export function uncertaintyMinDeltaV(massKg: number, deltaXm: number): number {
  requirePositive(massKg, 'Mass')
  requirePositive(deltaXm, 'Position uncertainty')
  return PLANCK / (4 * Math.PI * massKg * deltaXm)
}

/**
 * Returns the minimum uncertainty in position (m) for a given velocity uncertainty,
 * from Δx · Δp ≥ h / 4π with Δp = m Δv, so Δx ≥ h / (4π m Δv).
 *
 * @param massKg Mass of the particle in kilograms
 * @param deltaVms Uncertainty in velocity in m/s
 * @throws {RangeError} If the mass or velocity uncertainty is not a positive finite number
 */
export function uncertaintyMinDeltaX(massKg: number, deltaVms: number): number {
  requirePositive(massKg, 'Mass')
  requirePositive(deltaVms, 'Velocity uncertainty')
  return PLANCK / (4 * Math.PI * massKg * deltaVms)
}
