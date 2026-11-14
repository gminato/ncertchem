/**
 * Deterministic scatter of particles inside a rectangle, for the particle boxes
 * in the Unit 1 animations. Points are placed by rejection sampling with a
 * fixed seed, so every visit draws the same picture and no two particles overlap.
 */

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** The small PRNG used for layouts (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Places `count` points inside `rect` with centre-to-centre distance at least
 * `minDist`. Starts from existing `points`, so several groups can share a box.
 *
 * @throws {RangeError} If the points cannot all be placed in the attempts allowed
 */
export function scatter(
  seed: number,
  count: number,
  rect: Rect,
  minDist: number,
  existing: readonly Point[] = []
): Point[] {
  const random = seededRandom(seed)
  const placed: Point[] = [...existing]
  const out: Point[] = []
  const maxAttempts = 4000
  for (let i = 0; i < count; i++) {
    let found: Point | null = null
    for (let attempt = 0; attempt < maxAttempts && !found; attempt++) {
      const candidate = {
        x: rect.x0 + random() * (rect.x1 - rect.x0),
        y: rect.y0 + random() * (rect.y1 - rect.y0),
      }
      const clear = placed.every((p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) >= minDist)
      if (clear) found = candidate
    }
    if (!found) {
      throw new RangeError(`Could not place ${count} points at distance ${minDist} in the rectangle`)
    }
    placed.push(found)
    out.push(found)
  }
  return out
}
