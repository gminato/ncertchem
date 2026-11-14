export type LabelAnchor = 'start' | 'middle' | 'end'

export interface OrbitLabelPosition {
  x: number
  y: number
  textAnchor: LabelAnchor
}

/** Cosine magnitude above which a label is anchored to the side it sits on. */
const ANCHOR_COS_THRESHOLD = 0.35

/**
 * Places a label just outside a circular orbit, along a ray at `angleDeg`.
 *
 * The returned point is the label centre, at radius `r + offset` from (cx, cy).
 * Angles follow SVG convention: 0 points right, -90 points up (y grows downward).
 * The text anchor makes the label grow away from the orbit: labels on the right
 * half are `start`-anchored, labels on the left half are `end`-anchored, and
 * labels near the top or bottom are centred.
 */
export function orbitLabelPosition(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
  offset: number
): OrbitLabelPosition {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const d = r + offset

  let textAnchor: LabelAnchor = 'middle'
  if (cos > ANCHOR_COS_THRESHOLD) textAnchor = 'start'
  else if (cos < -ANCHOR_COS_THRESHOLD) textAnchor = 'end'

  return {
    x: cx + d * cos,
    y: cy + d * sin,
    textAnchor,
  }
}

export interface LadderLabel {
  /** The y coordinate of the rung this label belongs to (input order preserved). */
  rungY: number
  /** The y coordinate for the label text, at least `minGap` from its neighbours. */
  labelY: number
  /** True when the label was moved off its rung; draw a thin leader line then. */
  nudged: boolean
}

const NUDGE_EPSILON = 0.5
const CONVERGENCE_EPSILON = 1e-6
const MAX_RELAXATION_PASSES = 1000

/**
 * Computes label y positions for an energy ladder so that no two labels are
 * closer than `minGap` vertically.
 *
 * Each label starts on its rung. Neighbouring labels that are too close are
 * pushed apart symmetrically, so the displacement is shared between them and
 * stays as small as possible. Labels are meant to sit to the RIGHT of each
 * rung's end; the caller supplies the x coordinate. When `nudged` is true the
 * caller should draw a thin leader line from the rung end to the label.
 *
 * The result is in the same order as `levels`.
 *
 * @param levels Rung positions (SVG y coordinates)
 * @param minGap Minimum vertical distance between label centres
 */
export function ladderLabels(levels: { y: number }[], minGap: number): LadderLabel[] {
  const order = levels
    .map((level, index) => ({ index, rungY: level.y }))
    .sort((a, b) => a.rungY - b.rungY)

  const labelYs = order.map((entry) => entry.rungY)

  for (let pass = 0; pass < MAX_RELAXATION_PASSES; pass++) {
    let moved = false
    for (let k = 0; k < labelYs.length - 1; k++) {
      const gap = labelYs[k + 1] - labelYs[k]
      const deficit = minGap - gap
      if (deficit > CONVERGENCE_EPSILON) {
        const half = deficit / 2
        labelYs[k] -= half
        labelYs[k + 1] += half
        moved = true
      }
    }
    if (!moved) break
  }

  const result: LadderLabel[] = new Array(levels.length)
  order.forEach((entry, k) => {
    result[entry.index] = {
      rungY: entry.rungY,
      labelY: labelYs[k],
      nudged: Math.abs(labelYs[k] - entry.rungY) > NUDGE_EPSILON,
    }
  })
  return result
}
