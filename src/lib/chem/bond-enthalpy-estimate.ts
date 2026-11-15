/**
 * Estimate of a gas-phase reaction enthalpy from mean bond enthalpies, for NCERT Class 11 Unit 5,
 * Section 5.5(c) and equation 5.17: ΔrH ≈ Σ(bond enthalpies of reactants) − Σ(bond enthalpies of
 * products).
 *
 * This is an estimate. Mean bond enthalpies (Table 5.3) are averages over several compounds, and
 * NCERT says the relation "is approximate and is valid when all substances are in the gaseous state".
 * Values differ from the tabulated standard enthalpies of reaction by several kJ mol⁻¹ or more.
 * Use reactionEnthalpyFromFormation (hess.ts) when ΔfH values are available.
 */

import { NCERT_TABLE_5_3A_SINGLE_BONDS, NCERT_TABLE_5_3B_MULTIPLE_BONDS } from './ncert-unit5-tables'

/** A bond type in a molecule, with its order and how many of them there are. */
export interface BondCount {
  a: string
  b: string
  order: 1 | 2 | 3
  count: number
}

/** A molecule as a list of its bonds, for the estimate. */
export interface MoleculeBonds {
  formula: string
  bonds: readonly BondCount[]
}

/** One side of an estimated reaction: a molecule and its stoichiometric coefficient. */
export interface MoleculeTerm {
  molecule: string
  coefficient: number
}

/** The estimate and the two sums it comes from, kJ mol⁻¹. */
export interface BondEnergyEstimate {
  /** ΔrH estimate: bonds broken minus bonds formed. Positive is endothermic. */
  deltaHKJ: number
  /** Sum over the reactant molecules, with their coefficients. */
  bondsBrokenKJ: number
  /** Sum over the product molecules, with their coefficients. */
  bondsFormedKJ: number
}

function pairKey(a: string, b: string, order: number): string {
  const [first, second] = [a, b].sort()
  return `${first}-${second}/${order}`
}

const MEAN_BOND_ENTHALPY = new Map<string, number>()
for (const row of NCERT_TABLE_5_3A_SINGLE_BONDS.rows) {
  MEAN_BOND_ENTHALPY.set(pairKey(row.a, row.b, 1), row.kJ)
}
for (const row of NCERT_TABLE_5_3B_MULTIPLE_BONDS.rows) {
  MEAN_BOND_ENTHALPY.set(pairKey(row.a, row.b, row.order), row.kJ)
}

/**
 * Mean bond enthalpy of a bond between two elements, kJ mol⁻¹ at 298 K, from Table 5.3. Order is
 * the bond order (1 single, 2 double, 3 triple). The order of a and b does not matter.
 *
 * @throws {RangeError} If Table 5.3 has no value for that bond
 */
export function meanBondEnthalpy(a: string, b: string, order: 1 | 2 | 3 = 1): number {
  const value = MEAN_BOND_ENTHALPY.get(pairKey(a, b, order))
  if (value === undefined) {
    throw new RangeError(`NCERT Table 5.3 has no mean bond enthalpy for ${a}${order === 1 ? '–' : order === 2 ? '=' : '≡'}${b}`)
  }
  return value
}

/**
 * Bond list for the molecules NCERT uses in Section 5.5(c) and Table 5.3, with the H2, Cl2, HCl,
 * CH4, C2H4, H2O, O2, CO2 and NH3 examples. Each bond is counted once per molecule, so CH4 has four
 * C–H bonds.
 */
export const MOLECULE_BONDS: Readonly<Record<string, MoleculeBonds>> = {
  H2: { formula: 'H2', bonds: [{ a: 'H', b: 'H', order: 1, count: 1 }] },
  Cl2: { formula: 'Cl2', bonds: [{ a: 'Cl', b: 'Cl', order: 1, count: 1 }] },
  HCl: { formula: 'HCl', bonds: [{ a: 'H', b: 'Cl', order: 1, count: 1 }] },
  CH4: { formula: 'CH4', bonds: [{ a: 'C', b: 'H', order: 1, count: 4 }] },
  C2H4: {
    formula: 'C2H4',
    bonds: [
      { a: 'C', b: 'C', order: 2, count: 1 },
      { a: 'C', b: 'H', order: 1, count: 4 },
    ],
  },
  H2O: { formula: 'H2O', bonds: [{ a: 'O', b: 'H', order: 1, count: 2 }] },
  O2: { formula: 'O2', bonds: [{ a: 'O', b: 'O', order: 2, count: 1 }] },
  CO2: { formula: 'CO2', bonds: [{ a: 'C', b: 'O', order: 2, count: 2 }] },
  NH3: { formula: 'NH3', bonds: [{ a: 'N', b: 'H', order: 1, count: 3 }] },
}

/**
 * Sum of the mean bond enthalpies of all bonds in one molecule, kJ mol⁻¹.
 *
 * @throws {RangeError} If the molecule is not in MOLECULE_BONDS
 */
export function bondEnthalpySumOfMolecule(molecule: string): number {
  const entry = Object.prototype.hasOwnProperty.call(MOLECULE_BONDS, molecule) ? MOLECULE_BONDS[molecule] : undefined
  if (!entry) {
    throw new RangeError(`no bond list for ${molecule}; add it to MOLECULE_BONDS`)
  }
  return entry.bonds.reduce((sum, bond) => sum + bond.count * meanBondEnthalpy(bond.a, bond.b, bond.order), 0)
}

function sideSum(side: readonly MoleculeTerm[]): number {
  return side.reduce((sum, term) => {
    if (!Number.isFinite(term.coefficient) || term.coefficient <= 0) {
      throw new RangeError(`coefficient of ${term.molecule} must be positive (received ${term.coefficient})`)
    }
    return sum + term.coefficient * bondEnthalpySumOfMolecule(term.molecule)
  }, 0)
}

/**
 * Estimated gas-phase reaction enthalpy, ΔrH ≈ Σ bonds broken − Σ bonds formed (equation 5.17).
 *
 * Example: H2 + Cl2 → 2HCl. Bonds broken are 435.8 + 243 = 678.8 kJ mol⁻¹, bonds formed are
 * 2 × 431 = 862 kJ mol⁻¹, so the estimate is −183.2 kJ mol⁻¹.
 *
 * @throws {RangeError} If a molecule has no bond list or a coefficient is not positive
 */
export function estimateReactionEnthalpy(
  reactants: readonly MoleculeTerm[],
  products: readonly MoleculeTerm[],
): BondEnergyEstimate {
  const bondsBrokenKJ = sideSum(reactants)
  const bondsFormedKJ = sideSum(products)
  return { deltaHKJ: bondsBrokenKJ - bondsFormedKJ, bondsBrokenKJ, bondsFormedKJ }
}
