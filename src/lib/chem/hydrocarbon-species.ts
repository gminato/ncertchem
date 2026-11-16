/**
 * Shared helpers for the Unit 9 reaction models (NCERT Class 11 Unit 9, Hydrocarbons): graph editing
 * (rebuilding hydrogens after a bond change), names, mhchem-ready equation text and an atom balance
 * check. Built on the shared MolGraph types in molecule-graph.ts and the Unit 8 parser and namer.
 *
 * Inorganic partners of a reaction (H2, HBr, CO2, KOH ...) are described by counts of their atoms,
 * so that every equation the models write can be checked for balance.
 */

import type { MolAtom, MolBond, MolGraph } from './molecule-graph'
import { iupacName } from './iupac-organic'
import { molecularFormula, neighbours } from './molecule-parse'

/** Standard valence of the elements the Unit 9 models build (carbon uses 4 minus |charge|). */
const VALENCE: Record<string, number> = { C: 4, N: 3, O: 2, S: 2, P: 3, B: 3, F: 1, Cl: 1, Br: 1, I: 1, H: 1 }

/** Names NCERT and IUPAC use for molecules that the Unit 8 namer does not name. */
const RETAINED: Record<string, string> = {
  CH2O: 'methanal',
  CO2: 'carbon dioxide',
  C6H6O: 'phenol',
}

/** A reagent or product of an equation: its label (condensed or formula), its atom counts and its name. */
export interface Species {
  label: string
  counts: Record<string, number>
  name: string
}

/** A species with the coefficient it takes in an equation. */
export interface Term {
  coef: number
  species: Species
}

/** Valence available to an atom with the given element and charge. */
function valenceOf(element: string, charge: number): number | undefined {
  const neutral = VALENCE[element]
  if (neutral === undefined) return undefined
  return element === 'C' ? 4 - Math.abs(charge) : neutral + charge
}

/**
 * A copy of the graph with the implicit hydrogen counts recalculated from the bonds now present. Atoms
 * of elements outside the organic set (Na, Zn, Ca ...) keep their hydrogen count.
 *
 * @throws {RangeError} If an atom has more bonds than its valence allows
 */
export function rebuild(atoms: MolAtom[], bonds: MolBond[]): MolGraph {
  const graph: MolGraph = { atoms: atoms.map((a) => ({ ...a })), bonds: bonds.map((b) => ({ ...b })) }
  for (let i = 0; i < graph.atoms.length; i++) {
    const atom = graph.atoms[i]
    const valence = valenceOf(atom.element, atom.charge ?? 0)
    if (valence === undefined || atom.element === 'H') continue
    const used = neighbours(graph, i).reduce((sum, n) => sum + n.order, 0)
    const hydrogens = valence - used - (atom.radical ?? 0)
    if (hydrogens < 0) {
      throw new RangeError(`Atom ${atom.element} ${i} would have ${used} bonds on a valence of ${valence}`)
    }
    atom.hCount = hydrogens
  }
  return graph
}

/**
 * Removes the atoms listed in `drop` (and the bonds to them), renumbering the rest and rebuilding the
 * hydrogens.
 */
export function deleteAtoms(g: MolGraph, drop: number[]): MolGraph {
  const gone = new Set(drop)
  const keep = g.atoms.map((_, i) => i).filter((i) => !gone.has(i))
  const newIndex = new Map(keep.map((old, i) => [old, i] as const))
  const bonds = g.bonds
    .filter((b) => newIndex.has(b.a) && newIndex.has(b.b))
    .map((b) => ({ ...b, a: newIndex.get(b.a) as number, b: newIndex.get(b.b) as number }))
  return rebuild(
    keep.map((i) => g.atoms[i]),
    bonds,
  )
}

/**
 * Joins graphs side by side and adds the listed bonds between their atoms, given as indices into the
 * combined atom list (the atoms of the first graph come first). Hydrogens are rebuilt.
 */
export function joinGraphs(parts: MolGraph[], extraBonds: MolBond[]): MolGraph {
  const atoms: MolAtom[] = []
  const bonds: MolBond[] = []
  for (const part of parts) {
    const offset = atoms.length
    atoms.push(...part.atoms.map((a) => ({ ...a })))
    bonds.push(...part.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })))
  }
  return rebuild(atoms, [...bonds, ...extraBonds])
}

/** Indices of the connected components of the graph (each a sorted list of atom indices). */
export function components(g: MolGraph): number[][] {
  const seen = new Set<number>()
  const out: number[][] = []
  for (let start = 0; start < g.atoms.length; start++) {
    if (seen.has(start)) continue
    const group: number[] = []
    const stack = [start]
    seen.add(start)
    while (stack.length > 0) {
      const x = stack.pop() as number
      group.push(x)
      for (const n of neighbours(g, x)) {
        if (!seen.has(n.atom)) {
          seen.add(n.atom)
          stack.push(n.atom)
        }
      }
    }
    out.push(group.sort((p, q) => p - q))
  }
  return out
}

/** Heavy-atom neighbours of atom `i`, excluding hydrogen. */
export function heavyNeighbours(g: MolGraph, i: number): { atom: number; order: 1 | 2 | 3 }[] {
  return neighbours(g, i).filter((n) => g.atoms[n.atom].element !== 'H')
}

/** Atom counts of a graph, hydrogens included. Charges are not counted. */
export function countsOf(g: MolGraph): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const atom of g.atoms) {
    counts[atom.element] = (counts[atom.element] ?? 0) + 1
    counts.H = (counts.H ?? 0) + (atom.hCount ?? 0)
  }
  if (counts.H === 0) delete counts.H
  return counts
}

/** The name of a molecule: the Unit 8 IUPAC name, or a retained name for the few it does not name. */
export function nameOf(g: MolGraph): string {
  const formula = molecularFormula(g)
  if (RETAINED[formula] && g.atoms.length <= 4) return RETAINED[formula]
  try {
    return iupacName(g)
  } catch (error) {
    if (RETAINED[formula]) return RETAINED[formula]
    // Molecules the namer does not cover (sulphate, sulphur trioxide) are named by their formula.
    if (error instanceof RangeError) return formula
    throw error
  }
}

/** Number of atoms reached from atom i without passing back through parent (an acyclic graph). */
function subtreeSize(g: MolGraph, i: number, parent: number): number {
  let n = 1
  for (const k of heavyNeighbours(g, i)) if (k.atom !== parent) n += subtreeSize(g, k.atom, i)
  return n
}

/** Text of one atom in a condensed formula: carbon with its hydrogens (CH3), or a heteroatom with its own (OH). */
function condensedAtomText(g: MolGraph, i: number): string {
  const a = g.atoms[i]
  const h = a.hCount ?? 0
  return `${a.element}${h === 0 ? '' : h === 1 ? 'H' : `H${h}`}`
}

/**
 * Writes the subtree at atom i, reached from parent. Carbon branches go in brackets; heteroatoms (Br, OH, the O of
 * a C=O, the O of an ester) are written inline. The main chain continues after the last branch: the subtree
 * with more atoms, then a carbon over a heteroatom, then the later atom. The bond to a carbon is shown as = or #;
 * the C=O bond is not shown, so a ketone reads CH3COCH3.
 */
function writeCondensed(g: MolGraph, i: number, parent: number): string {
  const kids = heavyNeighbours(g, i).filter((n) => n.atom !== parent)
  const isC = (x: number) => g.atoms[x].element === 'C'
  // Identical single-atom substituents on one carbon are counted: CH3CHBr2, CHCl3.
  const leafCount = new Map<string, number>()
  for (const k of kids) {
    if (!isC(k.atom) && subtreeSize(g, k.atom, i) === 1) leafCount.set(condensedAtomText(g, k.atom), (leafCount.get(condensedAtomText(g, k.atom)) ?? 0) + 1)
  }
  const grouped = new Set<string>()
  let main = -1
  let bestKey: number[] = []
  kids.forEach((k, idx) => {
    const key = [subtreeSize(g, k.atom, i), isC(k.atom) ? 1 : 0, idx]
    if (main < 0 || key[0] > bestKey[0] || (key[0] === bestKey[0] && (key[1] > bestKey[1] || (key[1] === bestKey[1] && key[2] > bestKey[2])))) {
      main = idx
      bestKey = key
    }
  })
  const bondText = (k: { atom: number; order: 1 | 2 | 3 }) => (k.order === 3 ? '#' : k.order === 2 && isC(k.atom) ? '=' : '')
  let out = condensedAtomText(g, i)
  const isGroupedLeaf = (k: { atom: number }) => {
    const t = condensedAtomText(g, k.atom)
    return !isC(k.atom) && subtreeSize(g, k.atom, i) === 1 && (leafCount.get(t) ?? 1) > 1
  }
  kids.forEach((k, idx) => {
    if (isGroupedLeaf(k)) {
      const t = condensedAtomText(g, k.atom)
      if (!grouped.has(t)) out += `${t}${leafCount.get(t)}`
      grouped.add(t)
      return
    }
    if (idx === main) return
    const text = writeCondensed(g, k.atom, i)
    // A group of several atoms (OH, NH2, OSO3H) hanging off a carbon in the middle of the chain is
    // bracketed, CH3CH(OH)CH3; a lone halogen or =O is not, CH3CHBrCH3 and CH3COCH3.
    const midChain = main >= 0 && isC(kids[main].atom)
    const bracket = !isC(k.atom) && midChain && k.order === 1 && !/^(F|Cl|Br|I)$/.test(text)
    out += isC(k.atom) ? `(${bondText(k)}${text})` : bracket ? `(${text})` : text
  })
  if (main >= 0 && !isGroupedLeaf(kids[main])) out += bondText(kids[main]) + writeCondensed(g, kids[main].atom, i)
  return out
}

/**
 * The condensed formula of an acyclic molecule as students write it: CH3CHBrCH3, CH3COCH3, CH3CHO, CH3COOH,
 * CH3COOCH3, CH2=CHCH3, and alkyl branches in brackets as in CH3CH(CH3)CH3. The C≡C bond is written with #
 * for mhchem.
 *
 * @throws {RangeError} For a molecule with a ring (use its molecular formula instead)
 */
export function condensedLabel(g: MolGraph): string {
  if (findRings(g, 12).length > 0) throw new RangeError('A condensed formula is written for an acyclic molecule')
  if (g.atoms.length === 0) throw new RangeError('An empty graph has no formula')
  // Start at a terminal carbon, preferring one that starts a C=C or C≡C, so that an alkene reads CH2=CHCH2CH3.
  const carbons = g.atoms.map((_, i) => i).filter((i) => g.atoms[i].element === 'C')
  const pool = carbons.length ? carbons : g.atoms.map((_, i) => i)
  const startsMultiple = (i: number) => heavyNeighbours(g, i).some((n) => n.order > 1 && g.atoms[n.atom].element === 'C')
  const rank = (i: number): number[] => [heavyNeighbours(g, i).length, startsMultiple(i) ? 0 : 1, i]
  const root = pool.reduce((best, i) => {
    const a = rank(i)
    const b = rank(best)
    return a[0] !== b[0] ? (a[0] < b[0] ? i : best) : a[1] !== b[1] ? (a[1] < b[1] ? i : best) : (a[2] < b[2] ? i : best)
  })
  return writeCondensed(g, root, -1)
}


/**
 * The species of a molecule: a condensed label for an acyclic molecule (the molecular formula for a
 * ring), its atom counts and its name.
 */
export function speciesOf(g: MolGraph): Species {
  let label: string
  try {
    label = condensedLabel(g)
  } catch {
    label = molecularFormula(g)
  }
  let name: string
  try {
    name = nameOf(g)
  } catch {
    name = molecularFormula(g)
  }
  return { label, counts: countsOf(g), name }
}

/** Hill-order formula text of a set of atom counts, e.g. { C: 6, H: 6 } gives 'C6H6'. */
export function formulaFromCounts(counts: Record<string, number>): string {
  const keys = Object.keys(counts).filter((k) => counts[k] > 0)
  const order = keys.includes('C') ? ['C', 'H', ...keys.filter((k) => k !== 'C' && k !== 'H').sort()] : keys.sort()
  return order.map((k) => (counts[k] > 1 ? `${k}${counts[k]}` : k)).join('')
}

/** A species given by its formula and atom counts (for H2, HBr, CO2, KOH and similar). */
export function inorganic(label: string, counts: Record<string, number>, name: string): Species {
  return { label, counts, name }
}

/** Hydrogen gas, H2. */
export const H2 = inorganic('H2', { H: 2 }, 'hydrogen')
/** Oxygen gas, O2. */
export const O2 = inorganic('O2', { O: 2 }, 'oxygen')
/** Ozone, O3. */
export const O3 = inorganic('O3', { O: 3 }, 'ozone')
/** Water, H2O. */
export const WATER = inorganic('H2O', { H: 2, O: 1 }, 'water')
/** Sodium hydroxide. */
export const NAOH = inorganic('NaOH', { Na: 1, O: 1, H: 1 }, 'sodium hydroxide')
/** Carbon dioxide. */
export const CO2 = inorganic('CO2', { C: 1, O: 2 }, 'carbon dioxide')
/** Sodium carbonate. */
export const NA2CO3 = inorganic('Na2CO3', { Na: 2, C: 1, O: 3 }, 'sodium carbonate')

/** A halogen molecule (Cl2 or Br2) or an acid or salt of a halogen, by its symbol. */
export function halogenMolecule(x: 'Cl' | 'Br' | 'I'): Species {
  return inorganic(`${x}2`, { [x]: 2 }, { Cl: 'chlorine', Br: 'bromine', I: 'iodine' }[x])
}

/** A hydrogen halide (HCl, HBr, HI or HF) as a species. */
export function hydrogenHalide(x: 'Cl' | 'Br' | 'I' | 'F'): Species {
  return inorganic(`H${x}`, { H: 1, [x]: 1 }, { Cl: 'hydrogen chloride', Br: 'hydrogen bromide', I: 'hydrogen iodide', F: 'hydrogen fluoride' }[x])
}

/** The alkyl halide's halogen written as the element symbol to add to a graph, e.g. 'Cl'. */
export function halogensOf(g: MolGraph): number[] {
  return g.atoms.map((a, i) => (['F', 'Cl', 'Br', 'I'].includes(a.element) ? i : -1)).filter((i) => i >= 0)
}

/**
 * The stoichiometric text of an equation for mhchem: coefficients of 1 are omitted, species are joined
 * with ' + ' and the arrow is written with an optional condition, e.g. '\\ce{CH4 + 2O2 ->[Ni] CO2 + 2H2O}'.
 */
export function equationText(reactants: Term[], products: Term[], condition?: string): string {
  // Like terms on one side are written once with their coefficients added: 2NaBr, not NaBr + NaBr.
  const merge = (terms: Term[]) => {
    const out: Term[] = []
    for (const t of terms) {
      const same = out.find((u) => u.species.label === t.species.label)
      if (same) same.coef += t.coef
      else out.push({ ...t })
    }
    return out
  }
  const side = (terms: Term[]) =>
    merge(terms).map((t) => `${t.coef === 1 ? '' : t.coef}${t.species.label}`).join(' + ')
  const arrow = condition ? `->[${condition}]` : '->'
  return `\\ce{${side(reactants)} ${arrow} ${side(products)}}`
}

/** Total atom counts of a list of terms, weighted by coefficient. */
function totalCounts(terms: Term[]): Record<string, number> {
  const total: Record<string, number> = {}
  for (const t of terms) {
    for (const [element, n] of Object.entries(t.species.counts)) {
      total[element] = (total[element] ?? 0) + n * t.coef
    }
  }
  return total
}

/**
 * Checks that an equation balances atom by atom.
 *
 * @throws {RangeError} If an element differs between the two sides; the models call this so that a
 * wrong equation is never returned
 */
export function assertBalanced(reactants: Term[], products: Term[]): void {
  const left = totalCounts(reactants)
  const right = totalCounts(products)
  const elements = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const element of elements) {
    if ((left[element] ?? 0) !== (right[element] ?? 0)) {
      throw new RangeError(`Equation does not balance for ${element}: ${left[element] ?? 0} vs ${right[element] ?? 0}`)
    }
  }
}

/**
 * Builds an equation, checks that it balances and returns its text.
 *
 * @throws {RangeError} If the equation does not balance
 */
export function balancedEquation(reactants: Term[], products: Term[], condition?: string): string {
  assertBalanced(reactants, products)
  return equationText(reactants, products, condition)
}

/**
 * Sets a double bond between atoms `a` and `b` in the geometry sense: places the two carbons on the
 * x axis and their heavy substituents above (cis) or on opposite sides (trans), so that the sides can
 * be read from the coordinates. Only the atoms named here get positions.
 *
 * @throws {RangeError} If `a` and `b` are not bonded by a double bond
 */
export function placeAlkene(g: MolGraph, a: number, b: number, cis: boolean): MolGraph {
  const bond = g.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  if (!bond || bond.order !== 2) throw new RangeError('placeAlkene needs a C=C double bond')
  const subsA = heavyNeighbours(g, a).filter((n) => n.atom !== b).map((n) => n.atom)
  const subsB = heavyNeighbours(g, b).filter((n) => n.atom !== a).map((n) => n.atom)
  const atoms = g.atoms.map((x) => ({ ...x }))
  atoms[a] = { ...atoms[a], x: 0, y: 0 }
  atoms[b] = { ...atoms[b], x: 1, y: 0 }
  for (const s of subsA.slice(0, 1)) atoms[s] = { ...atoms[s], x: -0.5, y: 0.87 }
  for (const s of subsB.slice(0, 1)) atoms[s] = { ...atoms[s], x: 1.5, y: cis ? 0.87 : -0.87 }
  return { atoms, bonds: g.bonds.map((x) => ({ ...x })) }
}

/**
 * The geometry of the single stereogenic C=C of a graph, read from the 2D positions: 'cis' or 'trans'
 * when each carbon of the double bond carries one heavy substituent and both substituents have
 * positions; undefined otherwise. Molecules with more than one double bond are not named with a
 * geometric prefix.
 */
export function alkeneGeometry(g: MolGraph): 'cis' | 'trans' | undefined {
  const doubles = g.bonds.filter((b) => b.order === 2 && g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C')
  if (doubles.length !== 1) return undefined
  const { a, b } = doubles[0]
  const subsA = heavyNeighbours(g, a).filter((n) => n.atom !== b)
  const subsB = heavyNeighbours(g, b).filter((n) => n.atom !== a)
  if (subsA.length !== 1 || subsB.length !== 1) return undefined
  const pa = g.atoms[a]
  const pb = g.atoms[b]
  const sA = g.atoms[subsA[0].atom]
  const sB = g.atoms[subsB[0].atom]
  if ([pa.x, pa.y, pb.x, pb.y, sA.x, sA.y, sB.x, sB.y].some((v) => v === undefined)) return undefined
  const side = (p: { x?: number; y?: number }) =>
    Math.sign(((pb.x as number) - (pa.x as number)) * ((p.y as number) - (pa.y as number)) -
      ((pb.y as number) - (pa.y as number)) * ((p.x as number) - (pa.x as number)))
  return side(sA) === side(sB) ? 'cis' : 'trans'
}

/** The name of a molecule with its geometric prefix (cis- or trans-) when its alkene has a defined geometry. */
export function nameWithGeometry(g: MolGraph): string {
  const geometry = alkeneGeometry(g)
  const base = nameOf(g)
  return geometry ? `${geometry}-${base}` : base
}

/** The carbon atoms carrying one or more hydrogens, with their hydrogen counts. */
export function hydrogenCarbons(g: MolGraph): { atom: number; hydrogens: number }[] {
  return g.atoms
    .map((a, i) => ({ atom: i, hydrogens: a.hCount ?? 0 }))
    .filter((x) => g.atoms[x.atom].element === 'C' && x.hydrogens > 0)
}

/** Formula text (Hill order) of a graph, for display next to a name. */
export function formulaOf(g: MolGraph): string {
  return molecularFormula(g)
}

/** Simple cycles of a graph (each as its atom indices in ring order), up to `maxSize` atoms. */
export function findRings(g: MolGraph, maxSize = 8): number[][] {
  const found = new Map<string, number[]>()
  const adjacency = g.atoms.map((_, i) => neighbours(g, i).map((n) => n.atom))
  const walk = (start: number, path: number[]): void => {
    const last = path[path.length - 1]
    for (const next of adjacency[last]) {
      if (next === start && path.length >= 3) {
        const key = [...path].sort((x, y) => x - y).join(',')
        if (!found.has(key)) found.set(key, [...path])
      } else if (next > start && !path.includes(next) && path.length < maxSize) {
        walk(start, [...path, next])
      }
    }
  }
  for (let s = 0; s < g.atoms.length; s++) walk(s, [s])
  return [...found.values()]
}
