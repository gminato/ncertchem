import { describe, expect, it } from 'vitest'
import { NCERT_ALLOY_FACTS } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  APPLICATION_STEPS,
  copperPotentialLabel,
  metallicRadiusPm,
  overallEquation,
  radiusDifferencePercent,
  titaniumIVdCount,
  zieglerRepresentative,
} from './applications-steps'

describe('Section 11 Scrolly Steps', () => {
  it('has six Steps, each with a strip highlight and a property caption', () => {
    expect(APPLICATION_STEPS).toHaveLength(6)
    for (const s of APPLICATION_STEPS) {
      expect(s.highlight.length).toBeGreaterThan(0)
      expect(s.property.length).toBeGreaterThan(10)
    }
  })

  it('reads the Table 4.2 radii the prose quotes', () => {
    expect([metallicRadiusPm('Fe'), metallicRadiusPm('Cr'), metallicRadiusPm('Mn'), metallicRadiusPm('Ni')]).toEqual([
      126, 129, 137, 125,
    ])
  })

  it('keeps every alloy metal within the lib radius similarity', () => {
    for (const sym of ['Cr', 'Mn', 'Ni']) {
      expect(radiusDifferencePercent(sym)).toBeLessThanOrEqual(NCERT_ALLOY_FACTS.radiusSimilarityPercent)
    }
  })

  it('shows the copper potential as +0.34 V', () => {
    expect(copperPotentialLabel()).toBe('+0.34 V')
  })

  it('takes the Contact, Haber and Wacker equations from the lib (Wacker: ethene)', () => {
    expect(overallEquation('Contact process')).toBe('2SO₂ + O₂ → 2SO₃')
    expect(overallEquation('Haber process')).toBe('N₂ + 3H₂ → 2NH₃')
    expect(overallEquation('Wacker process')).toContain('C₂H₄')
  })

  it('gives the representative Ziegler equation and an empty d set for Ti⁴⁺', () => {
    expect(zieglerRepresentative()).toContain('CH₂=CH₂')
    expect(titaniumIVdCount()).toBe(0)
  })
})
