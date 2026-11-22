import { describe, expect, it } from 'vitest'
import {
  NCERT_BUTYL_CHLORIDE,
  NCERT_COLLISION_THEORY,
  NCERT_COMPLEX_EXAMPLE,
  NCERT_FIRST_ORDER_EXAMPLES,
  NCERT_H2O2_IODIDE_MECHANISM,
  NCERT_INTEGRATED_LAWS,
  NCERT_MOLECULARITY_EXAMPLES,
  NCERT_NO_O2_INITIAL_RATES,
  NCERT_NO_O2_ORDERS,
  NCERT_RATE_CONSTANT_UNITS,
  NCERT_RATE_LAW_EXAMPLES,
  NCERT_UNIT3_ERRATA,
  NCERT_ZERO_ORDER_EXAMPLES,
} from './ncert-c12-unit3-tables'
import { rateConstantUnits } from './kinetics'

describe('Table 3.1 butyl chloride data', () => {
  it('has nine points in time order with falling concentration', () => {
    expect(NCERT_BUTYL_CHLORIDE).toHaveLength(9)
    for (let i = 1; i < NCERT_BUTYL_CHLORIDE.length; i++) {
      expect(NCERT_BUTYL_CHLORIDE[i].tS).toBeGreaterThan(NCERT_BUTYL_CHLORIDE[i - 1].tS)
      expect(NCERT_BUTYL_CHLORIDE[i].concMolPerL).toBeLessThan(NCERT_BUTYL_CHLORIDE[i - 1].concMolPerL)
    }
    expect(NCERT_BUTYL_CHLORIDE[0]).toEqual({ tS: 0, concMolPerL: 0.1 })
  })
})

describe('Table 3.2 initial rates', () => {
  it('has four experiments and the orders are {NO: 2, O2: 1}', () => {
    expect(NCERT_NO_O2_INITIAL_RATES.map((r) => r.experiment)).toEqual([1, 2, 3, 4])
    expect(NCERT_NO_O2_ORDERS).toEqual({ NO: 2, O2: 1 })
  })

  it('rate divided by the rate law product gives the same k in all runs', () => {
    for (const row of NCERT_NO_O2_INITIAL_RATES) {
      const k = row.initialRate / (row.noMolPerL ** 2 * row.o2MolPerL)
      expect(k).toBeCloseTo(3.5556, 3)
    }
  })
})

describe('Table 3.3 units and Table 3.4 laws', () => {
  it('units agree with rateConstantUnits for orders 0, 1 and 2', () => {
    const orders = NCERT_RATE_CONSTANT_UNITS.map((r) => r.order)
    expect(orders).toEqual([0, 1, 2])
    for (const row of NCERT_RATE_CONSTANT_UNITS) {
      expect(rateConstantUnits(row.order).text).toBe(row.units)
    }
  })

  it('integrated laws have a zero and a first order row', () => {
    expect(NCERT_INTEGRATED_LAWS.map((r) => r.order)).toEqual([0, 1])
    expect(NCERT_INTEGRATED_LAWS[0].straightLinePlot).toBe('[R] vs t')
    expect(NCERT_INTEGRATED_LAWS[1].straightLinePlot).toBe('ln[R] vs t')
  })
})

describe('named examples', () => {
  it('rate law examples have non-integer or zero exponents where NCERT says so', () => {
    expect(NCERT_RATE_LAW_EXAMPLES).toHaveLength(2)
    const chcl3 = NCERT_RATE_LAW_EXAMPLES.find((e) => e.id === 'chcl3-cl2')
    expect(chcl3?.exponents).toEqual({ CHCl3: 1, Cl2: 0.5 })
    const ester = NCERT_RATE_LAW_EXAMPLES.find((e) => e.id === 'ester-hydrolysis')
    expect(ester?.exponents.H2O).toBe(0)
  })

  it('molecularity examples are whole numbers 1 to 3 in NCERT order', () => {
    expect(NCERT_MOLECULARITY_EXAMPLES.map((e) => e.molecularity)).toEqual([1, 2, 3])
    expect(NCERT_MOLECULARITY_EXAMPLES.map((e) => e.ncertName)).toEqual([
      'unimolecular',
      'bimolecular',
      'trimolecular',
    ])
  })

  it('complex example has apparent order 10 and actual order 2', () => {
    expect(NCERT_COMPLEX_EXAMPLE.apparentOrder).toBe(10)
    expect(NCERT_COMPLEX_EXAMPLE.actualOrder).toBe(2)
  })

  it('H2O2 mechanism: slow first step, intermediate IO⁻, rate law k[H₂O₂][I⁻]', () => {
    const m = NCERT_H2O2_IODIDE_MECHANISM
    expect(m.steps).toHaveLength(2)
    expect(m.steps[0].slow).toBe(true)
    expect(m.steps[1].slow).toBe(false)
    expect(m.intermediate).toBe('IO⁻')
    expect(m.rateLawOrders).toEqual({ 'H2O2': 1, 'I-': 1 })
  })

  it('zero and first order examples are non-empty and named', () => {
    expect(NCERT_ZERO_ORDER_EXAMPLES.length).toBeGreaterThanOrEqual(2)
    expect(NCERT_FIRST_ORDER_EXAMPLES.length).toBeGreaterThanOrEqual(4)
    for (const e of [...NCERT_ZERO_ORDER_EXAMPLES, ...NCERT_FIRST_ORDER_EXAMPLES]) {
      expect(e.reaction.length).toBeGreaterThan(0)
      expect(e.ce.length).toBeGreaterThan(0)
    }
  })

  it('collision theory names Trautz and Lewis and the orientation example', () => {
    expect(NCERT_COLLISION_THEORY.developedBy).toContain('Trautz')
    expect(NCERT_COLLISION_THEORY.developedBy).toContain('Lewis')
    expect(NCERT_COLLISION_THEORY.years).toBe('1916-18')
    expect(NCERT_COLLISION_THEORY.orientationExample.ce).toBe('CH3Br + OH- -> CH3OH + Br-')
  })
})

describe('errata', () => {
  it('records the bromomethane slip in Section 3.5', () => {
    const entry = NCERT_UNIT3_ERRATA.find((e) => e.id === 'bromoethane-for-bromomethane')
    expect(entry).toBeDefined()
    expect(entry?.where).toContain('3.5')
    expect(entry?.correct).toContain('CH₃Br')
  })

  it('every entry has the three fields filled', () => {
    for (const e of NCERT_UNIT3_ERRATA) {
      expect(e.where.length).toBeGreaterThan(0)
      expect(e.ncertSays.length).toBeGreaterThan(0)
      expect(e.correct.length).toBeGreaterThan(0)
    }
  })
})
