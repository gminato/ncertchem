import { NCERT_CARBONYLS, type Carbonyl } from '@/lib/chem/ncert-c12-unit5-s8-tables'

export const STRUCTURES_STEP_COUNT = 3

export type CarbonylStructuresVisual = 'single-metal' | 'mn-dimer' | 'co-bridged'

export const STRUCTURES_STEP_VISUALS: readonly CarbonylStructuresVisual[] = [
  'single-metal',
  'mn-dimer',
  'co-bridged',
]

export function structuresStepVisual(step: number): CarbonylStructuresVisual {
  const clamped = Math.min(Math.max(Math.trunc(step), 0), STRUCTURES_STEP_COUNT - 1)
  return STRUCTURES_STEP_VISUALS[clamped] ?? 'single-metal'
}

export const SINGLE_METAL_CARBONYLS: readonly Carbonyl[] = NCERT_CARBONYLS.filter((c) => c.metalCount === 1)

export const MN_CARBONYL: Carbonyl =
  NCERT_CARBONYLS.find((c) => c.formula === '[Mn2(CO)10]') ?? NCERT_CARBONYLS[3]

export const CO_CARBONYL: Carbonyl =
  NCERT_CARBONYLS.find((c) => c.formula === '[Co2(CO)8]') ?? NCERT_CARBONYLS[4]

export function bridgeCountCaption(c: Carbonyl): string {
  return `${c.bridgingCO} bridging + ${c.terminalCO} terminal = ${c.totalCO} CO groups`
}
