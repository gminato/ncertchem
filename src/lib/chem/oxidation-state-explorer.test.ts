import { describe, expect, it } from 'vitest'
import {
  FIRST_ROW,
  GROUP_6_METALS,
  countRuleHolds,
  explorerReadout,
  group6Entry,
  group6Summary,
  highestListed,
  listedStatesText,
  stateRows,
  valenceTotal,
} from './oxidation-state-explorer'

describe('oxidation state explorer', () => {
  it('lists the first row Sc to Zn', () => {
    expect(FIRST_ROW).toEqual(['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
  })

  it('takes valence totals from Table 4.1', () => {
    expect(valenceTotal('Sc')).toBe(3)
    expect(valenceTotal('Mn')).toBe(7)
    expect(valenceTotal('Zn')).toBe(12)
  })

  it('holds the count rule from Sc to Mn and not after Mn', () => {
    for (const symbol of ['Sc', 'Ti', 'V', 'Cr', 'Mn']) {
      expect(countRuleHolds(symbol)).toBe(true)
      expect(highestListed(symbol)).toBe(valenceTotal(symbol))
    }
    expect(countRuleHolds('Fe')).toBe(false)
    expect(highestListed('Fe')).toBe(6)
  })

  it('marks listed states and their common flags from Table 4.3', () => {
    const mn = stateRows('Mn')
    expect(mn.filter((row) => row.listed).map((row) => row.state)).toEqual([2, 3, 4, 5, 6, 7])
    expect(mn.filter((row) => row.common).map((row) => row.state)).toEqual([2, 7])
    const sc = stateRows('Sc')
    expect(sc.filter((row) => row.listed).map((row) => row.state)).toEqual([3])
    expect(sc.find((row) => row.state === 1)?.dLeft).toBeNull()
  })

  it('counts d electrons left after ns then (n−1)d leave', () => {
    const dLeft = (symbol: string, state: number) => stateRows(symbol).find((row) => row.state === state)?.dLeft
    expect(dLeft('Mn', 7)).toBe(0)
    expect(dLeft('Cr', 6)).toBe(0)
    expect(dLeft('Fe', 6)).toBe(2)
    expect(dLeft('Cu', 1)).toBe(10)
  })

  it('draws an oxide or halide example from the tables, or none', () => {
    const mn7 = stateRows('Mn').find((row) => row.state === 7)
    expect(mn7?.example).toBe('Mn₂O₇')
    expect(mn7?.exampleKind).toBe('oxide')
    expect(stateRows('Mn').find((row) => row.state === 5)?.example).toBeNull()
  })

  it('states the readout for the chosen metal', () => {
    expect(explorerReadout('Mn').states).toBe('+2, +3, +4, +5, +6, +7')
    expect(explorerReadout('Mn').lead).toContain('+7')
    expect(explorerReadout('Fe').lead).toContain('stops at Mn')
    expect(listedStatesText('Zn')).toBe('+2')
  })

  it('reads the group 6 comparison from the lead data only', () => {
    expect(GROUP_6_METALS).toEqual(['Cr', 'Mo', 'W'])
    expect(group6Entry('Cr')).toEqual({ symbol: 'Cr', state: 6, species: 'Cr₂O₇²⁻', strongOxidant: true })
    expect(group6Entry('Mo').strongOxidant).toBe(false)
    expect(group6Summary('W')).toContain('WO₃ is')
    expect(group6Summary('W')).toContain('not a strong oxidant')
  })
})
