import { describe, expect, it } from 'vitest'
import { atomicVolumeCurve, densityGcm3, solidMolarVolumeCm3 } from './solid-density'

describe('densityGcm3', () => {
  it('reads the PubChem density for solids', () => {
    expect(densityGcm3(13)).toBeCloseTo(2.7, 6) // aluminium
    expect(densityGcm3(55)).toBeCloseTo(1.93, 6) // caesium
  })

  it('returns a value for gases too, which the curve then excludes', () => {
    expect(densityGcm3(1)).toBeGreaterThan(0)
  })
})

describe('solidMolarVolumeCm3', () => {
  it('divides the atomic mass by the density', () => {
    expect(solidMolarVolumeCm3(13)).toBeCloseTo(26.981538 / 2.7, 6) // aluminium
  })

  it('returns null for gases and liquids', () => {
    expect(solidMolarVolumeCm3(2)).toBeNull() // helium
    expect(solidMolarVolumeCm3(35)).toBeNull() // bromine, a liquid
  })
})

describe('atomicVolumeCurve', () => {
  const curve = atomicVolumeCurve()
  const bySymbol = new Map(curve.map((p) => [p.symbol, p]))

  it('is sorted by atomic mass and holds only solids', () => {
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].atomicMass).toBeGreaterThanOrEqual(curve[i - 1].atomicMass)
    }
    expect(bySymbol.has('Br')).toBe(false)
    expect(bySymbol.has('Kr')).toBe(false)
  })

  it('peaks at each alkali metal, as Lothar Meyer observed', () => {
    const volumeOf = (s: string) => bySymbol.get(s)?.volumeCm3 ?? NaN
    for (const [before, alkali, after] of [
      ['Be', 'Na', 'Mg'],
      ['Ca', 'K', 'Sc'],
      ['Sr', 'Rb', 'Y'],
    ] as const) {
      expect(volumeOf(alkali)).toBeGreaterThan(volumeOf(before))
      expect(volumeOf(alkali)).toBeGreaterThan(volumeOf(after))
    }
  })
})
