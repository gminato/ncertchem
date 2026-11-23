import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { classifyHalide } from '@/lib/chem/haloalkanes'
import { FRAME_ATTACH, FRAME_SMILES, HALIDE_STEPS, describeHalide, describeStep } from './halide-classes-steps'

/** Expected name, class and formula per molecule, from the Section's fact sheet (P1). */
const EXPECTED: Record<string, [string, string, string]> = {
  'BrCC(C)CC': ['1-bromo-2-methylbutane', '1° alkyl halide', 'C₅H₁₁Br'],
  'CC(C)C(Br)C': ['2-bromo-3-methylbutane', '2° alkyl halide', 'C₅H₁₁Br'],
  'CCC(C)(Br)C': ['2-bromo-2-methylbutane', '3° alkyl halide', 'C₅H₁₁Br'],
  'CC=CCBr': ['1-bromobut-2-ene', 'allylic halide', 'C₄H₇Br'],
  'BrCC1=CC=CC=C1': ['bromophenylmethane', '1° benzylic halide', 'C₇H₇Br'],
  'CC(Cl)C1=CC=CC=C1': ['1-chloro-1-phenylethane', '2° benzylic halide', 'C₈H₉Cl'],
  'CC(C)(Br)C1=CC=CC=C1': ['2-bromo-2-phenylpropane', '3° benzylic halide', 'C₉H₁₁Br'],
  'C=C(C)Cl': ['2-chloroprop-1-ene', 'vinylic halide', 'C₃H₅Cl'],
  'CCC1=CC(Br)=CC=C1': ['1-bromo-3-ethylbenzene', 'aryl halide', 'C₈H₉Br'],
  'CCC(Cl)(Cl)C': ['2,2-dichlorobutane', 'geminal dihalide', 'C₄H₈Cl₂'],
  'CC(C)C(Br)CBr': ['1,2-dibromo-3-methylbutane', 'vicinal dihalide', 'C₅H₁₀Br₂'],
  'CC(Cl)(Cl)Cl': ['1,1,1-trichloroethane', 'polyhalogen compound', 'C₂H₃Cl₃'],
}

describe('halide classes Scrolly steps', () => {
  it('has six Steps with the panel counts the layout expects', () => {
    expect(HALIDE_STEPS.map((s) => s.length)).toEqual([1, 2, 1, 3, 2, 3])
  })

  it('names, classes and formulas match the Section fact sheet', () => {
    const seen = new Set<string>()
    HALIDE_STEPS.flat().forEach((smiles) => {
      seen.add(smiles)
      const d = describeHalide(smiles)
      const [name, cls, formula] = EXPECTED[smiles]
      expect(d.name).toBe(name)
      expect(d.classLabel).toBe(cls)
      expect(d.formula).toBe(formula)
    })
    expect(seen.size).toBe(Object.keys(EXPECTED).length)
  })

  it('highlights the halogen-bearing carbon in every panel', () => {
    for (const step of HALIDE_STEPS) {
      for (const smiles of step) {
        expect(describeHalide(smiles).highlight.length).toBeGreaterThan(0)
      }
    }
  })

  it('clamps out-of-range Steps', () => {
    expect(describeStep(-3).map((d) => d.smiles)).toEqual(['BrCC(C)CC'])
    expect(describeStep(99).map((d) => d.smiles)).toEqual(HALIDE_STEPS[5])
  })

  it('draws Steps 1 and 2 on one frame: the bromine on frame atom k gives the class of that step molecule', () => {
    const expected = [
      ['1°', 'BrCC(C)CC'],
      ['2°', 'CC(C)C(Br)C'],
      ['3°', 'CCC(C)(Br)C'],
    ]
    const placements = FRAME_ATTACH.flat()
    expect(placements).toEqual([0, 3, 1])
    placements.forEach((atom, i) => {
      const g = parseSmiles(FRAME_SMILES)
      g.atoms.push({ element: 'Br' })
      g.bonds.push({ a: atom, b: g.atoms.length - 1, order: 1 })
      const br = g.atoms.length - 1
      const [degree, smiles] = expected[i]
      expect(classifyHalide(g, br).degree).toBe(degree)
      expect(describeHalide(smiles).classLabel).toBe(`${degree} alkyl halide`)
    })
  })
})
