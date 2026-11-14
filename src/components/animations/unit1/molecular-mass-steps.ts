import { molarMass } from '@/lib/chem/formula'
import { sumAtomicMasses } from '@/lib/chem/atomic-mass'
import { ELEMENTS } from '@/lib/chem/elements'
import { clampStepIndex } from './useStepState'

/** Number of Steps in the MolecularMass Animation. */
export const MOLECULAR_MASS_STEP_COUNT = 5

/** One Step: the species on show, its atoms in the order they are added, and how many are added. */
export interface MassStep {
  formula: string
  /** Symbols of the atoms in the formula unit, in the order they are added to the ledger. */
  atoms: readonly string[]
  /** How many atoms of the list are added at this Step. */
  added: number
  /** Whether the total is a molecular mass or a formula mass (for an ionic solid). */
  totalName: 'molecular mass' | 'formula mass'
}

export const MASS_STEPS: readonly MassStep[] = [
  { formula: 'CH4', atoms: ['C', 'H', 'H', 'H', 'H'], added: 0, totalName: 'molecular mass' },
  { formula: 'CH4', atoms: ['C', 'H', 'H', 'H', 'H'], added: 1, totalName: 'molecular mass' },
  { formula: 'CH4', atoms: ['C', 'H', 'H', 'H', 'H'], added: 5, totalName: 'molecular mass' },
  { formula: 'H2O', atoms: ['O', 'H', 'H'], added: 3, totalName: 'molecular mass' },
  { formula: 'NaCl', atoms: ['Na', 'Cl'], added: 2, totalName: 'formula mass' },
]

/** Decimal places used when showing each element's atomic mass, as in the NCERT text. */
const DISPLAY_DECIMALS: Record<string, number> = { C: 3, H: 3, O: 2, Na: 1, Cl: 1 }

/** The target of the ledger tween: how many atoms are added, from 0 to the Step's count. */
export interface MolecularMassSnapshot {
  added: number
}

export function snapshotForStep(step: number): MolecularMassSnapshot {
  return { added: MASS_STEPS[clampStepIndex(step, MOLECULAR_MASS_STEP_COUNT)].added }
}

/** Atomic mass of an element as shown in the ledger, e.g. "12.011" for C. */
export function atomicMassText(symbol: string): string {
  const element = ELEMENTS[symbol]
  if (!element) throw new RangeError(`Unknown element symbol "${symbol}"`)
  return element.atomicMass.toFixed(DISPLAY_DECIMALS[symbol] ?? 3)
}

/** Running total after the first `n` atoms of a Step, in u, from the element table. */
export function runningTotal(step: MassStep, n: number): number {
  return sumAtomicMasses(step.atoms.slice(0, Math.max(0, Math.min(n, step.atoms.length))))
}

/** The total for the whole formula unit, from molarMass(), in u, to three decimals. */
export function totalText(step: MassStep): string {
  return molarMass(step.formula).toFixed(3)
}

/** Visually-hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  const s = MASS_STEPS[clampStepIndex(step, MOLECULAR_MASS_STEP_COUNT)]
  switch (clampStepIndex(step, MOLECULAR_MASS_STEP_COUNT)) {
    case 0:
      return 'Methane, CH₄, is one carbon atom and four hydrogen atoms. Its molecular mass is the sum of the atomic masses of all five.'
    case 1:
      return `Add the carbon first: 12.011 u.`
    case 2:
      return `Add four hydrogen atoms at 1.008 u each. The total is ${totalText(s)} u.`
    case 3:
      return `Water, H₂O: two hydrogen atoms and one oxygen atom. The molecular mass is ${totalText(s)} u.`
    default:
      return `Sodium chloride is an ionic lattice with no discrete molecules, so we quote a formula mass: ${totalText(s)} u for one NaCl unit.`
  }
}
