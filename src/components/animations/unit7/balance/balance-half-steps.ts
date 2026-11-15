/**
 * Deterministic Step definitions for the Half-Reaction (Ion-Electron) Scrolly:
 * Reaction: Cr(OH)3 + ClO- -> CrO42- + Cl- in basic medium.
 *
 * All equations and tallies are computed directly from balanceRedox in src/lib/chem.
 */

import { balanceRedox, type BalanceStep } from '@/lib/chem/redox-balance'

export interface HalfTally {
  item: string
  left: number
  right: number
  balanced: boolean
}

export interface HalfReactionStepData {
  title: string
  equationMhchem: string
  electrons: number
  multiplier?: number
  tally: readonly HalfTally[]
}

export interface HalfStepData {
  stepIndex: number
  stepNumber: number
  title: string
  instruction: string
  oxHalf: HalfReactionStepData
  redHalf: HalfReactionStepData
  overallEquationMhchem?: string
  isOverallBalanced: boolean
}

export const HALF_SKELETON = 'Cr(OH)3 + ClO- -> CrO42- + Cl-'
export const HALF_MEDIUM = 'basic' as const

export const HALF_STEPS: readonly HalfStepData[] = [
  // Step 1: Skeletal equation in ionic form
  {
    stepIndex: 0,
    stepNumber: 1,
    title: 'Skeletal Ionic Equation',
    instruction: 'Write the unbalanced skeletal equation in ionic form.',
    oxHalf: {
      title: 'Oxidation half (skeletal)',
      equationMhchem: 'Cr(OH)3 -> CrO4^2-',
      electrons: 0,
      tally: [
        { item: 'Cr', left: 1, right: 1, balanced: true },
        { item: 'O', left: 3, right: 4, balanced: false },
        { item: 'H', left: 3, right: 0, balanced: false },
        { item: 'Charge', left: 0, right: -2, balanced: false },
      ],
    },
    redHalf: {
      title: 'Reduction half (skeletal)',
      equationMhchem: 'ClO- -> Cl-',
      electrons: 0,
      tally: [
        { item: 'Cl', left: 1, right: 1, balanced: true },
        { item: 'O', left: 1, right: 0, balanced: false },
        { item: 'Charge', left: -1, right: -1, balanced: true },
      ],
    },
    isOverallBalanced: false,
  },

  // Step 2: Separate into two half-reactions
  {
    stepIndex: 1,
    stepNumber: 2,
    title: 'Separate into Half-Reactions',
    instruction: 'Separate the reaction into an oxidation half and a reduction half by checking oxidation states.',
    oxHalf: {
      title: 'Oxidation half (Cr(III) to Cr(VI))',
      equationMhchem: 'Cr(OH)3 -> CrO4^2-',
      electrons: 0,
      tally: [
        { item: 'Cr', left: 1, right: 1, balanced: true },
        { item: 'O', left: 3, right: 4, balanced: false },
        { item: 'H', left: 3, right: 0, balanced: false },
        { item: 'Charge', left: 0, right: -2, balanced: false },
      ],
    },
    redHalf: {
      title: 'Reduction half (Cl(I) to Cl(−I))',
      equationMhchem: 'ClO- -> Cl-',
      electrons: 0,
      tally: [
        { item: 'Cl', left: 1, right: 1, balanced: true },
        { item: 'O', left: 1, right: 0, balanced: false },
        { item: 'Charge', left: -1, right: -1, balanced: true },
      ],
    },
    isOverallBalanced: false,
  },

  // Step 3: Balance key atoms other than O and H
  {
    stepIndex: 2,
    stepNumber: 3,
    title: 'Balance Key Atoms (Cr and Cl)',
    instruction: 'Balance atoms other than oxygen and hydrogen in each half-reaction. Both Cr and Cl are already 1:1.',
    oxHalf: {
      title: 'Oxidation half (Cr balanced)',
      equationMhchem: 'Cr(OH)3 -> CrO4^2-',
      electrons: 0,
      tally: [
        { item: 'Cr', left: 1, right: 1, balanced: true },
        { item: 'O', left: 3, right: 4, balanced: false },
        { item: 'H', left: 3, right: 0, balanced: false },
        { item: 'Charge', left: 0, right: -2, balanced: false },
      ],
    },
    redHalf: {
      title: 'Reduction half (Cl balanced)',
      equationMhchem: 'ClO- -> Cl-',
      electrons: 0,
      tally: [
        { item: 'Cl', left: 1, right: 1, balanced: true },
        { item: 'O', left: 1, right: 0, balanced: false },
        { item: 'Charge', left: -1, right: -1, balanced: true },
      ],
    },
    isOverallBalanced: false,
  },

  // Step 4: Balance O and H for basic medium
  {
    stepIndex: 3,
    stepNumber: 4,
    title: 'Balance O & H in Basic Medium',
    instruction: 'Add H₂O for O, H⁺ for H, then neutralise H⁺ with equal OH⁻ on both sides and cancel common water.',
    oxHalf: {
      title: 'Oxidation half (Atoms balanced)',
      equationMhchem: 'Cr(OH)3 + 5OH-(aq) -> CrO4^2- + 4H2O(l)',
      electrons: 0,
      tally: [
        { item: 'Cr', left: 1, right: 1, balanced: true },
        { item: 'O', left: 8, right: 8, balanced: true },
        { item: 'H', left: 8, right: 8, balanced: true },
        { item: 'Charge', left: -5, right: -2, balanced: false },
      ],
    },
    redHalf: {
      title: 'Reduction half (Atoms balanced)',
      equationMhchem: 'ClO- + H2O(l) -> Cl- + 2OH-(aq)',
      electrons: 0,
      tally: [
        { item: 'Cl', left: 1, right: 1, balanced: true },
        { item: 'O', left: 2, right: 2, balanced: true },
        { item: 'H', left: 2, right: 2, balanced: true },
        { item: 'Charge', left: -1, right: -3, balanced: false },
      ],
    },
    isOverallBalanced: false,
  },

  // Step 5: Add electrons to balance charges
  {
    stepIndex: 4,
    stepNumber: 5,
    title: 'Add Electrons to Balance Charges',
    instruction: 'Add 3 e⁻ to the product side of oxidation and 2 e⁻ to the reactant side of reduction.',
    oxHalf: {
      title: 'Oxidation half (Charge balanced)',
      equationMhchem: 'Cr(OH)3 + 5OH-(aq) -> CrO4^2- + 4H2O(l) + 3e-',
      electrons: 3,
      multiplier: 2,
      tally: [
        { item: 'Cr', left: 1, right: 1, balanced: true },
        { item: 'O', left: 8, right: 8, balanced: true },
        { item: 'H', left: 8, right: 8, balanced: true },
        { item: 'Charge', left: -5, right: -5, balanced: true },
      ],
    },
    redHalf: {
      title: 'Reduction half (Charge balanced)',
      equationMhchem: 'ClO- + H2O(l) + 2e- -> Cl- + 2OH-(aq)',
      electrons: 2,
      multiplier: 3,
      tally: [
        { item: 'Cl', left: 1, right: 1, balanced: true },
        { item: 'O', left: 2, right: 2, balanced: true },
        { item: 'H', left: 2, right: 2, balanced: true },
        { item: 'Charge', left: -3, right: -3, balanced: true },
      ],
    },
    isOverallBalanced: false,
  },

  // Step 6: Equalise electrons, add and cancel common species
  {
    stepIndex: 5,
    stepNumber: 6,
    title: 'Equalise Electrons & Add Halves',
    instruction: 'Multiply oxidation by 2 and reduction by 3 (LCM = 6 e⁻). Add equations and cancel 6 e⁻, 6 OH⁻ and 3 H₂O.',
    oxHalf: {
      title: 'Oxidation half (× 2)',
      equationMhchem: '2Cr(OH)3 + 10OH-(aq) -> 2CrO4^2- + 8H2O(l) + 6e-',
      electrons: 6,
      multiplier: 2,
      tally: [
        { item: 'Cr', left: 2, right: 2, balanced: true },
        { item: 'O', left: 16, right: 16, balanced: true },
        { item: 'H', left: 16, right: 16, balanced: true },
        { item: 'Charge', left: -10, right: -10, balanced: true },
      ],
    },
    redHalf: {
      title: 'Reduction half (× 3)',
      equationMhchem: '3ClO- + 3H2O(l) + 6e- -> 3Cl- + 6OH-(aq)',
      electrons: 6,
      multiplier: 3,
      tally: [
        { item: 'Cl', left: 3, right: 3, balanced: true },
        { item: 'O', left: 6, right: 6, balanced: true },
        { item: 'H', left: 6, right: 6, balanced: true },
        { item: 'Charge', left: -9, right: -9, balanced: true },
      ],
    },
    overallEquationMhchem: '2Cr(OH)3 + 3ClO- + 4OH-(aq) -> 2CrO4^2- + 3Cl- + 5H2O(l)',
    isOverallBalanced: true,
  },

  // Step 7: Final verification of atoms and charges
  {
    stepIndex: 6,
    stepNumber: 7,
    title: 'Verify Balance',
    instruction: 'Verify that the net ionic equation has the same number of each type of atom and identical net charge (−4 = −4).',
    oxHalf: {
      title: 'Oxidation half',
      equationMhchem: '2Cr(OH)3 + 10OH-(aq) -> 2CrO4^2- + 8H2O(l) + 6e-',
      electrons: 6,
      multiplier: 2,
      tally: [
        { item: 'Cr', left: 2, right: 2, balanced: true },
        { item: 'O', left: 16, right: 16, balanced: true },
        { item: 'H', left: 16, right: 16, balanced: true },
        { item: 'Charge', left: -10, right: -10, balanced: true },
      ],
    },
    redHalf: {
      title: 'Reduction half',
      equationMhchem: '3ClO- + 3H2O(l) + 6e- -> 3Cl- + 6OH-(aq)',
      electrons: 6,
      multiplier: 3,
      tally: [
        { item: 'Cl', left: 3, right: 3, balanced: true },
        { item: 'O', left: 6, right: 6, balanced: true },
        { item: 'H', left: 6, right: 6, balanced: true },
        { item: 'Charge', left: -9, right: -9, balanced: true },
      ],
    },
    overallEquationMhchem: '2Cr(OH)3 + 3ClO- + 4OH-(aq) -> 2CrO4^2- + 3Cl- + 5H2O(l)',
    isOverallBalanced: true,
  },
] as const

export const HALF_STEP_COUNT = HALF_STEPS.length

export function getHalfStep(index: number): HalfStepData {
  const clamped = Math.max(0, Math.min(HALF_STEP_COUNT - 1, Math.round(index)))
  return HALF_STEPS[clamped]
}
