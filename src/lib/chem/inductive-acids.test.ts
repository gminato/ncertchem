import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { acidFormula, acidStrengthOrder, alphaCarbon, alphaInductive, alphaWords, carboxylCarbon } from './inductive-acids'

const ACIDS = {
  acetic: 'CC(=O)O',
  chloro: 'ClCC(=O)O',
  dichloro: 'ClC(Cl)C(=O)O',
  trichloro: 'ClC(Cl)(Cl)C(=O)O',
  propanoic: 'CCC(=O)O',
}

describe('alpha-inductive counts', () => {
  it('finds the carboxyl carbon and the alpha carbon', () => {
    const g = parseSmiles(ACIDS.chloro)
    expect(carboxylCarbon(g)).toBe(2)
    expect(alphaCarbon(g)).toBe(1)
  })

  it('counts each halogen on the alpha carbon as -I', () => {
    expect(alphaInductive(parseSmiles(ACIDS.acetic))).toEqual({ withdrawing: 0, donating: 0, balance: 0 })
    expect(alphaInductive(parseSmiles(ACIDS.chloro)).withdrawing).toBe(1)
    expect(alphaInductive(parseSmiles(ACIDS.dichloro)).withdrawing).toBe(2)
    expect(alphaInductive(parseSmiles(ACIDS.trichloro)).withdrawing).toBe(3)
  })

  it('counts an alkyl group on the alpha carbon as +I', () => {
    expect(alphaInductive(parseSmiles(ACIDS.propanoic))).toEqual({ withdrawing: 0, donating: 1, balance: -1 })
  })

  it('orders the acids from trichloro to propanoic (qualitative)', () => {
    const acids = Object.values(ACIDS).map((s) => parseSmiles(s))
    const names = acidStrengthOrder(acids).map((i) => Object.keys(ACIDS)[i])
    expect(names).toEqual(['trichloro', 'dichloro', 'chloro', 'acetic', 'propanoic'])
  })

  it('throws for a molecule without a carboxyl group', () => {
    expect(() => carboxylCarbon(parseSmiles('CCO'))).toThrow(RangeError)
  })
})

describe('acid labels from the counts', () => {
  it('writes the condensed formula of each acid', () => {
    expect(acidFormula(parseSmiles(ACIDS.acetic))).toBe('CH₃COOH')
    expect(acidFormula(parseSmiles(ACIDS.chloro))).toBe('ClCH₂COOH')
    expect(acidFormula(parseSmiles(ACIDS.dichloro))).toBe('Cl₂CHCOOH')
    expect(acidFormula(parseSmiles(ACIDS.trichloro))).toBe('Cl₃CCOOH')
    expect(acidFormula(parseSmiles(ACIDS.propanoic))).toBe('CH₃CH₂COOH')
  })

  it('describes the α-carbon groups in words', () => {
    expect(alphaWords(parseSmiles(ACIDS.trichloro))).toBe('3 Cl on the α carbon (−I)')
    expect(alphaWords(parseSmiles(ACIDS.propanoic))).toBe('one CH₃ on the α carbon (+I)')
    expect(alphaWords(parseSmiles(ACIDS.acetic))).toBe('no group on the α carbon')
  })
})
