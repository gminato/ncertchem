import { describe, expect, it } from 'vitest'
import {
  classifyHalide,
  classifyHalideSmiles,
  eliminationProducts,
  formulaUnicode,
  isAromaticRingCarbon,
  monohaloIsomers,
  nitroActivation,
  stereocentres,
  substitute,
  toKekuleSmiles,
} from './haloalkanes'
import { parseSmiles } from './molecule-parse'

const halideOf = (smiles: string) => {
  const g = parseSmiles(smiles)
  const x = g.atoms.findIndex((a) => ['F', 'Cl', 'Br', 'I'].includes(a.element))
  return classifyHalide(g, x)
}

describe('toKekuleSmiles (round trip)', () => {
  it.each(['CCO', 'CC(C)CC(C)(C)C', 'C=CCCl', 'BrC1=CC=CC=C1', 'CC(Cl)C1=CC=CC=C1', 'ClC(Cl)(Cl)Cl', 'C1CCCCC1', 'CC[N+](C)(C)C', 'CC(=O)Cl'])
    ('keeps the molecule for %s', (smiles) => {
      const g = parseSmiles(smiles)
      const back = parseSmiles(toKekuleSmiles(g))
      expect(toKekuleSmiles(back)).toBe(toKekuleSmiles(g))
      expect(back.atoms.length).toBe(g.atoms.length)
    })
})

describe('isAromaticRingCarbon', () => {
  it('is true for ring carbons of benzene and false for chain carbons', () => {
    const g = parseSmiles('BrC1=CC=CC=C1')
    expect(isAromaticRingCarbon(g, 1)).toBe(true)
    expect(isAromaticRingCarbon(g, 0)).toBe(false)
  })
  it('is false for cyclohexane carbons', () => {
    expect(isAromaticRingCarbon(parseSmiles('C1CCCCC1'), 0)).toBe(false)
  })
})

describe('classifyHalide', () => {
  it.each([
    ['CCCl', 'alkyl', '1°', 'sp3'],
    ['CC(Br)C', 'alkyl', '2°', 'sp3'],
    ['CC(C)(C)Cl', 'alkyl', '3°', 'sp3'],
    ['ClC', 'alkyl', 'methyl', 'sp3'],
    ['C=CCCl', 'allylic', '1°', 'sp3'],
    ['BrCC1=CC=CC=C1', 'benzylic', '1°', 'sp3'],
    ['CC(Cl)C1=CC=CC=C1', 'benzylic', '2°', 'sp3'],
    ['C=CCl', 'vinylic', null, 'sp2'],
    ['BrC1=CC=CC=C1', 'aryl', null, 'sp2'],
  ] as const)('classifies %s as %s (%s)', (smiles, kind, degree, hyb) => {
    const c = halideOf(smiles)
    expect(c.kind).toBe(kind)
    expect(c.degree).toBe(degree)
    expect(c.hybridisation).toBe(hyb)
  })

  it('names the deciding neighbour for allylic, benzylic and vinylic halides', () => {
    const allyl = parseSmiles('C=CCCl')
    expect(classifyHalide(allyl, 3).decidingNeighbour).toBe(1)
    const benzyl = parseSmiles('BrCC1=CC=CC=C1')
    expect(classifyHalide(benzyl, 0).decidingNeighbour).toBe(2)
    const vinyl = parseSmiles('C=CCl')
    expect(classifyHalide(vinyl, 2).decidingNeighbour).toBe(0)
  })

  it('gives null for the deciding neighbour of an alkyl halide', () => {
    expect(halideOf('CCCl').decidingNeighbour).toBeNull()
  })
})

describe('classifyHalideSmiles', () => {
  it.each([
    ['CC(Cl)Cl', 2, 'di', 'geminal'],
    ['ClCCCl', 2, 'di', 'vicinal'],
    ['ClC(Cl)Cl', 3, 'tri', null],
    ['ClC(Cl)(Cl)Cl', 4, 'poly', null],
    ['CCCl', 1, 'mono', null],
  ] as const)('%s: %i halogen(s), %s, dihalide %s', (smiles, count, word, dihalide) => {
    const r = classifyHalideSmiles(smiles)
    expect(r.count).toBe(count)
    expect(r.countWord).toBe(word)
    expect(r.dihalide).toBe(dihalide)
    expect(r.halides).toHaveLength(count)
  })

  it('classifies each halogen of a dihalide', () => {
    const r = classifyHalideSmiles('ClCCCl')
    expect(r.halides.map((h) => h.kind)).toEqual(['alkyl', 'alkyl'])
  })
})

describe('monohaloIsomers', () => {
  it('propane gives 1-bromopropane (6 H) and 2-bromopropane (2 H)', () => {
    const r = monohaloIsomers('CCC', 'Br')
    expect(r).toHaveLength(2)
    const primary = r.find((p) => p.name === '1-bromopropane')
    const secondary = r.find((p) => p.name === '2-bromopropane')
    expect(primary?.hydrogens).toBe(6)
    expect(secondary?.hydrogens).toBe(2)
    expect(primary?.formula).toBe('C3H7Br')
  })

  it('butane gives two monobromo isomers, 1-bromobutane and 2-bromobutane', () => {
    const r = monohaloIsomers('CCCC', 'Br')
    expect(r.map((p) => p.name).sort()).toEqual(['1-bromobutane', '2-bromobutane'])
    expect(r.reduce((s, p) => s + p.hydrogens, 0)).toBe(10)
  })

  it('2-methylpropane gives two isomers, 1-chloro and 2-chloro', () => {
    const r = monohaloIsomers('CC(C)C', 'Cl')
    expect(r).toHaveLength(2)
    expect(r.find((p) => p.hydrogens === 9)?.formula).toBe('C4H9Cl')
    const tertiary = r.find((p) => p.name === '2-chloro-2-methylpropane')
    expect(tertiary?.hydrogens).toBe(1)
  })

  it('rejects a molecule that is not a saturated hydrocarbon', () => {
    expect(() => monohaloIsomers('C=C', 'Br')).toThrow(RangeError)
  })
})

describe('stereocentres', () => {
  it.each([
    ['CC(O)CC', [1]],
    ['CC(O)C', []],
    ['CC(Br)CC', [1]],
    ['CCCCCCC(C)Br', [6]], // 2-bromooctane
    ['OCC(C)CC', [2]],
    ['ClCC(C)CC', [2]],
    ['OCC(O)C=O', [2]],
    ['FC(Cl)Br', [1]],
    ['C1CCCCC1Br', []],
    ['CC1CCCCC1Br', [1, 6]],
    ['CCC(CC)Br', []],
    ['CC(Br)C(Br)C', [1, 3]],
  ] as const)('%s gives stereocentres %j', (smiles, expected) => {
    expect(stereocentres(parseSmiles(smiles))).toEqual(expected)
  })
})

describe('eliminationProducts', () => {
  it('2-bromopentane gives pent-2-ene (Zaitsev) and pent-1-ene', () => {
    const r = eliminationProducts('CCCC(Br)C')
    const p2 = r.find((p) => p.name === 'pent-2-ene')
    const p1 = r.find((p) => p.name === 'pent-1-ene')
    expect(p2).toMatchObject({ alkylGroups: 2, zaitsev: true })
    expect(p1).toMatchObject({ alkylGroups: 1, zaitsev: false })
    expect(p2?.betaHydrogens).toBe(2)
    expect(p1?.betaHydrogens).toBe(3)
    expect(r).toHaveLength(2)
  })

  it('2-bromo-2-methylbutane gives 2-methylbut-2-ene (Zaitsev, 3) and 2-methylbut-1-ene (2)', () => {
    const r = eliminationProducts('CCC(C)(C)Br')
    const major = r.find((p) => p.name === '2-methylbut-2-ene')
    const minor = r.find((p) => p.name === '2-methylbut-1-ene')
    expect(major).toMatchObject({ alkylGroups: 3, zaitsev: true })
    expect(minor).toMatchObject({ alkylGroups: 2, zaitsev: false })
    expect(r).toHaveLength(2)
  })

  it('bromoethane gives ethene', () => {
    const r = eliminationProducts('CCBr')
    expect(r).toHaveLength(1)
    expect(r[0].smiles).toBe('C=C')
    expect(r[0].name).toBe('ethene')
    expect(r[0].zaitsev).toBe(true)
  })

  it('2-bromo-2-methylpropane gives one product', () => {
    const r = eliminationProducts('CC(C)(C)Br')
    expect(r).toHaveLength(1)
    expect(r[0].smiles).toBe('C=C(C)C')
  })

  it.each([['CBr'], ['CC(C)(C)CBr']])('%s has no beta hydrogen, so no product', (smiles) => {
    expect(eliminationProducts(smiles)).toEqual([])
  })

  it('accepts a graph as input', () => {
    expect(eliminationProducts(parseSmiles('CCBr'))).toHaveLength(1)
  })
})

describe('substitute', () => {
  it('replaces Br by OH (alcohol) and names it', () => {
    const p = substitute('CCBr', 'first', 'O')
    expect(p.smiles).toBe('CCO')
    expect(p.formula).toBe('C2H6O')
    expect(p.name).toBe('ethanol')
  })

  it('replaces Br by OCH3 (methyl ether)', () => {
    const p = substitute('CCBr', 'first', 'OC')
    expect(p.formula).toBe('C3H8O')
    expect(p.smiles).toBe('CCOC')
  })

  it('replaces Br by NH2 (amine)', () => {
    const p = substitute('CCBr', 'first', 'N')
    expect(p.smiles).toBe('CCN')
    expect(p.formula).toBe('C2H7N')
    expect(p.name).toBe('ethanamine')
  })

  it('replaces Br by CN (nitrile)', () => {
    const p = substitute('CCBr', 'first', 'C#N')
    expect(p.smiles).toBe('CCC#N')
    expect(p.formula).toBe('C3H5N')
  })

  it('replaces Br by NC (isocyanide) with charges', () => {
    const p = substitute('CCBr', 'first', '[N+]#[C-]')
    expect(p.formula).toBe('C3H5N')
  })

  it('replaces Br by ONO (alkyl nitrite)', () => {
    const p = substitute('CCBr', 'first', 'ON=O')
    expect(p.formula).toBe('C2H5NO2')
  })

  it('replaces Br by NO2 (nitroalkane)', () => {
    const p = substitute('CCBr', 'first', '[N+](=O)[O-]')
    expect(p.formula).toBe('C2H5NO2')
  })

  it('replaces Br by H (alkane) and by a methyl group', () => {
    expect(substitute('CCBr', 'first', '[H]').smiles).toBe('CC')
    expect(substitute('CCBr', 'first', '').name).toBe('ethane')
    expect(substitute('CCBr', 'first', 'C').name).toBe('propane')
  })

  it('replaces a halogen by index and rejects a non-halogen position', () => {
    expect(substitute('ClCBr', 2, 'O').smiles).toBe('ClCO')
    expect(() => substitute('CCO', 'first', 'O')).toThrow(RangeError)
  })
})

describe('nitroActivation', () => {
  it('ortho or para nitro activates the ring', () => {
    expect(nitroActivation([4])).toEqual({ orthoPara: [4], meta: [], activated: true, chargeSites: [2, 4, 6] })
    expect(nitroActivation([2, 4])).toMatchObject({ orthoPara: [2, 4], activated: true })
  })

  it('a meta nitro does not activate the ring', () => {
    expect(nitroActivation([3])).toEqual({ orthoPara: [], meta: [3], activated: false, chargeSites: [2, 4, 6] })
    expect(nitroActivation([5])).toMatchObject({ meta: [5], activated: false })
  })

  it('rejects a position that is not on the ring', () => {
    expect(() => nitroActivation([1])).toThrow(RangeError)
  })
})

describe('formulaUnicode', () => {
  it('writes subscripts', () => {
    expect(formulaUnicode('C4H9Br')).toBe('C₄H₉Br')
    expect(formulaUnicode('CH3Cl')).toBe('CH₃Cl')
  })
})
