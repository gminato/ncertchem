import { describe, expect, it } from 'vitest'
import {
  electronCountOf,
  iupacName,
  iupacSymbol,
  isoelectronicSeries,
  locateElement,
  oxideNature,
  trendSeries,
} from './periodicity'
import { NCERT_TABLE_3_5_Z101_118 } from './ncert-unit3-tables'

const DOUBLED_LETTER_NOTE: Record<number, string> = {
  110: 'Ununnillium',
  111: 'Unununnium',
}

function collapseDoubles(s: string): string {
  return s.toLowerCase().replace(/(.)\1/g, '$1')
}

describe('iupacName and iupacSymbol (NCERT Table 3.4, Table 3.5, Problem 3.1)', () => {
  it('builds the systematic names NCERT gives for 101, 102 and 103', () => {
    expect(iupacName(101)).toBe('unnilunium')
    expect(iupacSymbol(101)).toBe('Unu')
    expect(iupacName(102)).toBe('unnilbium')
    expect(iupacName(103)).toBe('unniltrium')
  })

  it('gives unbinilium Ubn for Z = 120 (NCERT Problem 3.1)', () => {
    expect(iupacName(120)).toBe('unbinilium')
    expect(iupacSymbol(120)).toBe('Ubn')
  })

  it('gives ununquadium for 114 and ununoctium for 118', () => {
    expect(iupacName(114)).toBe('ununquadium')
    expect(iupacSymbol(114)).toBe('Uuq')
    expect(iupacName(118)).toBe('ununoctium')
    expect(iupacSymbol(118)).toBe('Uuo')
  })

  it('reproduces every symbol of NCERT Table 3.5 for Z = 101 to 118', () => {
    for (const row of NCERT_TABLE_3_5_Z101_118.rows) {
      expect(iupacSymbol(row.Z), `symbol of ${row.Z}`).toBe(row.systematicSymbol.charAt(0).toUpperCase() + row.systematicSymbol.slice(1).toLowerCase())
    }
  })

  it('reproduces every name of NCERT Table 3.5 for Z = 101 to 118', () => {
    for (const row of NCERT_TABLE_3_5_Z101_118.rows) {
      const expected = row.systematicName.toLowerCase()
      if (DOUBLED_LETTER_NOTE[row.Z]) {
        // NCERT prints doubled consonants for 110 and 111; the rule gives single ones.
        expect(collapseDoubles(iupacName(row.Z)), `name of ${row.Z}`).toBe(collapseDoubles(expected))
      } else {
        expect(iupacName(row.Z), `name of ${row.Z}`).toBe(expected)
      }
    }
  })

  it('rejects Z outside 100..999', () => {
    expect(() => iupacName(99)).toThrow(RangeError)
    expect(() => iupacSymbol(1000)).toThrow(RangeError)
  })
})

describe('locateElement (NCERT Problems 3.1 and 3.3)', () => {
  it('locates Na in period 3, group 1, s-block', () => {
    expect(locateElement(11)).toEqual({ period: 3, group: 1, block: 's', predicted: false })
  })

  it('locates Fe in period 4, group 8, d-block', () => {
    expect(locateElement(26)).toEqual({ period: 4, group: 8, block: 'd', predicted: false })
  })

  it('locates Ce (Z = 58) in period 6 as an f-block element', () => {
    expect(locateElement(58)).toMatchObject({ period: 6, group: null, block: 'f' })
  })

  it('locates Z = 114 in period 7, group 14, p-block', () => {
    expect(locateElement(114)).toMatchObject({ period: 7, group: 14, block: 'p' })
  })

  it('locates Z = 117 in group 17 (halogens, NCERT Problem 3.3)', () => {
    expect(locateElement(117)).toMatchObject({ period: 7, group: 17, block: 'p' })
  })

  it('predicts Z = 120 in period 8, group 2, s-block', () => {
    expect(locateElement(120)).toEqual({ period: 8, group: 2, block: 's', predicted: true })
  })

  it('rejects Z outside 1..120', () => {
    expect(() => locateElement(0)).toThrow(RangeError)
    expect(() => locateElement(121)).toThrow(RangeError)
  })
})

describe('electronCountOf and isoelectronicSeries (NCERT section 3.7.1(b))', () => {
  it('counts electrons as Z minus charge', () => {
    expect(electronCountOf(8, -2)).toBe(10)
    expect(electronCountOf(13, 3)).toBe(10)
  })

  it('rejects a negative electron count and non-integer charge', () => {
    expect(() => electronCountOf(1, 2)).toThrow(RangeError)
    expect(() => electronCountOf(8, 1.5)).toThrow(RangeError)
  })

  it('lists the 10-electron species N³⁻ to Al³⁺ in Z order', () => {
    const series = isoelectronicSeries(10)
    expect(series.map((s) => s.symbol)).toEqual(['N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al'])
    expect(series.map((s) => s.label)).toEqual(['N³⁻', 'O²⁻', 'F⁻', 'Ne', 'Na⁺', 'Mg²⁺', 'Al³⁺'])
  })

  it('rejects a non-integer electron count', () => {
    expect(() => isoelectronicSeries(-1)).toThrow(RangeError)
  })
})

describe('trendSeries', () => {
  it('returns NCERT Table 3.6(a) radii for period 2, Li to F', () => {
    const series = trendSeries('atomicRadiusPm', { period: 2 }, 'ncert')
    expect(series.map((p) => p.value)).toEqual([152, 111, 88, 77, 74, 66, 64, null])
  })

  it('returns NCERT Table 3.6(b) radii for group 1 with null for H', () => {
    const series = trendSeries('atomicRadiusPm', { group: 1 }, 'ncert')
    expect(series.map((p) => [p.symbol, p.value])).toEqual([
      ['H', null],
      ['Li', 152],
      ['Na', 186],
      ['K', 231],
      ['Rb', 244],
      ['Cs', 262],
      ['Fr', null],
    ])
  })

  it('returns NCERT Table 3.8(a) electronegativity for period 3', () => {
    const series = trendSeries('electronegativity', { period: 3 }, 'ncert')
    expect(series.map((p) => p.value)).toEqual([0.9, 1.2, 1.5, 1.8, 2.1, 2.5, 3.0, null])
  })

  it('returns PubChem values for period 3 with eight members', () => {
    const series = trendSeries('electronegativity', { period: 3 }, 'pubchem')
    expect(series).toHaveLength(8)
    expect(typeof series[0].value).toBe('number')
  })

  it('rejects an NCERT trend for a property NCERT does not tabulate', () => {
    expect(() => trendSeries('atomicMass', { period: 2 }, 'ncert')).toThrow(RangeError)
  })

  it('rejects invalid scopes', () => {
    expect(() => trendSeries('atomicMass', { period: 8 })).toThrow(RangeError)
    expect(() => trendSeries('atomicMass', { group: 0 })).toThrow(RangeError)
  })
})

describe('oxideNature (NCERT section 3.7.3)', () => {
  it('classifies Na2O as basic, Al2O3 as amphoteric, Cl2O7 as acidic', () => {
    expect(oxideNature('Na2O')).toBe('basic')
    expect(oxideNature('Al2O3')).toBe('amphoteric')
    expect(oxideNature('Cl2O7')).toBe('acidic')
  })

  it('classifies CO, NO and N2O as neutral', () => {
    expect(oxideNature('CO')).toBe('neutral')
    expect(oxideNature('NO')).toBe('neutral')
    expect(oxideNature('N2O')).toBe('neutral')
  })

  it('rejects an oxide that is not in the lookup', () => {
    expect(() => oxideNature('Xe2O')).toThrow(RangeError)
  })
})

describe('iupacName elision of enn before nil', () => {
  it('drops one n: 190 is unennilium and 900 is ennilnilium', () => {
    expect(iupacName(190)).toBe('unennilium')
    expect(iupacName(900)).toBe('ennilnilium')
    expect(iupacName(199)).toBe('unennennium')
  })
})
