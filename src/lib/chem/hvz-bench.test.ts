import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { BENCH_ACIDS, benchAcid, benchOutcome, hvzProductSmiles, maxHvzSteps, type BenchHalogen } from './hvz-bench'

/** Count of an element in a Hill formula such as C4H7BrO2 (an element with no digit counts 1). */
function count(formula: string, symbol: string): number {
  const re = new RegExp(`${symbol}(\\d*)`, 'g')
  let total = 0
  for (const m of formula.matchAll(re)) total += m[1] ? Number(m[1]) : 1
  return total
}

const formulaOf = (smiles: string) => molecularFormula(parseSmiles(smiles))

describe('hvz-bench model', () => {
  it('every starting acid has the formula its carbon count and α-H predict', () => {
    expect(formulaOf(benchAcid('butanoic').smiles)).toBe('C4H8O2')
    expect(formulaOf(benchAcid('propanoic').smiles)).toBe('C3H6O2')
    expect(formulaOf(benchAcid('ethanoic').smiles)).toBe('C2H4O2')
    expect(formulaOf(benchAcid('bromopropanoic').smiles)).toBe('C3H5BrO2')
    expect(formulaOf(benchAcid('bromoethanoic').smiles)).toBe('C2H3BrO2')
    expect(formulaOf(benchAcid('dimethylpropanoic').smiles)).toBe('C5H10O2')
    expect(formulaOf(benchAcid('benzoic').smiles)).toBe('C7H6O2')
  })

  it('each HVZ step swaps exactly one α-H for the halogen, for every acid, halogen and step count', () => {
    for (const acid of BENCH_ACIDS) {
      if (acid.alphaH === 0) continue
      const hBefore = count(formulaOf(acid.smiles), 'H')
      for (const halogen of ['Cl', 'Br'] as BenchHalogen[]) {
        for (let steps = 1; steps <= maxHvzSteps(acid); steps++) {
          const product = hvzProductSmiles(acid, halogen, steps)
          expect(product, `${acid.id} ${halogen} ${steps}`).not.toBeNull()
          const formula = formulaOf(product!)
          expect(count(formula, 'H'), `${acid.id} ${halogen} ${steps} H`).toBe(hBefore - steps)
          const existing = (acid.template?.existing ?? []).filter((x) => x === halogen).length
          expect(count(formula, halogen), `${acid.id} ${halogen} ${steps} ${halogen}`).toBe(existing + steps)
        }
      }
    }
  })

  it('the drawn products have their known formulas', () => {
    expect(formulaOf(hvzProductSmiles(benchAcid('butanoic'), 'Br', 1)!)).toBe('C4H7BrO2')
    expect(formulaOf(hvzProductSmiles(benchAcid('butanoic'), 'Cl', 2)!)).toBe('C4H6Cl2O2')
    expect(formulaOf(hvzProductSmiles(benchAcid('ethanoic'), 'Br', 3)!)).toBe('C2HBr3O2')
    expect(formulaOf(benchOutcome(benchAcid('benzoic'), 'nitration', 'Br', 1).productSmiles!)).toBe('C7H5NO4')
  })

  it('acids with no α-H and the aromatic acid give no HVZ product', () => {
    expect(benchOutcome(benchAcid('dimethylpropanoic'), 'hvz', 'Br', 1).productSmiles).toBeNull()
    expect(benchOutcome(benchAcid('benzoic'), 'hvz', 'Br', 1).productSmiles).toBeNull()
  })

  it('nitration and Friedel–Crafts act only on the ring, and the COOH ring gives NCERT’s reasons', () => {
    expect(benchOutcome(benchAcid('butanoic'), 'nitration', 'Br', 1).productSmiles).toBeNull()
    expect(benchOutcome(benchAcid('benzoic'), 'friedel-crafts', 'Br', 1).productSmiles).toBeNull()
    expect(benchOutcome(benchAcid('benzoic'), 'friedel-crafts', 'Br', 1).reason).toContain('AlCl₃ binds')
  })
})
