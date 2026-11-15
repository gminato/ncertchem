/**
 * The steps of the alkane-naming Scrolly: one branched alkane named from its longest chain.
 * Each step sets which atoms and bonds are highlighted, whether the chain is numbered, and the
 * callouts. The chain, the numbering and the name all come from the lib (alkane-naming.ts and
 * iupac-organic.ts); only the tempting wrong chain is fixed, and a test checks that it is a real
 * path shorter than the longest chain.
 */

import { nameSteps } from '@/lib/chem/iupac-organic'
import { alkaneChain, chainNumbering, type ChainNumbering } from '@/lib/chem/alkane-naming'
import { neighbours, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** 3-Ethyl-2-methylheptane: the molecule the Scrolly names. Its atoms are indexed in SMILES order. */
export const NAMING_SMILES = 'CCCCC(CC)C(C)C'
export const NAMING_STEP_COUNT = 5

/** A quick look picks this path: the methyl of the isopropyl end, through the branch CH, the ethyl. */
export const TEMPTING_PATH = [8, 7, 4, 5, 6] as const

export const NAMING_GRAPH: MolGraph = parseSmiles(NAMING_SMILES)
export const NAMING_CHAIN = alkaneChain(NAMING_GRAPH)
export const NAMING_NUMBERING: ChainNumbering = chainNumbering(NAMING_GRAPH, NAMING_CHAIN)

/** A callout: its text, the side chain's first carbon (`anchor`) and the chain carbon it hangs from. */
export interface NamingCallout {
  anchor: number
  attach: number
  text: string
}

export interface NamingStep {
  highlightAtoms: number[]
  highlightBonds: number[]
  /** Locants on the chain atoms, in the chosen numbering. */
  showNumbers: boolean
  callouts: NamingCallout[]
  /** One short line for the drawing, built from the lib's values. */
  caption: string
}

/** The indices of the bonds that join consecutive atoms of a path. */
export function pathBondIndices(g: MolGraph, path: readonly number[]): number[] {
  const out: number[] = []
  for (let k = 0; k + 1 < path.length; k++) {
    const i = g.bonds.findIndex(
      (b) => (b.a === path[k] && b.b === path[k + 1]) || (b.b === path[k] && b.a === path[k + 1])
    )
    if (i < 0) throw new RangeError('The atoms of the path are not bonded in sequence')
    out.push(i)
  }
  return out
}

/**
 * The substituents as the lib prints them in the name (alphabetical), with their locants. The lib's
 * steps come in locant order, so the order is read from the assembled name.
 */
function substituentsFromLib(): { text: string; locant: number }[] {
  const name = nameSteps(NAMING_GRAPH).at(-1)?.text ?? ''
  return nameSteps(NAMING_GRAPH)
    .filter((s) => s.kind === 'substituent' && s.locant !== undefined)
    .map((s) => ({ text: s.text, locant: s.locant as number }))
    .sort((a, b) => name.indexOf(a.text) - name.indexOf(b.text))
}

/** Carbons bonded to a chain atom that are not on the chain, in bond order. */
export function sideChainRoots(attach: number, chain: readonly number[]): number[] {
  return neighbours(NAMING_GRAPH, attach)
    .map((nb) => nb.atom)
    .filter((x) => !chain.includes(x))
}

/** The state of one Scrolly step (0 to NAMING_STEP_COUNT - 1). */
export function namingStep(step: number): NamingStep {
  const index = Math.min(NAMING_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const chain = NAMING_CHAIN.atoms
  const numbering = NAMING_NUMBERING
  const lowSet = numbering.locants.join(',')
  const otherSet = (numbering.locants === numbering.fromFirst ? numbering.fromLast : numbering.fromFirst).join(',')
  const steps = nameSteps(NAMING_GRAPH)
  const name = steps[steps.length - 1].text

  if (index === 0) {
    return {
      highlightAtoms: [...TEMPTING_PATH],
      highlightBonds: pathBondIndices(NAMING_GRAPH, TEMPTING_PATH),
      showNumbers: false,
      callouts: [],
      caption: `${TEMPTING_PATH.length} carbons: a shorter path, not the longest`,
    }
  }
  if (index === 1) {
    return {
      highlightAtoms: [...chain],
      highlightBonds: pathBondIndices(NAMING_GRAPH, chain),
      showNumbers: false,
      callouts: [],
      caption: `The longest chain: ${chain.length} carbons`,
    }
  }
  if (index === 2) {
    return {
      highlightAtoms: [...chain],
      highlightBonds: pathBondIndices(NAMING_GRAPH, chain),
      showNumbers: true,
      callouts: [],
      caption: `From this end ${lowSet}; from the other end ${otherSet}. The lower set wins.`,
    }
  }
  if (index === 3) {
    const used = new Map<number, number>()
    const callouts = substituentsFromLib().map((s) => {
      const attach = numbering.order[s.locant - 1]
      const k = used.get(attach) ?? 0
      used.set(attach, k + 1)
      const anchor = sideChainRoots(attach, chain)[k]
      return { anchor, attach, text: `${s.locant}-${s.text}` }
    })
    return {
      highlightAtoms: [],
      highlightBonds: [],
      showNumbers: true,
      callouts,
      caption: `In the name: ${substituentsFromLib().map((s) => s.text).join(', ')}`,
    }
  }
  return {
    highlightAtoms: [],
    highlightBonds: [],
    showNumbers: true,
    callouts: [],
    caption: name,
  }
}
