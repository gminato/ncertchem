import { describe, expect, it } from 'vitest'
import { alkaneIsomers, isomerRelation } from './isomers'
import { parseSmiles } from './molecule-parse'

describe('alkaneIsomers', () => {
  it.each([
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 2],
    [5, 3],
    [6, 5],
    [7, 9],
  ])('C%i has %i structural isomers', (n, count) => {
    expect(alkaneIsomers(n)).toHaveLength(count)
  })

  it('names the C4 and C5 isomers', () => {
    expect(alkaneIsomers(4).map((x) => x.name).sort()).toEqual(['2-methylpropane', 'butane'])
    expect(alkaneIsomers(5).map((x) => x.name).sort()).toEqual([
      '2,2-dimethylpropane',
      '2-methylbutane',
      'pentane',
    ])
  })

  it('gives each isomer the molecular formula of the alkane', () => {
    for (const isomer of alkaneIsomers(6)) {
      expect(isomer.graph.atoms.filter((a) => a.element === 'C')).toHaveLength(6)
    }
  })

  it('rejects n outside 1 to 7', () => {
    expect(() => alkaneIsomers(0)).toThrow(RangeError)
    expect(() => alkaneIsomers(8)).toThrow(RangeError)
    expect(() => alkaneIsomers(2.5)).toThrow(RangeError)
  })
})

describe('isomerRelation (NCERT 8.6.1)', () => {
  it('identical drawings of one molecule', () => {
    expect(isomerRelation(parseSmiles('CCO'), parseSmiles('OCC'))).toBe('identical')
  })

  it('molecules with different formulas are not isomers', () => {
    expect(isomerRelation(parseSmiles('CCO'), parseSmiles('CC'))).toBe('not isomers')
  })

  it('chain isomers: pentane and 2-methylbutane, butane and 2-methylpropane', () => {
    expect(isomerRelation(parseSmiles('CCCCC'), parseSmiles('CCC(C)C'))).toBe('chain')
    expect(isomerRelation(parseSmiles('CCCC'), parseSmiles('CC(C)C'))).toBe('chain')
  })

  it('position isomers: propan-1-ol and propan-2-ol, but-1-ene and but-2-ene', () => {
    expect(isomerRelation(parseSmiles('CCCO'), parseSmiles('CC(O)C'))).toBe('position')
    expect(isomerRelation(parseSmiles('C=CCC'), parseSmiles('CC=CC'))).toBe('position')
  })

  it('functional isomers: ethanol and dimethyl ether, propanal and acetone', () => {
    expect(isomerRelation(parseSmiles('CCO'), parseSmiles('COC'))).toBe('functional')
    expect(isomerRelation(parseSmiles('CCC=O'), parseSmiles('CC(C)=O'))).toBe('functional')
  })

  it('metamers: methoxypropane and ethoxyethane', () => {
    expect(isomerRelation(parseSmiles('COCCC'), parseSmiles('CCOCC'))).toBe('metamerism')
  })
})
