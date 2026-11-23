import { describe, expect, it } from 'vitest'
import { NI_EN_STEP_COUNT, NI_EN_SWATCHES, clampNiEnStep, niEnStepState } from './ni-en-steps'

describe('ni-en-colour-series step logic', () => {
  it('has 4 steps matching NCERT_NI_EN_SERIES and clamps invalid indices', () => {
    expect(NI_EN_STEP_COUNT).toBe(4)
    expect(clampNiEnStep(-1)).toBe(0)
    expect(clampNiEnStep(Number.NaN)).toBe(0)
    expect(clampNiEnStep(10)).toBe(3)
  })

  it('tracks en count, 6 - 2n waters remaining, and NCERT colours across all 4 steps', () => {
    const expectedColours = ['green', 'pale blue', 'blue/purple', 'violet']
    for (let i = 0; i < 4; i++) {
      const s = niEnStepState(i)
      expect(s.enCount).toBe(i)
      expect(s.waterLeft).toBe(6 - 2 * i)
      expect(s.row.colour).toBe(expectedColours[i])
      expect(s.showDropper).toBe(i > 0)
    }
    expect(NI_EN_SWATCHES).toHaveLength(4)
    expect(niEnStepState(3).showAllSwatches).toBe(true)
  })
})
