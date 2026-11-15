/**
 * Orthogonal layout of a complete structural formula for an open chain (Section 8.3). Chain carbons
 * sit on one horizontal line, two columns apart, so the hydrogens that stand beside a branch fall in
 * the columns between carbons and never on top of a neighbour's hydrogen. A branch carbon stands
 * straight above or below its chain carbon with its own three hydrogens left, right and at the end.
 * A chain carbon's hydrogens take the sides its branches do not use, as in NCERT's complete formulas.
 *
 * Units: one column is one unit horizontally, one row is one unit vertically. Bonds between chain
 * carbons therefore span two units and every other bond spans one.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { neighbours } from '@/lib/chem/molecule-parse'

export interface LayoutAtom {
  atom: number
  x: number
  y: number
}

export interface LayoutHydrogen {
  parent: number
  x: number
  y: number
}

export interface LayoutBond {
  a: number
  b: number
  order: 1 | 2 | 3
}

export interface OrthogonalLayout {
  heavy: LayoutAtom[]
  hydrogens: LayoutHydrogen[]
  bonds: LayoutBond[]
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Columns between chain carbons. */
const STEP = 2

/**
 * Lays out an open-chain molecule. `chain` lists the chain atoms in order (from condensedAtoms).
 * Every atom off the chain must be a branch of depth one: a carbon or a heteroatom, with its own
 * hydrogens and nothing further.
 *
 * @throws {RangeError} For a ring, a deeper branch, or more hydrogens than free sides
 */
export function orthogonalComplete(g: MolGraph, chain: readonly number[]): OrthogonalLayout {
  const onChain = new Set(chain)
  const heavy: LayoutAtom[] = []
  const hydrogens: LayoutHydrogen[] = []
  const sides = new Map<number, Set<number>>() // atom -> used row directions (-1 up, 1 down) or 'L'/'R' via keys
  const used = (a: number) => {
    if (!sides.has(a)) sides.set(a, new Set())
    return sides.get(a)!
  }

  chain.forEach((a, k) => heavy.push({ atom: a, x: k * STEP, y: 0 }))

  // Branch sides: alternate up and down along the chain, so two neighbouring branches never share a row.
  let lastSide = 1
  chain.forEach((a, k) => {
    const branches = neighbours(g, a)
      .map((n) => n.atom)
      .filter((n) => !onChain.has(n))
    if (branches.length > 2) throw new RangeError('a chain carbon takes at most two branches here')
    const first = -lastSide
    branches.forEach((b, i) => {
      const side = i === 0 ? first : -first
      if (i === branches.length - 1) lastSide = side
      const bx = k * STEP
      heavy.push({ atom: b, x: bx, y: side })
      used(a).add(side)
      used(b).add(-side)
      // Branch hydrogens: outward first, then left and right.
      const need = g.atoms[b].hCount ?? 0
      const options: [number, number][] = [
        [0, 2 * side],
        [-1, side],
        [1, side],
      ]
      let placed = 0
      for (const [dx, dy] of options) {
        if (placed >= need) break
        hydrogens.push({ parent: b, x: bx + dx, y: dy === 2 * side ? 2 * side : dy })
        placed++
      }
      if (placed < need) throw new RangeError('no room for the hydrogens of a branch')
      const deeper = neighbours(g, b).filter((n) => n.atom !== a && g.atoms[n.atom].element !== 'H')
      if (deeper.length > 0) throw new RangeError('branches deeper than one atom are not laid out here')
    })
  })

  // Chain carbons: hydrogens on the sides that are free; the end carbons also take the outward side.
  chain.forEach((a, k) => {
    const need = g.atoms[a].hCount ?? 0
    const x = k * STEP
    const options: [number, number][] = [
      [0, -1],
      [0, 1],
    ]
    if (k === 0) options.push([-1, 0])
    if (k === chain.length - 1) options.push([1, 0])
    let placed = 0
    for (const [dx, dy] of options) {
      if (placed >= need) break
      if (dx === 0 && used(a).has(dy)) continue
      if (dx === 0) used(a).add(dy)
      hydrogens.push({ parent: a, x: x + dx, y: dy })
      placed++
    }
    if (placed < need) throw new RangeError('no room for the hydrogens of a chain carbon')
  })

  const all = [...heavy, ...hydrogens]
  return {
    heavy,
    hydrogens,
    bonds: g.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order })),
    minX: Math.min(...all.map((p) => p.x)),
    maxX: Math.max(...all.map((p) => p.x)),
    minY: Math.min(...all.map((p) => p.y)),
    maxY: Math.max(...all.map((p) => p.y)),
  }
}
