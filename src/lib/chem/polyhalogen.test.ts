import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  POLYHALOGEN_COMPOUNDS,
  atmosphereSummary,
  chloroformGuardNote,
  chloroformSummary,
  findPolyhalogen,
  ozoneThinned,
  phosgeneForms,
  systematicName,
  type ChloroformSetup,
} from './polyhalogen'

describe('polyhalogen formulas', () => {
  const expected: Record<string, string> = {
    dichloromethane: 'CH2Cl2',
    chloroform: 'CHCl3',
    iodoform: 'CHI3',
    'carbon-tetrachloride': 'CCl4',
    'freon-12': 'CCl2F2',
    ddt: 'C14H9Cl5',
  }

  it.each(POLYHALOGEN_COMPOUNDS.map((c) => [c.id, c.smiles] as const))('%s has the NCERT formula', (id, smiles) => {
    expect(molecularFormula(parseSmiles(smiles))).toBe(expected[id])
  })
})

describe('polyhalogen names', () => {
  it('prints the namer names for the small molecules', () => {
    expect(systematicName(findPolyhalogen('dichloromethane'))).toBe('dichloromethane')
    expect(systematicName(findPolyhalogen('chloroform'))).toBe('trichloromethane')
    expect(systematicName(findPolyhalogen('iodoform'))).toBe('triiodomethane')
    expect(systematicName(findPolyhalogen('carbon-tetrachloride'))).toBe('tetrachloromethane')
    expect(systematicName(findPolyhalogen('freon-12'))).toBe('dichlorodifluoromethane')
  })

  it('uses NCERT name for DDT, which the namer cannot make', () => {
    expect(systematicName(findPolyhalogen('ddt'))).toBe('p,p′-dichlorodiphenyltrichloroethane (DDT)')
  })
})

describe('chloroform storage model', () => {
  const setups: [ChloroformSetup, boolean][] = [
    [{ light: true, bottle: 'clear', fill: 'half' }, true],
    [{ light: false, bottle: 'clear', fill: 'half' }, false],
    [{ light: true, bottle: 'brown', fill: 'half' }, false],
    [{ light: true, bottle: 'clear', fill: 'full' }, false],
    [{ light: false, bottle: 'brown', fill: 'full' }, false],
  ]

  it.each(setups)('phosgeneForms(%o) is %s', (setup, expectedAnswer) => {
    expect(phosgeneForms(setup)).toBe(expectedAnswer)
  })

  it('summary names phosgene only when it forms', () => {
    expect(chloroformSummary({ light: true, bottle: 'clear', fill: 'half' })).toContain('phosgene (COCl₂) forms')
    expect(chloroformSummary({ light: true, bottle: 'brown', fill: 'full' })).toContain('no phosgene forms')
  })
})

describe('freon and ozone model', () => {
  it('thins the ozone layer only in the stratosphere', () => {
    expect(ozoneThinned('ground')).toBe(false)
    expect(ozoneThinned('troposphere')).toBe(false)
    expect(ozoneThinned('stratosphere')).toBe(true)
  })

  it('summary changes with the layer', () => {
    const freon = findPolyhalogen('freon-12')
    expect(atmosphereSummary(freon, 'troposphere')).toContain('not reached the ozone layer')
    expect(atmosphereSummary(freon, 'stratosphere')).toContain('ozone layer is thinner')
  })
})

describe('chloroform protection note', () => {
  it('names the protection that applies', () => {
    expect(chloroformGuardNote({ light: false, bottle: 'clear', fill: 'half' })).toContain('dark')
    expect(chloroformGuardNote({ light: true, bottle: 'brown', fill: 'half' })).toContain('brown glass')
    expect(chloroformGuardNote({ light: true, bottle: 'clear', fill: 'full' })).toContain('filled to the top')
    expect(chloroformSummary({ light: true, bottle: 'brown', fill: 'half' })).toContain('brown glass blocks the light')
  })
})
