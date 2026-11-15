import { oxidationNumbers, rationalToNumber } from '@/lib/chem/oxidation-number'
import { formatOn } from './ladder-model'

export type RedoxTypeKind = 'ladder' | 'structure'

export interface RedoxTypeStepData {
  stepIndex: number
  title: string
  category: string
  /** Balanced reaction, read by the redox libraries to build the ladder. */
  equation: string
  /** The same reaction as an mhchem source string for KaTeX (without \ce{}). */
  equationMhchem: string
  /** One-line caption under the figure. */
  footnote: string
  kind: RedoxTypeKind
}

/** Formats the oxidation numbers of every element in a formula, e.g. "Ca +2, C +4, O −2". */
function statesText(formula: string, labels: string[]): string {
  const states = oxidationNumbers(formula, 0)
  return labels
    .map((el) => `${el} ${formatOn(rationalToNumber(states[el]))}`)
    .join(', ')
}

const CALCITE_NOTE = `Not redox: CaCO₃ → CaO + CO₂ keeps every state (${statesText('CaCO3', ['Ca', 'C', 'O'])}).`

export const REDOX_TYPE_STEPS: readonly RedoxTypeStepData[] = [
  // Step 0: Combination
  {
    stepIndex: 0,
    title: 'Combination reaction',
    category: 'combination',
    equation: '2Mg(s) + O2(g) -> 2MgO(s)',
    equationMhchem: '2Mg(s) + O2(g) -> 2MgO(s)',
    footnote: 'Mg is the reductant (it is oxidised). O₂ is the oxidant (it is reduced).',
    kind: 'ladder',
  },

  // Step 1: Decomposition
  {
    stepIndex: 1,
    title: 'Decomposition reaction',
    category: 'decomposition',
    equation: '2KClO3(s) -> 2KCl(s) + 3O2(g)',
    equationMhchem: '2KClO3(s) -> 2KCl(s) + 3O2(g)',
    footnote: CALCITE_NOTE,
    kind: 'ladder',
  },

  // Step 2: Metal displacement
  {
    stepIndex: 2,
    title: 'Metal displacement reaction',
    category: 'metal-displacement',
    equation: 'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)',
    equationMhchem: 'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)',
    footnote: 'Zn is the reductant (it is oxidised). Cu²⁺ is the oxidant (it is reduced).',
    kind: 'ladder',
  },

  // Step 3: Non-metal displacement
  {
    stepIndex: 3,
    title: 'Non-metal displacement reaction',
    category: 'non-metal-displacement',
    equation: 'Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)',
    equationMhchem: 'Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)',
    footnote: 'Layer test: CCl₄ takes up the liberated Br₂ as an orange layer; I₂ gives a violet one.',
    kind: 'ladder',
  },

  // Step 4: Disproportionation
  {
    stepIndex: 4,
    title: 'Disproportionation reaction',
    category: 'disproportionation',
    equation: 'Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)',
    equationMhchem: 'Cl2(g) + 2OH^-(aq) -> ClO^-(aq) + Cl^-(aq) + H2O(l)',
    footnote: 'One start, two arrows. ClO₄⁻ (Cl +7) and F₂ (no positive state) cannot disproportionate.',
    kind: 'ladder',
  },

  // Step 5: Fractional oxidation number paradox
  {
    stepIndex: 5,
    title: 'The paradox of fractional oxidation numbers',
    category: 'fractional-paradox',
    equation: '[O3S-S-S-SO3]^2-',
    equationMhchem: 'S4O6^2-',
    footnote: '',
    kind: 'structure',
  },
] as const

/** Returns the step data for a given step index. */
export function getRedoxTypeStep(step: number): RedoxTypeStepData {
  const index = Math.min(REDOX_TYPE_STEPS.length - 1, Math.max(0, Math.round(step)))
  return REDOX_TYPE_STEPS[index]
}
