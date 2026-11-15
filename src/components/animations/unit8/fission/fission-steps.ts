import { cleavage, intermediateStability, rankIntermediates, type IntermediateItem } from '@/lib/chem/electronic-effects'
import { displaySpecies } from '@/lib/chem/arrow-push'
import { speciesLabel } from '@/lib/chem/species-labels'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** The intact molecule: a neutral bond with its shared pair, before anything breaks. */
export interface MoleculePose {
  view: 'molecule'
  title: string
}

/** A bond that breaks: heterolytic (ions) or homolytic (radicals), with charges only after fission. */
export interface BondPose {
  view: 'bond'
  mode: 'heterolytic' | 'homolytic'
  /** 0 = the bond is intact, 1 = it has broken. */
  progress: number
  left: string
  right: string
  caption: string
  title: string
}

/** One intermediate, drawn by IntermediateOrbital. */
export interface OrbitalPose {
  view: 'orbital'
  kind: 'carbocation' | 'carbanion' | 'radical'
  title: string
}

/** The stability ladder: carbocations and radicals, ordered by the lib. */
export interface LadderPose {
  view: 'ladder'
  title: string
}

export type FissionPose = MoleculePose | BondPose | OrbitalPose | LadderPose

/** The worked example: 2-bromopropane, drawn intact. */
export const INTACT_SMILES = 'CC(C)Br'

/** The two fragments from the lib's cleavage of 2-bromopropane, labelled for the learner. */
function fragmentLabels(mode: 'heterolytic' | 'homolytic'): { left: string; right: string } {
  const [left, right] = cleavage(parseSmiles(INTACT_SMILES), 2, mode)
  return { left: displaySpecies(left), right: displaySpecies(right) }
}

export const CATION_FRAGMENTS = fragmentLabels('heterolytic')
export const RADICAL_FRAGMENTS = fragmentLabels('homolytic')

/** The six Steps of the Scrolly. */
export function fissionPoses(): FissionPose[] {
  return [
    {
      view: 'molecule',
      title: 'One covalent C–Br bond: a shared pair of electrons',
    },
    {
      view: 'bond',
      mode: 'heterolytic',
      progress: 1,
      left: CATION_FRAGMENTS.left,
      right: CATION_FRAGMENTS.right,
      caption: 'Heterolysis: the pair goes to Br',
      title: 'Heterolysis: the pair goes to bromine',
    },
    {
      view: 'orbital',
      kind: 'carbocation',
      title: 'Carbocation: a carbon with an empty p orbital',
    },
    {
      view: 'orbital',
      kind: 'carbanion',
      title: 'Carbanion: a carbon holding a lone pair in an sp³ orbital',
    },
    {
      view: 'bond',
      mode: 'homolytic',
      progress: 1,
      left: RADICAL_FRAGMENTS.left,
      right: RADICAL_FRAGMENTS.right,
      caption: 'Homolysis: each fragment keeps one electron',
      title: 'Homolysis: each fragment keeps one electron',
    },
    {
      view: 'ladder',
      title: 'Stability: 3° > 2° > 1° > methyl',
    },
  ]
}

/** The four species of one row of the ladder, in the order the lib ranks them. */
export interface LadderRow {
  id: string
  /** Degree from the number of carbons on the centre (lib: alkylGroups). */
  degree: string
  /** The labelled species, e.g. (CH₃)₃C⁺ or CH₃•. */
  label: string
  smiles: string
  alkylGroups: number
  alphaH: number
  graph: MolGraph
  centre: number
}

const CATION_SMILES = ['[CH3+]', 'C[CH2+]', 'C[CH+]C', 'C[C+](C)C']
const RADICAL_SMILES = ['[CH3]', 'C[CH2]', 'C[CH]C', 'C[C](C)C']

function centreOf(g: MolGraph): number {
  return g.atoms.findIndex((a) => a.element === 'C' && ((a.charge ?? 0) !== 0 || (a.radical ?? 0) > 0))
}

function degreeName(alkylGroups: number): string {
  if (alkylGroups === 0) return 'methyl'
  return `${alkylGroups}° (${alkylGroups === 1 ? 'primary' : alkylGroups === 2 ? 'secondary' : 'tertiary'})`
}

/** The rows of one ladder, sorted most stable first by rankIntermediates. */
export function ladderRows(kind: 'carbocation' | 'radical'): LadderRow[] {
  const smiles = kind === 'carbocation' ? CATION_SMILES : RADICAL_SMILES
  const items: IntermediateItem[] = smiles.map((s) => {
    const graph = parseSmiles(s)
    return { kind, graph, centre: centreOf(graph) }
  })
  return rankIntermediates(items).map((i) => {
    const item = items[i]
    const st = intermediateStability(kind, item.graph, item.centre)
    return {
      id: smiles[i],
      degree: degreeName(st.alkylGroups),
      label: speciesLabel(item.graph) ?? displaySpecies(item.graph),
      smiles: smiles[i],
      alkylGroups: st.alkylGroups,
      alphaH: st.alphaH,
      graph: item.graph,
      centre: item.centre,
    }
  })
}

