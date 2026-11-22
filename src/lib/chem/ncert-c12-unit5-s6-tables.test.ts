import { describe, expect, it } from 'vitest'
import {
  NCERT_SPECTROCHEMICAL_SERIES,
  OCTAHEDRAL_EG_COUNT,
  OCTAHEDRAL_EG_SHIFT,
  OCTAHEDRAL_T2G_COUNT,
  OCTAHEDRAL_T2G_SHIFT,
  TETRAHEDRAL_E_COUNT,
  TETRAHEDRAL_E_SHIFT,
  TETRAHEDRAL_T2_COUNT,
  TETRAHEDRAL_T2_SHIFT,
  fieldType,
  octahedralConfig,
  tetrahedralConfig,
  tetrahedralLevelEnergies,
  tetrahedralSplitting,
} from './ncert-c12-unit5-s6-tables'

describe('NCERT Unit 5 s5.5.4 tables', () => {
  it('has the 15-ligand spectrochemical series in printed order', () => {
    expect(NCERT_SPECTROCHEMICAL_SERIES).toHaveLength(15)
    expect(NCERT_SPECTROCHEMICAL_SERIES[0].formula).toBe('I⁻')
    expect(NCERT_SPECTROCHEMICAL_SERIES[14].formula).toBe('CO')
    const f = NCERT_SPECTROCHEMICAL_SERIES.map((l) => l.formula)
    expect(f.indexOf('H₂O')).toBeLessThan(f.indexOf('NH₃'))
    expect(f.indexOf('en')).toBeLessThan(f.indexOf('CN⁻'))
  })
  it('keeps the barycentre: 3 x t2g shift + 2 x eg shift = 0', () => {
    expect(OCTAHEDRAL_T2G_COUNT * OCTAHEDRAL_T2G_SHIFT + OCTAHEDRAL_EG_COUNT * OCTAHEDRAL_EG_SHIFT).toBeCloseTo(0)
  })
  it('Δt = 4/9 Δo', () => {
    expect(tetrahedralSplitting(9)).toBeCloseTo(4)
  })
  it('fills d4 as t2g3 eg1 (weak) or t2g4 eg0 (strong)', () => {
    expect(octahedralConfig(4, false)).toMatchObject({ t2g: 3, eg: 1, unpaired: 4 })
    expect(octahedralConfig(4, true)).toMatchObject({ t2g: 4, eg: 0, unpaired: 2 })
  })
  it('d6 and d7 and d5 counts', () => {
    expect(octahedralConfig(5, false).unpaired).toBe(5)
    expect(octahedralConfig(5, true).unpaired).toBe(1)
    expect(octahedralConfig(6, false).unpaired).toBe(4)
    expect(octahedralConfig(6, true).unpaired).toBe(0)
    expect(octahedralConfig(7, false).unpaired).toBe(3)
    expect(octahedralConfig(7, true).unpaired).toBe(1)
  })
  it('d1-d3 and d8-d10 do not depend on field', () => {
    for (const d of [0, 1, 2, 3, 8, 9, 10]) {
      expect(octahedralConfig(d, true)).toEqual(octahedralConfig(d, false))
    }
    expect(octahedralConfig(8, false)).toMatchObject({ t2g: 6, eg: 2, unpaired: 2 })
    expect(octahedralConfig(9, false).unpaired).toBe(1)
  })
  it('classifies field by Δo against P', () => {
    expect(fieldType(10, 20)).toBe('weak')
    expect(fieldType(30, 20)).toBe('strong')
  })
  it('keeps the tetrahedral barycentre: 2 x e shift + 3 x t2 shift = 0', () => {
    expect(TETRAHEDRAL_E_COUNT * TETRAHEDRAL_E_SHIFT + TETRAHEDRAL_T2_COUNT * TETRAHEDRAL_T2_SHIFT).toBeCloseTo(0)
    expect(tetrahedralLevelEnergies()).toEqual({ e: -3 / 5, t2: 2 / 5 })
  })
  it('fills tetrahedral levels high spin by Hund rule', () => {
    expect(tetrahedralConfig(2)).toMatchObject({ e: 2, t2: 0, unpaired: 2 })
    expect(tetrahedralConfig(3)).toMatchObject({ e: 2, t2: 1, unpaired: 3 })
    expect(tetrahedralConfig(5)).toMatchObject({ e: 2, t2: 3, unpaired: 5 })
    expect(tetrahedralConfig(6)).toMatchObject({ e: 3, t2: 3, unpaired: 4 })
    expect(tetrahedralConfig(7)).toMatchObject({ e: 4, t2: 3, unpaired: 3 })
    expect(tetrahedralConfig(10)).toMatchObject({ e: 4, t2: 6, unpaired: 0 })
  })
})
