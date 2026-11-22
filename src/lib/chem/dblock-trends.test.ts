import { describe, expect, it } from 'vitest'
import { extremes, formatTrendValue, interiorMinimum, pointReading, seriesFor, shapeNote, trendPoints } from './dblock-trends'

describe('melting points (PubChem, converted to °C)', () => {
  it('peaks at V in 3d, Mo in 4d and W in 5d', () => {
    expect(extremes(trendPoints('melting', '3d'), 'max')?.symbols).toEqual(['V'])
    expect(extremes(trendPoints('melting', '4d'), 'max')?.symbols).toEqual(['Mo'])
    expect(extremes(trendPoints('melting', '5d'), 'max')?.symbols).toEqual(['W'])
  })
  it('gives the group 12 ends in whole degrees', () => {
    const hg = trendPoints('melting', '5d').at(-1)
    expect(hg).toMatchObject({ symbol: 'Hg', value: -39 })
    expect(trendPoints('melting', '3d').at(-1)?.value).toBe(420)
    expect(formatTrendValue('melting', -39)).toBe('−39 °C')
  })
})

describe('enthalpy of atomisation', () => {
  it('uses Table 4.2 for 3d (peak V 515, interior dip Mn 281)', () => {
    const pts = trendPoints('atomisation', '3d')
    expect(extremes(pts, 'max')).toEqual({ value: 515, symbols: ['V'] })
    expect(interiorMinimum(pts)).toMatchObject({ symbol: 'Mn', value: 281 })
    expect(pts.every((p) => !p.approx)).toBe(true)
  })
  it('marks 4d and 5d values as approximate', () => {
    const pts = [...trendPoints('atomisation', '4d'), ...trendPoints('atomisation', '5d')]
    expect(pts.length).toBe(20)
    expect(pts.every((p) => p.approx)).toBe(true)
    expect(extremes(trendPoints('atomisation', '5d'), 'max')?.symbols).toEqual(['W'])
  })
  it('prints approximate values with ≈', () => {
    const cd = trendPoints('atomisation', '4d').at(-1)!
    expect(pointReading('atomisation', cd)).toContain('≈ 110 kJ mol⁻¹')
  })
})

describe('metallic radius', () => {
  it('floors at Co and Ni in 3d and matches Zr and Hf', () => {
    expect(extremes(trendPoints('radius', '3d'), 'min')?.symbols).toEqual(['Co', 'Ni'])
    expect(trendPoints('radius', '4d')[1]).toMatchObject({ symbol: 'Zr', value: 160 })
    expect(trendPoints('radius', '5d')[1]).toMatchObject({ symbol: 'Hf', value: 159 })
  })
})

describe('density', () => {
  it('is 3d only, V to Zn, with no Sc or Ti', () => {
    expect(seriesFor('density')).toEqual(['3d'])
    const pts = trendPoints('density', '3d')
    expect(pts.map((p) => p.symbol)).toEqual(['V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
    expect(extremes(pts, 'max')?.symbols).toEqual(['Ni', 'Cu'])
  })
  it('formats two decimals', () => {
    expect(formatTrendValue('density', 6.07)).toBe('6.07 g cm⁻³')
  })
})

describe('shape notes', () => {
  it('names the middle maxima and the radius floor from the data', () => {
    expect(shapeNote('melting', ['3d', '4d', '5d'])).toContain('V (3d, 1910 °C)')
    expect(shapeNote('radius', ['3d', '4d', '5d'])).toContain('Co and Ni')
    expect(shapeNote('radius', ['3d', '4d', '5d'])).toContain('5d ≈ 4d')
    expect(shapeNote('atomisation', ['3d'])).toContain('dips at Mn')
  })
  it('asks for a series when none is chosen', () => {
    expect(shapeNote('melting', [])).toBe('Choose at least one series to plot.')
  })
})

describe('readout wording', () => {
  it('names the Mn and Tc melting dips in the melting shape note', () => {
    expect(shapeNote('melting', ['3d', '4d', '5d'])).toContain('apart from the dips at Mn (3d) and Tc (4d)')
  })
  it('prints density with Table 4.2 precision and no trailing zero', () => {
    expect(formatTrendValue('density', 8.9)).toBe('8.9 g cm⁻³')
    expect(formatTrendValue('density', 7.1)).toBe('7.1 g cm⁻³')
  })
})
