import { describe, expect, it } from 'vitest'
import { iupacName } from './iupac-organic'
import { parseSmiles, neighbours } from './molecule-parse'
import { alkaneChain, chainNumbering, locantByAtom } from './alkane-naming'
import {
  ALKANE_PRESETS,
  MAX_BRANCHES,
  MAX_BACKBONE,
  designCarbons,
  designGraph,
  designSmiles,
  isSameName,
  isValidDesign,
  type AlkaneDesign,
} from './alkane-builder'

describe('isValidDesign', () => {
  it('accepts a backbone of 2 to 9 with up to three linear side chains of 1 to 4 carbons', () => {
    expect(isValidDesign({ backbone: 2, branches: [] })).toBe(true)
    expect(isValidDesign({ backbone: MAX_BACKBONE, branches: [{ position: 9, length: 4 }] })).toBe(true)
  })

  it('rejects a backbone out of range, a position off the backbone, a long side chain and too many branches', () => {
    expect(isValidDesign({ backbone: 1, branches: [] })).toBe(false)
    expect(isValidDesign({ backbone: 10, branches: [] })).toBe(false)
    expect(isValidDesign({ backbone: 4, branches: [{ position: 5, length: 1 }] })).toBe(false)
    expect(isValidDesign({ backbone: 4, branches: [{ position: 2, length: 5 }] })).toBe(false)
    expect(isValidDesign({ backbone: 4, branches: [{ position: 2, length: 0 }] })).toBe(false)
    const four = Array.from({ length: MAX_BRANCHES + 1 }, () => ({ position: 2, length: 1 }))
    expect(isValidDesign({ backbone: 4, branches: four })).toBe(false)
  })
})

describe('designSmiles', () => {
  it('writes the backbone and each side chain as a bracketed run of carbons', () => {
    expect(designSmiles({ backbone: 4, branches: [{ position: 2, length: 1 }] })).toBe('CC(C)CC')
    expect(designSmiles({ backbone: 5, branches: [{ position: 3, length: 2 }] })).toBe('CCC(CC)CC')
  })

  it('counts the carbons of a design', () => {
    expect(designCarbons({ backbone: 5, branches: [{ position: 3, length: 2 }, { position: 1, length: 1 }] })).toBe(8)
    expect(designGraph({ backbone: 5, branches: [{ position: 3, length: 2 }] }).atoms.length).toBe(7)
  })

  it('throws for an invalid design', () => {
    const bad: AlkaneDesign = { backbone: 1, branches: [] }
    expect(() => designSmiles(bad)).toThrow(RangeError)
  })
})

describe('ALKANE_PRESETS', () => {
  it('has at least twelve molecules, each with a distinct lib name', () => {
    expect(ALKANE_PRESETS.length).toBeGreaterThanOrEqual(12)
    const names = ALKANE_PRESETS.map((p) => iupacName(designGraph(p.design)))
    expect(new Set(names).size).toBe(names.length)
  })

  it('every preset is a valid design, and the lib names the molecule of each design', () => {
    for (const p of ALKANE_PRESETS) {
      expect(isValidDesign(p.design), p.id).toBe(true)
      expect(iupacName(parseSmiles(designSmiles(p.design))), p.id).toMatch(/^[\d,\-a-z()]+$/)
    }
  })

  it('every preset can be rebuilt from its own longest chain and linear side chains', () => {
    for (const p of ALKANE_PRESETS) {
      const g = parseSmiles(designSmiles(p.design))
      const chain = alkaneChain(g)
      const numbering = chainNumbering(g, chain)
      const locant = locantByAtom(g, numbering)
      const onChain = new Set(chain.atoms)
      const branches: { position: number; length: number }[] = []
      for (const x of chain.atoms) {
        for (const nb of neighbours(g, x)) {
          if (onChain.has(nb.atom)) continue
          // The side chain must be a simple path: every atom in it has at most two carbons.
          const group: number[] = [nb.atom]
          let prev = x
          let cur = nb.atom
          for (;;) {
            const next = neighbours(g, cur).filter((y) => y.atom !== prev)
            expect(next.length, p.id).toBeLessThanOrEqual(1)
            if (next.length === 0) break
            prev = cur
            cur = next[0].atom
            group.push(cur)
          }
          branches.push({ position: locant[x] as number, length: group.length })
        }
      }
      const rebuilt = { backbone: chain.atoms.length, branches }
      expect(isValidDesign(rebuilt), p.id).toBe(true)
      expect(iupacName(designGraph(rebuilt)), p.id).toBe(iupacName(g))
    }
  })
})

describe('isSameName', () => {
  it('ignores case and spaces but not locants', () => {
    expect(isSameName(' 3-Ethyl-2-methyl heptane ', '3-ethyl-2-methylheptane')).toBe(true)
    expect(isSameName('3-ethyl-2-methylhexane', '3-ethyl-2-methylheptane')).toBe(false)
    expect(isSameName('2-ethyl-3-methylheptane', '3-ethyl-2-methylheptane')).toBe(false)
  })
})
