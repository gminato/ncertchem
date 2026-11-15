/**
 * Pure interpolation for the complete-to-bond-line morph (Unit 8). Positions move with a
 * smoothstep so the motion starts and ends gently; hydrogens fade out as they fold into their
 * carbon or heteroatom.
 */
import type { Point } from './layout'

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/** Smoothstep easing: 0 at 0, 1 at 1, zero slope at both ends. */
export function ease(t: number): number {
  const u = clamp01(t)
  return u * u * (3 - 2 * u)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPoint(p: Point, q: Point, t: number): Point {
  return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) }
}

export function lerpPoints(a: readonly Point[], b: readonly Point[], t: number): Point[] {
  if (a.length !== b.length) throw new Error('lerpPoints: length mismatch')
  return a.map((p, i) => lerpPoint(p, b[i], t))
}

/** Opacity of a hydrogen (or a carbon letter) that folds away: 1 at the start, 0 at the end. */
export function foldOpacity(t: number): number {
  return 1 - ease(t)
}

/** Opacity of the bond-line label that fades in as the morph completes. */
export function revealOpacity(t: number): number {
  return ease(t)
}
