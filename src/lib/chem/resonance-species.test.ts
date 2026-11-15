import { describe, expect, it } from 'vitest'
import { molecularFormula } from './molecule-parse'
import { contributorRank } from './electronic-effects'
import {
  RESONANCE_SPECIES,
  hybridOf,
  netCharge,
  rankForms,
  resonanceSpecies,
  speciesForms,
} from './resonance-species'

describe('resonance species data', () => {
  it('every species has one push list per further form', () => {
    for (const s of RESONANCE_SPECIES) {
      expect(s.pushes.length, s.id).toBe(s.forms.length - 1)
    }
  })

  it('all forms of a species share the molecular formula and the net charge', () => {
    for (const s of RESONANCE_SPECIES) {
      const graphs = speciesForms(s)
      const formulas = new Set(graphs.map((g) => molecularFormula(g)))
      const charges = new Set(graphs.map((g) => netCharge(g)))
      expect(formulas.size, s.id).toBe(1)
      expect(charges.size, s.id).toBe(1)
    }
  })

  it('every hybrid partial bond is a bond of form 0, and every charge atom exists', () => {
    for (const s of RESONANCE_SPECIES) {
      const h = hybridOf(s)
      expect(h.partialBonds.length, s.id).toBe(s.partialBonds.length)
      for (const c of s.hybridCharges) {
        expect(c.atom < h.graph.atoms.length, s.id).toBe(true)
      }
      expect(h.graph.atoms.every((a) => a.charge === undefined), s.id).toBe(true)
    }
  })

  it('the hybrid draws partial bonds at order 1 with the formal charges removed', () => {
    const h = hybridOf(resonanceSpecies('carboxylate'))
    expect(h.partialBonds.map((k) => h.graph.bonds[k].order)).toEqual([1, 1])
  })

  it('ring bonds of the hybrid are even (order 1) and not dashed', () => {
    const benzene = hybridOf(resonanceSpecies('benzene'))
    expect(benzene.partialBonds).toEqual([])
    expect(benzene.graph.bonds.every((b) => b.order === 1)).toBe(true)
  })

  it('throws for an unknown species', () => {
    expect(() => resonanceSpecies('nope')).toThrow(RangeError)
  })
})

describe('ranking the forms by NCERT 8.7.6', () => {
  const rank = (id: string) => rankForms(speciesForms(resonanceSpecies(id)))

  it('equal forms form one tier', () => {
    for (const id of ['carboxylate', 'nitromethane', 'allyl', 'benzene', 'nitrite']) {
      const r = rank(id)
      expect(r.tiers, id).toEqual([r.order])
    }
  })

  it('phenoxide: the form with the negative charge on O comes first, carbanions after', () => {
    const r = rank('phenoxide')
    expect(r.tiers).toEqual([[0], [1, 2]])
  })

  it('aniline: the neutral form outranks the two charge-separated forms', () => {
    const r = rank('aniline')
    expect(r.tiers).toEqual([[0], [1, 2]])
  })

  it('nitrobenzene: the form with more covalent bonds comes first', () => {
    const r = rank('nitrobenzene')
    expect(r.order[0]).toBe(0)
    expect(r.scores[0].covalentBonds).toBeGreaterThan(r.scores[1].covalentBonds)
    expect(r.tiers).toEqual([[0], [1, 2]])
  })

  it('agrees with contributorRank where no carbanion is involved', () => {
    for (const id of ['nitrobenzene', 'aniline', 'carboxylate', 'nitromethane']) {
      const graphs = speciesForms(resonanceSpecies(id))
      expect(rank(id).order, id).toEqual(contributorRank(graphs))
    }
  })
})
