/**
 * Layout of the Newman and sawhorse drawings of ethane for Section 9.2.4, in SVG units (px at the
 * drawing's own size). Every H label is kept LABEL_KNOCKOUT from every bond, and every carbon label is
 * placed at the clearest of 24 candidate positions around its carbon, so no label touches a bond or
 * another label. The geometry of the bonds comes from the shared hydrocarbon-geometry module.
 */

import { distToSegment, segmentOutside, sawhorseGeometry, type Pt, type Seg } from '@/components/organic'

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
  /** H labels, then the two C labels (front carbon first). */
  labels: Glyph[]
  frontCarbon: Pt
  backCarbon: Pt
}

/** The clearest candidate for a carbon label: the one farthest from every drawn bond and every H label. */
function carbonLabelSpot(carbon: Pt, bonds: readonly DrawnBond[], hydrogens: readonly Pt[], radius: number): Pt {
  let best = polar(radius, 0)
  let bestClear = -Infinity
  for (let k = 0; k < 24; k++) {
    const offset = polar(radius, k * 15)
    const p = { x: carbon.x + offset.x, y: carbon.y + offset.y }
    const clear = Math.min(
      ...bonds.map((b) => distToSegment(p, b.seg)),
      ...hydrogens.map((h) => Math.hypot(p.x - h.x, p.y - h.y))
    )
    if (clear > bestClear) {
      bestClear = clear
      best = p
    }
  }
  return { x: best.x, y: best.y }
}

/**
 * The sawhorse at a dihedral, with the bond length in units (the sawhorse is drawn from the front carbon at
 * the origin). The H labels are at the ends of their bonds and every bond is cut back from them. The two C
 * labels sit at the clearest spot beside each carbon.
 *
 * @throws {RangeError} If the angle is not finite or the bond length is not positive
 */
export function sawhorseLayout(dihedralDeg: number, bond: number): SawhorseLayout {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  if (!(bond > 0)) throw new RangeError('The bond length must be positive')
  const g = sawhorseGeometry(dihedralDeg)
  const P = (p: Pt): Pt => ({ x: p.x * bond, y: p.y * bond })
  const origin: Pt = { x: 0, y: 0 }
  const back = P(g.back)
  // Each H label sits beyond the end of its bond, further out where a neighbouring label would crowd it.
  const hBonds = [...g.front, ...g.backBonds]
  const hydrogens: Pt[] = []
  for (const b of hBonds) {
    const start = P(b.from)
    const len = Math.hypot(P(b.to).x - start.x, P(b.to).y - start.y)
    const at = (f: number): Pt => ({ x: start.x + b.dir.x * len * f, y: start.y + b.dir.y * len * f })
    const pick = LABEL_FACTORS.map(at).find((c) => hydrogens.every((h) => Math.hypot(c.x - h.x, c.y - h.y) >= LABEL_KNOCKOUT + GLYPH_RADIUS)) ?? at(LABEL_FACTORS[0])
    hydrogens.push(pick)
  }
  const raw: DrawnBond[] = [
    { seg: { a: origin, b: back }, kind: 'axis' },
    ...g.front.map((b) => ({ seg: { a: origin, b: P(b.to) }, kind: 'front' as const })),
    ...g.backBonds.map((b) => ({ seg: { a: back, b: P(b.to) }, kind: 'back' as const })),
  ]
  const bonds = raw.flatMap((b) => segmentOutside(b.seg, hydrogens, LABEL_KNOCKOUT).map((seg) => ({ seg, kind: b.kind })))
  const labels: Glyph[] = hydrogens.map((h) => ({ x: h.x, y: h.y, text: 'H' }))
  const frontC = carbonLabelSpot(origin, bonds, hydrogens, 30)
  const backC = carbonLabelSpot(back, bonds, hydrogens, 30)
  return {
    bonds,
    labels: [...labels, { x: frontC.x, y: frontC.y, text: 'C' }, { x: backC.x, y: backC.y, text: 'C' }],
    frontCarbon: origin,
    backCarbon: back,
  }
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

/** Label distances along a bond, as multiples of its length: the first that clears the others is used. */
const LABEL_FACTORS = [1.6, 1.8, 2.0, 2.2, 2.4, 2.6] as const

/** The bond length, in units, of the sawhorse drawing: its width then fits a 330-unit panel at about 1:1. */
export const SAWHORSE_BOND = 60
