import { describe, expect, it } from 'vitest'
import {
  CARBONYL_EXAMPLES,
  CARBONYL_GRIGNARD_STEPS,
  CARBONYL_GRIGNARD_STEP_COUNT,
  carbonylExampleSummary,
} from './carbonyl-grignard-steps'

describe('carbonyl-reduction-and-grignard Scrolly metadata', () => {
  it('defines 4 steps matching the MDX narrative', () => {
    expect(CARBONYL_GRIGNARD_STEP_COUNT).toBe(4)
    expect(CARBONYL_GRIGNARD_STEPS).toHaveLength(4)
    expect(CARBONYL_GRIGNARD_STEPS.map((s) => s.id)).toEqual([
      'aldehydes-ketones',
      'carboxylic-acids',
      'grignard-adduct',
      'grignard-hydrolysis',
    ])
  })

  it('produces valid IUPAC names and formulas for example species', () => {
    expect(carbonylExampleSummary(CARBONYL_EXAMPLES.ethanal)).toBe('Ethanal (C₂H₄O)')
    expect(carbonylExampleSummary(CARBONYL_EXAMPLES.ethanol)).toBe('Ethanol (C₂H₆O)')
    expect(carbonylExampleSummary(CARBONYL_EXAMPLES.propanone)).toBe('Propan-2-one (C₃H₆O)')
    expect(carbonylExampleSummary(CARBONYL_EXAMPLES.propan2ol)).toBe('Propan-2-ol (C₃H₈O)')
    expect(carbonylExampleSummary(CARBONYL_EXAMPLES.tertButanol)).toBe('2-Methylpropan-2-ol (C₄H₁₀O)')
  })
})
