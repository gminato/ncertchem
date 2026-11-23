import { describe, expect, it } from 'vitest'
import { ALDOL_CELLS, PARTNERS, SECOND_PARTNERS, FIRST_PARTNERS, aldolGrid, gridCells, type PartnerId } from './aldol-model'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { unit8Name } from './ncert-c12-unit8-data'
import { skeletalBounds } from '@/components/organic/SkeletalFormula'

/** Element counts from a formula such as C4H8O2. */
function counts(formula: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[m[1]] = (out[m[1]] ?? 0) + (m[2] ? Number(m[2]) : 1)
  return out
}

function add(a: Record<string, number>, b: Record<string, number>, sign = 1): Record<string, number> {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + sign * v
  return out
}

const formulaOf = (smiles: string) => counts(molecularFormula(parseSmiles(smiles)))
const WATER = { H: 2, O: 1 }

describe('aldol model', () => {
  it('gives each partner the formula its SMILES prints', () => {
    const expected: Record<string, string> = {
      ethanal: 'C2H4O',
      propanal: 'C3H6O',
      methylpropanal: 'C4H8O',
      acetone: 'C3H6O',
      benzaldehyde: 'C7H6O',
    }
    for (const p of PARTNERS) expect(molecularFormula(parseSmiles(p.smiles)), p.id).toBe(expected[p.id])
  })

  it('counts α-hydrogens: benzaldehyde has none, every other partner has at least one', () => {
    expect(PARTNERS.find((p) => p.id === 'benzaldehyde')?.alphaHydrogens).toBe(0)
    for (const p of PARTNERS.filter((x) => x.id !== 'benzaldehyde')) expect(p.alphaHydrogens, p.id).toBeGreaterThan(0)
  })

  it('makes every aldol by adding the donor and the acceptor, and every condensation by losing water', () => {
    for (const [key, cell] of Object.entries(ALDOL_CELLS)) {
      const [donor, acceptor] = key.split('>') as [PartnerId, PartnerId]
      const d = PARTNERS.find((p) => p.id === donor)!
      const a = PARTNERS.find((p) => p.id === acceptor)!
      const aldol = formulaOf(cell.aldol)
      expect(aldol, `${key} aldol formula`).toEqual(add(formulaOf(d.smiles), formulaOf(a.smiles)))
      if (cell.condensed) expect(formulaOf(cell.condensed), `${key} condensed`).toEqual(add(aldol, WATER, -1))
    }
  })

  it('names every product with the namer and never an empty name', () => {
    for (const cell of Object.values(ALDOL_CELLS)) {
      expect(unit8Name(cell.aldol).length).toBeGreaterThan(0)
      if (cell.condensed) expect(unit8Name(cell.condensed).length).toBeGreaterThan(0)
    }
  })

  it('offers only supported pairs, and every pair has its cells', () => {
    for (const first of FIRST_PARTNERS) {
      for (const second of SECOND_PARTNERS[first] ?? []) {
        const grid = aldolGrid(first, second)
        expect(gridCells(grid).length).toBeGreaterThan(0)
      }
    }
    const grid = aldolGrid('propanal', 'methylpropanal')
    expect(gridCells(grid)).toHaveLength(4)
    expect(aldolGrid('propanal', 'benzaldehyde').inert).toEqual(['benzaldehyde'])
    expect(gridCells(aldolGrid('propanal', 'benzaldehyde'))).toHaveLength(2)
  })

  it('draws every molecule inside its 300 x 240 card with a 12-unit margin at 44 px per bond', () => {
    const graphs = [...Object.values(ALDOL_CELLS).flatMap((c) => [c.aldol, c.condensed]), ...PARTNERS.map((p) => p.smiles)]
    for (const smiles of graphs) {
      if (!smiles) continue
      const b = skeletalBounds(parseSmiles(smiles), 44)
      expect(b.width, `${smiles} width`).toBeLessThanOrEqual(300 - 24)
      expect(b.height, `${smiles} height`).toBeLessThanOrEqual(240 - 24)
    }
  })
})
