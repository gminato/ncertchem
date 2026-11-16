import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { carbonCounts, carbonRows, chainIsomerNames, hydrogenTally, monohaloProducts } from './carbon-counter'

const PENTANE = 'CCCCC'
const ISOPENTANE = 'CC(C)CC'
const NEOPENTANE = 'CC(C)(C)C'

describe('carbon classes', () => {
  it('classes the carbons of pentane as 1°, 2°, 2°, 2°, 1°', () => {
    expect(carbonRows(parseSmiles(PENTANE)).map((r) => r.degree)).toEqual(['1°', '2°', '2°', '2°', '1°'])
  })

  it('counts two primary and three secondary carbons in pentane', () => {
    expect(carbonCounts(parseSmiles(PENTANE))).toEqual({ '1°': 2, '2°': 3, '3°': 0, '4°': 0 })
  })

  it('finds one tertiary carbon in 2-methylbutane and one quaternary carbon in neopentane', () => {
    expect(carbonCounts(parseSmiles(ISOPENTANE))).toEqual({ '1°': 3, '2°': 1, '3°': 1, '4°': 0 })
    expect(carbonCounts(parseSmiles(NEOPENTANE))).toEqual({ '1°': 4, '2°': 0, '3°': 0, '4°': 1 })
  })
})

describe('hydrogen tally', () => {
  it('gives 6 primary and 6 secondary hydrogens for pentane', () => {
    expect(hydrogenTally(parseSmiles(PENTANE))).toEqual({ primary: 6, secondary: 6, tertiary: 0, quaternary: 0, total: 12 })
  })

  it('gives 9, 2 and 1 hydrogens for 2-methylbutane, and none on the quaternary carbon of neopentane', () => {
    expect(hydrogenTally(parseSmiles(ISOPENTANE))).toEqual({ primary: 9, secondary: 2, tertiary: 1, quaternary: 0, total: 12 })
    expect(hydrogenTally(parseSmiles(NEOPENTANE))).toEqual({ primary: 12, secondary: 0, tertiary: 0, quaternary: 0, total: 12 })
  })

  it('always totals the hydrogens of the formula', () => {
    for (const s of ['CC', 'CCC', 'CCCC', PENTANE, ISOPENTANE, NEOPENTANE, 'CCCCCCCC']) {
      const g = parseSmiles(s)
      const h = g.atoms.reduce((sum, a) => sum + (a.hCount ?? 0), 0)
      expect(hydrogenTally(g).total).toBe(h)
    }
  })
})

describe('monochloro products', () => {
  it('lists three distinct monochloropentanes, with the hydrogens each came from summing to 12', () => {
    const products = monohaloProducts(parseSmiles(PENTANE), 'Cl')
    expect(products).toHaveLength(3)
    expect(products.reduce((s, p) => s + p.hydrogens, 0)).toBe(12)
    expect(products.map((p) => p.name).sort()).toEqual(['1-chloropentane', '2-chloropentane', '3-chloropentane'])
  })

  it('gives four distinct products for 2-methylbutane and one for neopentane', () => {
    expect(monohaloProducts(parseSmiles(ISOPENTANE), 'Cl')).toHaveLength(4)
    expect(monohaloProducts(parseSmiles(NEOPENTANE), 'Cl')).toHaveLength(1)
  })
})

describe('chain isomers', () => {
  it('lists the three C5H12 chain isomers', () => {
    expect(chainIsomerNames(5)?.sort()).toEqual(['2,2-dimethylpropane', '2-methylbutane', 'pentane'])
  })

  it('lists five C6H14 and nine C7H16 isomers, as NCERT states', () => {
    expect(chainIsomerNames(6)).toHaveLength(5)
    expect(chainIsomerNames(7)).toHaveLength(9)
  })

  it('returns null beyond C7, which the lib does not list', () => {
    expect(chainIsomerNames(8)).toBeNull()
  })
})
