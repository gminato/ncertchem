import { describe, expect, it } from 'vitest'
import { deltaGForExponent, kLadderSteps, phaseSteps, signCaseSteps, signed } from './gibbs-steps'

describe('phase Steps (Section 5.6(b))', () => {
  const [solid, liquid, gas] = phaseSteps()

  it('the solid has no transition', () => {
    expect(solid.transitionK).toBeNull()
  })

  it('melting at 273.15 K: ΔS_sys ≈ +22.0, ΔS_surr ≈ −22.0, total zero', () => {
    expect(liquid.transitionK).toBe(273.15)
    expect(liquid.deltaSSys).toBeCloseTo(22.0, 1)
    expect(liquid.deltaSSurr).toBeCloseTo(-22.0, 1)
    expect(liquid.deltaSTotal).toBeCloseTo(0, 9)
  })

  it('boiling at 373.15 K: ΔS_sys ≈ +109.3, total zero', () => {
    expect(gas.transitionK).toBe(373.15)
    expect(gas.deltaSSys).toBeCloseTo(109.3, 1)
    expect(gas.deltaSTotal).toBeCloseTo(0, 9)
  })

  it('the gas transition has a larger ΔS than melting', () => {
    expect(gas.deltaSSys!).toBeGreaterThan(liquid.deltaSSys!)
  })
})

describe('sign-case Steps (Table 5.4)', () => {
  const cases = signCaseSteps()

  it('shows four cases with the four different sign combinations', () => {
    expect(cases.map((c) => c.kind)).toEqual(['always', 'low-T', 'high-T', 'never'])
  })

  it('the NH3 and CaCO3 numbers come from Table 5.2', () => {
    expect(cases[1].dH).toBeCloseTo(-92.22, 2)
    expect(cases[2].dH).toBeCloseTo(178.32, 2)
  })
})

describe('K ladder Steps (Section 5.7)', () => {
  it('K = 1 gives ΔG° = 0, and 10¹⁰ gives about −57.0 kJ mol⁻¹ at 298 K', () => {
    expect(deltaGForExponent(0)).toBeCloseTo(0, 9)
    expect(deltaGForExponent(10)).toBeCloseTo(-57.05, 1)
    expect(deltaGForExponent(-10)).toBeCloseTo(57.05, 1)
  })

  it('has five Steps', () => {
    expect(kLadderSteps()).toHaveLength(5)
  })
})

describe('signed', () => {
  it('uses U+2212 for negatives and no sign for zero', () => {
    expect(signed(-22.04)).toBe('−22.0')
    expect(signed(22.04)).toBe('+22.0')
    expect(signed(0)).toBe('0.0')
  })
})
