import { describe, expect, it } from 'vitest'
import {
  BUTANE_COMBUSTION,
  BUTANE_COMBUSTION_VAPOUR,
  bornHaberLevels,
  calorificValueKJPerG,
  combustionEnthalpyKJ,
  enthalpyOfDilution,
  enthalpyOfSolution,
  hclDissolutionEnthalpies,
  latticeEnthalpyNaCl,
  latticeFormationFromCycle,
  naClHydrationEnthalpy,
  printedValue,
} from './enthalpy-types'
import { molarMass } from './formula'
import { NCERT_UNIT5_NACL_FORMATION_KJ } from './ncert-unit5-tables'

describe('combustion and calorific value (Section 5.5(a))', () => {
  it('butane with liquid water: Table 5.2 gives −2877.0 kJ mol⁻¹', () => {
    // 4(−393.51) + 5(−285.83) − (−126.15)
    expect(combustionEnthalpyKJ(BUTANE_COMBUSTION)).toBeCloseTo(-2877.04, 2)
  })

  it('butane with water vapour: Table 5.2 gives −2657.0 kJ mol⁻¹, close to NCERT printed 2658', () => {
    expect(combustionEnthalpyKJ(BUTANE_COMBUSTION_VAPOUR)).toBeCloseTo(-2656.99, 2)
  })

  it('molar mass of butane is 58.12 g mol⁻¹', () => {
    expect(molarMass('C4H10')).toBeCloseTo(58.12, 2)
  })

  it('calorific value of butane with liquid water is 49.5 kJ g⁻¹', () => {
    expect(calorificValueKJPerG(-2877.04, 'C4H10')).toBeCloseTo(49.5, 1)
  })

  it('rejects a non-exothermic combustion value', () => {
    expect(() => calorificValueKJPerG(10, 'C4H10')).toThrow(RangeError)
  })
})

describe('atomisation (Section 5.5(b)) from Table 5.2', () => {
  it('NCERT prints ΔaH(H2) = 435.0 and ΔaH(CH4) = 1665; Table 5.2 gives CH4 atomisation 1663.4', () => {
    expect(printedValue('printed ΔaH of H2 (H2 → 2H)')).toBeCloseTo(435, 6)
    expect(printedValue('printed ΔaH of CH4 (CH4 → C + 4H)')).toBe(1665)
    // ΔfH(C, g) + 4 ΔfH(H, g) − ΔfH(CH4, g), from Table 5.2
    expect(716.68 + 4 * 217.97 - -74.81).toBeCloseTo(1663.37, 2)
  })
})

describe('Born–Haber cycle for NaCl (Section 5.5(d))', () => {
  it('the cumulative levels close on the formation enthalpy of NaCl(s), −411.2 kJ mol⁻¹', () => {
    const levels = bornHaberLevels()
    expect(levels).toHaveLength(6)
    expect(levels[0]).toBe(0)
    expect(levels[levels.length - 1]).toBeCloseTo(NCERT_UNIT5_NACL_FORMATION_KJ, 6)
  })

  it('the intermediate levels are 108.4, 229.4, 725.4 and 376.8 kJ mol⁻¹', () => {
    const levels = bornHaberLevels()
    expect(levels[1]).toBeCloseTo(108.4, 6)
    expect(levels[2]).toBeCloseTo(229.4, 6)
    expect(levels[3]).toBeCloseTo(725.4, 6)
    expect(levels[4]).toBeCloseTo(376.8, 6)
  })

  it('the lattice formation step is −788.0 kJ mol⁻¹, so the lattice enthalpy of NaCl(s) is +788.0', () => {
    expect(latticeFormationFromCycle()).toBeCloseTo(-788, 6)
    expect(latticeEnthalpyNaCl()).toBeCloseTo(788, 6)
  })
})

describe('enthalpy of solution and dilution (Sections 5.5(e) and 5.5(f))', () => {
  it('NaCl: ΔsolH = +788 − 784 = +4 kJ mol⁻¹', () => {
    expect(naClHydrationEnthalpy()).toBe(-784)
    expect(enthalpyOfSolution(latticeEnthalpyNaCl(), naClHydrationEnthalpy())).toBeCloseTo(4, 6)
  })

  it('rejects a non-finite lattice or hydration term', () => {
    expect(() => enthalpyOfSolution(Number.NaN, -784)).toThrow(RangeError)
  })

  it('dilution of HCl from 25 to 40 mol of water is −0.76 kJ mol⁻¹', () => {
    const [, c25, c40] = hclDissolutionEnthalpies()
    expect(enthalpyOfDilution(c25.kJ, c40.kJ)).toBeCloseTo(-0.76, 6)
  })

  it('HCl values approach the infinite-dilution limit in order', () => {
    const kJ = hclDissolutionEnthalpies().map((r) => r.kJ)
    expect(kJ).toEqual([-69.01, -72.03, -72.79, -74.85])
  })
})
