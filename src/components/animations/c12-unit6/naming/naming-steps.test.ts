import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  GEM_COMMON,
  GEM_SMILES,
  LONG_BR,
  LONG_BR_CARBON,
  LONG_CHAIN,
  LONG_METHYL,
  LONG_METHYL_CARBON,
  LONG_SMILES,
  META_SMILES,
  NAMING_STEP_COUNT,
  ORTHO_SMILES,
  PARA_SMILES,
  SEC_BUTYL_BR,
  SEC_BUTYL_COMMON,
  SEC_BUTYL_SMILES,
  TABLE_ROW_COMMONS,
  VIC_COMMON,
  VIC_SMILES,
  alphabeticalPrefixes,
  chainLocants,
  formulaOf,
  isLowerSet,
  nameOf,
  tableRow,
} from './naming-steps'

describe('halide naming Steps', () => {
  it('has six Steps', () => {
    expect(NAMING_STEP_COUNT).toBe(6)
  })

  it('names the Step 1 molecule 2-bromobutane, with the sec-butyl common name', () => {
    expect(nameOf(SEC_BUTYL_SMILES)).toBe('2-bromobutane')
    expect(SEC_BUTYL_COMMON).toBe('sec-butyl bromide')
    const g = parseSmiles(SEC_BUTYL_SMILES)
    expect(g.atoms[SEC_BUTYL_BR].element).toBe('Br')
    expect(formulaOf(SEC_BUTYL_SMILES)).toBe('C4H9Br')
  })

  it('keeps the Step 2 to 4 chain as a path of six carbons with the bromine and methyl on it', () => {
    const g = parseSmiles(LONG_SMILES)
    expect(g.atoms[LONG_BR].element).toBe('Br')
    expect(g.atoms[LONG_METHYL].element).toBe('C')
    expect(g.atoms.length).toBe(8)
    // Every consecutive pair of chain carbons is bonded.
    for (let i = 0; i + 1 < LONG_CHAIN.length; i++) {
      const a = LONG_CHAIN[i]
      const b = LONG_CHAIN[i + 1]
      const bonded = g.bonds.some((bd) => (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a))
      expect(bonded, `chain link ${a}-${b}`).toBe(true)
    }
    // The bromine sits on chain carbon 2 and the methyl on chain carbon 4 (counting from the left).
    expect(LONG_CHAIN[1]).toBe(LONG_BR_CARBON)
    expect(LONG_CHAIN[3]).toBe(LONG_METHYL_CARBON)
    expect(formulaOf(LONG_SMILES)).toBe('C7H15Br')
  })

  it('finds the lowest-locant set {2,4} from the left, not {3,5}', () => {
    const { left, right } = chainLocants(LONG_CHAIN, [LONG_BR_CARBON, LONG_METHYL_CARBON])
    expect(left).toEqual([2, 4])
    expect(right).toEqual([3, 5])
    expect(isLowerSet(left, right)).toBe(true)
    expect(isLowerSet(right, left)).toBe(false)
  })

  it('names the Step 2 to 4 molecule 2-bromo-4-methylhexane and sorts the prefixes alphabetically', () => {
    expect(nameOf(LONG_SMILES)).toBe('2-bromo-4-methylhexane')
    expect(alphabeticalPrefixes(['methyl', 'bromo'])).toEqual(['bromo', 'methyl'])
  })

  it('names the three dichlorobenzenes with 1,2-, 1,3- and 1,4- locants', () => {
    expect(nameOf(ORTHO_SMILES)).toBe('1,2-dichlorobenzene')
    expect(nameOf(META_SMILES)).toBe('1,3-dichlorobenzene')
    expect(nameOf(PARA_SMILES)).toBe('1,4-dichlorobenzene')
  })

  it('names the gem and vic dihalides and keeps their common names', () => {
    expect(nameOf(GEM_SMILES)).toBe('1,1-dichloroethane')
    expect(nameOf(VIC_SMILES)).toBe('1,2-dichloroethane')
    expect(GEM_COMMON).toBe('ethylidene chloride')
    expect(VIC_COMMON).toBe('ethylene dichloride')
  })

  it('reads three Table 6.1 rows and matches the namer on their SMILES', () => {
    for (const common of TABLE_ROW_COMMONS) {
      const row = tableRow(common)
      expect(nameOf(row.smiles).length).toBeGreaterThan(0)
    }
    expect(nameOf(tableRow('Methylene chloride').smiles)).toBe('dichloromethane')
    expect(nameOf(tableRow('Chloroform').smiles)).toBe('trichloromethane')
    expect(nameOf(tableRow('Allyl bromide').smiles)).toBe('3-bromoprop-1-ene')
  })
})
