import { describe, expect, it } from 'vitest'
import { easViews } from './eas-steps'
import { huckel } from '@/lib/chem/aromaticity'
import { sigmaContributors } from '@/lib/chem/eas-mechanism'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'

describe('easViews', () => {
  const views = easViews()

  it('has six Steps: nitration in four, Friedel–Crafts in two', () => {
    expect(views).toHaveLength(6)
    expect(views.map((v) => v.kind)).toEqual(['scheme', 'strip', 'resonance', 'strip', 'scheme', 'scheme'])
  })

  it('gives every Step a title and a caption', () => {
    for (const v of views) {
      expect(v.title.length).toBeGreaterThan(5)
      expect(v.caption.length).toBeGreaterThan(20)
    }
  })

  it('the σ-complex of Step 3 has three contributors, each C6H6NO2+', () => {
    const v = views[2]
    if (v.kind !== 'resonance') throw new Error('Step 3 is the resonance set')
    expect(v.contributors).toHaveLength(3)
    for (const g of v.contributors) expect(molecularFormula(g)).toBe('C6H6NO2+')
  })

  it('the σ-complex is not aromatic, and benzene is (Hückel, lib verdicts)', () => {
    const sigma = sigmaContributors('nitration')[0]
    expect(huckel(sigma).verdict).not.toBe('aromatic')
    expect(huckel(parseSmiles('C1=CC=CC=C1')).verdict).toBe('aromatic')
  })

  it('Step 1 takes the nitronium species from the nitration electrophile equation', () => {
    const v = views[0]
    if (v.kind !== 'scheme') throw new Error('Step 1 is a scheme')
    const products = v.path[2] as { formula: unknown }[]
    expect(products).toHaveLength(3)
    expect(molecularFormula(products[0].formula as never)).toBe('NO2+')
  })
})
