import { describe, expect, it } from 'vitest'
import {
  DANIELL_E_CELL,
  DANIELL_STEPS,
  DANIELL_STEP_COUNT,
  clampDaniellStep,
  getDaniellStepState,
  illustrativeDeflection,
} from './daniell-steps'

describe('Daniell opposing-voltage steps', () => {
  it('defines five ordered steps', () => {
    expect(DANIELL_STEP_COUNT).toBe(5)
    expect(DANIELL_STEPS.map((s) => s.id)).toEqual([
      'direct-transfer',
      'voltmeter-reading',
      'opposing-below',
      'balanced',
      'opposing-above',
    ])
  })

  it('takes the Daniell cell potential from the standard potentials table (Cu2+/Cu 0.34 V minus Zn2+/Zn -0.76 V)', () => {
    expect(DANIELL_E_CELL).toBe(1.1)
    expect(getDaniellStepState(1).voltmeterValue).toBe(1.1)
  })

  it('clamps out-of-range and non-finite indices', () => {
    expect(clampDaniellStep(-2)).toBe(0)
    expect(clampDaniellStep(2.7)).toBe(2)
    expect(clampDaniellStep(99)).toBe(4)
    expect(clampDaniellStep(Number.NaN)).toBe(0)
  })

  it('keeps electrons moving galvanically below 1.1 V with a smaller deflection than the voltmeter-only case', () => {
    const below = getDaniellStepState(2)
    expect(below.electronsVisible).toBe(true)
    expect(below.electronDirection).toBe('forward')
    expect(below.galvanometerValue).toBeGreaterThan(0)
    expect(below.galvanometerValue).toBeLessThan(1)
  })

  it('stops all current and reaction at exactly 1.1 V', () => {
    const balanced = getDaniellStepState(3)
    expect(balanced.eExt).toBe(DANIELL_E_CELL)
    expect(balanced.electronsVisible).toBe(false)
    expect(balanced.galvanometerValue).toBe(0)
    expect(balanced.znThinning).toBe(0)
    expect(balanced.znPlating).toBe(0)
  })

  it('reverses the flow above 1.1 V: zinc becomes the cathode and deposits, copper dissolves', () => {
    const above = getDaniellStepState(4)
    expect(above.mode).toBe('electrolytic')
    expect(above.electronDirection).toBe('reverse')
    expect(above.galvanometerValue).toBeLessThan(0)
    expect(above.znRole).toBe('cathode')
    expect(above.cuRole).toBe('anode')
    expect(above.znPlating).toBeGreaterThan(0)
    expect(above.cuThinning).toBeGreaterThan(0)
  })

  it('computes the illustrative deflection from (Ecell - Eext) / Ecell, bounded to [-1, 1]', () => {
    expect(illustrativeDeflection(0)).toBe(1)
    expect(illustrativeDeflection(1.1)).toBe(0)
    expect(illustrativeDeflection(0.55)).toBe(0.5)
    expect(illustrativeDeflection(5)).toBe(-1)
  })
})
