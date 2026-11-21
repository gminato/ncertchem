/**
 * Pure helpers for the electrochemistry drawing set. No React here, so every
 * rule (needle angles, flow positions, bridge curves) can be unit tested.
 */

export type Point = { x: number; y: number }
export type Placed = Point & { angle: number }
export type FlowDirection = 'forward' | 'reverse'

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const clamp01 = (v: number) => clamp(v, 0, 1)

/** Fractional part in [0, 1). Used for looping animation phases. */
export const frac = (v: number) => v - Math.floor(v)

/** Deterministic pseudo-random value in [0, 1) from an integer seed. Never Math.random. */
export function hash01(seed: number): number {
  return frac(Math.sin(seed * 12.9898 + 78.233) * 43758.5453)
}

/**
 * Needle angle in degrees, measured from vertical (0 = straight up), for a
 * value on a scale. The range maps linearly onto ±span/2 and the value is clamped.
 */
export function needleAngle(value: number, range: readonly [number, number], span = 240): number {
  const [lo, hi] = range
  if (hi === lo) return -span / 2
  const f = clamp01((value - lo) / (hi - lo))
  return -span / 2 + f * span
}

/** Maps a charge such as "2+" or "-" (or "2\u2212") to superscript Unicode, e.g. "²⁺" or "⁻". */
const SUPER: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻',
}
export function superscriptCharge(charge: string): string {
  return Array.from(charge.replace('−', '-'))
    .map((c) => SUPER[c] ?? c)
    .join('')
}

/** Splits a formula such as "SO4" into [{text:'SO'}, {text:'4', sub:true}] for Sub tspans. */
export function formulaRuns(formula: string): { text: string; sub: boolean }[] {
  const runs: { text: string; sub: boolean }[] = []
  for (const part of formula.match(/\d+|\D+/g) ?? []) {
    runs.push({ text: part, sub: /^\d+$/.test(part) })
  }
  return runs
}

/** Point on a cubic Bezier at parameter t. */
function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

/**
 * The inverted-U salt bridge from a to b, arching up so its highest point is `apex`
 * (a smaller y). It returns the SVG path and a sampled polyline for moving ions.
 */
export function bridgeCurve(a: Point, b: Point, apex: number, samples = 64) {
  const mid = 0.125 * (a.y + b.y)
  const cy = (apex - mid) / 0.75
  const c1 = { x: a.x, y: cy }
  const c2 = { x: b.x, y: cy }
  const pts: Point[] = []
  for (let i = 0; i <= samples; i++) pts.push(cubic(a, c1, c2, b, i / samples))
  const d = `M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`
  return { d, points: pts }
}

/** Cumulative-length polyline helpers. */
function segmentLengths(points: readonly Point[]): number[] {
  const acc = [0]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    acc.push(acc[i - 1] + Math.hypot(dx, dy))
  }
  return acc
}

/** Position and heading at fraction f (0..1 by arc length) along a polyline. */
export function pointAlong(points: readonly Point[], f: number): Placed {
  if (points.length === 0) return { x: 0, y: 0, angle: 0 }
  if (points.length === 1) return { ...points[0], angle: 0 }
  const acc = segmentLengths(points)
  const total = acc[acc.length - 1] || 1
  const target = clamp01(f) * total
  let i = 1
  while (i < points.length - 1 && acc[i] < target) i++
  const a = points[i - 1]
  const b = points[i]
  const segLen = acc[i] - acc[i - 1] || 1
  const k = clamp01((target - acc[i - 1]) / segLen)
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle }
}

/**
 * Arc-length fractions of `count` evenly spaced dots moving along a path. `t` is the
 * loop phase (0..1, wraps). Forward runs points[0] to the last point; reverse is the opposite.
 */
export function flowFractions(count: number, t: number, direction: FlowDirection = 'forward'): number[] {
  const out: number[] = []
  for (let k = 0; k < count; k++) {
    const f = frac(t + k / count)
    out.push(direction === 'forward' ? f : 1 - f)
  }
  return out
}

/**
 * Ion drift along a sampled curve. `towardEnd` true moves the ion from the start of
 * the curve to its end. Each ion has its own phase offset so the stream looks continuous.
 */
export function driftAlong(points: readonly Point[], count: number, t: number, towardEnd: boolean): Placed[] {
  return flowFractions(count, t, towardEnd ? 'forward' : 'reverse').map((f) => pointAlong(points, f))
}
