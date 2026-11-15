import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula, toCondensed } from './molecule-parse'
import {
  TRANSLATOR_PRESETS,
  carbonHydrogenCounts,
  formulaAnswerMatches,
  groupMembership,
  hasRing,
  normaliseFormulaText,
  parseTranslatorInput,
} from './formula-translator'

describe('hasRing', () => {
  it('is false for open chains and true for rings', () => {
    expect(hasRing(parseSmiles('CC(O)CC(C)C'))).toBe(false)
    expect(hasRing(parseSmiles('C1CCCCC1'))).toBe(true)
    expect(hasRing(parseSmiles('CC1=CC=CC=C1'))).toBe(true)
  })
})

describe('groupMembership', () => {
  it('puts each hanging atom in the group of the chain atom it is attached to', () => {
    // 4-methylpentan-2-ol: chain C0-C1-C3-C4-C6; C1 carries O2 and C4 carries C5.
    const g = parseSmiles('CC(O)CC(C)C')
    const chain = [0, 1, 3, 4, 6]
    const groups = groupMembership(g, chain)
    expect(groups).toEqual([[0], [1, 2], [3], [4, 5], [6]])
    const all = groups.flat().sort((a, b) => a - b)
    expect(all).toEqual(g.atoms.map((_, i) => i))
  })

  it('gives a branch of several atoms to one group', () => {
    // 3,5-dimethylhexan-2-ol: the chain runs from the OH carbon; C4's methyl stays with C4.
    const g = parseSmiles('CC(C)CC(C)C(C)O')
    const chain = [0, 1, 3, 4, 6, 7]
    const groups = groupMembership(g, chain)
    expect(groups.flat().length).toBe(g.atoms.length)
    expect(groups.find((m) => m.includes(8))).toContain(6)
  })
})

describe('carbonHydrogenCounts and formula answers', () => {
  it('counts carbon and hydrogen from the graph, agreeing with the formula', () => {
    const g = parseSmiles('CC(O)CC(C)C')
    expect(carbonHydrogenCounts(g)).toEqual({ carbons: 6, hydrogens: 14 })
    expect(molecularFormula(g)).toBe('C6H14O')
  })

  it('accepts subscripts and spaces, and compares in Hill order', () => {
    expect(normaliseFormulaText('C₆H₁₄O')).toBe('C6H14O')
    expect(normaliseFormulaText(' C6 H14 O ')).toBe('C6H14O')
    expect(formulaAnswerMatches(parseSmiles('CC(O)CC(C)C'), 'C₆H₁₄O')).toBe(true)
    expect(formulaAnswerMatches(parseSmiles('CC(O)CC(C)C'), 'C6H12O')).toBe(false)
    expect(formulaAnswerMatches(parseSmiles('FC(Cl)Br'), 'CHBrClF')).toBe(true)
  })
})

describe('parseTranslatorInput', () => {
  it('returns a graph for a valid SMILES and a message otherwise', () => {
    const ok = parseTranslatorInput(' CCO ')
    expect(ok.ok).toBe(true)
    const bad = parseTranslatorInput('C(C')
    expect(bad.ok).toBe(false)
    expect(parseTranslatorInput('   ').ok).toBe(false)
  })
})

describe('presets', () => {
  it('have open chains that can be written condensed, and rings that cannot', () => {
    for (const p of TRANSLATOR_PRESETS) {
      const g = parseSmiles(p.smiles)
      expect(hasRing(g)).toBe(p.kind === 'ring')
      if (p.kind === 'open') expect(toCondensed(g).length).toBeGreaterThan(0)
    }
  })
})
