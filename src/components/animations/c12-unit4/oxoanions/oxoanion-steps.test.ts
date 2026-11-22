import { describe, expect, it } from 'vitest'
import {
  FE2_PER_DICHROMATE,
  FE2_PER_PERMANGANATE,
  OXO_STEP_COUNT,
  eVoltOf,
  electronVisible,
  equationText,
  getOxoStepState,
  halfEquationBalances,
} from './oxoanion-steps'

describe('oxoanion Steps', () => {
  it('has five Steps with the scenes in order', () => {
    expect(OXO_STEP_COUNT).toBe(5)
    expect([0, 1, 2, 3, 4].map((s) => getOxoStepState(s).scene)).toEqual([
      'ph',
      'dichromate',
      'permanganate',
      'neutral',
      'pair',
    ])
  })

  it('counts the electrons from the printed half-equations', () => {
    expect(getOxoStepState(1).electrons).toBe(6)
    expect(getOxoStepState(2).electrons).toBe(5)
    expect(getOxoStepState(3).electrons).toBe(3)
  })

  it('reaches the end state in the electron Steps', () => {
    expect(getOxoStepState(1).done).toBe(true)
    expect(getOxoStepState(2).done).toBe(true)
    expect(getOxoStepState(4).done).toBe(false)
  })

  it('clamps out-of-range Steps', () => {
    expect(getOxoStepState(-3).scene).toBe('ph')
    expect(getOxoStepState(99).scene).toBe('pair')
  })

  it('shows printed equations and E° values from the lib', () => {
    expect(equationText('dichromate-acid-half')).toBe('Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O')
    expect(eVoltOf('permanganate-to-mn2plus-half')).toBe(1.52)
    expect(eVoltOf('permanganate-to-dioxide-half')).toBe(1.69)
  })

  it('takes the Fe²⁺ ratios from the titration equations', () => {
    expect(FE2_PER_DICHROMATE).toBe(6)
    expect(FE2_PER_PERMANGANATE).toBe(5)
  })

  it('keeps the printed half-equations balanced in shape', () => {
    expect(halfEquationBalances('dichromate-acid-half')).toBe(true)
    expect(halfEquationBalances('permanganate-to-mn2plus-half')).toBe(true)
  })

  it('shows the first n electrons only', () => {
    expect([0, 1, 2, 3, 4, 5].filter((i) => electronVisible(i, 3))).toEqual([0, 1, 2])
  })
})
