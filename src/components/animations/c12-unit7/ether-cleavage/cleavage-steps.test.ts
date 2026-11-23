import { describe, expect, it } from 'vitest'
import {
  CLEAVAGE_HX_ORDER,
  CLEAVAGE_STEP_COUNT,
  CLEAVAGE_STEPS,
  getCleavageStep,
} from './cleavage-steps'

describe('ether-cleavage-pathways Scrolly steps', () => {
  it('defines five sequential steps matching the MDX scrolly', () => {
    expect(CLEAVAGE_STEP_COUNT).toBe(5)
    expect(CLEAVAGE_STEPS).toHaveLength(5)
    expect(CLEAVAGE_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('tracks the NCERT HX order and covers SN2, excess HI, SN1, and anisole aryl lock', () => {
    expect(CLEAVAGE_HX_ORDER).toBe('HI > HBr > HCl')
    expect(CLEAVAGE_STEPS[0].mechanismTag).toBe('Protonation')
    expect(CLEAVAGE_STEPS[1].mechanismTag).toBe('SN2')
    expect(CLEAVAGE_STEPS[2].mechanismTag).toBe('Excess HI (SN2)')
    expect(CLEAVAGE_STEPS[3].mechanismTag).toBe('SN1')
    expect(CLEAVAGE_STEPS[4].mechanismTag).toBe('Aryl Lock')
  })

  it('clamps out-of-range step indices safely', () => {
    expect(getCleavageStep(-2).index).toBe(0)
    expect(getCleavageStep(99).index).toBe(4)
    expect(getCleavageStep(2.8).index).toBe(2)
  })
})
