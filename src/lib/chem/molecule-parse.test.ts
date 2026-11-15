import { describe, expect, it } from 'vitest'
import {
  canonicalKey,
  carbonDegree,
  degreeOfUnsaturation,
  hybridisation,
  molecularFormula,
  parseSmiles,
  toCondensed,
} from './molecule-parse'

describe('parseSmiles', () => {
  it('fills implicit hydrogens by standard valence', () => {
    const g = parseSmiles('CCO')
    expect(g.atoms.map((a) => a.hCount)).toEqual([3, 2, 1])
    expect(molecularFormula(g)).toBe('C2H6O')
  })

  it('reads branches, double and triple bonds', () => {
    const g = parseSmiles('CC(=O)C#N')
    expect(g.bonds).toHaveLength(4)
    expect(molecularFormula(g)).toBe('C3H3NO')
  })

  it('reads bracket atoms with charge and explicit hydrogens', () => {
    expect(molecularFormula(parseSmiles('[NH4+]'))).toBe('H4N+')
    expect(parseSmiles('[O-]').atoms[0].charge).toBe(-1)
    expect(parseSmiles('[CH3+]').atoms[0].hCount).toBe(3)
  })

  it('marks a radical when a bracket atom has fewer hydrogens than its valence', () => {
    expect(parseSmiles('[CH3]').atoms[0].radical).toBe(1)
    expect(parseSmiles('[CH3+]').atoms[0].radical ?? 0).toBe(0)
    expect(parseSmiles('[CH3-]').atoms[0].radical ?? 0).toBe(0)
  })

  it('closes rings with digits', () => {
    const g = parseSmiles('C1CCCCC1')
    expect(g.bonds).toHaveLength(6)
    expect(molecularFormula(g)).toBe('C6H12')
  })

  it('reads a Kekule benzene ring and ring-closure bond orders', () => {
    const g = parseSmiles('C1=CC=CC=C1')
    expect(molecularFormula(g)).toBe('C6H6')
    expect(parseSmiles('C1C=CC=CC=1').bonds.filter((b) => b.order === 2)).toHaveLength(3)
  })

  it('reads nitro groups written with charges', () => {
    expect(molecularFormula(parseSmiles('C[N+](=O)[O-]'))).toBe('CH3NO2')
  })

  it('rejects unsupported input with a RangeError', () => {
    expect(() => parseSmiles('c1ccccc1')).toThrow(RangeError)
    expect(() => parseSmiles('C/C=C/C')).toThrow(RangeError)
    expect(() => parseSmiles('C(C')).toThrow(RangeError)
    expect(() => parseSmiles('')).toThrow(RangeError)
    expect(() => parseSmiles('CX')).toThrow(RangeError)
    expect(() => parseSmiles('C(C)(C)(C)(C)C')).toThrow(RangeError)
  })
})

describe('molecularFormula', () => {
  it('uses Hill order: C, H, then alphabetical', () => {
    expect(molecularFormula(parseSmiles('ClCCl'))).toBe('CH2Cl2')
    expect(molecularFormula(parseSmiles('OCCN'))).toBe('C2H7NO')
  })

  it('uses alphabetical order when there is no carbon', () => {
    expect(molecularFormula(parseSmiles('O'))).toBe('H2O')
  })
})

describe('degreeOfUnsaturation', () => {
  it('counts rings and multiple bonds', () => {
    expect(degreeOfUnsaturation(parseSmiles('CCCCCC'))).toBe(0)
    expect(degreeOfUnsaturation(parseSmiles('C1CCCCC1'))).toBe(1)
    expect(degreeOfUnsaturation(parseSmiles('C#C'))).toBe(2)
    expect(degreeOfUnsaturation(parseSmiles('C1=CC=CC=C1'))).toBe(4)
  })
})

describe('hybridisation (NCERT 8.2.1)', () => {
  it('gives sp3 for saturated carbon, sp2 for C=O and C=C, sp for C#N and C#C', () => {
    expect(hybridisation(parseSmiles('CC'), 0)).toBe('sp3')
    expect(hybridisation(parseSmiles('C=O'), 0)).toBe('sp2')
    expect(hybridisation(parseSmiles('C=C'), 0)).toBe('sp2')
    expect(hybridisation(parseSmiles('CC#N'), 1)).toBe('sp')
    expect(hybridisation(parseSmiles('C=C=C'), 1)).toBe('sp')
  })

  it('gives sp2 for a planar carbocation or radical centre', () => {
    expect(hybridisation(parseSmiles('[CH3+]'), 0)).toBe('sp2')
    expect(hybridisation(parseSmiles('[CH3]'), 0)).toBe('sp2')
  })

  it('rejects non-carbon atoms', () => {
    expect(() => hybridisation(parseSmiles('CN'), 1)).toThrow(RangeError)
  })
})

describe('carbonDegree', () => {
  it('counts carbon neighbours: 1, 2, 3 or 4 degree', () => {
    expect(carbonDegree(parseSmiles('CCC'), 0)).toBe('1°')
    expect(carbonDegree(parseSmiles('CCC'), 1)).toBe('2°')
    expect(carbonDegree(parseSmiles('CC(C)C'), 1)).toBe('3°')
    expect(carbonDegree(parseSmiles('CC(C)(C)C'), 1)).toBe('4°')
  })

  it('rejects a carbon with no carbon neighbour', () => {
    expect(() => carbonDegree(parseSmiles('C'), 0)).toThrow(RangeError)
  })
})

describe('toCondensed', () => {
  it('writes a chain with branches in NCERT style', () => {
    expect(toCondensed(parseSmiles('CCO'))).toBe('CH3CH2OH')
    expect(toCondensed(parseSmiles('CCC(C)C'))).toBe('CH3CH2CH(CH3)CH3')
  })

  it('collapses a run of three or more CH2 units into a bracket', () => {
    expect(toCondensed(parseSmiles('CCCCCC'))).toBe('CH3(CH2)4CH3')
    expect(toCondensed(parseSmiles('CCCC'))).toBe('CH3CH2CH2CH3')
  })

  it('writes multiple bonds', () => {
    expect(toCondensed(parseSmiles('C=CC'))).toBe('CH2=CHCH3')
  })

  it('rejects rings', () => {
    expect(() => toCondensed(parseSmiles('C1CCCCC1'))).toThrow(RangeError)
  })
})

describe('canonicalKey', () => {
  it('treats two drawings of the same molecule as equal', () => {
    expect(canonicalKey(parseSmiles('CCO'))).toBe(canonicalKey(parseSmiles('OCC')))
    expect(canonicalKey(parseSmiles('C1CCCCC1C'))).toBe(canonicalKey(parseSmiles('CC1CCCCC1')))
  })

  it('separates different molecules', () => {
    expect(canonicalKey(parseSmiles('CCCC'))).not.toBe(canonicalKey(parseSmiles('CC(C)C')))
  })
})
