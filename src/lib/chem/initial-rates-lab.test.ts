import { describe, expect, it } from 'vitest'
import { formatSig, rateConstantUnits } from './kinetics'
import { LAB_REACTIONS, compareRuns, initialRate, reactionById, roundConc } from './initial-rates-lab'

describe('initial-rates lab', () => {
  const no = reactionById('no-o2')

  it('reproduces Table 3.2 rates at 0.30 and 0.60 mol L⁻¹', () => {
    const cases: Array<[number, number, string]> = [
      [0.3, 0.3, '0.0960'],
      [0.6, 0.3, '0.384'],
      [0.3, 0.6, '0.192'],
      [0.6, 0.6, '0.768'],
    ]
    for (const [noC, o2C, shown] of cases) {
      expect(formatSig(initialRate(no, { NO: noC, O2: o2C }), 3)).toBe(shown)
    }
  })

  it('gives k = 3.56 mol⁻² L² s⁻¹ for the NO reaction', () => {
    expect(formatSig(no.k, 3)).toBe('3.56')
    expect(rateConstantUnits(3).text).toBe('mol⁻² L² s⁻¹')
  })

  it('recovers orders 2 (NO) and 1 (O₂) from pairs of runs', () => {
    const run = (noC: number, o2C: number) => ({ concs: { NO: noC, O2: o2C }, rate: initialRate(no, { NO: noC, O2: o2C }) })
    const doubleNo = compareRuns(no, run(0.3, 0.3), run(0.6, 0.3))
    const doubleO2 = compareRuns(no, run(0.3, 0.3), run(0.3, 0.6))
    expect(doubleNo.kind).toBe('order')
    expect(doubleO2.kind).toBe('order')
    if (doubleNo.kind === 'order' && doubleO2.kind === 'order') {
      expect(doubleNo.species).toBe('NO')
      expect(doubleNo.order).toBeCloseTo(2, 9)
      expect(doubleO2.species).toBe('O2')
      expect(doubleO2.order).toBeCloseTo(1, 9)
    }
  })

  it('reports same or several-species changes without an order', () => {
    const run = (noC: number, o2C: number) => ({ concs: { NO: noC, O2: o2C }, rate: initialRate(no, { NO: noC, O2: o2C }) })
    expect(compareRuns(no, run(0.3, 0.3), run(0.3, 0.3)).kind).toBe('same')
    expect(compareRuns(no, run(0.3, 0.3), run(0.6, 0.6)).kind).toBe('several')
  })

  it('hidden reactions have a fractional order and a zero order', () => {
    const b = reactionById('hypothetical-b')
    const c = reactionById('hypothetical-c')
    expect(b.orders).toEqual({ X: 1, Y: 0.5 })
    expect(c.orders).toEqual({ P: 2, Q: 0 })
    // Zero order in Q: the rate does not change when [Q] changes.
    expect(initialRate(c, { P: 0.4, Q: 0.2 })).toBeCloseTo(initialRate(c, { P: 0.4, Q: 0.9 }), 12)
    // Half order in Y: doubling [Y] multiplies the rate by √2.
    expect(initialRate(b, { X: 0.5, Y: 0.8 }) / initialRate(b, { X: 0.5, Y: 0.4 })).toBeCloseTo(Math.SQRT2, 9)
  })

  it('has three reactions and rounds slider values to 0.01', () => {
    expect(LAB_REACTIONS).toHaveLength(3)
    expect(roundConc(0.1 + 0.2)).toBe(0.3)
  })
})
