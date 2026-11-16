/**
 * A small reaction engine for the hydrocarbon reactions of NCERT Class 11 Unit 9 (alkanes, alkenes,
 * alkynes and arenes). Each function takes a MolGraph substrate, checks that the reaction applies
 * (a RangeError names the reason when it does not), and returns a Reaction: the products as graphs
 * with names (Unit 8 iupacName), a balanced equation for mhchem, the condition NCERT gives for it
 * (from NCERT_UNIT9_CONDITIONS) and a one-sentence reason.
 *
 * Regiochemistry follows NCERT. Electrophilic additions form the more stable carbocation
 * (intermediateStability, Unit 8); the peroxide effect gives anti-Markovnikov addition of HBr through
 * the more stable free radical; substitution on a benzene ring follows the o/p and m directing groups of
 * NCERT 9.5.6. Where NCERT gives no ratio, no product is named major.
 */

import type { MolAtom, MolBond, MolGraph } from './molecule-graph'
import { intermediateStability } from './electronic-effects'
import { huckel } from './aromaticity'
import { findRings } from './hydrocarbon-species'
import { canonicalKey, hybridisation, molecularFormula, neighbours, parseSmiles } from './molecule-parse'
import { conditionFor, NCERT_ORIENTING_GROUPS } from './ncert-unit9-tables'
import {
  assertBalanced,
  formulaFromCounts,
  balancedEquation,
  components,
  CO2,
  countsOf,
  deleteAtoms,
  H2,
  halogensOf,
  heavyNeighbours,
  hydrogenHalide,
  inorganic,
  joinGraphs,
  nameOf,
  nameWithGeometry,
  NA2CO3,
  NAOH,
  O2,
  O3,
  placeAlkene,
  rebuild,
  speciesOf,
  WATER,
  type Species,
  type Term,
} from './hydrocarbon-species'

/** One product of a reaction. `hydrogens` and `degree` are given for substitutions on alkanes. */
export interface ReactionProduct {
  /** The product as a graph; an empty graph for an inorganic product (Na2CO3, ZnO ...). */
  graph: MolGraph
  name: string
  formula: string
  major?: boolean
  /** Where the substituent went on a benzene ring. */
  position?: 'ortho' | 'meta' | 'para' | 'only'
  /** Equivalent hydrogens on the carbon that was substituted (alkane substitution). */
  hydrogens?: number
  /** Degree of the substituted carbon: 0° for methane, else 1°, 2° or 3°. */
  degree?: string
}

/** The result of a reaction model. */
export interface Reaction {
  reactants: string[]
  products: ReactionProduct[]
  /** The balanced equation (mhchem). For reactions with several channels, the first one. */
  equation: string
  /** One balanced equation per product or channel. */
  equations: string[]
  /** The condition NCERT gives for the reaction. */
  conditions: string
  /** One short sentence: why the product forms. */
  why: string
  /** Intermediates considered (carbocations, radicals, the σ-complex). */
  intermediates?: string[]
  /** For substituted benzenes: the group, whether it activates, and its directing effect. */
  substituent?: { group: string; activating: boolean; directs: 'ortho-para' | 'meta' }
  /** Electrophilic substitution: the electrophile, its name and how it is generated. */
  electrophile?: { name: string; formula: string; equation: string }
  /** Electrophilic substitution: the σ-complex (arenium ion) as a graph, with its positive charge. */
  sigmaComplex?: { graph: MolGraph; description: string }
}

const EMPTY: MolGraph = { atoms: [], bonds: [] }
const HALOGENS = ['F', 'Cl', 'Br', 'I']

/** A product entry from a graph. An explicit name or formula overrides the computed one. */
function productOf(graph: MolGraph, extra: Partial<ReactionProduct> = {}): ReactionProduct {
  return {
    graph,
    name: extra.name ?? nameWithGeometry(graph),
    formula: extra.formula ?? molecularFormula(graph),
    ...extra,
  }
}

/** An inorganic product (no graph): its name and formula are given. */
function inorganicProduct(name: string, formula: string, major?: boolean): ReactionProduct {
  return { graph: EMPTY, name, formula, ...(major === undefined ? {} : { major }) }
}

/** Throws unless the graph has only carbon and hydrogen. */
function requireHalocarbon(g: MolGraph): void {
  if (g.atoms.some((a) => !['C', 'H', 'F', 'Cl', 'Br', 'I'].includes(a.element))) {
    throw new RangeError('This reaction model takes a hydrocarbon or an alkyl halide')
  }
}

/** Throws unless the graph has only carbon and hydrogen. */
function requireHydrocarbon(g: MolGraph): void {
  if (g.atoms.some((a) => a.element !== 'C' && a.element !== 'H')) {
    throw new RangeError('This reaction model takes a hydrocarbon (carbon and hydrogen only)')
  }
}

/** The bond between atoms a and b, if any. */
function bondBetween(g: MolGraph, a: number, b: number): MolBond | undefined {
  return g.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
}

/** Number of carbon neighbours of carbon i (its degree: 0 for methane). */
function carbonCount(g: MolGraph, i: number): number {
  return neighbours(g, i).filter((n) => g.atoms[n.atom].element === 'C').length
}

/** Degree label of a carbon: 0° (methane), 1°, 2°, 3° or 4°. */
function degreeLabel(g: MolGraph, i: number): string {
  return `${carbonCount(g, i)}°`
}

/** A term of an equation. */
function term(coef: number, species: Species): Term {
  return { coef, species }
}

/** Species with atom counts changed by `changes` and a new label (for sodium salts). */
function adjusted(species: Species, changes: Record<string, number>, label: string): Species {
  const counts = { ...species.counts }
  for (const [k, v] of Object.entries(changes)) counts[k] = (counts[k] ?? 0) + v
  return { label, counts, name: species.name }
}

/** The hydrogen halide of a halogen symbol, as a species. */
function hx(x: 'Cl' | 'Br' | 'I' | 'F'): Species {
  return hydrogenHalide(x)
}

export { findRings } from './hydrocarbon-species'

/** The benzene ring of a graph (a six-membered carbon ring), or undefined. */
function benzeneRing(g: MolGraph): number[] | undefined {
  return findRings(g, 6).find((r) => r.length === 6 && r.every((i) => g.atoms[i].element === 'C'))
}

/** The heavy atoms bonded to ring atoms that are not part of the ring: the substituents. */
function substituentsOn(g: MolGraph, ring: number[]): { ringAtom: number; sub: number }[] {
  const out: { ringAtom: number; sub: number }[] = []
  for (const r of ring) {
    for (const n of heavyNeighbours(g, r)) {
      if (!ring.includes(n.atom)) out.push({ ringAtom: r, sub: n.atom })
    }
  }
  return out
}

/** Classifies a substituent as one of the NCERT 9.5.6 groups. */
function classifySubstituent(g: MolGraph, sub: number, ringAtom: number): string {
  const atom = g.atoms[sub]
  const others = heavyNeighbours(g, sub).filter((n) => n.atom !== ringAtom)
  const hydrogens = atom.hCount ?? 0
  if (HALOGENS.includes(atom.element)) return `-${atom.element}`
  if (atom.element === 'C') {
    if (others.some((n) => n.order === 3 && g.atoms[n.atom].element === 'N')) return '-CN'
    const carbonyl = others.some((n) => n.order === 2 && g.atoms[n.atom].element === 'O')
    if (carbonyl) {
      if (hydrogens === 1) return '-CHO'
      const singleO = others.find((n) => n.order === 1 && g.atoms[n.atom].element === 'O')
      if (singleO) {
        const acidic = (g.atoms[singleO.atom].hCount ?? 0) === 1
        return acidic ? '-COOH' : '-COOR'
      }
      return '-COR'
    }
    if (others.every((n) => g.atoms[n.atom].element === 'C')) return '-alkyl'
    throw new RangeError('Unsupported carbon substituent')
  }
  if (atom.element === 'O') {
    if (others.length === 0) return '-OH'
    if (others.every((n) => g.atoms[n.atom].element === 'C')) return '-OCH3'
    throw new RangeError('Unsupported oxygen substituent')
  }
  if (atom.element === 'N') {
    if (others.some((n) => n.order === 2 && g.atoms[n.atom].element === 'O') || atom.charge === 1) return '-NO2'
    if (others.some((n) => g.atoms[n.atom].element === 'C' && heavyNeighbours(g, n.atom).some((m) => m.order === 2 && g.atoms[m.atom].element === 'O'))) return '-NHCOCH3'
    if (others.length === 0) return '-NH2'
    return '-NHR'
  }
  if (atom.element === 'S') return '-SO3H'
  throw new RangeError(`Unsupported substituent ${atom.element}`)
}

/** Directing effect of a substituent class (NCERT 9.5.6). Alkyl groups use the -CH3 entry. */
function directingOf(group: string): { activating: boolean; directs: 'ortho-para' | 'meta' } {
  const key = group === '-alkyl' ? '-CH3' : group
  const entry = NCERT_ORIENTING_GROUPS.find((x) => x.group === key)
  if (!entry) throw new RangeError(`NCERT gives no directing rule for ${group}`)
  return { activating: entry.effect === 'activating', directs: entry.directs }
}

/**
 * The intermediate that forms when the electrophile (or radical) bonds to one carbon of a C=C: the
 * other carbon `centre` carries the + charge or the unpaired electron. Hydrogens are rebuilt.
 */
function intermediateAt(g: MolGraph, a: number, b: number, centre: number, kind: 'carbocation' | 'radical'): MolGraph {
  const bond = bondBetween(g, a, b)
  const bonds = g.bonds.map((x) => (x === bond ? { ...x, order: 1 as const } : { ...x }))
  const atoms: MolAtom[] = g.atoms.map((x) => ({ ...x }))
  if (kind === 'carbocation') atoms[centre] = { ...atoms[centre], charge: 1 }
  else atoms[centre] = { ...atoms[centre], radical: 1 }
  return rebuild(atoms, bonds)
}

/** A graph with every charge and unpaired electron removed (after the centre has taken its partner). */
function neutral(g: MolGraph): MolGraph {
  return rebuild(
    g.atoms.map((a) => ({ ...a, charge: undefined, radical: undefined })),
    g.bonds,
  )
}

/** Adds atom `element` bonded to atom `target` (hydrogens rebuilt). */
function addAtomAt(g: MolGraph, target: number, element: string): MolGraph {
  const atoms: MolAtom[] = [...g.atoms.map((a) => ({ ...a })), { element, hCount: 0 }]
  const bonds: MolBond[] = [...g.bonds.map((b) => ({ ...b })), { a: target, b: atoms.length - 1, order: 1 }]
  return rebuild(atoms, bonds)
}

/** One regiochemical candidate for an addition across C=C. */
interface Orientation {
  graph: MolGraph
  stability: number
  text: string
}

/**
 * The two candidate products of an addition of X across C=C. Ionic: the cation forms on one carbon and X
 * joins it. Radical (peroxide): the radical forms on one carbon and X joins the other. Each candidate's
 * stability is intermediateStability of its intermediate, so the more stable intermediate wins.
 */
function orientations(g: MolGraph, a: number, b: number, element: string, mode: 'ionic' | 'radical'): Orientation[] {
  const kind = mode === 'ionic' ? 'carbocation' : 'radical'
  return [a, b].map((centre) => {
    const other = centre === a ? b : a
    const inter = intermediateAt(g, a, b, centre, kind)
    const stability = intermediateStability(kind, inter, centre).stability
    const s = intermediateStability(kind, inter, centre)
    const label = kind === 'carbocation' ? 'carbocation' : 'free radical'
    const text = `${degreeLabel(g, centre)} ${label} at carbon ${centre + 1} (${s.alkylGroups} alkyl group(s), ${s.alphaH} α-H, ${s.resonance} resonance donor(s))`
    const xAt = mode === 'ionic' ? centre : other
    return { graph: addAtomAt(neutral(inter), xAt, element), stability, text }
  })
}

/** Distinct candidates (by canonical key), most stable first. */
function rankOrientations(candidates: Orientation[]): Orientation[] {
  const best = new Map<string, Orientation>()
  for (const c of candidates) {
    const key = canonicalKey(c.graph)
    const prev = best.get(key)
    if (!prev || c.stability > prev.stability) best.set(key, c)
  }
  return [...best.values()].sort((x, y) => y.stability - x.stability)
}

/** The single C=C of a graph, or a RangeError naming the reaction. */
function oneDouble(g: MolGraph, what: string): MolBond {
  const dbl = g.bonds.filter((b) => b.order === 2 && g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C')
  if (dbl.length !== 1) throw new RangeError(`${what} needs exactly one C=C bond`)
  return dbl[0]
}

/** The single C≡C of a graph, or a RangeError. */
function oneTriple(g: MolGraph, what: string): MolBond {
  const tri = g.bonds.filter((b) => b.order === 3)
  if (tri.length !== 1) throw new RangeError(`${what} needs exactly one C≡C bond`)
  return tri[0]
}

/** The alkene from an alkyne: its triple bond becomes a double bond (hydrogens rebuilt). */
function alkyneAsAlkene(g: MolGraph): MolGraph {
  const t = oneTriple(g, 'This step')
  return rebuild(g.atoms, g.bonds.map((b) => (b === t ? { ...b, order: 2 as const } : { ...b })))
}

// ---------------------------------------------------------------------------------------------
// Alkanes
// ---------------------------------------------------------------------------------------------

/**
 * Hydrogenation (NCERT 9.2.2 and 9.3.4): an alkene or alkyne gains hydrogen to form the alkane. With
 * `alkyne: 'lindlar'` one alkyne gives the cis-alkene; with `'sodium-ammonia'` the trans-alkene.
 *
 * @throws {RangeError} For a molecule with no multiple bond, a non-hydrocarbon, or a partial reduction of more than one triple bond
 */
export function hydrogenate(g: MolGraph, options: { alkyne?: 'full' | 'lindlar' | 'sodium-ammonia' } = {}): Reaction {
  requireHydrocarbon(g)
  const multi = g.bonds.filter((b) => b.order > 1)
  if (multi.length === 0) throw new RangeError('Hydrogenation needs a C=C or a C≡C bond')
  const substrate = speciesOf(g)
  const mode = options.alkyne ?? 'full'
  if (mode !== 'full') {
    if (multi.length !== 1 || multi[0].order !== 3) throw new RangeError('Lindlar and sodium-in-ammonia reduce one alkyne to an alkene')
    const t = multi[0]
    const lindlar = mode === 'lindlar'
    const alkene = placeAlkene(rebuild(g.atoms, g.bonds.map((b) => (b === t ? { ...b, order: 2 as const } : { ...b }))), t.a, t.b, lindlar)
    const id = lindlar ? 'lindlar' : 'sodium-ammonia'
    const equation = balancedEquation([term(1, substrate), term(1, H2)], [term(1, speciesOf(alkene))])
    return {
      reactants: [nameOf(g), 'hydrogen'],
      products: [productOf(alkene, { major: true })],
      equation,
      equations: [equation],
      conditions: conditionFor(id).text,
      why: lindlar
        ? 'Lindlar catalyst adds both hydrogens to the same side of the triple bond, so the alkene is cis.'
        : 'Sodium in liquid ammonia adds one electron to each carbon, so the hydrogens end on opposite sides: a trans-alkene.',
    }
  }
  const h2 = multi.reduce((sum, b) => sum + (b.order - 1), 0)
  const alkane = rebuild(g.atoms, g.bonds.map((b) => ({ ...b, order: 1 as const })))
  const equation = balancedEquation([term(1, substrate), term(h2, H2)], [term(1, speciesOf(alkane))])
  return {
    reactants: [nameOf(g), 'hydrogen'],
    products: [productOf(alkane, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('hydrogenation').text,
    why: `Each multiple bond takes up hydrogen across it: ${h2} mol of H2 saturates every bond to give the alkane.`,
  }
}

/**
 * Reduction of an alkyl halide with zinc and acid (NCERT 9.2.2, equation 9.4): R–X + H2 → R–H + HX. Fluorides
 * are not reduced this way.
 *
 * @throws {RangeError} For a molecule without exactly one halogen, or a fluoride
 */
export function reduceAlkylHalide(g: MolGraph): Reaction {
  const hal = halogensOf(g)
  if (hal.length !== 1) throw new RangeError('Zinc and acid reduce an alkyl halide with one halogen')
  const x = g.atoms[hal[0]].element as 'Cl' | 'Br' | 'I' | 'F'
  if (x === 'F') throw new RangeError('Alkyl fluorides are not reduced this way (NCERT 9.2.2)')
  const alkane = deleteAtoms(g, hal)
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, H2)], [term(1, speciesOf(alkane)), term(1, hx(x))])
  return {
    reactants: [nameOf(g), 'hydrogen'],
    products: [productOf(alkane, { major: true }), inorganicProduct(hx(x).name, hx(x).label)],
    equation,
    equations: [equation],
    conditions: conditionFor('zinc-acid').text,
    why: `The C–${x} bond is replaced by C–H; the halogen leaves as ${hx(x).label}.`,
  }
}

/** An alkyl radical: the halide's alkyl part with the halogen removed and an unpaired electron on its carbon. */
function alkylRadical(g: MolGraph): { graph: MolGraph; attach: number } {
  const hal = halogensOf(g)
  if (hal.length !== 1) throw new RangeError('Each alkyl partner must have exactly one halogen')
  const x = hal[0]
  const attachOld = neighbours(g, x)[0].atom
  const kept = g.atoms.map((_, i) => i).filter((i) => i !== x)
  const index = new Map(kept.map((old, i) => [old, i] as const))
  const atoms = kept.map((i) => ({ ...g.atoms[i], radical: i === attachOld ? 1 : undefined }))
  const bonds = g.bonds
    .filter((b) => b.a !== x && b.b !== x)
    .map((b) => ({ ...b, a: index.get(b.a) as number, b: index.get(b.b) as number }))
  return { graph: rebuild(atoms, bonds), attach: index.get(attachOld) as number }
}

/** Two alkyl radicals joined at their attachment carbons: an alkane. */
function couple(r1: { graph: MolGraph; attach: number }, r2: { graph: MolGraph; attach: number }): MolGraph {
  const joined = joinGraphs([r1.graph, r2.graph], [{ a: r1.attach, b: r2.attach + r1.graph.atoms.length, order: 1 }])
  return rebuild(
    joined.atoms.map((a) => ({ ...a, radical: undefined })),
    joined.bonds,
  )
}

/**
 * The Wurtz reaction (NCERT 9.2.2, equations 9.7 and 9.8): alkyl halides and sodium in dry ether give an
 * alkane. Two identical halides give one alkane; two different halides give a mixture of three alkanes
 * (NCERT Exercise 9.25).
 *
 * @throws {RangeError} If a partner has no single halogen
 */
export function wurtz(rx1: MolGraph, rx2: MolGraph): Reaction {
  const r1 = alkylRadical(rx1)
  const r2 = alkylRadical(rx2)
  const x1 = rx1.atoms[halogensOf(rx1)[0]].element
  const x2 = rx2.atoms[halogensOf(rx2)[0]].element
  const na = inorganic('Na', { Na: 1 }, 'sodium')
  const salt = (x: string) => inorganic(`Na${x}`, { Na: 1, [x]: 1 }, `sodium ${x === 'Cl' ? 'chloride' : x === 'Br' ? 'bromide' : 'iodide'}`)
  const cond = conditionFor('wurtz').text
  if (canonicalKey(r1.graph) === canonicalKey(r2.graph)) {
    const rr = couple(r1, r1)
    const equation = balancedEquation([term(1, speciesOf(rx1)), term(1, speciesOf(rx2)), term(2, na)], [term(1, speciesOf(rr)), term(1, salt(x1)), term(1, salt(x2))])
    return {
      reactants: [nameOf(rx1), nameOf(rx2)],
      products: [productOf(rr, { major: true })],
      equation,
      equations: [equation],
      conditions: cond,
      why: 'Two identical alkyl groups couple at the carbon that lost its halogen: one alkane.',
    }
  }
  const aa = couple(r1, r1)
  const ab = couple(r1, r2)
  const bb = couple(r2, r2)
  const eqA = balancedEquation([term(2, speciesOf(rx1)), term(2, na)], [term(1, speciesOf(aa)), term(2, salt(x1))])
  const eqB = balancedEquation([term(1, speciesOf(rx1)), term(1, speciesOf(rx2)), term(2, na)], [term(1, speciesOf(ab)), term(1, salt(x1)), term(1, salt(x2))])
  const eqC = balancedEquation([term(2, speciesOf(rx2)), term(2, na)], [term(1, speciesOf(bb)), term(2, salt(x2))])
  return {
    reactants: [nameOf(rx1), nameOf(rx2)],
    products: [productOf(aa), productOf(ab), productOf(bb)],
    equation: eqB,
    equations: [eqA, eqB, eqC],
    conditions: cond,
    why: 'With two different halides the free radicals pair in all three ways, so a mixture of three alkanes forms and the reaction is not useful.',
    intermediates: ['alkyl free radical from each halide'],
  }
}

/** The index of the carboxyl carbon (bonded to =O and to –OH or –O–), or a RangeError. */
function findCarboxyl(acid: MolGraph): number {
  for (let i = 0; i < acid.atoms.length; i++) {
    if (acid.atoms[i].element !== 'C') continue
    const nb = neighbours(acid, i)
    if (nb.some((n) => n.order === 2 && acid.atoms[n.atom].element === 'O') && nb.some((n) => n.order === 1 && acid.atoms[n.atom].element === 'O')) return i
  }
  throw new RangeError('This reaction needs a carboxylic acid (a –COOH group)')
}

/** The acid with its carboxyl group removed: the rest of the molecule and the carbon that carried the group. */
function carboxylRest(acid: MolGraph, carboxyl: number): { graph: MolGraph; attach: number } {
  const link = heavyNeighbours(acid, carboxyl).filter((n) => acid.atoms[n.atom].element === 'C')
  if (link.length !== 1) throw new RangeError('The carboxyl group must be bonded to one alkyl or aryl carbon')
  const attach = link[0].atom
  const drop = new Set([carboxyl, ...neighbours(acid, carboxyl).map((n) => n.atom).filter((i) => acid.atoms[i].element === 'O')])
  const kept = acid.atoms.map((_, i) => i).filter((i) => !drop.has(i))
  const index = new Map(kept.map((old, i) => [old, i] as const))
  const bonds = acid.bonds
    .filter((b) => index.has(b.a) && index.has(b.b))
    .map((b) => ({ ...b, a: index.get(b.a) as number, b: index.get(b.b) as number }))
  return { graph: rebuild(kept.map((i) => ({ ...acid.atoms[i] })), bonds), attach: index.get(attach) as number }
}

/** The sodium salt of an acid species: its acid hydrogen replaced by sodium. */
function sodiumSalt(acid: Species): Species {
  const label = acid.label.endsWith('OH') ? `${acid.label.slice(0, -2)}ONa` : `${acid.label}Na`
  return adjusted(acid, { H: -1, Na: 1 }, label)
}

/**
 * Decarboxylation with sodalime (NCERT 9.2.2, equation 9.8): RCOONa + NaOH → RH + Na2CO3. The product has one
 * carbon fewer than the acid.
 *
 * @throws {RangeError} If the molecule has no carboxyl group
 */
export function decarboxylate(acid: MolGraph): Reaction {
  const r = carboxylRest(acid, findCarboxyl(acid))
  const equation = balancedEquation([term(1, sodiumSalt(speciesOf(acid))), term(1, NAOH)], [term(1, speciesOf(r.graph)), term(1, NA2CO3)])
  return {
    reactants: [`sodium salt of ${nameOf(acid)}`, 'sodium hydroxide'],
    products: [productOf(r.graph, { major: true }), inorganicProduct('sodium carbonate', 'Na2CO3')],
    equation,
    equations: [equation],
    conditions: conditionFor('sodalime').text,
    why: 'The carboxyl group leaves as carbonate and its carbon is replaced by hydrogen: one carbon fewer.',
  }
}

/**
 * Kolbe's electrolytic method (NCERT 9.2.2, equation 9.9): electrolysis of the sodium salt gives the alkane
 * with twice the carbon skeleton: 2 RCOONa + 2 H2O → R–R + 2 CO2 + H2 + 2 NaOH.
 *
 * @throws {RangeError} If the acid has no carboxyl group, or no alkyl group (formic acid)
 */
export function kolbe(acid: MolGraph): Reaction {
  const r = carboxylRest(acid, findCarboxyl(acid))
  if (r.graph.atoms.length < 1) throw new RangeError('Kolbe electrolysis needs an alkyl group')
  const dimer = couple({ graph: r.graph, attach: r.attach }, { graph: r.graph, attach: r.attach })
  const equation = balancedEquation([term(2, sodiumSalt(speciesOf(acid))), term(2, WATER)], [term(1, speciesOf(dimer)), term(2, CO2), term(1, H2), term(2, NAOH)])
  return {
    reactants: [`sodium salt of ${nameOf(acid)}`, 'water'],
    products: [productOf(dimer, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('kolbe').text,
    why: 'At the anode each carboxylate loses CO2 and the two alkyl free radicals pair: an alkane with twice the carbons.',
  }
}

/**
 * Free-radical halogenation of an alkane (NCERT 9.2.3, equations 9.10 to 9.14): every distinct monohalogenated
 * product, with the number of equivalent hydrogens that lead to it. NCERT gives the reactivity order
 * 3° > 2° > 1° but no yields, so no product is named major.
 *
 * @throws {RangeError} For an unsaturated molecule, or a halogen other than Cl or Br
 */
export function halogenate(alkane: MolGraph, x: 'Cl' | 'Br'): Reaction {
  requireHydrocarbon(alkane)
  if (alkane.bonds.some((b) => b.order > 1)) throw new RangeError('Free-radical halogenation is for alkanes')
  if (x !== 'Cl' && x !== 'Br') throw new RangeError('Only chlorine and bromine are modelled here')
  const groups = new Map<string, { graph: MolGraph; hydrogens: number; carbon: number }>()
  for (let i = 0; i < alkane.atoms.length; i++) {
    const h = alkane.atoms[i].hCount ?? 0
    if (alkane.atoms[i].element !== 'C' || h === 0) continue
    const product = addAtomAt(alkane, i, x)
    const key = canonicalKey(product)
    const found = groups.get(key)
    if (found) found.hydrogens += h
    else groups.set(key, { graph: product, hydrogens: h, carbon: i })
  }
  const rank = (c: string) => (c === '3°' ? 3 : c === '2°' ? 2 : c === '1°' ? 1 : 0)
  const products = [...groups.values()]
    .map((p) => productOf(p.graph, { hydrogens: p.hydrogens, degree: degreeLabel(alkane, p.carbon) }))
    .sort((p, q) => rank(q.degree ?? '') - rank(p.degree ?? ''))
  const equations = products.map((p) =>
    balancedEquation([term(1, speciesOf(alkane)), term(1, inorganic(`${x}2`, { [x]: 2 }, x === 'Cl' ? 'chlorine' : 'bromine'))], [term(1, speciesOf(p.graph)), term(1, hx(x))]),
  )
  return {
    reactants: [nameOf(alkane), x === 'Cl' ? 'chlorine' : 'bromine'],
    products,
    equation: equations[0],
    equations,
    conditions: conditionFor('halogenation').text,
    why: 'A free radical abstracts a hydrogen; a more substituted carbon (3° > 2° > 1°) gives the more stable radical and reacts faster.',
    intermediates: ['alkyl free radical on each carbon that loses a hydrogen'],
  }
}

/**
 * Complete combustion of a hydrocarbon (NCERT 9.2.3, equations 9.17 to 9.19): CxHy + (x + y/4) O2 → x CO2 +
 * y/2 H2O. The equation is doubled when the oxygen coefficient is a half-integer, so every coefficient is whole.
 *
 * @throws {RangeError} If the molecule is not a hydrocarbon
 */
export function combust(g: MolGraph): Reaction {
  requireHydrocarbon(g)
  const c = countsOf(g)
  const x = c.C ?? 0
  const y = c.H ?? 0
  const f = (4 * x + y) % 4 === 0 ? 1 : 2
  const equation = balancedEquation([term(f, speciesOf(g)), term((f * (4 * x + y)) / 4, O2)], [term(f * x, CO2), term((f * y) / 2, WATER)])
  return {
    reactants: [nameOf(g), 'oxygen'],
    products: [inorganicProduct('carbon dioxide', 'CO2', true), inorganicProduct('water', 'H2O', true)],
    equation,
    equations: [equation],
    conditions: conditionFor('combustion').text,
    why: 'Complete combustion of carbon and hydrogen gives carbon dioxide and water, with a large release of heat.',
  }
}

/**
 * Controlled oxidation of alkanes, NCERT's four examples (9.21 to 9.24). The id names the example.
 *
 * @throws {RangeError} For any other id
 */
export function controlledOxidation(id: 'methanol' | 'methanal' | 'ethanoic-acid' | 'tertiary-alcohol'): Reaction {
  const methane = parseSmiles('C')
  const ethane = parseSmiles('CC')
  const oxidant = inorganic('[O]', { O: 1 }, 'oxidant (O)')
  if (id === 'methanol') {
    const product = parseSmiles('CO')
    const eq = balancedEquation([term(2, speciesOf(methane)), term(1, O2)], [term(2, speciesOf(product))])
    return { reactants: ['methane', 'oxygen'], products: [productOf(product, { major: true })], equation: eq, equations: [eq], conditions: conditionFor('methanol').text, why: 'Copper at high pressure oxidises one C–H of methane to C–OH.' }
  }
  if (id === 'methanal') {
    const product = parseSmiles('C=O')
    const eq = balancedEquation([term(1, speciesOf(methane)), term(1, O2)], [term(1, speciesOf(product)), term(1, WATER)])
    return { reactants: ['methane', 'oxygen'], products: [productOf(product, { major: true })], equation: eq, equations: [eq], conditions: conditionFor('methanal').text, why: 'Mo2O3 oxidises methane only as far as methanal.' }
  }
  if (id === 'ethanoic-acid') {
    const product = parseSmiles('CC(=O)O')
    const eq = balancedEquation([term(2, speciesOf(ethane)), term(3, O2)], [term(2, speciesOf(product)), term(2, WATER)])
    return { reactants: ['ethane', 'oxygen'], products: [productOf(product, { major: true })], equation: eq, equations: [eq], conditions: conditionFor('ethanoic-acid').text, why: 'The manganese acetate catalyst oxidises both carbons of ethane to the acid level.' }
  }
  if (id === 'tertiary-alcohol') {
    const reactant = parseSmiles('CC(C)C')
    const product = parseSmiles('CC(C)(C)O')
    const eq = balancedEquation([term(1, speciesOf(reactant)), term(1, oxidant)], [term(1, speciesOf(product))])
    return { reactants: [nameOf(reactant), 'oxidant'], products: [productOf(product, { major: true })], equation: eq, equations: [eq], conditions: conditionFor('tertiary-oxidation').text, why: 'Only a tertiary C–H is oxidised to an alcohol by permanganate.' }
  }
  throw new RangeError(`Unknown controlled oxidation "${id}"`)
}

/**
 * Isomerisation of n-hexane with anhydrous AlCl3 and HCl (NCERT 9.2.3, equation 9.25): the two monomethyl
 * pentanes NCERT names, each as its own equation.
 *
 * @throws {RangeError} If the molecule is not n-hexane
 */
export function isomerise(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('CCCCCC'))) throw new RangeError('The modelled isomerisation is of n-hexane')
  const products = ['CC(C)CCC', 'CCC(C)CC'].map((s) => parseSmiles(s))
  const equations = products.map((p) => balancedEquation([term(1, speciesOf(g))], [term(1, speciesOf(p))]))
  return {
    reactants: ['n-hexane'],
    products: products.map((p) => productOf(p)),
    equation: equations[0],
    equations,
    conditions: conditionFor('isomerisation').text,
    why: 'Branching happens through carbocation rearrangement; the branched isomers are more stable than n-hexane.',
  }
}

/**
 * Aromatisation of n-hexane or n-heptane (NCERT 9.2.3, equation 9.26): benzene or toluene, with four
 * molecules of hydrogen released.
 *
 * @throws {RangeError} If the molecule is neither n-hexane nor n-heptane
 */
export function aromatise(g: MolGraph): Reaction {
  const hexane = canonicalKey(g) === canonicalKey(parseSmiles('CCCCCC'))
  const heptane = canonicalKey(g) === canonicalKey(parseSmiles('CCCCCCC'))
  if (!hexane && !heptane) throw new RangeError('Aromatisation is modelled for n-hexane and n-heptane')
  const product = parseSmiles(hexane ? 'C1=CC=CC=C1' : 'CC1=CC=CC=C1')
  const equation = balancedEquation([term(1, speciesOf(g))], [term(1, speciesOf(product)), term(4, H2)])
  return {
    reactants: [nameOf(g)],
    products: [productOf(product, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('aromatisation').text,
    why: 'Dehydrogenation and ring closure on the oxide catalyst give an aromatic ring, with four H2 released.',
  }
}

/**
 * Steam reforming of methane (NCERT 9.2.3, equation 9.27): CH4 + H2O → CO + 3 H2 over nickel at 1273 K.
 *
 * @throws {RangeError} If the molecule is not methane
 */
export function steamReform(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('C'))) throw new RangeError('Steam reforming is modelled for methane')
  const co = inorganic('CO', { C: 1, O: 1 }, 'carbon monoxide')
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, WATER)], [term(1, co), term(3, H2)])
  return {
    reactants: ['methane', 'water'],
    products: [inorganicProduct('carbon monoxide', 'CO', true), inorganicProduct('hydrogen', 'H2', true)],
    equation,
    equations: [equation],
    conditions: conditionFor('steam-reforming').text,
    why: 'Methane reacts with steam over nickel at high temperature to give carbon monoxide and hydrogen.',
  }
}

/**
 * Pyrolysis (cracking) of alkanes, NCERT's examples only (9.28 and 9.29): n-hexane at 773 K gives three
 * channels, and dodecane at 973 K with Pt, Pd or Ni gives heptane and pentene.
 *
 * @throws {RangeError} For a molecule other than n-hexane or dodecane
 */
export function pyrolysis(g: MolGraph): Reaction {
  if (canonicalKey(g) === canonicalKey(parseSmiles('CCCCCC'))) {
    const channels: [Species, number][][] = [
      [[speciesOf(parseSmiles('C=CCCCC')), 1], [H2, 1]],
      [[speciesOf(parseSmiles('C=CCC')), 1], [speciesOf(parseSmiles('CC')), 1]],
      [[speciesOf(parseSmiles('C=CC')), 1], [speciesOf(parseSmiles('C=C')), 1], [speciesOf(parseSmiles('C')), 1]],
    ]
    const equations = channels.map((ch) => balancedEquation([term(1, speciesOf(g))], ch.map(([s, c]) => term(c, s))))
    return {
      reactants: ['n-hexane'],
      products: [productOf(parseSmiles('C=CCCCC')), productOf(parseSmiles('C=CCC')), productOf(parseSmiles('CC')), productOf(parseSmiles('C=CC')), productOf(parseSmiles('C=C')), productOf(parseSmiles('C'))],
      equation: equations[0],
      equations,
      conditions: conditionFor('pyrolysis').text,
      why: 'Heating breaks C–C and C–H bonds at random, so pyrolysis gives a mixture of smaller alkanes and alkenes.',
    }
  }
  if (canonicalKey(g) === canonicalKey(parseSmiles('CCCCCCCCCCCC'))) {
    const heptane = parseSmiles('CCCCCCC')
    const pentene = parseSmiles('C=CCCC')
    const equation = balancedEquation([term(1, speciesOf(g))], [term(1, speciesOf(heptane)), term(1, speciesOf(pentene))])
    return {
      reactants: ['dodecane'],
      products: [productOf(heptane), productOf(pentene)],
      equation,
      equations: [equation],
      conditions: conditionFor('pyrolysis').text,
      why: 'Dodecane cracks to heptane and a pentene; NCERT notes that other products form as well.',
    }
  }
  throw new RangeError('Pyrolysis is modelled for n-hexane and dodecane (NCERT 9.28, 9.29)')
}

// ---------------------------------------------------------------------------------------------
// Alkenes
// ---------------------------------------------------------------------------------------------

/**
 * Electrophilic addition of HX across a C=C (NCERT 9.3.5). Markovnikov: the carbocation on the more
 * substituted carbon is more stable, and X joins it. With `peroxide: true` (HBr only) the free radical
 * reaction gives the anti-Markovnikov product. Both candidates are returned, the major one flagged.
 *
 * @throws {RangeError} If there is no single C=C, or peroxide is used with HCl or HI
 */
export function addHX(g: MolGraph, reagent: 'HCl' | 'HBr' | 'HI', options: { peroxide?: boolean } = {}): Reaction {
  requireHalocarbon(g)
  const { a, b } = oneDouble(g, 'Addition of HX')
  if (options.peroxide && reagent !== 'HBr') throw new RangeError('The peroxide effect is observed only with HBr (NCERT 9.3.5)')
  const peroxide = options.peroxide === true
  const x = reagent.slice(1) as 'Cl' | 'Br' | 'I'
  const ranked = rankOrientations(orientations(g, a, b, x, peroxide ? 'radical' : 'ionic'))
  const products = ranked.map((c, i) => productOf(c.graph, { major: i === 0 }))
  const id = peroxide ? 'peroxide' : 'hx-addition'
  const equations = products.map((p) => balancedEquation([term(1, speciesOf(g)), term(1, hx(x))], [term(1, speciesOf(p.graph !== EMPTY ? p.graph : g))]))
  return {
    reactants: [nameOf(g), reagent],
    products,
    equation: equations[0],
    equations,
    conditions: conditionFor(id).text,
    why: peroxide
      ? 'The peroxide starts a radical chain: Br• adds to the less substituted carbon so that the more stable (more substituted) radical forms.'
      : 'Markovnikov: H+ adds to the carbon that keeps more hydrogens, so the more stable (more substituted) carbocation forms and the halide joins it.',
    intermediates: ranked.map((c) => c.text),
  }
}

/**
 * Addition of Cl2 or Br2 across a C=C (NCERT 9.3.5, equations 9.38 and 9.39): the vicinal dihalide. Bromine
 * in CCl4 is decolourised: the test for unsaturation.
 *
 * @throws {RangeError} If there is no single C=C
 */
export function addX2(g: MolGraph, x2: 'Cl2' | 'Br2'): Reaction {
  requireHalocarbon(g)
  const dbl = oneDouble(g, 'Addition of a halogen')
  const x = x2.slice(0, -1) as 'Cl' | 'Br'
  const singled = rebuild(g.atoms, g.bonds.map((b) => (b === dbl ? { ...b, order: 1 as const } : { ...b })))
  const product = addAtomAt(addAtomAt(singled, dbl.a, x), dbl.b, x)
  const molecule = inorganic(x2, { [x]: 2 }, x === 'Cl' ? 'chlorine' : 'bromine')
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, molecule)], [term(1, speciesOf(product))])
  return {
    reactants: [nameOf(g), x2],
    products: [productOf(product, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('x2-addition').text,
    why: 'The halogen adds across the π bond: one halogen goes on each carbon of the double bond.',
  }
}

/**
 * Addition of cold concentrated H2SO4 across a C=C (NCERT 9.3.5, equations 9.44 and 9.45): Markovnikov, giving
 * an alkyl hydrogen sulphate.
 *
 * @throws {RangeError} If there is no single C=C
 */
export function addH2SO4(g: MolGraph): Reaction {
  requireHydrocarbon(g)
  const { a, b } = oneDouble(g, 'Addition of H2SO4')
  const ranked = rankOrientations(orientations(g, a, b, 'O', 'ionic'))
  const alcohol = ranked[0].graph
  const alcoholName = nameOf(alcohol)
  const alkylName = alcoholName.replace(/anol$/, 'yl').replace(/-ol$/, '-yl').replace(/ol$/, 'yl')
  const name = `${alkylName} hydrogen sulphate`
  // Replace the alcohol's hydrogen by the SO3H group. Sulphur's valence is beyond the parser, so the
  // group is added after the carbon skeleton has been rebuilt and its hydrogens are set by hand.
  const oxygen = alcohol.atoms.findIndex((a, i) => a.element === 'O' && heavyNeighbours(alcohol, i).length === 1)
  const atoms: MolAtom[] = alcohol.atoms.map((a, i) => (i === oxygen ? { ...a, hCount: 0 } : { ...a }))
  const s = atoms.length
  atoms.push({ element: 'S', hCount: 0 }, { element: 'O', hCount: 0 }, { element: 'O', hCount: 0 }, { element: 'O', hCount: 1 })
  const bonds: MolBond[] = [
    ...alcohol.bonds.map((x) => ({ ...x })),
    { a: oxygen, b: s, order: 1 },
    { a: s, b: s + 1, order: 2 },
    { a: s, b: s + 2, order: 2 },
    { a: s, b: s + 3, order: 1 },
  ]
  const sulphate: MolGraph = { atoms, bonds }
  const counts = { ...countsOf(g), H: (countsOf(g).H ?? 0) + 2, S: 1, O: 4 }
  const sulphateSpecies: Species = { label: name, counts, name }
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, inorganic('H2SO4', { H: 2, S: 1, O: 4 }, 'sulphuric acid'))], [term(1, sulphateSpecies)])
  return {
    reactants: [nameOf(g), 'sulphuric acid'],
    products: [productOf(sulphate, { name, formula: molecularFormula(alcohol).replace(/O\d*$/, '') + 'OSO3H', major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('h2so4-addition').text,
    why: 'H+ adds to the carbon that keeps more hydrogens, and the hydrogen sulphate joins the more substituted carbon (Markovnikov).',
    intermediates: ranked.map((c) => c.text),
  }
}

/**
 * Acid-catalysed hydration of an alkene (NCERT 9.3.5, equation 9.46): Markovnikov, giving the alcohol with
 * –OH on the more substituted carbon.
 *
 * @throws {RangeError} If there is no single C=C
 */
export function hydrate(g: MolGraph): Reaction {
  requireHydrocarbon(g)
  const { a, b } = oneDouble(g, 'Hydration')
  const ranked = rankOrientations(orientations(g, a, b, 'O', 'ionic'))
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, WATER)], [term(1, speciesOf(ranked[0].graph))])
  return {
    reactants: [nameOf(g), 'water'],
    products: [productOf(ranked[0].graph, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('hydration').text,
    why: 'Markovnikov: the carbocation on the more substituted carbon is captured by water, so the –OH goes there.',
    intermediates: ranked.map((c) => c.text),
  }
}

/**
 * Baeyer's reagent (cold, dilute, alkaline KMnO4, NCERT 9.3.5, equation 9.47): an alkene gives a vicinal diol.
 * The loss of the purple colour is the test for unsaturation.
 *
 * @throws {RangeError} If there is no single C=C
 */
export function baeyer(g: MolGraph): Reaction {
  requireHydrocarbon(g)
  const dbl = oneDouble(g, 'Baeyer oxidation')
  const singled = rebuild(g.atoms, g.bonds.map((b) => (b === dbl ? { ...b, order: 1 as const } : { ...b })))
  const diol = addAtomAt(addAtomAt(singled, dbl.a, 'O'), dbl.b, 'O')
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, WATER), term(1, inorganic('[O]', { O: 1 }, 'oxidant (O)'))], [term(1, speciesOf(diol))])
  return {
    reactants: [nameOf(g), 'water', 'cold dilute KMnO4'],
    products: [productOf(diol, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('baeyer').text,
    why: 'Each carbon of the C=C gains an –OH from the permanganate; the purple colour is lost (Baeyer test).',
  }
}

/**
 * Splits every C=C of a graph and puts oxygen on each end. In 'carbonyl' mode each end becomes a carbonyl
 * (aldehyde or ketone). In 'acid' mode a CH end becomes COOH, a CH2 end becomes CO2 and a fully substituted
 * end becomes a ketone. Returns the fragments.
 */
function cleaveDoubleBonds(g: MolGraph, mode: 'carbonyl' | 'acid', doubles: MolBond[]): MolGraph[] {
  const atoms: MolAtom[] = g.atoms.map((a) => ({ ...a }))
  const bonds: MolBond[] = g.bonds.filter((b) => !doubles.includes(b)).map((b) => ({ ...b }))
  for (const d of doubles) {
    for (const end of [d.a, d.b]) {
      const hydrogens = g.atoms[end].hCount ?? 0
      atoms.push({ element: 'O', hCount: 0 })
      bonds.push({ a: end, b: atoms.length - 1, order: 2 })
      if (mode === 'acid' && hydrogens === 1) {
        atoms.push({ element: 'O', hCount: 0 })
        bonds.push({ a: end, b: atoms.length - 1, order: 1 })
      }
      if (mode === 'acid' && hydrogens === 2) {
        atoms.push({ element: 'O', hCount: 0 })
        bonds.push({ a: end, b: atoms.length - 1, order: 2 })
      }
    }
  }
  const whole = rebuild(atoms, bonds)
  return components(whole).map((group) => {
    const index = new Map(group.map((old, i) => [old, i] as const))
    return rebuild(
      group.map((i) => ({ ...whole.atoms[i] })),
      whole.bonds
        .filter((b) => index.has(b.a) && index.has(b.b))
        .map((b) => ({ ...b, a: index.get(b.a) as number, b: index.get(b.b) as number })),
    )
  })
}

/**
 * Oxidative cleavage of an alkene by hot acidic KMnO4 (NCERT 9.3.5, equations 9.49 and 9.50): the C=C breaks
 * to ketones and acids, and a CH2 end gives CO2 and water. The equation is balanced with [O].
 *
 * @throws {RangeError} If there is no C=C
 */
export function acidicPermanganate(g: MolGraph): Reaction {
  requireHydrocarbon(g)
  if (!g.bonds.some((b) => b.order === 2)) throw new RangeError('Acidic permanganate cleaves a C=C')
  const fragments = cleaveDoubleBonds(g, 'acid', g.bonds.filter((b) => b.order === 2))
  const productH = fragments.reduce((s, f) => s + (countsOf(f).H ?? 0), 0)
  const productO = fragments.reduce((s, f) => s + (countsOf(f).O ?? 0), 0)
  const water = ((countsOf(g).H ?? 0) - productH) / 2
  if (!Number.isInteger(water) || water < 0) throw new RangeError('The cleavage products do not balance with water')
  const equation = balancedEquation([term(1, speciesOf(g)), term(productO + water, inorganic('[O]', { O: 1 }, 'oxidant (O)'))], [...fragments.map((f) => term(1, speciesOf(f))), ...(water > 0 ? [term(water, WATER)] : [])])
  return {
    reactants: [nameOf(g), 'acidic KMnO4'],
    products: fragments.map((f, i) => productOf(f, { major: i === 0 })),
    equation,
    equations: [equation],
    conditions: conditionFor('acidic-permanganate').text,
    why: 'Each end of the broken C=C is oxidised: a carbon with two alkyl groups gives a ketone, one with a hydrogen gives an acid, and a CH2 gives CO2.',
  }
}

/**
 * Ozonolysis of an alkene, or of each C=C of a diene (NCERT 9.3.5, equations 9.51 and 9.52): the ozonide is
 * reduced with Zn and water to aldehydes and ketones, and zinc oxide is formed.
 *
 * @throws {RangeError} If there is no C=C
 */
export function ozonolysis(g: MolGraph, options: { aromatic?: 'keep' | 'cleave' } = {}): Reaction {
  requireHydrocarbon(g)
  const ring = huckel(g)
  const aromaticRing = ring.verdict === 'aromatic' && options.aromatic !== 'cleave' ? new Set(ring.ring) : new Set<number>()
  const doubles = g.bonds.filter((b) => b.order === 2 && !(aromaticRing.has(b.a) && aromaticRing.has(b.b)))
  const n = doubles.length
  if (n === 0) throw new RangeError('Ozonolysis needs a C=C outside an aromatic ring')
  const fragments = cleaveDoubleBonds(g, 'carbonyl', doubles)
  const equation = balancedEquation([term(1, speciesOf(g)), term(n, O3), term(n, inorganic('Zn', { Zn: 1 }, 'zinc'))], [...fragments.map((f) => term(1, speciesOf(f))), term(n, inorganic('ZnO', { Zn: 1, O: 1 }, 'zinc oxide'))])
  return {
    reactants: [nameOf(g), 'ozone'],
    products: fragments.map((f) => productOf(f, { major: true })),
    equation,
    equations: [equation],
    conditions: conditionFor('ozonolysis').text,
    why: 'Each C=C is broken where the ozonide forms; each carbon of the bond becomes an aldehyde (if it had a hydrogen) or a ketone.',
  }
}

/**
 * The alkene that gives two given carbonyl compounds on ozonolysis (NCERT Exercises 9.5 and 9.7): the two
 * carbonyl carbons are joined by a C=C. Exactly two carbonyl carbons must be present.
 *
 * @throws {RangeError} If the products do not carry exactly two carbonyl carbons
 */
export function ozonolysisReverse(products: MolGraph[]): Reaction {
  const found: { part: number; atom: number; oxygen: number }[] = []
  products.forEach((p, part) => {
    p.atoms.forEach((a, i) => {
      if (a.element !== 'C') return
      const nb = neighbours(p, i)
      const o = nb.find((n) => n.order === 2 && p.atoms[n.atom].element === 'O')
      if (o && !nb.some((n) => n.order === 2 && p.atoms[n.atom].element === 'C')) found.push({ part, atom: i, oxygen: o.atom })
    })
  })
  if (found.length !== 2) throw new RangeError('Reverse ozonolysis needs exactly two carbonyl carbons')
  // Remove each carbonyl oxygen first, then join the two carbons by a double bond.
  const stripped = products.map((p, part) => {
    const drop = found.filter((f) => f.part === part).map((f) => f.oxygen)
    return drop.length ? deleteAtoms(p, drop) : p
  })
  const newIndex = (part: number, atom: number): number => {
    const removed = found.filter((f) => f.part === part).map((f) => f.oxygen).filter((o) => o < atom).length
    return atom - removed
  }
  const offsets: number[] = []
  let running = 0
  for (const p of stripped) {
    offsets.push(running)
    running += p.atoms.length
  }
  const first = found[0]
  const second = found[1]
  const alkene = joinGraphs(stripped, [
    { a: offsets[first.part] + newIndex(first.part, first.atom), b: offsets[second.part] + newIndex(second.part, second.atom), order: 2 },
  ])
  const forward = ozonolysis(alkene)
  return {
    reactants: products.map((p) => nameOf(p)),
    products: [productOf(alkene, { major: true })],
    equation: forward.equation,
    equations: [forward.equation],
    conditions: conditionFor('ozonolysis').text,
    why: 'The two carbonyl carbons were joined by a double bond; the forward ozonolysis of that alkene gives back these carbonyl compounds.',
  }
}

/**
 * Polymerisation of an alkene (NCERT 9.3.6, equations 9.53 and 9.54): the monomers join through the opened
 * π bonds. The repeat unit is returned, named poly(monomer).
 *
 * @throws {RangeError} If there is no single C=C
 */
export function polymerise(monomer: MolGraph): Reaction {
  requireHydrocarbon(monomer)
  const dbl = oneDouble(monomer, 'Polymerisation')
  const unit: MolGraph = {
    atoms: monomer.atoms.map((a) => ({ ...a })),
    bonds: monomer.bonds.map((b) => (b === dbl ? { ...b, order: 1 as const } : { ...b })),
  }
  const name = `poly(${nameOf(monomer)})`
  const equation = balancedEquation([term(1, speciesOf(monomer))], [term(1, { label: `(${speciesOf(monomer).label})n`, counts: countsOf(monomer), name })])
  return {
    reactants: [nameOf(monomer)],
    products: [{ graph: unit, name, formula: `(${molecularFormula(monomer)})n` }],
    equation,
    equations: [equation],
    conditions: conditionFor('polymerisation').text,
    why: 'The π bond of each monomer opens and the monomers join end to end, so the polymer repeats one unit.',
  }
}

/**
 * β-elimination from an alkyl halide with alcoholic KOH (NCERT 9.3.2, equation 9.34): every alkene that can
 * form is listed. NCERT gives the rate order (tertiary > secondary > primary; I > Br > Cl) but no major
 * alkene, so none is named major.
 *
 * @throws {RangeError} If the molecule does not have exactly one halogen
 */
export function eliminate(g: MolGraph): Reaction {
  const hal = halogensOf(g)
  if (hal.length !== 1) throw new RangeError('Elimination from an alkyl halide needs one halogen')
  return betaElimination(g, hal[0], 'halide')
}

/**
 * Dehydration of an alcohol with conc. H2SO4 (NCERT 9.3.4, equation 9.37): β-elimination of water.
 *
 * @throws {RangeError} If the molecule has no –OH group
 */
export function dehydrate(g: MolGraph): Reaction {
  const oxygen = g.atoms.findIndex((a, i) => a.element === 'O' && (a.hCount ?? 0) === 1 && heavyNeighbours(g, i).length === 1)
  if (oxygen < 0) throw new RangeError('Dehydration needs an alcohol (–OH)')
  return betaElimination(g, oxygen, 'alcohol')
}

/** Shared β-elimination: removes the leaving group and a β-hydrogen, for every β-carbon that has one. */
function betaElimination(g: MolGraph, leaving: number, kind: 'halide' | 'alcohol'): Reaction {
  const alpha = neighbours(g, leaving)[0].atom
  const alkenes = new Map<string, MolGraph>()
  for (const beta of heavyNeighbours(g, alpha)) {
    if (g.atoms[beta.atom].element !== 'C' || (g.atoms[beta.atom].hCount ?? 0) === 0) continue
    const kept = g.atoms.map((_, i) => i).filter((i) => i !== leaving)
    const index = new Map(kept.map((old, i) => [old, i] as const))
    const bonds = g.bonds
      .filter((b) => b.a !== leaving && b.b !== leaving)
      .map((b) => {
        const isPi = (b.a === alpha && b.b === beta.atom) || (b.a === beta.atom && b.b === alpha)
        return { ...b, order: isPi ? (2 as const) : b.order, a: index.get(b.a) as number, b: index.get(b.b) as number }
      })
    const alkene = rebuild(kept.map((i) => ({ ...g.atoms[i] })), bonds)
    alkenes.set(canonicalKey(alkene), alkene)
  }
  if (alkenes.size === 0) throw new RangeError('No β-hydrogen to eliminate')
  const graphs = [...alkenes.values()]
  const reactant = speciesOf(g)
  const leavingSpecies = kind === 'halide' ? hx(g.atoms[leaving].element as 'Cl' | 'Br' | 'I' | 'F') : WATER
  const equations = graphs.map((alkene) => {
    if (kind === 'alcohol') {
      return balancedEquation([term(1, reactant)], [term(1, speciesOf(alkene)), term(1, WATER)])
    }
    const x = g.atoms[leaving].element
    const kx = inorganic(`KX`, { K: 1, [x]: 1 }, 'potassium halide')
    return balancedEquation([term(1, reactant), term(1, inorganic('KOH', { K: 1, O: 1, H: 1 }, 'potassium hydroxide'))], [term(1, speciesOf(alkene)), term(1, kx), term(1, WATER)])
  })
  void leavingSpecies
  return {
    reactants: [nameOf(g), kind === 'halide' ? 'alcoholic KOH' : 'conc. H2SO4'],
    products: graphs.map((alkene) => productOf(alkene)),
    equation: equations[0],
    equations,
    conditions: conditionFor(kind === 'halide' ? 'dehydrohalogenation' : 'dehydration').text,
    why: 'A β-hydrogen leaves with the leaving group and the C=C forms between the α and β carbons. Every alkene that can form is listed; NCERT names no major one.',
  }
}

/**
 * Dehalogenation of a vicinal dihalide with zinc (NCERT 9.3.2, equations 9.35 and 9.36): the two halogens
 * leave as ZnX2 and the C=C forms.
 *
 * @throws {RangeError} If the halogens are not on adjacent carbons
 */
export function dehalogenate(g: MolGraph): Reaction {
  const hal = halogensOf(g)
  if (hal.length !== 2) throw new RangeError('Zinc removes two halogens from a vicinal dihalide')
  const [p, q] = hal
  const cp = neighbours(g, p)[0].atom
  const cq = neighbours(g, q)[0].atom
  if (!bondBetween(g, cp, cq)) throw new RangeError('The halogens must be on adjacent carbons (vicinal)')
  const kept = g.atoms.map((_, i) => i).filter((i) => i !== p && i !== q)
  const index = new Map(kept.map((old, i) => [old, i] as const))
  const bonds = g.bonds
    .filter((b) => b.a !== p && b.b !== p && b.a !== q && b.b !== q)
    .map((b) => {
      const pair = (b.a === cp && b.b === cq) || (b.a === cq && b.b === cp)
      return { ...b, a: index.get(b.a) as number, b: index.get(b.b) as number, order: pair ? (2 as const) : b.order }
    })
  const alkene = rebuild(kept.map((i) => ({ ...g.atoms[i] })), bonds)
  const x = g.atoms[p].element
  const znX2 = inorganic('ZnX2', { Zn: 1, [x]: 2 }, `zinc ${x === 'Br' ? 'bromide' : x === 'Cl' ? 'chloride' : 'iodide'}`)
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, inorganic('Zn', { Zn: 1 }, 'zinc'))], [term(1, speciesOf(alkene)), term(1, znX2)])
  return {
    reactants: [nameOf(g), 'zinc'],
    products: [productOf(alkene, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('dehalogenation').text,
    why: 'Zinc takes the two halogens as ZnX2, and the two carbons left bare form the C=C.',
  }
}

// ---------------------------------------------------------------------------------------------
// Alkynes
// ---------------------------------------------------------------------------------------------

/** Acidity of an alkyne (NCERT 9.4.4 A): a C–H on a triply bonded carbon is acidic; an internal alkyne has none. */
export function alkyneAcidity(g: MolGraph): { acidic: boolean; acidicCarbons: number[]; reason: string } {
  const tri = g.bonds.filter((b) => b.order === 3)
  if (tri.length === 0) throw new RangeError('Alkyne acidity needs a C≡C')
  const carbons = [...new Set(tri.flatMap((t) => [t.a, t.b]))]
  const acidicCarbons = carbons.filter((i) => (g.atoms[i].hCount ?? 0) > 0 && hybridisation(g, i) === 'sp')
  const reason = acidicCarbons.length
    ? 'The C–H on a triply bonded (sp) carbon is acidic: sp carbon has 50% s character, so its electrons are held close to the nucleus.'
    : 'No C–H sits on a triply bonded carbon, so no alkyne hydrogen is acidic (an internal alkyne).'
  return { acidic: acidicCarbons.length > 0, acidicCarbons, reason }
}

/**
 * Formation of a sodium acetylide from a terminal alkyne (NCERT 9.4.4 A, equations 9.59 to 9.61): with sodium the
 * hydrogen leaves as H2; with sodamide it leaves as NH3.
 *
 * @throws {RangeError} For an internal alkyne or a molecule with no C≡C–H
 */
export function acetylide(g: MolGraph, base: 'Na' | 'NaNH2'): Reaction {
  const { acidic, acidicCarbons } = alkyneAcidity(g)
  if (!acidic) throw new RangeError('Only a terminal alkyne forms an acetylide')
  const c = acidicCarbons[0]
  const anion = rebuild(g.atoms.map((a, i) => (i === c ? { ...a, charge: -1 } : { ...a })), g.bonds.map((b) => ({ ...b })))
  const alkyne = speciesOf(g)
  const salt = adjusted(alkyne, { H: -1, Na: 1 }, `${alkyne.label.slice(0, -1)}Na`)
  const name = `sodium ${nameOf(g).replace(/yne$/, 'ynide')}`
  const equation =
    base === 'Na'
      ? balancedEquation([term(2, alkyne), term(2, inorganic('Na', { Na: 1 }, 'sodium'))], [term(2, salt), term(1, H2)])
      : balancedEquation([term(1, alkyne), term(1, inorganic('NaNH2', { Na: 1, N: 1, H: 2 }, 'sodamide'))], [term(1, salt), term(1, inorganic('NH3', { N: 1, H: 3 }, 'ammonia'))])
  return {
    reactants: [nameOf(g), base === 'Na' ? 'sodium' : 'sodamide'],
    products: [{ graph: anion, name, formula: formulaFromCounts(salt.counts) }],
    equation,
    equations: [equation],
    conditions: conditionFor('acetylide-sodium').text,
    why: 'The sp C–H is acidic enough to be replaced by sodium: the acetylide ion forms and the hydrogen leaves as H2 or NH3.',
  }
}

/**
 * Stepwise addition to an alkyne (NCERT 9.4.4 B, equations 9.62 to 9.68): with H2 (alkene, then alkane), with X2
 * (dihaloalkene, then the tetrahalide), with HX (vinyl halide, then the gem-dihalide) or with water under Hg2+
 * (enol, then the carbonyl compound: ethanal from ethyne, a ketone from other alkynes). Each step is returned.
 *
 * @throws {RangeError} If the molecule has no single C≡C, or the reagent is not one of the four
 */
export function addToAlkyne(g: MolGraph, reagent: 'H2' | 'X2' | 'HX' | 'H2O', options: { x?: 'Cl' | 'Br' } = {}): Reaction {
  requireHydrocarbon(g)
  const t = oneTriple(g, 'Addition to an alkyne')
  const x = options.x ?? 'Br'
  if (reagent === 'H2') {
    const first = hydrogenate(g, { alkyne: 'lindlar' })
    const second = hydrogenate(first.products[0].graph)
    return {
      reactants: [nameOf(g), 'hydrogen'],
      products: [first.products[0], second.products[0]],
      equation: first.equation,
      equations: [first.equation, second.equation],
      conditions: conditionFor('alkyne-h2').text,
      why: 'Hydrogen adds first to give the alkene and then to give the alkane; the Lindlar step gives the cis-alkene.',
    }
  }
  const alkene = alkyneAsAlkene(g)
  if (reagent === 'X2') {
    const dihalo = addAtomAt(addAtomAt(alkene, t.a, x), t.b, x)
    const step1 = balancedEquation([term(1, speciesOf(g)), term(1, inorganic(`${x}2`, { [x]: 2 }, x === 'Cl' ? 'chlorine' : 'bromine'))], [term(1, speciesOf(dihalo))])
    const tetra = addX2(dihalo, `${x}2` as 'Cl2' | 'Br2')
    return {
      reactants: [nameOf(g), `${x}2`],
      products: [productOf(dihalo), tetra.products[0]],
      equation: step1,
      equations: [step1, tetra.equation],
      conditions: conditionFor('x2-addition').text,
      why: 'Two halogen molecules add, one across each π bond: a dihaloalkene, then the tetrahalide.',
    }
  }
  if (reagent === 'HX') {
    const hxReagent = `H${x}` as 'HCl' | 'HBr'
    // The first HX gives a vinyl halide: the halogen joins one alkyne carbon and the C=C is kept.
    const vinyl = addAtomAt(alkene, t.a, x)
    const firstEq = balancedEquation([term(1, speciesOf(g)), term(1, hx(x))], [term(1, speciesOf(vinyl))])
    const second = addHX(vinyl, hxReagent)
    return {
      reactants: [nameOf(g), hxReagent],
      products: [productOf(vinyl), second.products[0]],
      equation: firstEq,
      equations: [firstEq, second.equation],
      conditions: conditionFor('alkyne-hx').text,
      why: 'Markovnikov addition twice: the first gives a vinyl halide and the second puts two halogens on one carbon (gem-dihalide).',
    }
  }
  // Hg2+ hydration: water adds across the triple bond to give an enol; the enol tautomerises to the carbonyl.
  // The internal carbon (more carbon neighbours) takes the –OH, as in Markovnikov addition.
  const degreeOf = (i: number) => carbonCount(alkene, i)
  const t1 = degreeOf(t.a) >= degreeOf(t.b) ? t.a : t.b
  const other = t1 === t.a ? t.b : t.a
  const enol = addAtomAt(alkene, t1, 'O')
  const carbonyl = rebuild(
    enol.atoms,
    enol.bonds.map((b) => {
      const onOther = (b.a === t1 && b.b === other) || (b.a === other && b.b === t1)
      if (onOther) return { ...b, order: 1 as const }
      const onO = (b.a === t1 && b.b === enol.atoms.length - 1) || (b.a === enol.atoms.length - 1 && b.b === t1)
      return onO ? { ...b, order: 2 as const } : { ...b }
    }),
  )
  const eq1 = balancedEquation([term(1, speciesOf(g)), term(1, WATER)], [term(1, speciesOf(enol))])
  const eq2 = balancedEquation([term(1, speciesOf(enol))], [term(1, speciesOf(carbonyl))])
  return {
    reactants: [nameOf(g), 'water'],
    products: [productOf(enol), productOf(carbonyl, { major: true })],
    equation: eq1,
    equations: [eq1, eq2],
    conditions: conditionFor('alkyne-hydration').text,
    why: 'Water adds Markovnikov to give an enol (–C(OH)=CH2), which tautomerises to the carbonyl compound: ethanal from ethyne, a ketone from other alkynes.',
  }
}

/**
 * Cyclic polymerisation of ethyne over a red-hot iron tube at 873 K (NCERT 9.4.4 and equation 9.69): 3 C2H2 → C6H6.
 *
 * @throws {RangeError} If the molecule is not ethyne
 */
export function cyclicPolymerise(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('C#C'))) throw new RangeError('Cyclic polymerisation is modelled for ethyne')
  const benzene = parseSmiles('C1=CC=CC=C1')
  const equation = balancedEquation([term(3, speciesOf(g))], [term(1, speciesOf(benzene))])
  return {
    reactants: ['ethyne'],
    products: [productOf(benzene, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('cyclic-polymerisation').text,
    why: 'Three ethyne molecules join to close a six-membered ring over the hot iron.',
  }
}

/**
 * Ethyne from calcium carbide and water (NCERT 9.4.3, equations 9.55 to 9.57): CaC2 + 2 H2O → Ca(OH)2 + C2H2.
 */
export function fromCalciumCarbide(): Reaction {
  const carbide = inorganic('CaC2', { Ca: 1, C: 2 }, 'calcium carbide')
  const slaked = inorganic('Ca(OH)2', { Ca: 1, O: 2, H: 2 }, 'calcium hydroxide')
  const ethyne = parseSmiles('C#C')
  const equation = balancedEquation([term(1, carbide), term(2, WATER)], [term(1, slaked), term(1, speciesOf(ethyne))])
  return {
    reactants: ['calcium carbide', 'water'],
    products: [productOf(ethyne, { major: true }), inorganicProduct('calcium hydroxide', 'Ca(OH)2')],
    equation,
    equations: [equation],
    conditions: conditionFor('calcium-carbide').text,
    why: 'Water hydrolyses the carbide ion (C2²⁻) to ethyne.',
  }
}

/**
 * An alkyne from a vicinal dihalide: two HX leave, the triple bond forms. NCERT uses alcoholic KOH and then
 * NaNH2 (text, p. 316); the equation written here is for the dehydrohalogenation to the alkyne.
 *
 * @throws {RangeError} If the halogens are not on adjacent carbons
 */
export function fromVicinalDihalide(g: MolGraph): Reaction {
  const hal = halogensOf(g)
  if (hal.length !== 2) throw new RangeError('An alkyne is made from a dihalide with two halogens')
  const [p, q] = hal
  const cp = neighbours(g, p)[0].atom
  const cq = neighbours(g, q)[0].atom
  if (!bondBetween(g, cp, cq)) throw new RangeError('The halogens must be on adjacent carbons (vicinal)')
  const kept = g.atoms.map((_, i) => i).filter((i) => i !== p && i !== q)
  const index = new Map(kept.map((old, i) => [old, i] as const))
  const bonds = g.bonds
    .filter((b) => b.a !== p && b.b !== p && b.a !== q && b.b !== q)
    .map((b) => {
      const pair = (b.a === cp && b.b === cq) || (b.a === cq && b.b === cp)
      return { ...b, a: index.get(b.a) as number, b: index.get(b.b) as number, order: pair ? (3 as const) : b.order }
    })
  const alkyne = rebuild(kept.map((i) => ({ ...g.atoms[i] })), bonds)
  const x = g.atoms[p].element
  const equation = balancedEquation([term(1, speciesOf(g)), term(2, inorganic('KOH', { K: 1, O: 1, H: 1 }, 'potassium hydroxide'))], [term(1, speciesOf(alkyne)), term(2, inorganic('KX', { K: 1, [x]: 1 }, 'potassium halide')), term(2, WATER)])
  return {
    reactants: [nameOf(g), 'alcoholic KOH, then NaNH2'],
    products: [productOf(alkyne, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('alkyne-from-dihalide').text,
    why: 'Two successive β-eliminations of HX give the triple bond.',
  }
}

// ---------------------------------------------------------------------------------------------
// Arenes
// ---------------------------------------------------------------------------------------------

/** The electrophile of each substitution kind: its name, formula and how it is generated (NCERT 9.5.5). */
const ELECTROPHILES: Record<string, { name: string; formula: string; equation: string }> = {
  nitration: { name: 'nitronium ion', formula: 'NO2+', equation: '\\ce{HNO3 + 2H2SO4 -> NO2+ + H3O+ + 2HSO4-}' },
  chlorination: { name: 'chloronium ion (Cl+)', formula: 'Cl+', equation: '\\ce{Cl2 + AlCl3 -> Cl+ + AlCl4-}' },
  bromination: { name: 'bromonium ion (Br+)', formula: 'Br+', equation: '\\ce{Br2 + FeBr3 -> Br+ + FeBr4-}' },
  sulphonation: { name: 'sulphur trioxide (SO3)', formula: 'SO3', equation: '\\ce{2H2SO4 -> SO3 + H3O+ + HSO4-}' },
  alkylation: { name: 'alkyl cation (R+)', formula: 'R+', equation: '\\ce{RCl + AlCl3 -> R+ + AlCl4-}' },
  acylation: { name: 'acylium ion (RCO+)', formula: 'RCO+', equation: '\\ce{RCOCl + AlCl3 -> RCO+ + AlCl4-}' },
}

/** The electrophile fragment (atoms, bonds and the atom that bonds to the ring) for a substitution kind. */
function electrophileFragment(
  kind: string,
  R: MolGraph | undefined,
): { atoms: MolAtom[]; bonds: MolBond[]; root: number } | undefined {
  if (kind === 'nitration') {
    return {
      atoms: [{ element: 'N', charge: 1 }, { element: 'O', hCount: 0 }, { element: 'O', charge: -1 }],
      bonds: [
        { a: 0, b: 1, order: 2 },
        { a: 0, b: 2, order: 1 },
      ],
      root: 0,
    }
  }
  if (kind === 'chlorination') return { atoms: [{ element: 'Cl', hCount: 0 }], bonds: [], root: 0 }
  if (kind === 'bromination') return { atoms: [{ element: 'Br', hCount: 0 }], bonds: [], root: 0 }
  if ((kind === 'alkylation' || kind === 'acylation') && R) {
    const r = alkylRadical(R)
    let attach = r.attach
    // A primary n-alkyl (three or more carbons) rearranges to the secondary carbocation: the group attaches at carbon 2.
    if (kind === 'alkylation' && carbonCount(r.graph, attach) === 1 && r.graph.atoms.length >= 3) {
      const chainLinear = r.graph.atoms.every((_, i) => carbonCount(r.graph, i) <= 2)
      const next = neighbours(r.graph, attach).find((n) => r.graph.atoms[n.atom].element === 'C')
      if (chainLinear && next && carbonCount(r.graph, next.atom) === 2) attach = next.atom
    }
    const atoms = r.graph.atoms.map((a, i) => (i === attach ? { ...a, radical: undefined } : { ...a, radical: undefined }))
    return { atoms, bonds: r.graph.bonds.map((b) => ({ ...b })), root: attach }
  }
  return undefined
}

/** Ring atoms of a benzene ring around the substituent carbon (ring[0] carries it, or is any carbon). */
function positionsOf(ring: number[], at: number): { ortho: number[]; meta: number[]; para: number[] } {
  const k = ring.indexOf(at)
  const step = (d: number) => ring[(k + d + 6) % 6]
  return { ortho: [step(1), step(5)], meta: [step(2), step(4)], para: [step(3)] }
}

/**
 * The σ-complex (arenium ion) with the electrophile on ring atom `k`: atom k is sp3 and carries the
 * electrophile and a hydrogen; the positive charge sits on the next carbon in this resonance form.
 */
function sigmaComplexAt(arene: MolGraph, ring: number[], k: number, fragment: { atoms: MolAtom[]; bonds: MolBond[]; root: number }): MolGraph {
  const pos = ring.indexOf(k)
  const r = (d: number) => ring[(pos + d + 6) % 6]
  const pattern: [number, number, 1 | 2][] = [
    [r(0), r(1), 1],
    [r(1), r(2), 1],
    [r(2), r(3), 2],
    [r(3), r(4), 1],
    [r(4), r(5), 2],
    [r(5), r(0), 1],
  ]
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const orderOf = new Map(pattern.map(([a, b, o]) => [key(a, b), o] as const))
  const atoms: MolAtom[] = arene.atoms.map((a, i) => (i === r(1) ? { ...a, charge: 1 } : { ...a }))
  const bonds: MolBond[] = arene.bonds.map((b) => {
    const o = orderOf.get(key(b.a, b.b))
    return o !== undefined ? { ...b, order: o } : { ...b }
  })
  const offset = atoms.length
  const joinedAtoms = [...atoms, ...fragment.atoms.map((a) => ({ ...a }))]
  const joinedBonds = [
    ...bonds,
    ...fragment.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })),
    { a: k, b: fragment.root + offset, order: 1 as const },
  ]
  return rebuild(joinedAtoms, joinedBonds)
}

/** Bonds an electrophile fragment to ring atom k of the parent arene (hydrogens rebuilt). */
function attachAt(arene: MolGraph, k: number, fragment: { atoms: MolAtom[]; bonds: MolBond[]; root: number }): MolGraph {
  const offset = arene.atoms.length
  return rebuild(
    [...arene.atoms.map((a) => ({ ...a })), ...fragment.atoms.map((a) => ({ ...a }))],
    [
      ...arene.bonds.map((b) => ({ ...b })),
      ...fragment.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })),
      { a: k, b: fragment.root + offset, order: 1 as const },
    ],
  )
}

/** Benzenesulfonic acid: the SO3H group on ring atom k. The sulphur is added by hand (see the parser's valence limit). */
function sulphonicAcid(arene: MolGraph, k: number): MolGraph {
  const carbons = rebuild(arene.atoms, arene.bonds)
  const n = carbons.atoms.length
  const atoms: MolAtom[] = [
    ...carbons.atoms.map((a, i) => (i === k ? { ...a, hCount: 0 } : { ...a })),
    { element: 'S', hCount: 0 },
    { element: 'O', hCount: 0 },
    { element: 'O', hCount: 0 },
    { element: 'O', hCount: 1 },
  ]
  const bonds: MolBond[] = [
    ...carbons.bonds.map((b) => ({ ...b })),
    { a: k, b: n, order: 1 },
    { a: n, b: n + 1, order: 2 },
    { a: n, b: n + 2, order: 2 },
    { a: n, b: n + 3, order: 1 },
  ]
  return { atoms, bonds }
}

/**
 * Electrophilic substitution of benzene or a monosubstituted benzene (NCERT 9.5.5 and 9.5.6): nitration,
 * chlorination, bromination, sulphonation, Friedel-Crafts alkylation and acylation. The electrophile is named
 * and its generation written. The σ-complex is returned as a graph with its positive charge. The products
 * follow NCERT's directing rules: o and p for the activating and halogen groups, m for the others. NCERT gives
 * no ratio, so no product is named major.
 *
 * @param options.R the alkyl chloride (alkylation) or acyl chloride (acylation) as a graph
 * @throws {RangeError} For a ring that is not benzene or monosubstituted benzene, or a kind not modelled
 */
export function electrophilicSubstitution(
  arene: MolGraph,
  kind: 'nitration' | 'chlorination' | 'bromination' | 'sulphonation' | 'alkylation' | 'acylation',
  options: { R?: MolGraph } = {},
): Reaction {
  const ring = benzeneRing(arene)
  if (!ring) throw new RangeError('Electrophilic substitution is modelled for benzene and its derivatives')
  const subs = substituentsOn(arene, ring)
  if (subs.length > 1) throw new RangeError('Only benzene and monosubstituted benzenes are modelled (NCERT 9.5.6)')
  const electrophile = ELECTROPHILES[kind]
  if (!electrophile) throw new RangeError(`Unknown substitution "${kind}"`)
  const fragment = electrophileFragment(kind, options.R)
  if (!fragment && kind !== 'sulphonation') throw new RangeError(`${kind} needs an electrophile (give R for alkylation or acylation)`)
  const sub = subs[0]
  const group = sub ? classifySubstituent(arene, sub.sub, sub.ringAtom) : undefined
  const directing = group ? directingOf(group) : undefined
  const sites: { atom: number; position: 'ortho' | 'meta' | 'para' | 'only' }[] = []
  if (!sub) {
    sites.push({ atom: ring[0], position: 'only' })
  } else {
    const p = positionsOf(ring, sub.ringAtom)
    if (directing?.directs === 'meta') {
      for (const m of p.meta) sites.push({ atom: m, position: 'meta' })
    } else {
      for (const o of p.ortho) sites.push({ atom: o, position: 'ortho' })
      for (const q of p.para) sites.push({ atom: q, position: 'para' })
    }
  }
  if (kind === 'sulphonation' && sub) throw new RangeError('Sulphonation of a substituted benzene is not modelled')
  const seen = new Set<string>()
  const distinct = sites.filter((site) => {
    // The name does not depend on the Kekulé bond placement, so equivalent ring positions share a name.
    const graph = kind === 'sulphonation' ? sulphonicAcid(arene, site.atom) : attachAt(arene, site.atom, fragment as { atoms: MolAtom[]; bonds: MolBond[]; root: number })
    const key = nameOf(graph)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const products: ReactionProduct[] = distinct.map((site) => {
    if (kind === 'sulphonation') {
      const graph = sulphonicAcid(arene, site.atom)
      return { graph, name: 'benzenesulfonic acid', formula: 'C6H6O3S', position: site.position, major: undefined }
    }
    const graph = attachAt(arene, site.atom, fragment as { atoms: MolAtom[]; bonds: MolBond[]; root: number })
    return productOf(graph, { position: site.position })
  })
  const reactantName = sub ? nameOf(arene) : 'benzene'
  const reagent: Species = {
    nitration: inorganic('HNO3', { H: 1, N: 1, O: 3 }, 'nitric acid'),
    chlorination: inorganic('Cl2', { Cl: 2 }, 'chlorine'),
    bromination: inorganic('Br2', { Br: 2 }, 'bromine'),
    sulphonation: inorganic('H2SO4', { H: 2, S: 1, O: 4 }, 'sulphuric acid'),
    alkylation: speciesOf(options.R ?? EMPTY),
    acylation: speciesOf(options.R ?? EMPTY),
  }[kind]
  const byproduct = kind === 'nitration' || kind === 'sulphonation' ? WATER : hx('Cl')
  const equations = products.map((p) => {
    const counts = p.graph === EMPTY ? {} : countsOf(p.graph)
    const productSpecies: Species = p.graph === EMPTY ? { label: p.formula, counts, name: p.name } : { ...speciesOf(p.graph), name: p.name }
    return balancedEquation([term(1, speciesOf(arene)), term(1, reagent)], [term(1, productSpecies), term(1, byproduct)])
  })
  const conditionId = kind === 'chlorination' ? 'chlorination-lewis' : kind === 'bromination' ? 'bromination-lewis' : kind
  const sigma = sites[0] && fragment && kind !== 'sulphonation' ? sigmaComplexAt(arene, ring, sites[0].atom, fragment) : undefined
  const why = group
    ? `The ${group.slice(1)} group ${directing?.activating ? 'activates' : 'deactivates'} the ring and directs the electrophile ${directing?.directs === 'meta' ? 'to the meta position' : 'to the ortho and para positions'} (NCERT 9.5.6).`
    : 'Benzene has no substituent, so all six ring carbons are equivalent and one monosubstituted product forms.'
  return {
    reactants: [reactantName, electrophile.name],
    products,
    equation: equations[0],
    equations,
    conditions: conditionFor(conditionId).text,
    why,
    intermediates: sites.map((s) => `σ-complex with the electrophile on ring carbon ${s.atom + 1}; the positive charge is delocalised over the other five carbons`),
    electrophile: { name: electrophile.name, formula: electrophile.formula, equation: electrophile.equation },
    sigmaComplex: sigma ? { graph: sigma, description: 'Arenium ion: sp3 carbon bearing H and the electrophile; one resonance form with the + charge on the adjacent ring carbon' } : undefined,
    substituent: group && directing ? { group, activating: directing.activating, directs: directing.directs } : undefined,
  }
}

/**
 * Chlorination of benzene in excess with anhydrous AlCl3 in the dark (NCERT 9.5.5, equation 9.79):
 * C6H6 + 6 Cl2 → C6Cl6 + 6 HCl.
 *
 * @throws {RangeError} If the molecule is not benzene
 */
export function chlorinateExcess(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('C1=CC=CC=C1'))) throw new RangeError('Excess chlorination is modelled for benzene')
  const product = parseSmiles('ClC1=C(Cl)C(Cl)=C(Cl)C(Cl)=C1Cl')
  const equation = balancedEquation([term(1, speciesOf(g)), term(6, inorganic('Cl2', { Cl: 2 }, 'chlorine'))], [term(1, speciesOf(product)), term(6, hx('Cl'))])
  return {
    reactants: ['benzene', 'chlorine'],
    products: [productOf(product, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('chlorination-excess').text,
    why: 'With excess chlorine every ring hydrogen is replaced by chlorine.',
  }
}

/**
 * Addition of hydrogen to benzene with nickel and heat (NCERT 9.5.5, equation 9.80): C6H6 + 3 H2 → C6H12.
 *
 * @throws {RangeError} If the molecule is not benzene
 */
export function addHydrogenToBenzene(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('C1=CC=CC=C1'))) throw new RangeError('This addition is modelled for benzene')
  const cyclohexane = parseSmiles('C1CCCCC1')
  const equation = balancedEquation([term(1, speciesOf(g)), term(3, H2)], [term(1, speciesOf(cyclohexane))])
  return {
    reactants: ['benzene', 'hydrogen'],
    products: [productOf(cyclohexane, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('benzene-hydrogenation').text,
    why: 'Only under vigorous conditions does benzene add hydrogen; its three π bonds are reduced to give cyclohexane.',
  }
}

/**
 * Addition of chlorine to benzene in ultraviolet light (NCERT 9.5.5, equation 9.81): C6H6 + 3 Cl2 → C6H6Cl6,
 * benzene hexachloride (BHC).
 *
 * @throws {RangeError} If the molecule is not benzene
 */
export function addChlorineUV(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('C1=CC=CC=C1'))) throw new RangeError('This addition is modelled for benzene')
  const bhc = parseSmiles('ClC1C(Cl)C(Cl)C(Cl)C(Cl)C1Cl')
  const equation = balancedEquation([term(1, speciesOf(g)), term(3, inorganic('Cl2', { Cl: 2 }, 'chlorine'))], [term(1, speciesOf(bhc))])
  return {
    reactants: ['benzene', 'chlorine'],
    products: [productOf(bhc, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('benzene-uv-chlorination').text,
    why: 'Ultraviolet light starts a radical addition across the three π bonds: 1,2,3,4,5,6-hexachlorocyclohexane.',
  }
}

/**
 * Benzene from sodium benzoate with sodalime (NCERT 9.5.4, equation 9.70): the decarboxylation of benzoic acid.
 */
export function decarboxylateBenzoate(): Reaction {
  const r = decarboxylate(parseSmiles('OC(=O)C1=CC=CC=C1'))
  return { ...r, conditions: conditionFor('benzoate-decarboxylation').text }
}

/**
 * Benzene from phenol with zinc dust (NCERT 9.5.4, equation 9.71): C6H5OH + Zn → C6H6 + ZnO.
 *
 * @throws {RangeError} If the molecule is not phenol
 */
export function reducePhenol(g: MolGraph): Reaction {
  if (canonicalKey(g) !== canonicalKey(parseSmiles('OC1=CC=CC=C1'))) throw new RangeError('Zinc dust reduction is modelled for phenol')
  const oxygen = g.atoms.findIndex((a) => a.element === 'O')
  const benzene = deleteAtoms(g, [oxygen])
  const equation = balancedEquation([term(1, speciesOf(g)), term(1, inorganic('Zn', { Zn: 1 }, 'zinc'))], [term(1, speciesOf(benzene)), term(1, inorganic('ZnO', { Zn: 1, O: 1 }, 'zinc oxide'))])
  return {
    reactants: ['phenol', 'zinc dust'],
    products: [productOf(benzene, { major: true })],
    equation,
    equations: [equation],
    conditions: conditionFor('phenol-zinc').text,
    why: 'Zinc takes the –OH oxygen as zinc oxide and the ring is left as benzene.',
  }
}

/** Counts of the groups on a benzene ring that matter for the rate comparison (NCERT 9.5.6, Exercises 9.22 and 9.23). */
export function substituentCounts(arene: MolGraph): { strongDeactivating: number; halogens: number; activating: number } {
  const ring = benzeneRing(arene)
  if (!ring) throw new RangeError('A benzene ring is needed')
  const counts = { strongDeactivating: 0, halogens: 0, activating: 0 }
  for (const s of substituentsOn(arene, ring)) {
    const group = classifySubstituent(arene, s.sub, s.ringAtom)
    if (['-NO2', '-CN', '-CHO', '-COR', '-COOH', '-COOR', '-SO3H'].includes(group)) counts.strongDeactivating++
    else if (['-F', '-Cl', '-Br', '-I'].includes(group)) counts.halogens++
    else counts.activating++
  }
  return counts
}

/**
 * Relative reactivity towards electrophilic substitution (NCERT Exercises 9.22 and 9.23), as a qualitative
 * order with no invented numbers: fewer strongly deactivating groups first, then fewer halogens, then more
 * activating groups. Returns the indices from most to least reactive.
 */
export function relativeNitrationRate(arenes: MolGraph[]): { order: number[]; counts: { strongDeactivating: number; halogens: number; activating: number }[] } {
  const counts = arenes.map((a) => substituentCounts(a))
  const order = arenes
    .map((_, i) => i)
    .sort((i, j) => {
      const x = counts[i]
      const y = counts[j]
      return x.strongDeactivating - y.strongDeactivating || x.halogens - y.halogens || y.activating - x.activating || i - j
    })
  return { order, counts }
}

/** Whether an equation's two sides balance, without throwing (for tests and checks). */
export function isBalanced(reactants: Term[], products: Term[]): boolean {
  try {
    assertBalanced(reactants, products)
    return true
  } catch {
    return false
  }
}
