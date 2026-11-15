/**
 * Enthalpy of combustion and calorific value (NCERT Class 11 Unit 5, Section 5.5(a)), the
 * Born–Haber cycle for NaCl (Section 5.5(d)), and enthalpy of solution and of dilution (Sections
 * 5.5(e) and 5.5(f)). Every NCERT value comes from ncert-unit5-tables.ts, so the numbers match the
 * Unit 5 printed values, not Unit 4's.
 *
 * Units: enthalpies in kJ mol⁻¹, except calorific value, which is kJ g⁻¹.
 */

import { molarMass } from './formula'
import { reactionEnthalpyFromFormation, type ReactionSpec } from './hess'
import { NCERT_UNIT5_NACL_BORN_HABER, NCERT_UNIT5_NACL_FORMATION_KJ, NCERT_UNIT5_WORKED_VALUES } from './ncert-unit5-tables'

/**
 * Look up one value that NCERT prints in running text or a Problem, by its quantity label.
 *
 * @throws {RangeError} If the quantity is not in NCERT_UNIT5_WORKED_VALUES
 */
export function printedValue(quantity: string): number {
  const row = NCERT_UNIT5_WORKED_VALUES.find((r) => r.quantity === quantity)
  if (!row) throw new RangeError(`no printed NCERT Unit 5 value named "${quantity}"`)
  return row.value
}

/** Combustion of butane, C₄H₁₀(g) + 13/2 O₂(g) → 4CO₂(g) + 5H₂O(l), written with liquid water. */
export const BUTANE_COMBUSTION: ReactionSpec = {
  label: 'C4H10(g) + 13/2 O2(g) → 4CO2(g) + 5H2O(l)',
  reactants: [
    { species: 'n-C4H10(g)', coefficient: 1 },
    { species: 'O2(g)', coefficient: 6.5 },
  ],
  products: [
    { species: 'CO2(g)', coefficient: 4 },
    { species: 'H2O(l)', coefficient: 5 },
  ],
}

/**
 * The same combustion with water as vapour. NCERT's printed figure for butane (2658 kJ mol⁻¹)
 * matches this version, not the liquid-water one.
 */
export const BUTANE_COMBUSTION_VAPOUR: ReactionSpec = {
  label: 'C4H10(g) + 13/2 O2(g) → 4CO2(g) + 5H2O(g)',
  reactants: BUTANE_COMBUSTION.reactants,
  products: [
    { species: 'CO2(g)', coefficient: 4 },
    { species: 'H2O(g)', coefficient: 5 },
  ],
}

/**
 * Standard enthalpy of combustion of a compound from Table 5.2, kJ mol⁻¹, for the equation with the
 * given species (one mole of the fuel burnt).
 */
export function combustionEnthalpyKJ(equation: ReactionSpec): number {
  return reactionEnthalpyFromFormation(equation)
}

/**
 * Calorific value: the heat released per gram of fuel, kJ g⁻¹. It is the magnitude of the molar
 * enthalpy of combustion divided by the molar mass.
 *
 * @param deltaCKJPerMol Enthalpy of combustion, kJ mol⁻¹ (negative for an exothermic fuel).
 * @param fuelFormula Formula of the fuel, for its molar mass, e.g. 'C4H10'.
 * @throws {RangeError} If the value is not negative or the fuel is not a known formula
 */
export function calorificValueKJPerG(deltaCKJPerMol: number, fuelFormula: string): number {
  if (!Number.isFinite(deltaCKJPerMol) || deltaCKJPerMol >= 0) {
    throw new RangeError(`a combustion enthalpy must be negative (received ${deltaCKJPerMol})`)
  }
  return -deltaCKJPerMol / molarMass(fuelFormula)
}

/**
 * Standard enthalpy levels of the NaCl Born–Haber cycle, kJ mol⁻¹, with the elements Na(s) + ½Cl₂(g)
 * at zero. Entry k is the cumulative sum of the first k steps of NCERT_UNIT5_NACL_BORN_HABER, so the
 * last entry is the enthalpy of formation of NaCl(s).
 */
export function bornHaberLevels(): number[] {
  const levels = [0]
  for (const step of NCERT_UNIT5_NACL_BORN_HABER) {
    levels.push(levels[levels.length - 1] + step.enthalpyKJ)
  }
  return levels
}

/**
 * Lattice formation enthalpy, Na⁺(g) + Cl⁻(g) → NaCl(s), from the Born–Haber cycle: the formation
 * enthalpy minus the other four steps. It is negative (exothermic), and its magnitude is the lattice
 * enthalpy NCERT prints as +788 kJ mol⁻¹ for NaCl(s) → Na⁺(g) + Cl⁻(g).
 */
export function latticeFormationFromCycle(): number {
  const others = NCERT_UNIT5_NACL_BORN_HABER.filter((s) => !s.label.startsWith('Lattice'))
  const otherSum = others.reduce((sum, s) => sum + s.enthalpyKJ, 0)
  return NCERT_UNIT5_NACL_FORMATION_KJ - otherSum
}

/**
 * Lattice enthalpy of NaCl(s) in the sense NCERT defines it (separating the solid into gaseous ions),
 * kJ mol⁻¹: positive, the opposite sign to the formation step.
 */
export function latticeEnthalpyNaCl(): number {
  return -latticeFormationFromCycle()
}

/**
 * Enthalpy of solution, ΔsolH = ΔlatticeH + ΔhydH (Section 5.5(e)). The lattice term is the
 * endothermic separation of the solid, so it is positive; the hydration term is negative.
 */
export function enthalpyOfSolution(latticeKJ: number, hydrationKJ: number): number {
  if (!Number.isFinite(latticeKJ) || !Number.isFinite(hydrationKJ)) {
    throw new RangeError('lattice and hydration enthalpies must be finite')
  }
  return latticeKJ + hydrationKJ
}

/** Hydration enthalpy of the NaCl ions, Na⁺(g) and Cl⁻(g) into water, kJ mol⁻¹ (NCERT, literature value). */
export function naClHydrationEnthalpy(): number {
  return printedValue('printed ΔhydH(NaCl)')
}

/**
 * Enthalpy of dilution (Section 5.5(f)): the change when more solvent is added to a solution, found by
 * subtracting two enthalpies of solution of the same solute. Here the solution is HCl with 25 mol of
 * water (or 40 mol), so dilution from 25 to 40 is ΔH(HCl·40 aq) − ΔH(HCl·25 aq).
 */
export function enthalpyOfDilution(enthalpyToLessWaterKJ: number, enthalpyToMoreWaterKJ: number): number {
  return enthalpyToMoreWaterKJ - enthalpyToLessWaterKJ
}

/** The NCERT values for HCl(g) dissolved in water, in the order of water amounts 10, 25, 40 and ∞. */
export function hclDissolutionEnthalpies(): { water: number; kJ: number }[] {
  return [
    { water: 10, kJ: printedValue('printed ΔH, HCl(g) + 10 aq.') },
    { water: 25, kJ: printedValue('printed ΔH, HCl(g) + 25 aq.') },
    { water: 40, kJ: printedValue('printed ΔH, HCl(g) + 40 aq.') },
    { water: Infinity, kJ: printedValue('printed ΔH, HCl(g) + ∞ aq.') },
  ]
}
