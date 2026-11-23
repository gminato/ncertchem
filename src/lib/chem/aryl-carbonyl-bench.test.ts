import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { unit8Name } from './ncert-c12-unit8-data'
import { DRAWN_MOLECULES, ROUTES, STARTS, displayName, outcomeLine, routeFor, routesFrom } from './aryl-carbonyl-bench'

describe('aryl carbonyl bench: drawn molecules', () => {
  it.each(DRAWN_MOLECULES)('$smiles has formula $formula', ({ smiles, formula }) => {
    expect(molecularFormula(parseSmiles(smiles))).toBe(formula)
  })

  it('every starting material is one of the drawn molecules', () => {
    for (const s of STARTS) expect(DRAWN_MOLECULES.map((m) => m.smiles)).toContain(s.smiles)
  })

  it('every route product and intermediate is drawn with a checked formula', () => {
    const drawn = new Set(DRAWN_MOLECULES.map((m) => m.smiles))
    for (const r of ROUTES) {
      expect(drawn.has(r.product), `product of ${r.label}`).toBe(true)
      if (r.intermediate?.kind === 'molecule') expect(drawn.has(r.intermediate.smiles)).toBe(true)
    }
  })
})

describe('aryl carbonyl bench: names', () => {
  it('names the products as the namer gives them, with common names where NCERT uses them', () => {
    expect(unit8Name('O=CC1=CC=CC=C1')).toBe('benzaldehyde')
    expect(displayName('CC(=O)C1=CC=CC=C1')).toContain('acetophenone')
    expect(displayName('CC(C)=O')).toContain('acetone')
    expect(displayName('CC1=CC=CC=C1')).toContain('toluene')
  })

  it('uses NCERT names for the two intermediates the namer refuses', () => {
    expect(displayName('ClC(Cl)C1=CC=CC=C1')).toBe('benzal chloride')
    expect(displayName('CC(=O)OC(OC(C)=O)C1=CC=CC=C1')).toBe('benzylidene diacetate')
  })
})

describe('aryl carbonyl bench: routes', () => {
  it('toluene with a strong oxidant goes on to the acid, not the aldehyde', () => {
    const r = routeFor('toluene', 'strongOxidant')
    expect(r.outcome).toBe('acid')
    expect(r.product).toBe('OC(=O)C1=CC=CC=C1')
    expect(outcomeLine(r)).toMatch(/^Goes on to the acid/)
  })

  it('the three toluene routes that stop at the aldehyde end at benzaldehyde', () => {
    for (const id of ['etard', 'chromic', 'sideChain'] as const) {
      const r = routeFor('toluene', id)
      expect(r.product).toBe('O=CC1=CC=CC=C1')
      expect(r.outcome).toBe('aldehyde')
    }
  })

  it('each route has one arrow per stage, and a two-stage route draws its intermediate', () => {
    for (const r of ROUTES) {
      if (r.intermediate) expect(r.arrows.length).toBe(2)
    }
    expect(routeFor('toluene', 'chromic').intermediate).toEqual({
      kind: 'molecule',
      smiles: 'CC(=O)OC(OC(C)=O)C1=CC=CC=C1',
      name: 'benzylidene diacetate',
    })
  })

  it('acyl chloride routes to a ketone keep the acyl carbons and add the alkyl carbons', () => {
    expect(molecularFormula(parseSmiles(routeFor('ethanoylChloride', 'cadmium').product))).toBe('C3H6O')
    expect(molecularFormula(parseSmiles(routeFor('benzoylChloride', 'cadmium').product))).toBe('C8H8O')
  })

  it('every start has at least one reagent set, and the reagent set lookup falls back to the first route', () => {
    for (const s of STARTS) expect(routesFrom(s.id).length).toBeGreaterThan(0)
    expect(routeFor('benzene', 'etard').reagent).toBe('gattermanKoch')
  })
})
