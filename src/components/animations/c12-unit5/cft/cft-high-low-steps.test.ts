import { describe, expect, it } from 'vitest'
import {
  HIGH_LOW_STEP_COUNT,
  clampHighLowStep,
  highLowStepState,
} from './cft-high-low-steps'

describe('cft-high-low-steps', () => {
  it('clamps step indices safely', () => {
    expect(clampHighLowStep(-1)).toBe(0)
    expect(clampHighLowStep(Number.NaN)).toBe(0)
    expect(clampHighLowStep(42)).toBe(HIGH_LOW_STEP_COUNT - 1)
  })

  it('matches NCERT high-spin and low-spin d4 configurations', () => {
    const s0 = highLowStepState(0)
    expect(s0.kind).toBe('d1-to-d3')
    expect(s0.config).toEqual({ d: 3, t2g: 3, eg: 0, unpaired: 3 })

    const s2 = highLowStepState(2)
    expect(s2.kind).toBe('weak-high-spin')
    expect(s2.deltaBar).toBeLessThan(s2.pairingBar)
    expect(s2.config).toEqual({ d: 4, t2g: 3, eg: 1, unpaired: 4 })

    const s3 = highLowStepState(3)
    expect(s3.kind).toBe('strong-low-spin')
    expect(s3.deltaBar).toBeGreaterThan(s3.pairingBar)
    expect(s3.config).toEqual({ d: 4, t2g: 4, eg: 0, unpaired: 2 })
  })

  it('shows fewer unpaired electrons in strong field across d4 to d7', () => {
    const s4 = highLowStepState(4)
    expect(s4.kind).toBe('d4-to-d7-grid')
    expect(s4.grid.map((g) => g.d)).toEqual([4, 5, 6, 7])
    for (const row of s4.grid) {
      expect(row.strong.unpaired).toBeLessThan(row.weak.unpaired)
    }
    expect(s4.grid[2].strong.unpaired).toBe(0) // d6 low spin is diamagnetic
  })
})
