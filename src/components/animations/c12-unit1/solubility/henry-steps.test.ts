import { describe, expect, it } from 'vitest'
import { HENRY_STEPS, clampHenryStep } from './henry-steps'

describe('HenryLawPiston step model', () => {
  it('defines exactly 5 sequential steps covering solid equilibrium through applications', () => {
    expect(HENRY_STEPS).toHaveLength(5)
    HENRY_STEPS.forEach((step, idx) => {
      expect(step.index).toBe(idx)
      expect(step.title.length).toBeGreaterThan(5)
      expect(step.ariaLabel.length).toBeGreaterThan(20)
    })
  })

  it('compresses the piston downward and triples dissolved mole fraction from step 1 to step 2', () => {
    const lowP = HENRY_STEPS[1]
    const highP = HENRY_STEPS[2]
    expect(highP.pistonY).toBeGreaterThan(lowP.pistonY)
    expect(highP.pressureBar / lowP.pressureBar).toBeCloseTo(3, 5)
    expect(highP.moleFraction1e5 / lowP.moleFraction1e5).toBeCloseTo(3, 2)
    expect(highP.dissolvedCount).toBeGreaterThan(lowP.dissolvedCount)
  })

  it('clamps out-of-range and non-finite step values safely', () => {
    expect(clampHenryStep(-3)).toBe(0)
    expect(clampHenryStep(0)).toBe(0)
    expect(clampHenryStep(2.4)).toBe(2)
    expect(clampHenryStep(99)).toBe(4)
    expect(clampHenryStep(Number.NaN)).toBe(0)
  })
})
