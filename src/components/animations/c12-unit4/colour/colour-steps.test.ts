import { describe, expect, it } from 'vitest'
import { balanceCheck } from '@/lib/chem/dblock'
import { NCERT_CATALYSIS_EQUATIONS } from '@/lib/chem/ncert-c12-unit4-tables'
import { COLOUR_STEP_COUNT, clampColourStep, colourStepState } from './colour-steps'

describe('dd-colour Scrolly steps', () => {
  it('has five Steps and clamps out-of-range indices', () => {
    expect(COLOUR_STEP_COUNT).toBe(5)
    expect(clampColourStep(-3)).toBe(0)
    expect(clampColourStep(99)).toBe(4)
    expect(clampColourStep(Number.NaN)).toBe(0)
    expect(clampColourStep(2.7)).toBe(2)
  })

  it('Step 1: Cu²⁺ sees blue and absorbs its complement, orange', () => {
    const s = colourStepState(0)
    expect(s).toMatchObject({ kind: 'absorb', key: 'cu2', seen: 'blue', absorbed: 'orange' })
  })

  it('Step 2 is a two-level ladder for one Cu²⁺ ion', () => {
    expect(colourStepState(1)).toEqual({ kind: 'ladder', ion: 'Cu²⁺' })
  })

  it('Step 3: Zn²⁺ has a full d shell; Sc³⁺ and Ti⁴⁺ have none; all three are colourless', () => {
    const s = colourStepState(2)
    expect(s.kind).toBe('colourless')
    if (s.kind !== 'colourless') return
    expect(s.ions.map((i) => [i.label, i.dCount, i.key])).toEqual([
      ['Zn²⁺(aq)', 10, 'colourless'],
      ['Sc³⁺(aq)', 0, 'colourless'],
      ['Ti⁴⁺(aq)', 0, 'colourless'],
    ])
  })

  it('Step 4 takes its equations from the catalysis table and they balance', () => {
    const s = colourStepState(3)
    expect(s.kind).toBe('loop')
    if (s.kind !== 'loop') return
    const overall = NCERT_CATALYSIS_EQUATIONS.find((e) => e.id === 'iron-iii-persulphate-overall')?.equation
    expect(s.overall).toBe(overall)
    expect(balanceCheck(s.overall).balanced).toBe(true)
    expect(balanceCheck(s.step1).balanced).toBe(true)
    expect(balanceCheck(s.step2).balanced).toBe(true)
  })

  it('Step 5 shows an interstitial TiC lattice and a Zn alloy site', () => {
    expect(colourStepState(4)).toEqual({
      kind: 'lattice',
      interstitial: 'C',
      interstitialFormula: 'TiC',
      alloySymbol: 'Zn',
    })
  })
})
