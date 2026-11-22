/**
 * Pure helpers for the chemical kinetics drawing set. No React here, so the
 * scale, clipping, curve and distribution rules can be unit tested directly.
 */

export type Point = { x: number; y: number }
export type Box = { left: number; top: number; width: number; height: number }
export type Domain = { xMin: number; xMax: number; yMin: number; yMax: number }

export interface PlotScale {
  /** Data x to pixel x, inside the frame. */
  x(v: number): number
  /** Data y to pixel y (larger y is higher on the screen). */
  y(v: number): number
  /** Pixel x back to data x. */
  xInv(px: number): number
  /** Pixel y back to data y. */
  yInv(py: number): number
  box: Box
  domain: Domain
}

/** Linear map from a data range onto a pixel range. Pure: no clamping. */
export function linear(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number]
): { to(v: number): number; from(p: number): number } {
  const span = d1 - d0
  const k = span === 0 ? 0 : (r1 - r0) / span
  return {
    to: (v) => r0 + (v - d0) * k,
    from: (p) => (k === 0 ? d0 : d0 + (p - r0) / k),
  }
}

/**
 * Scale for a data window inside a pixel box. The y axis points up: yMax sits at
 * the top of the box and yMin at the bottom, so negative ranges (ln[R]) work.
 */
export function makePlotScale(domain: Domain, box: Box): PlotScale {
  const xs = linear([domain.xMin, domain.xMax], [box.left, box.left + box.width])
  // Pixel y grows downwards, so the data range maps onto [bottom, top].
  const ys = linear([domain.yMin, domain.yMax], [box.top + box.height, box.top])
  return {
    x: xs.to,
    y: ys.to,
    xInv: xs.from,
    yInv: ys.from,
    box,
    domain,
  }
}

/**
 * A "nice" tick step for a range: 1, 2 or 5 times a power of ten, giving about
 * `count` intervals. Returns the ticks inside [min, max].
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min]
  const raw = (max - min) / Math.max(1, count)
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const frac = raw / pow
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow
  const first = Math.ceil(min / step - 1e-9) * step
  const out: number[] = []
  for (let v = first; v <= max + step * 1e-9; v += step) {
    out.push(Number((Math.round(v / step) * step).toPrecision(12)))
  }
  return out
}

/**
 * Liang–Barsky clip of the segment p1–p2 to a pixel box. Returns null when the
 * segment misses the box entirely.
 */
export function clipSegment(p1: Point, p2: Point, box: Box): [Point, Point] | null {
  const xMin = box.left
  const xMax = box.left + box.width
  const yMin = box.top
  const yMax = box.top + box.height
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  let t0 = 0
  let t1 = 1
  const edges: Array<[number, number]> = [
    [-dx, p1.x - xMin],
    [dx, xMax - p1.x],
    [-dy, p1.y - yMin],
    [dy, yMax - p1.y],
  ]
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null
      continue
    }
    const r = q / p
    if (p < 0) {
      if (r > t1) return null
      if (r > t0) t0 = r
    } else {
      if (r < t0) return null
      if (r < t1) t1 = r
    }
  }
  return [
    { x: p1.x + t0 * dx, y: p1.y + t0 * dy },
    { x: p1.x + t1 * dx, y: p1.y + t1 * dy },
  ]
}

/** Evenly spaced samples from a to b inclusive. */
export function samples(a: number, b: number, n: number): number[] {
  const count = Math.max(2, Math.floor(n))
  return Array.from({ length: count }, (_, i) => a + ((b - a) * i) / (count - 1))
}

/**
 * Maxwell–Boltzmann fraction density f(E) = (2/√π) θ^(−3/2) √E e^(−E/θ), with
 * θ proportional to T. Its integral over E ≥ 0 is exactly 1 for every θ, so two
 * temperatures always enclose the same area. The peak sits at E = θ/2.
 */
export function maxwellBoltzmann(E: number, theta: number): number {
  if (E <= 0 || theta <= 0) return 0
  return ((2 / Math.sqrt(Math.PI)) * Math.pow(theta, -1.5) * Math.sqrt(E) * Math.exp(-E / theta))
}

/** θ for a temperature, relative to a reference temperature with reference θ. */
export function thetaFor(T: number, Tref: number, thetaRef: number): number {
  return (T / Tref) * thetaRef
}

/** Fraction of molecules with energy at or above Ea: the exact upper tail of f(E). */
export function fractionAbove(Ea: number, theta: number): number {
  // Tail of the Gamma(3/2, θ) distribution: Γ(3/2, x)/Γ(3/2) with x = Ea/θ.
  // Γ(3/2, x) = √π·erfc(√x) + 2√x·e^(−x), and Γ(3/2) = √π/2.
  const x = Math.max(0, Ea / theta)
  return erfc(Math.sqrt(x)) + (2 / Math.sqrt(Math.PI)) * Math.sqrt(x) * Math.exp(-x)
}

/** Complementary error function, Abramowitz–Stegun 7.1.26 (|error| < 1.5e-7). */
export function erfc(x: number): number {
  const z = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * z)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const r = poly * Math.exp(-z * z)
  return x >= 0 ? r : 2 - r
}

/**
 * Cubic Bézier path through stationary points with horizontal tangents at each
 * point, so every peak and valley is an exact extremum and the curve is smooth.
 */
export function smoothThrough(points: Point[]): string {
  if (points.length === 0) return ''
  const f = (n: number) => n.toFixed(2)
  let d = `M${f(points[0].x)} ${f(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const mid = (b.x - a.x) / 2
    d += ` C${f(a.x + mid)} ${f(a.y)} ${f(b.x - mid)} ${f(b.y)} ${f(b.x)} ${f(b.y)}`
  }
  return d
}

/** Evaluates a smooth energy profile (same construction as smoothThrough) at x. */
export function profileY(points: Point[], x: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (x < a.x || x > b.x) continue
    const span = b.x - a.x
    if (span === 0) return b.y
    // Solve the Bézier x(s) = x by bisection, then return y(s).
    const mid = span / 2
    const c1 = a.x + mid
    const c2 = b.x - mid
    let lo = 0
    let hi = 1
    for (let k = 0; k < 40; k++) {
      const s = (lo + hi) / 2
      const xs = bezier(a.x, c1, c2, b.x, s)
      if (xs < x) lo = s
      else hi = s
    }
    return bezier(a.y, a.y, b.y, b.y, (lo + hi) / 2)
  }
  return points[points.length - 1]?.y ?? 0
}

function bezier(p0: number, p1: number, p2: number, p3: number, s: number): number {
  const u = 1 - s
  return u * u * u * p0 + 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s * p3
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
