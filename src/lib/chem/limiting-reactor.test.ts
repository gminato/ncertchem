import { describe, expect, it } from 'vitest'
import { reactorOutcome } from './limiting-reactor'
import type { Reaction } from './stoichiometry'

const hydrogenWater: Reaction = {
  reactants: [
    { formula: 'H2', coeff: 2 },
    { formula: 'O2', coeff: 1 },
  ],
  products: [{ formula: 'H2O', coeff: 2 }],
}

const methaneCombustion: Reaction = {
  reactants: [
    { formula: 'CH4', coeff: 1 },
    { formula: 'O2', coeff: 2 },
  ],
  products: [
    { formula: 'CO2', coeff: 1 },
    { formula: 'H2O', coeff: 2 },
  ],
}

const haber: Reaction = {
  reactants: [
    { formula: 'N2', coeff: 1 },
    { formula: 'H2', coeff: 3 },
  ],
  products: [{ formula: 'NH3', coeff: 2 }],
}

describe('reactorOutcome', () => {
  it('takes H2 as limiting when hydrogen runs out first', () => {
    const out = reactorOutcome(hydrogenWater, { H2: 4, O2: 5 })
    expect(out.limiting).toBe('H2')
    expect(out.events).toBe(2)
    expect(out.consumed).toEqual({ H2: 4, O2: 2 })
    expect(out.remaining).toEqual({ H2: 0, O2: 3 })
    expect(out.produced).toEqual({ H2O: 4 })
  })

  it('takes O2 as limiting, with whole events only', () => {
    // 5 H2 and 2 O2: extents 2.5 and 2, so O2 limits; 2 events use 4 H2 and 2 O2.
    const out = reactorOutcome(hydrogenWater, { H2: 5, O2: 2 })
    expect(out.limiting).toBe('O2')
    expect(out.events).toBe(2)
    expect(out.remaining).toEqual({ H2: 1, O2: 0 })
  })

  it('never splits molecules when the continuous extent is fractional', () => {
    // 3 CH4 and 5 O2: extents 3 and 2.5, so 2 whole events.
    const out = reactorOutcome(methaneCombustion, { CH4: 3, O2: 5 })
    expect(out.limiting).toBe('O2')
    expect(out.events).toBe(2)
    expect(out.consumed).toEqual({ CH4: 2, O2: 4 })
    expect(out.remaining).toEqual({ CH4: 1, O2: 1 })
    expect(out.produced).toEqual({ CO2: 2, H2O: 4 })
  })

  it('conserves molecules: consumed + remaining = supplied', () => {
    const counts: Record<string, number> = { N2: 7, H2: 10 }
    const out = reactorOutcome(haber, counts)
    expect(out.limiting).toBe('H2')
    expect(out.events).toBe(3)
    for (const formula of ['N2', 'H2']) {
      expect(out.consumed[formula] + out.remaining[formula]).toBe(counts[formula])
    }
    expect(out.produced).toEqual({ NH3: 6 })
  })

  it('gives zero events when one reactant is absent', () => {
    const out = reactorOutcome(methaneCombustion, { CH4: 0, O2: 9 })
    expect(out.events).toBe(0)
    expect(out.limiting).toBe('CH4')
    expect(out.produced).toEqual({ CO2: 0, H2O: 0 })
  })

  it('rejects counts that are not whole, non-negative numbers', () => {
    expect(() => reactorOutcome(hydrogenWater, { H2: 2.5, O2: 1 })).toThrow(RangeError)
    expect(() => reactorOutcome(hydrogenWater, { H2: -1, O2: 1 })).toThrow(RangeError)
  })
})
