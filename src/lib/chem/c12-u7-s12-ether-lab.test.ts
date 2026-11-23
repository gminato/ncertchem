import { describe, expect, it } from 'vitest'
import {
  ANISOLE_EAS_REACTIONS,
  CLEAVAGE_SUBSTRATES,
  HX_REACTIVITY_ORDER,
  evaluateCleavage,
  getAnisoleEas,
} from './c12-u7-s12-ether-lab'

describe('Class 12 Unit 7 Section 7.6.3 ether lab model', () => {
  it('exposes the NCERT hydrogen halide cleavage order and all four cleavage substrates', () => {
    expect(HX_REACTIVITY_ORDER).toBe('HI > HBr > HCl')
    expect(CLEAVAGE_SUBSTRATES.map((s) => s.id)).toEqual([
      'diethyl',
      'ethyl-methyl',
      'tert-butyl-methyl',
      'anisole',
    ])
  })

  it('cleaves diethyl ether via SN2 in 1 eq and converts ethanol in excess HI', () => {
    const oneEq = evaluateCleavage('diethyl', '1eq')
    expect(oneEq.mechanismKind).toBe('SN2')
    expect(oneEq.productsText).toBe('C₂H₅I + C₂H₅OH')

    const excess = evaluateCleavage('diethyl', 'excess')
    expect(excess.productsText).toBe('2 C₂H₅I + H₂O')
    expect(excess.excessConvertsAlcohol).toBe(true)
  })

  it('cleaves ethyl methyl ether at the less substituted methyl carbon via SN2', () => {
    const oneEq = evaluateCleavage('ethyl-methyl', '1eq')
    expect(oneEq.mechanismKind).toBe('SN2')
    expect(oneEq.bondBroken).toContain('O-CH₃')
    expect(oneEq.productsText).toBe('CH₃I + CH₃CH₂OH')

    const excess = evaluateCleavage('ethyl-methyl', 'excess')
    expect(excess.productsText).toBe('CH₃I + CH₃CH₂I + H₂O')
  })

  it('reverses selectivity to SN1 for tert-butyl methyl ether', () => {
    const oneEq = evaluateCleavage('tert-butyl-methyl', '1eq')
    expect(oneEq.mechanismKind).toBe('SN1')
    expect(oneEq.productsText).toBe('(CH₃)₃C-I + CH₃OH')

    const excess = evaluateCleavage('tert-butyl-methyl', 'excess')
    expect(excess.productsText).toBe('(CH₃)₃C-I + CH₃I + H₂O')
  })

  it('cleaves anisole exclusively at O-CH3 and prevents phenol substitution even in excess HI', () => {
    const oneEq = evaluateCleavage('anisole', '1eq')
    const excess = evaluateCleavage('anisole', 'excess')
    for (const outcome of [oneEq, excess]) {
      expect(outcome.productsText).toBe('C₆H₅OH + CH₃I')
      expect(outcome.productsText).not.toContain('C₆H₅I')
      expect(outcome.arylLockNote).toContain('sp²')
      expect(outcome.excessConvertsAlcohol).toBe(false)
    }
  })

  it('provides all four NCERT anisole EAS reactions with 90% p-bromoanisole without FeBr3', () => {
    expect(ANISOLE_EAS_REACTIONS).toHaveLength(4)
    const bromo = getAnisoleEas('bromination')
    expect(bromo.noLewisAcidNeeded).toBe(true)
    expect(bromo.catalystLabel).toContain('no FeBr₃')
    expect(bromo.majorProduct).toContain('p-Bromoanisole')
    expect(bromo.majorYieldPercent).toBe(90)
    expect(bromo.minorProduct).toContain('o-Bromoanisole')

    const alkyl = getAnisoleEas('fc-alkylation')
    expect(alkyl.catalystLabel).toBe('Anhydrous AlCl₃')
    expect(alkyl.majorProduct).toBe('4-Methoxytoluene')
    expect(alkyl.minorProduct).toBe('2-Methoxytoluene')

    const acyl = getAnisoleEas('fc-acylation')
    expect(acyl.catalystLabel).toBe('Anhydrous AlCl₃')
    expect(acyl.majorProduct).toBe('4-Methoxyacetophenone')
    expect(acyl.minorProduct).toBe('2-Methoxyacetophenone')

    const nitro = getAnisoleEas('nitration')
    expect(nitro.majorProduct).toBe('4-Nitroanisole')
    expect(nitro.minorProduct).toBe('2-Nitroanisole')
  })
})
