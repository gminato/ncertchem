import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import {
  TETRAHEDRAL_SMILES,
  condensedFade,
  morphTarget,
  representationSteps,
  tetrahedralModel,
} from './representations-steps'

describe('representationSteps', () => {
  const steps = representationSteps()

  it('has six Steps in the order complete, condensed, bond-line, ring, arene, tetrahedral', () => {
    expect(steps.map((s) => s.kind)).toEqual(['complete', 'condensed', 'bond-line', 'ring', 'arene', 'tetrahedral'])
  })

  it('morphs the same molecule through the first three Steps', () => {
    expect(new Set(steps.slice(0, 3).map((s) => s.smiles)).size).toBe(1)
  })

  it('parses every molecule and keeps the formulas the lib gives', () => {
    const formulas = steps.map((s) => molecularFormula(parseSmiles(s.smiles)))
    expect(formulas).toEqual(['C6H14O', 'C6H14O', 'C6H14O', 'C6H12', 'C7H8', 'CHBrClF'])
  })
})

describe('morphTarget and condensedFade', () => {
  const steps = representationSteps()
  it('ends the morph at the bond-line drawing and holds the complete formula before it', () => {
    expect(steps.map((s) => morphTarget(s))).toEqual([0, 0, 1, 0, 0, 0])
  })
  it('shows the condensed line only on its own Step', () => {
    expect(steps.map((s) => condensedFade(s))).toEqual([0, 1, 0, 0, 0, 0])
  })
})

describe('tetrahedralModel', () => {
  const g = parseSmiles(TETRAHEDRAL_SMILES)
  const model = tetrahedralModel(g, 1)
  const pos = new Map(model.atoms.map((a) => [a.id, a.position]))
  const vec = (id: string) => pos.get(id)!
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const len = (a: number[]) => Math.sqrt(dot(a, a))

  it('puts the four substituents on a tetrahedron: every bond angle is 109.47 degrees', () => {
    const ids = model.atoms.filter((a) => a.id !== 'C').map((a) => a.id)
    expect(ids).toHaveLength(4)
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const cos = dot(vec(ids[i]), vec(ids[j])) / (len(vec(ids[i])) * len(vec(ids[j])))
        const angle = (Math.acos(cos) * 180) / Math.PI
        expect(angle).toBeCloseTo(109.47, 1)
      }
    }
  })

  it('keeps the element of each substituent, the implicit hydrogen included', () => {
    const elements = model.atoms.filter((a) => a.id !== 'C').map((a) => a.element).sort()
    expect(elements).toEqual(['Br', 'Cl', 'F', 'H'])
  })

  it('refuses a carbon without four substituents', () => {
    expect(() => tetrahedralModel(parseSmiles('C=C'), 0)).toThrow(RangeError)
  })
})
