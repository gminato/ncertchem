import { describe, expect, it } from 'vitest'
import {
  FUNCTIONAL_GROUP_STEP_COUNT,
  clampStep,
  getFunctionalGroupStepState,
} from './functional-group-steps'

describe('FunctionalGroupStructures Scrolly steps', () => {
  it('defines exactly 5 steps and clamps out-of-bounds indices', () => {
    expect(FUNCTIONAL_GROUP_STEP_COUNT).toBe(5)
    expect(clampStep(-3)).toBe(0)
    expect(clampStep(99)).toBe(4)
    expect(clampStep(Number.NaN)).toBe(0)
  })

  it('Step 0 sets methanol baseline with sp3-sp3 overlap and 142 pm / 96 pm / 108.9°', () => {
    const s = getFunctionalGroupStepState(0)
    expect(s.scene).toBe('molecule')
    expect(s.moleculeId).toBe('methanol')
    expect(s.showOrbitalOverlap).toBe(true)
    expect(s.showLonePairs).toBe(true)
    expect(s.showTetrahedralRef).toBe(true)
    expect(s.readout.record.coBondLengthPm).toBe(142)
    expect(s.readout.record.ohBondLengthPm).toBe(96)
    expect(s.readout.record.bondAngleDeg).toBe(108.9)
  })

  it('Step 1 introduces phenol with sp2 ring carbon, 136 pm C-O and 142 pm ghost marker', () => {
    const s = getFunctionalGroupStepState(1)
    expect(s.scene).toBe('molecule')
    expect(s.moleculeId).toBe('phenol')
    expect(s.highlightRingCarbon).toBe(true)
    expect(s.showMethanolGhost).toBe(true)
    expect(s.readout.record.coBondLengthPm).toBe(136)
    expect(s.readout.ohBondDisplay).toBe('Not printed in Fig. 7.1')
    expect(s.readout.record.bondAngleDeg).toBe(109)
  })

  it('Step 2 zooms on phenol C-O conjugation and sp2 vs sp3 s-character', () => {
    const s = getFunctionalGroupStepState(2)
    expect(s.scene).toBe('phenol-zoom')
    expect(s.moleculeId).toBe('phenol')
    expect(s.showConjugation).toBe(true)
  })

  it('Step 3 switches to methoxymethane with sp3 carbons and 141 pm C-O comparison', () => {
    const s = getFunctionalGroupStepState(3)
    expect(s.scene).toBe('molecule')
    expect(s.moleculeId).toBe('methoxymethane')
    expect(s.highlightMethylCarbons).toBe(true)
    expect(s.showMethanolGhost).toBe(true)
    expect(s.showStericHalos).toBe(false)
    expect(s.readout.record.coBondLengthPm).toBe(141)
  })

  it('Step 4 adds steric repulsion halos widening C-O-C to 111.7°', () => {
    const s = getFunctionalGroupStepState(4)
    expect(s.scene).toBe('molecule')
    expect(s.moleculeId).toBe('methoxymethane')
    expect(s.showStericHalos).toBe(true)
    expect(s.readout.record.bondAngleDeg).toBe(111.7)
    expect(s.readout.deviationDisplay).toBe('+2.23°')
  })
})
