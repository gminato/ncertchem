import { describe, expect, it } from 'vitest'
import { elementByZ, elementBySymbol } from './periodic-data'
import {
  evToKjPerMol,
  explorerSeries,
  explorerValue,
  formatExplorerValue,
  gainEnthalpyFromAffinityKj,
} from './trends-explorer'

const el = (symbol: string) => {
  const found = elementBySymbol(symbol)
  if (!found) throw new Error(`no element ${symbol}`)
  return found
}

describe('evToKjPerMol', () => {
  it('converts the PubChem first ionization energy of fluorine (17.423 eV) to 1681 kJ mol⁻¹', () => {
    expect(Math.round(evToKjPerMol(17.423))).toBe(1681)
    expect(evToKjPerMol(17.423)).toBeCloseTo(1681.07, 1)
  })

  it('rejects non-finite energies', () => {
    expect(() => evToKjPerMol(Number.NaN)).toThrow(RangeError)
    expect(() => evToKjPerMol(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('gainEnthalpyFromAffinityKj', () => {
  it('reverses the sign: a positive PubChem affinity is a negative NCERT gain enthalpy', () => {
    expect(gainEnthalpyFromAffinityKj(3.617)).toBeCloseTo(-349.0, 0)
  })
})

describe('explorerValue', () => {
  it('uses NCERT ionization enthalpies for Na, Mg and Si (Problem 3.6)', () => {
    expect(explorerValue(el('Na'), 'ionization')).toEqual({ value: 496, source: 'ncert' })
    expect(explorerValue(el('Mg'), 'ionization')).toEqual({ value: 737, source: 'ncert' })
    expect(explorerValue(el('Si'), 'ionization')).toEqual({ value: 786, source: 'ncert' })
  })

  it('uses PubChem converted to kJ mol⁻¹ for other ionization enthalpies', () => {
    const f = explorerValue(el('F'), 'ionization')
    expect(f?.source).toBe('pubchem')
    expect(f?.value).toBeCloseTo(1681.07, 1)
  })

  it('uses NCERT Table 3.7 electron gain enthalpies where printed', () => {
    expect(explorerValue(el('F'), 'gainEnthalpy')).toEqual({ value: -328, source: 'ncert' })
    expect(explorerValue(el('Cl'), 'gainEnthalpy')).toEqual({ value: -349, source: 'ncert' })
    expect(explorerValue(el('Br'), 'gainEnthalpy')).toEqual({ value: -325, source: 'ncert' })
    expect(explorerValue(el('I'), 'gainEnthalpy')).toEqual({ value: -295, source: 'ncert' })
    expect(explorerValue(el('Ne'), 'gainEnthalpy')).toEqual({ value: 116, source: 'ncert' })
  })

  it('falls back to PubChem for electron gain enthalpies NCERT does not print', () => {
    const sc = explorerValue(el('Sc'), 'gainEnthalpy')
    expect(sc?.source).toBe('pubchem')
    expect(sc?.value).toBeCloseTo(-18.1, 1)
  })

  it('has no electron gain enthalpy for elements with no PubChem affinity', () => {
    expect(explorerValue(el('N'), 'gainEnthalpy')).toBeNull()
  })

  it('uses NCERT Table 3.8 electronegativities where printed, and PubChem otherwise', () => {
    expect(explorerValue(el('N'), 'electronegativity')).toEqual({ value: 3.0, source: 'ncert' })
    expect(explorerValue(el('Cs'), 'electronegativity')).toEqual({ value: 0.7, source: 'ncert' })
    const h = explorerValue(el('H'), 'electronegativity')
    expect(h?.source).toBe('pubchem')
    expect(h?.value).toBeCloseTo(2.2, 2)
  })

  it('uses NCERT Table 3.6 radii only, and never PubChem radii', () => {
    expect(explorerValue(el('Li'), 'radius')).toEqual({ value: 152, source: 'ncert' })
    expect(explorerValue(el('Cl'), 'radius')).toEqual({ value: 99, source: 'ncert' })
    expect(explorerValue(el('I'), 'radius')).toEqual({ value: 133, source: 'ncert' })
    expect(explorerValue(elementByZ(10), 'radius')).toBeNull()
    expect(elementByZ(10).atomicRadiusPm).not.toBeNull()
  })
})

describe('formatExplorerValue', () => {
  it('shows NCERT gain enthalpies with a U+2212 minus and no dagger', () => {
    expect(formatExplorerValue({ value: -328, source: 'ncert' }, 'gainEnthalpy')).toBe('−328')
    expect(formatExplorerValue({ value: 116, source: 'ncert' }, 'gainEnthalpy')).toBe('+116')
  })

  it('marks PubChem values with the dagger', () => {
    expect(formatExplorerValue({ value: -18.1, source: 'pubchem' }, 'gainEnthalpy')).toBe('−18†')
    expect(formatExplorerValue({ value: 2.2, source: 'pubchem' }, 'electronegativity')).toBe('2.20†')
  })

  it('keeps NCERT electronegativities to one decimal place', () => {
    expect(formatExplorerValue({ value: 3, source: 'ncert' }, 'electronegativity')).toBe('3.0')
  })
})

describe('explorerSeries', () => {
  it('returns period 2 in group order with values at every element', () => {
    const series = explorerSeries('ionization', { period: 2 })
    expect(series.map((p) => p.symbol)).toEqual(['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'])
    expect(series.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(series.every((p) => p.value !== null)).toBe(true)
  })

  it('shows the Be to B and N to O dips in period 2', () => {
    const series = explorerSeries('ionization', { period: 2 })
    const v = (s: string) => series.find((p) => p.symbol === s)?.value?.value as number
    expect(v('B')).toBeLessThan(v('Be'))
    expect(v('O')).toBeLessThan(v('N'))
  })

  it('returns a group column in period order, with H and Li together in group 1', () => {
    const series = explorerSeries('electronegativity', { group: 1 })
    expect(series.slice(0, 3).map((p) => p.symbol)).toEqual(['H', 'Li', 'Na'])
  })

  it('leaves radius gaps where NCERT prints nothing', () => {
    const series = explorerSeries('radius', { period: 2 })
    expect(series.find((p) => p.symbol === 'Ne')?.value).toBeNull()
    expect(series.find((p) => p.symbol === 'Li')?.value?.value).toBe(152)
  })

  it('rejects an invalid scope', () => {
    expect(() => explorerSeries('radius', { period: 8 })).toThrow(RangeError)
    expect(() => explorerSeries('radius', { group: 0 })).toThrow(RangeError)
    expect(() => explorerSeries('radius', { period: 2, group: 2 } as never)).toThrow(RangeError)
  })
})
