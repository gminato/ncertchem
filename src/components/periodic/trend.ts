/**
 * Pure maths for TrendChart: nice axis ticks, linear scales, line segments
 * that break at missing values, and callout placement that avoids collisions.
 */

export interface TrendPoint {
  x: number
  /** Null marks a missing value. The line breaks there. */
  y: number | null
  /** Usually the element symbol, drawn under the x-axis. */
  label: string
}

export interface NiceTicks {
  ticks: number[]
  lo: number
  hi: number
}

/** Round axis bounds and tick values, in steps of 1, 2, 2.5, 5 or 10 times a power of ten. */
export function niceTicks(min: number, max: number, count = 5): NiceTicks {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [0, 1], lo: 0, hi: 1 }
  let lo = min
  let hi = max
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const raw = (hi - lo) / Math.max(1, count)
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10]
    .map((m) => m * magnitude)
    .find((s) => s >= raw) as number
  const first = Math.floor(lo / step) * step
  const last = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = first; v <= last + step * 1e-9; v += step) {
    // Trim floating point drift such as 0.30000000000000004.
    ticks.push(Number(v.toFixed(10)))
  }
  return { ticks, lo: first, hi: last }
}

/** A linear map from a data domain to a pixel range. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number]
): (v: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  return (v: number) => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0))
}

export interface PixelPoint {
  x: number
  y: number
}

/**
 * The polyline segments for a series. Each run of non-null points forms one
 * segment, so a missing value leaves a gap instead of a line to zero.
 */
export function trendPathSegments(
  points: readonly TrendPoint[],
  xScale: (v: number) => number,
  yScale: (v: number) => number
): PixelPoint[][] {
  const segments: PixelPoint[][] = []
  let current: PixelPoint[] = []
  for (const p of points) {
    if (p.y === null || Number.isNaN(p.y)) {
      if (current.length > 0) segments.push(current)
      current = []
      continue
    }
    current.push({ x: xScale(p.x), y: yScale(p.y) })
  }
  if (current.length > 0) segments.push(current)
  return segments
}

export interface CalloutInput {
  /** Pixel position of the point being called out. */
  x: number
  y: number
  text: string
}

export interface PlacedCallout extends CalloutInput {
  /** Pixel position of the label's baseline centre. */
  labelX: number
  labelY: number
}

const CALLOUT_OFFSET = 26
const CALLOUT_LINE_HEIGHT = 15
const CALLOUT_MIN_GAP_X = 90

/**
 * Places callout labels above their points. A label that would collide with
 * a neighbour (close in x and in y) is lifted above it, so labels never overlap.
 * Labels are placed left to right.
 */
export function placeCallouts(inputs: readonly CalloutInput[]): PlacedCallout[] {
  const sorted = [...inputs].sort((a, b) => a.x - b.x)
  const placed: PlacedCallout[] = []
  for (const item of sorted) {
    let labelY = item.y - CALLOUT_OFFSET
    for (const other of placed) {
      const nearX = Math.abs(other.labelX - item.x) < CALLOUT_MIN_GAP_X
      const nearY = Math.abs(other.labelY - labelY) < CALLOUT_LINE_HEIGHT
      if (nearX && nearY) labelY = other.labelY - CALLOUT_LINE_HEIGHT
    }
    placed.push({ ...item, labelX: item.x, labelY })
  }
  return placed
}
