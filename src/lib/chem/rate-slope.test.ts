import { describe, expect, it } from 'vitest'
import {
  RATE_SLOPE_R0,
  chordReadout,
  clampChord,
  concA,
  concB,
  instantaneousDisappearanceA,
  stoichiometryById,
  tangentReadout,
} from './rate-slope'

const AB = stoichiometryById('A-B')
const TWO_AB = stoichiometryById('2A-B')
const THREE_A_2B = stoichiometryById('3A-2B')

describe('rate slope model', () => {
  it('gives the Prose values for the first-order example', () => {
    expect(concA(0)).toBe(RATE_SLOPE_R0)
    expect(concA(250)).toBeCloseTo(0.0607, 4)
    expect(concA(500)).toBeCloseTo(0.0368, 4)
    expect(chordReadout(AB, 0, 500).rate).toBeCloseTo(1.26e-4, 6)
    expect(chordReadout(AB, 200, 300).rate).toBeCloseTo(1.22e-4, 6)
    expect(chordReadout(AB, 240, 260).rate).toBeCloseTo(1.21e-4, 6)
    expect(concB(AB, 500)).toBeCloseTo(0.0632, 4)
  })

  it('takes the instantaneous rate as the tangent slope with the sign reversed', () => {
    const tan = tangentReadout(AB, 250)
    expect(tan.slopeA).toBeLessThan(0)
    expect(tan.rate).toBeCloseTo(-tan.slopeA, 12)
    expect(tan.rate).toBeCloseTo(instantaneousDisappearanceA(250), 12)
    expect(tan.rate).toBeCloseTo(1.21e-4, 6)
  })

  it('scales each species by its stoichiometric factor', () => {
    const chord = chordReadout(THREE_A_2B, 0, 500)
    expect(chord.rate).toBeCloseTo(chordReadout(AB, 0, 500).disappearanceA / 3, 12)
    expect(chord.appearanceB).toBeCloseTo((2 / 3) * chord.disappearanceA, 12)
    const twoAB = chordReadout(TWO_AB, 0, 500)
    expect(twoAB.rate).toBeCloseTo(twoAB.disappearanceA / 2, 12)
    expect(twoAB.appearanceB).toBeCloseTo(twoAB.rate, 12)
    expect(concB(TWO_AB, 500)).toBeCloseTo(0.5 * (RATE_SLOPE_R0 - concA(500)), 12)
  })

  it('keeps the chord ordered and at least the minimum span apart', () => {
    expect(clampChord(300, 100)).toEqual([300, 310])
    expect(clampChord(-5, 2000)).toEqual([0, 600])
    expect(clampChord(595, 596)).toEqual([590, 600])
  })
})
