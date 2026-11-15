import type { RedoxCouple } from './PotentialLadder'
import type { ONSpecies, ONTransition } from './ONLadder'
import type { HalfReactionData } from './HalfEquationCard'

export const CR2O7_TAGS = [
  { element: 'Cr', value: '+6', tone: 'ox' as const },
  { element: 'O', value: '−2', tone: 'neutral' as const },
]

export const MNO4_TAGS = [
  { element: 'Mn', value: '+7', tone: 'ox' as const },
  { element: 'O', value: '−2', tone: 'neutral' as const },
]

export const S4O6_TAGS = [
  { element: 'S', value: '+2.5', tone: 'ox' as const },
  { element: 'O', value: '−2', tone: 'neutral' as const },
]

export const NA_CL_TRANSFER_BASE = {
  donor: { symbol: 'Na', initialCharge: '', finalCharge: '+' },
  acceptor: { symbol: 'Cl', initialCharge: '', finalCharge: '−' },
}

export const CL2_DISPROPORTIONATION_SPECIES: ONSpecies[] = [
  { id: 'cl2', label: 'Cl₂', on: 0, column: 0 },
  { id: 'clo', label: 'ClO⁻', on: 1, column: 1 },
  { id: 'cl_minus', label: 'Cl⁻', on: -1, column: 1 },
]

export const CL2_DISPROPORTIONATION_TRANSITIONS: ONTransition[] = [
  {
    id: 'ox',
    fromId: 'cl2',
    toId: 'clo',
    label: 'Oxidation (+1)',
    tone: 'ox',
  },
  {
    id: 'red',
    fromId: 'cl2',
    toId: 'cl_minus',
    label: 'Reduction (−1)',
    tone: 'red',
  },
]

export const TABLE_7_1_COUPLES: RedoxCouple[] = [
  { id: 'f2', label: 'F₂ + 2e⁻ ⇌ 2F⁻', e0: 2.87 },
  { id: 'mno4', label: 'MnO₄⁻ + 8H⁺ + 5e⁻ ⇌ Mn²⁺ + 4H₂O', e0: 1.51 },
  { id: 'cl2', label: 'Cl₂ + 2e⁻ ⇌ 2Cl⁻', e0: 1.36 },
  { id: 'cr2o7', label: 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ ⇌ 2Cr³⁺ + 7H₂O', e0: 1.33 },
  { id: 'ag', label: 'Ag⁺ + e⁻ ⇌ Ag', e0: 0.80 },
  { id: 'cu', label: 'Cu²⁺ + 2e⁻ ⇌ Cu', e0: 0.34 },
  { id: 'she', label: '2H⁺ + 2e⁻ ⇌ H₂ (SHE)', e0: 0.00 },
  { id: 'fe2', label: 'Fe²⁺ + 2e⁻ ⇌ Fe', e0: -0.44 },
  { id: 'zn', label: 'Zn²⁺ + 2e⁻ ⇌ Zn', e0: -0.76 },
  { id: 'al', label: 'Al³⁺ + 3e⁻ ⇌ Al', e0: -1.66 },
  { id: 'mg', label: 'Mg²⁺ + 2e⁻ ⇌ Mg', e0: -2.36 },
  { id: 'na', label: 'Na⁺ + e⁻ ⇌ Na', e0: -2.71 },
  { id: 'li', label: 'Li⁺ + e⁻ ⇌ Li', e0: -3.05 },
]

export const ZN_CU_HIGHLIGHT: [string, string] = ['cu', 'zn']

export const FE_CR2O7_MID_BALANCE: {
  oxHalf: HalfReactionData
  redHalf: HalfReactionData
  overallEquation?: string
} = {
  oxHalf: {
    title: 'Oxidation half (reducing agent)',
    equation: 'Fe²⁺(aq) → Fe³⁺(aq) + e⁻',
    electrons: 1,
    multiplier: 1,
    tally: [
      { item: 'Fe', left: 1, right: 1 },
      { item: 'Charge', left: 2, right: 2 },
    ],
  },
  redHalf: {
    title: 'Reduction half: charge balance step',
    equation: 'Cr₂O₇²⁻(aq) + 14H⁺(aq) → 2Cr³⁺(aq) + 7H₂O(l)',
    electrons: 0,
    multiplier: 1,
    tally: [
      { item: 'Cr', left: 2, right: 2 },
      { item: 'O', left: 7, right: 7 },
      { item: 'H', left: 14, right: 14 },
      { item: 'Charge', left: 12, right: 6 },
    ],
  },
  overallEquation:
    'Need: add 6 e⁻ to reduction half, then multiply oxidation half by 6',
}
