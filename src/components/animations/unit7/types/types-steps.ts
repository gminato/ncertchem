import type { ONSpecies, ONTransition } from '@/components/redox/ONLadder'
import type { TagSpec } from '@/components/redox/OxidationTag'

export interface TaggedFormula {
  formula: string
  charge?: string
  tags: TagSpec[]
}

export interface RedoxTypeStepData {
  stepIndex: number
  title: string
  category: string
  equationMhchem: string
  reactionDisplay: string
  explanation: string
  ladderRange: [number, number]
  species: ONSpecies[]
  transitions: ONTransition[]
  reactantTags: TaggedFormula[]
  productTags: TaggedFormula[]
  contrastNote?: string
  isStructureStep?: boolean
}

export const REDOX_TYPE_STEPS: readonly RedoxTypeStepData[] = [
  // Step 0: Combination
  {
    stepIndex: 0,
    title: 'Combination Reaction',
    category: 'combination',
    equationMhchem: '\\ce{2Mg(s) + O2(g) -> 2MgO(s)}',
    reactionDisplay: '2Mg(s) + O₂(g) → 2MgO(s)',
    explanation: 'Two elements combine into one compound. At least one reactant must be in elemental form.',
    ladderRange: [-3, 3],
    species: [
      { id: 'mg_0', label: 'Mg⁰', on: 0, column: 0 },
      { id: 'o_0', label: 'O₂⁰', on: 0, column: 0 },
      { id: 'mg_2', label: 'Mg²⁺', on: 2, column: 1 },
      { id: 'o_minus2', label: 'O²⁻', on: -2, column: 1 },
    ],
    transitions: [
      {
        id: 'mg_ox',
        fromId: 'mg_0',
        toId: 'mg_2',
        label: 'Oxidation (Mg: 0 → +2)',
        tone: 'ox',
      },
      {
        id: 'o_red',
        fromId: 'o_0',
        toId: 'o_minus2',
        label: 'Reduction (O: 0 → −2)',
        tone: 'red',
      },
    ],
    reactantTags: [
      { formula: 'Mg', tags: [{ element: 'Mg', value: '0', tone: 'neutral' }] },
      { formula: 'O2', tags: [{ element: 'O', value: '0', tone: 'neutral' }] },
    ],
    productTags: [
      {
        formula: 'MgO',
        tags: [
          { element: 'Mg', value: '+2', tone: 'ox' },
          { element: 'O', value: '−2', tone: 'red' },
        ],
      },
    ],
    contrastNote: 'Mg is oxidised (reductant); O₂ is reduced (oxidant).',
  },

  // Step 1: Decomposition
  {
    stepIndex: 1,
    title: 'Decomposition Reaction',
    category: 'decomposition',
    equationMhchem: '\\ce{2KClO3(s) -> 2KCl(s) + 3O2(g)}',
    reactionDisplay: '2KClO₃(s) → 2KCl(s) + 3O₂(g)',
    explanation: 'A compound breaks down into components, at least one in the elemental state. (CaCO₃ is not redox).',
    ladderRange: [-2, 6],
    species: [
      { id: 'cl_5', label: 'ClO₃⁻', on: 5, column: 0 },
      { id: 'o_minus2', label: 'O in KClO₃', on: -2, column: 0 },
      { id: 'cl_minus1', label: 'Cl⁻ in KCl', on: -1, column: 1 },
      { id: 'o_0', label: 'O₂⁰', on: 0, column: 1 },
    ],
    transitions: [
      {
        id: 'cl_red',
        fromId: 'cl_5',
        toId: 'cl_minus1',
        label: 'Reduction (Cl: +5 → −1)',
        tone: 'red',
      },
      {
        id: 'o_ox',
        fromId: 'o_minus2',
        toId: 'o_0',
        label: 'Oxidation (O: −2 → 0)',
        tone: 'ox',
      },
    ],
    reactantTags: [
      {
        formula: 'KClO3',
        tags: [
          { element: 'K', value: '+1', tone: 'neutral' },
          { element: 'Cl', value: '+5', tone: 'red' },
          { element: 'O', value: '−2', tone: 'ox' },
        ],
      },
    ],
    productTags: [
      {
        formula: 'KCl',
        tags: [
          { element: 'K', value: '+1', tone: 'neutral' },
          { element: 'Cl', value: '−1', tone: 'red' },
        ],
      },
      { formula: 'O2', tags: [{ element: 'O', value: '0', tone: 'ox' }] },
    ],
    contrastNote: 'Non-redox: CaCO₃(+2,+4,−2) → CaO(+2,−2) + CO₂(+4,−2).',
  },

  // Step 2: Metal Displacement
  {
    stepIndex: 2,
    title: 'Metal Displacement Reaction',
    category: 'metal-displacement',
    equationMhchem: '\\ce{Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)}',
    reactionDisplay: 'Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)',
    explanation: 'A more electropositive metal displaces a less electropositive metal from its compound.',
    ladderRange: [-1, 3],
    species: [
      { id: 'zn_0', label: 'Zn⁰(s)', on: 0, column: 0 },
      { id: 'cu_2', label: 'Cu²⁺(aq)', on: 2, column: 0 },
      { id: 'zn_2', label: 'Zn²⁺(aq)', on: 2, column: 1 },
      { id: 'cu_0', label: 'Cu⁰(s)', on: 0, column: 1 },
    ],
    transitions: [
      {
        id: 'zn_ox',
        fromId: 'zn_0',
        toId: 'zn_2',
        label: 'Oxidation (Zn: 0 → +2)',
        tone: 'ox',
      },
      {
        id: 'cu_red',
        fromId: 'cu_2',
        toId: 'cu_0',
        label: 'Reduction (Cu: +2 → 0)',
        tone: 'red',
      },
    ],
    reactantTags: [
      { formula: 'Zn', tags: [{ element: 'Zn', value: '0', tone: 'neutral' }] },
      {
        formula: 'CuSO4',
        tags: [
          { element: 'Cu', value: '+2', tone: 'ox' },
          { element: 'S', value: '+6', tone: 'neutral' },
        ],
      },
    ],
    productTags: [
      {
        formula: 'ZnSO4',
        tags: [
          { element: 'Zn', value: '+2', tone: 'ox' },
          { element: 'S', value: '+6', tone: 'neutral' },
        ],
      },
      { formula: 'Cu', tags: [{ element: 'Cu', value: '0', tone: 'neutral' }] },
    ],
    contrastNote: 'Zn has a higher electron-releasing tendency (E° = −0.76 V vs +0.34 V).',
  },

  // Step 3: Non-metal Displacement
  {
    stepIndex: 3,
    title: 'Non-metal Displacement Reaction',
    category: 'non-metal-displacement',
    equationMhchem: '\\ce{Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)}',
    reactionDisplay: 'Cl₂(g) + 2KBr(aq) → 2KCl(aq) + Br₂(l)',
    explanation: 'A stronger non-metal oxidant displaces a weaker one (F₂ > Cl₂ > Br₂ > I₂).',
    ladderRange: [-2, 2],
    species: [
      { id: 'br_minus1', label: 'Br⁻(aq)', on: -1, column: 0 },
      { id: 'cl_0', label: 'Cl₂⁰(g)', on: 0, column: 0 },
      { id: 'br_0', label: 'Br₂⁰(l)', on: 0, column: 1 },
      { id: 'cl_minus1', label: 'Cl⁻(aq)', on: -1, column: 1 },
    ],
    transitions: [
      {
        id: 'br_ox',
        fromId: 'br_minus1',
        toId: 'br_0',
        label: 'Oxidation (Br: −1 → 0)',
        tone: 'ox',
      },
      {
        id: 'cl_red',
        fromId: 'cl_0',
        toId: 'cl_minus1',
        label: 'Reduction (Cl: 0 → −1)',
        tone: 'red',
      },
    ],
    reactantTags: [
      { formula: 'Cl2', tags: [{ element: 'Cl', value: '0', tone: 'neutral' }] },
      {
        formula: 'KBr',
        tags: [
          { element: 'K', value: '+1', tone: 'neutral' },
          { element: 'Br', value: '−1', tone: 'ox' },
        ],
      },
    ],
    productTags: [
      {
        formula: 'KCl',
        tags: [
          { element: 'K', value: '+1', tone: 'neutral' },
          { element: 'Cl', value: '−1', tone: 'red' },
        ],
      },
      { formula: 'Br2', tags: [{ element: 'Br', value: '0', tone: 'neutral' }] },
    ],
    contrastNote: 'Layer test: non-polar CCl₄ dissolves liberated Br₂ (orange) or I₂ (violet).',
  },

  // Step 4: Disproportionation
  {
    stepIndex: 4,
    title: 'Disproportionation Reaction',
    category: 'disproportionation',
    equationMhchem: '\\ce{Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)}',
    reactionDisplay: 'Cl₂(g) + 2OH⁻(aq) → ClO⁻(aq) + Cl⁻(aq) + H₂O(l)',
    explanation: 'One element in an intermediate oxidation state is simultaneously oxidised and reduced.',
    ladderRange: [-2, 2],
    species: [
      { id: 'cl2_0', label: 'Cl₂(g)', on: 0, column: 0 },
      { id: 'clo_plus1', label: 'ClO⁻(aq)', on: 1, column: 1 },
      { id: 'cl_minus1', label: 'Cl⁻(aq)', on: -1, column: 1 },
    ],
    transitions: [
      {
        id: 'cl_disprop_ox',
        fromId: 'cl2_0',
        toId: 'clo_plus1',
        label: 'Oxidation (0 → +1)',
        tone: 'ox',
      },
      {
        id: 'cl_disprop_red',
        fromId: 'cl2_0',
        toId: 'cl_minus1',
        label: 'Reduction (0 → −1)',
        tone: 'red',
      },
    ],
    reactantTags: [
      { formula: 'Cl2', tags: [{ element: 'Cl', value: '0', tone: 'neutral' }] },
      {
        formula: 'OH-',
        charge: '-',
        tags: [
          { element: 'O', value: '−2', tone: 'neutral' },
          { element: 'H', value: '+1', tone: 'neutral' },
        ],
      },
    ],
    productTags: [
      {
        formula: 'ClO-',
        charge: '-',
        tags: [
          { element: 'Cl', value: '+1', tone: 'ox' },
          { element: 'O', value: '−2', tone: 'neutral' },
        ],
      },
      {
        formula: 'Cl-',
        charge: '-',
        tags: [{ element: 'Cl', value: '−1', tone: 'red' }],
      },
    ],
    contrastNote: 'Single start bifurcates: ClO₄⁻ (+7) cannot disproportionate; F₂ has no positive state.',
  },

  // Step 5: Fractional Oxidation Number Paradox
  {
    stepIndex: 5,
    title: 'The Paradox of Fractional Oxidation Numbers',
    category: 'fractional-paradox',
    equationMhchem: '\\ce{[O3S-S-S-SO3]^2-}',
    reactionDisplay: 'Tetrathionate ion (S₄O₆²⁻): average O.N. = +2.5 (+5/2)',
    explanation: 'Electrons are indivisible. Fractional oxidation states are arithmetic averages of whole-number atom states.',
    ladderRange: [-1, 6],
    species: [
      { id: 's_term', label: 'S(terminal): +5', on: 5, column: 0 },
      { id: 's_avg', label: 'S(average): +2.5', on: 2.5, column: 1 },
      { id: 's_mid', label: 'S(central): 0', on: 0, column: 0 },
    ],
    transitions: [],
    reactantTags: [
      {
        formula: 'S4O6^2-',
        charge: '2-',
        tags: [
          { element: 'S', value: '+2.5', tone: 'ox' },
          { element: 'O', value: '−2', tone: 'neutral' },
        ],
      },
    ],
    productTags: [],
    contrastNote: 'Structure shows S(+5)−S(0)−S(0)−S(+5). The homonuclear S−S bond contributes 0.',
    isStructureStep: true,
  },
] as const

/** Returns the step data for a given step index. */
export function getRedoxTypeStep(step: number): RedoxTypeStepData {
  const index = Math.min(REDOX_TYPE_STEPS.length - 1, Math.max(0, Math.round(step)))
  return REDOX_TYPE_STEPS[index]
}
