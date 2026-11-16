import { describe, expect, it } from 'vitest'
import { alkaneRow, boilingPointK, boilingPointTrend, branchingLowersBoilingPoint, straightChainBoilingPointsRise } from './alkane-properties'
import { NCERT_TABLE_9_2_ALKANES } from './ncert-unit9-tables'

describe('alkane boiling points (NCERT Table 9.2)', () => {
  it('reads the printed values', () => {
    expect(boilingPointK('Methane')).toBe(111.0)
    expect(boilingPointK('Pentane')).toBe(309.1)
    expect(boilingPointK('2-Methylbutane')).toBe(300.9)
    expect(boilingPointK('2,2-Dimethylpropane')).toBe(282.5)
    expect(alkaneRow('Eicosane').molecularMass).toBe(282)
  })
  it('rejects a name that is not in the table', () => {
    expect(() => boilingPointK('Benzene')).toThrow(RangeError)
  })
  it('straight-chain boiling points rise with chain length', () => {
    expect(straightChainBoilingPointsRise()).toBe(true)
  })
  it('branching lowers the boiling point for each pentane isomer', () => {
    expect(branchingLowersBoilingPoint('2-Methylbutane', 'Pentane')).toBe(true)
    expect(branchingLowersBoilingPoint('2,2-Dimethylpropane', '2-Methylbutane')).toBe(true)
  })
  it('orders the pentane isomers from highest to lowest boiling point', () => {
    const t = boilingPointTrend(['2,2-Dimethylpropane', 'Pentane', '2-Methylbutane'])
    expect(t.ordered).toEqual(['Pentane', '2-Methylbutane', '2,2-Dimethylpropane'])
    expect(t.reason).toMatch(/van der Waals/)
  })
  it('has the printed melting point of 2,2-dimethylpropane (high, from its packing)', () => {
    expect(alkaneRow('2,2-Dimethylpropane').meltingPointK).toBe(256.4)
    expect(NCERT_TABLE_9_2_ALKANES.rows.length).toBe(14)
  })
})
