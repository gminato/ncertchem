import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import {
  classifyMolecule,
  functionalGroups,
  isAromaticRing,
  principalGroup,
  inducedRings,
  type GroupId,
} from './classification'

const cls = (s: string) => classifyMolecule(parseSmiles(s))
const principal = (s: string) => principalGroup(functionalGroups(parseSmiles(s)))

describe('classifyMolecule (NCERT tree, Section 8.4)', () => {
  it.each([
    ['CCCCCC', 'acyclic', 'open chain'],
    ['C1CCCCC1', 'alicyclic', 'homocyclic'],
    ['C1=CCCCC1', 'alicyclic', 'homocyclic'],
    ['C1=CC=CC=C1', 'aromatic', 'benzenoid'],
    ['C1=CC=C2C=CC=CC2=C1', 'aromatic', 'benzenoid'],
    ['O=C1C=CC=CC=C1', 'aromatic', 'non-benzenoid'],
    ['C1=COC=C1', 'heterocyclic', 'heterocyclic aromatic'],
    ['C1=CC=NC=C1', 'heterocyclic', 'heterocyclic aromatic'],
    ['C1=CSC=C1', 'heterocyclic', 'heterocyclic aromatic'],
    ['C1CCOC1', 'heterocyclic', 'heterocyclic non-aromatic'],
    ['C1CCNC1', 'heterocyclic', 'heterocyclic non-aromatic'],
  ])('%s is %s / %s', (smiles, ringClass, subclass) => {
    const c = cls(smiles)
    expect(c.ringClass).toBe(ringClass)
    expect(c.subclass).toBe(subclass)
  })

  it('finds two induced rings in naphthalene (both aromatic), not the 10-atom perimeter', () => {
    const g = parseSmiles('C1=CC=C2C=CC=CC2=C1')
    expect(inducedRings(g)).toHaveLength(2)
    expect(classifyMolecule(g).aromaticRings).toHaveLength(2)
  })

  it('does not call cyclohexa-1,3-diene aromatic (sp3 carbons break the ring)', () => {
    const g = parseSmiles('C1=CC=CCC1')
    expect(classifyMolecule(g).ringClass).toBe('alicyclic')
  })

  it('does not call cyclobutadiene aromatic (4 π electrons, 4n)', () => {
    const g = parseSmiles('C1=CC=C1')
    expect(isAromaticRing(g, [0, 1, 2, 3])).toBe(false)
  })
})

describe('principalGroup (NCERT priority, Section 8.4.1)', () => {
  it.each<[string, GroupId | null]>([
    ['CCCCCC', null],
    ['CC(C)O', 'alcohol'],
    ['CC(C)=O', 'ketone'],
    ['CC(=O)O', 'carboxylic acid'],
    ['CCOC(C)=O', 'ester'],
    ['CC(N)=O', 'amide'],
    ['CC#N', 'nitrile'],
    ['CC=O', 'aldehyde'],
    ['CCN', 'amine'],
    ['C=CCO', 'alcohol'],
    ['CCCl', 'alkyl halide'],
    ['COCC', 'ether'],
    ['C1CCOC1', 'ether'],
    ['C1CCNC1', 'amine'],
    ['OC1=CC=CC=C1', 'phenol'],
    ['NC1=CC=CC=C1', 'amine'],
    ['C1=CC=CC=C1', null],
    ['C1=COC=C1', null],
    ['O=C1C=CC=CC=C1', 'ketone'],
    ['C1=CCCCC1', 'alkene'],
  ])('%s has principal group %s', (smiles, group) => {
    expect(principal(smiles)).toBe(group)
  })

  it('takes the carboxylic acid over an alcohol and an alkene in the same molecule', () => {
    expect(principal('C=CCC(=O)O')).toBe('carboxylic acid')
  })

  it('treats the OH of a carboxylic acid as part of the acid, not as an alcohol', () => {
    expect(functionalGroups(parseSmiles('CC(=O)O')).map((h) => h.group)).toEqual(['carboxylic acid'])
  })

  it('does not count the C=C bonds of benzene as alkenes', () => {
    expect(functionalGroups(parseSmiles('C1=CC=CC=C1'))).toEqual([])
  })
})

describe('isAromaticRing', () => {
  it('accepts pyridine and furan, rejects a six-membered sp3 ring', () => {
    expect(isAromaticRing(parseSmiles('C1=CC=NC=C1'), [0, 1, 2, 3, 4, 5])).toBe(true)
    expect(isAromaticRing(parseSmiles('C1=COC=C1'), [0, 1, 2, 3, 4])).toBe(true)
    expect(isAromaticRing(parseSmiles('C1CCCCC1'), [0, 1, 2, 3, 4, 5])).toBe(false)
  })
})
