import { describe, expect, it } from 'vitest'
import { deuteriumShare, dynamicModel, isotopologueFractions, particleCount } from './dynamic-steps'
import { approachPresets, kcFromTable62, meanKcFromTable62 } from '@/lib/chem/approach-to-equilibrium'
import { kcFromConcentrations } from '@/lib/chem/equilibrium'

describe('dynamic-equilibrium model (Section 6.2)', () => {
  const model = dynamicModel()
  const [start, reverseStarts, atEq, flat] = model.pictures

  it('starts from reactants only, with no reverse rate', () => {
    expect(start.t).toBe(0)
    expect(start.concentrations.HI).toBe(0)
    expect(start.rates.reverse).toBe(0)
    // kf [H2][I2] with kf = 100 L mol⁻¹ s⁻¹ and 0.02 mol L⁻¹ of each reactant: 0.04 mol L⁻¹ s⁻¹ = 40 mmol L⁻¹ s⁻¹
    expect(model.kf).toBe(100)
    expect(start.rates.forward).toBeCloseTo(40, 10)
    expect(start.counts).toEqual([particleCount(0.02), particleCount(0.02), 0])
  })

  it('has the reverse rate starting once HI has formed, at half its equilibrium amount', () => {
    expect(reverseStarts.t).toBeGreaterThan(0)
    expect(reverseStarts.concentrations.HI).toBeCloseTo(model.equilibrium.HI / 2, 6)
    expect(reverseStarts.rates.reverse).toBeGreaterThan(0)
    expect(reverseStarts.rates.forward).toBeLessThan(start.rates.forward)
  })

  it('has equal forward and reverse rates at equilibrium', () => {
    expect(atEq.rates.forward).toBeCloseTo(atEq.rates.reverse, 9)
    expect(atEq.rates.forward).toBeGreaterThan(0)
  })

  it('takes the equilibrium composition from the library, with Kc equal to the Table 6.2 mean', () => {
    const kc = kcFromConcentrations(
      // The reaction as used by the library
      {
        reactants: [
          { species: 'H2', coefficient: 1, phase: 'g' },
          { species: 'I2', coefficient: 1, phase: 'g' },
        ],
        products: [{ species: 'HI', coefficient: 2, phase: 'g' }],
      },
      model.equilibrium
    )
    expect(kc).toBeCloseTo(model.k, 6)
    expect(model.k).toBeCloseTo(meanKcFromTable62(), 9)
    expect(meanKcFromTable62()).toBeGreaterThan(46);
    expect(meanKcFromTable62()).toBeLessThan(50)
    expect(Math.min(...kcFromTable62())).toBeGreaterThan(46)
    expect(Math.max(...kcFromTable62())).toBeLessThan(48)
  })

  it('runs the time course onto the solveIce equilibrium', () => {
    const last = model.run.samples[model.run.samples.length - 1].concentrations
    for (const name of Object.keys(model.equilibrium)) {
      expect(Math.abs(last[name] - model.equilibrium[name])).toBeLessThan(0.01 * 0.04)
    }
  })

  it('flattens the curves after the approach, and the flat picture is the equilibrium', () => {
    expect(model.settledAt).toBeGreaterThan(model.halfwayTime)
    expect(model.settledAt).toBeLessThan(approachPresets()[0].tEnd)
    expect(flat.concentrations).toEqual(model.equilibrium)
  })

  it('draws particle counts that stay within the vessel scale', () => {
    for (const p of model.pictures) {
      for (const n of p.counts) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(24)
      }
    }
  })
})

describe('isotope model for the D2 tracer (Section 6.2)', () => {
  it('gives the statistical fractions of NH3, NH2D, NHD2 and ND3 for equal H and D atoms', () => {
    const p = deuteriumShare(1, 1)
    expect(p).toBe(0.5)
    expect(isotopologueFractions(p)).toEqual([0.125, 0.375, 0.375, 0.125])
  })

  it('has no deuterated ammonia before mixing, and always sums to one', () => {
    expect(isotopologueFractions(0)).toEqual([1, 0, 0, 0])
    for (const p of [0.1, 0.37, 0.8]) {
      const total = isotopologueFractions(p).reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(1, 12)
    }
  })

  it('rejects a share outside 0 to 1', () => {
    expect(() => isotopologueFractions(1.2)).toThrow(RangeError)
  })
})
