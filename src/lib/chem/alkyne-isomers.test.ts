import { describe, expect, it } from 'vitest'
import { alkyneIsomers } from './alkyne-isomers'
import { isomerRelation } from './isomers'

describe('alkyne isomers CnH(2n-2)', () => {
  it('counts the acyclic alkyne isomers: C2H2 1, C3H4 1, C4H6 2, C5H8 3, C6H10 7', () => {
    expect([2, 3, 4, 5, 6].map((n) => alkyneIsomers(n).length)).toEqual([1, 1, 2, 3, 7])
  })

  it('names the C5H8 isomers as the lib does and gives the formula C5H8', () => {
    const list = alkyneIsomers(5)
    expect(list.map((i) => i.name)).toEqual(['3-methylbut-1-yne', 'pent-1-yne', 'pent-2-yne'])
    expect(new Set(list.map((i) => i.formula))).toEqual(new Set(['C5H8']))
  })

  it('pairs the C5H8 isomers as NCERT does: pent-1-yne and pent-2-yne differ in position, 3-methylbut-1-yne in chain', () => {
    const [methyl, pent1, pent2] = alkyneIsomers(5)
    expect(isomerRelation(pent1.graph, pent2.graph)).toBe('position')
    expect(isomerRelation(pent1.graph, methyl.graph)).toBe('chain')
    expect(isomerRelation(pent2.graph, methyl.graph)).toBe('chain')
  })

  it('every isomer has exactly one triple bond and no other multiple bond', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      for (const isomer of alkyneIsomers(n)) {
        const orders = isomer.graph.bonds.map((b) => b.order)
        expect(orders.filter((o) => o === 3)).toHaveLength(1)
        expect(orders.filter((o) => o === 2)).toHaveLength(0)
      }
    }
  })

  it('rejects n outside 2 to 6', () => {
    expect(() => alkyneIsomers(1)).toThrow(RangeError)
    expect(() => alkyneIsomers(7)).toThrow(RangeError)
  })
})
