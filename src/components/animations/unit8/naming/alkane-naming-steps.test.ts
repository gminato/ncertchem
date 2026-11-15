import { describe, expect, it } from 'vitest'
import { iupacName, nameSteps } from '@/lib/chem/iupac-organic'
import { alkaneChain, chainNumbering, locantByAtom } from '@/lib/chem/alkane-naming'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  NAMING_CHAIN,
  NAMING_GRAPH,
  NAMING_NUMBERING,
  NAMING_STEP_COUNT,
  TEMPTING_PATH,
  namingStep,
  pathBondIndices,
} from './alkane-naming-steps'

describe('alkane-naming Scrolly', () => {
  it('has five Steps, and the molecule is named 3-ethyl-2-methylheptane by the lib', () => {
    expect(NAMING_STEP_COUNT).toBe(5)
    expect(iupacName(NAMING_GRAPH)).toBe('3-ethyl-2-methylheptane')
  })

  it('the tempting path is a real 5-carbon path, shorter than the longest chain', () => {
    expect(TEMPTING_PATH.length).toBe(5)
    expect(pathBondIndices(NAMING_GRAPH, TEMPTING_PATH)).toHaveLength(4)
    expect(NAMING_CHAIN.atoms.length).toBe(7)
    expect(TEMPTING_PATH.length).toBeLessThan(NAMING_CHAIN.atoms.length)
  })

  it('the chain the Scrolly highlights is the lib chain: 7 carbons, with two side chains', () => {
    const parent = nameSteps(NAMING_GRAPH)[0]
    expect(parent.text).toBe('chain of 7 carbons')
    expect(NAMING_CHAIN.atoms.length).toBe(7)
    expect(NAMING_CHAIN.substituentCount).toBe(2)
  })

  it('the numbering from the chosen end gives locants 2 and 3, and the other end gives 5 and 6', () => {
    expect(NAMING_NUMBERING.locants).toEqual([2, 3])
    expect(NAMING_NUMBERING.fromFirst).toEqual([5, 6])
    expect(NAMING_NUMBERING.fromLast).toEqual([2, 3])
    expect(NAMING_NUMBERING.tie).toBe(false)
  })

  it('the Scrolly locants match the substituent locants that nameSteps reports', () => {
    const libLocants = nameSteps(NAMING_GRAPH)
      .filter((s) => s.kind === 'substituent')
      .map((s) => s.locant as number)
      .sort((a, b) => a - b)
    expect(libLocants).toEqual(NAMING_NUMBERING.locants)
  })

  it('step 3 callouts are the lib substituents, hung from the chain carbons that carry them', () => {
    const step = namingStep(3)
    const byLocant = locantByAtom(NAMING_GRAPH, NAMING_NUMBERING)
    expect(step.callouts.map((c) => c.text).sort()).toEqual(['2-methyl', '3-ethyl'])
    for (const c of step.callouts) {
      const locant = Number(c.text.charAt(0))
      expect(byLocant[c.attach]).toBe(locant)
      expect(byLocant[c.anchor]).toBe(null)
      expect(NAMING_GRAPH.bonds.some((b) => (b.a === c.attach && b.b === c.anchor) || (b.b === c.attach && b.a === c.anchor))).toBe(true)
    }
  })

  it('step 3 lists the side chains in the order the name prints them', () => {
    expect(namingStep(3).caption).toBe('In the name: ethyl, methyl')
  })

  it('step 4 shows the assembled name from the lib', () => {
    expect(namingStep(4).caption).toBe('3-ethyl-2-methylheptane')
  })

  it('each Step clamps to the valid range', () => {
    expect(namingStep(-3)).toEqual(namingStep(0))
    expect(namingStep(99)).toEqual(namingStep(NAMING_STEP_COUNT - 1))
  })

  it('the chain choice is stable for an isolated check of another molecule', () => {
    const g = parseSmiles('CCC(C)C(C)C')
    const chain = alkaneChain(g)
    expect(chain.atoms.length).toBe(5)
    expect(chainNumbering(g, chain).locants).toEqual([2, 3])
  })
})
