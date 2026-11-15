import { describe, expect, it } from 'vitest'
import { bondEnthalpySumOfMolecule, estimateReactionEnthalpy, meanBondEnthalpy } from './bond-enthalpy-estimate'

describe('mean bond enthalpies from Table 5.3', () => {
  it('reads single bonds in either element order', () => {
    expect(meanBondEnthalpy('C', 'H')).toBe(414)
    expect(meanBondEnthalpy('H', 'C')).toBe(414)
    expect(meanBondEnthalpy('H', 'Cl')).toBe(431)
  })

  it('reads the printed H–H value 435.8 (Table 5.3(a)), not the text value 435.0', () => {
    expect(meanBondEnthalpy('H', 'H')).toBe(435.8)
  })

  it('reads multiple bonds by order', () => {
    expect(meanBondEnthalpy('C', 'C', 2)).toBe(611)
    expect(meanBondEnthalpy('C', 'O', 2)).toBe(741)
    expect(meanBondEnthalpy('N', 'N', 3)).toBe(946)
    expect(meanBondEnthalpy('O', 'O', 2)).toBe(498)
  })

  it('rejects a bond that Table 5.3 does not list', () => {
    expect(() => meanBondEnthalpy('O', 'O', 3)).toThrow(RangeError)
    expect(() => meanBondEnthalpy('Xe', 'H')).toThrow(RangeError)
  })
})

describe('bond enthalpy sums per molecule', () => {
  it('gives four C–H bonds for CH4 = 4 × 414 = 1656 kJ mol⁻¹', () => {
    expect(bondEnthalpySumOfMolecule('CH4')).toBe(1656)
  })

  it('gives one C=C and four C–H for C2H4 = 611 + 4 × 414 = 2267 kJ mol⁻¹', () => {
    expect(bondEnthalpySumOfMolecule('C2H4')).toBe(2267)
  })

  it('gives two O–H bonds for H2O = 2 × 464 = 928 kJ mol⁻¹', () => {
    expect(bondEnthalpySumOfMolecule('H2O')).toBe(928)
  })

  it('gives two C=O bonds for CO2 = 2 × 741 = 1482 kJ mol⁻¹', () => {
    expect(bondEnthalpySumOfMolecule('CO2')).toBe(1482)
  })

  it('gives three N–H bonds for NH3 = 3 × 389 = 1167 kJ mol⁻¹', () => {
    expect(bondEnthalpySumOfMolecule('NH3')).toBe(1167)
  })

  it('rejects a molecule without a bond list', () => {
    expect(() => bondEnthalpySumOfMolecule('N2')).toThrow(RangeError)
    expect(() => bondEnthalpySumOfMolecule('constructor')).toThrow(RangeError)
  })
})

describe('estimated reaction enthalpy from bonds (equation 5.17)', () => {
  it('estimates H2 + Cl2 → 2HCl as −183.2 kJ mol⁻¹ (broken 678.8, formed 862)', () => {
    const est = estimateReactionEnthalpy(
      [
        { molecule: 'H2', coefficient: 1 },
        { molecule: 'Cl2', coefficient: 1 },
      ],
      [{ molecule: 'HCl', coefficient: 2 }],
    )
    expect(est.bondsBrokenKJ).toBeCloseTo(678.8, 9)
    expect(est.bondsFormedKJ).toBe(862)
    expect(est.deltaHKJ).toBeCloseTo(-183.2, 9)
  })

  it('estimates CH4 + 2O2 → CO2 + 2H2O(g) as −686 kJ mol⁻¹ with gas-phase water', () => {
    const est = estimateReactionEnthalpy(
      [
        { molecule: 'CH4', coefficient: 1 },
        { molecule: 'O2', coefficient: 2 },
      ],
      [
        { molecule: 'CO2', coefficient: 1 },
        { molecule: 'H2O', coefficient: 2 },
      ],
    )
    expect(est.bondsBrokenKJ).toBe(2652)
    expect(est.bondsFormedKJ).toBe(3338)
    expect(est.deltaHKJ).toBe(-686)
  })

  it('gives zero when the same bonds are broken and formed', () => {
    const est = estimateReactionEnthalpy([{ molecule: 'H2', coefficient: 1 }], [{ molecule: 'H2', coefficient: 1 }])
    expect(est.deltaHKJ).toBe(0)
  })

  it('rejects a non-positive coefficient', () => {
    expect(() =>
      estimateReactionEnthalpy([{ molecule: 'H2', coefficient: 0 }], [{ molecule: 'H2', coefficient: 1 }]),
    ).toThrow(RangeError)
  })
})
