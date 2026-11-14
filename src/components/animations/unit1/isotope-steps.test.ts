import { describe, expect, it } from 'vitest'
import {
  ABUNDANCE_DOTS,
  ISOTOPE_STEP_COUNT,
  LIGHT_DOTS,
  averagePivot,
  averageText,
  snapshotForStep,
  stepDescription,
  weightedSumText,
  weightedTerms,
} from './isotope-steps'

describe('IsotopeSeesaw steps', () => {
  it('has four Steps, and 100 dots for the abundance grid', () => {
    expect(ISOTOPE_STEP_COUNT).toBe(4)
    expect(ABUNDANCE_DOTS).toBe(100)
    expect(LIGHT_DOTS).toBe(76)
  })

  it('tips the seesaw at the midpoint on Step 0, then balances it at the average', () => {
    expect(snapshotForStep(0).pivot).toBe(0.5)
    expect(snapshotForStep(1).pivot).toBeCloseTo(averagePivot(), 12)
    expect(snapshotForStep(3).pivot).toBeCloseTo(0.2423, 3)
  })
})

describe('chlorine average numbers', () => {
  it('averages to 35.45 u', () => {
    expect(averageText()).toBe('35.45')
  })

  it('the rounded terms are 26.496 and 8.957, which sum to 35.453', () => {
    const [light, heavy] = weightedTerms()
    expect(light.term).toBe('26.496')
    expect(heavy.term).toBe('8.957')
    expect(weightedSumText()).toBe('35.453')
  })
})
