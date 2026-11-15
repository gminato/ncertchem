/**
 * Pure 2D layout for bond-line (skeletal) drawings of organic molecules, Unit 8.
 *
 * Unit bond length. Chains are zig-zags with 120 degree internal angles, branches leave at 120
 * degrees from the chain, rings are regular polygons, and a fused ring shares an edge with the
 * ring it joins. Coordinates are in "maths" orientation (y up); drawing components flip y.
 * Nothing here touches the DOM.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'

export interface Point {
  x: number
  y: number
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/** Two atoms closer than this (in bond lengths) count as clashing. */
export const CLASH_DISTANCE = 0.8

const TAU = Math.PI * 2
const RING_MIN = 3
const RING_MAX = 8

export function adjacency(g: MolGraph): number[][] {
  const adj: number[][] = g.atoms.map(() => [])
  for (const b of g.bonds) {
    adj[b.a].push(b.b)
    adj[b.b].push(b.a)
  }
  return adj
}

export function dist(p: Point, q: Point): number {
  return Math.hypot(p.x - q.x, p.y - q.y)
}

export function wrapAngle(a: number): number {
  let r = a % TAU
  if (r <= -Math.PI) r += TAU
  if (r > Math.PI) r -= TAU
  return r
}

function shortestPathAvoidingEdge(
  adj: number[][],
  from: number,
  to: number,
  skipA: number,
  skipB: number
): number[] | null {
  const prev = new Array<number>(adj.length).fill(-2)
  prev[from] = -1
  const queue = [from]
  for (let h = 0; h < queue.length; h++) {
    const v = queue[h]
    if (v === to) break
    for (const w of adj[v]) {
      if ((v === skipA && w === skipB) || (v === skipB && w === skipA)) continue
      if (prev[w] !== -2) continue
      prev[w] = v
      queue.push(w)
    }
  }
  if (prev[to] === -2) return null
  const path: number[] = []
  for (let v = to; v !== -1; v = prev[v]) path.push(v)
  return path.reverse()
}

/**
 * Smallest rings of the graph, each as an ordered atom cycle (consecutive atoms are bonded and
 * the last closes back to the first). For every bond inside a ring system the shortest
 * alternative path gives the smallest ring through that bond; duplicates are dropped.
 */
export function findRings(g: MolGraph): number[][] {
  const adj = adjacency(g)
  const n = g.atoms.length
  const deg = adj.map((a) => a.length)
  const stripped = new Array<boolean>(n).fill(false)
  const leaves: number[] = []
  for (let i = 0; i < n; i++) if (deg[i] <= 1) leaves.push(i)
  while (leaves.length) {
    const v = leaves.pop() as number
    if (stripped[v]) continue
    stripped[v] = true
    for (const w of adj[v]) {
      if (stripped[w]) continue
      deg[w]--
      if (deg[w] <= 1) leaves.push(w)
    }
  }
  const inRingSystem = stripped.map((s) => !s)
  const seen = new Set<string>()
  const rings: number[][] = []
  for (const b of g.bonds) {
    if (!inRingSystem[b.a] || !inRingSystem[b.b]) continue
    const path = shortestPathAvoidingEdge(adj, b.a, b.b, b.a, b.b)
    if (!path || path.length < RING_MIN || path.length > RING_MAX) continue
    const key = [...path].sort((x, y) => x - y).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    rings.push(path)
  }
  return rings
}

/** Longest path in an acyclic component (double breadth-first search). */
function diameterPath(comp: number[], adj: number[][], n: number): number[] {
  const bfs = (start: number) => {
    const parent = new Array<number>(n).fill(-2)
    const depth = new Array<number>(n).fill(-1)
    parent[start] = -1
    depth[start] = 0
    const queue = [start]
    let far = start
    for (let h = 0; h < queue.length; h++) {
      const v = queue[h]
      if (depth[v] > depth[far]) far = v
      for (const w of adj[v]) {
        if (depth[w] !== -1) continue
        depth[w] = depth[v] + 1
        parent[w] = v
        queue.push(w)
      }
    }
    return { far, parent }
  }
  const first = bfs(comp[0]).far
  const second = bfs(first)
  const path: number[] = []
  for (let v = second.far; v !== -1; v = second.parent[v]) path.push(v)
  return path
}

/** Unit vector sum of the directions from `from` to each atom in `to`. */
function sumUnit(from: Point, to: Point[]): Point {
  let sx = 0
  let sy = 0
  for (const q of to) {
    const d = dist(from, q)
    if (d < 1e-9) continue
    sx += (q.x - from.x) / d
    sy += (q.y - from.y) / d
  }
  return { x: sx, y: sy }
}

/**
 * Lays out every atom of `g` in bond-length units. Atoms that already carry x and y keep them,
 * and the rest of their component is moved to meet them. Disconnected pieces sit side by side.
 */
export function layout2D(g: MolGraph): Point[] {
  const n = g.atoms.length
  const adj = adjacency(g)
  const rings = findRings(g)
  const pts: Point[] = new Array<Point>(n)
  const placed = new Array<boolean>(n).fill(false)
  const ringDone = rings.map(() => false)
  const ringCentre: Point[] = rings.map(() => ({ x: 0, y: 0 }))

  // Connected components
  const compOf = new Array<number>(n).fill(-1)
  const comps: number[][] = []
  for (let s = 0; s < n; s++) {
    if (compOf[s] !== -1) continue
    const members: number[] = []
    const queue = [s]
    compOf[s] = comps.length
    for (let h = 0; h < queue.length; h++) {
      const v = queue[h]
      members.push(v)
      for (const w of adj[v]) {
        if (compOf[w] !== -1) continue
        compOf[w] = comps.length
        queue.push(w)
      }
    }
    comps.push(members)
  }

  function layoutComponent(comp: number[]) {
    const inComp = new Set(comp)
    const order: number[] = []
    const place = (a: number, p: Point) => {
      pts[a] = p
      placed[a] = true
      order.push(a)
    }
    const compRings = rings
      .map((_, i) => i)
      .filter((i) => rings[i].every((a) => inComp.has(a)))

    if (compRings.length > 0) {
      // Root: the largest ring, centred on the origin with one vertex on the +x axis.
      const ri = compRings.reduce((best, i) => (rings[i].length > rings[best].length ? i : best), compRings[0])
      const ring = rings[ri]
      const R = 1 / (2 * Math.sin(Math.PI / ring.length))
      ring.forEach((a, j) => {
        const th = (TAU * j) / ring.length
        place(a, { x: R * Math.cos(th), y: R * Math.sin(th) })
      })
      ringDone[ri] = true
      ringCentre[ri] = { x: 0, y: 0 }
    } else {
      // Root: the longest chain as a horizontal zig-zag, bonds alternating at +30 and -30 degrees.
      const path = diameterPath(comp, adj, n)
      path.forEach((a, i) => {
        if (i === 0) {
          place(a, { x: 0, y: 0 })
          return
        }
        const prev = pts[path[i - 1]]
        // Two atoms lie on the x-axis; longer chains zig-zag at +30 and -30 degrees.
        const ang = path.length === 2 ? 0 : i % 2 === 1 ? Math.PI / 6 : -Math.PI / 6
        place(a, { x: prev.x + Math.cos(ang), y: prev.y + Math.sin(ang) })
      })
    }

    /** Angles of the candidate bond directions for one more substituent on atom p. */
    const candidateAngles = (p: number): number[] => {
      const nb = adj[p].filter((q) => placed[q]).map((q) => pts[q])
      const k = adj[p].filter((q) => !placed[q]).length
      if (nb.length === 0) return [0]
      if (nb.length === 1) {
        const back = Math.atan2(nb[0].y - pts[p].y, nb[0].x - pts[p].x)
        const cands = [back + (2 * Math.PI) / 3, back - (2 * Math.PI) / 3]
        if (k >= 3) cands.push(back + Math.PI)
        return cands
      }
      const s = sumUnit(pts[p], nb)
      let out: number
      if (Math.hypot(s.x, s.y) < 1e-6) {
        const first = nb[0]
        out = Math.atan2(first.y - pts[p].y, first.x - pts[p].x) + Math.PI / 2
      } else {
        out = Math.atan2(-s.y, -s.x)
      }
      if (k <= 1) return [out]
      if (k === 2) return [out + Math.PI / 3, out - Math.PI / 3]
      return [out, out + Math.PI / 2, out - Math.PI / 2]
    }

    const bestAngle = (p: number): number => {
      const cands = candidateAngles(p)
      let best = cands[0]
      let bestScore = -Infinity
      let bestSin = Infinity
      for (const th of cands) {
        const c = { x: pts[p].x + Math.cos(th), y: pts[p].y + Math.sin(th) }
        let minD = Infinity
        for (const a of comp) {
          if (!placed[a] || a === p) continue
          minD = Math.min(minD, dist(c, pts[a]))
        }
        const sinAbs = Math.abs(Math.sin(th))
        const better =
          minD > bestScore + 0.05 || (Math.abs(minD - bestScore) <= 0.05 && sinAbs < bestSin)
        if (better) {
          best = th
          bestScore = minD
          bestSin = sinAbs
        }
      }
      return best
    }

    const placeRingAnchored = (ri: number, a: number, dirAngle: number) => {
      const ring = rings[ri]
      const m = ring.length
      const R = 1 / (2 * Math.sin(Math.PI / m))
      const C = {
        x: pts[a].x + R * Math.cos(dirAngle),
        y: pts[a].y + R * Math.sin(dirAngle),
      }
      const thetaA = dirAngle + Math.PI
      const i0 = ring.indexOf(a)
      ring.forEach((b, j) => {
        if (placed[b]) return
        const k = (((j - i0) % m) + m) % m
        const th = thetaA + (k * TAU) / m
        place(b, { x: C.x + R * Math.cos(th), y: C.y + R * Math.sin(th) })
      })
      ringDone[ri] = true
      ringCentre[ri] = C
    }

    const placeRingFused = (ri: number, A: number, B: number) => {
      const ring = rings[ri]
      const m = ring.length
      const R = 1 / (2 * Math.sin(Math.PI / m))
      const apothem = 1 / (2 * Math.tan(Math.PI / m))
      const mid = { x: (pts[A].x + pts[B].x) / 2, y: (pts[A].y + pts[B].y) / 2 }
      const ex = pts[B].x - pts[A].x
      const ey = pts[B].y - pts[A].y
      const el = Math.hypot(ex, ey) || 1
      let nx = -ey / el
      let ny = ex / el
      let ref: Point | undefined
      for (let rj = 0; rj < rings.length; rj++) {
        if (ringDone[rj] && rings[rj].includes(A) && rings[rj].includes(B)) ref = ringCentre[rj]
      }
      if (!ref) {
        const placedHere = comp.filter((a) => placed[a])
        ref = {
          x: placedHere.reduce((s, a) => s + pts[a].x, 0) / placedHere.length,
          y: placedHere.reduce((s, a) => s + pts[a].y, 0) / placedHere.length,
        }
      }
      if ((ref.x - mid.x) * nx + (ref.y - mid.y) * ny > 0) {
        nx = -nx
        ny = -ny
      }
      const C = { x: mid.x + nx * apothem, y: mid.y + ny * apothem }
      const thetaA = Math.atan2(pts[A].y - C.y, pts[A].x - C.x)
      const thetaB = Math.atan2(pts[B].y - C.y, pts[B].x - C.x)
      const b = wrapAngle(thetaB - thetaA)
      const i0 = ring.indexOf(A)
      const eps = ring[(i0 + 1) % m] === B ? 1 : -1
      ring.forEach((c, j) => {
        if (placed[c]) return
        const k = ((((eps * (j - i0)) % m) + m) % m)
        const th = thetaA + k * b
        place(c, { x: C.x + R * Math.cos(th), y: C.y + R * Math.sin(th) })
      })
      ringDone[ri] = true
      ringCentre[ri] = C
    }

    const checkFused = () => {
      let changed = true
      while (changed) {
        changed = false
        for (let ri = 0; ri < rings.length; ri++) {
          if (ringDone[ri] || !rings[ri].some((a) => inComp.has(a))) continue
          const ring = rings[ri]
          if (ring.every((a) => placed[a])) {
            ringDone[ri] = true
            changed = true
            continue
          }
          for (let j = 0; j < ring.length; j++) {
            const A = ring[j]
            const B = ring[(j + 1) % ring.length]
            if (placed[A] && placed[B]) {
              placeRingFused(ri, A, B)
              changed = true
              break
            }
          }
        }
      }
    }

    checkFused()
    for (let qi = 0; qi < order.length; qi++) {
      const p = order[qi]
      for (const v of adj[p]) {
        if (placed[v]) continue
        const th = bestAngle(p)
        place(v, { x: pts[p].x + Math.cos(th), y: pts[p].y + Math.sin(th) })
        const fresh = rings
          .map((_, i) => i)
          .find((i) => !ringDone[i] && rings[i].includes(v) && rings[i].every((a) => a === v || !placed[a]))
        if (fresh !== undefined) placeRingAnchored(fresh, v, th)
        checkFused()
      }
    }
  }

  let shift = 0
  for (const comp of comps) {
    layoutComponent(comp)
    const xs = comp.map((a) => pts[a].x)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    for (const a of comp) pts[a] = { x: pts[a].x - minX + shift, y: pts[a].y }
    shift += maxX - minX + 2
  }

  // Respect given coordinates: translate each component to meet the first given atom in it.
  const given = g.atoms.map((a, i) => (a.x !== undefined && a.y !== undefined ? i : -1)).filter((i) => i >= 0)
  if (given.length > 0) {
    const f = given[0]
    const dx = (g.atoms[f].x as number) - pts[f].x
    const dy = (g.atoms[f].y as number) - pts[f].y
    for (let i = 0; i < n; i++) pts[i] = { x: pts[i].x + dx, y: pts[i].y + dy }
    for (const i of given) pts[i] = { x: g.atoms[i].x as number, y: g.atoms[i].y as number }
  }
  return pts
}

export function boundingBox(points: readonly Point[]): Box {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/**
 * Direction (radians, maths orientation) pointing away from an atom's bonds: the outward
 * bisector for atoms with bonds on one side, a perpendicular for straight arrangements.
 */
export function outwardAngle(points: readonly Point[], adj: readonly number[][], a: number): number {
  const nb = adj[a].map((q) => points[q])
  if (nb.length === 0) return Math.PI / 2
  const s = sumUnit(points[a], nb)
  if (Math.hypot(s.x, s.y) < 1e-6) {
    const first = nb[0]
    return Math.atan2(first.y - points[a].y, first.x - points[a].x) + Math.PI / 2
  }
  return Math.atan2(-s.y, -s.x)
}

/**
 * The direction around atom `a` that is furthest from every bond and from `extra` angles
 * (lone pairs, labels). Ties go to the outward direction, so labels sit away from the molecule.
 */
export function freeAngle(
  points: readonly Point[],
  adj: readonly number[][],
  a: number,
  extra: readonly number[] = []
): number {
  const taken = [
    ...adj[a].map((q) => Math.atan2(points[q].y - points[a].y, points[q].x - points[a].x)),
    ...extra,
  ]
  const out = outwardAngle(points, adj, a)
  let best = out
  let bestSep = -1
  for (let i = 0; i < 72; i++) {
    const th = (i * TAU) / 72
    let sep = Math.PI
    for (const t of taken) sep = Math.min(sep, Math.abs(wrapAngle(th - t)))
    const score = sep - 0.02 * Math.abs(wrapAngle(th - out))
    if (score > bestSep) {
      bestSep = score
      best = th
    }
  }
  return best
}

/** The longest chain of atoms in a molecule's first connected component (for condensed formulas). */
export function longestChain(g: MolGraph): number[] {
  const n = g.atoms.length
  if (n === 0) return []
  const adj = adjacency(g)
  const seen = new Array<boolean>(n).fill(false)
  const comp: number[] = []
  const queue = [0]
  seen[0] = true
  for (let h = 0; h < queue.length; h++) {
    const v = queue[h]
    comp.push(v)
    for (const w of adj[v]) {
      if (seen[w]) continue
      seen[w] = true
      queue.push(w)
    }
  }
  return diameterPath(comp, adj, n)
}
