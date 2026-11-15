import { describe, expect, it } from 'vitest'
import {
  TREE_COLUMNS,
  boilingRises,
  classificationSteps,
  farthestCarbonFromOxygen,
  ladderMembers,
  treeLeaves,
} from './classification-steps'
import { parseSmiles } from '@/lib/chem/molecule-parse'

describe('classificationSteps', () => {
  const steps = classificationSteps()

  it('has four tree Steps, then the ladder and the boiling points', () => {
    expect(steps.map((s) => s.kind)).toEqual(['tree', 'tree', 'tree', 'tree', 'ladder', 'boiling'])
  })

  it('reveals the columns one at a time, each tree Step adding one class', () => {
    const trees = steps.filter((s): s is Extract<typeof s, { kind: 'tree' }> => s.kind === 'tree')
    expect(trees.map((t) => t.active)).toEqual(['acyclic', 'alicyclic', 'aromatic', 'heterocyclic'])
    expect(trees.map((t) => t.revealed.length)).toEqual([1, 2, 3, 4])
  })
})

describe('tree leaves', () => {
  it.each(TREE_COLUMNS.map((c) => [c.key, c] as const))('every leaf of the %s column is classified into that class', (_key, column) => {
    for (const leaf of treeLeaves(column)) {
      expect(leaf.ringClass).toBe(column.key)
    }
  })

  it('sub-classes the aromatic leaves as benzenoid, benzenoid and non-benzenoid', () => {
    const aromatic = TREE_COLUMNS.find((c) => c.key === 'aromatic')!
    expect(treeLeaves(aromatic).map((l) => l.subclass)).toEqual(['benzenoid', 'benzenoid', 'non-benzenoid'])
  })

  it('sub-classes the heterocyclic leaves as aromatic (furan, pyridine) and not (tetrahydrofuran)', () => {
    const het = TREE_COLUMNS.find((c) => c.key === 'heterocyclic')!
    expect(treeLeaves(het).map((l) => l.subclass)).toEqual([
      'heterocyclic aromatic',
      'heterocyclic aromatic',
      'heterocyclic non-aromatic',
    ])
  })
})

describe('ladder', () => {
  const members = ladderMembers()

  it('marks one carbon in each member, and it is a carbon', () => {
    for (const m of members) {
      expect(m.graph.atoms[m.newCarbon].element).toBe('C')
    }
  })

  it('marks the carbon farthest from the oxygen (the chain end)', () => {
    expect(farthestCarbonFromOxygen(parseSmiles('CCCO'))).toBe(0)
    expect(farthestCarbonFromOxygen(parseSmiles('OCC'))).toBe(2)
  })

  it('throws for a molecule with no oxygen', () => {
    expect(() => farthestCarbonFromOxygen(parseSmiles('CCC'))).toThrow(RangeError)
  })
})

describe('boilingRises', () => {
  it('gives four positive rises for the five alcohols', () => {
    const rises = boilingRises(ladderMembers())
    expect(rises).toHaveLength(4)
    for (const r of rises) expect(r).toBeGreaterThan(0)
    expect(rises).toEqual([13, 19, 21, 20])
  })
})
