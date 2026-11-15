/**
 * Orthogonal layout of a complete structural formula for an open chain (Section 8.3). Chain carbons
 * sit on one horizontal line, one bond apart. A branch carbon stands straight above or below its
 * chain carbon with its own three hydrogens left, right and at the end. A chain carbon's hydrogens
 * take the sides its branches do not use, as in NCERT's complete formulas.
 *
 * Units: one column is one bond length horizontally, one row is one bond length vertically. Every
 * bond therefore spans one unit. Where a molecule cannot be placed on that grid without two atoms
 * meeting, the layout falls back to a grid two columns per bond, which always fits.
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
  /** Columns per bond: 1 when the molecule fits the tight grid, 2 otherwise. */
  step: 1 | 2
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Lays out an open-chain molecule. `chain` lists the chain atoms in order (from condensedAtoms).
 * Every atom off the chain must be a branch of depth one: a carbon or a heteroatom, with its own
 * hydrogens and nothing further.
 *
 * @throws {RangeError} For a ring, a deeper branch, or more branches or hydrogens than the grid holds
 */
export function orthogonalComplete(g: MolGraph, chain: readonly number[]): OrthogonalLayout {
  try {
    return buildLayout(g, chain, 1)
  } catch (tight) {
    if (!(tight instanceof RangeError) || tight.message.startsWith('ring')) throw tight
    return buildLayout(g, chain, 2)
  }
}

function buildLayout(g: MolGraph, chain: readonly number[], step: 1 | 2): OrthogonalLayout {
  const onChain = new Set(chain)
  if (chain.some((a) => neighbours(g, a).some((n) => onChain.has(n.atom) && !isChainNeighbour(chain, a, n.atom)))) {
    throw new RangeError('ring: the chain closes on itself')
  }
  const heavy: LayoutAtom[] = chain.map((a, k) => ({ atom: a, x: k * step, y: 0 }))
  const occupied = new Set(heavy.map((p) => cell(p.x, p.y)))
  const hydrogens: LayoutHydrogen[] = []

  // Branches: alternate up and down along the chain, so two neighbouring branches never share a row.
  const branches: { chainIndex: number; atom: number; x: number; side: number }[] = []
  let lastSide = 1
  chain.forEach((a, k) => {
    const hanging = neighbours(g, a)
      .map((n) => n.atom)
      .filter((n) => !onChain.has(n))
    if (hanging.length > 2) throw new RangeError('a chain carbon takes at most two branches here')
    const first = -lastSide
    hanging.forEach((b, i) => {
      const side = i === 0 ? first : -first
      if (i === hanging.length - 1) lastSide = side
      const x = k * step
      if (occupied.has(cell(x, side))) throw new RangeError('two branches meet')
      occupied.add(cell(x, side))
      heavy.push({ atom: b, x, y: side })
      branches.push({ chainIndex: k, atom: b, x, side })
      const deeper = neighbours(g, b).filter((n) => n.atom !== a && g.atoms[n.atom].element !== 'H')
      if (deeper.length > 0) throw new RangeError('branches deeper than one atom are not laid out here')
    })
  })

  // Chain carbons first: their hydrogens sit on the free sides, and the end carbons also take the outward side.
  chain.forEach((a, k) => {
    const need = g.atoms[a].hCount ?? 0
    const x = k * step
    const options: [number, number][] = [
      [0, -1],
      [0, 1],
    ]
    if (k === 0) options.push([-1, 0])
    if (k === chain.length - 1) options.push([1, 0])
    placeHydrogens(a, need, options, x, occupied, hydrogens)
  })

  // Branch hydrogens: outward first, then left and right, skipping cells already taken.
  for (const br of branches) {
    const need = g.atoms[br.atom].hCount ?? 0
    // Straight out first, then sideways, then the two diagonals beyond the branch's own row.
    const options: [number, number][] = [
      [0, 2 * br.side],
      [-1, br.side],
      [1, br.side],
      [-1, 2 * br.side],
      [1, 2 * br.side],
    ]
    placeHydrogens(br.atom, need, options, br.x, occupied, hydrogens)
  }

  const all = [...heavy, ...hydrogens]
  return {
    heavy,
    hydrogens,
    bonds: g.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order })),
    step,
    minX: Math.min(...all.map((p) => p.x)),
    maxX: Math.max(...all.map((p) => p.x)),
    minY: Math.min(...all.map((p) => p.y)),
    maxY: Math.max(...all.map((p) => p.y)),
  }
}

function isChainNeighbour(chain: readonly number[], a: number, b: number): boolean {
  const i = chain.indexOf(a)
  const j = chain.indexOf(b)
  return Math.abs(i - j) === 1
}

function cell(x: number, y: number): string {
  return `${x},${y}`
}

/** Places `need` hydrogens of `parent` at the first free options, offsets measured from the anchor column. */
function placeHydrogens(
  parent: number,
  need: number,
  options: [number, number][],
  anchorX: number,
  occupied: Set<string>,
  out: LayoutHydrogen[],
): void {
  let placed = 0
  for (const [dx, dy] of options) {
    if (placed >= need) break
    const x = anchorX + dx
    const y = dy
    if (occupied.has(cell(x, y))) continue
    occupied.add(cell(x, y))
    out.push({ parent, x, y })
    placed++
  }
  if (placed < need) throw new RangeError('no room for the hydrogens of an atom')
}
