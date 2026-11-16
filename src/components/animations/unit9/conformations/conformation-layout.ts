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

/**
 * Sawhorse geometry: a true oblique (cavalier) projection of the 3D ethane model. The front carbon is at the origin
 * and the back carbon at z = L along the C–C axis, in C–H units. Each front H is at (r cos φ, r sin φ, −h) and each
 * back H at (r cos(φ + θ), r sin(φ + θ), L + h), with θ the dihedral and φ = 15°, 135°, 255°. The projection is
 * X = x + z cos 40°, Y = y + z sin 40°, so depth runs obliquely up and to the right, and the screen Y is flipped.
 * At θ = 0 each back H therefore sits directly behind its front partner, offset only by the depth term 2h.
 */
export const SAWHORSE_R = 1.03
export const SAWHORSE_H = 0.36
export const SAWHORSE_LENGTH = 2.2
export const SAWHORSE_DEPTH_DEG = 40
/** The labels sit this many times as far from the carbon as the H atoms do. */
export const SAWHORSE_LABEL_FACTOR = 1.35
/** Azimuths of the front hydrogens about the C–C axis, degrees. */
export const SAWHORSE_AZIMUTHS = [15, 135, 255] as const
/** Pixels per C–H unit in the sawhorse drawing. */
export const SAWHORSE_BOND = 55

type Vec3 = [number, number, number]

/** The 3D position of each H of ethane in the sawhorse frame, scaled by `k` (1 for the atoms, 1.35 for labels). */
function sawhorse3D(dihedralDeg: number, k: number): { front: Vec3[]; back: Vec3[] } {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const r = SAWHORSE_R * k
  const h = SAWHORSE_H * k
  const L = SAWHORSE_LENGTH
  const front = SAWHORSE_AZIMUTHS.map((p): Vec3 => [r * cosD(p), r * sinD(p), -h])
  const back = SAWHORSE_AZIMUTHS.map((p): Vec3 => [r * cosD(p + dihedralDeg), r * sinD(p + dihedralDeg), L + h])
  return { front, back }
}

const cosD = (d: number) => Math.cos((d * Math.PI) / 180)
const sinD = (d: number) => Math.sin((d * Math.PI) / 180)

/** The oblique projection of a 3D point to screen units, with the Y axis pointing down as in SVG. */
function project(p: Vec3): Pt {
  const dx = cosD(SAWHORSE_DEPTH_DEG)
  const dy = sinD(SAWHORSE_DEPTH_DEG)
  const X = p[0] + p[2] * dx
  const Y = p[1] + p[2] * dy
  return { x: X, y: -Y }
}

/**
 * The projected bond vectors of the sawhorse at a dihedral, in C–H units (screen, SVG orientation): from each carbon
 * to its three hydrogens. Front and back vectors are the atoms' own, not the labels'.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function sawhorseVectors(dihedralDeg: number): { front: Pt[]; back: Pt[] } {
  const { front, back } = sawhorse3D(dihedralDeg, 1)
  const L = project([0, 0, SAWHORSE_LENGTH])
  return {
    front: front.map((p) => project(p)),
    back: back.map((p) => ({ x: project(p).x - L.x, y: project(p).y - L.y })),
  }
}

/**
 * The sawhorse at a dihedral in pixels. The front carbon is the origin (lower left) and the back carbon lies up and
 * to the right. Each H label sits at SAWHORSE_LABEL_FACTOR times the H position, and every bond is cut back from
 * every label.
 *
 * @throws {RangeError} If the angle is not finite or the scale is not positive
 */
export function sawhorseLayout(dihedralDeg: number, bond = SAWHORSE_BOND): SawhorseLayout {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  if (!(bond > 0)) throw new RangeError('The bond length must be positive')
  const toPx = (p: Pt): Pt => ({ x: p.x * bond, y: p.y * bond })
  const atoms = sawhorse3D(dihedralDeg, 1)
  const labels3 = sawhorse3D(dihedralDeg, SAWHORSE_LABEL_FACTOR)
  const origin: Pt = toPx(project([0, 0, 0]))
  const back: Pt = toPx(project([0, 0, SAWHORSE_LENGTH]))
  const hLabels = [
    ...labels3.front.map((p) => toPx(project(p))),
    ...labels3.back.map((p) => toPx(project(p))),
  ]
  const labels: Glyph[] = hLabels.map((p) => ({ x: p.x, y: p.y, text: 'H' }))
  const centres = labels.map((l) => ({ x: l.x, y: l.y }))
  const frontEnds = atoms.front.map((p) => toPx(project(p)))
  const backEnds = atoms.back.map((p) => toPx(project(p)))
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
