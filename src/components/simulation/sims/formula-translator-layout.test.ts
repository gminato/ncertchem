import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { condensedAtoms } from '@/components/organic'
import { orthogonalComplete } from './formula-translator-layout'
import { TRANSLATOR_PRESETS } from '@/lib/chem/formula-translator'

function layoutOf(smiles: string) {
  const g = parseSmiles(smiles)
  const chain = condensedAtoms(g).map((c) => c.atom)
  return { g, layout: orthogonalComplete(g, chain) }
}

describe('orthogonalComplete', () => {
  for (const smiles of ['CC(O)CC(C)C', 'CC(C)CC(C)C(C)O', 'CC(=O)C', 'CC(C)CC(=O)O', 'CC(C)(C)O', 'CCOCC']) {
    it(`draws every hydrogen of ${smiles} once, on a free grid side`, () => {
      const { g, layout } = layoutOf(smiles)
      const total = g.atoms.reduce((s, a) => s + (a.hCount ?? 0), 0)
      expect(layout.hydrogens.length).toBe(total)
      const cells = new Set([...layout.heavy, ...layout.hydrogens].map((p) => `${p.x},${p.y}`))
      expect(cells.size).toBe(layout.heavy.length + layout.hydrogens.length)
    })
  }

  it('stands each methyl branch straight above or below its chain carbon', () => {
    const { g, layout } = layoutOf('CC(C)CC(C)C(C)O')
    const chain = condensedAtoms(g).map((c) => c.atom)
    for (const a of g.atoms.keys()) {
      if (chain.includes(a) || g.atoms[a].element !== 'C') continue
      const p = layout.heavy.find((h) => h.atom === a)!
      const parent = layout.heavy.find((h) => chain.includes(h.atom) && h.x === p.x)
      expect(parent).toBeDefined()
      expect(Math.abs(p.y)).toBe(1)
    }
  })

  it('never puts two atoms on one cell', () => {
    for (const smiles of ['CC(C)CC(C)C(C)O', 'CC(CC)C(C)O', 'CC(C)CC(=O)O']) {
      const { layout } = layoutOf(smiles)
      const cells = [...layout.heavy, ...layout.hydrogens].map((p) => `${p.x},${p.y}`)
      expect(new Set(cells).size).toBe(cells.length)
    }
  })

  it('puts a carbon own hydrogen on the side its branch does not use', () => {
    const { g, layout } = layoutOf('CC(C)CC(C)C(C)O')
    const chain = condensedAtoms(g).map((c) => c.atom)
    for (const a of chain) {
      const own = layout.hydrogens.filter((h) => h.parent === a)
      const cx = layout.heavy.find((c) => c.atom === a)!.x
      const branchAbove = layout.heavy.some((h) => !chain.includes(h.atom) && h.y === -1 && h.x === cx)
      const branchBelow = layout.heavy.some((h) => !chain.includes(h.atom) && h.y === 1 && h.x === cx)
      for (const h of own) {
        if (branchAbove) expect(h.y).toBe(1)
        if (branchBelow) expect(h.y).toBe(-1)
      }
    }
  })

  it('refuses a ring', () => {
    const g = parseSmiles('C1CCCCC1')
    expect(() => orthogonalComplete(g, [0, 1, 2])).toThrow(RangeError)
  })
})

describe('orthogonalComplete on the translator presets', () => {
  for (const preset of TRANSLATOR_PRESETS.filter((p) => p.kind === 'open')) {
    it(`lays out ${preset.smiles} with every atom on its own cell`, () => {
      const { g, layout } = layoutOf(preset.smiles)
      const total = g.atoms.reduce((s, a) => s + (a.hCount ?? 0), 0)
      expect(layout.hydrogens.length).toBe(total)
      const cells = [...layout.heavy, ...layout.hydrogens].map((p) => `${p.x},${p.y}`)
      expect(new Set(cells).size).toBe(cells.length)
      expect([1, 2]).toContain(layout.step)
    })
  }

  it('uses one column per bond for the simple chains', () => {
    expect(layoutOf('CC(C)CC(C)C(C)O').layout.step).toBe(1)
    expect(layoutOf('CC(=O)C').layout.step).toBe(1)
  })
})
