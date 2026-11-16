/**
 * The Steps of the radical-chain Scrolly (Section 9.2.3): the free-radical chlorination of methane,
 * then the boiling-point comparison of the three pentanes. Each Step has a title and two caption lines
 * for the drawing; the drawing itself is in RadicalChain.tsx.
 */

export const RADICAL_STEP_COUNT = 5

export type RadicalStepKind = 'initiation' | 'propagation' | 'chain' | 'termination' | 'shape'

export const RADICAL_STEP_KINDS: readonly RadicalStepKind[] = ['initiation', 'propagation', 'chain', 'termination', 'shape']

export interface RadicalStep {
  kind: RadicalStepKind
  title: string
  caption: readonly [string, string]
}

const STEPS: readonly RadicalStep[] = [
  {
    kind: 'initiation',
    title: 'Initiation: light breaks Cl–Cl',
    caption: ['Each chlorine atom takes one electron: two chlorine radicals.', 'Only one electron moves, so each arrow has a single barb.'],
  },
  {
    kind: 'propagation',
    title: 'Propagation (a): Cl• takes a hydrogen',
    caption: ['Cl• + CH₄ → •CH₃ + HCl', 'The methyl radical is handed on, not used up.'],
  },
  {
    kind: 'chain',
    title: 'Propagation (b) closes the loop',
    caption: ['One Cl• goes in and one Cl• comes out.', 'Each turn of the loop makes one molecule of product.'],
  },
  {
    kind: 'termination',
    title: 'Termination: two radicals pair up',
    caption: ['Three pairings stop the chain.', 'Two methyl radicals give ethane, the by-product.'],
  },
  {
    kind: 'shape',
    title: 'Shape sets the boiling point',
    caption: ['Same formula C₅H₁₂, three shapes.', 'The more compact the molecule, the lower its boiling point.'],
  },
]

/** The Step for an index, clamped to the range of the Scrolly. */
export function radicalStep(step: number): RadicalStep {
  const index = Math.min(RADICAL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  return STEPS[index]
}

/** The three termination pairings: the two radicals and the product they give. */
export const TERMINATIONS: readonly { left: readonly [string, string]; product: string; highlight: boolean }[] = [
  { left: ['Cl•', 'Cl•'], product: 'Cl–Cl', highlight: false },
  { left: ['•CH₃', 'Cl•'], product: 'CH₃–Cl', highlight: false },
  { left: ['•CH₃', '•CH₃'], product: 'C₂H₆', highlight: true },
]
