import { describe, expect, it } from 'vitest'
import {
  CARBONYLS,
  alkoxideSmiles,
  carbonylById,
  cyanohydrinSmiles,
  formulaOf,
  nameOf,
  verdict,
} from './nucleophilic-addition'

describe('nucleophilic addition model', () => {
  it('draws each carbonyl compound with its formula', () => {
    expect(formulaOf(carbonylById('methanal').smiles)).toBe('CH2O')
    expect(formulaOf(carbonylById('ethanal').smiles)).toBe('C2H4O')
    expect(formulaOf(carbonylById('propanone').smiles)).toBe('C3H6O')
    expect(formulaOf(carbonylById('butanone').smiles)).toBe('C4H8O')
  })

  it('makes each cyanohydrin as carbonyl plus HCN', () => {
    for (const c of CARBONYLS) {
      const hcn = formulaOf(c.smiles) // carbonyl formula
      const product = formulaOf(cyanohydrinSmiles(c.id))
      const expected = { C: 0, H: 0, N: 1, O: 0 }
      const count = (f: string) => {
        const m = [...f.matchAll(/([A-Z][a-z]?)(\d*)/g)]
        return Object.fromEntries(m.map((x) => [x[1], Number(x[2] || 1)]))
      }
      const a = count(hcn)
      const p = count(product)
      expect(p.C).toBe((a.C ?? 0) + 1)
      expect(p.H).toBe((a.H ?? 0) + 1)
      expect(p.N).toBe(expected.N)
      expect(p.O).toBe(a.O)
    }
  })

  it('keeps the alkoxide at the cyanohydrin atoms minus one hydrogen', () => {
    for (const c of CARBONYLS) {
      const count = (f: string) => Object.fromEntries([...f.matchAll(/([A-Z][a-z]?)(\d*)/g)].map((x) => [x[1], Number(x[2] || 1)]))
      const alk = count(formulaOf(alkoxideSmiles(c.id)))
      const cyan = count(formulaOf(cyanohydrinSmiles(c.id)))
      expect(alk.C).toBe(cyan.C)
      expect(alk.N).toBe(cyan.N)
      expect(alk.O).toBe(cyan.O)
      expect(alk.H).toBe((cyan.H ?? 0) - 1)
    }
  })

  it('names the cyanohydrins with the namer', () => {
    expect(nameOf(cyanohydrinSmiles('ethanal'))).toBe('2-hydroxypropanenitrile')
    expect(nameOf(cyanohydrinSmiles('propanone'))).toBe('2-hydroxy-2-methylpropanenitrile')
    expect(nameOf(cyanohydrinSmiles('butanone'))).toBe('2-hydroxy-2-methylbutanenitrile')
    expect(nameOf(cyanohydrinSmiles('methanal'))).toBe('2-hydroxyethanenitrile')
  })

  it('gives aldehydes faster addition than ketones with cyanide', () => {
    expect(verdict(carbonylById('ethanal'), 'cyanide').rate).toBe('faster')
    expect(verdict(carbonylById('propanone'), 'cyanide').rate).toBe('slower')
  })

  it('favours bisulphite addition for aldehydes and not for ketones', () => {
    expect(verdict(carbonylById('methanal'), 'bisulphite').favoured).toBe('favoured')
    expect(verdict(carbonylById('butanone'), 'bisulphite').favoured).toBe('not favoured')
    expect(verdict(carbonylById('butanone'), 'cyanide').favoured).toBeNull()
  })
})
