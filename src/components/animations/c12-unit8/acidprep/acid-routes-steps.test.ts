import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACID_ROUTE_MOLECULES,
  ACID_ROUTE_STEPS,
  ACID_ROUTE_VIEW_HEIGHT,
  isGroup,
  type Piece,
  stepContentHeight,
} from './acid-routes-steps'

/** Element counts of a formula such as C6H12O2 or HCl, independent of the order written. */
function counts(formula: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    out[el] = (out[el] ?? 0) + (n === '' ? 1 : Number(n))
  }
  return out
}

function allSpecies() {
  return ACID_ROUTE_STEPS.flatMap((step) =>
    step.rows.flatMap((row: readonly Piece[]) => row.flatMap((piece) => (isGroup(piece) ? [...piece] : [])))
  )
}

describe('acid-routes Scrolly Steps', () => {
  it('has the six Steps in the Prose order', () => {
    expect(ACID_ROUTE_STEPS).toHaveLength(6)
    expect(ACID_ROUTE_STEPS[0].label).toMatch(/Hexan-1-ol/)
    expect(ACID_ROUTE_STEPS[5].label).toMatch(/Ethyl butanoate/)
  })

  it('draws every molecule with the formula its SMILES gives', () => {
    for (const [key, mol] of Object.entries(ACID_ROUTE_MOLECULES)) {
      // The lib parser has no Mg bracket atom, so the Grignard reagent is checked by its written formula.
      if (mol.smiles.includes('Mg')) continue
      expect(counts(molecularFormula(parseSmiles(mol.smiles))), key).toEqual(counts(mol.formula))
    }
    expect(counts(ACID_ROUTE_MOLECULES.butylMgBr.formula)).toEqual({ C: 4, H: 9, Br: 1, Mg: 1 })
  })

  it('names only molecules that the table defines, and drops no text label with caret or underscore notation', () => {
    for (const s of allSpecies()) {
      expect(ACID_ROUTE_MOLECULES[s.mol]).toBeDefined()
      if (s.text !== undefined) expect(s.text).not.toMatch(/[\^_]/)
    }
  })

  it('shows one more carbon in the Grignard route than in 1-bromobutane', () => {
    const carbons = (key: keyof typeof ACID_ROUTE_MOLECULES) => counts(ACID_ROUTE_MOLECULES[key].formula).C
    expect(carbons('pentanoic')).toBe(carbons('bromobutane') + 1)
  })

  it('highlights the carboxyl carbon of pentanoic acid, the carbon that came from CO₂', () => {
    const graph = parseSmiles(ACID_ROUTE_MOLECULES.pentanoic.smiles)
    // Atom 4 is the carboxyl carbon (C0–C4 are the chain; O5 and O6 are the two oxygens).
    expect(graph.atoms[4].element).toBe('C')
    expect(graph.atoms[5].element).toBe('O')
  })

  it('keeps every Step inside the fixed panel height', () => {
    for (const step of ACID_ROUTE_STEPS) {
      expect(stepContentHeight(step)).toBeLessThanOrEqual(ACID_ROUTE_VIEW_HEIGHT - 24)
    }
    expect(ACID_ROUTE_VIEW_HEIGHT).toBeLessThanOrEqual(1100)
  })
})
