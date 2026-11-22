import { describe, expect, it } from 'vitest'
import { fig63Entry, rateFactor, raceSubstrates, rateLaw } from './substitution-race'
import { molecularFormula, parseSmiles } from './molecule-parse'

describe('substitution race', () => {
  const subs = raceSubstrates()
  const byId = Object.fromEntries(subs.map((s) => [s.id, s]))

  it('classifies the six substrates', () => {
    expect(byId.methyl).toMatchObject({ kind: 'alkyl', degree: 'methyl', halogen: 'Br' })
    expect(byId.primary).toMatchObject({ kind: 'alkyl', degree: '1°' })
    expect(byId.secondary).toMatchObject({ kind: 'alkyl', degree: '2°' })
    expect(byId.tertiary).toMatchObject({ kind: 'alkyl', degree: '3°' })
    expect(byId.allylic).toMatchObject({ kind: 'allylic', halogen: 'Br' })
    expect(byId.benzylic).toMatchObject({ kind: 'benzylic', halogen: 'Cl' })
  })

  it('gives formulas that match the drawn molecules', () => {
    expect(byId.methyl.formula).toBe('CH₃Br')
    expect(byId.primary.formula).toBe('C₂H₅Br')
    expect(byId.tertiary.formula).toBe('C₄H₉Br')
    expect(byId.allylic.formula).toBe('C₃H₅Br')
    expect(byId.benzylic.formula).toBe('C₇H₇Cl')
    expect(molecularFormula(parseSmiles('ClCC1=CC=CC=C1'))).toBe('C7H7Cl')
  })

  it('names the substrates and products with the namer', () => {
    expect(byId.tertiary.name).toBe('2-bromo-2-methylpropane')
    expect(byId.tertiary.product.name).toBe('2-methylpropan-2-ol')
    expect(byId.methyl.product.name).toBe('methanol')
  })

  it('multiplies the rate by the rate law', () => {
    expect(rateFactor('SN2', 2, 2)).toBe(4)
    expect(rateFactor('SN2', 3, 2)).toBe(6)
    expect(rateFactor('SN1', 2, 3)).toBe(2)
    expect(rateLaw('SN1')).toBe('rate = k[RX]')
  })

  it('reads Fig. 6.3 only for alkyl halides', () => {
    expect(fig63Entry('alkyl', 'methyl')?.relativeRate).toBe(30)
    expect(fig63Entry('alkyl', '1°')?.relativeRate).toBe(1)
    expect(fig63Entry('alkyl', '2°')?.relativeRate).toBe(0.02)
    expect(fig63Entry('alkyl', '3°')?.relativeRate).toBe(0)
    expect(fig63Entry('allylic', '1°')).toBeNull()
    expect(fig63Entry('benzylic', '1°')).toBeNull()
  })
})
