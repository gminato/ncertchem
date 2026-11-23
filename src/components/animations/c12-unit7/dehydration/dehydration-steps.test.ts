import { describe, expect, it } from 'vitest'
import {
  DEHYDRATION_COMPARISON,
  DEHYDRATION_STEPS,
  E1_PROFILE_LEVELS,
} from './dehydration-steps'

describe('ethanol dehydration Scrolly steps', () => {
  it('defines 4 sequential steps with Step 2 as the slow RDS', () => {
    expect(DEHYDRATION_STEPS).toHaveLength(4)
    expect(DEHYDRATION_STEPS[1].title).toContain('RDS')
    expect(DEHYDRATION_STEPS[1].kineticTag).toContain('rate-determining')
  })

  it('orders NCERT 1°, 2°, 3° dehydration conditions with dropping temperature and barrier', () => {
    expect(DEHYDRATION_COMPARISON.map((c) => c.temperatureK)).toEqual([443, 440, 358])
    expect(DEHYDRATION_COMPARISON.map((c) => c.reagentText)).toEqual([
      'conc. H₂SO₄',
      '85% H₃PO₄',
      '20% H₃PO₄',
    ])
    expect(DEHYDRATION_COMPARISON[2].barrierFraction).toBeLessThan(
      DEHYDRATION_COMPARISON[1].barrierFraction
    )
    expect(DEHYDRATION_COMPARISON[1].barrierFraction).toBeLessThan(
      DEHYDRATION_COMPARISON[0].barrierFraction
    )
  })

  it('places the highest peak at TS2 (index 3) in the E1 energy profile', () => {
    const maxVal = Math.max(...E1_PROFILE_LEVELS)
    expect(E1_PROFILE_LEVELS[3]).toBe(maxVal)
  })
})
