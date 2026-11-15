import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import {
  CHAIN_GROUPS,
  QUIZ_SMILES,
  carbonChain,
  chainExplanation,
  chainPrincipal,
  chainSmiles,
  emptyChain,
  findGroups,
  groupAllowed,
  linkAllowed,
  nameOf,
  numberChain,
  quizItem,
  ringSmiles,
  withGroup,
  withLength,
  withLink,
  type ChainState,
  type RingGroupId,
} from './functional-namer'

/** The chain for 3-oxohex-5-enoic acid: C0=C1-C2-C3(=O)-C4-C5(=O)OH. */
function acidChain(): ChainState {
  let s = emptyChain(6)
  s = withLink(s, 0, 2)
  s = withGroup(s, 3, 'oxo')
  s = withGroup(s, 5, 'COOH')
  return s
}

function nameChain(s: ChainState): string {
  const outcome = nameOf(chainSmiles(s))
  if (!outcome.ok) throw new Error(outcome.reason)
  return outcome.name
}

describe('chain builder', () => {
  it('writes an alkane as a plain run of carbons', () => {
    expect(chainSmiles(emptyChain(3))).toBe('CCC')
  })

  it('writes a group in a branch and each multiple bond as its symbol', () => {
    expect(chainSmiles(acidChain())).toBe('C=CCC(=O)CC(=O)O')
  })

  it('refuses an interior-only group at a chain end', () => {
    expect(groupAllowed(emptyChain(4), 0, 'oxo')).toBe(false)
    expect(groupAllowed(emptyChain(4), 1, 'oxo')).toBe(true)
  })

  it('refuses a carbon that would exceed four bonds', () => {
    const s = withLink(emptyChain(4), 1, 2)
    expect(groupAllowed(s, 1, 'oxo')).toBe(false)
    expect(groupAllowed(s, 2, 'oxo')).toBe(false)
    expect(linkAllowed(emptyChain(4), 1, 3)).toBe(true)
    expect(linkAllowed(withGroup(emptyChain(4), 1, 'OH'), 1, 3)).toBe(false)
  })

  it('keeps the state when a change is refused', () => {
    const s = emptyChain(4)
    expect(withGroup(s, 0, 'oxo')).toBe(s)
  })

  it('drops a group that no longer fits when the chain is shortened', () => {
    const s = withGroup(emptyChain(5), 4, 'COOH')
    expect(withLength(s, 3).groups[2]).toBe(null)
    expect(withLength(withGroup(emptyChain(5), 2, 'oxo'), 3).groups[2]).toBe(null)
  })

  it('lists every chain group with a label and a prefix', () => {
    for (const spec of Object.values(CHAIN_GROUPS)) {
      expect(spec.label.length).toBeGreaterThan(0)
      expect(spec.prefix.length).toBeGreaterThan(0)
    }
  })
})

describe('naming through iupacName', () => {
  it('names the acid example with the ketone as oxo and the C=C as -en-', () => {
    expect(nameChain(acidChain())).toBe('3-oxohex-5-enoic acid')
  })

  it('names a hydroxy ketone with the ketone as the suffix', () => {
    let s = emptyChain(5)
    s = withGroup(s, 4, 'OH')
    s = withGroup(s, 1, 'oxo')
    s = withLink(s, 2, 2)
    expect(nameChain(s)).toBe('5-hydroxypent-3-en-2-one')
  })

  it('names a chloro alcohol with the lower locant on the alcohol', () => {
    let s = emptyChain(3)
    s = withGroup(s, 0, 'Cl')
    s = withGroup(s, 2, 'OH')
    expect(nameChain(s)).toBe('3-chloropropan-1-ol')
  })

  it('names an alkyne with no group', () => {
    expect(nameChain(withLink(emptyChain(5), 1, 3))).toBe('pent-2-yne')
  })

  it('names a benzene ring with its substituents in alphabetical order', () => {
    const ring = (subs: (RingGroupId | null)[]) => {
      const outcome = nameOf(ringSmiles(subs))
      if (!outcome.ok) throw new Error(outcome.reason)
      return outcome.name
    }
    expect(ring(['Cl', 'CH3', null, null, null, null])).toBe('1-chloro-2-methylbenzene')
    expect(ring([null, 'Cl', null, 'CH3', null, null])).toBe('1-chloro-3-methylbenzene')
    expect(ring([null, null, 'Cl', null, null, 'CH3'])).toBe('1-chloro-4-methylbenzene')
    expect(ring(['OH', null, null, 'Cl', null, null])).toBe('4-chlorophenol')
    expect(ring(['Cl', null, null, null, null, 'Cl'])).toBe('1,2-dichlorobenzene')
  })

  it('gives a ring of four or more substituents a name too', () => {
    expect(nameOf(ringSmiles(['Cl', 'CH3', 'NO2', null, null, null])).ok).toBe(true)
  })

  it('reports the lib reason for a shape it does not name', () => {
    const outcome = nameOf('C(C=O)CC(=O)O')
    expect(outcome.ok).toBe(false)
  })
})

describe('principal group and explanation', () => {
  it('ranks an acid above a ketone and a C=C', () => {
    expect(chainPrincipal(acidChain())).toBe('acid')
  })

  it('ranks a ketone above an alcohol', () => {
    let s = withGroup(emptyChain(4), 0, 'OH')
    s = withGroup(s, 2, 'oxo')
    expect(chainPrincipal(s)).toBe('ketone')
  })

  it('ranks an alcohol above an amine', () => {
    let s = withGroup(emptyChain(4), 0, 'NH2')
    s = withGroup(s, 3, 'OH')
    expect(chainPrincipal(s)).toBe('alcohol')
  })

  it('takes the multiple bond as principal when no group ranks', () => {
    expect(chainPrincipal(withLink(emptyChain(4), 0, 2))).toBe('alkene')
    expect(chainPrincipal(withGroup(emptyChain(4), 0, 'Cl'))).toBe(null)
  })

  it('states the suffix that the lib name should end with', () => {
    const lines = chainExplanation(acidChain()).join(' ')
    expect(lines).toContain('-COOH ranks highest')
    expect(lines).toContain('-oic acid')
    expect(lines).toContain('oxo-')
    expect(lines).toContain('-en-')
  })

  it('agrees with the lib name for every quiz molecule', () => {
    for (const s of QUIZ_SMILES) {
      const outcome = nameOf(s)
      expect(outcome.ok).toBe(true)
    }
  })
})

describe('graph matching', () => {
  it('finds one acid, one ketone and one C=C in the acid example', () => {
    const g = parseSmiles('C=CCC(=O)CC(=O)O')
    expect(findGroups(g, 'acid')).toHaveLength(1)
    expect(findGroups(g, 'ketone')).toHaveLength(1)
    expect(findGroups(g, 'alkene')).toHaveLength(1)
    expect(findGroups(g, 'alcohol')).toHaveLength(0)
  })

  it('does not count the OH of an acid as an alcohol', () => {
    expect(findGroups(parseSmiles('CC(=O)O'), 'alcohol')).toHaveLength(0)
  })

  it('finds the OH of a hydroxy ketone', () => {
    expect(findGroups(parseSmiles('OCC=CC(=O)C'), 'alcohol')).toHaveLength(1)
  })
})

describe('chain path and numbering', () => {
  it('finds the carbon chain of the acid example, six carbons from end to end', () => {
    const g = parseSmiles('C=CCC(=O)CC(=O)O')
    const path = carbonChain(g)
    expect(path).toHaveLength(6)
    expect(g.atoms[path[0]].element).toBe('C')
  })

  it('numbers from the end nearer the principal atom', () => {
    expect(numberChain([0, 1, 2, 3, 4], 4)).toEqual([4, 3, 2, 1, 0])
    expect(numberChain([0, 1, 2, 3, 4], 1)).toEqual([0, 1, 2, 3, 4])
    expect(numberChain([0, 1, 2, 3, 4], 2)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('quiz', () => {
  it('puts the lib name at the answer position with three other names', () => {
    for (let i = 0; i < QUIZ_SMILES.length; i++) {
      const q = quizItem(i)
      expect(q.options).toHaveLength(4)
      expect(q.options[q.answer]).toBe(q.name)
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it('wraps the index round the list', () => {
    expect(quizItem(QUIZ_SMILES.length).name).toBe(quizItem(0).name)
  })
})
