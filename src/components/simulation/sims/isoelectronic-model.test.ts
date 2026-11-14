import { describe, expect, it } from 'vitest'
import { protonRange, protonToElectronRatio, speciesFor } from './isoelectronic-model'

describe('speciesFor(10)', () => {
  const list = speciesFor(10)

  it('lists O²⁻, F⁻, Ne, Na⁺, Mg²⁺ in Z order', () => {
    expect(list.map((s) => s.label)).toEqual(['O²⁻', 'F⁻', 'Ne', 'Na⁺', 'Mg²⁺'])
    expect(list.map((s) => s.Z)).toEqual([8, 9, 10, 11, 12])
  })

  it('keeps every species at 10 electrons', () => {
    expect(list.every((s) => s.electrons === 10)).toBe(true)
  })

  it('uses NCERT for F⁻ and Na⁺, and Shannon for O²⁻', () => {
    const byLabel = Object.fromEntries(list.map((s) => [s.label, s]))
    expect(byLabel['F⁻'].radius).toMatchObject({ pm: 136, source: 'ncert-text' })
    expect(byLabel['Na⁺'].radius).toMatchObject({ pm: 95, source: 'ncert-text' })
    expect(byLabel['O²⁻'].radius).toMatchObject({ pm: 140, source: 'shannon-cn6' })
  })

  it('marks neon as estimated for drawing only, between F⁻ and Na⁺', () => {
    const ne = list.find((s) => s.label === 'Ne')!
    expect(ne.radius.pm).toBeNull()
    expect(ne.estimated).toBe(true)
    expect(ne.drawnPm).toBeCloseTo((136 + 95) / 2, 6)
  })

  it('draws the tabulated species at their tabulated sizes', () => {
    const na = list.find((s) => s.label === 'Na⁺')!
    expect(na.estimated).toBe(false)
    expect(na.drawnPm).toBe(95)
  })

  it('shrinks the drawn size as Z rises, across the whole 10-electron set', () => {
    const drawn = list.map((s) => s.drawnPm as number)
    for (let i = 1; i < drawn.length; i++) expect(drawn[i]).toBeLessThan(drawn[i - 1])
  })
})

describe('series with no tabulated radius', () => {
  it('draws no size for 18 electrons, since this module has no tabulated value for that series', () => {
    const list = speciesFor(18)
    expect(list.every((s) => s.drawnPm === null)).toBe(true)
  })

  it('still has the Ar species and its Z over electron ratio', () => {
    const ar = speciesFor(18).find((s) => s.label === 'Ar')!
    expect(ar.radius).toMatchObject({ pm: null, source: 'noble-gas' })
  })
})

describe('protonToElectronRatio', () => {
  it('gives 0.9 for F⁻ and 1.1 for Na⁺ at 10 electrons', () => {
    expect(protonToElectronRatio(9, 10)).toBeCloseTo(0.9, 6)
    expect(protonToElectronRatio(11, 10)).toBeCloseTo(1.1, 6)
  })

  it('rejects non-integer or non-positive inputs', () => {
    expect(() => protonToElectronRatio(0, 10)).toThrow(RangeError)
    expect(() => protonToElectronRatio(9, 2.5)).toThrow(RangeError)
  })
})

describe('protonRange', () => {
  it('spans the window for each electron count', () => {
    expect(protonRange(2)).toEqual({ min: 2, max: 4 })
    expect(protonRange(10)).toEqual({ min: 8, max: 12 })
    expect(protonRange(18)).toEqual({ min: 16, max: 20 })
  })
})
