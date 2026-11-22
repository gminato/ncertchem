import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { POLYHALO_MOLECULES as M, POLYHALO_STEP_COUNT, POLYHALO_STEP_LABELS, POLYHALO_TAGS } from './polyhalo-steps'

describe('polyhalo Scrolly data', () => {
  it('has one label and one tag list per Step', () => {
    expect(POLYHALO_STEP_LABELS).toHaveLength(POLYHALO_STEP_COUNT)
    expect(POLYHALO_TAGS).toHaveLength(POLYHALO_STEP_COUNT)
  })

  it('draws the molecules the Prose names, with their formulas', () => {
    expect(molecularFormula(parseSmiles(M.dichloromethane))).toBe('CH2Cl2')
    expect(molecularFormula(parseSmiles(M.chloroform))).toBe('CHCl3')
    expect(molecularFormula(parseSmiles(M.iodoform))).toBe('CHI3')
    expect(molecularFormula(parseSmiles(M.carbonTetrachloride))).toBe('CCl4')
    expect(molecularFormula(parseSmiles(M.freon12))).toBe('CCl2F2')
    expect(molecularFormula(parseSmiles(M.phosgene))).toBe('CCl2O')
    expect(molecularFormula(parseSmiles(M.ddt))).toBe('C14H9Cl5')
  })

  it('prints IUPAC names that match the Prose for the molecules the namer supports', () => {
    expect(iupacNameFromSmiles(M.dichloromethane)).toBe('dichloromethane')
    expect(iupacNameFromSmiles(M.chloroform)).toBe('trichloromethane')
    expect(iupacNameFromSmiles(M.iodoform)).toBe('triiodomethane')
    expect(iupacNameFromSmiles(M.carbonTetrachloride)).toBe('tetrachloromethane')
  })

  it('DDT carries five chlorine atoms', () => {
    const cl = parseSmiles(M.ddt).atoms.filter((a) => a.element === 'Cl').length
    expect(cl).toBe(5)
  })
})
