import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { huckel } from './aromaticity'

const h = (s: string) => huckel(parseSmiles(s))

describe('huckel', () => {
  it('benzene is aromatic with 6 π electrons (n = 1)', () => {
    const r = h('C1=CC=CC=C1')
    expect(r.verdict).toBe('aromatic')
    expect(r.piElectrons).toBe(6)
    expect(r.n).toBe(1)
  })
  it('naphthalene is aromatic with 10 π electrons (n = 2), checked on its perimeter', () => {
    const r = h('C1=CC=C2C=CC=CC2=C1')
    expect(r.verdict).toBe('aromatic')
    expect(r.piElectrons).toBe(10)
    expect(r.n).toBe(2)
  })
  it('cyclopentadienyl anion is aromatic (6 π electrons)', () => {
    expect(h('[CH-]1C=CC=C1').verdict).toBe('aromatic')
    expect(h('[CH-]1C=CC=C1').piElectrons).toBe(6)
  })
  it('cyclopentadienyl cation is antiaromatic-or-non-aromatic (4 π electrons)', () => {
    const r = h('[CH+]1C=CC=C1')
    expect(r.verdict).toBe('antiaromatic-or-non-aromatic')
    expect(r.piElectrons).toBe(4)
  })
  it('tropylium cation is aromatic (6 π electrons)', () => {
    const r = h('[CH+]1C=CC=CC=C1')
    expect(r.verdict).toBe('aromatic')
    expect(r.piElectrons).toBe(6)
  })
  it('cyclopentadiene is not fully conjugated (its CH2 is sp3)', () => {
    expect(h('C1C=CC=C1').verdict).toBe('not fully conjugated')
  })
  it('cyclobutadiene is antiaromatic-or-non-aromatic (4 π electrons)', () => {
    const r = h('C1=CC=C1')
    expect(r.verdict).toBe('antiaromatic-or-non-aromatic')
    expect(r.piElectrons).toBe(4)
  })
  it('cyclooctatetraene is non-aromatic with an explicit tub-shape reason', () => {
    const r = h('C1=CC=CC=CC=C1')
    expect(r.verdict).toBe('antiaromatic-or-non-aromatic')
    expect(r.piElectrons).toBe(8)
    expect(r.reasons.join(' ')).toMatch(/tub-shaped/)
  })
  it('pyridine is aromatic (the N contributes one electron)', () => {
    const r = h('C1=CC=NC=C1')
    expect(r.verdict).toBe('aromatic')
    expect(r.piElectrons).toBe(6)
  })
  it('furan is aromatic (the O lone pair contributes two electrons)', () => {
    expect(h('C1=COC=C1').piElectrons).toBe(6)
    expect(h('C1=COC=C1').verdict).toBe('aromatic')
  })
  it('thiophene is aromatic (the S lone pair contributes two electrons)', () => {
    expect(h('C1=CSC=C1').verdict).toBe('aromatic')
  })
  it('an acyclic molecule is not cyclic', () => {
    expect(h('C=CC=C').verdict).toBe('not cyclic')
  })
  it('a given ring must be a real cycle', () => {
    expect(() => huckel(parseSmiles('C1=CC=CC=C1'), [0, 1, 4])).toThrow(RangeError)
  })
  it('the given ring is used when it is a cycle', () => {
    const g = parseSmiles('C1=CC=CC=C1')
    expect(huckel(g, [0, 1, 2, 3, 4, 5]).verdict).toBe('aromatic')
  })
  it('states the planarity assumption for an aromatic verdict', () => {
    expect(h('C1=CC=CC=C1').reasons.join(' ')).toMatch(/planar/)
  })
})
