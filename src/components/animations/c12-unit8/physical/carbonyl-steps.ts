import { drawingFrame } from '@/components/organic/frame'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { CARBONYL_BOILING_POINTS } from '@/lib/chem/ncert-c12-unit8-data'

/** The six Scrolly Steps (0-based), in the order the Prose describes them. */
export const CARBONYL_BEATS = [
  'ladder-all',
  'butane-alone',
  'dipoles',
  'hydrogen-bonds',
  'acetone-water',
  'pentanal-water',
] as const
export type CarbonylBeat = (typeof CARBONYL_BEATS)[number]

export const BUTANE_SMILES = 'CCCC'
export const METHOXYETHANE_SMILES = 'COCC'
export const PROPANAL_SMILES = 'CCC=O'
export const ACETONE_SMILES = 'CC(C)=O'
export const PROPAN1OL_SMILES = 'CCCO'
export const PENTANAL_SMILES = 'CCCCC=O'
export const WATER_SMILES = 'O'

/** Molecular formula each drawn molecule must have (asserted in the unit test). */
export const EXPECTED_FORMULA: Readonly<Record<string, string>> = {
  [BUTANE_SMILES]: 'C4H10',
  [METHOXYETHANE_SMILES]: 'C3H8O',
  [PROPANAL_SMILES]: 'C3H6O',
  [ACETONE_SMILES]: 'C3H6O',
  [PROPAN1OL_SMILES]: 'C3H8O',
  [PENTANAL_SMILES]: 'C5H10O',
  [WATER_SMILES]: 'H2O',
}

/** Atom indices in parseSmiles order. */
export const PROPANAL_C = 2
export const PROPANAL_O = 3
export const ACETONE_C = 1
export const ACETONE_O = 3
export const PENTANAL_C = 4
export const PENTANAL_O = 5
export const PROPAN1OL_O = 3

/** The ladder: boiling point in K maps to a height. 260 K sits at the bottom, 380 K at the top. */
export const LADDER_MIN_K = 260
export const LADDER_MAX_K = 380
export const LADDER_TOP_Y = 40
export const LADDER_BOTTOM_Y = 520

export function ladderY(bpK: number): number {
  return LADDER_BOTTOM_Y - ((bpK - LADDER_MIN_K) * (LADDER_BOTTOM_Y - LADDER_TOP_Y)) / (LADDER_MAX_K - LADDER_MIN_K)
}

export interface Point {
  x: number
  y: number
}

/** A skeletal drawing placed at (cx, cy); atom positions follow SkeletalFormula's own frame. */
export interface Placed {
  smiles: string
  scale: number
  cx: number
  cy: number
}

const graphCache = new Map<string, ReturnType<typeof parseSmiles>>()
export function graphOf(smiles: string) {
  let g = graphCache.get(smiles)
  if (!g) {
    g = parseSmiles(smiles)
    graphCache.set(smiles, g)
  }
  return g
}

/** Absolute position of atom `index` of a placed molecule, in SVG pixels. */
export function atomAt(p: Placed, index: number): Point {
  const local = drawingFrame(graphOf(p.smiles), p.scale).points[index]
  return { x: p.cx + local.x, y: p.cy + local.y }
}

/** A point `dist` px from atom `index`, pushed away from the molecule's centre (where a label or a partner can sit). */
export function outwardFrom(p: Placed, index: number, dist: number): Point {
  const a = atomAt(p, index)
  const dx = a.x - p.cx
  const dy = a.y - p.cy
  const len = Math.hypot(dx, dy) || 1
  return { x: a.x + (dx / len) * dist, y: a.y + (dy / len) * dist }
}

/** Nearest pair of atoms between two placed molecules: where a contact line is drawn. */
export function nearestPair(a: Placed, b: Placed): [Point, Point] {
  const pa = drawingFrame(graphOf(a.smiles), a.scale).points.map((_, i) => atomAt(a, i))
  const pb = drawingFrame(graphOf(b.smiles), b.scale).points.map((_, i) => atomAt(b, i))
  let best: [Point, Point] = [pa[0], pb[0]]
  let bestD = Infinity
  for (const u of pa) {
    for (const v of pb) {
      const d = Math.hypot(u.x - v.x, u.y - v.y)
      if (d < bestD) {
        bestD = d
        best = [u, v]
      }
    }
  }
  return best
}

/** Row of the ladder for a compound, taken from the lib (never typed here). */
export function ladderRow(smiles: string) {
  const row = CARBONYL_BOILING_POINTS.find((r) => r.smiles === smiles)
  if (!row) throw new Error(`No boiling-point row for ${smiles}`)
  return row
}

/** Boiling points (K) highlighted on the ladder for each Step. */
export const LADDER_ACTIVE_K: Readonly<Record<CarbonylBeat, readonly number[]>> = {
  'ladder-all': CARBONYL_BOILING_POINTS.map((r) => r.bpK),
  'butane-alone': [ladderRow(BUTANE_SMILES).bpK],
  dipoles: [ladderRow(PROPANAL_SMILES).bpK, ladderRow(ACETONE_SMILES).bpK],
  'hydrogen-bonds': [ladderRow(PROPAN1OL_SMILES).bpK],
  'acetone-water': [],
  'pentanal-water': [],
}

/** Steps that keep the boiling-point ladder on the left of the drawing. */
export function showsLadder(beat: CarbonylBeat): boolean {
  return beat === 'ladder-all' || beat === 'butane-alone' || beat === 'dipoles' || beat === 'hydrogen-bonds'
}
