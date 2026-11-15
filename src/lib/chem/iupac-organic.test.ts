import { describe, expect, it } from 'vitest'
import { iupacName, nameSteps } from './iupac-organic'
import { parseSmiles } from './molecule-parse'

function name(smiles: string): string {
  return iupacName(parseSmiles(smiles))
}

describe('iupacName: alkanes and branched alkanes', () => {
  it.each([
    ['C', 'methane'],
    ['CC', 'ethane'],
    ['CCCC', 'butane'],
    ['CC(C)C', '2-methylpropane'],
    ['CCC(C)C', '2-methylbutane'],
    ['CC(C)(C)C', '2,2-dimethylpropane'],
    ['CC(C)CC(C)(C)C', '2,2,4-trimethylpentane'],
    ['CC(C)C(CC)CCC', '3-ethyl-2-methylhexane'],
    ['CC(C)CCC(C)C(C)CC', '2,5,6-trimethyloctane'],
    ['CCC(CC)CC(C)CC', '3-ethyl-5-methylheptane'],
    ['CCCCCCCC', 'octane'],
    ['CC(C)C(C)C', '2,3-dimethylbutane'],
    ['CCCCCCC', 'heptane'],
    ['C'.repeat(20), 'icosane'],
    ['C'.repeat(30), 'triacontane'],
  ])('%s is %s', (smiles, expected) => {
    expect(name(smiles)).toBe(expected)
  })

  it('uses the NCERT trivial names isopropyl and sec-butyl for alkyl groups', () => {
    expect(name('CC(C)CC(C)C(C)C')).toBe('2,3,5-trimethylhexane')
    expect(name('CC(C)C1CCCCC1')).toBe('isopropylcyclohexane')
    expect(name('CCC(C)C(CC)C')).toBe('3,4-dimethylhexane')
  })

  it('keeps the NCERT figure 5-sec-butyl-4-isopropyldecane', () => {
    expect(name('CCCC(C(C)C)C(C(C)CC)CCCCC')).toBe('5-sec-butyl-4-isopropyldecane')
  })

  it('names a neopentyl-type substituent systematically, as NCERT does in its figure', () => {
    expect(name('CCCCC(CC(C)(C)C)CCCC')).toBe('5-(2,2-dimethylpropyl)nonane')
  })

  it('gives multi-substituted alkyl groups in brackets', () => {
    expect(name('CCCCC(CC(C)(C)C)CCCC')).toContain('(2,2-dimethylpropyl)')
  })
})

describe('iupacName: alkenes, alkynes and multiple bonds', () => {
  it.each([
    ['C=C', 'ethene'],
    ['CC=C', 'propene'],
    ['CC=CC', 'but-2-ene'],
    ['C=CCC', 'but-1-ene'],
    ['C=CC=C', 'buta-1,3-diene'],
    ['C#C', 'ethyne'],
    ['CC#CC', 'but-2-yne'],
    ['C=CC#C', 'but-1-en-3-yne'],
    ['C=C(C)C', '2-methylprop-1-ene'],
    ['C=CC=CC#C', 'hexa-1,3-dien-5-yne'],
    ['CC(O)C=CC', 'pent-3-en-2-ol'],
  ])('%s is %s', (smiles, expected) => {
    expect(name(smiles)).toBe(expected)
  })

  it('chooses the chain with the most multiple bonds before the longest chain', () => {
    expect(name('C=CC(C)C')).toBe('3-methylbut-1-ene')
  })
})

describe('iupacName: principal functional groups (Table 8.4 and priority order)', () => {
  it.each([
    ['CO', 'methanol'],
    ['CCO', 'ethanol'],
    ['CCCO', 'propan-1-ol'],
    ['CC(O)CC', 'butan-2-ol'],
    ['CC(C)(C)O', '2-methylpropan-2-ol'],
    ['CCCCCCO', 'hexan-1-ol'],
    ['CCCC=O', 'butanal'],
    ['C=CC=O', 'prop-2-enal'],
    ['CCC(=O)CC', 'pentan-3-one'],
    ['CCC(C)=O', 'butan-2-one'],
    ['CCCCC#N', 'pentanenitrile'],
    ['CCCC(N)=O', 'butanamide'],
    ['CCCCN', 'butan-1-amine'],
    ['CCC(C)N', 'butan-2-amine'],
    ['CC(=O)OC', 'methyl ethanoate'],
    ['CCC(=O)OC', 'methyl propanoate'],
    ['CC(=O)Cl', 'ethanoyl chloride'],
    ['CCCC(=O)O', 'butanoic acid'],
    ['CC(O)C(=O)O', '2-hydroxypropanoic acid'],
    ['OC(=O)CCCC(C)=O', '5-oxohexanoic acid'],
    ['CCC(=O)CC(=O)C', 'hexane-2,4-dione'],
    ['CC(O)CCCCC=O', '6-hydroxyheptanal'],
    ['CCC(O)CCC(C)CC', '6-methyloctan-3-ol'],
  ])('%s is %s', (smiles, expected) => {
    expect(name(smiles)).toBe(expected)
  })

  it('ranks acids over alcohols and ketones: the OH becomes hydroxy and the ketone oxo', () => {
    expect(name('CC(=O)CC(O)C(=O)O')).toBe('2-hydroxy-4-oxopentanoic acid')
  })

  it('gives halo and nitro prefixes when no principal group is present', () => {
    expect(name('CCCCBr')).toBe('1-bromobutane')
    expect(name('CCCCC(C)Cl')).toBe('2-chlorohexane')
    expect(name('CCCC[N+](=O)[O-]')).toBe('1-nitrobutane')
    expect(name('ClCCCl')).toBe('1,2-dichloroethane')
    expect(name('CC(Cl)C')).toBe('2-chloropropane')
  })

  it('treats a dinitrile with both nitrile carbons in the chain', () => {
    expect(name('OC(C#N)C#N')).toBe('2-hydroxypropanedinitrile')
  })

  it('names the Problem 8.5 ester-free alcohol', () => {
    expect(name('OCCCC(C)C(C)C')).toBe('4,5-dimethylhexan-1-ol')
  })
})

describe('iupacName: cyclic compounds', () => {
  it.each([
    ['C1CC1', 'cyclopropane'],
    ['C1CCCCC1', 'cyclohexane'],
    ['CC1CCCC1', 'methylcyclopentane'],
    ['CCCC1CCCC(C)C1', '1-methyl-3-propylcyclohexane'],
    ['C1=CCCCC1', 'cyclohexene'],
    ['OC1CCCC=C1', 'cyclohex-2-en-1-ol'],
    ['C1=CC([N+](=O)[O-])CCC1', '3-nitrocyclohexene'],
    ['CC(C)C1CCCCC1', 'isopropylcyclohexane'],
  ])('%s is %s', (smiles, expected) => {
    expect(name(smiles)).toBe(expected)
  })

  it('rejects heterocycles and fused rings', () => {
    expect(() => name('C1CCNCC1')).toThrow(RangeError)
    expect(() => name('C1CCC2CCCC2C1')).toThrow(RangeError)
  })
})

describe('iupacName: benzene derivatives', () => {
  it.each([
    ['C1=CC=CC=C1', 'benzene'],
    ['CC1=CC=CC=C1', 'methylbenzene'],
    ['OC1=CC=CC=C1', 'phenol'],
    ['NC1=CC=CC=C1', 'aniline'],
    ['O=[N+]([O-])C1=CC=CC=C1', 'nitrobenzene'],
    ['BrC1=CC=CC=C1Br', '1,2-dibromobenzene'],
    ['BrC1=CC(Br)=CC=C1', '1,3-dibromobenzene'],
    ['BrC1=CC=C(Br)C=C1', '1,4-dibromobenzene'],
    ['OC1=CC(C)=C(C)C=C1', '3,4-dimethylphenol'],
    ['CC1=C(Cl)C=C([N+](=O)[O-])C=C1', '2-chloro-1-methyl-4-nitrobenzene'],
    ['CCC1=CC(=C(C=C1)F)[N+](=O)[O-]', '4-ethyl-1-fluoro-2-nitrobenzene'],
    ['COC1=C(Cl)C=C(C)C=C1', '2-chloro-4-methylanisole'],
    ['NC1=C(C)C=C(CC)C=C1', '4-ethyl-2-methylaniline'],
    ['NC1=CC=C([N+](=O)[O-])C=C1', '4-nitroaniline'],
    ['CCC1=CC=CC=C1OC', '2-ethylanisole'],
    ['CCC1=CC=CC=C1', 'ethylbenzene'],
  ])('%s is %s', (smiles, expected) => {
    expect(name(smiles)).toBe(expected)
  })

  it('names a phenyl substituent on a chain, as NCERT Problem 8.10(c) does', () => {
    expect(name('CCC(Br)C(Br)CC1=CC=CC=C1')).toBe('2,3-dibromo-1-phenylpentane')
  })
})

describe('nameSteps', () => {
  it('ends with the name and records the parent chain and each substituent', () => {
    const steps = nameSteps(parseSmiles('CC(C)CC(C)(C)C'))
    expect(steps.at(-1)?.text).toBe('2,2,4-trimethylpentane')
    expect(steps.some((s) => s.kind === 'parent')).toBe(true)
    expect(steps.filter((s) => s.kind === 'substituent')).toHaveLength(3)
  })
})

describe('iupacName rejects what it does not implement', () => {
  it('throws a RangeError naming the feature, never a wrong name', () => {
    expect(() => name('CC(=O)N(C)C')).toThrow(RangeError)
    expect(() => name('C=CC=CC=O')).not.toThrow()
    expect(() => name('CN')).not.toThrow()
  })
})

describe('iupacName: no locant on a two-carbon chain', () => {
  it.each([
    ['ClC=C', 'chloroethene'],
    ['COC=C', 'methoxyethene'],
    ['BrC#C', 'bromoethyne'],
    ['ClC(Cl)=C', '1,1-dichloroethene'],
    ['C=C', 'ethene'],
    ['C=CC', 'propene'],
    ['OCC=C', 'prop-2-en-1-ol'],
  ])('%s is %s', (smiles, name) => {
    expect(iupacName(parseSmiles(smiles))).toBe(name)
  })
})

describe('iupacName: locants on one-carbon parents and with a principal group', () => {
  it.each([
    ['ClC(Cl)(Cl)Cl', 'tetrachloromethane'],
    ['ClC(Cl)Cl', 'trichloromethane'],
    ['ClCCl', 'dichloromethane'],
    ['ClCC(=O)O', '2-chloroethanoic acid'],
    ['CC1CCCCC1O', '2-methylcyclohexanol'], ['ClCCN', '2-chloroethanamine'],
  ])('%s is %s', (smiles, name) => {
    expect(iupacName(parseSmiles(smiles))).toBe(name)
  })
})
