/**
 * Pure geometry, placement and maths helpers for Unit 6 Equilibrium visuals.
 * Nothing here touches the DOM, so every function can be checked with unit tests.
 */

import { spacedScatter, type Box, type Point } from '../thermo/geometry'

export type { Box, Point }

/** Clamps value to [0, 1]. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Ease-out cubic: fast start, gentle landing. Maps [0, 1] to [0, 1]. */
export function easeOutCubic(t: number): number {
  const c = clamp01(t)
  return 1 - (1 - c) ** 3
}

// ---------------------------------------------------------------------------
// Number formatting (true minus U+2212, superscripts, ×10ⁿ)
// ---------------------------------------------------------------------------

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '−': '⁻',
}

/** Superscript form of an integer exponent, with a true minus sign: -3 -> "⁻³". */
export function superscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPT[ch] ?? ch)
    .join('')
}

/** A power of ten as text, e.g. -10 -> "10⁻¹⁰". */
export function powerOfTen(exponent: number): string {
  return `10${superscript(exponent)}`
}

/**
 * Scientific notation with a true minus sign: 0.0013 -> "1.3 × 10⁻³".
 * Values that are exactly 0 are shown as "0".
 */
export function formatSci(value: number, digits = 1): string {
  if (value === 0) return '0'
  const sign = value < 0 ? '−' : ''
  const abs = Math.abs(value)
  const exp = Math.floor(Math.log10(abs))
  const rounded = Number((abs / 10 ** exp).toFixed(digits))
  // Rounding can push the mantissa to 10.0; carry it into the exponent.
  const carry = rounded >= 10 ? 1 : 0
  const shownExp = exp + carry
  // Values between 1 and 100 read better without "× 10⁰" or "× 10¹".
  if (shownExp === 0 || shownExp === 1) return `${sign}${Number(abs.toPrecision(digits + 1)).toFixed(shownExp === 0 ? digits : 0)}`
  const shownMantissa = carry ? (rounded / 10).toFixed(digits) : rounded.toFixed(digits)
  return `${sign}${shownMantissa} × ${powerOfTen(shownExp)}`
}

/** Replaces ASCII hyphen-minus with U+2212 in a string. */
export function trueMinus(text: string): string {
  return text.replace(/-/g, '−')
}

// ---------------------------------------------------------------------------
// Log-scale mapping (QKGauge and the [H⁺] axis)
// ---------------------------------------------------------------------------

/**
 * Maps a positive value onto a horizontal (or vertical) pixel range on a log10 scale.
 * `domain` holds the exponents at the two ends: [-10, 10] spans 10⁻¹⁰ to 10¹⁰.
 * Values outside the domain are clamped to its ends.
 */
export function logToPixel(
  value: number,
  domain: readonly [number, number],
  range: readonly [number, number]
): number {
  const [lo, hi] = domain
  const [a, b] = range
  const e = Math.log10(Math.max(value, Number.MIN_VALUE))
  const t = clamp01((e - lo) / (hi - lo))
  return a + t * (b - a)
}

/** The exponent (log10) of a positive value, for comparisons on the log axis. */
export function logOf(value: number): number {
  return Math.log10(Math.max(value, Number.MIN_VALUE))
}

export type ZoneKind = 'products' | 'both' | 'reactants'

/**
 * NCERT extent zones for an equilibrium constant: K > 10³ means products
 * predominate, K < 10⁻³ means reactants predominate, and anything between means both.
 */
export function kZone(K: number): ZoneKind {
  const e = logOf(K)
  if (e > 3) return 'products'
  if (e < -3) return 'reactants'
  return 'both'
}

export type NetDirection = 'net forward' | 'net reverse' | 'at equilibrium'

/**
 * Which way a reaction proceeds from reaction quotient Q towards K.
 * Compared on the log scale; `tolerance` is the allowed gap in log10 units,
 * so Q within a factor of about 1.1 of K counts as equilibrium.
 */
export function netDirection(Q: number, K: number, tolerance = 0.04): NetDirection {
  const d = logOf(Q) - logOf(K)
  if (Math.abs(d) <= tolerance) return 'at equilibrium'
  return d < 0 ? 'net forward' : 'net reverse'
}

/** Solubility: compares Q with Ksp. Below means more solid dissolves, above means precipitate forms. */
export type KspState = 'below' | 'equal' | 'above'

export function qVersusKsp(Q: number, Ksp: number, tolerance = 0.04): KspState {
  const d = logOf(Q) - logOf(Ksp)
  if (Math.abs(d) <= tolerance) return 'equal'
  return d < 0 ? 'below' : 'above'
}

// ---------------------------------------------------------------------------
// Concentration-time curves
// ---------------------------------------------------------------------------

export type TimePoint = readonly [number, number]

/**
 * The part of a curve up to time `tMax`, with the last point interpolated so the
 * drawn curve ends exactly at `tMax`. Used to draw curves in with `progress`.
 */
export function clipCurve(points: readonly TimePoint[], tMax: number): TimePoint[] {
  if (points.length === 0) return []
  const out: TimePoint[] = []
  for (let i = 0; i < points.length; i++) {
    const [t, c] = points[i]
    if (t <= tMax) {
      out.push([t, c])
      continue
    }
    const [tPrev, cPrev] = points[i - 1] ?? [t, c]
    if (i > 0 && t > tPrev) {
      const f = (tMax - tPrev) / (t - tPrev)
      out.push([tMax, cPrev + f * (c - cPrev)])
    }
    break
  }
  return out
}

/**
 * An SVG path through the given time-concentration points, mapped to pixels.
 * Returns "" for fewer than two points.
 */
export function curvePath(
  points: readonly TimePoint[],
  xOf: (t: number) => number,
  yOf: (c: number) => number
): string {
  if (points.length < 2) return ''
  return points
    .map(([t, c], i) => `${i === 0 ? 'M' : 'L'}${round2(xOf(t))},${round2(yOf(c))}`)
    .join(' ')
}

/** Linear interpolation of concentration at time `t` along a curve (clamped at the ends). */
export function concentrationAt(points: readonly TimePoint[], t: number): number {
  if (points.length === 0) return 0
  if (t <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [t1, c1] = points[i]
    if (t <= t1) {
      const [t0, c0] = points[i - 1]
      const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0)
      return c0 + f * (c1 - c0)
    }
  }
  return points[points.length - 1][1]
}

/**
 * The first time after which the curve stays within `tol` of its final value.
 * Used to start the "equilibrium reached" band where the curves flatten.
 */
export function settleTime(points: readonly TimePoint[], tol: number): number {
  if (points.length === 0) return 0
  const final = points[points.length - 1][1]
  for (let i = 0; i < points.length; i++) {
    const allWithin = points.slice(i).every(([, c]) => Math.abs(c - final) <= tol)
    if (allWithin) return points[i][0]
  }
  return points[points.length - 1][0]
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

// ---------------------------------------------------------------------------
// Rates (forward and reverse)
// ---------------------------------------------------------------------------

export interface RateConfig {
  forwardStart: number
  reverseStart: number
  /** Common value both rates approach at equilibrium. */
  equilibrium: number
}

/**
 * Forward and reverse rates at a given progress from 0 (reaction just started) to 1
 * (equilibrium). Both rates move towards the same equilibrium value with an ease-out.
 */
export function rateState(progress: number, cfg: RateConfig): { forward: number; reverse: number } {
  const e = easeOutCubic(progress)
  return {
    forward: cfg.forwardStart + (cfg.equilibrium - cfg.forwardStart) * e,
    reverse: cfg.reverseStart + (cfg.equilibrium - cfg.reverseStart) * e,
  }
}

/** True when two rates agree to within `tol` (a fraction of the larger one). */
export function ratesEqual(forward: number, reverse: number, tol = 0.02): boolean {
  const scale = Math.max(Math.abs(forward), Math.abs(reverse), Number.MIN_VALUE)
  return Math.abs(forward - reverse) <= tol * scale
}

// ---------------------------------------------------------------------------
// Le Chatelier balance
// ---------------------------------------------------------------------------

/**
 * Beam tilt in degrees. `side` is -1 (left pan down), 0 (level) or +1 (right pan down).
 * The beam starts at the full `peak` tilt and re-levels towards a residual share as
 * `progress` runs from 0 to 1: the system shifts, so the imbalance partly settles.
 */
export function tiltAngle(side: -1 | 0 | 1, progress: number, peak = 9, relevel = 0.6): number {
  return side * peak * (1 - relevel * clamp01(progress))
}

// ---------------------------------------------------------------------------
// Universal-indicator gradient
// ---------------------------------------------------------------------------

/** The eight gradient stops (pH 0, 2, … 14). Their colours live in tokens.css as --ph-N. */
export const PH_STOP_VALUES = [0, 2, 4, 6, 8, 10, 12, 14] as const

/** SVG gradient offsets for the pH bar: each stop is placed evenly by pH. */
export function phGradientStops(): Array<{ offset: number; token: string }> {
  return PH_STOP_VALUES.map((ph) => ({
    offset: ph / 14,
    token: `var(--ph-${ph})`,
  }))
}

/**
 * The two stops either side of `ph` and the blend weight towards the upper one.
 * pH is clamped to [0, 14].
 */
export function phStopPair(ph: number): { lo: number; hi: number; t: number } {
  const p = Math.min(14, Math.max(0, ph))
  const idx = Math.min(PH_STOP_VALUES.length - 2, Math.floor(p / 2))
  const lo = PH_STOP_VALUES[idx]
  const hi = PH_STOP_VALUES[idx + 1]
  return { lo, hi, t: (p - lo) / (hi - lo) }
}

/** A CSS colour for a pH: a colour-mix of the two neighbouring stops, so it follows the theme. */
export function phTint(ph: number): string {
  const { lo, hi, t } = phStopPair(ph)
  const hiPct = Math.round(t * 100)
  if (hiPct === 0) return `var(--ph-${lo})`
  if (hiPct === 100) return `var(--ph-${hi})`
  return `color-mix(in srgb, var(--ph-${hi}) ${hiPct}%, var(--ph-${lo}))`
}

/** Linear blend of two #RRGGBB colours. t = 0 gives a, t = 1 gives b. */
export function mixHex(a: string, b: string, t: number): string {
  const f = clamp01(t)
  const pa = parseHex(a)
  const pb = parseHex(b)
  const channel = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * f)
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/**
 * Colour at a pH along a list of hex stops spread evenly over 0 to 14.
 * Used to check the gradient maths against the light palette.
 */
export function phColorFromStops(ph: number, stops: readonly string[]): string {
  const p = Math.min(14, Math.max(0, ph))
  const span = 14 / (stops.length - 1)
  const idx = Math.min(stops.length - 2, Math.floor(p / span))
  return mixHex(stops[idx], stops[idx + 1], (p - idx * span) / span)
}

/** [H⁺] (mol L⁻¹) and [OH⁻] (mol L⁻¹) at 25 °C from a pH. */
export function ionConcentrations(pH: number, pKw = 14): { hPlus: number; oh: number } {
  // pKw is 14.00 only at 298 K; pass the value for another temperature.
  return { hPlus: 10 ** -pH, oh: 10 ** (pH - pKw) }
}

// ---------------------------------------------------------------------------
// Ionisation and particle layout
// ---------------------------------------------------------------------------

/** Number of molecules out of `total` that are ionised at a given fraction. */
export function ionisedCount(fraction: number, total: number): number {
  return Math.round(clamp01(fraction) * total)
}

/**
 * How far particle `index` (0-based) is converted to ions. The first molecules convert
 * first and each one blends smoothly over the last unit of the ionised count.
 */
export function conversionMix(index: number, fraction: number, total: number): number {
  return clamp01(clamp01(fraction) * total - index)
}

/**
 * Deterministic, non-overlapping positions for a set of particles in a box.
 * Minimum centre spacing is `minDist` SVG units. Same seed, same layout.
 */
export function particleLayout(count: number, box: Box, seed: number, minDist: number): Point[] {
  return spacedScatter(count, box, seed, minDist)
}

/** The smallest centre-to-centre distance in a set of points (Infinity for fewer than 2). */
export function minSpacing(points: readonly Point[]): number {
  let best = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
      if (d < best) best = d
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Sealed vessel exchange (evaporation and dissolution)
// ---------------------------------------------------------------------------

/**
 * Particle sets that cross a phase boundary: the surface of a liquid or a solid.
 * `surfaceY` is the boundary in SVG units; `count` particles sit either side of it.
 */
export function surfaceCrossers(
  count: number,
  box: Box,
  surfaceY: number,
  seed: number,
  minDist: number
): Point[] {
  const band: Box = { x0: box.x0, x1: box.x1, y0: surfaceY - 6, y1: surfaceY + 6 }
  return particleLayout(count, band, seed, minDist)
}
