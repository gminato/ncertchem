import { describe, expect, it } from 'vitest'
import {
  OSMOSIS_STEPS,
  OSMOSIS_STEP_COUNT,
  clampOsmosisStep,
  getOsmosisStepState,
} from './osmosis-steps'

describe('osmosis animation steps', () => {
  it('defines exactly 5 ordered steps covering SPM, osmosis, Π = CRT, tonicity, and reverse osmosis', () => {
    expect(OSMOSIS_STEP_COUNT).toBe(5)
    expect(OSMOSIS_STEPS.map((s) => s.id)).toEqual([
      'spm-barrier',
      'forward-osmosis',
      'osmotic-equilibrium',
      'tonicity-cells',
      'reverse-osmosis',
    ])
  })

  it('clamps out-of-range and non-finite step indices safely', () => {
    expect(clampOsmosisStep(-3)).toBe(0)
    expect(clampOsmosisStep(0)).toBe(0)
    expect(clampOsmosisStep(2.9)).toBe(2)
    expect(clampOsmosisStep(99)).toBe(4)
    expect(clampOsmosisStep(Number.NaN)).toBe(0)
  })

  it('raises the solution column in forward osmosis and reverses levels under P > Π', () => {
    const step1 = getOsmosisStepState(1)
    const step2 = getOsmosisStepState(2)
    const step4 = getOsmosisStepState(4)

    // Smaller SVG y means higher column
    expect(step1.rightLiquidTop).toBeLessThan(step1.leftLiquidTop)
    expect(step1.fluxMode).toBe('forward')

    expect(step2.showPiston).toBe(true)
    expect(step2.rightLiquidTop).toBe(step2.leftLiquidTop)
    expect(step2.fluxMode).toBe('equilibrium')

    expect(step4.showPiston).toBe(true)
    expect(step4.leftLiquidTop).toBeLessThan(step4.rightLiquidTop)
    expect(step4.fluxMode).toBe('reverse')
    expect(step4.showFreshwaterOutlet).toBe(true)
  })

  it('switches to tonicity scene at step 3 with descriptive accessibility labels on every step', () => {
    expect(getOsmosisStepState(3).sceneMode).toBe('tonicity')
    for (const step of OSMOSIS_STEPS) {
      expect(step.ariaLabel.length).toBeGreaterThan(40)
      expect(step.caption.length).toBeGreaterThan(20)
    }
  })
})
