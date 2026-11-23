import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ALKOXIDE_O,
  ALKOXIDE_SP3_C,
  CYANOHYDRIN_SMILES,
  ETHANAL_CARBONYL_C,
  ETHANAL_O,
  ETHANAL_SMILES,
  NUC_ADD_BEATS,
  NUC_ADD_STATES,
  PROPANONE_CARBONYL_C,
  PROPANONE_METHYLS,
  PROPANONE_SMILES,
  TETRAHEDRAL_ALKOXIDE_SMILES,
} from './nucleophilic-addition-steps'

/** Formula of every molecule the drawing shows, as molecularFormula prints it. */
const FORMULAS: Record<string, string> = {
  [ETHANAL_SMILES]: 'C2H4O',
  [PROPANONE_SMILES]: 'C3H6O',
  [TETRAHEDRAL_ALKOXIDE_SMILES]: 'C3H4NO-',
  [CYANOHYDRIN_SMILES]: 'C3H5NO',
}

describe('Nucleophilic addition Scrolly steps', () => {
  it('has the six Steps the Prose describes', () => {
    expect(NUC_ADD_BEATS).toHaveLength(6)
    expect(Object.keys(NUC_ADD_STATES).sort()).toEqual([...NUC_ADD_BEATS].sort())
  })

  it('gives every drawn molecule the formula the Prose uses', () => {
    for (const [smiles, formula] of Object.entries(FORMULAS)) {
      expect(molecularFormula(parseSmiles(smiles)), smiles).toBe(formula)
    }
  })

  it('every molecule named in a Step state is one of the asserted molecules', () => {
    for (const beat of NUC_ADD_BEATS) {
      for (const smiles of NUC_ADD_STATES[beat].molecules) {
        expect(FORMULAS[smiles], `${beat}: ${smiles}`).toBeDefined()
      }
    }
  })

  it('points the drawn indices at the carbonyl carbon, the oxygen and the sp³ carbon', () => {
    const ethanal = parseSmiles(ETHANAL_SMILES)
    expect(ethanal.atoms[ETHANAL_CARBONYL_C].element).toBe('C')
    expect(ethanal.atoms[ETHANAL_O].element).toBe('O')
    const ketone = parseSmiles(PROPANONE_SMILES)
    expect(ketone.atoms[PROPANONE_CARBONYL_C].element).toBe('C')
    for (const m of PROPANONE_METHYLS) expect(ketone.atoms[m].element).toBe('C')
    const alkoxide = parseSmiles(TETRAHEDRAL_ALKOXIDE_SMILES)
    expect(alkoxide.atoms[ALKOXIDE_SP3_C].element).toBe('C')
    expect(alkoxide.atoms[ALKOXIDE_O].element).toBe('O')
    expect(alkoxide.atoms[ALKOXIDE_O].charge).toBe(-1)
  })

  it('draws the curved arrows the Prose describes: two at the addition and two at protonation', () => {
    expect(NUC_ADD_STATES['curved-arrows'].arrows).toBe(2)
    expect(NUC_ADD_STATES.protonation.arrows).toBe(2)
    for (const beat of NUC_ADD_BEATS) {
      if (beat !== 'curved-arrows' && beat !== 'protonation') expect(NUC_ADD_STATES[beat].arrows, beat).toBe(0)
    }
  })
})
