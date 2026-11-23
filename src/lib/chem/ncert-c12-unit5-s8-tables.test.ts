import { describe, expect, it } from 'vitest'
import { NCERT_CARBONYLS, NCERT_SYNERGIC_BOND } from './ncert-c12-unit5-s8-tables'

describe('NCERT Unit 5 section 5.6 carbonyls', () => {
  it('lists the five Fig. 5.13 carbonyls with zero-valent metals', () => {
    expect(NCERT_CARBONYLS.map((c) => c.formula)).toEqual(['Ni(CO)4', 'Fe(CO)5', 'Cr(CO)6', '[Mn2(CO)10]', '[Co2(CO)8]'])
    expect(NCERT_CARBONYLS.every((c) => c.metalOxidationState === 0)).toBe(true)
  })
  it('CO counts match the formulas', () => {
    for (const c of NCERT_CARBONYLS) {
      expect(c.totalCO).toBe(Number(/CO\)(\d+)/.exec(c.formula)![1]))
      expect(c.terminalCO + c.bridgingCO).toBe(c.totalCO)
      expect(c.bridgingCO).toBeLessThanOrEqual(c.totalCO)
      expect(c.hasMetalMetalBond).toBe(c.metalCount === 2)
    }
  })
  it('only Co2(CO)8 has bridging CO', () => {
    expect(NCERT_CARBONYLS.filter((c) => c.bridgingCO > 0).map((c) => c.metal)).toEqual(['Co'])
  })
  it('sigma goes ligand to metal, pi goes metal to ligand', () => {
    expect(NCERT_SYNERGIC_BOND.sigma.direction).toBe('ligand to metal')
    expect(NCERT_SYNERGIC_BOND.pi.direction).toBe('metal to ligand')
  })
})
