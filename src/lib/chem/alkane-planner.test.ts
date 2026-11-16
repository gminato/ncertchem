import { describe, expect, it } from 'vitest'
import { carbonCount, graphOf, MATERIAL_MENU, planAlkaneSynthesis, ROUTE_LABELS, TARGET_MENU } from './alkane-planner'
import { parseSmiles } from './molecule-parse'

describe('planAlkaneSynthesis', () => {
  it('gives the target from a single Wurtz partner pair', () => {
    const r = planAlkaneSynthesis('wurtz', 'CCCC', ['CCBr', 'CCBr'])
    expect(r.outcome).toBe('target')
    expect(r.products.map((p) => p.name)).toEqual(['butane'])
    expect(r.carbonArithmetic).toBe('2 + 2 = 4 carbons: each partner gives one alkyl group, and the two join.')
  })

  it('shows the Wurtz mixture when two different halides are used', () => {
    const r = planAlkaneSynthesis('wurtz', 'CCCCC', ['CBr', 'CCCCBr'])
    expect(r.outcome).toBe('mixture')
    expect(r.products.map((p) => p.name)).toEqual(['ethane', 'pentane', 'octane'])
    expect(r.products.filter((p) => p.isTarget)).toHaveLength(1)
    expect(r.headline).toBe('Gives pentane, but only as one of 3 products.')
    expect(r.carbonArithmetic).toContain('1 + 1 = 2, 1 + 4 = 5 and 4 + 4 = 8 carbons')
  })

  it('finds no pentane from a single halide with an odd carbon count', () => {
    const r = planAlkaneSynthesis('wurtz', 'CCCCC', ['CCCCBr', 'CCCCBr'])
    expect(r.outcome).toBe('other')
    expect(r.products.map((p) => p.name)).toEqual(['octane'])
  })

  it('decarboxylates a salt to one carbon fewer', () => {
    const r = planAlkaneSynthesis('decarboxylate', 'CCC', ['CCCC(=O)O'])
    expect(r.outcome).toBe('target')
    expect(r.products[0].carbons).toBe(3)
    expect(r.carbonArithmetic).toBe('4 carbons in the acid − 1 (the carboxyl carbon leaves as carbonate, Na₂CO₃) = 3 carbons.')
    expect(r.equation).toBe('\\ce{CH3CH2CH2COONa + NaOH -> CH3CH2CH3 + Na2CO3}')
  })

  it('makes methane by decarboxylation of ethanoate but not by Kolbe', () => {
    expect(planAlkaneSynthesis('decarboxylate', 'C', ['CC(=O)O']).outcome).toBe('target')
    const k = planAlkaneSynthesis('kolbe', 'C', ['C(=O)O'])
    expect(k.outcome).toBe('none')
    expect(k.error).toContain('methane cannot be made this way')
  })

  it('doubles the alkyl part in Kolbe electrolysis', () => {
    const r = planAlkaneSynthesis('kolbe', 'CCCC', ['CCC(=O)O'])
    expect(r.outcome).toBe('target')
    expect(r.products[0].name).toBe('butane')
    expect(r.carbonArithmetic).toBe('2 × (3 − 1) = 4 carbons: the carboxyl carbon leaves at the anode, and the two alkyl groups join.')
  })

  it('keeps every carbon in hydrogenation and reduction', () => {
    expect(planAlkaneSynthesis('hydrogenate', 'CCC', ['C#CC']).outcome).toBe('target')
    expect(planAlkaneSynthesis('reduce', 'CCC', ['CCCCl']).carbonArithmetic).toBe('3 carbons in, 3 carbons out: no carbon is gained or lost.')
  })

  it('reports a target that the route does not give', () => {
    const r = planAlkaneSynthesis('reduce', 'CCCC', ['CCCCl'])
    expect(r.outcome).toBe('other')
    expect(r.headline).toBe('Does not give butane.')
  })

  it('returns the lib reason when a route does not apply', () => {
    const r = planAlkaneSynthesis('decarboxylate', 'CC', ['CC'])
    expect(r.outcome).toBe('none')
    expect(r.error).toBeTruthy()
  })

  it('needs two halides for Wurtz', () => {
    expect(planAlkaneSynthesis('wurtz', 'CC', ['CBr']).outcome).toBe('none')
  })
})

describe('menus', () => {
  it('parses every menu item and labels every route', () => {
    for (const t of TARGET_MENU) expect(carbonCount(graphOf(t))).toBeGreaterThan(0)
    for (const route of Object.keys(ROUTE_LABELS) as (keyof typeof ROUTE_LABELS)[]) {
      for (const m of MATERIAL_MENU[route]) expect(() => parseSmiles(m.smiles)).not.toThrow()
    }
  })
})
