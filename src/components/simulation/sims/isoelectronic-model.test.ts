import { describe, expect, it } from 'vitest'
import { ELECTRON_COUNTS, protonRange, protonToElectronRatio, speciesFor } from './isoelectronic-model'

describe('speciesFor(10)', () => {
  const list = speciesFor(10)

  it('lists N³⁻ to Al³⁺ in Z order, including the noble gas Ne', () => {
    expect(list.map((s) => s.label)).toEqual(['N³⁻', 'O²⁻', 'F⁻', 'Ne', 'Na⁺', 'Mg²⁺', 'Al³⁺'])
    expect(list.map((s) => s.Z)).toEqual([7, 8, 9, 10, 11, 12, 13])
  })

  it('keeps every species at 10 electrons', () => {
    expect(list.every((s) => s.electrons === 10)).toBe(true)
  })

  it('uses the Pauling crystal radii for every ion, which match NCERT for F⁻ and Na⁺', () => {
    const byLabel = Object.fromEntries(list.map((s) => [s.label, s]))
    expect(byLabel['N³⁻'].radius).toMatchObject({ pm: 171, source: 'pauling-crystal' })
    expect(byLabel['O²⁻'].radius).toMatchObject({ pm: 140, source: 'pauling-crystal' })
    expect(byLabel['F⁻'].radius).toMatchObject({ pm: 136, source: 'pauling-crystal' })
    expect(byLabel['Na⁺'].radius).toMatchObject({ pm: 95, source: 'pauling-crystal' })
    expect(byLabel['Mg²⁺'].radius).toMatchObject({ pm: 65, source: 'pauling-crystal' })
    expect(byLabel['Al³⁺'].radius).toMatchObject({ pm: 50, source: 'pauling-crystal' })
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
})

describe('each isoelectronic series shrinks monotonically with Z', () => {
  for (const electrons of ELECTRON_COUNTS) {
    it(`has strictly decreasing drawn sizes at ${electrons} electrons`, () => {
      const drawn = speciesFor(electrons).map((s) => {
        expect(s.drawnPm).not.toBeNull()
        return s.drawnPm as number
      })
      for (let i = 1; i < drawn.length; i++) expect(drawn[i]).toBeLessThan(drawn[i - 1])
    })
  }
})

describe('every species of the three series has a drawn size', () => {
  it('gives 18 electrons real sizes from Pauling values, with Ar estimated between Cl⁻ and K⁺', () => {
    const list = speciesFor(18)
    expect(list.map((s) => s.label)).toEqual(['S²⁻', 'Cl⁻', 'Ar', 'K⁺', 'Ca²⁺'])
    expect(list.every((s) => s.drawnPm !== null)).toBe(true)
    const ar = list.find((s) => s.label === 'Ar')!
    expect(ar.estimated).toBe(true)
    expect(ar.drawnPm).toBeCloseTo((181 + 133) / 2, 6)
  })

  it('gives 2 electrons real sizes, with He estimated between H⁻ and Li⁺', () => {
    const list = speciesFor(2)
    expect(list.map((s) => s.label)).toEqual(['H⁻', 'He', 'Li⁺', 'Be²⁺'])
    expect(list.every((s) => s.drawnPm !== null)).toBe(true)
    expect(list.find((s) => s.label === 'He')!.drawnPm).toBeCloseTo((208 + 60) / 2, 6)
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
    expect(protonRange(2)).toEqual({ min: 1, max: 4 })
    expect(protonRange(10)).toEqual({ min: 7, max: 13 })
    expect(protonRange(18)).toEqual({ min: 16, max: 20 })
  })
})
