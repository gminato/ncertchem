import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { acidStrengthOrder, alphaCarbon, alphaInductive, carboxylCarbon } from './inductive-acids'

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
