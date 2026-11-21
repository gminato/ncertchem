/**
 * Galvanic cell notation, cell EMF, electron direction, and the thermodynamic link between
 * E°cell, ΔrG° and K (NCERT Class 12 Unit 2, Sec. 2.2 to 2.3, Eqs. 2.1 to 2.16).
 */

import { FARADAY, GAS_CONSTANT_J, T_REFERENCE_K } from './ncert-c12-unit2-tables'

/** One half-cell for notation: the electrode phase and the solution species, e.g. 'Zn(s)' and 'Zn²⁺(aq)'. */
export interface CellHalf {
  readonly electrode: string
  readonly solution: string
}

/**
 * Cell notation with the anode on the left: anode | anode solution || cathode solution | cathode.
 * `|` is a phase boundary and `||` is the salt bridge (NCERT Sec. 2.2).
 */
export function cellNotation(anode: CellHalf, cathode: CellHalf): string {
  return `${anode.electrode}|${anode.solution}||${cathode.solution}|${cathode.electrode}`
}

/** E°cell = E°(cathode) − E°(anode), from two reduction potentials in volts. */
export function standardCellPotential(cathodeE0: number, anodeE0: number): number {
  return cathodeE0 - anodeE0
}

export interface Couple {
  readonly name: string
  /** Reduction potential E° / V. */
  readonly e0: number
}

export interface CellAssignment {
  readonly cathode: Couple
  readonly anode: Couple
  /** E°cell / V, positive for a spontaneous cell. */
  readonly eCell: number
}

/**
 * The couple with the higher E° is reduced (cathode); the other is oxidised (anode).
 * Equal potentials give E°cell = 0 and the first couple is taken as the cathode.
 */
export function assignElectrodes(a: Couple, b: Couple): CellAssignment {
  const [cathode, anode] = a.e0 >= b.e0 ? [a, b] : [b, a]
  return { cathode, anode, eCell: standardCellPotential(cathode.e0, anode.e0) }
}

/** Electrons leave the anode and travel through the external circuit to the cathode. */
export const ELECTRON_FLOW = { from: 'anode', to: 'cathode' } as const

/** Conventional current runs the opposite way, from cathode to anode, through the external circuit. */
export const CURRENT_FLOW = { from: 'cathode', to: 'anode' } as const

/** ΔrG = −nFE for the reaction as written, in J mol⁻¹ (Eq. 2.15). */
export function gibbsFromCell(n: number, eCell: number): number {
  requirePositiveInteger(n)
  return -n * FARADAY * eCell
}

/** ΔrG in kJ mol⁻¹. */
export function gibbsFromCellKJ(n: number, eCell: number): number {
  return gibbsFromCell(n, eCell) / 1000
}

/**
 * log₁₀K for a cell reaction, from E°cell (Eq. 2.14).
 * With T omitted, NCERT's 298 K form nE°/0.059 is used. With T given, the exact
 * RT ln10 / (nF) slope is used (0.05916 V at 298 K).
 */
export function log10KFromE(n: number, e0Cell: number, tempK?: number): number {
  requirePositiveInteger(n)
  if (tempK === undefined) return (n * e0Cell) / 0.059
  requirePositiveTemperature(tempK)
  return (n * FARADAY * e0Cell) / (GAS_CONSTANT_J * tempK * Math.LN10)
}

/** Equilibrium constant K = 10^(log₁₀K) from E°cell. See log10KFromE for the 298 K convention. */
export function equilibriumConstantFromE(n: number, e0Cell: number, tempK?: number): number {
  return 10 ** log10KFromE(n, e0Cell, tempK)
}

/** ΔrG° = −RT ln K, in J mol⁻¹. Temperature defaults to 298 K. */
export function standardGibbsFromK(k: number, tempK: number = T_REFERENCE_K): number {
  if (!(k > 0) || !Number.isFinite(k)) throw new RangeError(`K must be positive, got ${k}`)
  requirePositiveTemperature(tempK)
  return -GAS_CONSTANT_J * tempK * Math.log(k)
}

function requirePositiveInteger(n: number): void {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`n must be a positive integer, got ${n}`)
}

function requirePositiveTemperature(t: number): void {
  if (!(t > 0) || !Number.isFinite(t)) throw new RangeError(`Temperature must be positive, got ${t}`)
}
