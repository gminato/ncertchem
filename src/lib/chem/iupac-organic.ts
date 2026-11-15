/**
 * IUPAC names for organic molecules in the NCERT Class 11 Unit 8 scope (Section 8.5): acyclic
 * alkanes, alkenes and alkynes with alkyl and simple substituents; the principal functional groups
 * of Table 8.4 in NCERT's priority order (acid, ester, acyl halide, amide, nitrile, aldehyde,
 * ketone, alcohol, amine); cycloalkanes and cycloalkenes; and mono-, di- and tri-substituted
 * benzene with the names phenol, aniline and anisole.
 *
 * Rules applied (NCERT style): the parent chain carries the principal group, then the most
 * multiple bonds, then the most carbons, then the most substituents. Numbering gives the lowest
 * locants to the principal group, then to the multiple bonds, then to all substituents, then
 * alphabetical order breaks ties. Prefixes are alphabetical, ignoring di/tri, and iso- and neo-
 * count as part of the name; sec- and tert- do not. The isopropyl, sec-butyl, isobutyl and
 * tert-butyl groups use NCERT's trivial names; other branched groups are named systematically.
 *
 * Anything outside this scope throws a RangeError naming the feature. A wrong name is never
 * returned.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours, parseSmiles, toCondensed } from './molecule-parse'

/** One step of the naming, for an animation: the parent, the numbering, each substituent, the name. */
export interface NameStep {
  kind: 'parent' | 'numbering' | 'substituent' | 'name'
  text: string
  locant?: number
}

type Kind = 'acid' | 'ester' | 'acylHalide' | 'amide' | 'nitrile' | 'aldehyde' | 'ketone' | 'alcohol' | 'amine'

/** NCERT's order of decreasing priority for principal groups (Section 8.5.3). */
const PRIORITY: Kind[] = ['acid', 'ester', 'acylHalide', 'amide', 'nitrile', 'aldehyde', 'ketone', 'alcohol', 'amine']

const SUFFIX: Record<Kind, string> = {
  acid: 'oic acid',
  ester: 'oate',
  acylHalide: 'oyl halide',
  amide: 'amide',
  nitrile: 'nitrile',
  aldehyde: 'al',
  ketone: 'one',
  alcohol: 'ol',
  amine: 'amine',
}

/** Groups whose carbon is a chain end: they take no locant. */
const TERMINAL = new Set<Kind>(['acid', 'ester', 'acylHalide', 'amide', 'nitrile', 'aldehyde'])

/** Stems for 1 to 30 carbons (IUPAC names; icosane and triacontane as in NCERT Table 8.2). */
const STEMS = [
  '', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec',
  'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos', 'henicos', 'docos', 'tricos',
  'tetracos', 'pentacos', 'hexacos', 'heptacos', 'octacos', 'nonacos', 'triacont',
]

const HALO: Record<string, string> = { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' }
const HALIDE: Record<string, string> = { F: 'fluoride', Cl: 'chloride', Br: 'bromide', I: 'iodide' }

/** Trivial names NCERT uses for branched alkyl groups (Table 8.3 and Section 8.5.2). */
const TRIVIAL_ALKYL: Record<string, string> = {
  '1-methylethyl': 'isopropyl',
  '1-methylpropyl': 'sec-butyl',
  '2-methylpropyl': 'isobutyl',
  '1,1-dimethylethyl': 'tert-butyl',
}

/** Multiplying prefix for n identical items in a name ('di', 'tri' ...). */
function multWord(n: number): string {
  return ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa'][n] ?? ''
}

/** Multiplying prefix for a compound substituent: 'bis', 'tris' ... */
function bisWord(n: number): string {
  return ['', '', 'bis', 'tris', 'tetrakis'][n] ?? ''
}

/** A substituent prefix before the parent name. */
interface Prefix {
  name: string
  locant: number | null
  /** True when the name needs brackets (it contains a locant). */
  bracket: boolean
}

/** A principal-group site on a carbon of the parent. */
interface Site {
  kind: Kind
  carbon: number
  /** Heteroatoms that belong to the group and are not prefixes. */
  consumed: number[]
  /** For an ester: the carbon of the alkyl group and the ester oxygen. */
  alkylRoot?: number
  alkylOxygen?: number
}

function isCarbon(g: MolGraph, i: number): boolean {
  return g.atoms[i].element === 'C'
}

function hydrogens(g: MolGraph, i: number): number {
  return g.atoms[i].hCount ?? 0
}

function nitroN(g: MolGraph, i: number): boolean {
  return g.atoms[i].element === 'N' && (g.atoms[i].charge ?? 0) === 1 && neighbours(g, i).filter((n) => g.atoms[n.atom].element === 'O').length === 2
}

/** Finds the single ring, in cycle order, or returns []. Throws for fused or bridged rings. */
function findRing(g: MolGraph): number[] {
  const n = g.atoms.length
  const deg = new Array<number>(n).fill(0)
  for (const b of g.bonds) {
    deg[b.a]++
    deg[b.b]++
  }
  const removed = new Array<boolean>(n).fill(false)
  const queue: number[] = []
  deg.forEach((d, i) => {
    if (d <= 1) queue.push(i)
  })
  while (queue.length > 0) {
    const x = queue.pop() as number
    if (removed[x]) continue
    removed[x] = true
    for (const nb of neighbours(g, x)) {
      if (!removed[nb.atom]) {
        deg[nb.atom]--
        if (deg[nb.atom] <= 1) queue.push(nb.atom)
      }
    }
  }
  const rest: number[] = []
  for (let i = 0; i < n; i++) if (!removed[i]) rest.push(i)
  if (rest.length === 0) return []
  const edgesInside = g.bonds.filter((b) => !removed[b.a] && !removed[b.b]).length
  if (edgesInside !== rest.length) {
    throw new RangeError('Fused, bridged or polycyclic ring systems are not named by these rules')
  }
  const start = rest[0]
  const order = [start]
  let prev = -1
  let cur = start
  for (;;) {
    const next = neighbours(g, cur).find((nb) => !removed[nb.atom] && nb.atom !== prev && (nb.atom !== start || order.length > 2))
    if (!next || next.atom === start) break
    order.push(next.atom)
    prev = cur
    cur = next.atom
  }
  return order
}

/** Carbon neighbours of `node` other than `parent`, rejecting heteroatoms and multiple bonds. */
function alkylChildren(g: MolGraph, node: number, parent: number): number[] {
  const kids: number[] = []
  for (const nb of neighbours(g, node)) {
    if (nb.atom === parent) continue
    if (g.atoms[nb.atom].element !== 'C') {
      throw new RangeError('A heteroatom inside an alkyl substituent is not supported')
    }
    if (nb.order !== 1) {
      throw new RangeError('An unsaturated alkyl substituent is not supported')
    }
    kids.push(nb.atom)
  }
  return kids
}

/** Text of an alkyl group (without brackets), its root carbon being locant 1. */
function alkylText(g: MolGraph, root: number, parent: number, covered: Set<number>): string {
  covered.add(root)
  const height = (node: number, par: number): number => {
    const kids = alkylChildren(g, node, par)
    return kids.length === 0 ? 0 : 1 + Math.max(...kids.map((k) => height(k, node)))
  }
  const path: number[] = [root]
  let node = root
  let par = parent
  for (;;) {
    const kids = alkylChildren(g, node, par)
    if (kids.length === 0) break
    let pick = kids[0]
    let best = height(pick, node)
    for (const k of kids) {
      const h = height(k, node)
      if (h > best || (h === best && k < pick)) {
        pick = k
        best = h
      }
    }
    par = node
    node = pick
    path.push(node)
    covered.add(node)
  }
  const subs: Prefix[] = []
  path.forEach((atom, idx) => {
    const before = idx === 0 ? parent : path[idx - 1]
    const after = idx + 1 < path.length ? path[idx + 1] : -1
    for (const kid of alkylChildren(g, atom, before)) {
      if (kid === after) continue
      const text = alkylText(g, kid, atom, covered)
      const trivial = TRIVIAL_ALKYL[text] ?? text
      subs.push({ name: trivial, locant: idx + 1, bracket: /\d/.test(trivial) })
    }
  })
  const stem = STEMS[path.length]
  const core = `${stem}yl`
  const prefixes = formatPrefixes(subs, false)
  const text = prefixes + core
  return TRIVIAL_ALKYL[text] ?? text
}

/** Sort key for alphabetical order: ignores multiplying words and sec-/tert- (not iso-, neo-). */
function alphaKey(name: string): string {
  return name.replace(/^\(|\)$/g, '').replace(/^(sec-|tert-)/, '').replace(/^[\d,\-()]+/, '').toLowerCase()
}

/** Formats prefixes: groups identical names, prints locants, orders alphabetically. */
function formatPrefixes(prefixes: Prefix[], omitLocants: boolean): string {
  const groups = new Map<string, Prefix[]>()
  for (const p of prefixes) {
    const list = groups.get(p.name) ?? []
    list.push(p)
    groups.set(p.name, list)
  }
  const entries = [...groups.entries()].map(([name, list]) => {
    const bracket = list[0].bracket
    const locants = list.map((p) => p.locant).filter((x): x is number => x !== null).sort((a, b) => a - b)
    const count = list.length
    const word = bracket ? `(${name})` : name
    const body = count > 1 ? (bracket ? bisWord(count) : multWord(count)) + word : word
    const text = omitLocants || locants.length === 0 ? body : `${locants.join(',')}-${body}`
    return { key: alphaKey(name), text }
  })
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  return entries.map((e) => e.text).join('-')
}

/** Principal-group sites and the heteroatoms they consume, read from the carbonyl and OH/NH2 groups. */
function detectSites(g: MolGraph): Site[] {
  const sites: Site[] = []
  const n = g.atoms.length
  for (let c = 0; c < n; c++) {
    if (!isCarbon(g, c)) continue
    const nbs = neighbours(g, c)
    const carbonyl = nbs.find((x) => x.order === 2 && g.atoms[x.atom].element === 'O')
    if (carbonyl) {
      const singles = nbs.filter((x) => x.order === 1)
      const hydroxy = singles.find((x) => g.atoms[x.atom].element === 'O' && hydrogens(g, x.atom) === 1)
      const ester = singles.find((x) => g.atoms[x.atom].element === 'O' && neighbours(g, x.atom).some((y) => y.atom !== c))
      const halide = singles.find((x) => ['F', 'Cl', 'Br', 'I'].includes(g.atoms[x.atom].element))
      const amide = singles.find((x) => g.atoms[x.atom].element === 'N' && hydrogens(g, x.atom) === 2)
      const carbonNbs = nbs.filter((x) => isCarbon(g, x.atom)).length
      if (hydroxy) {
        sites.push({ kind: 'acid', carbon: c, consumed: [carbonyl.atom, hydroxy.atom] })
      } else if (ester) {
        const r = neighbours(g, ester.atom).find((y) => y.atom !== c)
        if (!r || !isCarbon(g, r.atom)) throw new RangeError('Only alkyl esters are named')
        sites.push({ kind: 'ester', carbon: c, consumed: [carbonyl.atom, ester.atom], alkylRoot: r.atom, alkylOxygen: ester.atom })
      } else if (halide) {
        sites.push({ kind: 'acylHalide', carbon: c, consumed: [carbonyl.atom, halide.atom] })
      } else if (amide) {
        sites.push({ kind: 'amide', carbon: c, consumed: [carbonyl.atom, amide.atom] })
      } else if (hydrogens(g, c) === 1 && carbonNbs <= 1) {
        sites.push({ kind: 'aldehyde', carbon: c, consumed: [carbonyl.atom] })
      } else if (carbonNbs >= 2) {
        sites.push({ kind: 'ketone', carbon: c, consumed: [carbonyl.atom] })
      } else {
        throw new RangeError('This carbonyl group is not named by these rules')
      }
      continue
    }
    const nitrile = nbs.find((x) => x.order === 3 && g.atoms[x.atom].element === 'N')
    if (nitrile) {
      sites.push({ kind: 'nitrile', carbon: c, consumed: [nitrile.atom] })
    }
  }
  for (let o = 0; o < n; o++) {
    if (g.atoms[o].element !== 'O' || hydrogens(g, o) !== 1) continue
    const nb = neighbours(g, o)
    if (nb.length !== 1 || !isCarbon(g, nb[0].atom)) continue
    const c = nb[0].atom
    if (neighbours(g, c).some((x) => x.order === 2 && g.atoms[x.atom].element === 'O')) continue
    sites.push({ kind: 'alcohol', carbon: c, consumed: [o] })
  }
  for (let m = 0; m < n; m++) {
    if (g.atoms[m].element !== 'N' || hydrogens(g, m) !== 2) continue
    const nb = neighbours(g, m)
    if (nb.length !== 1 || !isCarbon(g, nb[0].atom)) continue
    const c = nb[0].atom
    if (neighbours(g, c).some((x) => x.order === 2 && g.atoms[x.atom].element === 'O')) continue
    sites.push({ kind: 'amine', carbon: c, consumed: [m] })
  }
  return sites
}

/** Result of naming one molecule. */
interface Analysis {
  name: string
  steps: NameStep[]
}

function analyse(g: MolGraph): Analysis {
  const steps: NameStep[] = []
  const n = g.atoms.length

  g.atoms.forEach((a, i) => {
    if (!['C', 'N', 'O', 'F', 'Cl', 'Br', 'I'].includes(a.element)) {
      throw new RangeError(`Naming of element ${a.element} is not supported`)
    }
    const q = a.charge ?? 0
    const nitroOxygen = a.element === 'O' && q === -1 && neighbours(g, i).some((y) => g.atoms[y.atom].element === 'N' && nitroN(g, y.atom))
    if (q !== 0 && !(a.element === 'N' && q === 1 && nitroN(g, i)) && !nitroOxygen) {
      throw new RangeError('Charged species other than nitro groups are not named')
    }
  })

  const ring = findRing(g)
  const inRing = new Set(ring)
  if (ring.some((i) => !isCarbon(g, i))) {
    throw new RangeError('Heterocyclic rings are not named by these rules')
  }
  const benzene =
    ring.length === 6 &&
    ring.every((i) => neighbours(g, i).filter((x) => inRing.has(x.atom) && x.order === 2).length === 1)

  const sites = detectSites(g)
  const consumed = new Set<number>()
  for (const s of sites) for (const c of s.consumed) consumed.add(c)

  // Benzene: a group bonded to the ring that is not a phenol, aniline or anisole is not named here.
  for (const s of sites) {
    const onRing = neighbours(g, s.carbon).some((x) => inRing.has(x.atom))
    if (benzene && !inRing.has(s.carbon) && onRing && s.kind !== 'alcohol' && s.kind !== 'amine') {
      throw new RangeError('Aromatic carboxylic acids, aldehydes and ketones are not named by these rules')
    }
  }

  const principal = PRIORITY.find((k) => sites.some((s) => s.kind === k))
  const principalSites = principal ? sites.filter((s) => s.kind === principal) : []
  const others = sites.filter((s) => s.kind !== principal)
  for (const s of others) {
    if (!['ketone', 'alcohol', 'amine', 'nitrile'].includes(s.kind)) {
      throw new RangeError(`A ${s.kind} group that is not principal is not named by these rules`)
    }
  }
  if (principal === 'ester' && principalSites.length > 1) {
    throw new RangeError('More than one ester group is not named by these rules')
  }
  const ester = principal === 'ester' ? principalSites[0] : undefined

  // Ring or chain parent.
  const chainCarbons = [] as number[]
  for (let i = 0; i < n; i++) if (isCarbon(g, i) && !inRing.has(i)) chainCarbons.push(i)
  // The carbons joined to the ring through carbon-only bonds (the chain on the ring, if any).
  const ringLinked = new Set<number>()
  const carbonStack = chainCarbons.filter((c) => neighbours(g, c).some((x) => inRing.has(x.atom)))
  carbonStack.forEach((c) => ringLinked.add(c))
  while (carbonStack.length > 0) {
    const x = carbonStack.pop() as number
    for (const y of neighbours(g, x)) {
      if (!inRing.has(y.atom) && isCarbon(g, y.atom) && !ringLinked.has(y.atom)) {
        ringLinked.add(y.atom)
        carbonStack.push(y.atom)
      }
    }
  }
  const linked = [...ringLinked]
  const chainIsTrivial =
    linked.every((c) => !sites.some((s) => s.carbon === c)) &&
    g.bonds.every((b) => !(linked.includes(b.a) && linked.includes(b.b)) || b.order === 1) &&
    linked.every((c) => neighbours(g, c).every((x) => inRing.has(x.atom) || isCarbon(g, x.atom)))
  const useChainWithPhenyl = benzene && linked.length > 0 && !chainIsTrivial

  let mode: 'chain' | 'ring'
  if (ring.length === 0) mode = 'chain'
  else if (useChainWithPhenyl) mode = 'chain'
  else mode = 'ring'

  const parentAtoms: number[] = []
  let cyclic = false
  let forest = chainCarbons
  if (mode === 'ring') {
    cyclic = true
    parentAtoms.push(...ring)
    if (principalSites.some((s) => !inRing.has(s.carbon))) {
      throw new RangeError('A principal group outside the ring is not named with a ring parent')
    }
  } else {
    if (principalSites.some((s) => !forest.includes(s.carbon))) {
      throw new RangeError('A principal group on a ring is not named with a chain parent')
    }
    const forestSet = new Set(forest)
    const adj = (x: number) => neighbours(g, x).filter((y) => forestSet.has(y.atom) && y.order >= 1)
    let bestPath: number[] = []
    let bestScore: number[] = []
    for (const u of forest) {
      // BFS tree from u inside the carbon forest.
      const parent = new Map<number, number>([[u, -1]])
      const queue = [u]
      while (queue.length) {
        const x = queue.shift() as number
        for (const y of adj(x)) {
          if (!parent.has(y.atom)) {
            parent.set(y.atom, x)
            queue.push(y.atom)
          }
        }
      }
      for (const v of parent.keys()) {
        if (v < u) continue
        const path: number[] = []
        for (let x = v; x !== -1; x = parent.get(x) as number) path.push(x)
        path.reverse()
        const inPath = new Set(path)
        const score = [
          principalSites.filter((s) => inPath.has(s.carbon)).length,
          g.bonds.filter((b) => inPath.has(b.a) && inPath.has(b.b) && b.order > 1).length,
          path.length,
          path.reduce((t, x) => t + neighbours(g, x).filter((y) => !inPath.has(y.atom) && !consumed.has(y.atom) && y.atom !== -1).length, 0),
        ]
        if (bestScore.length === 0 || lexGreater(score, bestScore) || (sameArray(score, bestScore) && pathIsBetter(g, path, bestPath, principalSites))) {
          bestScore = score
          bestPath = path
        }
      }
    }
    if (bestPath.length === 0) {
      throw new RangeError('No carbon chain to name')
    }
    parentAtoms.push(...bestPath)
  }

  // Anisole: an ether oxygen on the ring with a methyl group, when there is no phenol or aniline.
  let anisoleCarbon: number | null = null
  let anisoleOxygen: number | null = null
  if (mode === 'ring' && benzene && principal !== 'alcohol' && principal !== 'amine') {
    for (const r of ring) {
      for (const x of neighbours(g, r)) {
        if (inRing.has(x.atom) || g.atoms[x.atom].element !== 'O' || x.order !== 1 || consumed.has(x.atom)) continue
        const other = neighbours(g, x.atom).find((y) => y.atom !== r)
        if (other && isCarbon(g, other.atom) && neighbours(g, other.atom).length === 1) {
          anisoleCarbon = r
          anisoleOxygen = x.atom
        }
      }
    }
  }

  const parentSet = new Set(parentAtoms)
  const extraLocants = anisoleCarbon !== null ? [anisoleCarbon] : []
  const pathBonds = g.bonds.filter((b) => parentSet.has(b.a) && parentSet.has(b.b))
  const pathSitesCarbons = principalSites.map((s) => s.carbon)

  // Substituent attachments on each parent atom (before numbering: only their count matters).
  const attachCount = new Map<number, number>()
  for (const p of parentAtoms) {
    const cnt = neighbours(g, p).filter(
      (y) => !parentSet.has(y.atom) && !consumed.has(y.atom) && y.atom !== anisoleOxygen && !(inRing.has(y.atom) && mode === 'chain'),
    ).length
    const ringSub = mode === 'chain' ? neighbours(g, p).filter((y) => inRing.has(y.atom)).length : 0
    attachCount.set(p, cnt + ringSub)
  }
  // Non-principal sites on the parent are prefixes too.
  for (const s of others) {
    if (parentSet.has(s.carbon) && s.kind !== 'nitrile') attachCount.set(s.carbon, (attachCount.get(s.carbon) ?? 0) + 1)
  }

  const buildSubs = (order: number[]): { prefixes: Prefix[]; covered: Set<number>; handled: Set<number> } => {
    const loc = new Map<number, number>()
    order.forEach((a, k) => loc.set(a, k + 1))
    const covered = new Set<number>(parentAtoms)
    if (anisoleOxygen !== null) covered.add(anisoleOxygen)
    for (const s of sites) for (const c of s.consumed) covered.add(c)
    const prefixes: Prefix[] = []
    const handled = new Set<number>()

    for (const s of others) {
      if (!parentSet.has(s.carbon)) {
        if (s.kind === 'nitrile') continue
        throw new RangeError('A principal-group substituent outside the parent is not named')
      }
      const L = loc.get(s.carbon) as number
      if (s.kind === 'ketone') prefixes.push({ name: 'oxo', locant: L, bracket: false })
      else if (s.kind === 'alcohol') prefixes.push({ name: 'hydroxy', locant: L, bracket: false })
      else if (s.kind === 'amine') prefixes.push({ name: 'amino', locant: L, bracket: false })
    }
    for (const p of order) {
      const L = loc.get(p) as number
      for (const x of neighbours(g, p)) {
        const a = x.atom
        if (parentSet.has(a) || consumed.has(a) || handled.has(a)) continue
        if (a === anisoleOxygen) {
          // The methoxy group is the anisole name; nothing to add as a prefix.
          covered.add(a)
          for (const y of neighbours(g, a)) covered.add(y.atom)
          continue
        }
        const el = g.atoms[a].element
        if (el === 'C') {
          if (inRing.has(a)) {
            // Phenyl substituent on a chain parent: the whole ring is one prefix.
            for (const r of ring) {
              handled.add(r)
              covered.add(r)
            }
            prefixes.push({ name: 'phenyl', locant: L, bracket: false })
            continue
          }
          const triple = neighbours(g, a).find((y) => y.order === 3 && g.atoms[y.atom].element === 'N')
          if (triple) {
            handled.add(triple.atom)
            covered.add(a)
            covered.add(triple.atom)
            prefixes.push({ name: 'cyano', locant: L, bracket: false })
            continue
          }
          const text = alkylText(g, a, p, covered)
          prefixes.push({ name: TRIVIAL_ALKYL[text] ?? text, locant: L, bracket: /\d/.test(TRIVIAL_ALKYL[text] ?? text) })
          continue
        }
        if (['F', 'Cl', 'Br', 'I'].includes(el)) {
          covered.add(a)
          prefixes.push({ name: HALO[el], locant: L, bracket: false })
          continue
        }
        if (el === 'N') {
          if (nitroN(g, a)) {
            covered.add(a)
            for (const y of neighbours(g, a)) {
              covered.add(y.atom)
              handled.add(y.atom)
            }
            prefixes.push({ name: 'nitro', locant: L, bracket: false })
            continue
          }
          if (hydrogens(g, a) === 2 && neighbours(g, a).length === 1) {
            covered.add(a)
            prefixes.push({ name: 'amino', locant: L, bracket: false })
            continue
          }
          throw new RangeError('This nitrogen group is not named by these rules')
        }
        if (el === 'O') {
          if (hydrogens(g, a) === 1 && neighbours(g, a).length === 1) {
            covered.add(a)
            prefixes.push({ name: 'hydroxy', locant: L, bracket: false })
            continue
          }
          const others2 = neighbours(g, a).filter((y) => y.atom !== p)
          if (others2.length === 1 && isCarbon(g, others2[0].atom) && neighbours(g, a).every((y) => y.order === 1)) {
            const r = others2[0].atom
            covered.add(a)
            const text = alkylText(g, r, a, covered)
            const alkoxy = text.replace(/yl$/, 'oxy')
            prefixes.push({ name: alkoxy, locant: L, bracket: /\d/.test(alkoxy) })
            continue
          }
          throw new RangeError('This oxygen group is not named by these rules')
        }
        throw new RangeError(`Substituent ${el} is not named by these rules`)
      }
    }

    return { prefixes, covered, handled }
  }

  // Numbering candidates.
  const len = parentAtoms.length
  const candidates: number[][] = []
  if (cyclic) {
    for (let shift = 0; shift < len; shift++) {
      candidates.push(parentAtoms.map((_, k) => parentAtoms[(shift + k) % len]))
      candidates.push(parentAtoms.map((_, k) => parentAtoms[(shift - k + len * 2) % len]))
    }
  } else {
    candidates.push(parentAtoms.slice())
    candidates.push(parentAtoms.slice().reverse())
  }

  // A ring bond between locants 1 and n counts as n, so that the bond 1-2 is preferred (cyclohex-1-ene).
  const bondLocant = (x: number, y: number): number =>
    cyclic && Math.min(x, y) === 1 && Math.max(x, y) === len ? len : Math.min(x, y)

  const signature = (order: number[]): number[][] => {
    const loc = new Map<number, number>()
    order.forEach((a, k) => loc.set(a, k + 1))
    const principalLoc = [...pathSitesCarbons, ...extraLocants].map((c) => loc.get(c) as number).sort((x, y) => x - y)
    const multiple: number[] = []
    const doubles: number[] = []
    for (const b of pathBonds) {
      if (b.order > 1 && !benzene) {
        const l = bondLocant(loc.get(b.a) as number, loc.get(b.b) as number)
        multiple.push(l)
        if (b.order === 2) doubles.push(l)
      }
    }
    const subs: number[] = []
    for (const p of parentAtoms) {
      for (let k = 0; k < (attachCount.get(p) ?? 0); k++) subs.push(loc.get(p) as number)
    }
    return [principalLoc, multiple.sort((x, y) => x - y), doubles.sort((x, y) => x - y), subs.sort((x, y) => x - y)]
  }

  // Last tie-break (IUPAC): the alphabetically first prefix takes the lowest locant.
  const alphaVector = (order: number[]): number[][] => {
    const built = buildSubs(order).prefixes
    const sorted = built.slice().sort((x, y) => {
      const kx = alphaKey(x.name)
      const ky = alphaKey(y.name)
      return kx < ky ? -1 : kx > ky ? 1 : 0
    })
    return [sorted.map((pre) => pre.locant ?? 0)]
  }
  const fullSig = (order: number[]): number[][] => [...signature(order), ...alphaVector(order)]

  let bestOrder = candidates[0]
  let bestSig = fullSig(bestOrder)
  for (const c of candidates.slice(1)) {
    const sig = fullSig(c)
    if (compareSignatures(sig, bestSig) < 0) {
      bestSig = sig
      bestOrder = c
    }
  }
  steps.push({ kind: 'parent', text: cyclic ? `ring of ${len} carbons` : `chain of ${len} carbons` })
  steps.push({ kind: 'numbering', text: `numbering starts at atom ${bestOrder[0] + 1}` })

  const { prefixes, covered, handled } = buildSubs(bestOrder)
  const loc = new Map<number, number>()
  bestOrder.forEach((a, k) => loc.set(a, k + 1))

  const esterAlkyl = principal === 'ester' ? alkylText(g, ester!.alkylRoot as number, ester!.alkylOxygen as number, covered) : ''

  // Every atom must be part of the name.
  for (let i = 0; i < n; i++) {
    if (!covered.has(i) && !handled.has(i) && !(anisoleOxygen !== null && i === anisoleOxygen)) {
      if (g.atoms[i].element === 'H') continue
      throw new RangeError('The molecule has parts this naming does not cover (e.g. disconnected fragments)')
    }
  }

  for (const pre of prefixes) {
    steps.push({ kind: 'substituent', text: pre.name, locant: pre.locant ?? undefined })
  }

  // Parent name.
  let parentName: string
  const subCount = prefixes.length
  if (mode === 'ring' && benzene) {
    if (principal === 'alcohol' && principalSites.length === 1) parentName = 'phenol'
    else if (principal === 'amine' && principalSites.length === 1) parentName = 'aniline'
    else if (anisoleCarbon !== null && subCount > 0) parentName = 'anisole'
    else parentName = 'benzene'
    if (parentName !== 'benzene' && subCount > 0 && principal === 'alcohol') {
      // phenol with substituents: locants are needed
    }
    const benzeneOmit = parentName === 'benzene' && subCount === 1
    const body = formatPrefixes(prefixes, benzeneOmit)
    const name = body ? (anisoleCarbon !== null && parentName === 'anisole' ? body + parentName : body + parentName) : parentName
    steps.push({ kind: 'name', text: name })
    return { name, steps }
  }

  const nDouble = pathBonds.filter((b) => b.order === 2).length
  const nTriple = pathBonds.filter((b) => b.order === 3).length
  const dLocs = pathBonds.filter((b) => b.order === 2).map((b) => Math.min(loc.get(b.a) as number, loc.get(b.b) as number)).sort((x, y) => x - y)
  const tLocs = pathBonds.filter((b) => b.order === 3).map((b) => Math.min(loc.get(b.a) as number, loc.get(b.b) as number)).sort((x, y) => x - y)

  const prefix = cyclic ? 'cyclo' : ''
  const stem = STEMS[len]
  if (stem === undefined) {
    throw new RangeError(`Chains of ${len} carbons are not named`)
  }
  const omitEneLocant = !cyclic && len <= 3 && nDouble + nTriple === 1 && prefixes.length === 0 && principal === undefined
  const ring1Double = cyclic && nDouble === 1 && nTriple === 0 && principal === undefined
  let mid = prefix + stem
  if (nDouble + nTriple > 0) {
    const addA = nDouble >= 2 || nTriple >= 2
    if (addA) mid += 'a'
    if (nDouble > 0) mid += ring1Double || omitEneLocant ? '' : `-${dLocs.join(',')}-`
    if (nDouble > 0) mid += `${multWord(nDouble)}en`
    if (nTriple > 0) mid += (nDouble > 0 ? `-${tLocs.join(',')}-` : omitEneLocant ? '' : `-${tLocs.join(',')}-`) + `${multWord(nTriple)}yn`
    // The 'en' and 'yn' parts: locants are written before each part.
  } else {
    mid += 'an'
  }

  let name: string
  if (principal === undefined) {
    name = formatPrefixes(prefixes, omitParentLocants(prefixes, len, cyclic, pathBonds.some((b) => b.order > 1))) + mid + 'e'
  } else if (principal === 'ester') {
    name = `${esterAlkyl} ${formatPrefixes(prefixes, omitParentLocants(prefixes, len, cyclic, pathBonds.some((b) => b.order > 1)))}${mid}oate`
  } else if (principal === 'acylHalide') {
    const halogen = g.atoms[neighbours(g, principalSites[0].carbon).find((x) => ['F', 'Cl', 'Br', 'I'].includes(g.atoms[x.atom].element))?.atom ?? 0].element
    name = `${formatPrefixes(prefixes, omitParentLocants(prefixes, len, cyclic, pathBonds.some((b) => b.order > 1)))}${mid}oyl ${HALIDE[halogen]}`
  } else if (TERMINAL.has(principal)) {
    const s = principalSites.length
    const word = multWord(s) + SUFFIX[principal]
    const join = /^[aeiou]/.test(word) ? '' : 'e'
    name = `${formatPrefixes(prefixes, omitParentLocants(prefixes, len, cyclic, pathBonds.some((b) => b.order > 1)))}${mid}${join}${word}`
  } else {
    const s = principalSites.length
    const locs = principalSites.map((x) => loc.get(x.carbon) as number).sort((x, y) => x - y)
    const word = multWord(s) + SUFFIX[principal]
    const needsLocants = !(cyclic && nDouble === 0 && nTriple === 0 && s === 1) && !(len <= 2 && s === 1)
    const locText = needsLocants ? `-${locs.join(',')}-` : ''
    const join = /^[aeiou]/.test(word) && locText === '' ? '' : /^[aeiou]/.test(word) ? '' : 'e'
    name = `${formatPrefixes(prefixes, omitParentLocants(prefixes, len, cyclic, pathBonds.some((b) => b.order > 1)))}${mid}${join}${locText}${word}`
    if (principal === 'ketone' && locText === '' && !cyclic) {
      name = name.replace(/an(e)?one$/, 'anone')
    }
  }
  steps.push({ kind: 'name', text: name })
  return { name, steps }
}

/** Whether to drop the locants of prefixes (one substituent on a short chain or on a ring). */
function omitParentLocants(prefixes: Prefix[], len: number, cyclic: boolean, hasMultipleBond: boolean): boolean {
  if (prefixes.length !== 1) return false
  return (cyclic && !hasMultipleBond) || len <= 2
}

function lexGreater(a: number[], b: number[]): boolean {
  for (let k = 0; k < a.length; k++) {
    if (a[k] !== b[k]) return a[k] > b[k]
  }
  return false
}

function sameArray(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, k) => x === b[k])
}

/** Tie between equal-scoring chains: prefer the one whose principal group comes first. */
function pathIsBetter(g: MolGraph, path: number[], best: number[], sites: Site[]): boolean {
  if (best.length === 0) return true
  const pos = (p: number[]) => {
    const locs = sites.map((s) => p.indexOf(s.carbon)).filter((x) => x >= 0).map((x) => Math.min(x, p.length - 1 - x))
    return locs.sort((x, y) => x - y)
  }
  void g
  const a = pos(path)
  const b = pos(best)
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (a[k] !== b[k]) return a[k] < b[k]
  }
  return false
}

function compareSignatures(a: number[][], b: number[][]): number {
  for (let k = 0; k < a.length; k++) {
    const x = a[k]
    const y = b[k]
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] !== y[i]) return x[i] - y[i]
    }
    if (x.length !== y.length) return x.length - y.length
  }
  return 0
}

/**
 * IUPAC name of an organic molecule in the scope described in this file.
 *
 * @example iupacName(parseSmiles('CC(C)CC(C)(C)C')) // '2,2,4-trimethylpentane'
 * @throws {RangeError} If the molecule is outside the supported scope
 */
export function iupacName(g: MolGraph): string {
  return analyse(g).name
}

/**
 * The steps of the naming (parent, numbering, each substituent and the assembled name), for an
 * animation. The last step is the name.
 */
export function nameSteps(g: MolGraph): NameStep[] {
  return analyse(g).steps
}

/** Re-exported for tests and callers that want a name from a SMILES string. */
export function iupacNameFromSmiles(smiles: string): string {
  return iupacName(parseSmiles(smiles))
}

/** A condensed formula of the same molecule, for display next to the name. */
export function condensedOf(g: MolGraph): string {
  return toCondensed(g)
}
