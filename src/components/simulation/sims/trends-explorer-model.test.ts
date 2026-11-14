import { describe, expect, it } from 'vitest'
import { explorerSeries } from '@/lib/chem/trends-explorer'
import {
  chartPoints,
  dipCallouts,
  emptyMessage,
  radiusTrendPrinted,
  readoutFor,
  scopeOf,
} from './trends-explorer-model'

describe('scopeOf', () => {
  it('maps a selection to a lib scope, or null when nothing is picked', () => {
    expect(scopeOf(null)).toBeNull()
    expect(scopeOf({ kind: 'period', n: 3 })).toEqual({ period: 3 })
    expect(scopeOf({ kind: 'group', n: 17 })).toEqual({ group: 17 })
  })
})

describe('dipCallouts', () => {
  it('calls out B and O along period 2 for ionization enthalpy', () => {
    const sel = { kind: 'period' as const, n: 2 }
    const series = explorerSeries('ionization', { period: 2 })
    const callouts = dipCallouts('ionization', sel, series)
    expect(callouts.map((c) => c.text)).toEqual(['B: 2p shielded', 'O: paired 2p'])
    expect(series[callouts[0].index].symbol).toBe('B')
    expect(series[callouts[1].index].symbol).toBe('O')
  })

  it('calls out nothing for other properties or for groups', () => {
    const series = explorerSeries('electronegativity', { period: 2 })
    expect(dipCallouts('electronegativity', { kind: 'period', n: 2 }, series)).toEqual([])
    const group = explorerSeries('ionization', { group: 1 })
    expect(dipCallouts('ionization', { kind: 'group', n: 1 }, group)).toEqual([])
  })
})

describe('chartPoints', () => {
  it('uses the position along a period and the period number down a group', () => {
    const row = explorerSeries('ionization', { period: 2 })
    expect(chartPoints(row, { kind: 'period', n: 2 }).map((p) => p.x)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    const column = explorerSeries('ionization', { group: 1 })
    const points = chartPoints(column, { kind: 'group', n: 1 })
    expect(points.find((p) => p.label === 'Cs')?.x).toBe(6)
  })
})

describe('emptyMessage', () => {
  it('explains where NCERT prints radii, even when a row would have two values', () => {
    // Period 4 has K and Br in NCERT's two tables, but no single printed radius trend.
    const row = explorerSeries('radius', { period: 4 })
    expect(emptyMessage('radius', { kind: 'period', n: 4 }, row)).toContain('periods 2 and 3')
    expect(radiusTrendPrinted({ kind: 'group', n: 17 })).toBe(true)
    expect(radiusTrendPrinted({ kind: 'group', n: 2 })).toBe(false)
  })

  it('returns null when the row can be drawn', () => {
    const row = explorerSeries('radius', { period: 2 })
    expect(emptyMessage('radius', { kind: 'period', n: 2 }, row)).toBeNull()
  })
})

describe('readoutFor', () => {
  it('asks for a selection when none is made', () => {
    expect(readoutFor('ionization', null, [])).toContain('click a period number')
  })

  it('states the NCERT direction across a period and the first and last values', () => {
    const series = explorerSeries('ionization', { period: 3 })
    const text = readoutFor('ionization', { kind: 'period', n: 3 }, series)
    expect(text).toContain('First ionization enthalpy along period 3')
    expect(text).toContain('Na 496')
    expect(text).toContain('Across a period it increases.')
  })

  it('does not read out radii for rows NCERT does not print', () => {
    const series = explorerSeries('radius', { period: 4 })
    expect(readoutFor('radius', { kind: 'period', n: 4 }, series)).toContain('NCERT prints no radius trend')
  })

  it('states the direction down a group for a column', () => {
    const series = explorerSeries('gainEnthalpy', { group: 17 })
    const text = readoutFor('gainEnthalpy', { kind: 'group', n: 17 }, series)
    expect(text).toContain('Down a group it becomes less negative.')
    expect(text).toContain('F −328')
  })
})
