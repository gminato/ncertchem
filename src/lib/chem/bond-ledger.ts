/**
 * Bond-enthalpy ledger for gas-phase reactions (NCERT Class 11 Unit 5, Section 5.5(c), equation 5.17).
 * Each molecule is a small structure (atoms and the bonds between them), so the energy of breaking
 * and forming bonds can be counted one bond at a time. The bond energies are mean bond enthalpies
 * from Table 5.3, read with meanBondEnthalpy.
 *
 * The estimate is approximate. It is compared with the Table 5.2 value, which uses standard
 * enthalpies of formation, to show how far the estimate is from the measured standard value.
 */

import { meanBondEnthalpy, type BondCount } from './bond-enthalpy-estimate'
import { reactionEnthalpyFromFormation, type ReactionSpec } from './hess'

export type BondOrder = 1 | 2 | 3

/** A bond between atoms `a` and `b` (indices into the molecule's atoms), of the given order. */
export interface LedgerBond {
  a: number
  b: number
  order: BondOrder
}

/** A molecule with its atoms in order, and every bond between them. */
export interface LedgerMolecule {
  /** Plain-text formula, used as the key, e.g. 'CH4'. */
  id: string
  /** Species label used in NCERT Table 5.2, e.g. 'CH4(g)'. */
  tableSpecies: string
  atoms: readonly string[]
  bonds: readonly LedgerBond[]
}

/** One side of a reaction: a molecule and its coefficient. */
export interface LedgerTerm {
  molecule: string
  coefficient: number
}

export interface LedgerReaction {
  id: string
  /** Display form with Unicode subscripts, e.g. 'CH₄ + 2O₂ → CO₂ + 2H₂O'. */
  label: string
  reactants: readonly LedgerTerm[]
  products: readonly LedgerTerm[]
}

/** Molecules used by the ledger. Each bond is listed once, so the bond count is the sum of the list. */
export const LEDGER_MOLECULES: Readonly<Record<string, LedgerMolecule>> = {
  H2: { id: 'H2', tableSpecies: 'H2(g)', atoms: ['H', 'H'], bonds: [{ a: 0, b: 1, order: 1 }] },
  Cl2: { id: 'Cl2', tableSpecies: 'Cl2(g)', atoms: ['Cl', 'Cl'], bonds: [{ a: 0, b: 1, order: 1 }] },
  HCl: { id: 'HCl', tableSpecies: 'HCl(g)', atoms: ['H', 'Cl'], bonds: [{ a: 0, b: 1, order: 1 }] },
  O2: { id: 'O2', tableSpecies: 'O2(g)', atoms: ['O', 'O'], bonds: [{ a: 0, b: 1, order: 2 }] },
  N2: { id: 'N2', tableSpecies: 'N2(g)', atoms: ['N', 'N'], bonds: [{ a: 0, b: 1, order: 3 }] },
  CH4: {
    id: 'CH4',
    tableSpecies: 'CH4(g)',
    atoms: ['C', 'H', 'H', 'H', 'H'],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
    ],
  },
  C2H4: {
    id: 'C2H4',
    tableSpecies: 'C2H4(g)',
    atoms: ['C', 'C', 'H', 'H', 'H', 'H'],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
    ],
  },
  C2H6: {
    id: 'C2H6',
    tableSpecies: 'C2H6(g)',
    atoms: ['C', 'C', 'H', 'H', 'H', 'H', 'H', 'H'],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
      { a: 1, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
    ],
  },
  CO2: {
    id: 'CO2',
    tableSpecies: 'CO2(g)',
    atoms: ['C', 'O', 'O'],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
  },
  H2O: {
    id: 'H2O',
    tableSpecies: 'H2O(g)',
    atoms: ['O', 'H', 'H'],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
    ],
  },
  NH3: {
    id: 'NH3',
    tableSpecies: 'NH3(g)',
    atoms: ['N', 'H', 'H', 'H'],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
    ],
  },
}

/** Gas-phase reactions the ledger offers. Each one has a Table 5.2 comparison. */
export const LEDGER_REACTIONS: readonly LedgerReaction[] = [
  {
    id: 'ch4-o2',
    label: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    reactants: [
      { molecule: 'CH4', coefficient: 1 },
      { molecule: 'O2', coefficient: 2 },
    ],
    products: [
      { molecule: 'CO2', coefficient: 1 },
      { molecule: 'H2O', coefficient: 2 },
    ],
  },
  {
    id: 'h2-cl2',
    label: 'H₂ + Cl₂ → 2HCl',
    reactants: [
      { molecule: 'H2', coefficient: 1 },
      { molecule: 'Cl2', coefficient: 1 },
    ],
    products: [{ molecule: 'HCl', coefficient: 2 }],
  },
  {
    id: 'c2h4-h2',
    label: 'C₂H₄ + H₂ → C₂H₆',
    reactants: [
      { molecule: 'C2H4', coefficient: 1 },
      { molecule: 'H2', coefficient: 1 },
    ],
    products: [{ molecule: 'C2H6', coefficient: 1 }],
  },
  {
    id: 'n2-h2',
    label: 'N₂ + 3H₂ → 2NH₃',
    reactants: [
      { molecule: 'N2', coefficient: 1 },
      { molecule: 'H2', coefficient: 3 },
    ],
    products: [{ molecule: 'NH3', coefficient: 2 }],
  },
]

/** Looks up a molecule in LEDGER_MOLECULES. @throws {RangeError} If it is not listed. */
export function ledgerMolecule(id: string): LedgerMolecule {
  if (!Object.prototype.hasOwnProperty.call(LEDGER_MOLECULES, id)) {
    throw new RangeError(`no ledger structure for ${id}`)
  }
  return LEDGER_MOLECULES[id]
}

/** Mean bond enthalpy of one bond of a molecule, kJ mol⁻¹, from Table 5.3. */
export function bondEnergy(mol: LedgerMolecule, bond: LedgerBond): number {
  return meanBondEnthalpy(mol.atoms[bond.a], mol.atoms[bond.b], bond.order)
}

/** Sum of the mean bond enthalpies of every bond in one molecule, kJ mol⁻¹. */
export function moleculeBondTotal(mol: LedgerMolecule): number {
  return mol.bonds.reduce((sum, bond) => sum + bondEnergy(mol, bond), 0)
}

/** One bond event in the ledger: a bond breaking in a reactant, or forming in a product. */
export interface LedgerEvent {
  phase: 'break' | 'form'
  /** Molecule the bond belongs to. */
  molecule: string
  /** Which copy of that molecule, counted from 0 within its side of the reaction. */
  copy: number
  /** Index of the bond in the molecule's bond list. */
  bondIndex: number
  /** Mean bond enthalpy of the bond, kJ mol⁻¹. */
  energyKJ: number
}

/**
 * The ordered bond events of a reaction: every reactant bond breaks first (energy in), then every
 * product bond forms (energy out). Coefficients repeat the molecule, so 2O₂ gives two copies.
 */
export function ledgerEvents(reaction: LedgerReaction): LedgerEvent[] {
  const events: LedgerEvent[] = []
  const expand = (terms: readonly LedgerTerm[], phase: 'break' | 'form') => {
    for (const term of terms) {
      if (!Number.isInteger(term.coefficient) || term.coefficient <= 0) {
        throw new RangeError(`coefficient of ${term.molecule} must be a positive integer`)
      }
      const mol = ledgerMolecule(term.molecule)
      for (let copy = 0; copy < term.coefficient; copy++) {
        mol.bonds.forEach((bond, bondIndex) => {
          events.push({ phase, molecule: mol.id, copy, bondIndex, energyKJ: bondEnergy(mol, bond) })
        })
      }
    }
  }
  expand(reaction.reactants, 'break')
  expand(reaction.products, 'form')
  return events
}

/** Totals after the first `count` events of a ledger, kJ mol⁻¹. */
export interface LedgerTotals {
  brokenKJ: number
  formedKJ: number
  /** Energy in minus energy out so far: the running estimate of ΔrH. */
  netKJ: number
  brokenCount: number
  formedCount: number
}

/** The running totals after the first `count` events. */
export function ledgerTotalsAt(events: readonly LedgerEvent[], count: number): LedgerTotals {
  const n = Math.max(0, Math.min(events.length, Math.floor(count)))
  let brokenKJ = 0
  let formedKJ = 0
  let brokenCount = 0
  let formedCount = 0
  for (let i = 0; i < n; i++) {
    if (events[i].phase === 'break') {
      brokenKJ += events[i].energyKJ
      brokenCount++
    } else {
      formedKJ += events[i].energyKJ
      formedCount++
    }
  }
  return { brokenKJ, formedKJ, netKJ: brokenKJ - formedKJ, brokenCount, formedCount }
}

/** The estimate of ΔrH from bond enthalpies (equation 5.17), kJ mol⁻¹, and the two sums. */
export interface LedgerEstimate {
  brokenKJ: number
  formedKJ: number
  deltaHKJ: number
}

/** Estimate of ΔrH for a reaction: Σ bonds broken minus Σ bonds formed. */
export function ledgerEstimate(reaction: LedgerReaction): LedgerEstimate {
  const events = ledgerEvents(reaction)
  const totals = ledgerTotalsAt(events, events.length)
  return { brokenKJ: totals.brokenKJ, formedKJ: totals.formedKJ, deltaHKJ: totals.netKJ }
}

/** The reaction written with its Table 5.2 species, for the formation-enthalpy comparison. */
export function ledgerSpec(reaction: LedgerReaction): ReactionSpec {
  const toTerms = (terms: readonly LedgerTerm[]) =>
    terms.map((t) => ({ species: ledgerMolecule(t.molecule).tableSpecies, coefficient: t.coefficient }))
  return { label: reaction.label, reactants: toTerms(reaction.reactants), products: toTerms(reaction.products) }
}

/**
 * Standard reaction enthalpy from Table 5.2, Σ ΔfH(products) − Σ ΔfH(reactants), kJ mol⁻¹. The
 * reaction is gas phase, so the species are the gaseous ones in Table 5.2.
 */
export function formationReactionEnthalpy(reaction: LedgerReaction): number {
  return reactionEnthalpyFromFormation(ledgerSpec(reaction))
}

/** Bond count per type in a molecule, for display and tests. */
export function bondCounts(mol: LedgerMolecule): BondCount[] {
  const counts = new Map<string, BondCount>()
  for (const bond of mol.bonds) {
    const a = mol.atoms[bond.a]
    const b = mol.atoms[bond.b]
    const key = `${[a, b].sort().join('-')}/${bond.order}`
    const entry = counts.get(key) ?? { a, b, order: bond.order, count: 0 }
    entry.count++
    counts.set(key, entry)
  }
  return [...counts.values()]
}
