import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ANILINE,
  ARENPREP_STEP_COUNT,
  BENZENE,
  BROMOBENZENE,
  CHLOROBENZENE,
  IODOBENZENE,
  ORTHO_CHLOROTOLUENE,
  PARA_CHLOROTOLUENE,
  SANDMEYER_ROUTES,
  TOLUENE,
  TOLUENE_IPSO,
  TOLUENE_METHYL,
  TOLUENE_ORTHO,
  TOLUENE_PARA,
  arenprepStepTarget,
  bondDistance,
  namedMolecule,
} from './arenprep-steps'

describe('Section 5 molecules', () => {
  it('have the formulas the Prose names', () => {
    const expected: Array<[string, string]> = [
      [BENZENE, 'C6H6'],
      [TOLUENE, 'C7H8'],
      [ORTHO_CHLOROTOLUENE, 'C7H7Cl'],
      [PARA_CHLOROTOLUENE, 'C7H7Cl'],
      [CHLOROBENZENE, 'C6H5Cl'],
      [BROMOBENZENE, 'C6H5Br'],
      [IODOBENZENE, 'C6H5I'],
      [ANILINE, 'C6H7N'],
    ]
    for (const [smiles, formula] of expected) {
      expect(molecularFormula(parseSmiles(smiles))).toBe(formula)
    }
  })

  it('name the chlorotoluenes as the namer does', () => {
    expect(namedMolecule(ORTHO_CHLOROTOLUENE).name).toBe('1-chloro-2-methylbenzene')
    expect(namedMolecule(PARA_CHLOROTOLUENE).name).toBe('1-chloro-4-methylbenzene')
  })

  it('put the ortho and para labels on the ring positions the drawing marks', () => {
    const g = parseSmiles(TOLUENE)
    expect(bondDistance(g, TOLUENE_METHYL, TOLUENE_IPSO)).toBe(1)
    for (const o of TOLUENE_ORTHO) expect(bondDistance(g, TOLUENE_IPSO, o)).toBe(1)
    expect(bondDistance(g, TOLUENE_IPSO, TOLUENE_PARA)).toBe(3)
  })

  it('place the chlorine of each product on the marked ring position', () => {
    // Ortho product: the Cl-bearing carbon (atom 6) is next to the ipso carbon (atom 1).
    expect(bondDistance(parseSmiles(ORTHO_CHLOROTOLUENE), 1, 6)).toBe(1)
    // Para product: the Cl-bearing carbon (atom 4) is three bonds from the ipso carbon.
    expect(bondDistance(parseSmiles(PARA_CHLOROTOLUENE), 1, 4)).toBe(3)
  })

  it('gives each Sandmeyer route the product the Prose names', () => {
    expect(SANDMEYER_ROUTES.map((r) => r.reagent)).toEqual(['Cu₂Cl₂', 'Cu₂Br₂', 'KI'])
    expect(SANDMEYER_ROUTES.map((r) => r.product)).toEqual([CHLOROBENZENE, BROMOBENZENE, IODOBENZENE])
  })
})

describe('arenprep Step targets', () => {
  it('has six Steps', () => {
    expect(ARENPREP_STEP_COUNT).toBe(6)
  })

  it('draws the chlorine helper, the two chlorotoluenes, the separation, the iodination and the Sandmeyer chain', () => {
    expect(arenprepStepTarget(0).drawn).toContain(CHLOROBENZENE)
    expect(arenprepStepTarget(1).drawn).toEqual([TOLUENE, ORTHO_CHLOROTOLUENE, PARA_CHLOROTOLUENE])
    expect(arenprepStepTarget(2).drawn).toEqual([PARA_CHLOROTOLUENE, ORTHO_CHLOROTOLUENE])
    expect(arenprepStepTarget(3).route).toBe('I2 with HNO3')
    expect(arenprepStepTarget(5).drawn).toEqual([ANILINE, BENZENE, CHLOROBENZENE, BROMOBENZENE, IODOBENZENE])
  })

  it('shows no fluoroarene product in the F2 Step and no meta product anywhere', () => {
    const fluorine = arenprepStepTarget(4).drawn
    expect(fluorine).toEqual([BENZENE])
    const everything = [0, 1, 2, 3, 4, 5].flatMap((k) => arenprepStepTarget(k).drawn)
    expect(everything.some((s) => s.includes('F') && s.includes('C1'))).toBe(false)
    // The toluene Step draws only the ortho and para products (no meta isomer structure).
    expect(arenprepStepTarget(1).drawn).toHaveLength(3)
  })

  it('clamps an out-of-range Step to the last Step', () => {
    expect(arenprepStepTarget(9).route).toBe('Sandmeyer')
  })
})
