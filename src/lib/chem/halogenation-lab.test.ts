import { describe, expect, it } from 'vitest'
import {
  labAlkane,
  labAlkaneName,
  labCombustion,
  labHalogenation,
  oxygenPerMole,
  productsByReactivity,
  statisticalShares,
  totalSubstitutableHydrogens,
} from './halogenation-lab'

describe('halogenation lab', () => {
  it('names the lab alkanes from the lib', () => {
    expect(labAlkaneName('propane')).toBe('propane')
    expect(labAlkaneName('2,2-dimethylpropane')).toBe('2,2-dimethylpropane')
    expect(() => labAlkane('cyclohexane')).toThrow(RangeError)
  })

  it('counts every C–H bond: propane has 8, 2-methylbutane 12', () => {
    expect(totalSubstitutableHydrogens(labHalogenation('propane', 'Cl'))).toBe(8)
    expect(totalSubstitutableHydrogens(labHalogenation('2-methylbutane', 'Cl'))).toBe(12)
  })

  it('splits propane 75:25 statistically (six primary, two secondary hydrogens)', () => {
    const shares = statisticalShares(labHalogenation('propane', 'Cl'))
    const primary = shares.find((s) => s.product.degree === '1°')
    const secondary = shares.find((s) => s.product.degree === '2°')
    expect(primary?.percent).toBe(75)
    expect(secondary?.percent).toBe(25)
  })

  it('shares add up to 100 per cent for every lab alkane', () => {
    for (const id of ['propane', 'butane', '2-methylpropane', 'pentane', '2-methylbutane', '2,2-dimethylpropane']) {
      const total = statisticalShares(labHalogenation(id, 'Br')).reduce((sum, s) => sum + s.percent, 0)
      expect(Math.abs(total - 100)).toBeLessThan(0.5)
    }
  })

  it('orders the products 3° > 2° > 1° for reactivity, without numbers', () => {
    const ordered = productsByReactivity(labHalogenation('2-methylbutane', 'Cl')).map((p) => p.degree)
    expect(ordered).toEqual(['3°', '2°', '1°', '1°'])
  })

  it('balances CₙH₂ₙ₊₂ + O₂ for any n through the lib', () => {
    expect(labCombustion(1).equations[0]).toContain('2O2')
    expect(labCombustion(5).equations[0]).toContain('8O2')
    expect(labCombustion(5).equations[0]).toContain('5CO2')
    expect(labCombustion(5).equations[0]).toContain('6H2O')
    expect(() => labCombustion(0)).toThrow(RangeError)
  })

  it('gives (3n + 1)/2 mol of oxygen per mole of alkane', () => {
    expect(oxygenPerMole(1)).toBe(2)
    expect(oxygenPerMole(3)).toBe(5)
    expect(oxygenPerMole(5)).toBe(8)
  })
})
