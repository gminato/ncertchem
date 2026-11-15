import { describe, expect, it } from 'vitest'
import {
  LEWIS_STRUCTURES,
  bondOrderBetween,
  checkStructure,
  formalCharge,
  formalChargesOf,
  lewisStructure,
  octetReport,
  octetStatusOf,
  totalValenceElectrons,
} from './lewis'

describe('totalValenceElectrons', () => {
  it('counts valence electrons for neutral molecules', () => {
    expect(totalValenceElectrons(['C', 'O', 'O'])).toBe(16)
    expect(totalValenceElectrons(['N', 'H', 'H', 'H'])).toBe(8)
    expect(totalValenceElectrons(['C', 'H', 'H', 'H', 'H'])).toBe(8)
  })

  it('adds an electron per negative charge and removes one per positive charge', () => {
    expect(totalValenceElectrons(['C', 'O', 'O', 'O'], -2)).toBe(24)
    expect(totalValenceElectrons(['N', 'H', 'H', 'H', 'H'], 1)).toBe(8)
  })

  it('throws RangeError for an unknown element', () => {
    expect(() => totalValenceElectrons(['Xx'])).toThrow(RangeError)
  })
})

describe('formalCharge', () => {
  it('applies V − (non-bonding) − (bonding electrons)/2', () => {
    // O in O=O with two lone pairs: 6 − 4 − 4/2 = 0
    expect(formalCharge(6, 4, 4)).toBe(0)
    // O with three lone pairs and one single bond: 6 − 6 − 2/2 = −1
    expect(formalCharge(6, 6, 2)).toBe(-1)
  })

  it('rejects negative or non-integer inputs', () => {
    expect(() => formalCharge(-1, 0, 0)).toThrow(RangeError)
    expect(() => formalCharge(6, 1.5, 2)).toThrow(RangeError)
  })
})

describe('curated Lewis structures', () => {
  it('conserve electrons and charge for every species in the library', () => {
    for (const key of Object.keys(LEWIS_STRUCTURES)) {
      const check = checkStructure(lewisStructure(key))
      expect(check.electronsConserved, `${key} electrons`).toBe(true)
      expect(check.chargeConserved, `${key} charge`).toBe(true)
    }
  })

  it('gives the NCERT formal charges for CO, O3, NO2⁻ and NO3⁻', () => {
    expect(formalChargesOf(lewisStructure('CO'))).toEqual([-1, 1])
    expect(formalChargesOf(lewisStructure('O3'))).toEqual([0, 1, -1])
    expect(formalChargesOf(lewisStructure('NO2⁻'))).toEqual([0, 0, -1])
    expect(formalChargesOf(lewisStructure('NO3⁻'))).toEqual([1, 0, -1, -1])
  })

  it('has the bond orders NCERT draws for N2, CO2 and C2H2', () => {
    expect(bondOrderBetween(lewisStructure('N2'), 0, 1)).toBe(3)
    expect(bondOrderBetween(lewisStructure('CO2'), 0, 1)).toBe(2)
    expect(bondOrderBetween(lewisStructure('C2H2'), 1, 2)).toBe(3)
    expect(bondOrderBetween(lewisStructure('C2H2'), 0, 2)).toBe(0)
  })

  it('throws RangeError for a species not in the library', () => {
    expect(() => lewisStructure('XeOF4')).toThrow(RangeError)
  })
})

describe('octet check (Section 4.1.5)', () => {
  it('flags BF3 and BeH2 as incomplete', () => {
    expect(octetStatusOf(lewisStructure('BF3'), 0).status).toBe('incomplete')
    expect(octetStatusOf(lewisStructure('BeH2'), 1).status).toBe('incomplete')
  })

  it('flags the central atom of PCl5, SF6 and H2SO4 as expanded', () => {
    expect(octetStatusOf(lewisStructure('PCl5'), 0).status).toBe('expanded')
    expect(octetStatusOf(lewisStructure('SF6'), 0).status).toBe('expanded')
    expect(octetStatusOf(lewisStructure('H2SO4'), 2).status).toBe('expanded')
  })

  it('flags NO and NO2 as odd-electron and gives the total valence count as odd', () => {
    expect(totalValenceElectrons(['N', 'O'])).toBe(11)
    expect(totalValenceElectrons(['N', 'O', 'O'])).toBe(17)
    expect(octetStatusOf(lewisStructure('NO'), 0).status).toBe('odd-electron')
    expect(octetStatusOf(lewisStructure('NO2'), 1).status).toBe('odd-electron')
  })

  it('marks the ordinary atoms of CO2 and H2O as complete', () => {
    expect(octetReport(lewisStructure('CO2')).map((r) => r.status)).toEqual(['complete', 'complete', 'complete'])
    const water = octetReport(lewisStructure('H2O'))
    expect(water.map((r) => r.status)).toEqual(['complete', 'complete', 'complete'])
  })
})

describe('NCERT worked structures', () => {
  it('draws Table 4.1 species with the valence totals NCERT uses', () => {
    expect(checkStructure(lewisStructure('H2')).electronsConserved).toBe(true)
    expect(totalValenceElectrons(['O', 'O', 'O'])).toBe(18)
    expect(totalValenceElectrons(['N', 'F', 'F', 'F'])).toBe(26)
    expect(totalValenceElectrons(['C', 'O', 'O', 'O'], -2)).toBe(24)
    expect(totalValenceElectrons(['H', 'N', 'O', 'O', 'O'])).toBe(24)
  })

  it('gives HNO3 one N⁺ and one O⁻, the charges NCERT shows', () => {
    const charges = formalChargesOf(lewisStructure('HNO3'))
    expect(charges[2]).toBe(1)
    expect(charges[4]).toBe(-1)
    expect(charges.reduce((a, b) => a + b, 0)).toBe(0)
  })
})
