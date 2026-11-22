import { describe, expect, it } from 'vitest'
import { DEFAULT_PICKS, contractionSeries, lanthanoidEntries, lanthanoidEntry, reactionOptions } from './lanthanoid-explorer'

describe('lanthanoidEntries', () => {
  const entries = lanthanoidEntries()

  it('lists La to Lu in Table 4.9 order', () => {
    expect(entries.map((e) => e.symbol)).toEqual([
      'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
    ])
  })

  it('takes atom and Ln³⁺ configurations from Table 4.9 with the [Xe] core', () => {
    const ce = lanthanoidEntry('Ce')
    expect(ce.atomDisplay).toBe('[Xe] 4f¹5d¹6s²')
    expect(ce.ion3Display).toBe('[Xe] 4f¹')
    const la = lanthanoidEntry('La')
    expect(la.ion3Display).toBe('[Xe] 4f⁰')
    expect(lanthanoidEntry('Lu').atomDisplay).toBe('[Xe] 4f¹⁴5d¹6s²')
  })

  it('gives f count = Z − 57 for the +3 state', () => {
    for (const e of entries) {
      expect(e.states[0].fCount).toBe(e.Z - 57)
      expect(e.states[0].characteristic).toBe(true)
      expect(e.states[0].charge).toBe(3)
    }
  })

  it('reports the Ln³⁺ radius and leaves Lu without one', () => {
    expect(lanthanoidEntry('La').radiusPm).toBe(106)
    expect(lanthanoidEntry('Ce').radiusPm).toBe(103)
    expect(lanthanoidEntry('Yb').radiusPm).toBe(86)
    expect(lanthanoidEntry('Lu').radiusPm).toBeNull()
  })

  it('adds the special +2 and +4 states with their f-count reasons', () => {
    const ce = lanthanoidEntry('Ce')
    expect(ce.states.map((s) => s.ion)).toEqual(['Ce³⁺', 'Ce⁴⁺'])
    expect(ce.states[1].fLabel).toBe('f⁰')
    const eu = lanthanoidEntry('Eu')
    expect(eu.states.map((s) => s.ion)).toEqual(['Eu³⁺', 'Eu²⁺'])
    expect(eu.states[1].fCount).toBe(7)
    expect(lanthanoidEntry('Tb').states.find((s) => s.charge === 4)?.fCount).toBe(7)
    expect(lanthanoidEntry('Yb').states.find((s) => s.charge === 2)?.fCount).toBe(14)
    expect(lanthanoidEntry('Pr').states.map((s) => s.ion)).toEqual(['Pr³⁺', 'Pr⁴⁺'])
    expect(lanthanoidEntry('Pr').states[1].oxidesOnly).toBe(true)
    const sm = lanthanoidEntry('Sm')
    expect(sm.states.map((s) => [s.ion, s.fCount])).toEqual([['Sm³⁺', 5], ['Sm²⁺', 6]])
    expect(sm.states[1].oxidesOnly).toBe(false)
    expect(lanthanoidEntry('Tb').states.find((s) => s.charge === 4)?.oxidesOnly).toBe(true)
    expect(lanthanoidEntry('Eu').states[1].oxidesOnly).toBe(false)
  })

  it('keeps every display string free of caret and underscore notation', () => {
    for (const e of entries) {
      const text = [e.atomDisplay, e.ion3Display, e.ion3, ...e.states.flatMap((s) => [s.ion, s.fLabel, s.reason])]
      for (const t of text) expect(t).not.toMatch(/[\^_]/)
    }
  })

  it('throws for a symbol that is not a lanthanoid', () => {
    expect(() => lanthanoidEntry('Fe')).toThrow(RangeError)
  })
})

describe('contractionSeries', () => {
  it('runs from La to Yb, one point per element, with no Lu point', () => {
    const series = contractionSeries()
    expect(series).toHaveLength(14)
    expect(series[0]).toEqual({ symbol: 'La', Z: 57, radiusPm: 106 })
    expect(series[series.length - 1]).toEqual({ symbol: 'Yb', Z: 70, radiusPm: 86 })
  })
})

describe('reactionOptions and defaults', () => {
  it('offers the eight generic Fig. 4.7 reactions, with the hydride having no formula', () => {
    const options = reactionOptions()
    expect(options).toHaveLength(8)
    const hydrogen = options.find((o) => o.reagent === 'H₂')
    expect(hydrogen?.products).toEqual(['hydride (NCERT gives no formula)'])
    expect(options.find((o) => o.reagent === 'O₂')?.products).toEqual(['Ln₂O₃'])
  })

  it('starts with cerium and europium selected', () => {
    expect([...DEFAULT_PICKS]).toEqual(['Ce', 'Eu'])
  })
})
