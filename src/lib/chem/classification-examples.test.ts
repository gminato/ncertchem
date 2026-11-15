import { describe, expect, it } from 'vitest'
import { alcoholSeries, ch2Increment, sorterDeck, SORTER_GROUP_OPTIONS, SORTER_SMILES } from './classification-examples'
import { parseSmiles } from './molecule-parse'
import { GROUP_IDS } from './classification'

describe('sorterDeck', () => {
  const deck = sorterDeck()

  it('has at least 15 molecules, all four classes and every class in more than one card', () => {
    expect(deck.length).toBeGreaterThanOrEqual(15)
    expect(deck.length).toBe(SORTER_SMILES.length)
    for (const cls of ['acyclic', 'alicyclic', 'aromatic', 'heterocyclic']) {
      expect(deck.filter((c) => c.ringClass === cls).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives each card a group that is one of the sorter options', () => {
    for (const c of deck) expect(SORTER_GROUP_OPTIONS).toContain(c.group)
  })

  it('gives the expected answer for the cards the sorter is built around', () => {
    const answer = (s: string) => {
      const c = deck.find((d) => d.smiles === s)
      if (!c) throw new Error(`${s} missing from deck`)
      return [c.ringClass, c.group]
    }
    expect(answer('CC(=O)O')).toEqual(['acyclic', 'carboxylic acid'])
    expect(answer('C1CCOC1')).toEqual(['heterocyclic', 'ether'])
    expect(answer('O=C1C=CC=CC=C1')).toEqual(['aromatic', 'ketone'])
    expect(answer('C1=CC=CC=C1')).toEqual(['aromatic', 'none'])
  })

  it('has a group atom list for every card with a group, and none for hydrocarbons', () => {
    for (const c of deck) {
      if (c.group === 'none') expect(c.groupAtoms).toEqual([])
      else expect(c.groupAtoms.length).toBeGreaterThan(0)
    }
  })

  it('uses only group ids the lib defines', () => {
    for (const option of SORTER_GROUP_OPTIONS) {
      if (option !== 'none') expect(GROUP_IDS).toContain(option)
    }
  })
})

describe('alcoholSeries', () => {
  const series = alcoholSeries()

  it('is the C1 to C5 alcohols, named by the lib', () => {
    expect(series.map((m) => m.name)).toEqual(['methanol', 'ethanol', 'propan-1-ol', 'butan-1-ol', 'pentan-1-ol'])
    expect(series.map((m) => m.formula)).toEqual(['CH4O', 'C2H6O', 'C3H8O', 'C4H10O', 'C5H12O'])
  })

  it('rises in boiling point at every step', () => {
    for (let i = 1; i < series.length; i++) {
      expect(series[i].boilingPointC).toBeGreaterThan(series[i - 1].boilingPointC)
    }
  })

  it('differs by one CH₂ unit at each step', () => {
    for (let i = 1; i < series.length; i++) {
      expect(ch2Increment(series[i - 1].graph, series[i].graph)).toBe(1)
    }
  })

  it('returns null for two members that do not differ by CH₂', () => {
    expect(ch2Increment(parseSmiles('CO'), parseSmiles('CCCO'))).toBeNull()
  })
})
