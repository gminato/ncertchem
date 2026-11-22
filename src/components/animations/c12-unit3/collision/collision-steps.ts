import { fractionAboveEa, formatSci, kJPerMolToJPerMol, mulberry32 } from '@/lib/chem/kinetics'

/**
 * Deterministic scene maths for Section 3.5 (Collision Theory). Every number shown to the
 * student comes from the kinetics lib. Each Step is a pure function of its index and the
 * ambient clock `t`, so reduced motion (t = 0) freezes a frame that already shows the Step's idea.
 */

export const T_K = 300
export const EA_LOW_KJ = 10
export const EA_HIGH_KJ = 50
export const P_STERIC = 0.25

/** e^(−Eₐ/RT) at 300 K for Eₐ = 10 kJ mol⁻¹ (NCERT's e^(−Eₐ/RT) fraction, from fractionAboveEa). */
export const FRACTION_LOW = fractionAboveEa(kJPerMolToJPerMol(EA_LOW_KJ), T_K)
/** The same fraction for Eₐ = 50 kJ mol⁻¹. */
export const FRACTION_HIGH = fractionAboveEa(kJPerMolToJPerMol(EA_HIGH_KJ), T_K)
/** P · e^(−Eₐ/RT) for the orientation example: the share of collisions that are effective. */
export const EFFECTIVE_FRACTION = P_STERIC * FRACTION_LOW

/** One collision in this many is energetic at 10 kJ mol⁻¹ (1 / 0.0181 ≈ 55). */
export const ONE_IN_ENERGETIC = Math.round(1 / FRACTION_LOW)

export const TEXT_LOW = formatSci(FRACTION_LOW, 3)
export const TEXT_HIGH = formatSci(FRACTION_HIGH, 3)
export const TEXT_EFFECTIVE = formatSci(EFFECTIVE_FRACTION, 3)

export interface Point {
  readonly x: number
  readonly y: number
}

export interface Bounds {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

/** Seeded, well-spaced home positions for particles inside `b` (rejection sampling). */
export function particleHomes(seed: number, n: number, b: Bounds, minDist: number): Point[] {
  const rng = mulberry32(seed)
  const out: Point[] = []
  for (let guard = 0; out.length < n && guard < 20000; guard++) {
    const p = { x: b.x0 + rng() * (b.x1 - b.x0), y: b.y0 + rng() * (b.y1 - b.y0) }
    if (out.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= minDist)) out.push(p)
  }
  if (out.length < n) throw new Error(`Could not place ${n} particles with spacing ${minDist}`)
  return out
}

/** Gentle, periodic drift around a home position. Deterministic in (i, t). */
export function drift(home: Point, i: number, t: number, amp = 12): Point {
  const wx = 0.7 + ((i * 37) % 11) * 0.09
  const wy = 0.6 + ((i * 53) % 13) * 0.08
  return { x: home.x + amp * Math.sin(wx * t + i), y: home.y + amp * Math.cos(wy * t + 2 * i) }
}

/** Index pairs of the closest homes, nearest first, each particle used at most once. */
export function closestPairs(points: readonly Point[], count: number): Array<[number, number]> {
  const all: Array<{ i: number; j: number; d: number }> = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      all.push({ i, j, d: Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) })
    }
  }
  all.sort((a, b) => a.d - b.d)
  const used = new Set<number>()
  const out: Array<[number, number]> = []
  for (const p of all) {
    if (out.length >= count) break
    if (used.has(p.i) || used.has(p.j)) continue
    used.add(p.i)
    used.add(p.j)
    out.push([p.i, p.j])
  }
  return out
}

/** Flash brightness in [0.3, 1]; each flash has its own phase. */
export function flashOpacity(k: number, t: number): number {
  return 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(1.3 * t + k * 1.7))
}

/** Approach phase in [0, 1]: 1 at contact (t = 0), 0 when the ion is furthest away. */
export function approachPhase(t: number): number {
  return 0.5 + 0.5 * Math.cos(0.9 * t)
}
