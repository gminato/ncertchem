/**
 * Bond and molecular dipoles for NCERT Class 11 Unit 4, Section 4.3.6 and Table 4.5.
 *
 * Model. Each bond between the central atom and a ligand contributes a bond dipole whose
 * magnitude is the Pauling electronegativity difference (in units of Δχ, arbitrary) and whose
 * direction is from the less electronegative (δ⁺) atom to the more electronegative (δ⁻) atom.
 * This is the chemist's convention NCERT uses: the arrow points to the negative end (the
 * crossed arrow in NCERT's diagrams has its tail at the positive end). A lone pair on the
 * central atom contributes a dipole along its direction, pointing from the atom (δ⁺) to the
 * lone pair (δ⁻), with fixed magnitude LONE_PAIR_DIPOLE. The net dipole is the 3D vector sum.
 *
 * Simplifications, stated so they can be checked against NCERT:
 * - Magnitudes are in arbitrary units, not debye. Only the ordering and the zero/non-zero
 *   results are meaningful. NCERT's printed debye values are returned by ncertDipoleFor.
 * - Electronegativity difference stands in for bond polarity. Real bond dipoles also depend on
 *   bond length and on the atoms' polarisability.
 * - LONE_PAIR_DIPOLE is one value fitted so that NH3 has a larger dipole than NF3, which is
 *   NCERT's explanation (Section 4.3.6, book p. 112): in NH3 the lone pair and the N–H bond
 *   dipoles point the same way, while in NF3 the lone pair opposes the N–F bond dipoles.
 *
 * Geometry comes from vsepr.ts. Symmetric molecules (CO2, BF3, CH4, CCl4) come out at zero,
 * as Table 4.5 prints.
 */

import { elementBySymbol } from './periodic-data'
import { NCERT_TABLE_4_5_DIPOLE_MOMENTS } from './ncert-unit4-tables'
import { vseprPositions, type Vec3 } from './vsepr'

/**
 * Dipole contribution of one lone pair, in the same arbitrary units as Δχ. Chosen so NH3
 * (1.64) exceeds NF3 (0.14) and H2O exceeds NH3, the order NCERT Table 4.5 prints.
 */
export const LONE_PAIR_DIPOLE = 0.8

/** One ligand bonded to the central atom. `direction` is a unit vector from the centre to the ligand. */
export interface DipoleLigand {
  symbol: string
  direction: Vec3
}

/** A molecule for dipole purposes: the central atom, its ligands, and its lone-pair directions. */
export interface DipoleMolecule {
  centre: string
  ligands: readonly DipoleLigand[]
  /** Unit vectors from the centre along each lone pair. */
  lonePairDirections: readonly Vec3[]
}

/** Result of {@link netDipole}. */
export interface NetDipole {
  /** Net dipole vector in arbitrary units. */
  vector: Vec3
  /** Length of `vector` in arbitrary units. */
  magnitude: number
  /** Unit vector along the net dipole, or null when the net dipole is zero. */
  direction: Vec3 | null
}

const ZERO_TOLERANCE = 1e-9

/**
 * Pauling electronegativity of an element from the periodic table data.
 *
 * @throws {RangeError} If the symbol is unknown or has no electronegativity
 */
export function electronegativityOf(symbol: string): number {
  const record = elementBySymbol(symbol)
  if (!record) throw new RangeError(`Unknown element symbol ${symbol}`)
  if (record.electronegativity === null) throw new RangeError(`No electronegativity for ${symbol}`)
  return record.electronegativity
}

/**
 * Bond dipole vector for one bond from the centre to a ligand, in arbitrary units. Points from
 * the less electronegative atom to the more electronegative one.
 *
 * @param centre Symbol of the central atom.
 * @param ligand Symbol and unit direction from the centre to the ligand.
 */
export function bondDipoleVector(centre: string, ligand: DipoleLigand): Vec3 {
  const delta = electronegativityOf(ligand.symbol) - electronegativityOf(centre)
  // Positive delta: the ligand is more electronegative, so the dipole points centre → ligand.
  const [x, y, z] = ligand.direction
  return [delta * x, delta * y, delta * z]
}

/** Dipole vector of one lone pair: from the centre (δ⁺) along the lone-pair direction (δ⁻). */
export function lonePairDipoleVector(direction: Vec3): Vec3 {
  return [LONE_PAIR_DIPOLE * direction[0], LONE_PAIR_DIPOLE * direction[1], LONE_PAIR_DIPOLE * direction[2]]
}

/**
 * Net dipole of a molecule: the vector sum of its bond dipoles and lone-pair dipoles.
 *
 * @throws {RangeError} If an element symbol has no electronegativity
 */
export function netDipole(molecule: DipoleMolecule): NetDipole {
  let x = 0
  let y = 0
  let z = 0
  for (const ligand of molecule.ligands) {
    const [dx, dy, dz] = bondDipoleVector(molecule.centre, ligand)
    x += dx
    y += dy
    z += dz
  }
  for (const direction of molecule.lonePairDirections) {
    const [dx, dy, dz] = lonePairDipoleVector(direction)
    x += dx
    y += dy
    z += dz
  }
  const magnitude = Math.hypot(x, y, z)
  const isZero = magnitude < ZERO_TOLERANCE
  return {
    vector: [x, y, z],
    magnitude: isZero ? 0 : magnitude,
    direction: isZero ? null : [x / magnitude, y / magnitude, z / magnitude],
  }
}

/**
 * Builds a {@link DipoleMolecule} from a VSEPR arrangement: the ligand symbols are placed on
 * the bonding positions for the given domain counts, and the lone pairs on theirs.
 *
 * @param centre Central atom symbol.
 * @param ligandSymbols One symbol per bonding pair, in the order the positions are generated.
 * @param lonePairs Number of lone pairs on the central atom.
 * @throws {RangeError} If the number of ligand symbols does not match the bonding pairs for the class
 */
export function dipoleMoleculeFromVsepr(centre: string, ligandSymbols: readonly string[], lonePairs: number): DipoleMolecule {
  const { bonds, lonePairs: lpDirections } = vseprPositions(ligandSymbols.length, lonePairs)
  return {
    centre,
    ligands: ligandSymbols.map((symbol, i) => ({ symbol, direction: bonds[i] })),
    lonePairDirections: lpDirections,
  }
}

/**
 * The printed dipole moment of a molecule in NCERT Table 4.5, in debye, or null if the table
 * does not list it. Use this wherever a real dipole value is shown next to the model.
 */
export function ncertDipoleFor(molecule: string): number | null {
  const row = NCERT_TABLE_4_5_DIPOLE_MOMENTS.rows.find((r) => r.molecule === molecule)
  return row ? row.dipoleD : null
}
