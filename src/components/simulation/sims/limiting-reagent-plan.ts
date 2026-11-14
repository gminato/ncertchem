import { reactorOutcome, type ReactorOutcome } from '@/lib/chem/limiting-reactor'
import type { Reaction } from '@/lib/chem/stoichiometry'

/** One of the reactions the Limiting reagent Simulation can run. */
export interface ReactionOption {
  id: string
  /** Equation as displayed, with Unicode subscripts. */
  label: string
  reaction: Reaction
  /** Starting molecule counts, chosen so that the Learner sees one limiting reagent. */
  defaults: Record<string, number>
}

export const REACTION_OPTIONS: readonly ReactionOption[] = [
  {
    id: 'h2-o2',
    label: '2H₂ + O₂ → 2H₂O',
    reaction: {
      reactants: [
        { formula: 'H2', coeff: 2 },
        { formula: 'O2', coeff: 1 },
      ],
      products: [{ formula: 'H2O', coeff: 2 }],
    },
    defaults: { H2: 7, O2: 4 },
  },
  {
    id: 'n2-h2',
    label: 'N₂ + 3H₂ → 2NH₃',
    reaction: {
      reactants: [
        { formula: 'N2', coeff: 1 },
        { formula: 'H2', coeff: 3 },
      ],
      products: [{ formula: 'NH3', coeff: 2 }],
    },
    defaults: { N2: 5, H2: 8 },
  },
  {
    id: 'ch4-o2',
    label: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    reaction: {
      reactants: [
        { formula: 'CH4', coeff: 1 },
        { formula: 'O2', coeff: 2 },
      ],
      products: [
        { formula: 'CO2', coeff: 1 },
        { formula: 'H2O', coeff: 2 },
      ],
    },
    defaults: { CH4: 4, O2: 7 },
  },
]

export const MAX_MOLECULES = 12

/** Reactor geometry, in SVG units. The box is 600 by 340. */
export const REACTOR = { width: 600, height: 340 } as const

/** Reservoir (left): one horizontal band per reactant, holding unreacted molecules. */
export const RESERVOIR = { left: 16, right: 298, bandTop: [18, 176] as const, bandHeight: 146 }
/** Reaction site (right): a 2 by 3 grid of cells, one cell per whole reaction event. */
export const SITE = { left: 316, cellWidth: 134, cellHeight: 102, top: 18, cols: 2, rows: 3 }
export const MAX_EVENTS = SITE.cols * SITE.rows

/** Spacing between molecules in a cell group. */
const GROUP_SPACING = 34
const GROUP_SPACING_DENSE = 30

/** Spacing rule for placing molecules in a band: the best of this many candidates is kept. */
const CANDIDATES = 40

/** Phase boundaries of the reaction, as fractions of the whole run (0 to 1). */
export const PHASE = {
  gatherEnd: 0.4,
  consumeStart: 0.45,
  consumeEnd: 0.6,
  produceStart: 0.5,
  produceEnd: 0.62,
  settleStart: 0.55,
  settleEnd: 1,
  glowStart: 0.9,
} as const

export interface PlannedMolecule {
  id: string
  formula: string
  role: 'reactant' | 'product'
  /** Formula of the species this molecule belongs to (the reactant it came from, or the product). */
  species: string
  /** Position at t = 0: where an unreacted molecule rests, or where it waits. */
  start: { x: number; y: number }
  /** Final position at t = 1 (unreacted molecules stay at start). */
  dest: { x: number; y: number }
  /** Reactants only: the cell centre they gather in before reacting. */
  gather?: { x: number; y: number }
  /** Reactants only: true if this molecule is used up. Unreacted molecules stay and glow at t = 1. */
  consumed: boolean
  /** Index of the whole reaction event this molecule belongs to, if any. */
  event?: number
}

export interface ReactorPlan {
  option: ReactionOption
  counts: Record<string, number>
  outcome: ReactorOutcome
  molecules: PlannedMolecule[]
  /** Centre of each reaction cell used, one per event. */
  cells: { x: number; y: number }[]
  /** Band index of each reactant formula. */
  bandOf: Record<string, number>
}

/** Small seeded PRNG (mulberry32): the same seed always gives the same sequence. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Point {
  x: number
  y: number
}

/**
 * Places `count` molecules in a rectangle with best-candidate sampling: each new
 * point is the candidate farthest from those already placed. Point k depends only
 * on the seed and on points 0 to k-1, so adding a molecule never moves the others.
 */
export function placeInBand(
  seed: number,
  count: number,
  rect: { left: number; right: number; top: number; bottom: number }
): Point[] {
  const rand = seededRandom(seed)
  const points: Point[] = []
  for (let i = 0; i < count; i++) {
    let best: Point | null = null
    let bestDist = -1
    for (let c = 0; c < CANDIDATES; c++) {
      const candidate = {
        x: rect.left + rand() * (rect.right - rect.left),
        y: rect.top + rand() * (rect.bottom - rect.top),
      }
      let nearest = Infinity
      for (const p of points) {
        nearest = Math.min(nearest, Math.hypot(candidate.x - p.x, candidate.y - p.y))
      }
      if (nearest > bestDist) {
        bestDist = nearest
        best = candidate
      }
    }
    if (best) points.push({ x: round1(best.x), y: round1(best.y) })
  }
  return points
}

const round1 = (v: number) => Math.round(v * 10) / 10

/** Offsets for `n` molecules standing side by side, centred on zero. */
export function groupOffsets(n: number): Point[] {
  const spacing = n > 3 ? GROUP_SPACING_DENSE : GROUP_SPACING
  return Array.from({ length: n }, (_, j) => ({ x: (j - (n - 1) / 2) * spacing, y: 0 }))
}

/** Centre of reaction cell `index` (0 to MAX_EVENTS - 1). */
export function cellCentre(index: number): Point {
  const col = index % SITE.cols
  const row = Math.floor(index / SITE.cols)
  return {
    x: SITE.left + col * SITE.cellWidth + SITE.cellWidth / 2,
    y: SITE.top + row * SITE.cellHeight + SITE.cellHeight / 2,
  }
}

/** Looks up a reaction option by id. Falls back to the first option. */
export function optionById(id: string): ReactionOption {
  return REACTION_OPTIONS.find((o) => o.id === id) ?? REACTION_OPTIONS[0]
}

/** Clamps a molecule count to the slider range, as an integer. */
export function clampCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(MAX_MOLECULES, Math.max(0, Math.round(value)))
}

/**
 * Builds the full, deterministic picture of a run: where every molecule starts,
 * which whole events it joins, and where it ends. Pure: the same inputs always
 * give the same plan.
 *
 * @throws {RangeError} If a count is not a whole number (the outcome check enforces it)
 */
export function buildReactorPlan(
  option: ReactionOption,
  counts: Record<string, number>
): ReactorPlan {
  const outcome = reactorOutcome(option.reaction, counts)
  const reactants = option.reaction.reactants
  const products = option.reaction.products

  const bandOf: Record<string, number> = {}
  reactants.forEach((r, k) => {
    bandOf[r.formula] = k
  })

  // Reservoir: every reactant molecule gets a resting place in its band.
  const restPoints: Record<string, Point[]> = {}
  reactants.forEach((r, k) => {
    const top = RESERVOIR.bandTop[k] + 36
    const bottom = RESERVOIR.bandTop[k] + RESERVOIR.bandHeight - 14
    restPoints[r.formula] = placeInBand(101 + k * 7919, counts[r.formula] ?? 0, {
      left: RESERVOIR.left + 22,
      right: RESERVOIR.right - 14,
      top,
      bottom,
    })
  })

  const molecules: PlannedMolecule[] = []
  const cells: { x: number; y: number }[] = []

  // Reactant molecules: the first coeff × events of each species are used up,
  // in the order they were placed, so the choice never depends on the screen.
  const reactantIndexUsed: Record<string, number> = {}
  for (let e = 0; e < outcome.events; e++) {
    const centre = cellCentre(e)
    cells.push(centre)
    const gatherOffsets = groupOffsets(
      reactants.reduce((sum, r) => sum + r.coeff, 0)
    )
    let slot = 0
    for (const r of reactants) {
      for (let c = 0; c < r.coeff; c++) {
        const idx = reactantIndexUsed[r.formula] ?? 0
        reactantIndexUsed[r.formula] = idx + 1
        const start = restPoints[r.formula][idx]
        const off = gatherOffsets[slot++]
        molecules.push({
          id: `${r.formula}-${idx}`,
          formula: r.formula,
          role: 'reactant',
          species: r.formula,
          start,
          dest: start,
          gather: { x: round1(centre.x + off.x), y: round1(centre.y + off.y) },
          consumed: true,
          event: e,
        })
      }
    }
    const productOffsets = groupOffsets(products.reduce((sum, p) => sum + p.coeff, 0))
    slot = 0
    for (const p of products) {
      for (let c = 0; c < p.coeff; c++) {
        const off = productOffsets[slot++]
        molecules.push({
          id: `${p.formula}-e${e}-${c}-${slot}`,
          formula: p.formula,
          role: 'product',
          species: p.formula,
          start: centre,
          dest: { x: round1(centre.x + off.x), y: round1(centre.y + off.y) },
          consumed: false,
          event: e,
        })
      }
    }
  }

  // Unreacted molecules: everything not used up stays where it rests.
  for (const r of reactants) {
    const points = restPoints[r.formula]
    const used = outcome.consumed[r.formula]
    for (let idx = used; idx < points.length; idx++) {
      molecules.push({
        id: `${r.formula}-${idx}`,
        formula: r.formula,
        role: 'reactant',
        species: r.formula,
        start: points[idx],
        dest: points[idx],
        consumed: false,
      })
    }
  }

  return { option, counts, outcome, molecules, cells, bandOf }
}

/** Clamps a number to the range 0 to 1. */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Maps t from [a, b] to [0, 1], clamped. */
function window01(t: number, a: number, b: number): number {
  return clamp01((t - a) / (b - a))
}

export interface MoleculeFrame {
  id: string
  formula: string
  x: number
  y: number
  opacity: number
  /** Show the --caution glow: an unreacted molecule once the run has finished. */
  glow: boolean
}

/**
 * Where every molecule is at progress t (0 to 1). At t = 0 the reactor shows the
 * starting molecules. At t = 1 the consumed reactants are gone, the products sit in
 * their cells, and every unreacted molecule glows.
 */
export function frameAt(plan: ReactorPlan, t: number): MoleculeFrame[] {
  const p = clamp01(t)
  return plan.molecules.map((m) => {
    if (m.role === 'reactant' && m.consumed && m.gather) {
      const move = smooth(window01(p, 0, PHASE.gatherEnd))
      const x = lerp(m.start.x, m.gather.x, move)
      const y = lerp(m.start.y, m.gather.y, move)
      const fade = 1 - smooth(window01(p, PHASE.consumeStart, PHASE.consumeEnd))
      return { id: m.id, formula: m.formula, x, y, opacity: fade, glow: false }
    }
    if (m.role === 'product' && m.event !== undefined) {
      const centre = plan.cells[m.event]
      const appear = smooth(window01(p, PHASE.produceStart, PHASE.produceEnd))
      const settle = smooth(window01(p, PHASE.settleStart, PHASE.settleEnd))
      return {
        id: m.id,
        formula: m.formula,
        x: lerp(centre.x, m.dest.x, settle),
        y: lerp(centre.y, m.dest.y, settle),
        opacity: appear,
        glow: false,
      }
    }
    return {
      id: m.id,
      formula: m.formula,
      x: m.start.x,
      y: m.start.y,
      opacity: 1,
      glow: p >= PHASE.glowStart,
    }
  })
}

/** Short spoken summary of a plan, for the aria-live region. */
export function summaryText(plan: ReactorPlan, finished: boolean): string {
  const { outcome, option } = plan
  if (outcome.events === 0) {
    return `${option.label}: one reactant is missing, so no molecules react.`
  }
  const base = `${option.label}. Limiting reagent: ${formulaLabel(outcome.limiting)}. ${outcome.events} whole ${
    outcome.events === 1 ? 'reaction' : 'reactions'
  } possible.`
  if (!finished) return base
  const left = Object.entries(outcome.remaining)
    .filter(([, n]) => n > 0)
    .map(([f, n]) => `${n} ${formulaLabel(f)}`)
  const made = Object.entries(outcome.produced).map(([f, n]) => `${n} ${formulaLabel(f)}`)
  return `${base} Produced ${made.join(', ')}. Left over: ${left.length ? left.join(', ') : 'nothing'}.`
}

const SUBSCRIPT: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

/** Formula as displayed: digits become subscripts, e.g. H2O → H₂O. */
export function formulaLabel(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT[d] ?? d)
}
