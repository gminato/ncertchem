import { describe, expect, it } from 'vitest'
import { iupacName, nameSteps } from './iupac-organic'
import { neighbours, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { alkaneChain, alkylSize, assertAlkaneSkeleton, chainNumbering, locantByAtom, resolveTie } from './alkane-naming'
import { ALKANE_PRESETS, designGraph, designSmiles, type AlkaneDesign } from './alkane-builder'

/** Every design with a backbone of 2 to 7 carbons and up to two linear side chains. */
function allDesigns(): AlkaneDesign[] {
  const out: AlkaneDesign[] = []
  for (let backbone = 2; backbone <= 7; backbone++) {
    const slots: { position: number; length: number }[] = []
    for (let position = 1; position <= backbone; position++) {
      for (let length = 1; length <= 3; length++) slots.push({ position, length })
    }
    out.push({ backbone, branches: [] })
    for (let i = 0; i < slots.length; i++) {
      out.push({ backbone, branches: [slots[i]] })
      for (let j = i + 1; j < slots.length; j++) out.push({ backbone, branches: [slots[i], slots[j]] })
    }
  }
  return out
}

function libLocants(smiles: string): number[] {
  return nameSteps(parseSmiles(smiles))
    .filter((s) => s.kind === 'substituent')
    .map((s) => s.locant as number)
    .sort((a, b) => a - b)
}

describe('alkaneChain and chainNumbering agree with the lib name', () => {
  it('agrees with nameSteps for every design in the enumeration', () => {
    let checked = 0
    for (const d of allDesigns()) {
      const smiles = designSmiles(d)
      const g = parseSmiles(smiles)
      const chain = alkaneChain(g)
      const numbering = chainNumbering(g, chain)
      const parent = nameSteps(g)[0].text
      expect(parent, smiles).toBe(`chain of ${chain.atoms.length} carbons`)
      expect(numbering.locants, smiles).toEqual(libLocants(smiles))
      checked++
    }
    expect(checked).toBe(672)
  })

  it('the names of the presets come from the lib and their chains agree with them', () => {
    for (const p of ALKANE_PRESETS) {
      const smiles = designSmiles(p.design)
      const g = parseSmiles(smiles)
      expect(iupacName(g).length, p.id).toBeGreaterThan(0)
      const chain = alkaneChain(g)
      expect(nameSteps(g)[0].text, p.id).toBe(`chain of ${chain.atoms.length} carbons`)
      expect(chainNumbering(g, chain).locants, p.id).toEqual(libLocants(smiles))
    }
  })

  it('a tie in the locant sets is flagged only with two or more side chains', () => {
    const g = parseSmiles('CC(C)(C)C')
    const numbering = chainNumbering(g, alkaneChain(g))
    expect(numbering.tie).toBe(true)
    expect(numbering.locants).toEqual(libLocants('CC(C)(C)C'))
    expect(chainNumbering(parseSmiles('CCCCCC'), alkaneChain(parseSmiles('CCCCCC'))).tie).toBe(false)
    expect(chainNumbering(parseSmiles('CCCC(CC)CCC'), alkaneChain(parseSmiles('CCCC(CC)CCC'))).tie).toBe(false)
  })

  it('locantByAtom gives 1..n along the chosen numbering and null off the chain', () => {
    const g = parseSmiles('CCC(C)C(C)C')
    const numbering = chainNumbering(g, alkaneChain(g))
    const locants = locantByAtom(g, numbering)
    const onChain = locants.filter((x) => x !== null).sort((a, b) => (a as number) - (b as number))
    expect(onChain).toEqual([1, 2, 3, 4, 5])
    expect(locants.filter((x) => x === null)).toHaveLength(g.atoms.length - 5)
  })
})

describe('resolveTie', () => {
  it('gives the alphabetically first side chain the lower locant of a tie', () => {
    const g = parseSmiles('CCC(CC)C(C)CC') // 3-ethyl-4-methylhexane: both ends give locants {3, 4}
    const numbering = chainNumbering(g, alkaneChain(g))
    expect(numbering.tie).toBe(true)
    const resolved = resolveTie(g, numbering, [
      { text: 'ethyl', locant: 3 },
      { text: 'methyl', locant: 4 },
    ])
    expect(resolved.tie).toBe(false)
    const byLocant = locantByAtom(g, resolved)
    const ethylAtom = g.atoms.findIndex((_, i) => byLocant[i] === 3)
    // The carbon with locant 3 carries a two-carbon side chain (the ethyl).
    expect(g.bonds.filter((b) => b.a === ethylAtom || b.b === ethylAtom).length).toBe(3)
  })

  it('agrees with the lib for every tied design in the enumeration', () => {
    let ties = 0
    let resolvedCount = 0
    for (const smiles of enumerated()) {
      const g = parseSmiles(smiles)
      const numbering = chainNumbering(g, alkaneChain(g))
      if (!numbering.tie) continue
      ties++
      const subs = nameSteps(g)
        .filter((x) => x.kind === 'substituent')
        .map((x) => ({ text: x.text, locant: x.locant as number }))
      const resolved = resolveTie(g, numbering, subs)
      if (!resolved.tie) {
        resolvedCount++
        // The side chain at each locant has the size the lib gives that side chain.
        const expected = subs.map((x) => `${alkylSize(x.text)}@${x.locant}`).sort().join(' ')
        expect(sizesAtLocants(g, resolved.order).join(' '), smiles).toBe(expected)
      }
      expect(resolved.locants, smiles).toEqual(libLocants(smiles))
    }
    expect(ties).toBeGreaterThan(0)
    expect(resolvedCount).toBeGreaterThan(0)
  })

  it('reads the carbon count of a side chain from its lib name', () => {
    expect(alkylSize('methyl')).toBe(1)
    expect(alkylSize('ethyl')).toBe(2)
    expect(alkylSize('sec-butyl')).toBe(4)
    expect(alkylSize('(1-methylhexyl)')).toBe(null)
  })
})

/** Side-chain sizes at each locant of a numbering, as 'size@locant' strings, sorted. */
function sizesAtLocants(g: MolGraph, order: number[]): string[] {
  const on = new Set(order)
  const out: string[] = []
  order.forEach((x, k) => {
    for (const nb of neighbours(g, x)) {
      if (on.has(nb.atom)) continue
      const seen = new Set<number>([x, nb.atom])
      const stack = [nb.atom]
      while (stack.length > 0) {
        const y = stack.pop() as number
        for (const z of neighbours(g, y)) {
          if (!seen.has(z.atom)) {
            seen.add(z.atom)
            stack.push(z.atom)
          }
        }
      }
      out.push(`${seen.size - 1}@${k + 1}`)
    }
  })
  return out.sort()
}

/** The SMILES of every design in allDesigns(). */
function enumerated(): string[] {
  return allDesigns().map((d) => designSmiles(d))
}

describe('alkane skeleton checks', () => {
  it('rejects a double bond, a ring and a heteroatom', () => {
    expect(() => alkaneChain(parseSmiles('C=CC'))).toThrow(RangeError)
    expect(() => alkaneChain(parseSmiles('C1CCCCC1'))).toThrow(RangeError)
    expect(() => alkaneChain(parseSmiles('CCO'))).toThrow(RangeError)
    expect(() => assertAlkaneSkeleton(parseSmiles('CCC'))).not.toThrow()
  })
})

describe('designGraph', () => {
  it('builds the molecule that the design describes', () => {
    const d: AlkaneDesign = { backbone: 5, branches: [{ position: 3, length: 2 }] }
    expect(designSmiles(d)).toBe('CCC(CC)CC')
    expect(designGraph(d).atoms.length).toBe(7)
    expect(iupacName(designGraph(d))).toBe('3-ethylpentane')
  })
})
