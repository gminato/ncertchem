import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { ROUTE_STEPS, type RouteSequence, type RouteSpecies } from './carbonyl-routes-steps'

const allSpecies = (seq: RouteSequence): RouteSpecies[] =>
  seq.flatMap((item) => (Array.isArray(item) ? [...item] : []))

describe('carbonyl route Steps', () => {
  it('has six Steps, as in the Prose', () => {
    expect(ROUTE_STEPS).toHaveLength(6)
  })

  for (const [k, step] of ROUTE_STEPS.entries()) {
    it(`Step ${k + 1}: every drawn molecule has the formula the Prose names`, () => {
      for (const column of step.columns) {
        for (const block of column) {
          for (const sp of allSpecies(block.sequence)) {
            if (sp.smiles !== undefined) expect(molecularFormula(parseSmiles(sp.smiles)), sp.smiles).toBe(sp.formula)
          }
        }
      }
    })
  }

  it('names come from the Unit 8 namer (methanal via its lead-checked override)', () => {
    expect(unit8Name('CCCCO')).toBe('butan-1-ol')
    expect(unit8Name('CCC(=O)CC')).toBe('pentan-3-one')
    expect(unit8Name('C=O')).toBe('methanal')
    expect(unit8Name('CCCCC=O')).toBe('pentanal')
  })
})
