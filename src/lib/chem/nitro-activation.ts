/**
 * Carbanion contributors for nucleophilic attack on a nitro-substituted chlorobenzene (Class 12 Unit 6, 6.7.2).
 * The ring is numbered from the carbon that bears Cl (C1). OH⁻ attacks C1; the negative charge then sits on
 * C2, C4 or C6 (ortho and para to C1). A nitro group helps only when it sits on one of those carbons.
 */
import { nitroActivation } from './haloalkanes'
import type { MolGraph } from './molecule-graph'
import { bondOrderBetween } from './molecule-parse'
import { NCERT_HALOARENE_HYDROLYSIS } from './ncert-c12-unit6-data'

export type ChargeSite = 2 | 4 | 6
export const CHARGE_SITES: readonly ChargeSite[] = [2, 4, 6]

type Pair = readonly [number, number]

/** Kekulé double bonds of the substrate ring (C1=C2, C3=C4, C5=C6). */
const SUBSTRATE_DOUBLES: readonly Pair[] = [
  [1, 2],
  [3, 4],
  [5, 6],
]

/** Double bonds of the cyclohexadienyl carbanion (C1 is sp³), for each charge site. */
const CONTRIBUTOR_DOUBLES: Record<ChargeSite, readonly Pair[]> = {
  2: [
    [3, 4],
    [5, 6],
  ],
  4: [
    [2, 3],
    [5, 6],
  ],
  6: [
    [2, 3],
    [4, 5],
  ],
}

/**
 * Shared SMILES writer: ring atoms C1 to C6, nitro groups on the positions given, Kekulé bonds.
 * `nitroForm` is the carbon whose NO₂ takes the charge: its N is double bonded to the ring carbon.
 */
function ringSmiles(
  nitro: readonly number[],
  doubles: readonly Pair[],
  c1: { prefix: string; suffix: string },
  anion?: ChargeSite,
  nitroForm?: ChargeSite,
): string {
  const has = (k: number, a: readonly Pair[]) => a.some(([x, y]) => (x === k && y === k + 1) || (x === k + 1 && y === k))
  const tokens: string[] = []
  for (let k = 1; k <= 6; k++) {
    let tok: string
    if (k === 1) {
      tok = `${c1.prefix}C1${c1.suffix}`
    } else {
      const branch = nitro.includes(k) ? '([N+](=O)[O-])' : ''
      if (k === nitroForm) tok = 'C(=[N+]([O-])[O-])'
      else if (k === anion) tok = branch ? `[C-]${branch}` : '[CH-]'
      else tok = `C${branch}`
    }
    if (k === 6) tok += '1'
    tokens.push(tok)
  }
  let out = tokens[0]
  for (let k = 1; k <= 5; k++) {
    out += (has(k, doubles) ? '=' : '') + tokens[k]
  }
  return out
}

function normalise(nitro: readonly number[]): readonly number[] {
  nitroActivation([...nitro]) // throws for positions outside 2 to 6
  return [...new Set(nitro)].sort((p, q) => p - q)
}

/** Kekulé SMILES of the substrate: chlorobenzene with nitro groups at the given ring positions (2 to 6). */
export function nitroSubstrateSmiles(nitro: readonly number[]): string {
  return ringSmiles(normalise(nitro), SUBSTRATE_DOUBLES, { prefix: 'Cl', suffix: '' })
}

/**
 * Kekulé SMILES of the carbanion after OH⁻ adds at C1, with the negative charge on `chargeAt`.
 * Cl is written first so that the layout puts it on C1's outward bond, not in the ring.
 */
export function carbanionContributorSmiles(nitro: readonly number[], chargeAt: ChargeSite): string {
  return ringSmiles(normalise(nitro), CONTRIBUTOR_DOUBLES[chargeAt], { prefix: 'Cl', suffix: '(O)' }, chargeAt)
}

/**
 * Kekulé SMILES of the nitro-O contributor for a carbon that carries NO₂: the ring C=N is a double bond and the
 * negative charge sits on a nitro oxygen. Only the NO₂ carbon gets this form; other nitro groups stay uncharged.
 */
export function nitroOxygenContributorSmiles(nitro: readonly number[], site: ChargeSite): string {
  const set = normalise(nitro)
  if (!set.includes(site)) throw new Error(`No nitro group at C${site}, so no nitro-O contributor`)
  return ringSmiles(set, CONTRIBUTOR_DOUBLES[site], { prefix: 'Cl', suffix: '(O)' }, undefined, site)
}

/**
 * Drawing copy of a contributor: a nitro group whose N is double bonded to a ring carbon (the nitro-O
 * contributor) is drawn in full, with its ⊕ and ⊖. Every other nitro group is condensed to one "NO₂"
 * label, as textbooks draw it, so its formal charges are implied rather than drawn as an uncharged N.
 */
export function withResonantNitroChargesOnly(g: MolGraph): MolGraph {
  const drop = new Set<number>()
  const atoms = g.atoms.map((a) => ({ ...a }))
  g.atoms.forEach((a, n) => {
    if (a.element !== 'N' || (a.charge ?? 0) <= 0) return
    const ringDouble = g.atoms.some((b, c) => b.element === 'C' && bondOrderBetween(g, n, c) === 2)
    if (ringDouble) return
    g.atoms.forEach((o, j) => {
      if (o.element === 'O' && bondOrderBetween(g, n, j) > 0) drop.add(j)
    })
    atoms[n] = { ...atoms[n], element: 'NO₂', charge: 0, hCount: 0 }
  })
  const index = new Map<number, number>()
  const kept = atoms.filter((_, i) => !drop.has(i))
  atoms.forEach((_, i) => {
    if (!drop.has(i)) index.set(i, index.size)
  })
  const bonds = g.bonds
    .filter((b) => !drop.has(b.a) && !drop.has(b.b))
    .map((b) => ({ ...b, a: index.get(b.a)!, b: index.get(b.b)! }))
  return { ...g, atoms: kept, bonds }
}

export interface CarbanionContributor {
  chargeAt: ChargeSite
  smiles: string
  /** True when the negative charge sits on a carbon that bears NO₂. */
  reachesNitro: boolean
}

/** The three carbanion contributors for the attack at C1, each marked for whether it reaches a nitro carbon. */
export function carbanionContributors(nitro: readonly number[]): CarbanionContributor[] {
  const set = normalise(nitro)
  return CHARGE_SITES.map((chargeAt) => ({
    chargeAt,
    smiles: carbanionContributorSmiles(set, chargeAt),
    reachesNitro: set.includes(chargeAt),
  }))
}

export interface NitroVerdict {
  activated: boolean
  /** Charge sites that carry a nitro group (empty when not activated). */
  reachingSites: ChargeSite[]
  /** The nitro positions that are meta to C1 (no effect). */
  metaPositions: number[]
}

export function nitroVerdict(nitro: readonly number[]): NitroVerdict {
  const set = normalise(nitro)
  const reachingSites = CHARGE_SITES.filter((c) => set.includes(c))
  return {
    activated: reachingSites.length > 0,
    reachingSites,
    metaPositions: set.filter((p) => p === 3 || p === 5),
  }
}

/**
 * NCERT's printed conditions: chlorobenzene (623 K, 300 atm) and the three nitro arrangements it prints
 * (4-nitro, 2,4-dinitro, 2,4,6-trinitro). Every other pattern gets null: NCERT prints no conditions for it.
 */
export function printedHydrolysisCase(nitro: readonly number[]) {
  const key = normalise(nitro).join(',')
  const index: Record<string, number> = { '': 0, '4': 1, '2,4': 2, '2,4,6': 3 }
  const i = index[key]
  return i === undefined ? null : NCERT_HALOARENE_HYDROLYSIS[i]
}
