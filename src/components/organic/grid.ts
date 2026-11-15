/**
 * Pure orthogonal layout for the "complete" structural formula (Unit 8): every carbon and every
 * hydrogen on a square grid, bonds horizontal or vertical. The longest chain lies on one row,
 * branches go up and down. Hydrogens take the free sides of their parent atom.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { adjacency, longestChain, type Point } from './layout'

export interface GridHydrogen {
  parent: number
  pos: Point
}

export interface CompleteGrid {
  /** Grid position of every heavy atom, indexed like graph.atoms. */
  heavy: Point[]
  hydrogens: GridHydrogen[]
}

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

export function completeGrid(g: MolGraph): CompleteGrid {
  const n = g.atoms.length
  const adj = adjacency(g)
  const heavy: Point[] = new Array<Point>(n)
  const placed = new Array<boolean>(n).fill(false)
  const occupied = new Set<string>()
  const key = (p: Point) => `${p.x},${p.y}`
  const dirIn: (Point | null)[] = new Array<Point | null>(n).fill(null)
  const chain = longestChain(g)
  const onChain = new Set(chain)

  const put = (a: number, p: Point) => {
    heavy[a] = p
    placed[a] = true
    occupied.add(key(p))
  }

  chain.forEach((a, i) => {
    put(a, { x: i, y: 0 })
    if (i > 0) dirIn[a] = { x: 1, y: 0 }
  })

  const queue = [...chain]
  let branchCounter = 0
  for (let h = 0; h < queue.length; h++) {
    const p = queue[h]
    for (const v of adj[p]) {
      if (placed[v]) continue
      const pp = heavy[p]
      const din = dirIn[p]
      let prefs: Point[]
      if (onChain.has(p)) {
        // Branches from the chain go up and down, alternating.
        const up = { x: 0, y: 1 }
        const down = { x: 0, y: -1 }
        prefs = branchCounter++ % 2 === 0 ? [up, down] : [down, up]
      } else if (din) {
        const perp1 = { x: -din.y, y: din.x }
        const perp2 = { x: din.y, y: -din.x }
        prefs = [din, perp1, perp2, { x: -din.x, y: -din.y }]
      } else {
        prefs = DIRS
      }
      const free = prefs.find((d) => !occupied.has(key({ x: pp.x + d.x, y: pp.y + d.y })))
      const d = free ?? DIRS.find((c) => !occupied.has(key({ x: pp.x + c.x, y: pp.y + c.y }))) ?? { x: 1, y: 1 }
      const pos = { x: pp.x + d.x, y: pp.y + d.y }
      put(v, pos)
      dirIn[v] = d
      queue.push(v)
    }
  }

  // Hydrogens: each heavy atom gets its hCount on free sides of the grid, diagonals if needed.
  const hydrogens: GridHydrogen[] = []
  // Carbons first: a heteroatom's hydrogen must not take the last free side of a carbon.
  const hOrder = [...Array(n).keys()].sort((x, y) => (g.atoms[x].element === 'C' ? 0 : 1) - (g.atoms[y].element === 'C' ? 0 : 1))
  for (const a of hOrder) {
    const h = g.atoms[a].hCount ?? 0
    let given = 0
    for (const d of DIRS) {
      if (given >= h) break
      const pos = { x: heavy[a].x + d.x, y: heavy[a].y + d.y }
      if (occupied.has(key(pos))) continue
      occupied.add(key(pos))
      hydrogens.push({ parent: a, pos })
      given++
    }
    const diagonals: Point[] = [
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ]
    for (const d of diagonals) {
      if (given >= h) break
      const pos = { x: heavy[a].x + d.x, y: heavy[a].y + d.y }
      if (occupied.has(key(pos))) continue
      occupied.add(key(pos))
      hydrogens.push({ parent: a, pos })
      given++
    }
  }
  return { heavy, hydrogens }
}
