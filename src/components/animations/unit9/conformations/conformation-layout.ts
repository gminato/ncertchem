/**
 * Layout of the Newman and sawhorse drawings of ethane for Section 9.2.4, in SVG units (px at the
 * drawing's own size). Every H label is kept LABEL_KNOCKOUT from every bond, and every carbon label is
 * placed at the clearest of 24 candidate positions around its carbon, so no label touches a bond or
 * another label. The geometry of the bonds comes from the shared hydrocarbon-geometry module.
 */

import { distToSegment, segmentOutside, type Pt, type Seg } from '@/components/organic'

const DEG = Math.PI / 180

/** Half the size of an H or C glyph, in units. A label circle of this radius is what a bond must clear. */
export const GLYPH_RADIUS = 11
/** The clear gap required between a glyph and any bond or other glyph. */
export const CLEARANCE = 4
/** A bond may not come nearer than this to any label centre. */
export const LABEL_KNOCKOUT = GLYPH_RADIUS + CLEARANCE

/** Newman geometry in units: the circle of the rear carbon has radius `rim`. */
export const NEWMAN_UNITS = {
  rim: 70,
  frontBondEnd: 84,
  backBondStart: 70,
  backBondEnd: 112,
  frontLabel: 102,
  backLabel: 130,
  /** At eclipse the rear bonds are turned this far clear of the front bonds. */
  eclipseNudge: 14,
} as const

/** Front bond angles in SVG degrees (top, lower right, lower left), as in the shared Newman drawing. */
export const NEWMAN_FRONT_DEG = [-90, 30, 150] as const

export interface Glyph {
  x: number
  y: number
  text: string
}

export interface DrawnBond {
  seg: Seg
  kind: 'front' | 'back' | 'axis'
}

export interface NewmanLayout {
  bonds: DrawnBond[]
  labels: Glyph[]
}

const polar = (r: number, deg: number): Pt => ({ x: r * Math.cos(deg * DEG), y: r * Math.sin(deg * DEG) })

/**
 * The Newman projection at a dihedral: front bonds from the centre, rear bonds from the rim, each bond
 * cut back so it keeps LABEL_KNOCKOUT from every label. The rear angle is front + dihedral + the eclipse
 * nudge, which is largest at 0° and 120° and zero at 60°.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function newmanLayout(dihedralDeg: number, front: readonly [string, string, string] = ['H', 'H', 'H'], back: readonly [string, string, string] = ['H', 'H', 'H']): NewmanLayout {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const weight = (1 + Math.cos(3 * dihedralDeg * DEG)) / 2
  const nudge = NEWMAN_UNITS.eclipseNudge * weight
  const origin = { x: 0, y: 0 }
  const frontRaw = NEWMAN_FRONT_DEG.map((a) => ({
    seg: { a: origin, b: polar(NEWMAN_UNITS.frontBondEnd, a) },
    label: polar(NEWMAN_UNITS.frontLabel, a),
  }))
  const backRaw = NEWMAN_FRONT_DEG.map((a0) => {
    const a = a0 + dihedralDeg + nudge
    return { seg: { a: polar(NEWMAN_UNITS.backBondStart, a), b: polar(NEWMAN_UNITS.backBondEnd, a) }, label: polar(NEWMAN_UNITS.backLabel, a) }
  })
  const labels: Glyph[] = [
    ...frontRaw.map((f, i) => ({ x: f.label.x, y: f.label.y, text: front[i] })),
    ...backRaw.map((b, i) => ({ x: b.label.x, y: b.label.y, text: back[i] })),
  ]
  const centres = labels.map((l) => ({ x: l.x, y: l.y }))
  const bonds: DrawnBond[] = [
    ...frontRaw.flatMap((f) => segmentOutside(f.seg, centres, LABEL_KNOCKOUT).map((seg) => ({ seg, kind: 'front' as const }))),
    ...backRaw.flatMap((b) => segmentOutside(b.seg, centres, LABEL_KNOCKOUT).map((seg) => ({ seg, kind: 'back' as const }))),
  ]
  return { bonds, labels }
}

export interface SawhorseLayout {
  bonds: DrawnBond[]
  /** The six H labels: the front three, then the back three. */
  labels: Glyph[]
  frontCarbon: Pt
  backCarbon: Pt
}

/** Sawhorse C–H bond length in units; the C–C bond is SAWHORSE_AXIS_RATIO times this (the textbook convention). */
export const SAWHORSE_BOND = 60
export const SAWHORSE_AXIS_RATIO = 1.6
/** Direction of the C–C bond on screen, SVG degrees: the back carbon is up and to the right. */
export const SAWHORSE_AXIS_DEG = -35
/**
 * Front C–H directions, SVG degrees. Chosen 30° from the C–C axis and 120° apart, so no bond runs along the axis
 * at eclipse or staggered. The back bonds start from the same directions turned by the dihedral.
 */
export const SAWHORSE_FRONT_DEG = [355, 115, 235] as const

/**
 * Screen directions of the sawhorse's bonds at a dihedral, SVG degrees. At 0° each back bond has the same
 * direction as the front bond it hides (eclipsed, as NCERT Fig. 9.4); at 60° each back bond lies midway between
 * two front bonds, 60° from its front partner (staggered).
 *
 * @throws {RangeError} If the angle is not finite
 */
export function sawhorseDirections(dihedralDeg: number): { front: number[]; back: number[] } {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  return {
    front: [...SAWHORSE_FRONT_DEG],
    back: SAWHORSE_FRONT_DEG.map((a) => a + dihedralDeg),
  }
}

/**
 * The sawhorse at a dihedral. The front carbon is the origin (lower left), the back carbon lies one C–C bond up
 * and to the right, and each carbon has three C–H bonds of SAWHORSE_BOND units. Each H label sits beyond the end
 * of its bond, further out where a neighbour would crowd it, and every bond is cut back from every label.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function sawhorseLayout(dihedralDeg: number, bond = SAWHORSE_BOND): SawhorseLayout {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  if (!(bond > 0)) throw new RangeError('The bond length must be positive')
  const dirs = sawhorseDirections(dihedralDeg)
  const origin: Pt = { x: 0, y: 0 }
  const back = polar(bond * SAWHORSE_AXIS_RATIO, SAWHORSE_AXIS_DEG)
  const offset = bond + LABEL_OFFSET
  const place = (from: Pt, deg: number, len: number): Pt => ({ x: from.x + len * Math.cos(deg * DEG), y: from.y + len * Math.sin(deg * DEG) })
  const frontEnds = dirs.front.map((d) => place(origin, d, bond))
  const backEnds = dirs.back.map((d) => place(back, d, bond))
  const labels: Glyph[] = [
    ...dirs.front.map((d) => ({ ...place(origin, d, offset), text: 'H' })),
    ...dirs.back.map((d) => ({ ...place(back, d, offset), text: 'H' })),
  ]
  const centres = labels.map((l) => ({ x: l.x, y: l.y }))
  const raw: DrawnBond[] = [
    { seg: { a: origin, b: back }, kind: 'axis' },
    ...frontEnds.map((b) => ({ seg: { a: origin, b }, kind: 'front' as const })),
    ...backEnds.map((b) => ({ seg: { a: back, b }, kind: 'back' as const })),
  ]
  const bonds = raw.flatMap((b) => segmentOutside(b.seg, centres, LABEL_KNOCKOUT).map((seg) => ({ seg, kind: b.kind })))
  return { bonds, labels, frontCarbon: origin, backCarbon: back }
}

/**
 * The bounding box of the sawhorse over every dihedral, at a bond length, padded for its labels. The viewBox of
 * the drawing is this box, so the drawing does not clip as it turns.
 */
export function sawhorseViewBox(bond: number): { x: number; y: number; width: number; height: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  const grow = (p: Pt) => {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  for (let d = 0; d <= 360; d += 3) {
    const l = sawhorseLayout(d, bond)
    l.bonds.forEach((b) => {
      grow(b.seg.a)
      grow(b.seg.b)
    })
    l.labels.forEach(grow)
  }
  const pad = 22
  return { x: minX - pad, y: minY - pad, width: maxX - minX + 2 * pad, height: maxY - minY + 2 * pad }
}

/** How far an H label sits beyond the end of its bond, in units. */
const LABEL_OFFSET = 26
