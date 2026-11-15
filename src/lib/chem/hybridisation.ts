/**
 * Hybridisation for NCERT Class 11 Unit 4, Section 4.6. The steric number (the number of
 * bonded atoms plus lone pairs on the central atom, with a multiple bond counted once) sets the
 * hybridisation: 2 gives sp, 3 gives sp², 4 gives sp³, 5 gives sp³d and 6 gives sp³d². The
 * hybrid directions are the VSEPR positions of the same domain count (vsepr.ts), because the
 * hybrids point where the electron pairs do.
 *
 * The examples are the molecules NCERT works through in Section 4.6. Bond counts for ethene
 * and ethyne use the σ and π split NCERT gives (one σ and one π in each C=C, two π in C≡C).
 */

import { vseprPositions, type Vec3 } from './vsepr'

/** A hybridisation the chapter names. */
export type Hybridisation = 'sp' | 'sp2' | 'sp3' | 'sp3d' | 'sp3d2'

const STERIC_NUMBER_OF: Readonly<Record<Hybridisation, number>> = {
  sp: 2,
  sp2: 3,
  sp3: 4,
  sp3d: 5,
  sp3d2: 6,
}

const BY_STERIC_NUMBER: Readonly<Record<number, Hybridisation>> = Object.fromEntries(
  (Object.entries(STERIC_NUMBER_OF) as [Hybridisation, number][]).map(([hybrid, sn]) => [sn, hybrid]),
)

/**
 * Steric number: bonded atoms (each multiple bond counted once) plus lone pairs.
 *
 * @throws {RangeError} If either count is negative or not an integer
 */
export function stericNumber(bondedAtoms: number, lonePairs: number): number {
  for (const [name, value] of [['bondedAtoms', bondedAtoms], ['lonePairs', lonePairs]] as const) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative integer (received ${value})`)
  }
  return bondedAtoms + lonePairs
}

/**
 * Hybridisation for a steric number of 2 to 6.
 *
 * @throws {RangeError} If the steric number is outside 2 to 6
 */
export function hybridisationFor(sn: number): Hybridisation {
  const hybrid = BY_STERIC_NUMBER[sn]
  if (!hybrid) throw new RangeError(`No hybridisation for steric number ${sn} (NCERT covers 2 to 6)`)
  return hybrid
}

/** The atomic orbitals that mix to form the hybrids (Section 4.6). */
export function hybridisedOrbitals(hybrid: Hybridisation): readonly string[] {
  switch (hybrid) {
    case 'sp':
      return ['s', 'p']
    case 'sp2':
      return ['s', 'p', 'p']
    case 'sp3':
      return ['s', 'p', 'p', 'p']
    case 'sp3d':
      return ['s', 'p', 'p', 'p', 'd']
    case 'sp3d2':
      return ['s', 'p', 'p', 'p', 'd', 'd']
  }
}

/** Fraction of s character in each hybrid orbital: 1/2 for sp, 1/3 for sp², 1/4 for sp³, and so on. */
export function sCharacter(hybrid: Hybridisation): number {
  return 1 / hybridisedOrbitals(hybrid).length
}

/**
 * Unit vectors of the hybrid orbitals, one per hybrid. These are the VSEPR directions for
 * that steric number with no lone pairs, so they match the shape of the hybrid set.
 */
export function hybridDirections(hybrid: Hybridisation): Vec3[] {
  return vseprPositions(STERIC_NUMBER_OF[hybrid], 0).bonds
}

/** One worked example from Section 4.6, with the hybridisation of its central atom. */
export interface HybridExample {
  molecule: string
  /** Central atom whose hybridisation is given (for C2H6, C2H4 and C2H2, each carbon). */
  centre: string
  /** Bonded atoms (multiple bonds counted once) around the centre. */
  bondedAtoms: number
  lonePairs: number
  hybridisation: Hybridisation
  /** Whole-molecule σ bonds. */
  sigmaBonds: number
  /** Whole-molecule π bonds. */
  piBonds: number
  /** Atomic orbitals that mix at the centre, as in {@link hybridisedOrbitals}. */
  mixingNote: string
}

/** The Section 4.6 examples, in the order NCERT gives them. */
export const NCERT_HYBRIDISATION_EXAMPLES: readonly HybridExample[] = [
  {
    molecule: 'BeCl2', centre: 'Be', bondedAtoms: 2, lonePairs: 0, hybridisation: 'sp',
    sigmaBonds: 2, piBonds: 0, mixingNote: 'one 2s and one 2p orbital of Be mix',
  },
  {
    molecule: 'BCl3', centre: 'B', bondedAtoms: 3, lonePairs: 0, hybridisation: 'sp2',
    sigmaBonds: 3, piBonds: 0, mixingNote: 'one 2s and two 2p orbitals of B mix',
  },
  {
    molecule: 'CH4', centre: 'C', bondedAtoms: 4, lonePairs: 0, hybridisation: 'sp3',
    sigmaBonds: 4, piBonds: 0, mixingNote: 'one 2s and three 2p orbitals of C mix',
  },
  {
    molecule: 'NH3', centre: 'N', bondedAtoms: 3, lonePairs: 1, hybridisation: 'sp3',
    sigmaBonds: 3, piBonds: 0, mixingNote: 'the lone pair sits in one of the four sp³ orbitals',
  },
  {
    molecule: 'H2O', centre: 'O', bondedAtoms: 2, lonePairs: 2, hybridisation: 'sp3',
    sigmaBonds: 2, piBonds: 0, mixingNote: 'two of the four sp³ orbitals hold lone pairs',
  },
  {
    molecule: 'C2H6', centre: 'C', bondedAtoms: 4, lonePairs: 0, hybridisation: 'sp3',
    sigmaBonds: 7, piBonds: 0, mixingNote: 'each C is sp³; the C–C σ bond is sp³–sp³ overlap',
  },
  {
    molecule: 'C2H4', centre: 'C', bondedAtoms: 3, lonePairs: 0, hybridisation: 'sp2',
    sigmaBonds: 5, piBonds: 1, mixingNote: 'each C is sp²; the unhybridised 2p orbitals make the π bond',
  },
  {
    molecule: 'C2H2', centre: 'C', bondedAtoms: 2, lonePairs: 0, hybridisation: 'sp',
    sigmaBonds: 3, piBonds: 2, mixingNote: 'each C is sp; two unhybridised 2p orbitals per C make two π bonds',
  },
  {
    molecule: 'PCl5', centre: 'P', bondedAtoms: 5, lonePairs: 0, hybridisation: 'sp3d',
    sigmaBonds: 5, piBonds: 0, mixingNote: 'one 3s, three 3p and one 3d orbital of P mix',
  },
  {
    molecule: 'SF6', centre: 'S', bondedAtoms: 6, lonePairs: 0, hybridisation: 'sp3d2',
    sigmaBonds: 6, piBonds: 0, mixingNote: 'one 3s, three 3p and two 3d orbitals of S mix',
  },
]
