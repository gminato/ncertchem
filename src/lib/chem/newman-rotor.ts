/**
 * The rules of the Newman rotor simulation (Section 9.2.4): how a pointer or a control turns the back
 * carbon of ethane, which conformer the turned molecule is, and the temperature readout. Every number
 * comes from conformations.ts, so the simulation names and measures nothing of its own.
 */

import { ETHANE_TORSIONAL_BARRIER_KJ, boltzmannStaggeredFraction, conformationName, ethaneTorsionalEnergy } from './conformations'

/** The SVG angle (degrees) of the first front hydrogen in the Newman drawing: the top bond. */
export const FRONT_REFERENCE_DEG = -90

/** The lowest and highest temperatures the readout accepts, in kelvin. */
export const ROTOR_TEMPERATURE_RANGE = { min: 100, max: 1000 } as const

/** Wraps an angle into [0, 360). */
export function wrapTurn(deg: number): number {
  if (!Number.isFinite(deg)) throw new RangeError('The angle must be a finite number of degrees')
  const m = ((deg % 360) + 360) % 360
  return m >= 360 ? 0 : m
}

/**
 * The dihedral angle that a pointer on the Newman drawing selects. The pointer's angle (SVG degrees,
 * measured from the centre of the drawing) is the direction of the back hydrogen it is holding, so the
 * dihedral is that angle minus the reference angle of the top front bond, rounded to whole degrees.
 *
 * @param pointerDeg the pointer's angle from the centre, in SVG degrees (any real value)
 */
export function dihedralFromPointer(pointerDeg: number): number {
  return wrapTurn(Math.round(wrapTurn(pointerDeg) - FRONT_REFERENCE_DEG))
}

/** The nearest staggered or eclipsed angle: a multiple of 60°. */
export function snapToNearestSixty(dihedral: number): number {
  return wrapTurn(Math.round(wrapTurn(dihedral) / 60) * 60)
}

/** The conformer name and the energy above the staggered form, as the lib gives them. */
export interface RotorReadout {
  dihedral: number
  name: 'eclipsed' | 'staggered' | 'skew'
  energy: number
}

/** What the simulation reports for a dihedral: its name from the lib and the energy from the lib's model. */
export function rotorReadout(dihedral: number): RotorReadout {
  const d = wrapTurn(Math.round(dihedral))
  return { dihedral: d, name: conformationName(d), energy: ethaneTorsionalEnergy(d) }
}

/**
 * The staggered fraction of the two-level model at a temperature, as a percentage with one decimal
 * place. It is the lib's illustration, not a measured population.
 *
 * @throws {RangeError} If the temperature is not a positive finite number of kelvin
 */
export function staggeredPercent(T: number): number {
  return Math.round(boltzmannStaggeredFraction(T) * 1000) / 10
}

/** The barrier, in kJ mol⁻¹, as the lib has it. */
export const ROTOR_BARRIER_KJ = ETHANE_TORSIONAL_BARRIER_KJ
