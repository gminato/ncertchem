/**
 * Pure drawing helpers shared by the Unit 8 structure components: the SVG frame of a molecule,
 * bond segments (single, double, triple, ring-offset, wedge, dash), atom label text and
 * lone-pair positions. Pixel coordinates, y pointing down, origin at the centre of the drawing.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  adjacency,
  boundingBox,
  findRings,
  freeAngle,
  layout2D,
  type Point,
} from './layout'

/** Pixels per bond length in bond-line drawings. */
export const DEFAULT_SCALE = 54

/** Shortening at a labelled heteroatom, in bond lengths. */
export const LABEL_GAP = 0.3

/** Group valence electrons used for lone-pair counts. */
const GROUP_ELECTRONS: Record<string, number> = {
  O: 6,
  S: 6,
  N: 5,
  P: 5,
  F: 7,
  Cl: 7,
  Br: 7,
  I: 7,
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Frame {
  scale: number
  adj: number[][]
  /** Atom positions in pixels (y down), centred on the origin. */
  points: Point[]
  rings: number[][]
  ringCentres: Point[]
  /** Viewbox-style bounds of the drawing, including label room. */
  bounds: Bounds
}

export function drawingFrame(g: MolGraph, scale = DEFAULT_SCALE): Frame {
  const adj = adjacency(g)
  const lay = layout2D(g)
  const box = boundingBox(lay)
  const cx = (box.minX + box.maxX) / 2
  const cy = (box.minY + box.maxY) / 2
  const points = lay.map((p) => ({ x: (p.x - cx) * scale, y: -(p.y - cy) * scale }))
  const pad = 0.6 * scale
  const width = box.width * scale + 2 * pad
  const height = box.height * scale + 2 * pad
  const rings = findRings(g)
  const ringCentres = rings.map((r) => {
    const s = r.reduce((acc, a) => ({ x: acc.x + points[a].x, y: acc.y + points[a].y }), { x: 0, y: 0 })
    return { x: s.x / r.length, y: s.y / r.length }
  })
  return {
    scale,
    adj,
    points,
    rings,
    ringCentres,
    bounds: { x: -width / 2, y: -height / 2, width, height },
  }
}

/** Heteroatoms get a text label (and their hydrogens); carbon is a vertex. */
export function isLabelled(element: string): boolean {
  return element !== 'C'
}

export interface LabelRun {
  text: string
  script?: 'sub' | 'sup'
}

/**
 * Text runs for an atom label. Hydrogens follow the element when the bonds come from the left
 * (OH, NH2) and precede it when they come from the right (HO, H2N), as in a textbook drawing.
 */
export function labelRuns(element: string, hCount: number, hFirst: boolean): LabelRun[] {
  const el: LabelRun[] = [{ text: element }]
  if (hCount <= 0) return el
  const h: LabelRun[] = [{ text: 'H' }]
  if (hCount > 1) h.push({ text: String(hCount), script: 'sub' })
  return hFirst ? [...h, ...el] : [...el, ...h]
}

/** True when the atom's neighbours lie mostly to its right, so the label should read HO. */
export function hydrogensFirst(points: readonly Point[], adj: readonly number[][], a: number): boolean {
  if (adj[a].length === 0) return false
  const dx = adj[a].reduce((s, q) => s + (points[q].x - points[a].x), 0)
  return dx > 1e-6
}

/** Charge as text: +, −, 2+, 2−, using a true minus sign. */
export function chargeText(charge: number): string {
  const sign = charge > 0 ? '+' : '−'
  const mag = Math.abs(charge)
  return mag === 1 ? sign : `${mag}${sign}`
}

/** Lone electron pairs of an atom from its group, charge, bonds and hydrogens. */
export function lonePairCount(element: string, charge: number, bondOrderSum: number, hCount: number, radical = 0): number {
  const group = GROUP_ELECTRONS[element]
  if (group === undefined) return 0
  const ne = group - charge - bondOrderSum - hCount - radical
  return Math.max(0, Math.floor(ne / 2))
}

/** Directions (radians) of an atom's lone pairs, spread around its free side. */
export function lonePairAngles(points: readonly Point[], adj: readonly number[][], a: number, count: number): number[] {
  if (count <= 0) return []
  const base = freeAngle(points, adj, a)
  const step = 0.95
  return Array.from({ length: count }, (_, i) => base + (i - (count - 1) / 2) * step)
}

/** The point on a lone pair of atom `a`, a radius out along angle `th`. */
export function lonePairPoint(p: Point, th: number, radius: number): Point {
  return { x: p.x + radius * Math.cos(th), y: p.y + radius * Math.sin(th) }
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface BondSegmentOptions {
  /** Shortening at each end, in pixels. */
  shrinkA?: number
  shrinkB?: number
  /** Centre of the ring the bond belongs to, for an inner double-bond line. */
  ringCentre?: Point
  /** Distance between the lines of a double or triple bond, in pixels. */
  spacing?: number
}

function unit(p: Point, q: Point): { ux: number; uy: number; len: number } {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  return { ux: dx / len, uy: dy / len, len }
}

/** Line segments that draw one bond (order 1, 2 or 3) from p to q. */
export function bondSegments(p: Point, q: Point, order: 1 | 2 | 3, opts: BondSegmentOptions = {}): Segment[] {
  const { ux, uy, len } = unit(p, q)
  const sA = opts.shrinkA ?? 0
  const sB = opts.shrinkB ?? 0
  const nx = -uy
  const ny = ux
  const spacing = opts.spacing ?? 9
  // A line offset by `off` across the bond, starting `a` and ending `b` pixels inside the ends.
  const seg = (off: number, a: number, b: number): Segment => ({
    x1: p.x + ux * (sA + a) + nx * off,
    y1: p.y + uy * (sA + a) + ny * off,
    x2: p.x + ux * (len - sB - b) + nx * off,
    y2: p.y + uy * (len - sB - b) + ny * off,
  })
  if (order === 1) return [seg(0, 0, 0)]
  if (order === 3) return [seg(0, 0, 0), seg(spacing * 1.1, 0, 0), seg(-spacing * 1.1, 0, 0)]
  if (opts.ringCentre) {
    // Inside a ring: the full bond plus a shorter line on the side facing the ring centre.
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
    const side = (opts.ringCentre.x - mid.x) * nx + (opts.ringCentre.y - mid.y) * ny
    const sign = side >= 0 ? 1 : -1
    const inset = 0.16 * len
    return [seg(0, 0, 0), seg(sign * spacing * 1.6, inset, inset)]
  }
  // A chain double bond is centred on its axis.
  return [seg(spacing * 0.5, 0, 0), seg(-spacing * 0.5, 0, 0)]
}

/**
 * Wedge (towards the viewer) or dash (away) from p, the stereocentre, to q. Returns an SVG path
 * for a wedge (a filled triangle) or a hatched line for a dash.
 */
export function stereoPath(p: Point, q: Point, kind: 'wedge' | 'dash', halfWidth: number): string {
  const { ux, uy } = unit(p, q)
  const nx = -uy
  const ny = ux
  if (kind === 'wedge') {
    const a = `${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    const b = `${(q.x + nx * halfWidth).toFixed(2)} ${(q.y + ny * halfWidth).toFixed(2)}`
    const c = `${(q.x - nx * halfWidth).toFixed(2)} ${(q.y - ny * halfWidth).toFixed(2)}`
    return `M ${a} L ${b} L ${c} Z`
  }
  const parts: string[] = []
  const steps = 5
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1)
    const cx = p.x + (q.x - p.x) * (0.25 + 0.7 * t)
    const cy = p.y + (q.y - p.y) * (0.25 + 0.7 * t)
    const w = halfWidth * t
    parts.push(`M ${(cx + nx * w).toFixed(2)} ${(cy + ny * w).toFixed(2)} L ${(cx - nx * w).toFixed(2)} ${(cy - ny * w).toFixed(2)}`)
  }
  return parts.join(' ')
}

/** Point a fraction t of the way from p to q. */
export function along(p: Point, q: Point, t = 0.5): Point {
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }
}

/** Bonds of a graph with the pixel-distance each end is shortened by (labels). */
export function shrinkFor(element: string, scale: number): number {
  return isLabelled(element) ? LABEL_GAP * scale : 0
}

/** An SVG viewBox string for bounds, e.g. for a parent svg. */
export function viewBoxOf(b: Bounds, grow = 0): string {
  return `${b.x - grow} ${b.y - grow} ${b.width + 2 * grow} ${b.height + 2 * grow}`
}
