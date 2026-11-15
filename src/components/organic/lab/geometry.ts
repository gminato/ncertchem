/**
 * Pure helpers for the Unit 8 organic laboratory apparatus.
 * Nothing here touches the DOM, so every function can be checked with unit tests.
 */

export interface Point {
  x: number
  y: number
}

/** Clamps value to [0, 1]. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Smooth start and stop between 0 and 1. */
export function smoothstep(v: number): number {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

/** Small seeded generator (mulberry32). Same seed gives the same drawing every time. */
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

// ---------------------------------------------------------------------------
// Liquid levels and paths
// ---------------------------------------------------------------------------

/** y coordinate of a liquid surface. `level` 0 is empty (at `bottom`), 1 is full (at `top`). */
export function liquidSurfaceY(level: number, top: number, bottom: number): number {
  return bottom - clamp01(level) * (bottom - top)
}

/** Closed rectangle path for a liquid filling a box from the bottom up to `level`. */
export function liquidRectPath(level: number, x0: number, x1: number, top: number, bottom: number): string {
  const y = liquidSurfaceY(level, top, bottom)
  return `M${x0},${y} H${x1} V${bottom} H${x0} Z`
}

/** Open path for the meniscus line (the liquid surface) across a box. */
export function liquidSurfacePath(level: number, x0: number, x1: number, top: number, bottom: number): string {
  const y = liquidSurfaceY(level, top, bottom)
  return `M${x0},${y} H${x1}`
}

/**
 * A band of liquid between two levels (for a layer that drains or sits between two others).
 * `from` and `to` are fractions of the box height, measured from the bottom.
 */
export function liquidBandPath(from: number, to: number, x0: number, x1: number, top: number, bottom: number): string {
  const yTo = liquidSurfaceY(to, top, bottom)
  const yFrom = liquidSurfaceY(from, top, bottom)
  return `M${x0},${yTo} H${x1} V${yFrom} H${x0} Z`
}

// ---------------------------------------------------------------------------
// Chromatography
// ---------------------------------------------------------------------------

/** Rf = distance moved by the spot / distance moved by the solvent front. */
export function rfFromDistances(spotDistance: number, frontDistance: number): number {
  if (frontDistance <= 0) return 0
  return spotDistance / frontDistance
}

/**
 * y of a spot on a plate. The spot has moved Rf times the solvent distance, and the
 * solvent has moved `progress` of the way up `solventPx`. Plates grow upwards, so y falls.
 */
export function spotY(baselineY: number, rf: number, progress: number, solventPx: number): number {
  return baselineY - clamp01(rf) * clamp01(progress) * solventPx
}

/** y of the solvent front at a given progress. */
export function frontY(baselineY: number, progress: number, solventPx: number): number {
  return baselineY - clamp01(progress) * solventPx
}

// ---------------------------------------------------------------------------
// Separating funnel
// ---------------------------------------------------------------------------

export interface DensityLayer {
  id: string
  density: number
}

/**
 * Ids of the layers from top to bottom. The less dense liquid floats on top.
 * Ties keep their input order.
 */
export function layerOrder<T extends DensityLayer>(layers: readonly T[]): T[] {
  return layers
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => a.layer.density - b.layer.density || a.index - b.index)
    .map((entry) => entry.layer)
}

/**
 * Fraction of solute in the top (organic) phase after `extractions` washes, each with the
 * same volume of fresh solvent. K is the partition ratio [solute]top / [solute]bottom.
 * Each wash leaves a fraction Va / (Va + K·Vo) behind in the aqueous phase.
 */
export function partitionTopFraction(K: number, Va: number, Vo: number, extractions: number): number {
  if (extractions <= 0) return 0
  const remain = Va / (Va + K * Vo)
  return 1 - remain ** extractions
}

/** Mixing amount of the layers during a shake: 0 at rest, 1 mid-shake, 0 once settled. */
export function mixAmount(shake: number): number {
  return Math.sin(Math.PI * clamp01(shake))
}

/** How far the solute has partitioned while shaking. It is complete only once settled. */
export function partitionProgress(shake: number): number {
  return smoothstep((clamp01(shake) - 0.4) / 0.6)
}

// ---------------------------------------------------------------------------
// Particles and counts
// ---------------------------------------------------------------------------

/** Splits a particle count between two regions. Rounds so the two always add up to `count`. */
export function splitCount(count: number, topFraction: number): { top: number; bottom: number } {
  const top = Math.round(count * clamp01(topFraction))
  return { top, bottom: count - top }
}

/**
 * y of a band moving down a column. `arrival` is the progress at which the band reaches the
 * bottom (a faster band has the smaller arrival value).
 */
export function bandY(startY: number, endY: number, arrival: number, progress: number): number {
  return startY + clamp01(progress / Math.max(arrival, 1e-6)) * (endY - startY)
}

/** How full a receiver tube is: it starts filling a little after its band arrives, and fills over 0.25 of progress. */
export function collectedFraction(arrival: number, progress: number): number {
  return clamp01((clamp01(progress) - arrival) / 0.25)
}

/** Width of a funnel at a given y, for a cone from y0 (half width w0) to y1 (half width w1). */
export function coneHalfWidth(y: number, y0: number, w0: number, y1: number, w1: number): number {
  const t = clamp01((y - y0) / (y1 - y0))
  return w0 + (w1 - w0) * t
}
