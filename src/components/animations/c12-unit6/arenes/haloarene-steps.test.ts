import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import {
  ARENE_NAMES,
  ARENE_SMILES,
  ARENE_STEP_COUNT,
  carbanionSites,
  chlorineBondComparison,
  formulaOf,
  ladderCards,
  nitroVerdict,
} from './haloarene-steps'

describe('haloarene Scrolly Steps', () => {
  it('has the six Steps of the Prose', () => {
    expect(ARENE_STEP_COUNT).toBe(6)
  })

  it('draws molecules with the formulas the Prose uses', () => {
    expect(molecularFormula(parseSmiles(ARENE_SMILES.chlorobenzene))).toBe('C6H5Cl')
    expect(molecularFormula(parseSmiles(ARENE_SMILES.chloroethane))).toBe('C2H5Cl')
    expect(molecularFormula(parseSmiles(ARENE_SMILES.bromo4Nitro))).toBe('C6H4BrNO2')
    expect(molecularFormula(parseSmiles(ARENE_SMILES.bromo2Nitro))).toBe('C6H4BrNO2')
    expect(molecularFormula(parseSmiles(ARENE_SMILES.ethylbenzene))).toBe('C8H10')
    expect(molecularFormula(parseSmiles(ARENE_SMILES.biphenyl))).toBe('C12H10')
    expect(formulaOf(ARENE_SMILES.biphenyl)).toBe('C₁₂H₁₀')
  })

  it('names the two nitrobromobenzenes exactly as the namer does', () => {
    expect(iupacNameFromSmiles(ARENE_SMILES.bromo4Nitro)).toBe(ARENE_NAMES.bromo4Nitro)
    expect(iupacNameFromSmiles(ARENE_SMILES.bromo2Nitro)).toBe(ARENE_NAMES.bromo2Nitro)
  })

  it('puts the nitro group on the ring position the name says', () => {
    // Ring atoms 1 to 6 follow the SMILES order; the nitrogen is atom 7 in each nitro SMILES.
    const bondsTo = (smiles: string, ring: number) =>
      parseSmiles(smiles).bonds.some((b) => (b.a === ring && b.b === 7) || (b.b === ring && b.a === 7))
    expect(bondsTo(ARENE_SMILES.para4Nitro, 4)).toBe(true)
    expect(bondsTo(ARENE_SMILES.meta3Nitro, 3)).toBe(true)
    expect(bondsTo(ARENE_SMILES.bromo4Nitro, 4)).toBe(true)
    expect(bondsTo(ARENE_SMILES.bromo2Nitro, 6)).toBe(true)
  })

  it('marks the C–Cl bond as bond 0 between Cl (atom 0) and C1 (atom 1)', () => {
    const b = parseSmiles(ARENE_SMILES.chlorobenzene).bonds[0]
    expect([b.a, b.b].sort((p, q) => p - q)).toEqual([0, 1])
  })

  it('gives the bond-length difference from the lead data lib', () => {
    expect(chlorineBondComparison()).toEqual({ sp3Pm: 177, sp2Pm: 169, differencePm: 8 })
  })

  it('takes the ladder conditions from the NCERT hydrolysis data', () => {
    const labels = ladderCards().map((c) => [c.nitroGroups, c.conditions])
    expect(labels).toEqual([
      [0, 'NaOH, 623 K, 300 atm'],
      [1, 'NaOH, 443 K'],
      [2, 'NaOH, 368 K'],
      [3, 'warm H₂O'],
    ])
  })

  it('reads the activation verdicts and the carbanion sites from the lib', () => {
    expect(carbanionSites()).toEqual([2, 4, 6])
    expect(nitroVerdict(4)).toEqual({ activated: true, chargeReachesNitroCarbon: true })
    expect(nitroVerdict(3)).toEqual({ activated: false, chargeReachesNitroCarbon: false })
  })
})
