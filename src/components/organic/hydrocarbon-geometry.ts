/**
 * Pure geometry for the Unit 9 hydrocarbon drawings: conformations (Newman and sawhorse),
 * the torsional energy plot, reaction-scheme layout, benzene ring positions and the stage
 * interpolation of the mechanisms. No React here, so every rule can be tested directly.
 * Screen coordinates: x to the right, y down, origin at the centre of the drawing unless stated.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { skeletalBounds } from './SkeletalFormula'

export interface Pt {
  x: number
  y: number
}

const DEG = Math.PI / 180

/** Clamp to 0..1. */
export function unitClamp(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Reveal fraction of an element that appears between `start` and `end` of a 0..1 progress. */
export function revealFraction(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0
  return unitClamp((progress - start) / (end - start))
}

/** Wraps an angle to [0, 360). */
export function wrapDegrees(d: number): number {
  const r = d % 360
  return r < 0 ? r + 360 : r
}

// ---------------------------------------------------------------------------------------------
// Label clearance (shared by the Newman and sawhorse drawings)
// ---------------------------------------------------------------------------------------------

/** Radius of the disc that bounds a label (covers a two-character substituent such as CH₃ at 18 px). */
export const LABEL_RADIUS = 16
/** Minimum gap between a bond and a label's disc, in drawing units. */
export const LABEL_CLEARANCE = 4
/** Bonds are cut back so they stay this far from every label centre. */
export const LABEL_KNOCKOUT = LABEL_RADIUS + LABEL_CLEARANCE

export interface Seg {
  a: Pt
  b: Pt
}

/** The parts of a segment that lie outside every disc (centre list, radius r). Used to knock bonds out behind labels. */
export function segmentOutside(seg: Seg, centres: readonly Pt[], r: number): Seg[] {
  const dx = seg.b.x - seg.a.x
  const dy = seg.b.y - seg.a.y
  const A = dx * dx + dy * dy
  if (A < 1e-12) return []
  const intervals: Array<[number, number]> = []
  for (const c of centres) {
    const fx = seg.a.x - c.x
    const fy = seg.a.y - c.y
    const B = 2 * (dx * fx + dy * fy)
    const C = fx * fx + fy * fy - r * r
    const disc = B * B - 4 * A * C
    if (disc <= 0) continue
    const root = Math.sqrt(disc)
    const t1 = Math.max(0, (-B - root) / (2 * A))
    const t2 = Math.min(1, (-B + root) / (2 * A))
    if (t2 > t1) intervals.push([t1, t2])
  }
  intervals.sort((u, v) => u[0] - v[0])
  const merged: Array<[number, number]> = []
  for (const iv of intervals) {
    const last = merged[merged.length - 1]
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
    else merged.push([iv[0], iv[1]])
  }
  const out: Seg[] = []
  let t = 0
  for (const [t1, t2] of merged) {
    if (t1 > t) out.push(sub(seg, t, t1))
    t = Math.max(t, t2)
  }
  if (t < 1) out.push(sub(seg, t, 1))
  return out.filter((g) => Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) > 1e-6)
}

function sub(seg: Seg, t0: number, t1: number): Seg {
  const at = (t: number) => ({ x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t })
  return { a: at(t0), b: at(t1) }
}

/** Shortest distance from a point to a segment. */
export function distToSegment(p: Pt, seg: Seg): number {
  const dx = seg.b.x - seg.a.x
  const dy = seg.b.y - seg.a.y
  const len2 = dx * dx + dy * dy || 1
  const t = Math.min(1, Math.max(0, ((p.x - seg.a.x) * dx + (p.y - seg.a.y) * dy) / len2))
  return Math.hypot(seg.a.x + dx * t - p.x, seg.a.y + dy * t - p.y)
}

// ---------------------------------------------------------------------------------------------
// Newman projection
// ---------------------------------------------------------------------------------------------

/** Front bonds at 90°-spaced thirds, top first: top, lower right, lower left (SVG angles). */
export const NEWMAN_FRONT_ANGLES: readonly number[] = [-90, 30, 150]

/** Lengths in px for the Newman drawing. The back circle has radius `rim`. */
export const NEWMAN = {
  rim: 46,
  frontLen: 60,
  backLen: 100,
  frontLabel: 84,
  backLabel: 120,
  /** Eclipsed back bonds are nudged this many degrees so they stay visible beside the front bonds. */
  eclipseNudge: 9,
} as const

/** 1 at the eclipsed dihedrals (0, 120, 240), 0 at the staggered ones (60, 180, 300). Smooth in between. */
export function eclipseWeight(dihedral: number): number {
  return (1 + Math.cos(3 * dihedral * DEG)) / 2
}

/**
 * Angles (degrees, SVG) of the three back bonds for a dihedral. At 0 they sit on the front
 * bonds (nudged clockwise so both stay visible); at 60 they sit in the gaps between them.
 */
export function newmanBackAngles(dihedral: number): number[] {
  const nudge = NEWMAN.eclipseNudge * eclipseWeight(dihedral)
  return NEWMAN_FRONT_ANGLES.map((a) => a + dihedral + nudge)
}

export interface NewmanBond {
  /** Bond angle in degrees (SVG). */
  angle: number
  /** Where the bond starts (front: centre; back: on the rim). */
  from: Pt
  /** Where the bond stops. */
  to: Pt
  /** Where the label sits (its centre). */
  label: Pt
}

function polar(r: number, angleDeg: number): Pt {
  return { x: r * Math.cos(angleDeg * DEG), y: r * Math.sin(angleDeg * DEG) }
}

/**
 * The bonds of a Newman projection as drawn: each bond cut back so it keeps `LABEL_KNOCKOUT` from
 * every label centre (a bond passing behind a label disappears behind it).
 */
export function newmanRendered(dihedral: number): { front: Seg[]; back: Seg[]; labels: Pt[] } {
  const g = newmanGeometry(dihedral)
  const labels = [...g.front.map((b) => b.label), ...g.back.map((b) => b.label)]
  const cut = (bonds: NewmanBond[]) => bonds.flatMap((b) => segmentOutside({ a: b.from, b: b.to }, labels, LABEL_KNOCKOUT))
  return { front: cut(g.front), back: cut(g.back), labels }
}

/** Geometry of a Newman projection at a dihedral (degrees). Origin at the front carbon. */
export function newmanGeometry(dihedral: number): { front: NewmanBond[]; back: NewmanBond[] } {
  const front = NEWMAN_FRONT_ANGLES.map((angle) => ({
    angle,
    from: { x: 0, y: 0 },
    to: polar(NEWMAN.frontLen, angle),
    label: polar(NEWMAN.frontLabel, angle),
  }))
  const back = newmanBackAngles(dihedral).map((angle) => ({
    angle,
    from: polar(NEWMAN.rim, angle),
    to: polar(NEWMAN.backLen, angle),
    label: polar(NEWMAN.backLabel, angle),
  }))
  return { front, back }
}

/** Half-size of the Newman drawing's box (labels included), for a parent viewBox. */
export const NEWMAN_HALF = NEWMAN.backLabel + LABEL_RADIUS + 6

// ---------------------------------------------------------------------------------------------
// Sawhorse projection
// ---------------------------------------------------------------------------------------------

/** Tetrahedral angle between a C–C bond and a C–X bond on the same carbon, cos and sin. */
const TET_COS = Math.cos(109.47 * DEG)
const TET_SIN = Math.sin(109.47 * DEG)

/** Substituent azimuths on the front carbon: 30° clear of the C–C axis on screen (145° and 325°) in both the eclipsed and staggered forms. */
export const SAWHORSE_FRONT_ANGLES: readonly number[] = [55, 175, 295]

/** Screen direction of the C–C axis: back carbon lies up and to the right. */
const AXIS_DEG = 35
const AXIS = { c: Math.cos(AXIS_DEG * DEG), s: Math.sin(AXIS_DEG * DEG) }
/** Depth foreshortening of the C–C axis in the oblique projection. */
const DEPTH = 0.75
/** The back carbon sits this many bond lengths along the axis. */
export const SAWHORSE_AXIS_LENGTH = 2

/** Screen offset of a 3D point (x, y in the projection plane, z along the C–C axis), in bond lengths. */
function project(x: number, y: number, z: number): Pt {
  return { x: x + DEPTH * z * AXIS.c, y: y - DEPTH * z * AXIS.s }
}

export interface SawhorseBond {
  /** Screen start, in bond lengths, relative to the front carbon. */
  from: Pt
  /** Screen end, in bond lengths. */
  to: Pt
  /** Screen centre of the label, in bond lengths. */
  label: Pt
  /** Unit direction on screen. */
  dir: Pt
}

/**
 * Screen geometry of a sawhorse at a dihedral, in bond lengths. The front carbon is at the
 * origin (lower left of the drawing) and the back carbon is `SAWHORSE_AXIS_LENGTH` along the axis.
 */
export function sawhorseGeometry(dihedral: number): {
  back: Pt
  front: SawhorseBond[]
  backBonds: SawhorseBond[]
} {
  const toBond = (from: Pt, x: number, y: number, z: number): SawhorseBond => {
    const s = project(x, y, z)
    const len = Math.hypot(s.x, s.y) || 1
    const dir = { x: s.x / len, y: s.y / len }
    const end = { x: from.x + s.x, y: from.y + s.y }
    return {
      from,
      to: end,
      dir,
      // The label sits 1.6 times the bond's screen length from its carbon: clear of its own bond's end.
      label: { x: from.x + s.x * 1.6, y: from.y + s.y * 1.6 },
    }
  }
  const origin = { x: 0, y: 0 }
  const back = project(0, 0, SAWHORSE_AXIS_LENGTH)

  const front = SAWHORSE_FRONT_ANGLES.map((phi) => {
    const x = TET_SIN * Math.cos(phi * DEG)
    const y = TET_SIN * Math.sin(phi * DEG)
    // Bond to the other carbon is +z; the substituent leans away from it, so z = TET_COS (negative).
    return toBond(origin, x, y, TET_COS)
  })
  const backBonds = SAWHORSE_FRONT_ANGLES.map((phi) => {
    const psi = (phi + dihedral) * DEG
    const x = TET_SIN * Math.cos(psi)
    const y = TET_SIN * Math.sin(psi)
    // From the back carbon the other carbon lies at -z, so the substituent leans to +z.
    return toBond(back, x, y, -TET_COS)
  })
  return { back, front, backBonds }
}

// ---------------------------------------------------------------------------------------------
// Torsional energy plot
// ---------------------------------------------------------------------------------------------

/** Ethane's torsional barrier in kJ/mol (eclipsed minus staggered), as NCERT gives it. */
export const ETHANE_BARRIER = 12.5

/** Ethane's energy at a dihedral (kJ/mol above the staggered minimum). */
export function ethaneTorsionalEnergy(dihedral: number): number {
  return (ETHANE_BARRIER / 2) * (1 + Math.cos(3 * dihedral * DEG))
}

export interface PlotBox {
  left: number
  top: number
  width: number
  height: number
  /** Energy at the bottom and top of the box. */
  eMin: number
  eMax: number
}

/** Maps a dihedral (0 to 360 degrees) to an x position inside the plot box. */
export function plotX(box: PlotBox, dihedral: number): number {
  return box.left + (dihedral / 360) * box.width
}

/** Maps an energy to a y position inside the plot box (higher energy is higher on screen). */
export function plotY(box: PlotBox, energy: number): number {
  const t = (energy - box.eMin) / (box.eMax - box.eMin)
  return box.top + box.height * (1 - t)
}

/** Samples an energy function at 1 degree steps and returns the curve as a polyline's points. */
export function sampleCurve(box: PlotBox, energy: (d: number) => number, step = 1): Pt[] {
  const pts: Pt[] = []
  for (let d = 0; d <= 360; d += step) {
    pts.push({ x: plotX(box, d), y: plotY(box, energy(d)) })
  }
  return pts
}

/** Local extremes of an energy curve on 0 to 360 degrees, classified as maxima (eclipsed) or minima (staggered). */
export function torsionalExtremes(energy: (d: number) => number): { maxima: number[]; minima: number[] } {
  const maxima: number[] = []
  const minima: number[] = []
  const n = 360
  for (let i = 0; i <= n; i += 1) {
    const prev = energy(((i - 1 + 360) % 360) as number)
    const here = energy(i % 360)
    const next = energy((i + 1) % 360)
    if (here > prev && here >= next) maxima.push(i)
    if (here < prev && here <= next) minima.push(i)
  }
  return { maxima, minima }
}

// ---------------------------------------------------------------------------------------------
// Reaction scheme layout
// ---------------------------------------------------------------------------------------------

/** A species in a reaction scheme: a drawn graph, or a plain formula such as 'HBr' or 'Br₂'. */
export interface SchemeSpecies {
  formula: MolGraph | string
  /** Small tag under the species, e.g. 'major' or 'minor'. */
  tag?: string
  /** Atoms that react, washed in the highlight colour (graph species only). */
  highlightAtoms?: readonly number[]
}

export interface SchemeArrow {
  /** Written above the arrow (reagents), e.g. 'HBr' or 'H₂O₂'. */
  reagents?: string
  /** Written below the arrow (conditions), e.g. '373 K, 10 atm'. */
  conditions?: string
  /** Draws a pair of harpoons, ⇌, for reversible steps. */
  equilibrium?: boolean
}

/** Alternating groups of species (joined with '+') and arrows. Starts and ends with a group. */
export type SchemePath = ReadonlyArray<readonly SchemeSpecies[] | SchemeArrow>

/** Font size of the reagent and condition labels above and below an arrow. */
export const SCHEME_FONT = 16
/** Font size of a plain-formula species such as HBr or Br₂. */
export const SCHEME_TEXT_SPECIES = 22
const TEXT_CHAR = 0.62 * SCHEME_TEXT_SPECIES
const PLUS_WIDTH = 34
const ARROW_MIN = 96
const ARROW_CHAR = 0.6 * SCHEME_FONT
/** Space between a species and the arrow that follows it. */
const ARROW_GAP_BEFORE = 14
const ROW_GAP = 14
const ROW_TOP = 44
const ROW_BOTTOM = 40
const TAG_HEIGHT = 24
const TEXT_SPECIES_HEIGHT = 30

/** Width of a plain formula. Subscript digits are narrower than capitals. */
export function formulaTextWidth(text: string): number {
  let w = 0
  for (const ch of text) {
    w += TEXT_CHAR * (/[₀-₉⁺⁻•]/.test(ch) ? 0.9 : 1)
  }
  return w
}

/** Width of a species at a bond-length scale: its drawn bounds, or the text estimate. */
export function speciesWidth(s: SchemeSpecies, scale: number): number {
  if (typeof s.formula === 'string') return formulaTextWidth(s.formula)
  return skeletalBounds(s.formula, scale).width
}

function speciesHeight(s: SchemeSpecies, scale: number): number {
  if (typeof s.formula === 'string') return TEXT_SPECIES_HEIGHT
  return skeletalBounds(s.formula, scale).height
}

function groupWidth(group: readonly SchemeSpecies[], scale: number): number {
  let w = 0
  group.forEach((s, i) => {
    if (i > 0) w += PLUS_WIDTH
    w += speciesWidth(s, scale)
  })
  return w
}

function arrowWidth(a: SchemeArrow): number {
  const longest = Math.max(a.reagents?.length ?? 0, a.conditions?.length ?? 0)
  return Math.max(ARROW_MIN, longest * ARROW_CHAR + 28)
}

/** A chunk is the unit that never breaks across rows: the first group, then each (arrow, group). */
interface Chunk {
  arrow?: SchemeArrow
  group: readonly SchemeSpecies[]
  width: number
}

function chunksOf(path: SchemePath, scale: number): Chunk[] {
  const chunks: Chunk[] = []
  let pendingArrow: SchemeArrow | undefined
  for (const el of path) {
    if (isArrow(el)) {
      pendingArrow = el
      continue
    }
    const group = el as readonly SchemeSpecies[]
    // An arrow chunk is: a gap, the arrow, a gap, then the group. The gaps are counted here so packing matches drawing.
    const width = (pendingArrow ? ARROW_GAP_BEFORE + arrowWidth(pendingArrow) + 20 : 0) + groupWidth(group, scale)
    chunks.push({ arrow: pendingArrow, group, width })
    pendingArrow = undefined
  }
  return chunks
}

export function isArrow(el: readonly SchemeSpecies[] | SchemeArrow): el is SchemeArrow {
  return !Array.isArray(el)
}

export interface SchemeLayoutItem {
  kind: 'species' | 'plus' | 'arrow'
  /** Index of the element in the path (for reveal order). */
  element: number
  /** Position of the element's left edge (species, plus) or its arrow's left end (arrow), in px, within the whole drawing. */
  x: number
  /** Row number, from 0. */
  row: number
  /** Centre line of the row's structures. */
  y: number
  width: number
  height: number
  /** For species: the species; for arrows: the arrow spec. */
  species?: SchemeSpecies
  arrow?: SchemeArrow
  /** Index of the species within its group. */
  indexInGroup?: number
}

export interface SchemeLayout {
  width: number
  height: number
  scale: number
  rows: number
  items: SchemeLayoutItem[]
  /** Row height in px, so the parent can place rows. */
  rowHeight: number
  /** Height of the tallest structure, so tags can sit below it. */
  structHeight: number
}

/**
 * Lays a scheme out to fit `maxWidth`. The largest scale that fits on one row wins; if none does,
 * the largest that fits on two rows. Rows are centred in the width.
 */
export function layoutReactionScheme(path: SchemePath, maxWidth: number, scales: readonly number[] = [56, 52, 48, 44, 40]): SchemeLayout {
  let oneRow: SchemeLayout | undefined
  let twoRows: SchemeLayout | undefined
  let smallest: SchemeLayout | undefined
  for (const scale of scales) {
    const layout = layoutAt(path, maxWidth, scale)
    smallest = layout
    if (layout.width > maxWidth) continue
    if (layout.rows === 1 && !oneRow) oneRow = layout
    if (layout.rows <= 2 && !twoRows) twoRows = layout
  }
  return oneRow ?? twoRows ?? smallest!
}

function layoutAt(path: SchemePath, maxWidth: number, scale: number): SchemeLayout {
  const chunks = chunksOf(path, scale)
  // Rows: greedy packing of chunks.
  const rowsOfChunks: Chunk[][] = []
  let current: Chunk[] = []
  let used = 0
  for (const c of chunks) {
    if (current.length > 0 && used + c.width > maxWidth) {
      rowsOfChunks.push(current)
      current = []
      used = 0
    }
    current.push(c)
    used += c.width
  }
  if (current.length > 0) rowsOfChunks.push(current)

  // Row height from the tallest structure in the whole scheme, so rows align.
  const structH = Math.max(
    TEXT_SPECIES_HEIGHT,
    ...path.filter((el) => !isArrow(el)).flatMap((g) => (g as readonly SchemeSpecies[]).map((s) => speciesHeight(s, scale)))
  )
  const hasTags = path.some((el) => !isArrow(el) && (el as readonly SchemeSpecies[]).some((s) => s.tag))
  const rowHeight = ROW_TOP + structH + ROW_BOTTOM + (hasTags ? TAG_HEIGHT : 0)

  const items: SchemeLayoutItem[] = []
  let elementIndex = 0
  const elementIndexOf = new Map<readonly SchemeSpecies[], number>()
  path.forEach((el, i) => {
    if (!isArrow(el)) elementIndexOf.set(el as readonly SchemeSpecies[], i)
  })

  let widest = 0
  const rowEnds: number[] = []
  rowsOfChunks.forEach((row, r) => {
    const rowY = r * (rowHeight + ROW_GAP) + ROW_TOP + structH / 2
    let x = 0
    row.forEach((chunk) => {
      if (chunk.arrow) {
        // Clear space between the reactant and the arrow, so reagent text never touches a species.
        x += ARROW_GAP_BEFORE
        const aw = arrowWidth(chunk.arrow)
        const arrowIdx = path.indexOf(chunk.arrow)
        items.push({ kind: 'arrow', element: arrowIdx, x, row: r, y: rowY, width: aw, height: structH, arrow: chunk.arrow })
        x += aw + 20
      }
      chunk.group.forEach((s, gi) => {
        if (gi > 0) {
          items.push({ kind: 'plus', element: elementIndexOf.get(chunk.group) ?? elementIndex, x, row: r, y: rowY, width: PLUS_WIDTH, height: structH })
          x += PLUS_WIDTH
        }
        const w = speciesWidth(s, scale)
        items.push({
          kind: 'species',
          element: elementIndexOf.get(chunk.group) ?? elementIndex,
          x,
          row: r,
          y: rowY,
          width: w,
          height: speciesHeight(s, scale),
          species: s,
          indexInGroup: gi,
        })
        x += w
      })
    })
    rowEnds.push(x)
    widest = Math.max(widest, x)
  })

  // Centre each row within the widest one, so a short row sits in the middle.
  for (const item of items) {
    const shift = (widest - rowEnds[item.row]) / 2
    item.x += shift
  }

  const rows = Math.max(1, rowsOfChunks.length)
  return {
    width: widest,
    height: rows * rowHeight + (rows - 1) * ROW_GAP,
    scale,
    rows,
    items,
    rowHeight,
    structHeight: structH,
  }
}

// ---------------------------------------------------------------------------------------------
// Benzene ring
// ---------------------------------------------------------------------------------------------

/**
 * The six vertices of a pointy-top hexagon of circumradius R. Index 0 is the top vertex and
 * indices run clockwise, so index i is ring position i + 1 in the usual numbering.
 */
export function benzeneVertices(R: number): Pt[] {
  return Array.from({ length: 6 }, (_, i) => polar(R, -90 + 60 * i))
}

/** Outward unit direction of ring position `position` (1 to 6), in degrees. */
export function benzeneExoAngle(position: number): number {
  return -90 + 60 * (position - 1)
}

/** Ring distance between two positions (1 ortho, 2 meta, 3 para), and 0 for the same position. */
export function ringDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 6
  return Math.min(d, 6 - d)
}

/** The ortho/meta/para letter of a position relative to a principal group at `group`. */
export function relativeLocant(position: number, group: number): 'o' | 'm' | 'p' | '' {
  switch (ringDistance(position, group)) {
    case 1:
      return 'o'
    case 2:
      return 'm'
    case 3:
      return 'p'
    default:
      return ''
  }
}

/**
 * Kekulé double-bond weights for `mix` 0..1. Bonds 0, 2, 4 are the double bonds of Kekulé A
 * (positions 1=2, 3=4, 5=6) and bonds 1, 3, 5 those of Kekulé B. A bond's weight is how
 * strongly its inner line is drawn.
 */
export function kekuleWeights(mix: number): number[] {
  const m = unitClamp(mix)
  return [0, 1, 2, 3, 4, 5].map((i) => (i % 2 === 0 ? 1 - m : m))
}

// ---------------------------------------------------------------------------------------------
// Mechanism stages
// ---------------------------------------------------------------------------------------------

/**
 * Splits a 0..1 progress over `stages` equal stages. Returns the active stage (0-based, the
 * last one at progress 1) and the progress within it. Stage boundaries fall at multiples of 1/stages.
 */
export function stageAt(progress: number, stages: number): { index: number; t: number } {
  const p = unitClamp(progress)
  if (stages <= 1) return { index: 0, t: p }
  const scaled = p * stages
  const index = Math.min(stages - 1, Math.floor(scaled))
  const t = index === stages - 1 && p >= 1 ? 1 : scaled - index
  return { index, t: unitClamp(t) }
}

/** Opacity of a stage's structures: full while current, 0.7 once passed, and a faint ghost before it is reached. */
export function stageOpacity(progress: number, stages: number, stage: number): number {
  const { index } = stageAt(progress, stages)
  if (stage === index) return 1
  return stage < index ? 0.7 : 0.12
}

/**
 * A sawhorse as drawn, in px at `bond` px per bond length: the C–C axis and the bonds on both
 * carbons, each cut back behind every label, plus the label centres.
 */
export function sawhorseRendered(dihedral: number, bond: number): { segments: Seg[]; labels: Pt[]; back: Pt } {
  const g = sawhorseGeometry(dihedral)
  const P = (p: Pt): Pt => ({ x: p.x * bond, y: p.y * bond })
  const origin = { x: 0, y: 0 }
  const backPx = P(g.back)
  const labels = [...g.front, ...g.backBonds].map((b) => P(b.label))
  const raw: Seg[] = [
    { a: origin, b: backPx },
    ...g.front.map((b) => ({ a: origin, b: P(b.to) })),
    ...g.backBonds.map((b) => ({ a: backPx, b: P(b.to) })),
  ]
  const segments = raw.flatMap((s) => segmentOutside(s, labels, LABEL_KNOCKOUT))
  return { segments, labels, back: backPx }
}

/** Every label centre of a sawhorse, and whether the drawing's bonds keep clear of them. */
export function sawhorseLabelsPx(dihedral: number, bond: number): Pt[] {
  return sawhorseRendered(dihedral, bond).labels
}
