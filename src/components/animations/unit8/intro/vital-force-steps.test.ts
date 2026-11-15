import { describe, expect, it } from 'vitest'
import { INTRO_STEP_COUNT, introMolecule, introStep } from './vital-force-steps'

describe('vital-force Scrolly steps', () => {
  it('has four Steps in historical order, ending with catenation', () => {
    expect(INTRO_STEP_COUNT).toBe(4)
    expect(introStep(0).year).toBe('1828')
    expect(introStep(1).year).toBe('1845')
    expect(introStep(2).year).toBe('1856')
    expect(introStep(3).year).toBe('Catenation')
  })

  it('takes formulas and names from the library', () => {
    expect(introStep(0).molecules[0].formula).toBe('CH4N2O')
    expect(introStep(0).molecules[0].iupac).toBe('aminomethanamide')
    expect(introStep(1).molecules[0].iupac).toBe('ethanoic acid')
    expect(introStep(1).molecules[0].formula).toBe('C2H4O2')
    expect(introStep(2).molecules[0].formula).toBe('CH4')
    expect(introStep(3).molecules.map((m) => m.iupac)).toEqual(['hexane', '2-methylpentane', 'cyclohexane'])
  })

  it('reads the common names from NCERT Table 8.1 where it lists them', () => {
    expect(introMolecule('CC(=O)O', 'CH3COOH').common).toBe('Acetic acid')
    expect(introMolecule('C', 'CH4').common).toBe('Methane')
    expect(introMolecule('NC(=O)N').common).toBeNull()
  })

  it('clamps out-of-range indices', () => {
    expect(introStep(-1).year).toBe('1828')
    expect(introStep(40).year).toBe('Catenation')
  })
})
