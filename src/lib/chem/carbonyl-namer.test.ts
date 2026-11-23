import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from './molecule-parse'
import { unit8Name } from './ncert-c12-unit8-data'
import {
  CHAIN_LENGTHS,
  RING_OPTIONS,
  SUBSTITUENTS,
  buildChain,
  carbonylPositions,
  substituentPositions,
  type ChainLength,
  type SubstituentKind,
} from './carbonyl-namer'

describe('carbonyl positions', () => {
  it('offers the aldehyde position and every interior carbon', () => {
    expect(carbonylPositions(3)).toEqual([1, 2])
    expect(carbonylPositions(6)).toEqual([1, 2, 3])
    expect(carbonylPositions(5)).toEqual([1, 2, 3])
  })

  it('never puts a substituent on the carbonyl carbon or a terminal carbon', () => {
    expect(substituentPositions(4, 2)).toEqual([3])
    expect(substituentPositions(3, 2)).toEqual([])
    expect(substituentPositions(5, 1)).toEqual([2, 3, 4])
    expect(substituentPositions(5, 3)).toEqual([])
  })
})

describe('chain molecules', () => {
  it('builds 3-chlorobutanal with its numbering and the NCERT-style common name', () => {
    const c = buildChain({ n: 4, carbonyl: 1, substituent: 'chloro', at: 3 })
    expect(c.smiles).toBe('O=CCC(Cl)C')
    expect(molecularFormula(parseSmiles(c.smiles))).toBe('C4H7ClO')
    expect(c.name).toBe('3-chlorobutanal')
    expect(c.common).toBe('β-chlorobutyraldehyde')
    expect(c.verdict).toBe('aldehyde')
  })

  it('builds 4-bromopentan-2-one as a ketone', () => {
    const c = buildChain({ n: 5, carbonyl: 2, substituent: 'bromo', at: 4 })
    expect(c.smiles).toBe('CC(=O)CC(Br)C')
    expect(molecularFormula(parseSmiles(c.smiles))).toBe('C5H9BrO')
    expect(c.name).toBe('4-bromopentan-2-one')
    expect(c.common).toBeNull()
    expect(c.verdict).toBe('ketone')
  })

  it('gives the unsubstituted ketones NCERT-style common names', () => {
    expect(buildChain({ n: 3, carbonyl: 2, substituent: 'none', at: null }).common).toBe('acetone')
    expect(buildChain({ n: 4, carbonyl: 2, substituent: 'none', at: null }).common).toBe('ethyl methyl ketone')
    expect(buildChain({ n: 5, carbonyl: 2, substituent: 'none', at: null }).common).toBe('methyl n-propyl ketone')
  })

  it('points the carbonyl atom indices at the C and O of the C=O bond', () => {
    for (const n of CHAIN_LENGTHS) {
      for (const carbonyl of carbonylPositions(n)) {
        const c = buildChain({ n, carbonyl, substituent: 'none', at: null })
        const g = parseSmiles(c.smiles)
        expect(g.atoms[c.carbonylCarbon].element).toBe('C')
        expect(g.atoms[c.carbonylOxygen].element).toBe('O')
        const bond = g.bonds.find((b) => (b.a === c.carbonylCarbon && b.b === c.carbonylOxygen) || (b.b === c.carbonylCarbon && b.a === c.carbonylOxygen))
        expect(bond?.order).toBe(2)
      }
    }
  })

  it('names every chain the lib can draw, with a formula that matches its carbon and oxygen count', () => {
    for (const n of CHAIN_LENGTHS as ChainLength[]) {
      for (const carbonyl of carbonylPositions(n)) {
        for (const sub of SUBSTITUENTS) {
          const positions = sub.id === 'none' ? [null] : substituentPositions(n, carbonyl)
          for (const at of positions) {
            const c = buildChain({ n, carbonyl, substituent: sub.id as SubstituentKind, at })
            const formula = molecularFormula(parseSmiles(c.smiles))
            const extraC = sub.id === 'methyl' || sub.id === 'methoxy' ? 1 : 0
            const oxygens = sub.id === 'methoxy' ? 2 : 1
            expect(formula, c.smiles).toMatch(new RegExp(`^C${n + extraC}H`))
            expect(formula, c.smiles).toContain(oxygens === 2 ? 'O2' : 'O')
            expect(c.name, c.smiles).toBe(unit8Name(c.smiles))
            if (carbonyl > 1) expect(c.name, c.smiles).toMatch(new RegExp(`-${carbonyl}-one$`))
            expect(c.substituentAtom === null, c.smiles).toBe(sub.id === 'none')
          }
        }
      }
    }
  })
})

describe('ring molecules', () => {
  it('matches each ring option to its formula and verdict', () => {
    const formulas: Record<string, string> = { benzaldehyde: 'C7H6O', methylcyclohexane: 'C8H14O', acetophenone: 'C8H8O' }
    for (const r of RING_OPTIONS) {
      expect(molecularFormula(parseSmiles(r.smiles)), r.id).toBe(formulas[r.id])
      expect(unit8Name(r.smiles).length, r.id).toBeGreaterThan(0)
    }
    expect(RING_OPTIONS.find((r) => r.id === 'methylcyclohexane')?.common).toBe('γ-Methylcyclohexanecarbaldehyde')
    expect(RING_OPTIONS.find((r) => r.id === 'acetophenone')?.verdict).toBe('ketone')
  })
})
