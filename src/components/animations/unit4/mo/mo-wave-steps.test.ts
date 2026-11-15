import { describe, expect, it } from 'vitest'
import { WAVE_STEP_COUNT, antibondingWave, atomicWave, bondingWave, density, waveTargetForStep } from './mo-wave-steps'

describe('wave combinations', () => {
  it('reinforces between the nuclei for the sum and cancels at the midpoint for the difference', () => {
    expect(bondingWave(0)).toBeCloseTo(2 * Math.exp(-1))
    expect(antibondingWave(0)).toBeCloseTo(0)
  })

  it('keeps the sum above either atomic wave at the midpoint and the difference signed', () => {
    expect(bondingWave(0)).toBeGreaterThan(atomicWave(0, 1))
    expect(antibondingWave(0.5)).toBeGreaterThan(0)
    expect(antibondingWave(-0.5)).toBeLessThan(0)
  })

  it('gives zero density at the node of the antibonding wave and more than an atom between the nuclei for the bonding wave', () => {
    expect(density(antibondingWave(0))).toBe(0)
    expect(density(bondingWave(0))).toBeGreaterThan(density(atomicWave(0, 1)))
  })

  it('clamps out-of-range Steps and handles NaN', () => {
    expect(waveTargetForStep(-3)).toEqual(waveTargetForStep(0))
    expect(waveTargetForStep(99)).toEqual(waveTargetForStep(WAVE_STEP_COUNT - 1))
    expect(waveTargetForStep(Number.NaN)).toEqual(waveTargetForStep(0))
  })
})
