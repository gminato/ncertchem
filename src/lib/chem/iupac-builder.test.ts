import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_3_5_Z101_118 } from './ncert-unit3-tables'
import { iupacBreakdown, reconstructName } from './iupac-builder'
import { iupacName } from './periodicity'

describe('iupacBreakdown (NCERT Table 3.4 and 3.5)', () => {
  it('splits 120 into un, bi, nil and ends it with ium (NCERT Problem 3.1)', () => {
    const b = iupacBreakdown(120)
    expect(b.segments.map((s) => s.root)).toEqual(['un', 'bi', 'nil'])
    expect(b.segments.map((s) => s.abbreviation).join('')).toBe('ubn')
    expect(b.raw).toBe('unbinilium')
    expect(b.elisions).toEqual([])
    expect(b.name).toBe('unbinilium')
    expect(b.symbol).toBe('Ubn')
  })

  it('elides the i of ium after a root ending in i (103: unniltrium)', () => {
    const b = iupacBreakdown(103)
    expect(b.raw).toBe('unniltriium')
    expect(b.elisions).toEqual([{ index: 'unniltri'.length, letter: 'i', rule: 'i-of-ium' }])
    expect(reconstructName(b)).toBe('unniltrium')
    expect(b.name).toBe('unniltrium')
  })

  it('reconstructs the final name for every Z from 100 to 999, enn-nil included', () => {
    for (let Z = 100; Z <= 999; Z++) {
      const b = iupacBreakdown(Z)
      expect(reconstructName(b), `Z ${Z}`).toBe(b.name)
    }
  })

  it('agrees with Table 3.5 once doubled consonants are collapsed', () => {
    const collapse = (s: string) => s.replace(/(.)\1/g, '$1')
    for (const row of NCERT_TABLE_3_5_Z101_118.rows) {
      expect(collapse(iupacBreakdown(row.Z).name)).toBe(collapse(row.systematicName.toLowerCase()))
    }
    expect(iupacName(101)).toBe('unnilunium')
  })

  it('rejects Z outside 100 to 999', () => {
    expect(() => iupacBreakdown(99)).toThrow(RangeError)
    expect(() => iupacBreakdown(1000)).toThrow(RangeError)
  })

  it('drops one n of enn before nil (190 gives unennilium)', () => {
    const b = iupacBreakdown(190)
    expect(b.raw).toBe('unennnilium')
    expect(b.elisions).toEqual([{ index: 'unenn'.length - 1, letter: 'n', rule: 'n-of-enn' }])
    expect(reconstructName(b)).toBe('unennilium')
    expect(b.name).toBe('unennilium')
  })
})
