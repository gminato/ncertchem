/**
 * Lewis structures for NCERT Class 11 Unit 4, Section 4.1: valence electron counts, formal
 * charges, the octet check (incomplete, expanded and odd-electron cases from Section 4.1.5),
 * and a curated library of the species NCERT draws (Table 4.1 and the worked problems).
 *
 * A structure is a list of atoms with their lone pairs and any unpaired electron, and a list
 * of bonds with their order. Coordinates are a rough 2D layout in arbitrary units, for drawing
 * only; no chemistry depends on them.
 *
 * Formal charge follows NCERT Section 4.1.4: valence electrons minus non-bonding electrons
 * minus half the bonding (shared) electrons.
 */

import { elementBySymbol, valenceElectrons } from './periodic-data'

/** One atom of a Lewis structure. */
export interface LewisAtom {
  element: string
  /** Layout x in arbitrary units, for drawing only. */
  x: number
  /** Layout y in arbitrary units, for drawing only. */
  y: number
  /** Number of lone (non-bonding) pairs on this atom. */
  lonePairs: number
  /** 1 if the atom carries one unpaired electron (odd-electron species such as NO), otherwise 0. */
  unpairedElectrons: 0 | 1
}

/** A covalent bond between two atoms of a structure, by index into `atoms`. */
export interface LewisBond {
  a: number
  b: number
  order: 1 | 2 | 3
}

/** A Lewis structure for one species, with its net charge. */
export interface LewisStructure {
  /** Display formula, e.g. "H2O", "NO2⁻", "CO3²⁻". */
  name: string
  /** Net charge of the species. */
  charge: number
  atoms: readonly LewisAtom[]
  bonds: readonly LewisBond[]
}

/** Octet status of one atom (Section 4.1.5). */
export type OctetStatus = 'complete' | 'incomplete' | 'expanded' | 'odd-electron' | 'overfull'

/** Octet status of one atom in a structure. */
export interface AtomOctet {
  index: number
  element: string
  electrons: number
  status: OctetStatus
}

function valenceOf(element: string): number {
  const record = elementBySymbol(element)
  if (!record) throw new RangeError(`Unknown element symbol ${element}`)
  const valence = valenceElectrons(record.Z)
  if (valence === null) throw new RangeError(`No representative-element valence for ${element}`)
  return valence
}

/**
 * Total number of valence electrons available for bonding in a species.
 * Each negative charge adds one electron and each positive charge removes one.
 *
 * @param atoms Element symbols, one entry per atom (e.g. ['C', 'O', 'O'] for CO2).
 * @param charge Net charge of the species (0 for a molecule).
 * @throws {RangeError} If a symbol is unknown or has no representative-element valence
 */
export function totalValenceElectrons(atoms: readonly string[], charge = 0): number {
  if (!Number.isInteger(charge)) throw new RangeError(`charge must be an integer (received ${charge})`)
  return atoms.reduce((total, symbol) => total + valenceOf(symbol), 0) - charge
}

/**
 * Formal charge of an atom: valence electrons minus non-bonding electrons minus half the
 * bonding (shared) electrons. Section 4.1.4.
 *
 * @param valence Valence electrons of the free atom.
 * @param nonBonding Electrons on the atom that are not shared (lone pair electrons plus any unpaired electron).
 * @param bonding Shared electrons on the atom: two per bond, counted once for each bond.
 */
export function formalCharge(valence: number, nonBonding: number, bonding: number): number {
  for (const [name, value] of [['valence', valence], ['nonBonding', nonBonding], ['bonding', bonding]] as const) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(`${name} must be a non-negative integer (received ${value})`)
    }
  }
  return valence - nonBonding - bonding / 2
}

/** Shared electrons on atom `index`: two per bond order, summed over every bond it takes part in. */
function bondingElectronsOn(structure: LewisStructure, index: number): number {
  return structure.bonds
    .filter((bond) => bond.a === index || bond.b === index)
    .reduce((sum, bond) => sum + 2 * bond.order, 0)
}

/** Non-bonding electrons on atom `index`: two per lone pair plus any unpaired electron. */
function nonBondingElectronsOn(structure: LewisStructure, index: number): number {
  const atom = structure.atoms[index]
  return 2 * atom.lonePairs + atom.unpairedElectrons
}

/**
 * Formal charge of every atom in a structure, in atom order.
 *
 * @throws {RangeError} If an element symbol is unknown
 */
export function formalChargesOf(structure: LewisStructure): number[] {
  return structure.atoms.map((atom, index) =>
    formalCharge(valenceOf(atom.element), nonBondingElectronsOn(structure, index), bondingElectronsOn(structure, index)),
  )
}

/** Electrons the structure places on its atoms and bonds: non-bonding plus bonding (each bond counted once). */
export function structureElectronCount(structure: LewisStructure): number {
  const nonBonding = structure.atoms.reduce((sum, _atom, index) => sum + nonBondingElectronsOn(structure, index), 0)
  const bonding = structure.bonds.reduce((sum, bond) => sum + 2 * bond.order, 0)
  return nonBonding + bonding
}

/**
 * Octet status of one atom (Section 4.1.5). H is complete at two electrons (a duplet). Any
 * other atom with fewer than eight electrons is incomplete (Be with four and B with six are
 * the NCERT examples). Atoms of period 3 and below may hold more than eight (expanded octet).
 * An odd electron count is odd-electron.
 *
 * @throws {RangeError} If the atom index is out of range or the element is unknown
 */
export function octetStatusOf(structure: LewisStructure, index: number): AtomOctet {
  const atom = structure.atoms[index]
  if (!atom) throw new RangeError(`No atom at index ${index}`)
  const electrons = nonBondingElectronsOn(structure, index) + bondingElectronsOn(structure, index)
  const record = elementBySymbol(atom.element)
  if (!record) throw new RangeError(`Unknown element symbol ${atom.element}`)
  const target = atom.element === 'H' ? 2 : 8
  let status: OctetStatus
  if (electrons % 2 === 1) status = 'odd-electron'
  else if (electrons < target) status = 'incomplete'
  else if (electrons === target) status = 'complete'
  else if (record.period >= 3) status = 'expanded'
  else status = 'overfull'
  return { index, element: atom.element, electrons, status }
}

/**
 * Octet status of every atom in a structure. Use this to flag the incomplete, expanded and
 * odd-electron cases.
 */
export function octetReport(structure: LewisStructure): AtomOctet[] {
  return structure.atoms.map((_atom, index) => octetStatusOf(structure, index))
}

/** Result of {@link checkStructure}. */
export interface StructureCheck {
  /** Electrons the structure uses equals the species' valence electron total. */
  electronsConserved: boolean
  /** Formal charges sum to the net charge of the species. */
  chargeConserved: boolean
  /** Sum of the formal charges (equal to `charge` when the structure is consistent). */
  formalChargeSum: number
}

/**
 * Checks that a structure uses every valence electron exactly once and that its formal
 * charges sum to the species' net charge.
 */
export function checkStructure(structure: LewisStructure): StructureCheck {
  const elements = structure.atoms.map((atom) => atom.element)
  const expected = totalValenceElectrons(elements, structure.charge)
  const formalChargeSum = formalChargesOf(structure).reduce((sum, value) => sum + value, 0)
  return {
    electronsConserved: structureElectronCount(structure) === expected,
    chargeConserved: formalChargeSum === structure.charge,
    formalChargeSum,
  }
}

/** Curated library of NCERT Lewis structures. Keyed by the plain formula used in the lookup. */
export const LEWIS_STRUCTURES: Readonly<Record<string, LewisStructure>> = {
  H2: {
    name: 'H2', charge: 0,
    atoms: [
      { element: 'H', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
  },
  O2: {
    name: 'O2', charge: 0,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 0, lonePairs: 2, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
  },
  N2: {
    name: 'N2', charge: 0,
    atoms: [
      { element: 'N', x: 0, y: 0, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'N', x: 1, y: 0, lonePairs: 1, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 3 }],
  },
  F2: {
    name: 'F2', charge: 0,
    atoms: [
      { element: 'F', x: 0, y: 0, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 1, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
  },
  HF: {
    name: 'HF', charge: 0,
    atoms: [
      { element: 'H', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'F', x: 1, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
  },
  H2O: {
    name: 'H2O', charge: 0,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'H', x: -0.7, y: -0.7, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 0.7, y: -0.7, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }],
  },
  NH3: {
    name: 'NH3', charge: 0,
    atoms: [
      { element: 'N', x: 0, y: 0, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'H', x: -0.9, y: -0.6, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 0.9, y: -0.6, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 0, y: -1.1, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  NF3: {
    name: 'NF3', charge: 0,
    atoms: [
      { element: 'N', x: 0, y: 0, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'F', x: -1, y: -1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 1, y: -1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 0, y: -1.6, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  CH4: {
    name: 'CH4', charge: 0,
    atoms: [
      { element: 'C', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 0, y: 1, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 1, y: -0.5, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: -1, y: -0.5, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 0, y: -1, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 },
    ],
  },
  CO2: {
    name: 'CO2', charge: 0,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'C', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: 2, y: 0, lonePairs: 2, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 }],
  },
  CO: {
    name: 'CO', charge: 0,
    atoms: [
      { element: 'C', x: 0, y: 0, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 0, lonePairs: 1, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 3 }],
  },
  HCN: {
    name: 'HCN', charge: 0,
    atoms: [
      { element: 'H', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'C', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'N', x: 2, y: 0, lonePairs: 1, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 3 }],
  },
  C2H4: {
    name: 'C2H4', charge: 0,
    atoms: [
      { element: 'C', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'C', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: -0.5, y: 0.8, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: -0.5, y: -0.8, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 1.5, y: 0.8, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 1.5, y: -0.8, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 }, { a: 1, b: 5, order: 1 },
    ],
  },
  C2H2: {
    name: 'C2H2', charge: 0,
    atoms: [
      { element: 'H', x: -1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'C', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'C', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 2, y: 0, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 3 }, { a: 2, b: 3, order: 1 }],
  },
  O3: {
    name: 'O3', charge: 0,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 0.6, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'O', x: 2, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 1 }],
  },
  NO: {
    name: 'NO', charge: 0,
    atoms: [
      { element: 'N', x: 0, y: 0, lonePairs: 1, unpairedElectrons: 1 },
      { element: 'O', x: 1, y: 0, lonePairs: 2, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
  },
  NO2: {
    name: 'NO2', charge: 0,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'N', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 1 },
      { element: 'O', x: 2, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 1 }],
  },
  'NO2⁻': {
    name: 'NO2⁻', charge: -1,
    atoms: [
      { element: 'O', x: 0, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'N', x: 1, y: 0, lonePairs: 1, unpairedElectrons: 0 },
      { element: 'O', x: 2, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 1 }],
  },
  'NO3⁻': {
    name: 'NO3⁻', charge: -1,
    atoms: [
      { element: 'N', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 1, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 0, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'O', x: 2, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  'CO3²⁻': {
    name: 'CO3²⁻', charge: -2,
    atoms: [
      { element: 'C', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 1, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 0, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'O', x: 2, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  HNO3: {
    name: 'HNO3', charge: 0,
    atoms: [
      { element: 'H', x: -2, y: 0.6, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: -1, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'N', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: 0, y: 1.2, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 2 }, { a: 2, b: 4, order: 1 }],
  },
  BF3: {
    name: 'BF3', charge: 0,
    atoms: [
      { element: 'B', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'F', x: 0, y: 1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: -0.9, y: -0.5, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 0.9, y: -0.5, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  BeH2: {
    name: 'BeH2', charge: 0,
    atoms: [
      { element: 'H', x: -1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'Be', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'H', x: 1, y: 0, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }],
  },
  PCl5: {
    name: 'PCl5', charge: 0,
    atoms: [
      { element: 'P', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'Cl', x: 0, y: 1.2, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: 1.2, y: 0.3, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: 0.7, y: -1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: -0.7, y: -1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: -1.2, y: 0.3, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [1, 2, 3, 4, 5].map((b) => ({ a: 0, b, order: 1 as const })),
  },
  SF6: {
    name: 'SF6', charge: 0,
    atoms: [
      { element: 'S', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'F', x: 0, y: 1.2, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 1.2, y: 0, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 0, y: -1.2, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: -1.2, y: 0, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: 0.8, y: 0.8, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'F', x: -0.8, y: -0.8, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [1, 2, 3, 4, 5, 6].map((b) => ({ a: 0, b, order: 1 as const })),
  },
  H2SO4: {
    name: 'H2SO4', charge: 0,
    atoms: [
      { element: 'H', x: -2, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: -1, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'S', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'O', x: 0, y: 1.2, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 0, y: -1.2, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'O', x: 1, y: 0, lonePairs: 2, unpairedElectrons: 0 },
      { element: 'H', x: 2, y: 0, lonePairs: 0, unpairedElectrons: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 2 },
      { a: 2, b: 4, order: 2 }, { a: 2, b: 5, order: 1 }, { a: 5, b: 6, order: 1 },
    ],
  },
}

/**
 * Looks up a curated Lewis structure by its key (the plain formula, e.g. 'H2O', or the
 * formula with its charge, e.g. 'NO2⁻' or 'CO3²⁻').
 *
 * @throws {RangeError} If the key is not in LEWIS_STRUCTURES
 */
export function lewisStructure(key: string): LewisStructure {
  const structure = LEWIS_STRUCTURES[key]
  if (!structure) throw new RangeError(`No curated Lewis structure for ${key}`)
  return structure
}

/**
 * Bond order between two atoms of a structure (0 if they are not bonded). Atoms are given by
 * their index in `structure.atoms`.
 */
export function bondOrderBetween(structure: LewisStructure, i: number, j: number): number {
  const bond = structure.bonds.find((b) => (b.a === i && b.b === j) || (b.a === j && b.b === i))
  return bond ? bond.order : 0
}
