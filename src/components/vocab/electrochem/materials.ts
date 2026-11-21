/** Electrode materials and solution tints, each mapped to a token in tokens.css. */

export const ELECTRODE_MATERIALS = [
  'zn', 'cu', 'ag', 'pb', 'pbo2', 'pt', 'fe', 'mg', 'ni', 'cd', 'graphite', 'metal',
] as const

export type ElectrodeMaterial = (typeof ELECTRODE_MATERIALS)[number]

export const METAL_FILL: Readonly<Record<ElectrodeMaterial, string>> = {
  zn: 'var(--metal-zn)',
  cu: 'var(--metal-cu)',
  ag: 'var(--metal-ag)',
  pb: 'var(--metal-pb)',
  pbo2: 'var(--metal-pbo2)',
  pt: 'var(--metal-pt)',
  fe: 'var(--metal-fe)',
  mg: 'var(--metal-mg)',
  ni: 'var(--metal-ni)',
  cd: 'var(--metal-cd)',
  graphite: 'var(--metal-graphite)',
  metal: 'var(--metal-generic)',
}

/** Solution tints. `clear` draws no colour, so the liquid reads as water. */
export type SolutionTint = 'clear' | 'blue' | 'pink' | 'violet' | 'amber'

export const SOLUTION_FILL: Readonly<Record<SolutionTint, string | null>> = {
  clear: 'var(--sol-clear)',
  blue: 'var(--sol-cu)',
  pink: 'var(--sol-pink)',
  violet: 'var(--sol-mno4)',
  amber: 'var(--ox)',
}
