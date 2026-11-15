/**
 * Pure 2D layout for the VSEPR Scrollies: where each atom disc and lone-pair lobe lands on the
 * panel, how far back it sits (back atoms are smaller and paler, back bonds thinner), and whether
 * any two shapes on the panel overlap. Nothing here touches the DOM, so the no-overlap rule is
 * tested in Node for every Step.
 */

import { forwardOf, type Pose, type V3 } from '@/lib/chem/vsepr-morph'

/** SVG width and height of a Scrolly panel, in units. */
export const PANEL_W = 560
export const PANEL_H = 350
/** Where the centre of the arrangement sits on the panel. */
const CX = PANEL_W / 2
const CY = 150
export { CX, CY }
/** The caption sits below this line; the molecule must fit above it. */
const DRAW_BOTTOM = 290

/** Atom disc radius at the front, in px at a bond length of one unit (the scale is set by fitScale). */
export const CENTRE_RADIUS = 0.2
export const LIGAND_RADIUS = 0.135
/**
 * Lone-pair lobe: a teardrop from the edge of the central atom out to its tip, in bond lengths.
 * It starts at the atom's edge, so the atom covers the base and only the drawn parts are compared.
 */
export const LOBE_BASE = CENTRE_RADIUS
export const LOBE_TIP = 0.98
/** Half the width of a lobe, in bond lengths. */
export const LOBE_HALF_WIDTH = 0.1
/**
 * Gap kept clear between two drawn parts, in px. Lobes are measured at their full half-width, but
 * they taper to a point at the atom, so 4 px here is a visible gap.
 */
export const CLEAR_GAP = 4

export interface Disc {
  x: number
  y: number
  /** Radius in px, after the depth scaling. */
  r: number
  /** 0 at the front of the arrangement, 1 at the back. */
  farness: number
  /** Opacity for depth cues: 1 at the front, lower at the back. */
  shade: number
}

export interface Lobe {
  x0: number
  y0: number
  x1: number
  y1: number
  /** Half the width of the lobe in px. */
  halfWidth: number
  farness: number
  shade: number
}

export interface Layout {
  centre: Disc
  ligands: Disc[]
  lobes: Lobe[]
  /** Projected direction of each bond, for the bond width cue. */
  bondFarness: number[]
}

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/**
 * Right and up hints for a view from camera position `view` looking at the origin. The hints
 * feed `basisFromHints`, so the drawing is an orthographic projection with an oblique view.
 */
export function viewHints(view: V3): { right: V3; up: V3 } {
  const len = Math.hypot(view[0], view[1], view[2])
  const f: V3 = [-view[0] / len, -view[1] / len, -view[2] / len]
  // right = forward × world-up, then up = right × forward (as cameraBasis in molecule/geometry).
  let right: V3 = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]
  let rl = Math.hypot(right[0], right[1], right[2])
  if (rl < 1e-9) right = [1, 0, 0]
  else right = [right[0] / rl, right[1] / rl, right[2] / rl]
  const up: V3 = [
    right[1] * f[2] - right[2] * f[1],
    right[2] * f[0] - right[0] * f[2],
    right[0] * f[1] - right[1] * f[0],
  ]
  return { right, up }
}

/** Farness of a point: 0 at the front (nearest the viewer), 1 at the back, for points within one unit. */
function farnessOf(depth: number): number {
  return Math.min(1, Math.max(0, (depth + 1) / 2))
}

/** Maps a point in pose space to panel coordinates and depth (positive = further from the viewer). */
export function projector(pose: Pose, px: number): (p: V3) => { x: number; y: number; depth: number } {
  const { right, up } = pose.basis
  const forward = forwardOf(pose.basis)
  return (p: V3) => ({ x: CX + dot(p, right) * px, y: CY - dot(p, up) * px, depth: dot(p, forward) })
}

/** The projected layout of a pose at `px` pixels per bond length. Deterministic. */
export function layoutPose(pose: Pose, px: number): Layout {
  const forward = forwardOf(pose.basis)
  const toPx = projector(pose, px)
  const disc = (p: V3, base: number): Disc => {
    const q = toPx(p)
    const f = farnessOf(q.depth)
    return { x: q.x, y: q.y, r: base * px * (1 - 0.14 * f), farness: f, shade: 1 - 0.4 * f }
  }

  const centre = disc([0, 0, 0], CENTRE_RADIUS)
  const ligands: Disc[] = []
  const bondFarness: number[] = []
  const lobes: Lobe[] = []
  for (const slot of pose.slots) {
    if (slot.kind === 'bond' && slot.scale > 0.001) {
      const p: V3 = [slot.dir[0] * slot.scale, slot.dir[1] * slot.scale, slot.dir[2] * slot.scale]
      ligands.push(disc(p, LIGAND_RADIUS))
      bondFarness.push(farnessOf(dot(p, forward)))
    } else if (slot.kind === 'lone') {
      const a = toPx(slot.dir.map((v) => v * LOBE_BASE) as V3)
      const b = toPx(slot.dir.map((v) => v * LOBE_TIP) as V3)
      const f = farnessOf((a.depth + b.depth) / 2)
      lobes.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, halfWidth: LOBE_HALF_WIDTH * px, farness: f, shade: 1 - 0.4 * f })
    }
  }
  return { centre, ligands, lobes, bondFarness }
}

/** Distance from point (px, py) to the segment (x0,y0)-(x1,y1). */
export function pointSegmentDistance(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0
  const dy = y1 - y0
  const l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2))
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))
}

/** Distance between two segments: the least of the four end-to-segment distances (they do not cross here). */
function segmentDistance(a: Lobe, b: Lobe): number {
  return Math.min(
    pointSegmentDistance(a.x0, a.y0, b.x0, b.y0, b.x1, b.y1),
    pointSegmentDistance(a.x1, a.y1, b.x0, b.y0, b.x1, b.y1),
    pointSegmentDistance(b.x0, b.y0, a.x0, a.y0, a.x1, a.y1),
    pointSegmentDistance(b.x1, b.y1, a.x0, a.y0, a.x1, a.y1)
  )
}

/**
 * Every pair of drawn things that come closer than their clearance: two atom discs, an atom and a
 * lobe, or two lobes. An empty list means the drawing is clean. Each entry names the two parts.
 */
export function overlaps(layout: Layout): string[] {
  const out: string[] = []
  const discs: { name: string; d: Disc }[] = [{ name: 'centre', d: layout.centre }]
  layout.ligands.forEach((d, i) => discs.push({ name: `ligand ${i}`, d }))
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      const a = discs[i]
      const b = discs[j]
      const gap = Math.hypot(a.d.x - b.d.x, a.d.y - b.d.y) - (a.d.r + b.d.r)
      if (gap < CLEAR_GAP) out.push(`${a.name} / ${b.name} (gap ${gap.toFixed(1)}px)`)
    }
  }
  layout.lobes.forEach((lobe, k) => {
    for (const { name, d } of discs.slice(1)) {
      const gap = pointSegmentDistance(d.x, d.y, lobe.x0, lobe.y0, lobe.x1, lobe.y1) - (d.r + lobe.halfWidth)
      if (gap < CLEAR_GAP) out.push(`lobe ${k} / ${name} (gap ${gap.toFixed(1)}px)`)
    }
    layout.lobes.forEach((other, m) => {
      if (m <= k) return
      const gap = segmentDistance(lobe, other) - (lobe.halfWidth + other.halfWidth)
      if (gap < CLEAR_GAP) out.push(`lobe ${k} / lobe ${m} (gap ${gap.toFixed(1)}px)`)
    })
  })
  return out
}

/**
 * The bond length in px that fits every pose on the panel: the widest arrangement takes at most
 * `widthFraction` of the panel width, and the tallest fits the drawing area. One scale for all
 * Steps, so the morph between them keeps a constant size.
 */
export function fitScale(poses: Pose[], widthFraction = 0.65): number {
  let scaleX = Infinity
  let scaleY = Infinity
  for (const pose of poses) {
    const layout = layoutPose(pose, 1)
    const xs: number[] = [layout.centre.x]
    const ys: number[] = [layout.centre.y]
    layout.ligands.forEach((d) => {
      xs.push(d.x - LIGAND_RADIUS, d.x + LIGAND_RADIUS)
      ys.push(d.y - LIGAND_RADIUS, d.y + LIGAND_RADIUS)
    })
    layout.lobes.forEach((l) => {
      xs.push(l.x1 - LOBE_HALF_WIDTH, l.x1 + LOBE_HALF_WIDTH)
      ys.push(l.y1 - LOBE_HALF_WIDTH, l.y1 + LOBE_HALF_WIDTH)
    })
    const spanX = Math.max(...xs) - Math.min(...xs)
    const spanY = Math.max(...ys) - Math.min(...ys)
    if (spanX > 1e-9) scaleX = Math.min(scaleX, (widthFraction * PANEL_W) / spanX)
    if (spanY > 1e-9) scaleY = Math.min(scaleY, ((DRAW_BOTTOM - 30) / spanY))
  }
  return Math.min(scaleX, scaleY)
}
