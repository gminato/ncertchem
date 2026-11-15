/**
 * Pure geometry and data helpers for the thermodynamics visuals. Nothing here
 * touches the DOM, so every rule (isotherm, work sign, level layout, particle
 * positions, Gibbs crossover) can be tested directly.
 *
 * Units: pressure in atm, volume in L, energy in kJ mol⁻¹, entropy in J K⁻¹ mol⁻¹,
 * temperature in K. Work in L atm is converted to joules with `LATM_IN_JOULES`.
 */

import { ladderY } from '../vocab/ladder'
import { ladderLabels, type LadderLabel } from '../vocab/placement'

/** 1 L atm expressed in joules. */
export const LATM_IN_JOULES = 101.325

/** Clamps to [0, 1]. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** A point on a p–V diagram. */
export interface PVPoint {
  /** Volume in L. */
  v: number
  /** Pressure in atm. */
  p: number
}

/** Pressure on the isotherm p = nRT / V. `nRT` is in L atm. */
export function isothermPressure(nRT: number, v: number): number {
  return nRT / v
}

/** Samples the isotherm between `v1` and `v2` (inclusive) at `samples + 1` evenly spaced volumes. */
export function isothermPoints(nRT: number, v1: number, v2: number, samples = 96): PVPoint[] {
  const pts: PVPoint[] = []
  for (let i = 0; i <= samples; i++) {
    const v = v1 + ((v2 - v1) * i) / samples
    pts.push({ v, p: isothermPressure(nRT, v) })
  }
  return pts
}

/**
 * Corner points of an n-step expansion from `v1` to `v2` along the isotherm. Each
 * step is a drop at constant volume followed by a horizontal run at constant
 * external pressure (the pressure at the end of that step), which is the classic
 * staircase drawn under the reversible curve. Volumes are evenly spaced.
 */
export function manyStepPoints(nRT: number, v1: number, v2: number, steps: number): PVPoint[] {
  const n = Math.max(1, Math.round(steps))
  const volumes = Array.from({ length: n + 1 }, (_, k) => v1 + ((v2 - v1) * k) / n)
  const pts: PVPoint[] = [{ v: v1, p: isothermPressure(nRT, v1) }]
  for (let k = 1; k <= n; k++) {
    const pEnd = isothermPressure(nRT, volumes[k])
    pts.push({ v: volumes[k - 1], p: pEnd })
    pts.push({ v: volumes[k], p: pEnd })
  }
  return pts
}

/**
 * Corner points of a single irreversible step: the gas drops to the external
 * pressure `pExt` at its start volume, then expands against it to `v2`.
 */
export function oneStepPoints(p1: number, v1: number, v2: number, pExt: number): PVPoint[] {
  return [
    { v: v1, p: p1 },
    { v: v1, p: pExt },
    { v: v2, p: pExt },
  ]
}

/**
 * Work done on the system, in L atm, from ∫p dV along a path. The sign follows
 * the IUPAC convention: expansion (V grows) gives a negative w. Each segment is
 * integrated with the trapezoid rule, which is exact for constant-pressure steps
 * and for straight segments.
 */
export function pathWork(points: readonly PVPoint[]): number {
  let integral = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    integral += ((b.v - a.v) * (a.p + b.p)) / 2
  }
  return -integral
}

/**
 * The closed polygon between a path and the volume axis (p = 0). Drawing it
 * shows the work area; its size is |w|.
 */
export function workAreaPolygon(points: readonly PVPoint[]): PVPoint[] {
  if (points.length === 0) return []
  const first = points[0]
  const last = points[points.length - 1]
  return [...points, { v: last.v, p: 0 }, { v: first.v, p: 0 }]
}

/** Converts a work value in L atm to kJ, for readouts. */
export function latmToKilojoules(latm: number): number {
  return (latm * LATM_IN_JOULES) / 1000
}

/**
 * Height of the gas column for a piston volume fraction (0 to 1 of travel).
 * The gas never shrinks below `minFraction` of the cylinder, so it stays visible.
 */
export function pistonGasFraction(volume: number, minFraction = 0.2): number {
  return minFraction + (1 - minFraction) * clamp01(volume)
}

/**
 * Maps a temperature to the 0 to 1 scale used for gas tint and the thermometer.
 * Values outside [tMin, tMax] are clamped.
 */
export function temperatureLevel(kelvin: number, tMin = 250, tMax = 600): number {
  if (tMax === tMin) return 0
  return clamp01((kelvin - tMin) / (tMax - tMin))
}

/** Thermometer level for a temperature rise, as a fraction of the scale maximum. */
export function thermometerLevel(tempRise: number, scaleMax: number): number {
  if (scaleMax <= 0) return 0
  return clamp01(tempRise / scaleMax)
}

/* ------------------------------------------------------------------ */
/* Enthalpy levels                                                      */
/* ------------------------------------------------------------------ */

export interface EnthalpyScale {
  /** SVG y of the highest level (top of the plot). */
  top: number
  /** SVG y of the lowest level (bottom of the plot). */
  bottom: number
  /** Enthalpy mapped to `bottom`. */
  hMin: number
  /** Enthalpy mapped to `top`. */
  hMax: number
}

/** SVG y for an enthalpy, in kJ mol⁻¹. Higher enthalpy is drawn higher. */
export function enthalpyY(h: number, scale: EnthalpyScale): number {
  return ladderY(h, { top: scale.top, bottom: scale.bottom, eMin: scale.hMin, eMax: scale.hMax })
}

/**
 * Lays out the horizontal levels of an enthalpy diagram and the labels that sit
 * beside them. Labels closer than `minGap` are pushed apart and flagged `nudged`,
 * so the caller can draw a leader line. The result follows the input order.
 */
export function enthalpyLevelLayout(
  levels: readonly number[],
  scale: EnthalpyScale,
  minGap: number
): { rungY: number[]; labels: LadderLabel[] } {
  const rungY = levels.map((h) => enthalpyY(h, scale))
  const labels = ladderLabels(
    rungY.map((y) => ({ y })),
    minGap
  )
  return { rungY, labels }
}

/* ------------------------------------------------------------------ */
/* Deterministic particle positions                                     */
/* ------------------------------------------------------------------ */

export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Point {
  x: number
  y: number
}

/** A small, fast, seeded PRNG (mulberry32). The same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniformly scattered points in `box`, for a gas. Deterministic for a given seed. */
export function scatterField(count: number, box: Box, seed: number): Point[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, () => ({
    x: box.x0 + rand() * (box.x1 - box.x0),
    y: box.y0 + rand() * (box.y1 - box.y0),
  }))
}

/**
 * Points scattered in `box` with no two closer than `minDist`, so particles never
 * overlap. Deterministic for a given seed. If the box cannot hold `count` points at
 * that spacing, the remainder is placed without the spacing rule so the count holds.
 */
export function spacedScatter(count: number, box: Box, seed: number, minDist: number): Point[] {
  const rand = mulberry32(seed)
  const pts: Point[] = []
  const min2 = minDist * minDist
  const randomPoint = (): Point => ({
    x: box.x0 + rand() * (box.x1 - box.x0),
    y: box.y0 + rand() * (box.y1 - box.y0),
  })
  for (let attempt = 0; pts.length < count && attempt < count * 400; attempt++) {
    const p = randomPoint()
    if (pts.every((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 >= min2)) pts.push(p)
  }
  while (pts.length < count) pts.push(randomPoint())
  return pts
}

/**
 * A regular lattice of `cols` × `rows` points spanning `box`, each nudged by at
 * most `jitter` (a fraction of the cell size) from its site. Used for solids.
 */
export function latticeField(
  cols: number,
  rows: number,
  box: Box,
  jitter: number,
  seed: number
): Point[] {
  const rand = mulberry32(seed)
  const cellW = (box.x1 - box.x0) / cols
  const cellH = (box.y1 - box.y0) / rows
  const pts: Point[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = box.x0 + (c + 0.5) * cellW
      const cy = box.y0 + (r + 0.5) * cellH
      pts.push({
        x: cx + (rand() - 0.5) * 2 * jitter * cellW,
        y: cy + (rand() - 0.5) * 2 * jitter * cellH,
      })
    }
  }
  return pts
}

/* ------------------------------------------------------------------ */
/* Gibbs energy                                                         */
/* ------------------------------------------------------------------ */

/** ΔG = ΔH − TΔS, with ΔH in kJ mol⁻¹, ΔS in J K⁻¹ mol⁻¹ and T in K. Result in kJ mol⁻¹. */
export function gibbsEnergy(dH: number, dS: number, t: number): number {
  return dH - (t * dS) / 1000
}

/** The four sign cases of ΔH and ΔS. */
export type GibbsCase =
  /** ΔH < 0, ΔS > 0: spontaneous at every temperature. */
  | 'always'
  /** ΔH > 0, ΔS < 0: non-spontaneous at every temperature. */
  | 'never'
  /** ΔH < 0, ΔS < 0: spontaneous only below the crossover. */
  | 'low-T'
  /** ΔH > 0, ΔS > 0: spontaneous only above the crossover. */
  | 'high-T'

/** Classifies a reaction by the signs of ΔH and ΔS. A zero ΔS is treated as the ΔH sign. */
export function gibbsCase(dH: number, dS: number): GibbsCase {
  if (dS === 0) return dH < 0 ? 'always' : 'never'
  if (dH < 0) return dS > 0 ? 'always' : 'low-T'
  return dS < 0 ? 'never' : 'high-T'
}

/**
 * The temperature where ΔG = 0, in K, when it is positive. Returns null when ΔS
 * is zero or the crossover is not at a physical (positive) temperature.
 */
export function crossoverTemperature(dH: number, dS: number): number | null {
  if (dS === 0) return null
  const t = (1000 * dH) / dS
  return t > 0 ? t : null
}

/**
 * The temperature intervals within [tMin, tMax] where ΔG < 0. ΔG is linear in T,
 * so there is at most one interval.
 */
export function spontaneousIntervals(
  dH: number,
  dS: number,
  tMin: number,
  tMax: number
): Array<[number, number]> {
  const slope = -dS / 1000
  if (slope === 0) return dH < 0 ? [[tMin, tMax]] : []
  const root = -dH / slope
  if (slope > 0) {
    // ΔG < 0 below the root.
    const hi = Math.min(root, tMax)
    return hi > tMin ? [[tMin, hi]] : []
  }
  // ΔG < 0 above the root.
  const lo = Math.max(root, tMin)
  return lo < tMax ? [[lo, tMax]] : []
}
