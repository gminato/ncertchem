/**
 * Pure geometry, placement and math helpers for Unit 7 Redox visuals.
 * Nothing here touches the DOM so all functions can be verified directly with unit tests.
 */

export interface Point {
  x: number
  y: number
}

/** Clamps value to [0, 1]. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * Formats a number with a true minus sign (U+2212) if negative,
 * or optional explicit plus sign if positive.
 */
export function formatSignedNumber(value: number, explicitPlus = true): string {
  if (value > 0) return explicitPlus ? `+${value}` : `${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}

/**
 * Normalises minus signs in a string (e.g. "2-" -> "2−", "-1" -> "−1").
 */
export function formatTrueMinus(text: string): string {
  return text.replace(/-/g, '−')
}

// ---------------------------------------------------------------------------
// 1. Badge placement without overlap
// ---------------------------------------------------------------------------

export interface BadgeItem {
  id: string | number
  targetX: number
  width: number
}

export interface PlacedBadge {
  id: string | number
  x: number
  targetX: number
  nudged: boolean
}

const CONVERGENCE_EPSILON = 1e-4
const MAX_RELAXATION_PASSES = 100

/**
 * Resolves 1D badge positions along an axis so that no two badges overlap.
 * Keeps badges as close to their targetX as possible using symmetrical relaxation.
 */
export function resolveBadgePositions(
  badges: readonly BadgeItem[],
  minGap = 4
): PlacedBadge[] {
  if (badges.length <= 1) {
    return badges.map((b) => ({
      id: b.id,
      x: b.targetX,
      targetX: b.targetX,
      nudged: false,
    }))
  }

  // Preserve original indices for returning in initial order
  const order = badges
    .map((badge, index) => ({ index, ...badge }))
    .sort((a, b) => a.targetX - b.targetX)

  const positions = order.map((item) => item.targetX)

  for (let pass = 0; pass < MAX_RELAXATION_PASSES; pass++) {
    let moved = false
    for (let i = 0; i < positions.length - 1; i++) {
      const leftHalfWidth = order[i].width / 2
      const rightHalfWidth = order[i + 1].width / 2
      const requiredDist = leftHalfWidth + rightHalfWidth + minGap
      const currentDist = positions[i + 1] - positions[i]

      const deficit = requiredDist - currentDist
      if (deficit > CONVERGENCE_EPSILON) {
        const half = deficit / 2
        positions[i] -= half
        positions[i + 1] += half
        moved = true
      }
    }
    if (!moved) break
  }

  const result: PlacedBadge[] = new Array(badges.length)
  order.forEach((item, k) => {
    const finalX = positions[k]
    result[item.index] = {
      id: item.id,
      x: finalX,
      targetX: item.targetX,
      nudged: Math.abs(finalX - item.targetX) > 0.5,
    }
  })

  return result
}

// ---------------------------------------------------------------------------
// 2. Ladder placement (ON and Standard Electrode Potential)
// ---------------------------------------------------------------------------

export interface LadderYOptions {
  top: number
  bottom: number
  min: number
  max: number
}

/**
 * Maps oxidation number linearly to an SVG y-coordinate.
 * High ON (e.g. +7) maps to `top` (smaller y).
 * Low ON (e.g. −3) maps to `bottom` (larger y).
 */
export function onLadderY(
  on: number,
  options: { top: number; bottom: number; onMin: number; onMax: number }
): number {
  const { top, bottom, onMin, onMax } = options
  if (onMax === onMin) return (top + bottom) / 2
  const t = (on - onMin) / (onMax - onMin)
  return bottom - t * (bottom - top)
}

/**
 * Maps standard reduction potential E° (in V) linearly to SVG y-coordinate.
 * Most positive potential (strongest oxidant, e.g. F₂ at +2.87 V) maps to `top`.
 * Most negative potential (strongest reductant, e.g. Li⁺ at −3.05 V) maps to `bottom`.
 */
export function potentialLadderY(
  e0: number,
  options: { top: number; bottom: number; eMin: number; eMax: number }
): number {
  const { top, bottom, eMin, eMax } = options
  if (eMax === eMin) return (top + bottom) / 2
  const t = (e0 - eMin) / (eMax - eMin)
  return bottom - t * (bottom - top)
}

// ---------------------------------------------------------------------------
// 3. Arrow paths & brackets
// ---------------------------------------------------------------------------

/**
 * Creates a curved SVG path `d` string between two points curving horizontally.
 * @param from Start point
 * @param to End point
 * @param curveDx Horizontal deflection at midpoint (+ right, - left)
 */
export function curvedArrowPath(from: Point, to: Point, curveDx: number): string {
  const midX = (from.x + to.x) / 2 + curveDx
  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
}

/**
 * Computes a clear label placement beside a reaction transition arrow
 * so the label pill never intersects or overlaps the arrow stroke.
 * For an oxidation arrow (pointing upward/right), the label sits strictly above the arrow.
 * For a reduction arrow (pointing downward/right), the label sits strictly below the arrow.
 */
export function transitionLabelPosition(
  from: Point,
  to: Point,
  isOx: boolean,
  pillWidth = 96,
  pillHeight = 24,
  gap = 16
): Point {
  const midX = from.x + (to.x - from.x) * 0.42
  const dx = to.x - from.x
  const dy = to.y - from.y
  const slope = dx !== 0 ? dy / dx : 0

  const xLeft = midX - pillWidth / 2
  const xRight = midX + pillWidth / 2
  const yLeft = from.y + slope * (xLeft - from.x)
  const yRight = from.y + slope * (xRight - from.x)

  if (isOx) {
    const arrowTopY = Math.min(yLeft, yRight)
    const labelY = arrowTopY - gap - pillHeight / 2
    return { x: midX, y: labelY }
  } else {
    const arrowBottomY = Math.max(yLeft, yRight)
    const labelY = arrowBottomY + gap + pillHeight / 2
    return { x: midX, y: labelY }
  }
}

/**
 * Evaluates a point along a quadratic bezier curve at parameter t in [0, 1].
 */
export function quadraticBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const s = 1 - t
  return {
    x: s * s * p0.x + 2 * s * t * p1.x + t * t * p2.x,
    y: s * s * p0.y + 2 * s * t * p1.y + t * t * p2.y,
  }
}

/**
 * Spontaneous reaction bracket geometry spanning from an lower E° couple (anode)
 * to an upper E° couple (cathode).
 */
export interface BracketGeometry {
  bracketPath: string
  labelX: number
  labelY: number
  eCell: number
}

export function spontaneousBracketGeometry(
  cathodeY: number,
  anodeY: number,
  bracketX: number,
  width = 16
): BracketGeometry {
  const topY = Math.min(cathodeY, anodeY)
  const bottomY = Math.max(cathodeY, anodeY)
  const midY = (topY + bottomY) / 2
  const rightX = bracketX + width

  // Bracket path: top serif, right line, mid cusp, right line, bottom serif
  const bracketPath = [
    `M ${bracketX} ${topY}`,
    `L ${rightX} ${topY}`,
    `L ${rightX} ${midY - 4}`,
    `L ${rightX + 6} ${midY}`,
    `L ${rightX} ${midY + 4}`,
    `L ${rightX} ${bottomY}`,
    `L ${bracketX} ${bottomY}`,
  ].join(' ')

  return {
    bracketPath,
    labelX: rightX + 10,
    labelY: midY,
    eCell: 0,
  }
}

// ---------------------------------------------------------------------------
// 4. Electron path points
// ---------------------------------------------------------------------------

/**
 * Evaluates the position of an electron on an arc between donor and acceptor.
 * Arc reaches a peak height `arcHeight` above the straight line.
 */
export function electronArcPoint(
  donor: Point,
  acceptor: Point,
  arcHeight: number,
  progress: number
): Point {
  const t = clamp01(progress)
  const ctrl: Point = {
    x: (donor.x + acceptor.x) / 2,
    y: Math.min(donor.y, acceptor.y) - arcHeight,
  }
  return quadraticBezierPoint(donor, ctrl, acceptor, t)
}

/**
 * Returns the SVG quadratic curve path `d` string for the electron flight arc.
 */
export function electronArcPath(donor: Point, acceptor: Point, arcHeight: number): string {
  const ctrlX = (donor.x + acceptor.x) / 2
  const ctrlY = Math.min(donor.y, acceptor.y) - arcHeight
  return `M ${donor.x} ${donor.y} Q ${ctrlX} ${ctrlY} ${acceptor.x} ${acceptor.y}`
}

/**
 * Returns staggered points for N electrons traveling from donor to acceptor.
 * If N=1, sits at `progress`.
 * If N>1, electrons are spread around `progress` along the arc.
 */
export function staggeredElectronPoints(
  donor: Point,
  acceptor: Point,
  arcHeight: number,
  count: number,
  progress: number,
  spread = 0.12
): Point[] {
  if (count <= 0) return []
  if (count === 1) {
    return [electronArcPoint(donor, acceptor, arcHeight, progress)]
  }

  const points: Point[] = []
  for (let i = 0; i < count; i++) {
    // Spread electrons along [progress - spread, progress + spread]
    const offset = (i - (count - 1) / 2) * spread
    const t = clamp01(progress + offset)
    points.push(electronArcPoint(donor, acceptor, arcHeight, t))
  }
  return points
}

// ---------------------------------------------------------------------------
// 5. Colour parsing and interpolation
// ---------------------------------------------------------------------------

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/** Known token fallbacks for headless unit testing */
const TOKEN_COLOR_FALLBACKS: Record<string, RGBA> = {
  'var(--sol-cu)': { r: 30, g: 136, b: 229, a: 1 },
  'var(--sol-mno4)': { r: 123, g: 31, b: 162, a: 1 },
  'var(--sol-starch)': { r: 15, g: 23, b: 42, a: 1 },
  'var(--sol-pink)': { r: 236, g: 72, b: 153, a: 1 },
  'var(--metal-cu)': { r: 180, g: 83, b: 9, a: 1 },
  'var(--metal-zn)': { r: 113, g: 113, b: 122, a: 1 },
  'var(--metal-ag)': { r: 203, g: 213, b: 225, a: 1 },
  'var(--ox)': { r: 217, g: 119, b: 6, a: 1 },
  'var(--red)': { r: 67, g: 56, b: 202, a: 1 },
  clear: { r: 255, g: 255, b: 255, a: 0 },
}

/** Parses hex (#RGB, #RRGGBB), rgb(a), or known token strings into RGBA */
export function parseColor(color: string): RGBA {
  const trimmed = color.trim()

  if (TOKEN_COLOR_FALLBACKS[trimmed]) {
    return { ...TOKEN_COLOR_FALLBACKS[trimmed] }
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      }
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      }
    }
  }

  const rgbaMatch = trimmed.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/
  )
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    }
  }

  // Fallback neutral
  return { r: 128, g: 128, b: 128, a: 1 }
}

/**
 * Linearly interpolates two colours by t in [0, 1].
 * Returns an `rgba(r, g, b, a)` string.
 */
export function interpolateRgb(color1: string, color2: string, progress: number): string {
  const t = clamp01(progress)
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)

  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  const a = +(c1.a + (c2.a - c1.a) * t).toFixed(3)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// ---------------------------------------------------------------------------
// 6. Chemical formula parser
// ---------------------------------------------------------------------------

export interface FormulaPart {
  element: string
  count?: string
  index: number
}

/**
 * Parses simple chemical formula strings like "Cr2O7", "MnO4", "S4O6", "Na", "Cl"
 * into elemental components with subscripts.
 */
export function parseChemicalFormula(formula: string): FormulaPart[] {
  const regex = /([A-Z][a-z]*)(\d*)/g
  const parts: FormulaPart[] = []
  let match: RegExpExecArray | null
  let index = 0

  while ((match = regex.exec(formula)) !== null) {
    if (match[0] === '') break
    parts.push({
      element: match[1],
      count: match[2] || undefined,
      index,
    })
    index++
  }

  return parts
}
