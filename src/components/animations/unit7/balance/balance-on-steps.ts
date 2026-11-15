/**
 * Deterministic Step definitions for the Oxidation Number Method Scrolly:
 * Reaction: MnO4- + C2O42- -> Mn2+ + CO2 in acidic medium.
 *
 * All equations, coefficients, oxidation numbers and charge tallies
 * are computed directly with src/lib/chem.
 */

import {
  balanceByOxidationNumber,
  type BalanceStep,
} from '@/lib/chem/redox-balance'
import { oxidationNumbers, rationalToNumber } from '@/lib/chem/oxidation-number'

export interface SpeciesDisplay {
  id: string
  coefficient: number
  formula: string
  charge?: number
  state?: string
  oxStates?: Record<string, number>
}

export interface ONStepData {
  stepIndex: number
  stepNumber: number
  title: string
  instruction: string
  equationMhchem: string
  reactants: SpeciesDisplay[]
  products: SpeciesDisplay[]
  // Step 2 & 3: ON changes
  onChanges: {
    oxidised: {
      element: string
      from: number
      to: number
      perAtomChange: number
      perUnitChange: number
      multiplier: number
      totalChange: number
      species: string
      role: 'reductant'
    }
    reduced: {
      element: string
      from: number
      to: number
      perAtomChange: number
      perUnitChange: number
      multiplier: number
      totalChange: number
      species: string
      role: 'oxidant'
    }
    lcm: number
  }
  // Step 4: Charge balance
  chargeBalance: {
    leftCharge: number
    rightCharge: number
    diff: number
    hAdded: number
    side: 'left' | 'right'
    balanced: boolean
  }
  // Step 5: Atom verification
  atomTally: {
    item: string
    left: number
    right: number
    balanced: boolean
  }[]
  isFullyBalanced: boolean
}

export const ON_SKELETON = 'MnO4- + C2O42- -> Mn2+ + CO2'
export const ON_MEDIUM = 'acidic' as const

const libResult = balanceByOxidationNumber(ON_SKELETON, ON_MEDIUM)

function getOxStates(formula: string, charge = 0): Record<string, number> {
  const rats = oxidationNumbers(formula, charge)
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(rats)) {
    out[k] = rationalToNumber(v)
  }
  return out
}

const OX_STATES_MNO4 = getOxStates('MnO4', -1) // Mn: +7, O: -2
const OX_STATES_C2O4 = getOxStates('C2O4', -2) // C: +3, O: -2
const OX_STATES_MN = { Mn: 2 }
const OX_STATES_CO2 = getOxStates('CO2', 0) // C: +4, O: -2
const OX_STATES_H2O = getOxStates('H2O', 0) // H: +1, O: -2

export const ON_STEPS: readonly ONStepData[] = [
  // Step 1 (Index 0)
  {
    stepIndex: 0,
    stepNumber: 1,
    title: 'Skeletal Ionic Equation',
    instruction: 'Write correct chemical formulas for all reactants and products.',
    equationMhchem: libResult.steps[0].equationMhchem,
    reactants: [
      { id: 'mno4', coefficient: 1, formula: 'MnO4', charge: -1 },
      { id: 'c2o4', coefficient: 1, formula: 'C2O4', charge: -2 },
    ],
    products: [
      { id: 'mn', coefficient: 1, formula: 'Mn', charge: 2 },
      { id: 'co2', coefficient: 1, formula: 'CO2', charge: 0 },
    ],
    onChanges: {
      oxidised: {
        element: 'C',
        from: 3,
        to: 4,
        perAtomChange: 1,
        perUnitChange: 2,
        multiplier: 5,
        totalChange: 10,
        species: 'C2O4^2-',
        role: 'reductant',
      },
      reduced: {
        element: 'Mn',
        from: 7,
        to: 2,
        perAtomChange: -5,
        perUnitChange: -5,
        multiplier: 2,
        totalChange: -10,
        species: 'MnO4^-',
        role: 'oxidant',
      },
      lcm: 10,
    },
    chargeBalance: {
      leftCharge: -3,
      rightCharge: 2,
      diff: 5,
      hAdded: 0,
      side: 'left',
      balanced: false,
    },
    atomTally: [
      { item: 'Mn', left: 1, right: 1, balanced: true },
      { item: 'C', left: 2, right: 1, balanced: false },
      { item: 'O', left: 8, right: 2, balanced: false },
      { item: 'Charge', left: -3, right: 2, balanced: false },
    ],
    isFullyBalanced: false,
  },

  // Step 2 (Index 1)
  {
    stepIndex: 1,
    stepNumber: 2,
    title: 'Assign Oxidation Numbers',
    instruction: 'Identify the elements whose oxidation numbers change to find the oxidant and reductant.',
    equationMhchem: libResult.steps[1].equationMhchem,
    reactants: [
      { id: 'mno4', coefficient: 1, formula: 'MnO4', charge: -1, oxStates: OX_STATES_MNO4 },
      { id: 'c2o4', coefficient: 1, formula: 'C2O4', charge: -2, oxStates: OX_STATES_C2O4 },
    ],
    products: [
      { id: 'mn', coefficient: 1, formula: 'Mn', charge: 2, oxStates: OX_STATES_MN },
      { id: 'co2', coefficient: 1, formula: 'CO2', charge: 0, oxStates: OX_STATES_CO2 },
    ],
    onChanges: {
      oxidised: {
        element: 'C',
        from: 3,
        to: 4,
        perAtomChange: 1,
        perUnitChange: 2,
        multiplier: 5,
        totalChange: 10,
        species: 'C2O4^2-',
        role: 'reductant',
      },
      reduced: {
        element: 'Mn',
        from: 7,
        to: 2,
        perAtomChange: -5,
        perUnitChange: -5,
        multiplier: 2,
        totalChange: -10,
        species: 'MnO4^-',
        role: 'oxidant',
      },
      lcm: 10,
    },
    chargeBalance: {
      leftCharge: -3,
      rightCharge: 2,
      diff: 5,
      hAdded: 0,
      side: 'left',
      balanced: false,
    },
    atomTally: [
      { item: 'Mn', left: 1, right: 1, balanced: true },
      { item: 'C', left: 2, right: 1, balanced: false },
      { item: 'O', left: 8, right: 2, balanced: false },
      { item: 'Charge', left: -3, right: 2, balanced: false },
    ],
    isFullyBalanced: false,
  },

  // Step 3 (Index 2)
  {
    stepIndex: 2,
    stepNumber: 3,
    title: 'Equalise Oxidation Number Changes',
    instruction: 'Multiply formula units so total increase in oxidation number equals total decrease.',
    equationMhchem: '2MnO4- + 5C2O4^2- -> 2Mn^2+ + 10CO2',
    reactants: [
      { id: 'mno4', coefficient: 2, formula: 'MnO4', charge: -1, oxStates: OX_STATES_MNO4 },
      { id: 'c2o4', coefficient: 5, formula: 'C2O4', charge: -2, oxStates: OX_STATES_C2O4 },
    ],
    products: [
      { id: 'mn', coefficient: 2, formula: 'Mn', charge: 2, oxStates: OX_STATES_MN },
      { id: 'co2', coefficient: 10, formula: 'CO2', charge: 0, oxStates: OX_STATES_CO2 },
    ],
    onChanges: {
      oxidised: {
        element: 'C',
        from: 3,
        to: 4,
        perAtomChange: 1,
        perUnitChange: 2,
        multiplier: 5,
        totalChange: 10,
        species: 'C2O4^2-',
        role: 'reductant',
      },
      reduced: {
        element: 'Mn',
        from: 7,
        to: 2,
        perAtomChange: -5,
        perUnitChange: -5,
        multiplier: 2,
        totalChange: -10,
        species: 'MnO4^-',
        role: 'oxidant',
      },
      lcm: 10,
    },
    chargeBalance: {
      leftCharge: -12,
      rightCharge: 4,
      diff: 16,
      hAdded: 0,
      side: 'left',
      balanced: false,
    },
    atomTally: [
      { item: 'Mn', left: 2, right: 2, balanced: true },
      { item: 'C', left: 10, right: 10, balanced: true },
      { item: 'O', left: 28, right: 20, balanced: false },
      { item: 'Charge', left: -12, right: 4, balanced: false },
    ],
    isFullyBalanced: false,
  },

  // Step 4 (Index 3)
  {
    stepIndex: 3,
    stepNumber: 4,
    title: 'Balance Ionic Charges with H⁺',
    instruction: 'Add 16 H⁺ ions to the reactant side to equalise ionic charges in acidic medium.',
    equationMhchem: '2MnO4- + 5C2O4^2- + 16H+(aq) -> 2Mn^2+ + 10CO2',
    reactants: [
      { id: 'mno4', coefficient: 2, formula: 'MnO4', charge: -1 },
      { id: 'c2o4', coefficient: 5, formula: 'C2O4', charge: -2 },
      { id: 'h', coefficient: 16, formula: 'H', charge: 1, state: 'aq' },
    ],
    products: [
      { id: 'mn', coefficient: 2, formula: 'Mn', charge: 2 },
      { id: 'co2', coefficient: 10, formula: 'CO2', charge: 0 },
    ],
    onChanges: {
      oxidised: {
        element: 'C',
        from: 3,
        to: 4,
        perAtomChange: 1,
        perUnitChange: 2,
        multiplier: 5,
        totalChange: 10,
        species: 'C2O4^2-',
        role: 'reductant',
      },
      reduced: {
        element: 'Mn',
        from: 7,
        to: 2,
        perAtomChange: -5,
        perUnitChange: -5,
        multiplier: 2,
        totalChange: -10,
        species: 'MnO4^-',
        role: 'oxidant',
      },
      lcm: 10,
    },
    chargeBalance: {
      leftCharge: 4,
      rightCharge: 4,
      diff: 0,
      hAdded: 16,
      side: 'left',
      balanced: true,
    },
    atomTally: [
      { item: 'Mn', left: 2, right: 2, balanced: true },
      { item: 'C', left: 10, right: 10, balanced: true },
      { item: 'H', left: 16, right: 0, balanced: false },
      { item: 'O', left: 28, right: 20, balanced: false },
      { item: 'Charge', left: 4, right: 4, balanced: true },
    ],
    isFullyBalanced: false,
  },

  // Step 5 (Index 4)
  {
    stepIndex: 4,
    stepNumber: 5,
    title: 'Balance Hydrogen & Oxygen with H₂O',
    instruction: 'Add 8 H₂O to the products. Oxygen automatically balances, confirming the equation.',
    equationMhchem: '2MnO4- + 5C2O4^2- + 16H+(aq) -> 2Mn^2+ + 10CO2 + 8H2O(l)',
    reactants: [
      { id: 'mno4', coefficient: 2, formula: 'MnO4', charge: -1 },
      { id: 'c2o4', coefficient: 5, formula: 'C2O4', charge: -2 },
      { id: 'h', coefficient: 16, formula: 'H', charge: 1, state: 'aq' },
    ],
    products: [
      { id: 'mn', coefficient: 2, formula: 'Mn', charge: 2 },
      { id: 'co2', coefficient: 10, formula: 'CO2', charge: 0 },
      { id: 'h2o', coefficient: 8, formula: 'H2O', charge: 0, state: 'l' },
    ],
    onChanges: {
      oxidised: {
        element: 'C',
        from: 3,
        to: 4,
        perAtomChange: 1,
        perUnitChange: 2,
        multiplier: 5,
        totalChange: 10,
        species: 'C2O4^2-',
        role: 'reductant',
      },
      reduced: {
        element: 'Mn',
        from: 7,
        to: 2,
        perAtomChange: -5,
        perUnitChange: -5,
        multiplier: 2,
        totalChange: -10,
        species: 'MnO4^-',
        role: 'oxidant',
      },
      lcm: 10,
    },
    chargeBalance: {
      leftCharge: 4,
      rightCharge: 4,
      diff: 0,
      hAdded: 16,
      side: 'left',
      balanced: true,
    },
    atomTally: [
      { item: 'Mn', left: 2, right: 2, balanced: true },
      { item: 'C', left: 10, right: 10, balanced: true },
      { item: 'H', left: 16, right: 16, balanced: true },
      { item: 'O', left: 28, right: 28, balanced: true },
      { item: 'Charge', left: 4, right: 4, balanced: true },
    ],
    isFullyBalanced: true,
  },
] as const

export const ON_STEP_COUNT = ON_STEPS.length

export function getONStep(index: number): ONStepData {
  const clamped = Math.max(0, Math.min(ON_STEP_COUNT - 1, Math.round(index)))
  return ON_STEPS[clamped]
}
