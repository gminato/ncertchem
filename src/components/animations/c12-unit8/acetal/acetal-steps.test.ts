import { describe, expect, it } from 'vitest'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { H, STEP_MOLECULES, W, placedBounds } from './acetal-steps'

describe('acetal Scrolly: Step targets', () => {
  it('has six Steps, the last one a text table with no structures', () => {
    expect(STEP_MOLECULES).toHaveLength(6)
    expect(STEP_MOLECULES[5]).toEqual([])
  })

  for (const [k, mols] of STEP_MOLECULES.entries()) {
    for (const p of mols) {
      it(`Step ${k + 1} ${p.id} (${p.smiles}) carries ${p.formula}`, () => {
        expect(molecularFormula(parseSmiles(p.smiles))).toBe(p.formula)
      })

      it(`Step ${k + 1} ${p.id} sits inside the viewBox with a 12-unit margin`, () => {
        const b = placedBounds(p)
        expect(b.x).toBeGreaterThanOrEqual(12)
        expect(b.y).toBeGreaterThanOrEqual(12)
        expect(b.x + b.width).toBeLessThanOrEqual(W - 12)
        expect(b.y + b.height).toBeLessThanOrEqual(H - 12)
      })
    }
  }
})
