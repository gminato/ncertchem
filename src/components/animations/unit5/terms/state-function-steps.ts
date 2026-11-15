import { STATE_FUNCTION_DEMO_PATHS, deltaU } from '@/lib/chem/thermo-first-law'
import { clampIndex } from './useTweenedSnapshot'

/** Number of Steps in the state-function Scrolly. */
export const STATE_FUNCTION_STEP_COUNT = 4

/** A point in the drawing's own units (SVG viewBox coordinates). */
export interface Pt {
  x: number
  y: number
}

/**
 * Camp A (state A) and camp B (state B), placed on an altitude gauge. The height of each camp on
 * the gauge is its internal energy, so the gap between them is ΔU. The drawing's vertical scale is
 * 200 units per 1000 J, so the gap is exactly the value from the lib.
 */
export const CAMP_A: Pt = { x: 120, y: 250 }
export const CAMP_B: Pt = { x: 470, y: 50 }
const PX_PER_J = (CAMP_A.y - CAMP_B.y) / deltaU(STATE_FUNCTION_DEMO_PATHS[0].q, STATE_FUNCTION_DEMO_PATHS[0].w)

/** Route 1, the direct climb, from the adiabatic (q = 0) path of the lib. */
export const ROUTE_1: Pt[] = [CAMP_A, { x: 216, y: 200 }, { x: 300, y: 140 }, { x: 384, y: 90 }, CAMP_B]

/** Route 2, a winding path, from the heat-and-work path of the lib. Both end on camp B. */
export const ROUTE_2: Pt[] = [
  CAMP_A,
  { x: 168, y: 228 },
  { x: 206, y: 240 },
  { x: 264, y: 178 },
  { x: 300, y: 190 },
  { x: 348, y: 128 },
  { x: 396, y: 140 },
  { x: 425, y: 96 },
  CAMP_B,
]

/** The altitude (gauge y) of a camp for a given internal energy in J. */
export function gaugeY(energyJ: number): number {
  return CAMP_A.y - energyJ * PX_PER_J
}

/** The target for each Step. Progress runs 0 to 1 along each route. */
export type StateFunctionSnapshot = {
  /** How far the walker on route 1 has got, 0 to 1. */
  progress1: number
  /** How far the walker on route 2 has got, 0 to 1. */
  progress2: number
  /** Strength of route 1's drawing, 0 (absent) to 1. */
  alpha1: number
  /** Strength of route 2's drawing, 0 (absent) to 1. */
  alpha2: number
  /** Strength of the ΔU bracket on the gauge, 0 to 1. */
  bracket: number
}

/** Target state for each Step. */
export function stateFunctionSnapshotForStep(step: number): StateFunctionSnapshot {
  switch (clampIndex(step, STATE_FUNCTION_STEP_COUNT)) {
    case 0:
      return { progress1: 0, progress2: 0, alpha1: 0, alpha2: 0, bracket: 0 }
    case 1:
      return { progress1: 1, progress2: 0, alpha1: 1, alpha2: 0, bracket: 0 }
    case 2:
      return { progress1: 1, progress2: 1, alpha1: 0.3, alpha2: 1, bracket: 0 }
    default:
      return { progress1: 1, progress2: 1, alpha1: 1, alpha2: 1, bracket: 1 }
  }
}

/** Length of each segment of a polyline, and the total. */
function segmentLengths(points: readonly Pt[]): { lengths: number[]; total: number } {
  const lengths: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    lengths.push(len)
    total += len
  }
  return { lengths, total }
}

/**
 * The point a fraction t (0 to 1) of the way along a polyline, measured by arc length, so the
 * walker moves at a steady speed along a route with long and short segments.
 */
export function pointAlong(points: readonly Pt[], t: number): Pt {
  const clamped = Math.min(1, Math.max(0, t))
  const { lengths, total } = segmentLengths(points)
  let remaining = clamped * total
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, remaining / lengths[i])
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      }
    }
    remaining -= lengths[i]
  }
  return points[points.length - 1]
}

/** The polyline from the start to the point a fraction t along it, for drawing the route so far. */
export function routeSoFar(points: readonly Pt[], t: number): Pt[] {
  const clamped = Math.min(1, Math.max(0, t))
  if (clamped <= 0) return [points[0]]
  if (clamped >= 1) return [...points]
  const { total } = segmentLengths(points)
  const out: Pt[] = [points[0]]
  let remaining = clamped * total
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y)
    if (remaining >= len) {
      out.push(points[i + 1])
      remaining -= len
    } else {
      out.push(pointAlong([points[i], points[i + 1]], len === 0 ? 0 : remaining / len))
      break
    }
  }
  return out
}
