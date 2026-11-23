import { describe, expect, it } from 'vitest'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { BUTENAL, CARBANION, ENOLATE, ETHANAL, GRID, GRID_NAMES, HYDROXYBUTANAL, SMILES, STEP_TARGETS, WATER } from './aldol-steps'

describe('Aldol Scrolly: molecular formulas of every drawn molecule', () => {
  it('Step 1 and the aldol: ethanal, 3-hydroxybutanal, but-2-enal, water', () => {
    expect(molecularFormula(ETHANAL)).toBe('C2H4O')
    expect(molecularFormula(HYDROXYBUTANAL)).toBe('C4H8O2')
    expect(molecularFormula(BUTENAL)).toBe('C4H6O')
    expect(molecularFormula(WATER)).toBe('H2O')
  })

  it('Step 2: the carbanion and its enolate resonance form are the same ion, C2H3O-', () => {
    expect(molecularFormula(CARBANION)).toBe(molecularFormula(ENOLATE))
    expect(molecularFormula(CARBANION)).toBe('C2H3O-')
  })

  it('Step 6: the four aldol products', () => {
    expect(GRID.map((c) => molecularFormula(c.graph))).toEqual(['C6H12O2', 'C7H14O2', 'C7H14O2', 'C8H16O2'])
  })
})

describe('Aldol Scrolly: names come from the namer', () => {
  it('names the Step 4 and Step 5 molecules', () => {
    expect(unit8Name(SMILES.hydroxybutanal)).toBe('3-hydroxybutanal')
    expect(unit8Name(SMILES.butenal)).toBe('but-2-enal')
    expect(unit8Name(SMILES.ethanal)).toBe('ethanal')
  })

  it('each Step 6 cell names the product of its column (carbanion) and its row (carbonyl attacked)', () => {
    const cells = [
      { col: 'propanal', row: 'propanal', smiles: 'CCC(O)C(C)C=O', name: '3-hydroxy-2-methylpentanal' },
      { col: '2-methylpropanal', row: 'propanal', smiles: 'CCC(O)C(C)(C)C=O', name: '3-hydroxy-2,2-dimethylpentanal' },
      { col: 'propanal', row: '2-methylpropanal', smiles: 'CC(C)C(O)C(C)C=O', name: '3-hydroxy-2,4-dimethylpentanal' },
      { col: '2-methylpropanal', row: '2-methylpropanal', smiles: 'CC(C)C(O)C(C)(C)C=O', name: '3-hydroxy-2,2,4-trimethylpentanal' },
    ]
    // Grid order is top-left, top-right, bottom-left, bottom-right (see Step6 in AldolScrolly.tsx).
    const order = [0, 1, 2, 3]
    for (const k of order) {
      expect(unit8Name(cells[k].smiles)).toBe(cells[k].name)
      expect(GRID_NAMES[k]).toBe(cells[k].name)
    }
  })

  it('names the four Step 6 products, in grid order (row = carbonyl attacked, column = carbanion former)', () => {
    expect(GRID_NAMES).toEqual([
      '3-hydroxy-2-methylpentanal',
      '3-hydroxy-2,2-dimethylpentanal',
      '3-hydroxy-2,4-dimethylpentanal',
      '3-hydroxy-2,2,4-trimethylpentanal',
    ])
  })
})

describe('Aldol Scrolly: deterministic target state per Step', () => {
  it('has six Steps, with the molecule count and curved-arrow count P specifies', () => {
    expect(STEP_TARGETS.map((s) => s.molecules.length)).toEqual([1, 2, 2, 2, 3, 4])
    expect(STEP_TARGETS.map((s) => s.curvedArrows)).toEqual([0, 2, 2, 0, 0, 0])
  })

  it('Step 6 is the 2 × 2 grid: the diagonal holds the two self-aldols', () => {
    expect(STEP_TARGETS[5].molecules).toHaveLength(4)
    expect(GRID[0].smiles).toBe(SMILES.aldolPropanal)
    expect(GRID[3].smiles).toBe(SMILES.aldolIsobutanal)
  })
})
