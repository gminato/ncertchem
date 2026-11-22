import { describe, expect, it } from 'vitest'
import {
  COUNTER_VALUES,
  DENTICITY_STEP_COUNT,
  denticityStepInfo,
  donorCountFor,
} from './denticity-steps'

describe('denticity-steps', () => {
  it('has 5 steps matching the MDX Scrolly', () => {
    expect(DENTICITY_STEP_COUNT).toBe(5)
    expect(denticityStepInfo(0).visual).toBe('unidentate')
    expect(denticityStepInfo(1).visual).toBe('didentate')
    expect(denticityStepInfo(2).visual).toBe('polydentate')
    expect(denticityStepInfo(3).visual).toBe('hexadentate')
    expect(denticityStepInfo(4).visual).toBe('ambidentate')
  })

  it('clamps out-of-range step indices', () => {
    expect(denticityStepInfo(-2).visual).toBe('unidentate')
    expect(denticityStepInfo(99).visual).toBe('ambidentate')
  })

  it('matches NCERT Section 5.2 donor atom counts (1, 2, 4, 6)', () => {
    expect(COUNTER_VALUES).toEqual([1, 2, 4, 6])
    expect(donorCountFor('Cl')).toBe(1)
    expect(donorCountFor('en')).toBe(2)
    expect(donorCountFor('N(CH2CH2NH2)3')).toBe(4)
    expect(donorCountFor('EDTA')).toBe(6)
    expect(donorCountFor('NO2')).toBe(1)
    expect(donorCountFor('SCN')).toBe(1)
  })
})
