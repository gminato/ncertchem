import { describe, expect, it } from 'vitest'
import { MOLECULE_LAYOUTS } from '@/components/vocab/molecules'
import {
  elementCounts,
  morphAtoms,
  pairAtoms,
  placeMolecules,
  type SceneAtom,
} from './atom-scene'

describe('placeMolecules', () => {
  it('places an H2 with two H atoms and one bond, at its centre when exploded = 0', () => {
    const scene = placeMolecules([{ formula: 'H2', cx: 100, cy: 50, scale: 1 }])
    expect(scene.atoms.map((a) => a.element)).toEqual(['H', 'H'])
    expect(scene.bonds).toEqual([{ a: 0, b: 1 }])
    const midX = (scene.atoms[0].x + scene.atoms[1].x) / 2
    const midY = (scene.atoms[0].y + scene.atoms[1].y) / 2
    expect(midX).toBeCloseTo(100, 6)
    expect(midY).toBeCloseTo(50, 6)
  })

  it('pushes the two atoms of H2 apart as explode grows', () => {
    const gap = (explode: number) => {
      const s = placeMolecules([{ formula: 'H2', cx: 0, cy: 0, scale: 1 }], explode)
      return Math.hypot(s.atoms[0].x - s.atoms[1].x, s.atoms[0].y - s.atoms[1].y)
    }
    expect(gap(1)).toBeGreaterThan(gap(0))
    const [a, b] = MOLECULE_LAYOUTS.H2.atoms
    expect(gap(0)).toBeCloseTo(Math.hypot(b.x - a.x, b.y - a.y), 6)
  })

  it('numbers molecule indices so that atoms can be grouped', () => {
    const scene = placeMolecules([
      { formula: 'H2', cx: 0, cy: 0, scale: 1 },
      { formula: 'O2', cx: 50, cy: 0, scale: 1 },
    ])
    expect(scene.atoms.map((a) => a.mol)).toEqual([0, 0, 1, 1])
    expect(scene.bonds).toEqual([
      { a: 0, b: 1 },
      { a: 2, b: 3 },
    ])
  })

  it('throws for a formula without a layout', () => {
    expect(() => placeMolecules([{ formula: 'XeF9', cx: 0, cy: 0, scale: 1 }])).toThrow(RangeError)
  })
})

describe('pairAtoms and morphAtoms (atoms are conserved)', () => {
  const reactants = placeMolecules([
    { formula: 'H2', cx: 0, cy: 0, scale: 1 },
    { formula: 'H2', cx: 60, cy: 0, scale: 1 },
    { formula: 'O2', cx: 120, cy: 0, scale: 1 },
  ])
  const products = placeMolecules([
    { formula: 'H2O', cx: 0, cy: 100, scale: 1 },
    { formula: 'H2O', cx: 60, cy: 100, scale: 1 },
  ])

  it('2H2 + O2 -> 2H2O: each element keeps its atom count (H 4, O 2)', () => {
    expect(elementCounts(reactants.atoms)).toEqual({ H: 4, O: 2 })
    expect(elementCounts(products.atoms)).toEqual({ H: 4, O: 2 })
  })

  it('pairs every reactant atom with an atom of the same element', () => {
    const targetOf = pairAtoms(reactants.atoms, products.atoms)
    expect(targetOf).toHaveLength(reactants.atoms.length)
    targetOf.forEach((j, i) => {
      expect(products.atoms[j].element).toBe(reactants.atoms[i].element)
    })
    expect(new Set(targetOf).size).toBe(targetOf.length)
  })

  it('throws when the element counts differ', () => {
    const fewer = placeMolecules([{ formula: 'H2O', cx: 0, cy: 0, scale: 1 }])
    expect(() => pairAtoms(reactants.atoms, fewer.atoms)).toThrow(RangeError)
  })

  it('morphs from the reactant positions (t = 0) to the product positions (t = 1)', () => {
    const targetOf = pairAtoms(reactants.atoms, products.atoms)
    const start = morphAtoms(reactants.atoms, products.atoms, targetOf, 0)
    const end = morphAtoms(reactants.atoms, products.atoms, targetOf, 1)
    start.forEach((atom, i) => {
      expect(atom.x).toBeCloseTo(reactants.atoms[i].x, 9)
      expect(atom.y).toBeCloseTo(reactants.atoms[i].y, 9)
    })
    end.forEach((atom, i) => {
      const goal = products.atoms[targetOf[i]]
      expect(atom.x).toBeCloseTo(goal.x, 9)
      expect(atom.y).toBeCloseTo(goal.y, 9)
    })
  })

  it('clamps t outside [0, 1]', () => {
    const targetOf = pairAtoms(reactants.atoms, products.atoms)
    const a = morphAtoms(reactants.atoms, products.atoms, targetOf, 2)
    const b = morphAtoms(reactants.atoms, products.atoms, targetOf, 1)
    expect(a).toEqual(b)
  })
})

describe('elementCounts', () => {
  it('counts atoms by symbol', () => {
    const atoms: Pick<SceneAtom, 'element'>[] = [{ element: 'H' }, { element: 'H' }, { element: 'O' }]
    expect(elementCounts(atoms)).toEqual({ H: 2, O: 1 })
  })
})

describe('layout table', () => {
  it('provides the molecules the Unit 1 Animations need', () => {
    for (const formula of ['H2', 'O2', 'H2O', 'CH4', 'NaCl']) {
      expect(MOLECULE_LAYOUTS[formula]).toBeDefined()
    }
  })
})
