import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  COMPOUNDS,
  carboxylateName,
  compoundName,
  compoundSmiles,
  reductionProduct,
  testResult,
} from './carbonyl-tests'

const formula = (smiles: string) => molecularFormula(parseSmiles(smiles))

describe('carbonyl-test molecules', () => {
  it.each([
    ['butanal', 'C4H8O', 'butanal'],
    ['benzaldehyde', 'C7H6O', 'benzaldehyde'],
    ['pentan-3-one', 'C5H10O', 'pentan-3-one'],
    ['butan-2-one', 'C4H8O', 'butan-2-one'],
    ['propan-2-ol', 'C3H8O', 'propan-2-ol'],
  ] as const)('%s has formula %s and namer name %s', (id, f, name) => {
    expect(formula(compoundSmiles(id))).toBe(f)
    expect(compoundName(id)).toBe(name)
  })
})

describe('tests and products', () => {
  it('Tollens and Fehling oxidise the aliphatic aldehyde to butanoate', () => {
    expect(testResult('butanal', 'tollens')).toEqual({ outcome: 'mirror', productName: 'butanoic acid', productLabel: 'butanoate ion' })
    expect(testResult('butanal', 'fehling').outcome).toBe('red-precipitate')
    expect(testResult('butanal', 'fehling').productLabel).toBe('butanoate ion')
  })

  it("Fehling's gives no result for the aromatic aldehyde; Tollens' does", () => {
    expect(testResult('benzaldehyde', 'fehling')).toEqual({ outcome: 'no-change', productName: null, productLabel: null })
    expect(testResult('benzaldehyde', 'tollens').outcome).toBe('mirror')
    expect(testResult('benzaldehyde', 'tollens').productName).toBe('benzoic acid')
  })

  it('ketones give no mild-test result', () => {
    for (const c of ['pentan-3-one', 'butan-2-one'] as const) {
      expect(testResult(c, 'tollens').outcome).toBe('no-change')
      expect(testResult(c, 'fehling').outcome).toBe('no-change')
    }
  })

  it('iodoform: butan-2-one and propan-2-ol give yellow CHI3 and a sodium carboxylate', () => {
    expect(testResult('butan-2-one', 'iodoform')).toEqual({ outcome: 'yellow-precipitate', productName: 'propanoic acid', productLabel: 'sodium propanoate' })
    expect(testResult('propan-2-ol', 'iodoform')).toEqual({ outcome: 'yellow-precipitate', productName: 'ethanoic acid', productLabel: 'sodium ethanoate' })
    expect(testResult('pentan-3-one', 'iodoform').outcome).toBe('no-change')
    expect(testResult('butanal', 'iodoform').outcome).toBe('no-change')
  })

  it('carboxylateName turns an acid name into the anion name', () => {
    expect(carboxylateName('propanoic acid')).toBe('propanoate')
    expect(carboxylateName('benzoic acid')).toBe('benzoate')
  })
})

describe('reduction products', () => {
  it('hydride reduction gives the alcohol, with the formula of the alcohol', () => {
    const r = reductionProduct('butanal', 'hydride')
    expect(r?.name).toBe('butan-1-ol')
    expect(formula(r!.smiles)).toBe('C4H10O')
    expect(reductionProduct('pentan-3-one', 'hydride')?.name).toBe('pentan-3-ol')
    expect(formula(reductionProduct('pentan-3-one', 'hydride')!.smiles)).toBe('C5H12O')
  })

  it('hydrocarbon reduction removes the oxygen', () => {
    const r = reductionProduct('butanal', 'hydrocarbon')
    expect(r?.name).toBe('butane')
    expect(formula(r!.smiles)).toBe('C4H10')
    expect(formula(reductionProduct('benzaldehyde', 'hydrocarbon')!.smiles)).toBe('C7H8')
    expect(formula(reductionProduct('pentan-3-one', 'hydrocarbon')!.smiles)).toBe('C5H12')
  })

  it('an alcohol is not reduced, and "none" changes nothing', () => {
    expect(reductionProduct('propan-2-ol', 'hydride')).toBeNull()
    expect(reductionProduct('propan-2-ol', 'hydrocarbon')).toBeNull()
    expect(reductionProduct('butanal', 'none')).toBeNull()
  })

  it('every compound is in the rack list', () => {
    expect(COMPOUNDS).toHaveLength(5)
  })
})
