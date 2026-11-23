import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  HALIDE_GALLERY,
  buildHalideSmiles,
  halideFormula,
  halideVerdict,
  halogenIndex,
  normaliseBuildSpec,
  singleHalideClass,
} from './halide-builder'

const SPEC = { carbons: 3, feature: 'plain' as const, doubleAfter: 1, site: 1, halogen: 'Br' as const }

describe('gallery (P1 fact sheet rows 1 to 12)', () => {
  const expected: [string, string, string, string][] = [
    ['BrCC(C)CC', '1-bromo-2-methylbutane', '1° alkyl halide', 'C₅H₁₁Br'],
    ['CC(C)C(Br)C', '2-bromo-3-methylbutane', '2° alkyl halide', 'C₅H₁₁Br'],
    ['CCC(C)(Br)C', '2-bromo-2-methylbutane', '3° alkyl halide', 'C₅H₁₁Br'],
    ['CC=CCBr', '1-bromobut-2-ene', 'allylic halide', 'C₄H₇Br'],
    ['BrCC1=CC=CC=C1', 'bromophenylmethane', '1° benzylic halide', 'C₇H₇Br'],
    ['CC(Cl)C1=CC=CC=C1', '1-chloro-1-phenylethane', '2° benzylic halide', 'C₈H₉Cl'],
    ['CC(C)(Br)C1=CC=CC=C1', '2-bromo-2-phenylpropane', '3° benzylic halide', 'C₉H₁₁Br'],
    ['C=C(C)Cl', '2-chloroprop-1-ene', 'vinylic halide', 'C₃H₅Cl'],
    ['CCC1=CC(Br)=CC=C1', '1-bromo-3-ethylbenzene', 'aryl halide', 'C₈H₉Br'],
    ['CCC(Cl)(Cl)C', '2,2-dichlorobutane', 'geminal dihalide', 'C₄H₈Cl₂'],
    ['CC(C)C(Br)CBr', '1,2-dibromo-3-methylbutane', 'vicinal dihalide', 'C₅H₁₀Br₂'],
    ['CC(Cl)(Cl)Cl', '1,1,1-trichloroethane', 'polyhalogen compound', 'C₂H₃Cl₃'],
  ]

  it('has the twelve molecules in order', () => {
    expect([...HALIDE_GALLERY]).toEqual(expected.map((row) => row[0]))
  })

  it.each(expected)('%s is named, classed and formulated as the fact sheet says', (smiles, name, verdict, formula) => {
    expect(iupacNameFromSmiles(smiles)).toBe(name)
    expect(halideVerdict(smiles)).toBe(verdict)
    expect(halideFormula(smiles)).toBe(formula)
  })
})

describe('builder', () => {
  it('writes a plain chain with the halogen on the chosen carbon', () => {
    expect(buildHalideSmiles(SPEC)).toBe('C(Br)CC')
    expect(buildHalideSmiles({ ...SPEC, site: 2 })).toBe('CC(Br)C')
  })

  it('puts the double bond after carbon d', () => {
    expect(buildHalideSmiles({ ...SPEC, feature: 'alkene', doubleAfter: 1, site: 3 })).toBe('C=CC(Br)')
    expect(buildHalideSmiles({ ...SPEC, feature: 'alkene', doubleAfter: 2, site: 1 })).toBe('C(Br)C=C')
  })

  it('attaches the chain to a Kekulé benzene ring, or puts the halogen para on the ring', () => {
    expect(buildHalideSmiles({ ...SPEC, feature: 'ring', carbons: 1, site: 1 })).toBe('C1(C(Br))=CC=CC=C1')
    expect(buildHalideSmiles({ ...SPEC, feature: 'ring', carbons: 1, site: 'ring' })).toBe('C1(C)=CC=C(Br)C=C1')
  })

  it('gives the classes the Section teaches', () => {
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, carbons: 1, site: 1 }))).toBe('methyl halide')
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, carbons: 5, site: 1 }))).toBe('1° alkyl halide')
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, feature: 'alkene', doubleAfter: 1, site: 1 }))).toBe('vinylic halide')
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, feature: 'alkene', doubleAfter: 1, site: 3 }))).toBe('allylic halide')
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, feature: 'ring', carbons: 2, site: 1 }))).toBe('2° benzylic halide')
    expect(halideVerdict(buildHalideSmiles({ ...SPEC, feature: 'ring', carbons: 1, site: 'ring' }))).toBe('aryl halide')
  })

  it('builds the formula of the molecule it draws (C5H11Br for a pentyl bromide)', () => {
    const smiles = buildHalideSmiles({ ...SPEC, carbons: 5, site: 3 })
    expect(molecularFormula(parseSmiles(smiles))).toBe('C5H11Br')
    expect(halideFormula(buildHalideSmiles({ ...SPEC, feature: 'ring', carbons: 2, site: 'ring' }))).toBe('C₈H₉Br')
  })

  it('clamps out-of-range specs and drops a double bond from a one-carbon chain', () => {
    expect(normaliseBuildSpec({ ...SPEC, carbons: 9, site: 12 })).toMatchObject({ carbons: 5, site: 5 })
    expect(normaliseBuildSpec({ ...SPEC, carbons: 1, feature: 'alkene' })).toMatchObject({ feature: 'plain', site: 1 })
    expect(normaliseBuildSpec({ ...SPEC, feature: 'alkene', doubleAfter: 9 })).toMatchObject({ doubleAfter: 2 })
  })

  it('names the carbon that carries the halogen for the drawing', () => {
    const smiles = buildHalideSmiles({ ...SPEC, feature: 'alkene', doubleAfter: 1, site: 3 })
    const hal = singleHalideClass(smiles)
    expect(hal.kind).toBe('allylic')
    expect(hal.hybridisation).toBe('sp3')
    expect(halogenIndex(parseSmiles(smiles))).toBeGreaterThan(0)
  })
})
