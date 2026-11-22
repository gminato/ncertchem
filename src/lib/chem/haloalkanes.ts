/**
 * Helpers for Class 12 Unit 6 (Haloalkanes and Haloarenes). Pure functions over MolGraph or SMILES:
 * classification of each C–X bond, isomers of mono-halogen compounds, stereocentres, elimination
 * (β-elimination to alkenes), substitution by a group, and the nitro-activation pattern of a
 * chlorobenzene ring.
 *
 * Every product that names a molecule carries its Kekulé SMILES (written here, since the parser
 * has no writer), its formula and its IUPAC name (null when the namer throws).
 *
 * Limits: no cis/trans or R/S labels; a 'vicinal' or 'geminal' dihalide is reported only when
 * the halogens sit on sp³ carbons (for vinylic or aryl dihalides, dihalide is null).
 */

import type { MolAtom, MolGraph } from './molecule-graph'
import { bondOrderBetween, bondOrderSum, canonicalKey, hybridisation, molecularFormula, neighbours, parseSmiles } from './molecule-parse'
import { iupacName } from './iupac-organic'
import { subscriptFormula } from './dblock'

/** A halogen element symbol. */
export type HalogenElement = 'F' | 'Cl' | 'Br' | 'I'

const HALOGENS = new Set<string>(['F', 'Cl', 'Br', 'I'])
const ORGANIC_SUBSET = new Set<string>(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I'])
const BASE_VALENCE: Record<string, number> = { H: 1, B: 3, C: 4, N: 3, O: 2, P: 3, S: 2, F: 1, Cl: 1, Br: 1, I: 1 }

/** Standard valence of an element with a charge (carbon: 4 minus |charge|; others: neutral plus charge). */
function valence(element: string, charge: number): number {
  const base = BASE_VALENCE[element]
  if (base === undefined) throw new RangeError(`Unsupported element ${element}`)
  return element === 'C' ? 4 - Math.abs(charge) : base + charge
}

/** Hydrogens an atom carries when none are written explicitly (valence not used by bonds). */
function implicitH(g: MolGraph, i: number): number {
  const atom = g.atoms[i]
  return Math.max(0, valence(atom.element, atom.charge ?? 0) - bondOrderSum(g, i))
}

/** Name of a molecule, or null when the namer cannot name it. */
function nameOrNull(g: MolGraph): string | null {
  try {
    return iupacName(g)
  } catch {
    return null
  }
}

/** A copy of a graph whose atoms and bonds can be edited without touching the original. */
function cloneGraph(g: MolGraph): MolGraph {
  return { atoms: g.atoms.map((a) => ({ ...a })), bonds: g.bonds.map((b) => ({ ...b })) }
}

/** A copy of a graph without atom `index`; `map` gives each old index its new index (-1 when removed). */
function removeAtom(g: MolGraph, index: number): { graph: MolGraph; map: number[] } {
  const map: number[] = []
  const atoms: MolAtom[] = []
  g.atoms.forEach((a, i) => {
    if (i === index) {
      map[i] = -1
      return
    }
    map[i] = atoms.length
    atoms.push({ ...a })
  })
  const bonds = g.bonds
    .filter((b) => b.a !== index && b.b !== index)
    .map((b) => ({ ...b, a: map[b.a], b: map[b.b] }))
  return { graph: { atoms, bonds }, map }
}

/** Six-membered all-carbon rings through atom `start` (each listed once per direction). */
function sixMemberedCarbonRings(g: MolGraph, start: number): number[][] {
  const rings: number[][] = []
  const path = [start]
  const onPath = new Set<number>([start])
  const walk = (v: number): void => {
    for (const nb of neighbours(g, v)) {
      if (g.atoms[nb.atom].element !== 'C') continue
      if (path.length === 6) {
        if (nb.atom === start) rings.push([...path])
        continue
      }
      if (onPath.has(nb.atom)) continue
      path.push(nb.atom)
      onPath.add(nb.atom)
      walk(nb.atom)
      path.pop()
      onPath.delete(nb.atom)
    }
  }
  walk(start)
  return rings
}

/**
 * True when carbon `i` is a ring carbon of a Kekulé benzene ring: a six-membered all-carbon ring in
 * which every ring atom has exactly one double bond to a ring neighbour.
 */
export function isAromaticRingCarbon(g: MolGraph, i: number): boolean {
  if (g.atoms[i]?.element !== 'C') return false
  return sixMemberedCarbonRings(g, i).some((ring) =>
    ring.every((atom, k) => {
      const before = ring[(k + 5) % 6]
      const after = ring[(k + 1) % 6]
      const doubles = [before, after].filter((other) => bondOrderBetween(g, atom, other) === 2).length
      return doubles === 1
    }),
  )
}

/** Classification of one C–X bond. */
export interface HalideClass {
  halogen: HalogenElement
  /** Index of the carbon bearing the halogen. */
  carbon: number
  hybridisation: 'sp3' | 'sp2'
  kind: 'alkyl' | 'allylic' | 'benzylic' | 'vinylic' | 'aryl'
  /** Degree of the C–X carbon; null for vinylic and aryl halides. */
  degree: 'methyl' | '1°' | '2°' | '3°' | null
  /** The C=C carbon or ring carbon that makes it allylic or benzylic; the double-bond partner for vinylic; null otherwise. */
  decidingNeighbour: number | null
}

/**
 * Classifies the halogen at `halogenIndex`. Order of tests: aryl, vinylic, benzylic, allylic, alkyl.
 *
 * @throws {RangeError} If the atom is not a halogen on a carbon, or the carbon is alkyne-type (sp)
 */
export function classifyHalide(g: MolGraph, halogenIndex: number): HalideClass {
  const hal = g.atoms[halogenIndex]
  if (!hal || !HALOGENS.has(hal.element)) throw new RangeError('classifyHalide: the atom is not a halogen')
  const attached = neighbours(g, halogenIndex)
  if (attached.length !== 1 || g.atoms[attached[0].atom].element !== 'C') {
    throw new RangeError('classifyHalide: the halogen must be bonded to one carbon')
  }
  const c = attached[0].atom
  const halogen = hal.element as HalogenElement
  const carbonNeighbours = (i: number) => neighbours(g, i).filter((nb) => g.atoms[nb.atom].element === 'C')

  if (isAromaticRingCarbon(g, c)) {
    return { halogen, carbon: c, hybridisation: 'sp2', kind: 'aryl', degree: null, decidingNeighbour: null }
  }
  const double = carbonNeighbours(c).find((nb) => nb.order === 2)
  if (double) {
    return { halogen, carbon: c, hybridisation: 'sp2', kind: 'vinylic', degree: null, decidingNeighbour: double.atom }
  }
  const h = hybridisation(g, c)
  if (h !== 'sp3') throw new RangeError('classifyHalide: the carbon is not sp3 and has no C=C (alkyne or other)')

  const carbons = carbonNeighbours(c).length
  const degree: HalideClass['degree'] = carbons === 0 ? 'methyl' : carbons === 1 ? '1°' : carbons === 2 ? '2°' : '3°'
  const base = { halogen, carbon: c, hybridisation: 'sp3' as const, degree }

  const benzyl = carbonNeighbours(c).find((nb) => isAromaticRingCarbon(g, nb.atom))
  if (benzyl) return { ...base, kind: 'benzylic', decidingNeighbour: benzyl.atom }

  const allylic = carbonNeighbours(c).find((nb) => carbonNeighbours(nb.atom).some((x) => x.order === 2))
  if (allylic) return { ...base, kind: 'allylic', decidingNeighbour: allylic.atom }

  return { ...base, kind: 'alkyl', decidingNeighbour: null }
}

/** Result of classifying every halogen of a SMILES string. */
export interface HalideSmilesClass {
  halides: HalideClass[]
  count: number
  countWord: 'mono' | 'di' | 'tri' | 'poly' | null
  /** Only when there are exactly two halogens; null otherwise (and for vinylic or aryl halogens). */
  dihalide: 'geminal' | 'vicinal' | null
}

/** Classifies every halogen in a SMILES string, with the count word and the dihalide type. */
export function classifyHalideSmiles(smiles: string): HalideSmilesClass {
  const g = parseSmiles(smiles)
  const indices = g.atoms.map((a, i) => (HALOGENS.has(a.element) ? i : -1)).filter((i) => i >= 0)
  const halides = indices.map((i) => classifyHalide(g, i))
  const count = indices.length
  const countWord = count === 0 ? null : count === 1 ? 'mono' : count === 2 ? 'di' : count === 3 ? 'tri' : 'poly'
  let dihalide: 'geminal' | 'vicinal' | null = null
  if (count === 2) {
    const [a, b] = halides
    if (a.carbon === b.carbon) {
      dihalide = 'geminal'
    } else if (bondOrderBetween(g, a.carbon, b.carbon) > 0 && a.hybridisation === 'sp3' && b.hybridisation === 'sp3') {
      dihalide = 'vicinal'
    }
  }
  return { halides, count, countWord, dihalide }
}

/** A mono-halogen isomer of an alkane. */
export interface MonohaloIsomer {
  smiles: string
  formula: string
  name: string | null
  /** Number of equivalent hydrogens whose replacement gives this compound. */
  hydrogens: number
}

/**
 * The distinct products of replacing one hydrogen of a saturated hydrocarbon by a halogen. Each
 * product lists how many hydrogens give it. No yields.
 *
 * @throws {RangeError} If the input is not a saturated hydrocarbon
 */
export function monohaloIsomers(alkaneSmiles: string, halogen: HalogenElement): MonohaloIsomer[] {
  const g = parseSmiles(alkaneSmiles)
  if (g.atoms.some((a) => a.element !== 'C' || (a.charge ?? 0) !== 0) || g.bonds.some((b) => b.order !== 1)) {
    throw new RangeError('monohaloIsomers needs a saturated hydrocarbon')
  }
  const found = new Map<string, { graph: MolGraph; hydrogens: number }>()
  g.atoms.forEach((atom, i) => {
    const h = atom.hCount ?? 0
    if (h === 0) return
    const product = cloneGraph(g)
    product.atoms[i].hCount = h - 1
    product.atoms.push({ element: halogen, hCount: 0 })
    product.bonds.push({ a: i, b: product.atoms.length - 1, order: 1 })
    const key = canonicalKey(product)
    const entry = found.get(key)
    if (entry) entry.hydrogens += h
    else found.set(key, { graph: product, hydrogens: h })
  })
  return [...found.values()].map(({ graph, hydrogens }) => ({
    smiles: toKekuleSmiles(graph),
    formula: molecularFormula(graph),
    name: nameOrNull(graph),
    hydrogens,
  }))
}

/** Hash of a string as hex (FNV-1a), used to compare refined atom labels. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

/**
 * Constitutional signature of the ligand that starts at `root` (the branch of `centre` through
 * `root`). Morgan-style refinement runs on the graph with `centre` removed, with `root` marked, and
 * the signature is the hash of the refined labels of the atoms reachable from `root`. Ligands with
 * equal signatures are treated as the same group. Ring-safe.
 */
function ligandSignature(g: MolGraph, centre: number, root: number): string {
  const n = g.atoms.length
  const label = (i: number): string => {
    const a = g.atoms[i]
    return `${a.element}${a.hCount ?? 0}${a.charge ?? 0}${a.radical ?? 0}`
  }
  const away = (i: number) => neighbours(g, i).filter((nb) => nb.atom !== centre)
  let colour = g.atoms.map((_a, i) => (i === centre ? 'centre' : i === root ? `root:${label(i)}` : label(i)))
  for (let round = 0; round < n; round++) {
    const current = colour
    colour = current.map((c, i) =>
      i === centre ? c : hash(`${c}#${away(i).map((nb) => `${nb.order}:${current[nb.atom]}`).sort().join('|')}`),
    )
  }
  const seen = new Set<number>([root])
  const queue = [root]
  for (let k = 0; k < queue.length; k++) {
    for (const nb of away(queue[k])) {
      if (!seen.has(nb.atom)) {
        seen.add(nb.atom)
        queue.push(nb.atom)
      }
    }
  }
  return hash([...seen].map((i) => colour[i]).sort().join(','))
}

/**
 * Stereocentres: sp³ carbons with four different groups (an implicit H counts as a group). Two
 * heavy groups are the same when their branches have the same refined signature (ring-safe).
 */
export function stereocentres(g: MolGraph): number[] {
  const out: number[] = []
  g.atoms.forEach((atom, c) => {
    if (atom.element !== 'C' || (atom.charge ?? 0) !== 0 || (atom.radical ?? 0) !== 0) return
    const nbs = neighbours(g, c)
    if (nbs.some((nb) => nb.order !== 1)) return
    const h = atom.hCount ?? 0
    if (h >= 2 || nbs.length + h !== 4) return
    const heavy = nbs.map((nb) => nb.atom)
    for (let i = 0; i < heavy.length; i++) {
      for (let j = i + 1; j < heavy.length; j++) {
        if (ligandSignature(g, c, heavy[i]) === ligandSignature(g, c, heavy[j])) return
      }
    }
    out.push(c)
  })
  return out
}

/** An alkene from β-elimination of a haloalkane. */
export interface EliminationProduct {
  smiles: string
  formula: string
  name: string | null
  /** Indices (in the input graph) of the β carbons that lose an H to give this alkene. */
  betaCarbons: number[]
  /** Hydrogens on those β carbons, i.e. how many β-H lead to this alkene. */
  betaHydrogens: number
  /** Carbon substituents on the two C=C carbons, not counting each other. */
  alkylGroups: number
  /** True for the product(s) with the most alkyl groups (Zaitsev). */
  zaitsev: boolean
}

/**
 * β-elimination (dehydrohalogenation) of a haloalkane: for each halogen on an sp³ carbon α and each
 * sp³ carbon β next to α with at least one H, the alkene formed by losing that H and the halogen.
 * Products are deduplicated by canonical key. Cis/trans is not modelled.
 */
export function eliminationProducts(input: string | MolGraph): EliminationProduct[] {
  const g = typeof input === 'string' ? parseSmiles(input) : input
  const found = new Map<string, { graph: MolGraph; betas: Map<number, number>; alkylGroups: number }>()
  const carbonsOther = (graph: MolGraph, i: number, exclude: number): number =>
    neighbours(graph, i).filter((nb) => nb.atom !== exclude && graph.atoms[nb.atom].element === 'C').length

  g.atoms.forEach((atom, x) => {
    if (!HALOGENS.has(atom.element)) return
    const attached = neighbours(g, x)
    if (attached.length !== 1) return
    const alpha = attached[0].atom
    if (g.atoms[alpha].element !== 'C' || hybridisation(g, alpha) !== 'sp3') return
    for (const nb of neighbours(g, alpha)) {
      const beta = nb.atom
      const betaAtom = g.atoms[beta]
      if (nb.order !== 1 || betaAtom.element !== 'C' || (betaAtom.hCount ?? 0) < 1) continue
      if (hybridisation(g, beta) !== 'sp3') continue

      const { graph, map } = removeAtom(g, x)
      const a = map[alpha]
      const b = map[beta]
      const bond = graph.bonds.find((bd) => (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a))
      if (!bond) continue
      bond.order = 2
      graph.atoms[b].hCount = (graph.atoms[b].hCount ?? 0) - 1

      const key = canonicalKey(graph)
      let entry = found.get(key)
      if (!entry) {
        entry = { graph, betas: new Map(), alkylGroups: carbonsOther(graph, a, b) + carbonsOther(graph, b, a) }
        found.set(key, entry)
      }
      entry.betas.set(beta, betaAtom.hCount ?? 0)
    }
  })

  const products = [...found.values()].map((entry) => {
    const betaCarbons = [...entry.betas.keys()].sort((p, q) => p - q)
    const betaHydrogens = [...entry.betas.values()].reduce((sum, h) => sum + h, 0)
    return {
      smiles: toKekuleSmiles(entry.graph),
      formula: molecularFormula(entry.graph),
      name: nameOrNull(entry.graph),
      betaCarbons,
      betaHydrogens,
      alkylGroups: entry.alkylGroups,
      zaitsev: false,
    }
  })
  const most = products.reduce((max, p) => Math.max(max, p.alkylGroups), 0)
  return products.map((p) => ({ ...p, zaitsev: p.alkylGroups === most }))
}

/** The product of replacing a halogen by a group; name is null when the namer cannot name it. */
export interface SubstitutionProduct {
  smiles: string
  formula: string
  name: string | null
}

/**
 * Replaces the halogen (by index, or the first halogen) by a group written as SMILES whose first atom
 * is the attachment atom. '' or '[H]' gives the alkane RH. The group's own hydrogens are recounted.
 *
 * @throws {RangeError} If the position is not a halogen on a carbon
 */
export function substitute(smiles: string, halogenIndex: number | 'first', groupSmiles: string): SubstitutionProduct {
  const g = parseSmiles(smiles)
  const x = halogenIndex === 'first' ? g.atoms.findIndex((a) => HALOGENS.has(a.element)) : halogenIndex
  if (x < 0 || !g.atoms[x] || !HALOGENS.has(g.atoms[x].element)) {
    throw new RangeError('substitute: no halogen at that position')
  }
  const attached = neighbours(g, x)
  if (attached.length !== 1 || g.atoms[attached[0].atom].element !== 'C') {
    throw new RangeError('substitute: the halogen must be bonded to one carbon')
  }
  const { graph, map } = removeAtom(g, x)
  const carbon = map[attached[0].atom]

  if (groupSmiles === '' || groupSmiles === '[H]') {
    graph.atoms[carbon].hCount = (graph.atoms[carbon].hCount ?? 0) + 1
  } else {
    const group = parseSmiles(groupSmiles)
    const first = group.atoms[0]
    const before = valence(first.element, first.charge ?? 0) - bondOrderSum(group, 0)
    const groupAtoms = group.atoms.map((a) => ({ ...a }))
    if (before > 0 && (first.hCount ?? 0) === before) groupAtoms[0].hCount = before - 1
    const offset = graph.atoms.length
    graph.atoms.push(...groupAtoms)
    graph.bonds.push(...group.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })))
    graph.bonds.push({ a: carbon, b: offset, order: 1 })
  }
  return { smiles: toKekuleSmiles(graph), formula: molecularFormula(graph), name: nameOrNull(graph) }
}

/** Positions of nitro groups on a chlorobenzene ring (Cl at C1), and what they do. */
export interface NitroActivation {
  orthoPara: number[]
  meta: number[]
  activated: boolean
  /** Carbons carrying negative charge in the carbanion contributors after OH⁻ adds at C1. */
  chargeSites: number[]
}

/**
 * Activation of a chlorobenzene ring by nitro groups. Only ortho or para nitro groups (2, 4, 6)
 * activate the ring for nucleophilic substitution; meta (3, 5) do not.
 *
 * @throws {RangeError} If a position is not one of 2 to 6
 */
export function nitroActivation(nitroPositions: number[]): NitroActivation {
  for (const p of nitroPositions) {
    if (!Number.isInteger(p) || p < 2 || p > 6) {
      throw new RangeError(`Nitro position ${p} is not a ring position of chlorobenzene (2 to 6)`)
    }
  }
  const sorted = [...new Set(nitroPositions)].sort((p, q) => p - q)
  const orthoPara = sorted.filter((p) => p === 2 || p === 4 || p === 6)
  const meta = sorted.filter((p) => p === 3 || p === 5)
  return { orthoPara, meta, activated: orthoPara.length > 0, chargeSites: [2, 4, 6] }
}

/** Subscript digits in a formula, e.g. 'C4H9Br' gives 'C₄H₉Br' (reuses dblock's subscriptFormula). */
export function formulaUnicode(formula: string): string {
  return subscriptFormula(formula)
}

/**
 * Kekulé SMILES of a graph (no aromatic lower case). Atoms are written bare when they are organic
 * subset atoms with their normal hydrogen count and no charge; otherwise in brackets. Ring closures
 * take the lowest free digit. Branches follow the neighbour order of the graph.
 *
 * @throws {RangeError} If the graph is empty of atoms or is in more than one part, or needs more than 9 ring digits
 */
export function toKekuleSmiles(g: MolGraph): string {
  const n = g.atoms.length
  if (n === 0) return ''
  const pos = new Array<number>(n).fill(-1)
  const parent = new Array<number>(n).fill(-1)
  const kids: number[][] = Array.from({ length: n }, () => [])
  const rings: Array<{ id: number; anc: number; desc: number; order: number }> = []
  let counter = 0
  const visit = (v: number): void => {
    pos[v] = counter++
    const nbs = neighbours(g, v).slice().sort((p, q) => p.atom - q.atom)
    for (const nb of nbs) {
      const w = nb.atom
      if (w === parent[v]) continue
      if (pos[w] === -1) {
        parent[w] = v
        kids[v].push(w)
        visit(w)
      } else if (pos[w] < pos[v]) {
        rings.push({ id: rings.length, anc: w, desc: v, order: nb.order })
      }
    }
  }
  visit(0)
  if (counter !== n) throw new RangeError('toKekuleSmiles: the graph has more than one part')

  const openAt = new Map<number, typeof rings>()
  const closeAt = new Map<number, typeof rings>()
  for (const r of rings) {
    openAt.set(r.anc, [...(openAt.get(r.anc) ?? []), r])
    closeAt.set(r.desc, [...(closeAt.get(r.desc) ?? []), r])
  }
  const digitOf = new Map<number, number>()
  const used = new Array<boolean>(10).fill(false)
  const bondSymbol = (order: number): string => (order === 2 ? '=' : order === 3 ? '#' : '')
  const bondOrder = (a: number, b: number): number => neighbours(g, a).find((nb) => nb.atom === b)?.order ?? 1

  const token = (v: number): string => {
    const atom = g.atoms[v]
    const charge = atom.charge ?? 0
    const h = atom.hCount ?? implicitH(g, v)
    if (ORGANIC_SUBSET.has(atom.element) && charge === 0 && !atom.radical && h === implicitH(g, v)) {
      return atom.element
    }
    const hText = h === 0 ? '' : h === 1 ? 'H' : `H${h}`
    const chargeText = charge === 0 ? '' : charge === 1 ? '+' : charge === -1 ? '-' : charge > 0 ? `+${charge}` : `${charge}`
    return `[${atom.element}${hText}${chargeText}]`
  }

  let out = ''
  const emit = (v: number): void => {
    out += token(v)
    for (const r of closeAt.get(v) ?? []) {
      const d = digitOf.get(r.id) ?? 0
      out += bondSymbol(r.order) + String(d)
      used[d] = false
    }
    for (const r of openAt.get(v) ?? []) {
      const d = used.findIndex((u, k) => k > 0 && !u)
      if (d < 0) throw new RangeError('toKekuleSmiles: too many ring closures')
      used[d] = true
      digitOf.set(r.id, d)
      out += String(d)
    }
    const children = kids[v]
    children.forEach((c, k) => {
      const last = k === children.length - 1
      if (!last) out += '('
      out += bondSymbol(bondOrder(v, c))
      emit(c)
      if (!last) out += ')'
    })
  }
  emit(0)
  return out
}
