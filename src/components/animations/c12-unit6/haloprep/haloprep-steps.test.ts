import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { HALOPREP_STEP_COUNT, SPECIES, STEP_SPECIES, speciesFormula, speciesName } from './haloprep-steps'

describe('haloalkane-routes Scrolly facts', () => {
  it('has one species list per Step', () => {
    expect(STEP_SPECIES).toHaveLength(HALOPREP_STEP_COUNT)
    expect(HALOPREP_STEP_COUNT).toBe(6)
  })

  it('names every drawn species with the namer output', () => {
    expect(speciesName(SPECIES.butanol)).toBe('butan-1-ol')
    expect(speciesName(SPECIES.chlorobutane)).toBe('1-chlorobutane')
    expect(speciesName(SPECIES.butane)).toBe('butane')
    expect(speciesName(SPECIES.chlorobutaneSecondary)).toBe('2-chlorobutane')
    expect(speciesName(SPECIES.butene)).toBe('but-1-ene')
    expect(speciesName(SPECIES.bromobutaneSecondary)).toBe('2-bromobutane')
    expect(speciesName(SPECIES.dibromobutane)).toBe('1,2-dibromobutane')
    expect(speciesName(SPECIES.bromobutane)).toBe('1-bromobutane')
    expect(speciesName(SPECIES.iodobutane)).toBe('1-iodobutane')
    expect(speciesName(SPECIES.fluorobutane)).toBe('1-fluorobutane')
  })

  it('gives the formulas the Steps imply', () => {
    expect(speciesFormula(SPECIES.butanol)).toBe('C4H10O')
    expect(speciesFormula(SPECIES.chlorobutane)).toBe('C4H9Cl')
    expect(speciesFormula(SPECIES.butene)).toBe('C4H8')
    expect(speciesFormula(SPECIES.dibromobutane)).toBe('C4H8Br2')
    expect(speciesFormula(SPECIES.iodobutane)).toBe('C4H9I')
    expect(speciesFormula(SPECIES.fluorobutane)).toBe('C4H9F')
  })

  it('draws the Markovnikov product, not 1-bromobutane, in Step 3', () => {
    expect(STEP_SPECIES[2]).not.toContain(SPECIES.bromobutane)
    const br = parseSmiles(SPECIES.bromobutaneSecondary).atoms.filter((a) => a.element === 'Br')
    expect(br).toHaveLength(1)
  })
})
