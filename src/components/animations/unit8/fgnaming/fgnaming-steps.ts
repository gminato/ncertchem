/**
 * The Steps of the functional-naming Scrolly (Sections 8.5.3 and 8.5.4). Each Step is built from
 * the naming lib: the molecules come from chain and ring states, the names from nameOf, the
 * principal-group reasoning from chainExplanation, and the groups and chain to highlight from
 * findGroups and carbonChain. Pure data: the drawing component reads it.
 */

import type { SkeletalMark } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  carbonChain,
  chainExplanation,
  chainSmiles,
  emptyChain,
  findGroups,
  nameOf,
  numberChain,
  ringAtomIndices,
  ringSmiles,
  typeset,
  withGroup,
  withLink,
  type ChainState,
  type PrincipalKind,
  type RingGroupId,
} from '@/lib/chem/functional-namer'

/** One molecule as drawn in a Step: its graph, its lib name, and where and how big to draw it. */
export interface DrawnMolecule {
  smiles: string
  graph: MolGraph
  name: string
  x: number
  y: number
  scale: number
  highlightAtoms: number[]
  highlightBonds: number[]
  locants: SkeletalMark[]
  innerCircles: boolean
}

/** A row of the ortho, meta and para Step: the relation word, the locants and the molecule. */
export interface RingRow {
  relation: 'ortho' | 'meta' | 'para'
  locants: string
  molecule: DrawnMolecule
}

/** The layout of a Step: the priority ladder, one centred molecule, or rows of rings. */
export type FgLayout = 'ladder' | 'centred' | 'rows'

export interface FgStep {
  layout: FgLayout
  title: string
  /** Lines of reasoning, drawn under the molecule, already typeset. */
  lines: string[]
  /** The name in large type, when the Step ends on a name. */
  big: string | null
  /** The molecule of a 'centred' or 'ladder' Step. */
  molecules: DrawnMolecule[]
  /** The rows of a 'rows' Step. */
  rows: RingRow[]
  /** For the ladder: the principal classes present, which are highlighted in NCERT's order. */
  present: PrincipalKind[]
}

/** The chain of the acid example: C0=C1-C2-C3(=O)-C4-C5(=O)OH, a ketone at C3 and an acid at C5. */
export function acidExample(): ChainState {
  let s = emptyChain(6)
  s = withLink(s, 0, 2)
  s = withGroup(s, 3, 'oxo')
  s = withGroup(s, 5, 'COOH')
  return s
}

/** The chain of the hydroxy ketone example: a ketone at C2, a C=C at C3=C4 and an OH at C5. */
export function hydroxyKetoneExample(): ChainState {
  let s = emptyChain(5)
  s = withGroup(s, 4, 'OH')
  s = withGroup(s, 1, 'oxo')
  s = withLink(s, 2, 2)
  return s
}

function nameFor(smiles: string): string {
  const outcome = nameOf(smiles)
  if (!outcome.ok) throw new Error(`The lib does not name ${smiles}: ${outcome.reason}`)
  return outcome.name
}

/** The bond index that joins two atoms, or -1. */
function bondBetween(g: MolGraph, a: number, b: number): number {
  return g.bonds.findIndex((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
}

/** Bonds that join consecutive atoms of a path. */
function pathBonds(g: MolGraph, path: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 0; i + 1 < path.length; i++) {
    const b = bondBetween(g, path[i], path[i + 1])
    if (b >= 0) out.push(b)
  }
  return out
}

/** The atoms of the groups of one class, flattened. */
function atomsOf(g: MolGraph, kind: PrincipalKind): number[] {
  return findGroups(g, kind).flatMap((m) => m.atoms)
}

/** The bonds of the groups of one class, flattened. */
function bondsOf(g: MolGraph, kind: PrincipalKind): number[] {
  return findGroups(g, kind).flatMap((m) => m.bonds)
}

/** A chain state drawn at a position and scale, with its name from the lib. */
function chainDrawing(
  state: ChainState,
  opts: { x: number; y: number; scale: number; highlightAtoms?: number[]; highlightBonds?: number[]; locants?: SkeletalMark[] },
): DrawnMolecule {
  const smiles = chainSmiles(state)
  return {
    smiles,
    graph: parseSmiles(smiles),
    name: nameFor(smiles),
    x: opts.x,
    y: opts.y,
    scale: opts.scale,
    highlightAtoms: opts.highlightAtoms ?? [],
    highlightBonds: opts.highlightBonds ?? [],
    locants: opts.locants ?? [],
    innerCircles: false,
  }
}

/** A ring drawn at a position and scale, with its name from the lib. */
function ringDrawing(
  subs: (RingGroupId | null)[],
  opts: { x: number; y: number; scale: number; locants?: SkeletalMark[] },
): DrawnMolecule {
  const smiles = ringSmiles(subs)
  return {
    smiles,
    graph: parseSmiles(smiles),
    name: nameFor(smiles),
    x: opts.x,
    y: opts.y,
    scale: opts.scale,
    highlightAtoms: [],
    highlightBonds: [],
    locants: opts.locants ?? [],
    innerCircles: true,
  }
}

/** The locant mark on ring position `position` (1 to 6) of a ring built from `subs`. */
function ringLocant(subs: (RingGroupId | null)[], position: number): SkeletalMark {
  return { atom: ringAtomIndices(subs)[position - 1], label: String(position) }
}

/** Locant marks for a numbered chain path: the first atom is C1. */
function chainLocants(numbered: readonly number[]): SkeletalMark[] {
  return numbered.map((atom, i) => ({ atom, label: String(i + 1) }))
}

/** The locant (1-based) of an atom in a numbered path. */
function locantOf(numbered: readonly number[], atom: number): number {
  return numbered.indexOf(atom) + 1
}

/**
 * The seven Steps of the functional-naming Scrolly: the priority ladder; the principal group and
 * the parent chain; the numbering; a ketone outranking an alcohol; the ortho, meta and para ring
 * pairs; and the alphabetical tie-break on a disubstituted ring.
 */
export function functionalNamingSteps(): FgStep[] {
  const acid = acidExample()
  const acidSmiles = chainSmiles(acid)
  const acidGraph = parseSmiles(acidSmiles)
  const acidPath = carbonChain(acidGraph)
  const acidNumbered = numberChain(acidPath, atomsOf(acidGraph, 'acid')[0] ?? null)
  const acidExplain = chainExplanation(acid)
  const ketoneAtom = atomsOf(acidGraph, 'ketone')[0]
  const alkeneAtoms = atomsOf(acidGraph, 'alkene')
  const acidMolecule = (highlightAtoms: number[], highlightBonds: number[], locants: SkeletalMark[] = [], scale = 66): DrawnMolecule =>
    chainDrawing(acid, { x: 290, y: 140, scale, highlightAtoms, highlightBonds, locants })

  const ketone = hydroxyKetoneExample()
  const ketoneSmiles = chainSmiles(ketone)
  const ketoneGraph = parseSmiles(ketoneSmiles)
  const ketonePath = carbonChain(ketoneGraph)
  const ketoneNumbered = numberChain(ketonePath, atomsOf(ketoneGraph, 'ketone')[0] ?? null)
  const ketoneExplain = chainExplanation(ketone)

  const ORTHO: (RingGroupId | null)[] = ['Cl', 'CH3', null, null, null, null]
  const META: (RingGroupId | null)[] = [null, 'Cl', null, 'CH3', null, null]
  const PARA: (RingGroupId | null)[] = [null, null, 'Cl', null, null, 'CH3']
  const ALPHA: (RingGroupId | null)[] = ['Cl', null, 'CH3', null, null, null]
  const ringRow = (relation: RingRow['relation'], locants: string, subs: (RingGroupId | null)[], y: number): RingRow => ({
    relation,
    locants,
    molecule: ringDrawing(subs, { x: 218, y, scale: 44 }),
  })

  return [
    {
      layout: 'ladder',
      title: 'NCERT’s order of priority',
      lines: [`This molecule has three groups in the list: ${['–COOH', '>C=O', '>C=C<'].join(', ')}.`],
      big: null,
      molecules: [acidMolecule([...atomsOf(acidGraph, 'acid'), ...atomsOf(acidGraph, 'ketone'), ...alkeneAtoms], [...bondsOf(acidGraph, 'acid'), ...bondsOf(acidGraph, 'ketone'), ...bondsOf(acidGraph, 'alkene')])],
      rows: [],
      present: ['acid', 'ketone', 'alkene'],
    },
    {
      layout: 'centred',
      title: 'Principal group and parent chain',
      lines: [
        typeset(acidExplain[0]),
        `The longest carbon chain that holds the –COOH has ${acidPath.length} carbons, and it also holds the C=C.`,
      ],
      big: null,
      molecules: [acidMolecule(acidPath, pathBonds(acidGraph, acidPath), [], 74)],
      rows: [],
      present: [],
    },
    {
      layout: 'centred',
      title: 'Number from the acid carbon',
      lines: [
        'C1 is the acid carbon, so the principal group takes the lowest locant it can.',
        `The oxo group sits on C${locantOf(acidNumbered, ketoneAtom)} and the double bond starts on C${Math.min(...alkeneAtoms.map((a) => locantOf(acidNumbered, a)))}.`,
      ],
      big: nameFor(acidSmiles),
      molecules: [acidMolecule(acidPath, pathBonds(acidGraph, acidPath), chainLocants(acidNumbered), 66)],
      rows: [],
      present: [],
    },
    {
      layout: 'centred',
      title: 'A ketone outranks an alcohol',
      lines: [typeset(ketoneExplain[0]), typeset(ketoneExplain[1])],
      big: nameFor(ketoneSmiles),
      molecules: [
        chainDrawing(ketone, {
          x: 290,
          y: 140,
          scale: 72,
          highlightAtoms: atomsOf(ketoneGraph, 'ketone'),
          highlightBonds: bondsOf(ketoneGraph, 'ketone'),
          locants: chainLocants(ketoneNumbered),
        }),
      ],
      rows: [],
      present: [],
    },
    {
      layout: 'rows',
      title: 'Ortho, meta and para',
      lines: [],
      big: null,
      molecules: [],
      rows: [ringRow('ortho', '1,2', ORTHO, 118), ringRow('meta', '1,3', META, 252), ringRow('para', '1,4', PARA, 386)],
      present: [],
    },
    {
      layout: 'centred',
      title: 'Lowest locants, then alphabetical order',
      lines: [
        'Both numberings give the two substituents the locants 1 and 3.',
        'Chloro comes before methyl in the alphabet, so the chlorine carbon is C1.',
      ],
      big: nameFor(ringSmiles(ALPHA)),
      molecules: [ringDrawing(ALPHA, { x: 290, y: 140, scale: 80, locants: [ringLocant(ALPHA, 1), ringLocant(ALPHA, 3)] })],
      rows: [],
      present: [],
    },
  ]
}
