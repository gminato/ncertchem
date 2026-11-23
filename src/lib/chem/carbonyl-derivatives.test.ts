import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  CARBONYL_SMILES,
  REAGENT_SMILES,
  bondIndex,
  hydrolysis,
  outcome,
  reagentsFor,
  unicodeFormula,
  type CarbonylId,
  type ReagentId,
} from './carbonyl-derivatives'

/** Element counts from a formula such as C9H10N4O4. */
function counts(formula: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[el] = (out[el] ?? 0) + (n === '' ? 1 : Number(n))
  return out
}

function plain(formula: string): string {
  return formula.replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))
}

const EXPECTED: Record<string, string> = {
  'propanal+methanol1': 'C4H10O2',
  'propanal+methanol2': 'C5H12O2',
  'propanal+ammonia': 'C3H7N',
  'propanal+methylamine': 'C4H9N',
  'propanal+hydroxylamine': 'C3H7NO',
  'propanal+hydrazine': 'C3H8N2',
  'propanal+phenylhydrazine': 'C9H12N2',
  'propanal+dnph': 'C9H10N4O4',
  'propanal+semicarbazide': 'C4H9N3O',
  'butanone+glycol': 'C6H12O2',
  'butanone+ammonia': 'C4H9N',
  'butanone+methylamine': 'C5H11N',
  'butanone+hydroxylamine': 'C4H9NO',
  'butanone+hydrazine': 'C4H10N2',
  'butanone+phenylhydrazine': 'C10H14N2',
  'butanone+dnph': 'C10H12N4O4',
  'butanone+semicarbazide': 'C5H11N3O',
}

const CASES = Object.keys(EXPECTED).map((k) => {
  const [carbonyl, reagent] = k.split('+') as [CarbonylId, ReagentId]
  return { carbonyl, reagent, formula: EXPECTED[k] }
})

describe('carbonyl derivative products', () => {
  it.each(CASES)('$carbonyl + $reagent draws $formula', ({ carbonyl, reagent, formula }) => {
    const o = outcome(carbonyl, reagent)
    expect(molecularFormula(parseSmiles(o.drawnSmiles))).toBe(formula)
    expect(plain(o.productFormula)).toBe(formula)
  })

  it.each(CASES)('$carbonyl + $reagent balances in atoms', ({ carbonyl, reagent }) => {
    const o = outcome(carbonyl, reagent)
    const equiv = reagent === 'methanol2' ? 2 : 1
    const reagentF = molecularFormula(parseSmiles(REAGENT_SMILES[reagent]))
    const left = sum(molecularFormula(parseSmiles(CARBONYL_SMILES[carbonyl])), counts(reagentF), equiv)
    const right = sum(molecularFormula(parseSmiles(o.drawnSmiles)), o.reagent === 'methanol1' ? {} : { H: 2, O: 1 }, 1)
    expect(right).toEqual(left)
  })

  it.each(CASES)('$carbonyl + $reagent highlights existing bonds only', ({ carbonyl, reagent }) => {
    const o = outcome(carbonyl, reagent)
    const g = parseSmiles(o.drawnSmiles)
    expect(o.highlightBonds.length).toBeGreaterThan(0)
    for (const i of o.highlightBonds) expect(g.bonds[i]).toBeDefined()
  })

  it('water is released for every product except the hemiacetal', () => {
    for (const { carbonyl, reagent } of CASES) {
      const o = outcome(carbonyl, reagent)
      expect(o.waterSentence === 'Water is released.').toBe(reagent !== 'methanol1')
    }
  })

  it('names only the molecules the namer handles', () => {
    expect(outcome('propanal', 'methanol2').drawnName).toBe('1,1-dimethoxypropane')
    expect(outcome('propanal', 'methanol1').drawnName).not.toBeNull()
    expect(outcome('propanal', 'ammonia').drawnName).toBeNull()
    expect(outcome('butanone', 'glycol').drawnName).toBeNull()
  })

  it('the ketal is drawn with two new C–O bonds on the carbonyl carbon', () => {
    const o = outcome('butanone', 'glycol')
    const g = parseSmiles(o.drawnSmiles)
    expect(o.highlightBonds).toEqual([bondIndex(g, 2, 4), bondIndex(g, 2, 7)])
    expect(g.atoms[4].element).toBe('O')
    expect(g.atoms[7].element).toBe('O')
  })

  it('every reagent offered for each carbonyl compound has a product', () => {
    for (const carbonyl of ['propanal', 'butanone'] as const) {
      for (const reagent of reagentsFor(carbonyl)) expect(() => outcome(carbonyl, reagent)).not.toThrow()
    }
  })
})

describe('hydrolysis of acetals and ketals', () => {
  it('propanal acetal hydrolyses back to propanal and two methanol', () => {
    const back = hydrolysis(outcome('propanal', 'methanol2'))
    expect(back.drawnSmiles).toBe('CCC=O')
    expect(back.equation).toBe('C₅H₁₂O₂ + H₂O → C₃H₆O + 2 CH₄O')
    expect(back.waterSentence).toBe('Water is used up.')
  })

  it('the ketal hydrolyses back to butan-2-one and ethylene glycol', () => {
    const back = hydrolysis(outcome('butanone', 'glycol'))
    expect(back.drawnSmiles).toBe('CCC(C)=O')
    expect(back.equation).toBe('C₆H₁₂O₂ + H₂O → C₄H₈O + C₂H₆O₂')
  })

  it('refuses the hydrolysis of an imine', () => {
    expect(() => hydrolysis(outcome('propanal', 'ammonia'))).toThrow(RangeError)
  })

  it('the hydrolysis equations balance', () => {
    const cases: [CarbonylId, ReagentId][] = [
      ['propanal', 'methanol2'],
      ['butanone', 'glycol'],
    ]
    for (const [c, r] of cases) {
      const acetal = molecularFormula(parseSmiles(outcome(c, r).drawnSmiles))
      const n = r === 'methanol2' ? 2 : 1
      const alcohol = counts(molecularFormula(parseSmiles(REAGENT_SMILES[r])))
      const carbonyl = molecularFormula(parseSmiles(CARBONYL_SMILES[c]))
      expect(sum(acetal, { H: 2, O: 1 }, 1)).toEqual(sum(carbonyl, alcohol, n))
    }
  })
})

describe('unicodeFormula', () => {
  it('subscripts the digits only', () => {
    expect(unicodeFormula('C6H12O2')).toBe('C₆H₁₂O₂')
  })
})

/** Adds element counts (a formula string or a counts map), n times the second. */
function sum(a: string | Record<string, number>, b: Record<string, number>, n: number): Record<string, number> {
  const out: Record<string, number> = { ...(typeof a === 'string' ? counts(a) : a) }
  for (const [el, k] of Object.entries(b)) out[el] = (out[el] ?? 0) + k * n
  return out
}
