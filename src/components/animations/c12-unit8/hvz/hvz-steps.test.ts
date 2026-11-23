import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { ALPHA_CARBON, HVZ_MOLECULES, HVZ_STEP_STATES, type HvzMoleculeKey } from './hvz-steps'

describe('Section 14 Scrolly target states', () => {
  it('has six Steps numbered in order', () => {
    expect(HVZ_STEP_STATES.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it.each(Object.keys(HVZ_MOLECULES) as HvzMoleculeKey[])('%s has the formula and name the drawing prints', (key) => {
    const m = HVZ_MOLECULES[key]
    expect(molecularFormula(parseSmiles(m.smiles))).toBe(m.formula)
    expect(unit8Name(m.smiles)).toBe(m.name)
  })

  it('every drawn molecule in every Step is a checked molecule', () => {
    for (const state of HVZ_STEP_STATES) {
      for (const key of [...state.drawn, ...(state.product ? [state.product] : [])]) {
        expect(HVZ_MOLECULES[key]).toBeDefined()
      }
    }
  })

  it('Step 2 replaces one α-hydrogen: the product has one more Br and one less H than the acid', () => {
    const acid = HVZ_MOLECULES.butanoic.formula
    const product = HVZ_MOLECULES.bromobutanoic.formula
    expect(acid).toBe('C4H8O2')
    expect(product).toBe('C4H7BrO2')
  })

  it('Step 3 has no product (no α-hydrogen)', () => {
    const state = HVZ_STEP_STATES[2]
    expect(state.product).toBeUndefined()
    expect(state.noReaction).toBe(true)
    expect(HVZ_MOLECULES.dimethylpropanoic.smiles).toBe('CC(C)(C)C(O)=O')
  })

  it('the highlighted α-carbon is a carbon atom in each drawn acid', () => {
    for (const key of ['butanoic', 'bromobutanoic', 'dimethylpropanoic'] as const) {
      const graph = parseSmiles(HVZ_MOLECULES[key].smiles)
      expect(graph.atoms[ALPHA_CARBON[key]].element).toBe('C')
    }
  })

  it('Step 4 nitrates benzoic acid to 3-nitrobenzoic acid', () => {
    const state = HVZ_STEP_STATES[3]
    expect(state.drawn).toEqual(['benzoic'])
    expect(state.product).toBe('nitrobenzoic')
  })

  it('Step 6 shows the uses in the order the Step text gives', () => {
    expect(HVZ_STEP_STATES[5].drawn).toEqual(['methanoic', 'ethanoic', 'hexanedioic', 'octadecanoic'])
  })
})
