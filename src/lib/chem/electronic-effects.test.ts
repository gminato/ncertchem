import { describe, expect, it } from 'vitest'
import {
  classifyReagent,
  cleavage,
  contributorRank,
  electrophilicCentres,
  bondPolarity,
  inductiveGroups,
  intermediateStability,
  rankIntermediates,
  resonanceContributors,
} from './electronic-effects'
import { molecularFormula, parseSmiles } from './molecule-parse'

describe('intermediateStability and rankIntermediates (NCERT 8.7.7 to 8.7.9)', () => {
  it('ranks carbocations 3 > 2 > 1 > methyl (Problem 8.19)', () => {
    const list = [
      { kind: 'carbocation' as const, graph: parseSmiles('[CH3+]'), centre: 0 },
      { kind: 'carbocation' as const, graph: parseSmiles('[CH2+]C'), centre: 0 },
      { kind: 'carbocation' as const, graph: parseSmiles('[CH+](C)C'), centre: 0 },
      { kind: 'carbocation' as const, graph: parseSmiles('[C+](C)(C)C'), centre: 0 },
    ]
    expect(rankIntermediates(list)).toEqual([3, 2, 1, 0])
  })

  it('ranks radicals the same way as carbocations', () => {
    const list = [
      { kind: 'radical' as const, graph: parseSmiles('[CH3]'), centre: 0 },
      { kind: 'radical' as const, graph: parseSmiles('[CH2]C'), centre: 0 },
      { kind: 'radical' as const, graph: parseSmiles('[CH](C)C'), centre: 0 },
      { kind: 'radical' as const, graph: parseSmiles('[C](C)(C)C'), centre: 0 },
    ]
    expect(rankIntermediates(list)).toEqual([3, 2, 1, 0])
  })

  it('ranks carbanions the other way round: methyl is the most stable', () => {
    const list = [
      { kind: 'carbanion' as const, graph: parseSmiles('[C-](C)(C)C'), centre: 0 },
      { kind: 'carbanion' as const, graph: parseSmiles('[CH-](C)C'), centre: 0 },
      { kind: 'carbanion' as const, graph: parseSmiles('[CH2-]C'), centre: 0 },
      { kind: 'carbanion' as const, graph: parseSmiles('[CH3-]'), centre: 0 },
    ]
    expect(rankIntermediates(list)).toEqual([3, 2, 1, 0])
  })

  it('reports the hyperconjugation count (alpha-H) and alkyl groups as reasons', () => {
    const tBu = intermediateStability('carbocation', parseSmiles('[C+](C)(C)C'), 0)
    expect(tBu.alphaH).toBe(9)
    expect(tBu.alkylGroups).toBe(3)
    expect(tBu.reasons.length).toBeGreaterThan(0)
  })

  it('rejects a centre of the wrong kind', () => {
    expect(() => intermediateStability('carbocation', parseSmiles('CC'), 0)).toThrow(RangeError)
  })
})

describe('inductiveGroups (NCERT 8.7.5)', () => {
  it('lists the electron-withdrawing and electron-donating groups', () => {
    expect(inductiveGroups.electronWithdrawing).toEqual(
      expect.arrayContaining(['-NO2', '-CN', '-COOH', '-COOR', '-OAr', 'halogens']),
    )
    expect(inductiveGroups.electronDonating).toEqual(expect.arrayContaining(['-CH3', '-C2H5']))
  })
})

describe('classifyReagent (Problems 8.11 and 8.12)', () => {
  it.each([
    ['[SH-]', 'nucleophile'],
    ['[O-]CC', 'nucleophile'],
    ['CN(C)C', 'nucleophile'],
    ['[NH2-]', 'nucleophile'],
    ['O', 'nucleophile'],
    ['FB(F)F', 'electrophile'],
    ['[Cl+]', 'electrophile'],
    ['[C+](C)=O', 'electrophile'],
    ['[N+](=O)=O', 'electrophile'],
    ['[CH3+]', 'electrophile'],
    ['CC=O', 'electrophile'],
    ['CC#N', 'electrophile'],
    ['CI', 'electrophile'],
    ['CC', 'neither'],
  ])('%s is a %s', (smiles, expected) => {
    expect(classifyReagent(parseSmiles(smiles))).toBe(expected)
  })
})

describe('electrophilicCentres (Problem 8.13)', () => {
  it('finds the carbon bonded to a more electronegative atom', () => {
    expect(electrophilicCentres(parseSmiles('CC=O'))).toEqual([1])
    expect(electrophilicCentres(parseSmiles('CC#N'))).toEqual([1])
    expect(electrophilicCentres(parseSmiles('CI'))).toEqual([0])
  })
})

describe('bondPolarity (Problem 8.14)', () => {
  it('is the Pauling electronegativity difference', () => {
    expect(bondPolarity('C', 'Br')).toBeGreaterThan(bondPolarity('C', 'H'))
    expect(bondPolarity('C', 'O')).toBeGreaterThan(bondPolarity('C', 'S'))
    expect(bondPolarity('C', 'C')).toBe(0)
  })
})

describe('resonanceContributors (Problems 8.16 to 8.18)', () => {
  it('carboxylate CH3COO- has two contributors with the same formula', () => {
    const forms = resonanceContributors('carboxylate')
    expect(forms).toHaveLength(2)
    expect(new Set(forms.map(molecularFormula)).size).toBe(1)
  })

  it('nitromethane has two contributors', () => {
    expect(resonanceContributors('nitromethane')).toHaveLength(2)
  })

  it('benzene has two Kekule contributors', () => {
    expect(resonanceContributors('benzene')).toHaveLength(2)
  })

  it('acrolein: the neutral form is ranked above the charge-separated form (Problem 8.17)', () => {
    const [neutral, zwitter] = resonanceContributors('acrolein')
    expect(contributorRank([zwitter, neutral])).toEqual([1, 0])
  })
})

describe('cleavage (Problem 8.11)', () => {
  it('heterolytic: the more electronegative atom takes the pair, giving CH3+ and -SCH3', () => {
    const [carbon, sulphur] = cleavage(parseSmiles('CSC'), 0, 'heterolytic')
    const charge = (g: ReturnType<typeof parseSmiles>) => g.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)
    expect(charge(carbon)).toBe(1)
    expect(charge(sulphur)).toBe(-1)
  })

  it('heterolytic with equal electronegativity: the second atom of the bond takes the pair (CH3CN gives CH3+ and -CN)', () => {
    const [methyl, cyano] = cleavage(parseSmiles('CC#N'), 0, 'heterolytic')
    expect(methyl.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)).toBe(1)
    expect(cyano.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)).toBe(-1)
  })

  it('homolytic: two radical fragments', () => {
    const [a, b] = cleavage(parseSmiles('CC'), 0, 'homolytic')
    expect(a.atoms[0].radical).toBe(1)
    expect(b.atoms[0].radical).toBe(1)
  })

  it('rejects a bond index that does not exist', () => {
    expect(() => cleavage(parseSmiles('CC'), 5, 'homolytic')).toThrow(RangeError)
  })
})
