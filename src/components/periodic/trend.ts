/**
 * Pure maths for TrendChart: nice axis ticks, linear scales, line segments
 * that break at missing values, and callout placement that keeps labels in
 * clear space, never on the series or on each other.
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
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) as number
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

export interface PlaneBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export interface LabelBox {
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface PlacedCallout extends CalloutInput {
  /** Centre x of the label. Labels are centred on their point. */
  labelX: number
  /** Baseline y of the label text. */
  labelY: number
  /** Where the leader line meets the label box. */
  leaderEndY: number
  side: 'above' | 'below'
  box: LabelBox
}

const CALLOUT_FONT_PX = 12
const CALLOUT_CHAR_PX = CALLOUT_FONT_PX * 0.56
const CALLOUT_PAD_X = 8
const CALLOUT_BOX_H = 18
const CALLOUT_CLEAR = 4
/** Candidate label offsets from the point (baseline y relative to the point). */
const CANDIDATES: readonly { side: 'above' | 'below'; dy: number }[] = [
  { side: 'above', dy: -30 },
  { side: 'below', dy: 36 },
  { side: 'above', dy: -56 },
  { side: 'below', dy: 62 },
]

/** Sample points along every segment, so a label box can be tested against the line. */
function sampleSeries(series: readonly (readonly PixelPoint[])[]): PixelPoint[] {
  const samples: PixelPoint[] = []
  for (const seg of series) {
    for (let i = 0; i < seg.length; i++) {
      samples.push(seg[i])
      if (i + 1 < seg.length) {
        const a = seg[i]
        const b = seg[i + 1]
        for (let s = 1; s < 12; s++) {
          const t = s / 12
          samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        }
      }
    }
  }
  return samples
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

function insideExpanded(p: PixelPoint, box: LabelBox, pad: number): boolean {
  return p.x >= box.x0 - pad && p.x <= box.x1 + pad && p.y >= box.y0 - pad && p.y <= box.y1 + pad
}

/**
 * Places callouts above or below their points, in clear space. A candidate is
 * accepted when its box lies inside the plot, touches no part of the series,
 * and overlaps no label already placed. Candidates are tried nearest first.
 * If none is clear, the nearest candidate is used.
 */
export function placeCallouts(
  inputs: readonly CalloutInput[],
  series: readonly (readonly PixelPoint[])[],
  bounds: PlaneBounds
): PlacedCallout[] {
  const samples = sampleSeries(series)
  const sorted = [...inputs].sort((a, b) => a.x - b.x)
  const placed: PlacedCallout[] = []
  const taken: LabelBox[] = []

  for (const item of sorted) {
    const halfW = item.text.length * CALLOUT_CHAR_PX / 2 + CALLOUT_PAD_X
    let chosen: PlacedCallout | null = null
    for (const cand of CANDIDATES) {
      const labelY = item.y + cand.dy
      const box: LabelBox = {
        x0: item.x - halfW,
        x1: item.x + halfW,
        y0: labelY - CALLOUT_FONT_PX,
        y1: labelY + 5,
      }
      const inside =
        box.x0 >= bounds.left && box.x1 <= bounds.right && box.y0 >= bounds.top && box.y1 <= bounds.bottom
      if (!inside) continue
      if (samples.some((p) => insideExpanded(p, box, CALLOUT_CLEAR))) continue
      if (taken.some((other) => boxesOverlap(other, expand(box, CALLOUT_CLEAR)))) continue
      const leaderEndY = cand.side === 'above' ? box.y1 : box.y0
      chosen = { ...item, labelX: item.x, labelY, leaderEndY, side: cand.side, box }
      break
    }
    if (!chosen) {
      const cand = CANDIDATES[0]
      const labelY = item.y + cand.dy
      const box: LabelBox = { x0: item.x - halfW, x1: item.x + halfW, y0: labelY - CALLOUT_FONT_PX, y1: labelY + 5 }
      chosen = { ...item, labelX: item.x, labelY, leaderEndY: box.y1, side: cand.side, box }
    }
    taken.push(chosen.box)
    placed.push(chosen)
  }
  return placed
}

function expand(box: LabelBox, pad: number): LabelBox {
  return { x0: box.x0 - pad, x1: box.x1 + pad, y0: box.y0 - pad, y1: box.y1 + pad }
}
