import { describe, expect, it } from 'vitest'
import { LABELLED_SPECIES, speciesLabel } from './species-labels'
import { parseSmiles } from './molecule-parse'

describe('species labels', () => {
  it('labels every listed species, from the lib condensed string', () => {
    for (const { smiles, label } of LABELLED_SPECIES) {
      expect(speciesLabel(parseSmiles(smiles)), smiles).toBe(label)
    }
  })

  it('agrees with the charge and radical of each species', () => {
    for (const { smiles, label } of LABELLED_SPECIES) {
      const g = parseSmiles(smiles)
      const charge = g.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)
      const radical = g.atoms.some((a) => (a.radical ?? 0) > 0)
      if (charge > 0) expect(label.endsWith('⁺'), smiles).toBe(true)
      if (charge < 0) expect(label.endsWith('⁻'), smiles).toBe(true)
      if (radical) expect(label.endsWith('•'), smiles).toBe(true)
    }
  })

  it('returns undefined for a species the unit does not label', () => {
    expect(speciesLabel(parseSmiles('CCO'))).toBeUndefined()
  })
})
