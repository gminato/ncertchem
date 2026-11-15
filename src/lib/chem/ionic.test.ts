import { describe, expect, it } from 'vitest'
import {
  NACL_BORN_HABER,
  NACL_STANDARD_FORMATION_KJ,
  bornHaberSum,
  ionisationPlusElectronGain,
  latticeCompensates,
  solveLatticeEnthalpy,
} from './ionic'

describe('NaCl Born–Haber cycle', () => {
  it('has five steps in cycle order, each with a source label', () => {
    expect(NACL_BORN_HABER).toHaveLength(5)
    for (const step of NACL_BORN_HABER) {
      expect(step.source.length).toBeGreaterThan(0)
    }
  })

  it('uses the NCERT-printed ionisation, electron gain and lattice values', () => {
    const [, , ionisation, gain, lattice] = NACL_BORN_HABER
    expect(ionisation.enthalpyKj).toBe(495.8)
    expect(gain.enthalpyKj).toBe(-348.7)
    expect(lattice.enthalpyKj).toBe(-788)
    expect(lattice.source).toContain('NCERT')
  })

  it('closes on the standard enthalpy of formation of NaCl(s)', () => {
    expect(bornHaberSum(NACL_BORN_HABER)).toBeCloseTo(NACL_STANDARD_FORMATION_KJ, 1)
    expect(NACL_STANDARD_FORMATION_KJ).toBe(-411.2)
  })

  it('solves the lattice step back from the other four steps', () => {
    const others = NACL_BORN_HABER.slice(0, 4)
    expect(solveLatticeEnthalpy(others, NACL_STANDARD_FORMATION_KJ)).toBeCloseTo(-788, 1)
  })
})

describe('NCERT ionic energetics (Section 4.2)', () => {
  it('gives the 147.1 kJ mol⁻¹ sum NCERT prints for ionisation plus electron gain', () => {
    expect(ionisationPlusElectronGain()).toBeCloseTo(147.1, 6)
  })

  it('says the lattice enthalpy compensates for the ion-forming sum', () => {
    expect(latticeCompensates(ionisationPlusElectronGain(), 788)).toBe(true)
    expect(latticeCompensates(400, 300)).toBe(false)
  })

  it('rejects a non-positive lattice magnitude', () => {
    expect(() => latticeCompensates(147.1, 0)).toThrow(RangeError)
    expect(() => latticeCompensates(147.1, -788)).toThrow(RangeError)
  })
})
