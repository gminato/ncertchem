import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  REAGENTS,
  RULES,
  STARTS,
  TARGETS,
  attempt,
  carbonCheck,
  routesFor,
  startSmilesOf,
} from './acid-synthesis-planner'

const formula = (smiles: string) => molecularFormula(parseSmiles(smiles))

describe('acid synthesis planner: drawn molecules', () => {
  it.each([
    ['hexan-1-ol', 'CCCCCCO', 'C6H14O'],
    ['hexylbenzene', 'CCCCCCC1=CC=CC=C1', 'C12H18'],
    ['tert-butylbenzene', 'CC(C)(C)C1=CC=CC=C1', 'C10H14'],
    ['3-phenylpropanenitrile', 'N#CCCC1=CC=CC=C1', 'C9H9N'],
    ['1-bromobutane', 'CCCCBr', 'C4H9Br'],
    ['ethanoyl chloride', 'CC(=O)Cl', 'C2H3ClO'],
    ['ethanoic anhydride', 'CC(=O)OC(C)=O', 'C4H6O3'],
    ['ethyl butanoate', 'CCCC(=O)OCC', 'C6H12O2'],
    ['3-methylbutan-2-ol', 'CC(C)C(C)O', 'C5H12O'],
    ['ethanoic acid', 'CC(O)=O', 'C2H4O2'],
    ['butanoic acid', 'CCCC(O)=O', 'C4H8O2'],
    ['pentanoic acid', 'CCCCC(O)=O', 'C5H10O2'],
    ['hexanoic acid', 'CCCCCC(O)=O', 'C6H12O2'],
    ['benzoic acid', 'OC(=O)C1=CC=CC=C1', 'C7H6O2'],
    ['3-phenylpropanoic acid', 'OC(=O)CCC1=CC=CC=C1', 'C9H10O2'],
  ])('%s is %s', (_name, smiles, expected) => {
    expect(formula(smiles)).toBe(expected)
  })
})

describe('acid synthesis planner: rules', () => {
  it('every rule refers to a listed start and reagent', () => {
    const starts = new Set(STARTS.map((s) => s.id))
    const reagents = new Set(REAGENTS.map((r) => r.id))
    for (const r of RULES) {
      expect(starts.has(r.start)).toBe(true)
      expect(reagents.has(r.reagent)).toBe(true)
    }
  })

  it('every product of a rule is an acid or ester hydrolysis product, and has the expected formula', () => {
    for (const r of RULES) {
      if (r.product === null) {
        expect(r.reason, `reason for ${r.start}`).toBeTruthy()
        expect(r.reason!.length).toBeLessThanOrEqual(60)
        continue
      }
      expect(formula(r.product)).toMatch(/^C\d+H\d+O2$/)
    }
  })

  it('each target acid has at least one route', () => {
    for (const t of TARGETS) {
      expect(routesFor(t.smiles).length, t.id).toBeGreaterThan(0)
    }
  })

  it('ethanoic acid has two routes (acyl chloride and anhydride)', () => {
    expect(routesFor('CC(O)=O').map((r) => r.start).sort()).toEqual(['acetic-anhydride', 'acetyl-chloride'])
  })
})

describe('acid synthesis planner: attempts and carbon check', () => {
  it('Grignard route from 1-bromobutane gives pentanoic acid with one carbon more', () => {
    const a = attempt('bromobutane', 'grignard')
    expect(a.product).toBe('CCCCC(O)=O')
    expect(carbonCheck(startSmilesOf('bromobutane'), a.product!).delta).toBe(1)
  })

  it('tert-butylbenzene does not give an acid with KMnO₄', () => {
    const a = attempt('tert-butylbenzene', 'kmno4')
    expect(a.product).toBeNull()
    expect(a.reason).toMatch(/tertiary/)
  })

  it('a wrong pairing gives no acid and a generic reason', () => {
    const a = attempt('hexanol', 'grignard')
    expect(a.product).toBeNull()
    expect(a.rule).toBeNull()
    expect(a.reason.length).toBeGreaterThan(0)
  })

  it('hexylbenzene carbon count: C12 falls to C7', () => {
    const c = carbonCheck(startSmilesOf('hexylbenzene'), 'OC(=O)C1=CC=CC=C1')
    expect(c.start).toBe(12)
    expect(c.product).toBe(7)
  })
})
