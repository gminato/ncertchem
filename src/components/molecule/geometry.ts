/**
 * Pure geometry for the molecule and orbital drawings. Nothing here touches the
 * DOM or three.js, so every helper can be unit tested in Node.
 */

export type Vec3 = [number, number, number]

export interface Vec2 {
  x: number
  y: number
}

const DEG = Math.PI / 180
const WORLD_AXES: readonly Vec3[] = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
]

export function add3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export function len3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2])
}

/** Unit vector in the same direction. A zero vector stays zero. */
export function norm3(a: Vec3): Vec3 {
  const l = len3(a)
  return l > 0 ? scale3(a, 1 / l) : [0, 0, 0]
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Angle between two vectors, in degrees. */
export function angleBetween3(a: Vec3, b: Vec3): number {
  const denom = len3(a) * len3(b)
  if (denom === 0) return 0
  const cos = Math.max(-1, Math.min(1, dot3(a, b) / denom))
  return Math.acos(cos) / DEG
}

/**
 * A unit vector perpendicular to `dir`, lying in the plane whose normal is
 * `normal`. Deterministic: when `dir` is parallel to `normal`, the first world
 * axis that works is used instead.
 */
export function perpendicularTo(dir: Vec3, normal: Vec3 = [0, 0, 1]): Vec3 {
  for (const ref of [normal, ...WORLD_AXES]) {
    const c = cross3(ref, dir)
    if (len3(c) > 1e-6) return norm3(c)
  }
  return [1, 0, 0]
}

/** One drawn stick of a bond. Multiple bonds are several sticks offset in one plane. */
export interface BondStick {
  from: Vec3
  to: Vec3
  dashed: boolean
}

export interface BondSticksOptions {
  /** Distance between neighbouring sticks, in scene units. */
  spacing?: number
  /** Normal of the plane the parallel sticks lie in. Default: the xy plane. */
  planeNormal?: Vec3
}

/**
 * The sticks that draw one bond. A single bond is one stick. A double bond is
 * two sticks at ±spacing/2 in the plane, and a triple bond adds a central one.
 * A 1.5 bond (delocalised, as in ozone or benzene) is one solid stick and one
 * dashed stick, so the solid one is offset to the +side.
 */
export function bondSticks(
  a: Vec3,
  b: Vec3,
  order: 1 | 1.5 | 2 | 3,
  { spacing = 0.12, planeNormal = [0, 0, 1] }: BondSticksOptions = {}
): BondStick[] {
  const off = scale3(perpendicularTo(sub3(b, a), planeNormal), spacing)
  const at = (k: number, dashed = false): BondStick => ({
    from: add3(a, scale3(off, k)),
    to: add3(b, scale3(off, k)),
    dashed,
  })
  switch (order) {
    case 1:
      return [at(0)]
    case 2:
      return [at(-0.5), at(0.5)]
    case 3:
      return [at(-1), at(0), at(1)]
    case 1.5:
      return [at(0.5), at(-0.5, true)]
  }
}

/** Angle between two directions on a circle, in degrees, always in [0, 180]. */
export function angleSeparation(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360
  return Math.min(d, 360 - d)
}

/** Normalises an angle in degrees to (-180, 180]. */
export function normaliseAngle(deg: number): number {
  const d = (((deg + 180) % 360) + 360) % 360
  return d === 0 ? 180 : d - 180
}

/** Direction of a 2D vector in degrees, SVG convention (0 right, -90 up). */
export function directionDeg(dx: number, dy: number): number {
  return Math.atan2(dy, dx) / DEG
}

const CANDIDATE_STEP = 5
const CANDIDATES: number[] = Array.from({ length: 360 / CANDIDATE_STEP }, (_, k) =>
  normaliseAngle(-90 + k * CANDIDATE_STEP)
)

/** Repulsion between directions: close pairs cost much more than distant ones. */
function repulsion(directions: readonly number[]): number {
  let e = 0
  for (let i = 0; i < directions.length; i++) {
    for (let j = i + 1; j < directions.length; j++) {
      const sep = Math.max(angleSeparation(directions[i], directions[j]), 1) * DEG
      e += 1 / (sep * sep)
    }
  }
  return e
}

/**
 * Directions for `count` lone pairs (or unpaired dots) around an atom, away from
 * the bonds that are already there. The directions spread as evenly as possible,
 * so a bent atom gets its lone pairs on the open side of the bonds. Exhaustive
 * search for up to three new directions, greedy beyond that. Deterministic.
 */
export function freeDirections(occupiedDeg: readonly number[], count: number): number[] {
  if (count <= 0) return []
  if (count <= 3) {
    let best: number[] = []
    let bestE = Infinity
    const pick = (start: number, chosen: number[]) => {
      if (chosen.length === count) {
        const e = repulsion([...occupiedDeg, ...chosen])
        if (e < bestE - 1e-12) {
          bestE = e
          best = [...chosen]
        }
        return
      }
      for (let i = start; i < CANDIDATES.length; i++) pick(i + 1, [...chosen, CANDIDATES[i]])
    }
    pick(0, [])
    return best
  }

  const chosen: number[] = []
  for (let n = 0; n < count; n++) {
    let bestCandidate = CANDIDATES[0]
    let bestE = Infinity
    for (const c of CANDIDATES) {
      if (chosen.includes(c)) continue
      const e = repulsion([...occupiedDeg, ...chosen, c])
      if (e < bestE - 1e-12) {
        bestE = e
        bestCandidate = c
      }
    }
    chosen.push(bestCandidate)
  }
  return chosen
}

/** Camera basis for an orthographic projection looking from `position` at `target`. */
export interface CameraBasis {
  right: Vec3
  up: Vec3
  forward: Vec3
}

export function cameraBasis(position: Vec3, target: Vec3 = [0, 0, 0]): CameraBasis {
  const forward = norm3(sub3(target, position))
  let right = norm3(cross3(forward, [0, 1, 0]))
  if (len3(right) === 0) right = [1, 0, 0]
  const up = norm3(cross3(right, forward))
  return { right, up, forward }
}

/** Screen position of a point under an orthographic camera. SVG y grows downward. */
export function projectOrthographic(p: Vec3, basis: CameraBasis): Vec2 {
  return { x: dot3(p, basis.right), y: -dot3(p, basis.up) }
}

/** Depth along the view direction: larger values are further from the viewer. */
export function depthOf(p: Vec3, basis: CameraBasis): number {
  return dot3(p, basis.forward)
}

/** Scale and offset that fit points into a box, keeping their aspect ratio. */
export function fitToBox(
  points: readonly Vec2[],
  width: number,
  height: number,
  padding = 0
): { scale: number; tx: number; ty: number } {
  if (points.length === 0) return { scale: 1, tx: width / 2, ty: height / 2 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = Math.max(maxX - minX, 1e-6)
  const spanY = Math.max(maxY - minY, 1e-6)
  const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return { scale, tx: width / 2 - cx * scale, ty: height / 2 - cy * scale }
}

/**
 * Points on the arc that shows the angle a-centre-b, sweeping from a to b on a
 * sphere of the given radius around `centre`. The arc lies in the plane of the
 * three atoms.
 */
export function angleArcPoints(
  centre: Vec3,
  a: Vec3,
  b: Vec3,
  radius: number,
  segments = 24
): Vec3[] {
  const u = norm3(sub3(a, centre))
  const v = norm3(sub3(b, centre))
  const theta = Math.acos(Math.max(-1, Math.min(1, dot3(u, v))))
  if (theta < 1e-6) return [add3(centre, scale3(u, radius))]
  const sin = Math.sin(theta)
  const pts: Vec3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const s1 = Math.sin((1 - t) * theta) / sin
    const s2 = Math.sin(t * theta) / sin
    pts.push(add3(centre, scale3(add3(scale3(u, s1), scale3(v, s2)), radius)))
  }
  return pts
}

/** Where to put the angle's label: outside the arc, on its bisector. */
export function angleLabelPoint(centre: Vec3, a: Vec3, b: Vec3, radius: number, outset = 0.3): Vec3 {
  const bisector = norm3(add3(norm3(sub3(a, centre)), norm3(sub3(b, centre))))
  return add3(centre, scale3(bisector, radius + outset))
}

/** Linear interpolation between two sets of positions (same order), for tweened poses. */
export function interpolatePositions(from: readonly Vec3[], to: readonly Vec3[], t: number): Vec3[] {
  const k = Math.max(0, Math.min(1, t))
  return from.map((p, i) => lerp3(p, to[i] ?? p, k))
}

/**
 * Outline of the overlap of two discs, as a closed polygon, or null if they do
 * not overlap. When one disc sits inside the other, the smaller disc is the
 * overlap. The polygon is sampled, which is smooth enough at drawing sizes.
 */
export function lensPolygon(
  c1: Vec2,
  r1: number,
  c2: Vec2,
  r2: number,
  segments = 36
): Vec2[] | null {
  const dx = c2.x - c1.x
  const dy = c2.y - c1.y
  const d = Math.hypot(dx, dy)
  if (d >= r1 + r2) return null
  if (d <= Math.abs(r1 - r2)) {
    const small = r1 < r2 ? c1 : c2
    const r = Math.min(r1, r2)
    return Array.from({ length: segments }, (_, i) => {
      const phi = (2 * Math.PI * i) / segments
      return { x: small.x + r * Math.cos(phi), y: small.y + r * Math.sin(phi) }
    })
  }
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const phi0 = Math.atan2(dy, dx)
  const theta1 = Math.acos(Math.max(-1, Math.min(1, a / r1)))
  const theta2 = Math.acos(Math.max(-1, Math.min(1, (d - a) / r2)))
  const phi0Back = phi0 + Math.PI

  const pts: Vec2[] = []
  for (let i = 0; i <= segments; i++) {
    const phi = phi0 - theta1 + (2 * theta1 * i) / segments
    pts.push({ x: c1.x + r1 * Math.cos(phi), y: c1.y + r1 * Math.sin(phi) })
  }
  for (let i = 0; i <= segments; i++) {
    const phi = phi0Back - theta2 + (2 * theta2 * i) / segments
    pts.push({ x: c2.x + r2 * Math.cos(phi), y: c2.y + r2 * Math.sin(phi) })
  }
  return pts
}

/** An SVG path for a closed polygon. */
export function polygonPath(points: readonly Vec2[]): string {
  return (
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
    ' Z'
  )
}
