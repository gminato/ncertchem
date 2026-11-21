import { standardCellPotential, cellNotation, type CellHalf } from './electrochemical-cell'
import { NCERT_STANDARD_POTENTIALS, type StandardPotentialRow } from './ncert-c12-unit2-tables'

/** Electrode materials the Visual Vocabulary can draw. */
export type HalfMaterial = 'zn' | 'cu' | 'ag' | 'pb' | 'pt' | 'fe' | 'mg' | 'ni' | 'cd' | 'graphite'

export type SolutionTint = 'clear' | 'blue' | 'pink' | 'violet' | 'amber'

export type CoupleKind = 'metal' | 'gas' | 'ion'

/** A charged species in the solution, e.g. Cu²⁺ as formula "Cu", charge "2+". */
export interface SolutionIon {
  readonly formula: string
  readonly charge: string
  /** mhchem body with state, e.g. "Cu^{2+}(aq)". */
  readonly ce: string
}

/** A redox couple from Table 2.1, with what the bench needs to draw it. */
export interface Couple {
  readonly id: string
  /** Unicode label, e.g. "Cu²⁺/Cu". */
  readonly label: string
  /** Reaction as written in Table 2.1 (Unicode). */
  readonly reaction: string
  /** Same reaction as an mhchem body. */
  readonly ce: string
  readonly electrons: number
  /** E° / V at 298 K. */
  readonly e0: number
  readonly kind: CoupleKind
  /** Electrode material to draw. Metals not in the vocabulary fall back to 'pt'. */
  readonly electrode: HalfMaterial
  /** Element symbol shown under the electrode, e.g. "Cu" or "Pt". */
  readonly electrodeLabel: string
  /** Gas formula for a gas couple in mhchem, e.g. "H2". */
  readonly gasCe: string | null
  readonly solution: readonly SolutionIon[]
  readonly tint: SolutionTint
}

export type Arrangement = 'spontaneous' | 'reversed'

export interface CellPairing {
  readonly cathode: Couple
  readonly anode: Couple
  /** E°cell / V = E°cathode − E°anode. */
  readonly eCell: number
  /** True when E°cell > 0. */
  readonly spontaneous: boolean
  /** mhchem body of the cell notation, anode on the left. */
  readonly notation: string
  /** mhchem body of the balanced overall reaction, electrons cancelled. */
  readonly overall: string
  /** Electrons transferred in the balanced overall reaction. */
  readonly electrons: number
}

const METAL_MATERIALS: Readonly<Record<string, HalfMaterial>> = {
  Zn: 'zn',
  Cu: 'cu',
  Ag: 'ag',
  Pb: 'pb',
  Fe: 'fe',
  Mg: 'mg',
  Ni: 'ni',
  Cd: 'cd',
}

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}
const SUBSCRIPT: Readonly<Record<string, string>> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}

/**
 * Turns a Table 2.1 id such as "Cr2O7 2-/Cr3+" into "Cr₂O₇²⁻/Cr³⁺". A charge is
 * a digit run before "+", or a digit run before "-" only when a space separates
 * them (so "MnO4-" keeps its subscript 4).
 */
export function unicodeLabel(id: string): string {
  const sup = (digits: string, sign: string): string =>
    [...digits].map((d) => SUPERSCRIPT[d]).join('') + sign
  return id
    .replace(/ (\d*)([+-])/g, (_m, digits: string, sign: string) => sup(digits, SUPERSCRIPT[sign]))
    .replace(/(\d*)\+/g, (_m, digits: string) => sup(digits, SUPERSCRIPT['+']))
    .replace(/-/g, SUPERSCRIPT['-'])
    .replace(/\d/g, (d) => SUBSCRIPT[d])
}

interface Term {
  readonly coeff: number
  readonly species: string
}

/** Splits one side of an mhchem half-reaction into terms with coefficients. */
function parseSide(side: string): Term[] {
  return side
    .split(' + ')
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .map((term) => {
      const m = /^(\d+)(.*)$/.exec(term)
      return m ? { coeff: Number(m[1]), species: m[2] } : { coeff: 1, species: term }
    })
}

function parseHalf(ce: string): { reactants: Term[]; products: Term[] } {
  const [left, right] = ce.split(' -> ')
  return { reactants: parseSide(left), products: parseSide(right) }
}

/** Parses "Cu^{2+}" or "Cr2O7^{2-}" or "H+" into formula and charge. */
function parseIon(species: string): { formula: string; charge: string } | null {
  const bare = species.replace(/\((s|g|l|aq)\)$/, '')
  // Charges are written as ^{2+}, ^2+ or a bare sign (H+, Cl-). Digits before a bare sign are a subscript (NO3-).
  const m = /^(.+?)(?:\^\{(\d*[+-])\}|\^(\d*[+-])|([+-]))$/.exec(bare)
  if (!m || m[1] === 'e') return null
  return { formula: m[1], charge: m[2] ?? m[3] ?? m[4] }
}

function tintFor(solution: readonly SolutionIon[]): SolutionTint {
  for (const ion of solution) {
    if (ion.formula === 'Cu' && ion.charge === '2+') return 'blue'
    if (ion.formula === 'MnO4') return 'violet'
    if (ion.formula === 'Cr2O7') return 'amber'
    if (ion.formula === 'Fe' && ion.charge === '3+') return 'amber'
    if (ion.formula === 'Co') return 'pink'
  }
  return 'clear'
}

function buildCouple(row: StandardPotentialRow): Couple {
  const { reactants, products } = parseHalf(row.ce)
  const metalProduct = products
    .map((t) => /^([A-Z][a-z]?)\(s\)$/.exec(t.species))
    .find((m) => m !== null)
  const metalSymbol = metalProduct ? metalProduct[1] : null
  const gas = [...reactants, ...products].find((t) => t.species.endsWith('(g)'))

  let kind: CoupleKind = 'ion'
  if (metalSymbol) kind = 'metal'
  else if (gas) kind = 'gas'

  const electrode: HalfMaterial = metalSymbol ? (METAL_MATERIALS[metalSymbol] ?? 'pt') : 'pt'
  const electrodeLabel = metalSymbol ?? 'Pt'

  const solution: SolutionIon[] = []
  for (const t of [...reactants, ...products]) {
    const ion = parseIon(t.species)
    if (!ion) continue
    const ce = `${ion.formula}^{${ion.charge}}(aq)`
    if (!solution.some((s) => s.ce === ce)) solution.push({ formula: ion.formula, charge: ion.charge, ce })
  }

  return {
    id: row.id,
    label: unicodeLabel(row.id),
    reaction: row.reaction,
    ce: row.ce,
    electrons: row.electrons,
    e0: row.e0,
    kind,
    electrode,
    electrodeLabel,
    gasCe: gas ? gas.species.replace(/\(g\)$/, '') : null,
    solution,
    tint: tintFor(solution),
  }
}

/** All 34 couples of Table 2.1, in NCERT's order. */
export const COUPLES: readonly Couple[] = NCERT_STANDARD_POTENTIALS.map(buildCouple)

export function coupleById(id: string): Couple {
  const found = COUPLES.find((c) => c.id === id)
  if (!found) throw new Error(`Unknown couple: ${id}`)
  return found
}

function lcm(a: number, b: number): number {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))
  return (a * b) / gcd(a, b)
}

/**
 * Balanced overall reaction for a cathode (reduction) and an anode (oxidation).
 * Both half-reactions are scaled to the same electron count, the anode's is
 * reversed, and species that appear on both sides cancel.
 */
export function balancedOverall(cathode: Couple, anode: Couple): { ce: string; electrons: number } {
  const n = lcm(cathode.electrons, anode.electrons)
  const a = n / cathode.electrons
  const b = n / anode.electrons
  const c = parseHalf(cathode.ce)
  const an = parseHalf(anode.ce)

  const net = new Map<string, number>()
  const add = (terms: readonly Term[], sign: 1 | -1, scale: number): void => {
    for (const t of terms) net.set(t.species, (net.get(t.species) ?? 0) + sign * scale * t.coeff)
  }
  // Left: cathode reactants (incl. electrons) and anode products (the reduced form of the anode).
  add(c.reactants, 1, a)
  add(an.products, 1, b)
  // Right: cathode products and anode reactants (incl. the electrons released by oxidation).
  add(c.products, -1, a)
  add(an.reactants, -1, b)

  const left: string[] = []
  const right: string[] = []
  for (const [species, count] of net) {
    if (count === 0) continue
    const text = count > 0 ? left : right
    const abs = Math.abs(count)
    text.push(`${abs === 1 ? '' : abs}${species}`)
  }
  return { ce: `${left.join(' + ')} -> ${right.join(' + ')}`, electrons: n }
}

/**
 * Pairs two couples. `spontaneous` puts the couple with the higher E° at the
 * cathode; `reversed` swaps the roles so the cell's E°cell is negative.
 * Returns null when both picks are the same couple.
 */
export function pairCouples(
  first: Couple,
  second: Couple,
  arrangement: Arrangement = 'spontaneous',
): CellPairing | null {
  if (first.id === second.id) return null
  const firstIsCathode = first.e0 >= second.e0
  const higher = firstIsCathode ? first : second
  const lower = firstIsCathode ? second : first
  const [cathode, anode] = arrangement === 'spontaneous' ? [higher, lower] : [lower, higher]

  const eCell = standardCellPotential(cathode.e0, anode.e0)
  const overall = balancedOverall(cathode, anode)
  const halfOf = (c: Couple): CellHalf => ({
    electrode: c.kind === 'metal' ? `${c.electrodeLabel}(s)` : c.kind === 'gas' ? `Pt|${c.gasCe}(g)` : 'Pt',
    solution: c.solution.map((s) => s.ce).join(', '),
  })

  return {
    cathode,
    anode,
    eCell,
    spontaneous: eCell > 0,
    notation: cellNotation(halfOf(anode), halfOf(cathode)),
    overall: overall.ce,
    electrons: overall.electrons,
  }
}

/** Formats a number with a true minus sign, e.g. -0.76 becomes "−0.76". */
export function signed(value: number, decimals = 2): string {
  const s = value.toFixed(decimals)
  return s.startsWith('-') ? `−${s.slice(1)}` : s
}
