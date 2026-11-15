/**
 * Step data for the Classical Redox Scrolly (Unit 7, Section 7.1).
 *
 * Each equation is kept as tokens so the view can typeset every formula with KaTeX
 * and put an underline and a label under the oxidised and the reduced species.
 * The joined tokens are checked by equations.test.ts, so every equation balances.
 */

export type EquationRole = 'ox' | 'red'

export interface EquationToken {
  /** Mhchem for one species, e.g. "2CuO(s)". Operators use "+" and "->". */
  mhchem: string
  /** Set on the species that is oxidised (ox) or reduced (red). */
  role?: EquationRole
  /** Short label set under a role species, e.g. "gains oxygen". */
  label?: string
}

export interface ClassicalStepData {
  index: number
  stageNumber: string
  title: string
  /** One line for the oxidation column of the rule bar. */
  oxRule: string
  /** One line for the reduction column of the rule bar. */
  redRule: string
  /** Worked reaction as tokens; empty for the summary step. */
  equation: readonly EquationToken[]
  matrixRows?: ReadonlyArray<{
    criterion: string
    oxidation: string
    reduction: string
  }>
}

/** Joins the tokens of one step into a single mhchem reaction string. */
export function equationMhchem(tokens: readonly EquationToken[]): string {
  return tokens.map((t) => t.mhchem).join(' ')
}

const PLUS: EquationToken = { mhchem: '+' }
const ARROW: EquationToken = { mhchem: '->' }

export const CLASSICAL_STEPS: readonly ClassicalStepData[] = [
  {
    index: 0,
    stageNumber: 'Stage 1 of 4',
    title: 'Addition and removal of oxygen',
    oxRule: 'Oxidation: adding oxygen',
    redRule: 'Reduction: removing oxygen',
    equation: [
      { mhchem: '2CuO(s)', role: 'red', label: 'loses oxygen' },
      PLUS,
      { mhchem: 'C(s)', role: 'ox', label: 'gains oxygen' },
      ARROW,
      { mhchem: '2Cu(s)' },
      PLUS,
      { mhchem: 'CO2(g)' },
    ],
  },
  {
    index: 1,
    stageNumber: 'Stage 2 of 4',
    title: 'Removal and addition of hydrogen',
    oxRule: 'Oxidation: removing hydrogen',
    redRule: 'Reduction: adding hydrogen',
    equation: [
      { mhchem: 'H2S(g)', role: 'ox', label: 'loses hydrogen' },
      PLUS,
      { mhchem: 'Cl2(g)', role: 'red', label: 'gains hydrogen' },
      ARROW,
      { mhchem: '2HCl(g)' },
      PLUS,
      { mhchem: 'S(s)' },
    ],
  },
  {
    index: 2,
    stageNumber: 'Stage 3 of 4',
    title: 'Addition of an electronegative element',
    oxRule: 'Oxidation: adding an electronegative element',
    redRule: 'Reduction: removing an electronegative element',
    equation: [
      { mhchem: 'Ca(s)', role: 'ox', label: 'gains chlorine' },
      PLUS,
      { mhchem: 'Cl2(g)', role: 'red', label: 'gains calcium' },
      ARROW,
      { mhchem: 'CaCl2(s)' },
    ],
  },
  {
    index: 3,
    stageNumber: 'Stage 4 of 4',
    title: 'Removal of an electropositive element',
    oxRule: 'Oxidation: removing an electropositive element',
    redRule: 'Reduction: adding an electropositive element',
    equation: [
      { mhchem: '2KI(aq)', role: 'ox', label: 'loses potassium' },
      PLUS,
      { mhchem: 'Cl2(g)', role: 'red', label: 'gains potassium' },
      ARROW,
      { mhchem: '2KCl(aq)' },
      PLUS,
      { mhchem: 'I2(s)' },
    ],
  },
  {
    index: 4,
    stageNumber: 'Summary',
    title: 'The unified classical ledger',
    oxRule: 'Oxidation',
    redRule: 'Reduction',
    equation: [],
    matrixRows: [
      { criterion: 'Oxygen', oxidation: 'Added (+O)', reduction: 'Removed (−O)' },
      { criterion: 'Hydrogen', oxidation: 'Removed (−H)', reduction: 'Added (+H)' },
      { criterion: 'Electronegative element', oxidation: 'Added', reduction: 'Removed' },
      { criterion: 'Electropositive element', oxidation: 'Removed', reduction: 'Added' },
    ],
  },
]

export const CLASSICAL_STEP_COUNT = CLASSICAL_STEPS.length

export function classicalStep(index: number): ClassicalStepData {
  const bounded = Math.min(CLASSICAL_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return CLASSICAL_STEPS[bounded]
}
