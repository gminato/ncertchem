import { describe, expect, it } from 'vitest'
import { ncertAtomRadiusPm, radiusFromSeparation, speciesRadius } from './ionic-radii'
import { slaterZeff } from './periodic-data'

describe('NCERT-printed radii', () => {
  it('reads Table 3.6 atomic radii', () => {
    expect(ncertAtomRadiusPm('Li')).toBe(152)
    expect(ncertAtomRadiusPm('F')).toBe(64)
    expect(ncertAtomRadiusPm('Na')).toBe(186)
    expect(ncertAtomRadiusPm('Cs')).toBe(262)
    expect(ncertAtomRadiusPm('Mg')).toBe(160)
  })

  it('reads the ionic radii printed in the text', () => {
    expect(speciesRadius(9, 'F', -1)).toMatchObject({ pm: 136, source: 'ncert-text' })
    expect(speciesRadius(11, 'Na', 1)).toMatchObject({ pm: 95, source: 'ncert-text' })
  })

  it('treats noble gases as having no ionic or atomic radius', () => {
    expect(speciesRadius(10, 'Ne', 0)).toMatchObject({ pm: null, source: 'noble-gas' })
  })

  it('reports untabulated species without inventing a value', () => {
    expect(speciesRadius(17, 'Cl', -1)).toMatchObject({ pm: null, source: 'untabulated' })
  })
})

describe('half-separation radii (NCERT 3.7.1(a))', () => {
  it('halves the Cl–Cl bond length of 198 pm to 99 pm', () => {
    expect(radiusFromSeparation(198)).toBe(99)
  })

  it('halves the Cu–Cu spacing of 256 pm to 128 pm', () => {
    expect(radiusFromSeparation(256)).toBe(128)
  })

  it('halves an invented bond of 232 pm to 116 pm', () => {
    expect(radiusFromSeparation(232)).toBe(116)
  })

  it('rejects non-positive separations', () => {
    expect(() => radiusFromSeparation(0)).toThrow(RangeError)
    expect(() => radiusFromSeparation(Number.NaN)).toThrow(RangeError)
  })
})

describe('Slater effective nuclear charge across period 2 and 3', () => {
  it('gives values that rise across each period', () => {
    const period2 = [3, 4, 5, 6, 7, 8, 9].map((Z) => slaterZeff(Z))
    const period3 = [11, 12, 13, 14, 15, 16, 17].map((Z) => slaterZeff(Z))
    for (const series of [period2, period3]) {
      series.forEach((v, i) => {
        if (i > 0) expect(v).toBeGreaterThan(series[i - 1])
      })
    }
  })

  it('matches the hand Slater values quoted in the Prose (Li 1.30, F 5.20, Na 2.20, Cl 6.10)', () => {
    expect(slaterZeff(3)).toBeCloseTo(1.3, 2)
    expect(slaterZeff(9)).toBeCloseTo(5.2, 2)
    expect(slaterZeff(11)).toBeCloseTo(2.2, 2)
    expect(slaterZeff(17)).toBeCloseTo(6.1, 2)
  })
})
