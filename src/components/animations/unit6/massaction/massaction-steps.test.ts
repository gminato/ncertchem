import { describe, expect, it } from 'vitest'
import { experiments, meanKc, range, relatedConstants, h2I2Expression } from './massaction-steps'
import { kcFromTable62 } from '@/lib/chem/approach-to-equilibrium'

describe('mass-action data (Section 6.3)', () => {
  const rows = experiments()

  it('reads six experiments, four from H2 + I2 and two from HI', () => {
    expect(rows.map((r) => r.experiment)).toEqual([1, 2, 3, 4, 5, 6])
    expect(rows.map((r) => r.start)).toEqual(['H2 + I2', 'H2 + I2', 'H2 + I2', 'H2 + I2', 'HI', 'HI'])
  })

  it('computes the first trial [HI]/([H2][I2]) in mol L⁻¹, which is not constant', () => {
    const { min, max } = range(rows.map((r) => r.firstTrial))
    expect(min).toBeGreaterThan(700)
    expect(max).toBeLessThan(2100)
    expect(max / min).toBeGreaterThan(2)
  })

  it('computes Kc = [HI]²/([H2][I2]) that stays within about 2 % of its mean in every experiment', () => {
    const k = meanKc()
    expect(k).toBeGreaterThan(46)
    expect(k).toBeLessThan(47)
    for (const row of rows) {
      expect(Math.abs(row.kc - k) / k).toBeLessThan(0.02)
    }
  })

  it('matches the Kc values from the approach library', () => {
    rows.forEach((row, i) => expect(row.kc).toBeCloseTo(kcFromTable62()[i], 12))
  })

  it('uses products over reactants with each power the stoichiometric coefficient', () => {
    const expression = h2I2Expression()
    expect(expression.numerator).toEqual([{ species: 'HI', power: 2 }])
    expect(expression.denominator).toEqual([
      { species: 'H2', power: 1 },
      { species: 'I2', power: 1 },
    ])
  })

  it('relates K for the reversed, doubled and halved equations (Table 6.4)', () => {
    const k = meanKc()
    const [reverse, doubled, halved] = relatedConstants(k)
    expect(reverse.value).toBeCloseTo(1 / k, 12)
    expect(doubled.value).toBeCloseTo(k * k, 6)
    expect(halved.value).toBeCloseTo(Math.sqrt(k), 12)
  })
})
