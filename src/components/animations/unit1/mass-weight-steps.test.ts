import { describe, expect, it } from 'vitest'
import {
  MASS_KG,
  MASS_WEIGHT_STEPS,
  WEIGHT_EARTH_N,
  WEIGHT_EARTH_TEXT,
  WEIGHT_MOON_N,
  WEIGHT_MOON_TEXT,
  snapshotForStep,
} from './mass-weight-steps'

describe('MassWeightScrolly steps', () => {
  it('computes weights as m × g with the mass held at 60 kg', () => {
    expect(MASS_KG).toBe(60)
    expect(WEIGHT_EARTH_N).toBeCloseTo(588, 9)
    expect(WEIGHT_MOON_N).toBeCloseTo(97.2, 9)
  })

  it('displays weights to three significant figures', () => {
    expect(WEIGHT_EARTH_TEXT).toBe('588')
    expect(WEIGHT_MOON_TEXT).toBe('97.2')
  })

  it('shows exactly one view per Step', () => {
    for (const step of MASS_WEIGHT_STEPS) {
      const { balance, moon, compare } = step.snapshot
      expect(balance + moon + compare).toBe(1)
    }
  })

  it('clamps out-of-range steps', () => {
    expect(snapshotForStep(-1).balance).toBe(1)
    expect(snapshotForStep(7).compare).toBe(1)
  })
})
