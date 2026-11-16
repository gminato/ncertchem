import { describe, expect, it } from 'vitest'
import { alkylationSpecies, easStepTexts, methylSpecies, nitrationSpecies, nitrobenzeneGraph, tolueneProduct } from './eas-steps'
import { huckel } from '@/lib/chem/aromaticity'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { sigmaContributors } from '@/lib/chem/eas-mechanism'

describe('EAS Scrolly data', () => {
  const toluene = tolueneProduct()

  it('has six Steps with a title and a caption each', () => {
    const texts = easStepTexts(toluene.name)
    expect(texts).toHaveLength(6)
    for (const t of texts) {
      expect(t.title.length).toBeGreaterThan(5)
      expect(t.caption.length).toBeGreaterThan(30)
    }
  })

  it('the step 6 caption names the product from the lib', () => {
    expect(easStepTexts(toluene.name)[5].caption).toContain(toluene.name)
    expect(toluene.name).toBe('methylbenzene')
  })

  it('the nitration electrophile species are the lib’s', () => {
    expect(nitrationSpecies().products).toEqual(['NO2+', 'H3O+', '2HSO4-'])
    expect(alkylationSpecies().products[1]).toBe('AlCl4-')
  })

  it('methyl species: chloromethane and the methyl cation from their graphs', () => {
    expect(methylSpecies()).toEqual({ chloromethane: 'CH₃Cl', methylCation: 'CH₃⁺' })
  })

  it('the nitrobenzene product is C6H5NO2 and the σ-complex contributors are C6H6NO2+', () => {
    expect(molecularFormula(nitrobenzeneGraph())).toBe('C6H5NO2')
    for (const g of sigmaContributors('nitration')) expect(molecularFormula(g)).toBe('C6H6NO2+')
  })

  it('the σ-complex is not aromatic and benzene is (Hückel verdicts)', () => {
    expect(huckel(sigmaContributors('nitration')[0]).verdict).not.toBe('aromatic')
    expect(huckel(parseSmiles('C1=CC=CC=C1')).verdict).toBe('aromatic')
  })
})
