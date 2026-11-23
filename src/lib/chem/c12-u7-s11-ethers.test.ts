import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import {
  BOILING_GAP_ALCOHOL_VS_ETHER_K,
  DEHYDRATION_ALCOHOL_OPTIONS,
  ETHER_ANGLE_DEG,
  ETHER_CO_LENGTH_PM,
  PHYSICAL_PROPERTY_RECORDS,
  WILLIAMSON_HALIDES,
  WILLIAMSON_NUCLEOPHILES,
  evaluateDehydration,
  evaluateWilliamson,
  getPhysicalPropertyRecord,
} from './c12-u7-s11-ethers'

describe('S11 Ether synthesis model', () => {
  it('reproduces NCERT temperature branching for 1° ethanol dehydration', () => {
    const low = evaluateDehydration('ethanol', 413)
    expect(low.pathway).toBe('SN2 Substitution')
    expect(low.isEtherSuccess).toBe(true)
    expect(low.majorProductName).toBe('Ethoxyethane')
    expect(low.majorProductFormula).toBe('C₂H₅OC₂H₅')
    expect(low.byProducts).toBe('H₂O')

    const high = evaluateDehydration('ethanol', 443)
    expect(high.pathway).toBe('Elimination')
    expect(high.isEtherSuccess).toBe(false)
    expect(high.majorProductName).toBe('Ethene')
    expect(high.majorProductFormula).toBe('CH₂=CH₂')
  })

  it('flags mixed 1° alcohols as a 3-ether mixture at 413 K and unsuitable at 443 K', () => {
    const mixLow = evaluateDehydration('mixture', 413)
    expect(mixLow.pathway).toBe('Mixed Ethers (SN2)')
    expect(mixLow.isEtherSuccess).toBe(false)
    expect(mixLow.mixedProducts?.map((p) => p.formula)).toEqual([
      'CH₃OCH₃',
      'CH₃OC₂H₅',
      'C₂H₅OC₂H₅',
    ])

    const mixHigh = evaluateDehydration('mixture', 443)
    expect(mixHigh.isEtherSuccess).toBe(false)
    expect(mixHigh.pathway).toBe('Elimination & Mixed Side-Products')
  })

  it('predicts elimination to alkenes for 2° and 3° alcohol dehydration at both temperatures', () => {
    for (const temp of [413, 443] as const) {
      const sec = evaluateDehydration('propan-2-ol', temp)
      expect(sec.pathway).toBe('Elimination')
      expect(sec.isEtherSuccess).toBe(false)
      expect(sec.majorProductName).toBe('Propene')

      const tert = evaluateDehydration('tert-butanol', temp)
      expect(tert.pathway).toBe('Elimination')
      expect(tert.isEtherSuccess).toBe(false)
      expect(tert.majorProductName).toBe('2-Methylpropene')
    }
  })

  it('reproduces NCERT Williamson SN2 success vs 3° halide elimination pitfall', () => {
    const success = evaluateWilliamson('tert-butoxide', 'CH3-Br')
    expect(success.pathway).toBe('SN2 Substitution')
    expect(success.isEtherSuccess).toBe(true)
    expect(success.majorProductFormula).toBe('(CH₃)₃C–O–CH₃')
    expect(success.byProducts).toBe('NaBr')

    const pitfall = evaluateWilliamson('methoxide', '(CH3)3C-Br')
    expect(pitfall.pathway).toBe('Elimination')
    expect(pitfall.isEtherSuccess).toBe(false)
    expect(pitfall.majorProductName).toBe('2-Methylpropene')
    expect(pitfall.byProducts).toBe('NaBr + CH₃OH')

    const anisole = evaluateWilliamson('phenoxide', 'CH3-Br')
    expect(anisole.pathway).toBe('SN2 Substitution')
    expect(anisole.isEtherSuccess).toBe(true)
    expect(anisole.majorProductName).toBe('Methoxybenzene')
    expect(anisole.majorProductSubtitle).toBe('Anisole')
    expect(anisole.majorProductFormula).toBe('C₆H₅OCH₃')
  })

  it('parses every SMILES used in dehydration and Williamson options/outcomes cleanly', () => {
    for (const alc of DEHYDRATION_ALCOHOL_OPTIONS) {
      expect(() => parseSmiles(alc.smiles)).not.toThrow()
    }
    for (const hal of WILLIAMSON_HALIDES) {
      expect(() => parseSmiles(hal.smiles)).not.toThrow()
    }
    for (const alc of DEHYDRATION_ALCOHOL_OPTIONS) {
      for (const temp of [413, 443] as const) {
        const res = evaluateDehydration(alc.id, temp)
        expect(() => parseSmiles(res.productSmiles)).not.toThrow()
        res.mixedProducts?.forEach((p) => expect(() => parseSmiles(p.smiles)).not.toThrow())
      }
    }
    for (const nuc of WILLIAMSON_NUCLEOPHILES) {
      for (const hal of WILLIAMSON_HALIDES) {
        const res = evaluateWilliamson(nuc.id, hal.id)
        expect(() => parseSmiles(res.productSmiles)).not.toThrow()
      }
    }
  })
})

describe('S11 Physical properties model', () => {
  it('matches exact NCERT Section 7.6.2 boiling points and water miscibilities', () => {
    const pentane = getPhysicalPropertyRecord('n-pentane')
    const ether = getPhysicalPropertyRecord('ethoxyethane')
    const alcohol = getPhysicalPropertyRecord('butan-1-ol')

    expect(pentane.bpK).toBe(309.1)
    expect(pentane.miscibilityGPer100Ml).toBeNull()
    expect(pentane.hBondDonor).toBe(false)
    expect(pentane.hBondAcceptor).toBe(false)

    expect(ether.bpK).toBe(307.6)
    expect(ether.miscibilityGPer100Ml).toBe(7.5)
    expect(ether.hBondDonor).toBe(false)
    expect(ether.hBondAcceptor).toBe(true)

    expect(alcohol.bpK).toBe(390)
    expect(alcohol.miscibilityGPer100Ml).toBe(9)
    expect(alcohol.hBondDonor).toBe(true)
    expect(alcohol.hBondAcceptor).toBe(true)

    expect(BOILING_GAP_ALCOHOL_VS_ETHER_K).toBe(82.4)
    expect(ETHER_ANGLE_DEG).toBe(111.7)
    expect(ETHER_CO_LENGTH_PM).toBe(141)

    PHYSICAL_PROPERTY_RECORDS.forEach((r) => {
      expect(() => parseSmiles(r.smiles)).not.toThrow()
    })
  })
})
