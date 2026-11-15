/**
 * Pure geometry for curved electron-movement arrows (Unit 8). An arrow is a quadratic Bezier
 * from a start point to an end point, bent by a control point offset from the chord. A full
 * head marks an electron pair, a half head (a single barb, the "fishhook") a single electron.
 */
import type { Point } from './layout'

export type ArrowKind = 'pair' | 'radical'

export interface ArrowOptions {
  /** Control-point offset as a fraction of the chord. Positive bends left of the direction of travel. */
  bend?: number
  kind?: ArrowKind
  /** Pixels cut from each end so the arrow does not touch atoms. */
  gap?: number
  /** Head length in pixels. */
  headSize?: number
}

export interface ArrowGeometry {
  start: Point
  control: Point
  /** Where the head's tip sits (the trimmed end of the curve). */
  tip: Point
  /** Where the shaft stops, at the head's base. */
  shaftEnd: Point
  /** Unit tangent at the tip, pointing along the arrow. */
  tangent: Point
  /** Head polygon in pixels: tip first. Pair: three points. Radical: a single barb, three points. */
  head: Point[]
  kind: ArrowKind
}

export function quadBezier(p0: Point, c: Point, p1: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  }
}

/** Geometry of one curved arrow from `from` to `to`. */
export function curvedArrowGeometry(from: Point, to: Point, opts: ArrowOptions = {}): ArrowGeometry {
  const bend = opts.bend ?? 0.35
  const kind = opts.kind ?? 'pair'
  const gap = opts.gap ?? 4
  const headSize = opts.headSize ?? 11
  const dx = to.x - from.x
  const dy = to.y - from.y
  const chord = Math.hypot(dx, dy) || 1
  const ux = dx / chord
  const uy = dy / chord
  // Trim the ends of the chord.
  const start = { x: from.x + ux * gap, y: from.y + uy * gap }
  const end = { x: to.x - ux * gap, y: to.y - uy * gap }
  const len = Math.hypot(end.x - start.x, end.y - start.y) || 1
  // Left-hand normal of the trimmed chord, scaled by the bend.
  const nx = -uy
  const ny = ux
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const control = { x: mid.x + nx * bend * len, y: mid.y + ny * bend * len }
  // Tangent at the end of a quadratic Bezier is (end - control).
  let tx = end.x - control.x
  let ty = end.y - control.y
  const tl = Math.hypot(tx, ty) || 1
  tx /= tl
  ty /= tl
  const shaftEnd = { x: end.x - tx * headSize * 0.6, y: end.y - ty * headSize * 0.6 }
  const px = -ty
  const py = tx
  const back = { x: end.x - tx * headSize, y: end.y - ty * headSize }
  const head: Point[] =
    kind === 'pair'
      ? [
          end,
          { x: back.x + px * headSize * 0.42, y: back.y + py * headSize * 0.42 },
          { x: back.x - px * headSize * 0.42, y: back.y - py * headSize * 0.42 },
        ]
      : [
          end,
          back,
          { x: back.x + px * headSize * 0.42, y: back.y + py * headSize * 0.42 },
        ]
  return {
    start,
    control,
    tip: end,
    shaftEnd,
    tangent: { x: tx, y: ty },
    head,
    kind,
  }
}

/** SVG path data for the shaft of an arrow (a quadratic curve from start to the head base). */
export function arrowShaftPath(g: ArrowGeometry): string {
  const f = (v: number) => v.toFixed(2)
  return `M ${f(g.start.x)} ${f(g.start.y)} Q ${f(g.control.x)} ${f(g.control.y)} ${f(g.shaftEnd.x)} ${f(g.shaftEnd.y)}`
}

/** SVG points attribute for the head polygon. */
export function arrowHeadPoints(g: ArrowGeometry): string {
  return g.head.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

/**
 * Anchor of an arrow on a drawn structure. A bond anchor is the point a fraction `t` along it,
 * so t = 0.5 is the midpoint of a pi bond.
 */
export function bondAnchor(a: Point, b: Point, t = 0.5): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** Anchor a distance `radius` from an atom, along direction `angle` (radians, y down). */
export function lonePairAnchor(atom: Point, angle: number, radius: number): Point {
  return { x: atom.x + radius * Math.cos(angle), y: atom.y + radius * Math.sin(angle) }
}
