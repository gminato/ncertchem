import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  ROUTE_STEPS,
  ROUTE_WIDTH,
  layoutRow,
  step6Heights,
  step6Parts,
  step6Scale,
  type RouteSequence,
  type RouteSpecies,
} from './carbonyl-routes-steps'

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

  it('Step 6 uses one scale whose label font stays at 14 units or more (13 px at a 540 px panel)', () => {
    const scale = step6Scale()
    expect(scale).toBeGreaterThanOrEqual(38)
    expect(Math.round(0.36 * scale)).toBeGreaterThanOrEqual(14)
  })

  it('Step 6 rows are at most ROUTE_WIDTH wide at the chosen scale', () => {
    const scale = step6Scale()
    const { a1, b } = step6Parts()
    expect(layoutRow(a1, scale).width).toBeLessThanOrEqual(ROUTE_WIDTH)
    expect(layoutRow(b, scale).width).toBeLessThanOrEqual(ROUTE_WIDTH)
  })

  it('Step 6 captions, rows and gaps sum to at most 656 (the 680 viewBox less a 12-unit margin at top and bottom)', () => {
    expect(step6Heights(step6Scale()).total).toBeLessThanOrEqual(656)
  })
})
