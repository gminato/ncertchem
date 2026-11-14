import { describe, it, expect } from 'vitest'
import {
  BOHR_STEP_COUNT,
  EMISSION_ANGLE,
  clampStep,
  emissionDeltaEvLabel,
  emissionSeriesName,
  emissionWavelengthNm,
  interpolateByLevel,
  snapshotForStep,
  stepDescription,
} from './bohr-steps'
import { transitionWavelengthNm, transitionEnergy } from '@/lib/chem/bohr'

describe('snapshotForStep', () => {
  it('has four Steps', () => {
    expect(BOHR_STEP_COUNT).toBe(4)
  })

  it('puts the electron on n = 1 at ground state, n = 3 when excited, n = 2 after the drop', () => {
    expect(snapshotForStep(0).level).toBe(1)
    expect(snapshotForStep(1).level).toBe(3)
    expect(snapshotForStep(2).level).toBe(2)
    expect(snapshotForStep(3).level).toBe(2)
  })

  it('shows the spectral line only on Step 3, and the photon only on Steps 2 and 3', () => {
    expect(snapshotForStep(0).line).toBe(0)
    expect(snapshotForStep(2).line).toBe(0)
    expect(snapshotForStep(3).line).toBe(1)
    expect(snapshotForStep(2).photonAlpha).toBe(1)
    expect(snapshotForStep(3).photonAlpha).toBe(0)
    expect(snapshotForStep(0).photonAlpha).toBe(0)
    expect(snapshotForStep(1).photonAlpha).toBe(0)
  })

  it('places the drop at the emission angle and the photon at the strip on Step 3', () => {
    expect(snapshotForStep(2).angle).toBe(EMISSION_ANGLE)
    expect(snapshotForStep(3).angle).toBe(EMISSION_ANGLE)
    expect(snapshotForStep(3).photon).toBe(1)
  })

  it('clamps out-of-range steps', () => {
    expect(clampStep(-3)).toBe(0)
    expect(clampStep(9)).toBe(3)
    expect(clampStep(Number.NaN)).toBe(0)
    expect(snapshotForStep(7)).toEqual(snapshotForStep(3))
  })
})

describe('interpolateByLevel', () => {
  const f = (n: number) => n * n

  it('returns the value at integer levels', () => {
    expect(interpolateByLevel(1, f)).toBe(1)
    expect(interpolateByLevel(2, f)).toBe(4)
    expect(interpolateByLevel(3, f)).toBe(9)
  })

  it('interpolates linearly between orbits', () => {
    expect(interpolateByLevel(2.5, f)).toBeCloseTo((4 + 9) / 2, 10)
    expect(interpolateByLevel(1.25, f)).toBeCloseTo(1 + 0.25 * 3, 10)
  })

  it('clamps to the orbits shown', () => {
    expect(interpolateByLevel(0, f)).toBe(1)
    expect(interpolateByLevel(5, f)).toBe(9)
  })
})

describe('numbers shown on the animation (from src/lib/chem)', () => {
  it('formats the 3 to 2 energy gap to two decimals', () => {
    const expected = (Math.abs(transitionEnergy(3, 2)) / 1.602e-19).toFixed(2)
    expect(emissionDeltaEvLabel()).toBe(expected)
    expect(emissionDeltaEvLabel()).toBe('1.89')
  })

  it('rounds the 3 to 2 wavelength to 656 nm', () => {
    expect(emissionWavelengthNm()).toBe(Math.round(transitionWavelengthNm(3, 2)))
    expect(emissionWavelengthNm()).toBe(656)
  })

  it('names the series of the transition', () => {
    expect(emissionSeriesName()).toBe('Balmer')
  })

  it('describes each Step, with the numbers the animation shows', () => {
    expect(stepDescription(0)).toContain('n = 1')
    expect(stepDescription(1)).toContain('n = 3')
    expect(stepDescription(2)).toContain('656 nm')
    expect(stepDescription(2)).toContain('1.89 eV')
    expect(stepDescription(3)).toContain('656 nm')
  })
})
