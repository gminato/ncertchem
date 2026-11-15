import { describe, expect, it } from 'vitest'
import {
  ANALYTES,
  CANDIDATES,
  analyteById,
  candidateRfTable,
  columnArrival,
  elutionGroups,
  matchRf,
  modelRf,
  retentionFactor,
  solventLabel,
} from './chromatography'
import { rf as measuredRf } from './purification'

describe('Rf relation', () => {
  it('Rf is always between 0 and 1 over the whole solvent range', () => {
    for (const a of ANALYTES) {
      for (let s = 0; s <= 1.0001; s += 0.05) {
        const v = modelRf(a.adsorption, s)
        expect(v).toBeGreaterThan(0)
        expect(v).toBeLessThan(1)
      }
    }
  })

  it('a more polar solvent moves every substance further (Rf rises with solvent strength)', () => {
    for (const a of ANALYTES) {
      expect(modelRf(a.adsorption, 0.9)).toBeGreaterThan(modelRf(a.adsorption, 0.1))
    }
  })

  it('a more strongly adsorbed substance has a smaller Rf in the same solvent', () => {
    expect(modelRf(0.6, 0.4)).toBeGreaterThan(modelRf(1.4, 0.4))
    expect(modelRf(1.4, 0.4)).toBeGreaterThan(modelRf(2.4, 0.4))
  })

  it('Rf = 1 / (1 + k′) for the retention factor used', () => {
    const k = retentionFactor(1.4, 0.4)
    expect(modelRf(1.4, 0.4)).toBeCloseTo(1 / (1 + k), 12)
  })

  it('the Rf of a worked reading follows Rf = distance spot ÷ distance solvent', () => {
    expect(measuredRf(3.2, 8)).toBeCloseTo(0.4, 12)
  })

  it('throws for a non-positive adsorption constant', () => {
    expect(() => modelRf(0, 0.5)).toThrow(RangeError)
  })
})

describe('separation at the default solvent (s = 0.4)', () => {
  const table = candidateRfTable(0.4)
  const sorted = [...table].sort((a, b) => b.rf - a.rf)

  it('the four known substances separate by at least 0.05 in Rf', () => {
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].rf - sorted[i].rf).toBeGreaterThanOrEqual(0.05)
    }
  })

  it('the default Rf values are the ones shown in the Scrolly text', () => {
    const rfOf = (id: string) => table.find((t) => t.analyte.id === id)!.rf
    expect(rfOf('red').toFixed(2)).toBe('0.58')
    expect(rfOf('colourless').toFixed(2)).toBe('0.45')
    expect(rfOf('blue').toFixed(2)).toBe('0.37')
    expect(rfOf('green').toFixed(2)).toBe('0.26')
  })

  it('the unknown is identified by a unique Rf match with the blue dye', () => {
    const unknownRf = modelRf(analyteById('unknown').adsorption, 0.4)
    const matches = matchRf(unknownRf, 0.4)
    expect(matches.map((m) => m.analyte.id)).toEqual(['blue'])
  })
})

describe('matching and lookups', () => {
  it('matchRf returns nothing when no candidate is within the tolerance', () => {
    expect(matchRf(0.95, 0.4)).toEqual([])
  })

  it('the unknown is never a candidate', () => {
    expect(CANDIDATES.some((c) => c.id === 'unknown')).toBe(false)
  })

  it('analyteById throws for an id that does not exist', () => {
    expect(() => analyteById('purple' as never)).toThrow(RangeError)
  })
})

describe('column arrival', () => {
  it('a strongly adsorbed band arrives later than a weakly adsorbed one', () => {
    expect(columnArrival(2.4, 0.4)).toBeGreaterThan(columnArrival(0.6, 0.4))
  })

  it('arrivals stay inside (0, 1) for every analyte and solvent', () => {
    for (const a of ANALYTES) {
      for (let s = 0; s <= 1; s += 0.1) {
        const v = columnArrival(a.adsorption, s)
        expect(v).toBeGreaterThan(0)
        expect(v).toBeLessThanOrEqual(0.98)
      }
    }
  })
})

describe('solvent label', () => {
  it('maps the scale onto three names', () => {
    expect(solventLabel(0)).toBe('less polar')
    expect(solventLabel(0.5)).toBe('medium polarity')
    expect(solventLabel(1)).toBe('more polar')
  })
})

describe('elution groups', () => {
  it('identical compounds (equal arrival) share one group', () => {
    const groups = elutionGroups([
      { arrival: 0.42, value: 'B' },
      { arrival: 0.35, value: 'C' },
      { arrival: 0.42, value: 'U' },
    ])
    expect(groups).toEqual([
      { arrival: 0.35, members: ['C'] },
      { arrival: 0.42, members: ['B', 'U'] },
    ])
  })

  it('arrivals more than 1 % apart stay in separate groups', () => {
    const groups = elutionGroups([
      { arrival: 0.5, value: 'x' },
      { arrival: 0.515, value: 'y' },
    ])
    expect(groups).toHaveLength(2)
  })

  it('the model gives the blue dye and the unknown the same column arrival', () => {
    const b = columnArrival(analyteById('blue').adsorption, 0.9)
    const u = columnArrival(analyteById('unknown').adsorption, 0.9)
    expect(b).toBe(u)
    expect(elutionGroups([{ arrival: b, value: 'B' }, { arrival: u, value: 'U' }])).toHaveLength(1)
  })
})
