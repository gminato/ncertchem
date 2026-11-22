import { describe, expect, it } from 'vitest'
import {
  FIG_4_2_ATOMISATION_APPROX_KJ,
  HEAVY_SERIES_METALLIC_RADII_PM,
  SERIES_MELTING_POINTS_K,
  SERIES_MEMBERS,
  kelvinToCelsius,
} from './dblock-series-data'
import { NCERT_FIRST_SERIES_PROPERTIES, NCERT_SENTENCE_FACTS } from './ncert-c12-unit4-tables'

describe('dblock series data', () => {
  it('has ten values per series, in group order', () => {
    for (const s of ['4d', '5d'] as const) {
      expect(HEAVY_SERIES_METALLIC_RADII_PM[s]).toHaveLength(10)
      expect(FIG_4_2_ATOMISATION_APPROX_KJ[s]).toHaveLength(10)
    }
    for (const s of ['3d', '4d', '5d'] as const) expect(SERIES_MELTING_POINTS_K[s]).toHaveLength(10)
    expect(SERIES_MEMBERS['3d']).toEqual(NCERT_FIRST_SERIES_PROPERTIES.map((r) => r.symbol))
  })

  it('agrees with NCERT on Zr and Hf (lanthanoid contraction)', () => {
    expect(HEAVY_SERIES_METALLIC_RADII_PM['4d'][1]).toBe(NCERT_SENTENCE_FACTS.zrRadiusPm)
    expect(HEAVY_SERIES_METALLIC_RADII_PM['5d'][1]).toBe(NCERT_SENTENCE_FACTS.hfRadiusPm)
  })

  it('shows 4d and 5d atomisation above 3d in mid-series, as NCERT states', () => {
    const d3 = NCERT_FIRST_SERIES_PROPERTIES.map((r) => r.atomisationKJ)
    for (const i of [2, 3, 4, 5]) {
      expect(FIG_4_2_ATOMISATION_APPROX_KJ['4d'][i]).toBeGreaterThan(d3[i])
      expect(FIG_4_2_ATOMISATION_APPROX_KJ['5d'][i]).toBeGreaterThan(d3[i])
    }
  })

  it('has tungsten as the highest melting point and mercury below 0 °C', () => {
    const all = [...SERIES_MELTING_POINTS_K['3d'], ...SERIES_MELTING_POINTS_K['4d'], ...SERIES_MELTING_POINTS_K['5d']]
    expect(Math.max(...all)).toBe(SERIES_MELTING_POINTS_K['5d'][3])
    expect(kelvinToCelsius(SERIES_MELTING_POINTS_K['5d'][9])).toBeLessThan(0)
  })
})
