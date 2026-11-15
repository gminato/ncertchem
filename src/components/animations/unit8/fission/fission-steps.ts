import { cleavage, intermediateStability, rankIntermediates, type IntermediateItem } from '@/lib/chem/electronic-effects'
import { molecularFormula, parseSmiles, toCondensed } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { subscriptDigits } from '@/components/organic/condensed'

/** A bond that breaks: heterolytic (ions) or homolytic (radicals), drawn by BondCleavage. */
export interface BondPose {
  view: 'bond'
  mode: 'heterolytic' | 'homolytic'
  /** 0 = the bond is intact, 1 = it has broken. */
  progress: number
  /** Heterolysis only: the fragment that takes the pair. */
  anionSide: 'left' | 'right'
  left: string
  right: string
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

export type FissionPose = BondPose | OrbitalPose | LadderPose

/** Subscript digits in a condensed formula, e.g. 'CH3CHCH3' → 'CH₃CHCH₃'. */
export function subFormula(text: string): string {
  return text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))
}

/** The isopropyl group of the worked example, from the lib's homolysis of 2-bromopropane. */
function isopropylLabel(): string {
  const [fragment] = cleavage(parseSmiles('CC(C)Br'), 2, 'homolytic')
  return subFormula(toCondensed(fragment))
}

export const ISOPROPYL = isopropylLabel()

/** The six Steps of the Scrolly. */
export function fissionPoses(): FissionPose[] {
  return [
    {
      view: 'bond',
      mode: 'heterolytic',
      progress: 0,
      anionSide: 'right',
      left: ISOPROPYL,
      right: 'Br',
      title: 'One covalent C–Br bond: a shared pair of electrons',
    },
    {
      view: 'bond',
      mode: 'heterolytic',
      progress: 1,
      anionSide: 'right',
      left: ISOPROPYL,
      right: 'Br',
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
      anionSide: 'right',
      left: ISOPROPYL,
      right: 'Br',
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
  /** Condensed formula of the ion or radical, from the lib. */
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
      label: `${subFormula(toCondensed(item.graph).replace(/[⁺⁻•]/g, ''))}${kind === 'carbocation' ? '⁺' : '•'}`,
      smiles: smiles[i],
      alkylGroups: st.alkylGroups,
      alphaH: st.alphaH,
      graph: item.graph,
      centre: item.centre,
    }
  })
}

/** Formula of a species for a caption, from the lib, with the charge written as a superscript. */
export function speciesFormula(g: MolGraph): string {
  return molecularFormula(g).replace(/-/g, '−')
}
