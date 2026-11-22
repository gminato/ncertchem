import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { CH3X_SMILES, CX_HALOGENS, bondRow, bondSummary, largestDipoleRow } from './c-x-bond-model'

describe('C–X bond explorer model', () => {
  it('draws CH₃–X: the formula and the namer agree with each halogen', () => {
    const names: Record<string, string> = { F: 'fluoromethane', Cl: 'chloromethane', Br: 'bromomethane', I: 'iodomethane' }
    for (const h of CX_HALOGENS) {
      expect(molecularFormula(parseSmiles(CH3X_SMILES[h]))).toBe(`CH3${h}`)
      expect(iupacNameFromSmiles(CH3X_SMILES[h])).toBe(names[h])
    }
  })

  it('reads Table 6.2 values', () => {
    expect(bondRow('Cl')).toMatchObject({ lengthPm: 178, enthalpyKjPerMol: 351 })
    expect(bondRow('I')).toMatchObject({ lengthPm: 214, enthalpyKjPerMol: 234 })
  })

  it('finds CH₃–Cl as the largest dipole', () => {
    expect(largestDipoleRow().halogen).toBe('Cl')
  })

  it('prints the live summary for a halogen', () => {
    expect(bondSummary('Cl')).toBe('CH₃–Cl: bond 178 pm, enthalpy 351 kJ mol⁻¹, dipole 1.860 D.')
  })
})
