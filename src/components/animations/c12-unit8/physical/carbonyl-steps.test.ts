import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { CARBONYL_BOILING_POINTS } from '@/lib/chem/ncert-c12-unit8-data'
import {
  ACETONE_SMILES,
  atomAt,
  BUTANE_SMILES,
  CARBONYL_BEATS,
  EXPECTED_FORMULA,
  LADDER_ACTIVE_K,
  ladderY,
  PENTANAL_SMILES,
  PROPAN1OL_SMILES,
  PROPANAL_SMILES,
  showsLadder,
  WATER_SMILES,
} from './carbonyl-steps'

describe('Physical properties Scrolly Steps', () => {
  it('has the six Steps in the Prose order', () => {
    expect(CARBONYL_BEATS).toHaveLength(6)
    expect(CARBONYL_BEATS[0]).toBe('ladder-all')
    expect(CARBONYL_BEATS[2]).toBe('dipoles')
    expect(CARBONYL_BEATS[5]).toBe('pentanal-water')
  })

  it('draws every molecule with the formula the Prose uses', () => {
    for (const [smiles, formula] of Object.entries(EXPECTED_FORMULA)) {
      expect(molecularFormula(parseSmiles(smiles)), smiles).toBe(formula)
    }
    for (const row of CARBONYL_BOILING_POINTS) {
      expect(molecularFormula(parseSmiles(row.smiles)), row.name).toBe(EXPECTED_FORMULA[row.smiles])
    }
    expect(molecularFormula(parseSmiles(PENTANAL_SMILES))).toBe('C5H10O')
    expect(molecularFormula(parseSmiles(WATER_SMILES))).toBe('H2O')
  })

  it('places the ladder rungs in boiling-point order, bottom to top', () => {
    const ys = CARBONYL_BOILING_POINTS.map((r) => ladderY(r.bpK))
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeLessThan(ys[i - 1])
    expect(ladderY(260)).toBeGreaterThan(ladderY(380))
  })

  it('highlights the compounds each Step talks about', () => {
    expect(LADDER_ACTIVE_K['ladder-all']).toHaveLength(5)
    expect(LADDER_ACTIVE_K['butane-alone']).toEqual([273])
    expect(LADDER_ACTIVE_K.dipoles).toEqual([322, 329])
    expect(LADDER_ACTIVE_K['hydrogen-bonds']).toEqual([370])
    expect(showsLadder('acetone-water')).toBe(false)
    expect(showsLadder('pentanal-water')).toBe(false)
  })

  it('puts the carbonyl oxygen where the dipole and hydrogen-bond lines meet it', () => {
    // Propanal and acetone: the O index is the last atom in the SMILES.
    const p = { smiles: PROPANAL_SMILES, scale: 26, cx: 300, cy: 200 }
    const o = atomAt(p, 3)
    const c = atomAt(p, 2)
    expect(Math.hypot(o.x - c.x, o.y - c.y)).toBeGreaterThan(10)
    expect(parseSmiles(ACETONE_SMILES).atoms[3].element).toBe('O')
    expect(parseSmiles(PROPAN1OL_SMILES).atoms[3].element).toBe('O')
    expect(parseSmiles(PENTANAL_SMILES).atoms[5].element).toBe('O')
    expect(parseSmiles(BUTANE_SMILES).atoms.every((a) => a.element === 'C')).toBe(true)
  })
})
