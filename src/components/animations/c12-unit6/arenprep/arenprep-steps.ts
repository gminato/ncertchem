import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { neighbours } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** Kekulé SMILES for every molecule the Haloarene routes Scrolly draws (Section 5, 6.5). */
export const BENZENE = 'C1=CC=CC=C1'
export const TOLUENE = 'CC1=CC=CC=C1'
export const ORTHO_CHLOROTOLUENE = 'CC1=CC=CC=C1Cl'
export const PARA_CHLOROTOLUENE = 'CC1=CC=C(Cl)C=C1'
export const CHLOROBENZENE = 'ClC1=CC=CC=C1'
export const BROMOBENZENE = 'BrC1=CC=CC=C1'
export const IODOBENZENE = 'IC1=CC=CC=C1'
export const ANILINE = 'NC1=CC=CC=C1'

export const ARENPREP_STEP_COUNT = 6

/** Ring positions used for labels, counted by atom index in the SMILES above (toluene: 1 is the ipso carbon). */
export const TOLUENE_IPSO = 1
export const TOLUENE_ORTHO = [2, 6] as const
export const TOLUENE_PARA = 4
export const TOLUENE_METHYL = 0

/** A molecule with the name the namer gives it (never typed by hand). */
export interface NamedMolecule {
  smiles: string
  name: string
}

export function namedMolecule(smiles: string): NamedMolecule {
  return { smiles, name: iupacNameFromSmiles(smiles) }
}

/** Ring-to-ring distance in bonds (breadth-first search over the graph). */
export function bondDistance(g: MolGraph, from: number, to: number): number {
  const dist = new Map<number, number>([[from, 0]])
  const queue = [from]
  while (queue.length > 0) {
    const cur = queue.shift() as number
    if (cur === to) return dist.get(cur) as number
    for (const n of neighbours(g, cur)) {
      if (!dist.has(n.atom)) {
        dist.set(n.atom, (dist.get(cur) as number) + 1)
        queue.push(n.atom)
      }
    }
  }
  return -1
}

/** The Sandmeyer and iodide routes of Step 6: copper(I) salt or potassium iodide, and the product drawn. */
export const SANDMEYER_ROUTES = [
  { reagent: 'Cu₂Cl₂', product: CHLOROBENZENE },
  { reagent: 'Cu₂Br₂', product: BROMOBENZENE },
  { reagent: 'KI', product: IODOBENZENE },
] as const

/** What each Step shows, as data the tests check (the component draws from the same constants). */
export interface ArenprepStepTarget {
  /** Structures drawn in the Step, by SMILES. */
  drawn: readonly string[]
  /** Short label of the route the Step is about. */
  route: string
}

export function arenprepStepTarget(step: number): ArenprepStepTarget {
  switch (step) {
    case 0:
      return { route: 'Cl2 with FeCl3', drawn: [BENZENE, CHLOROBENZENE] }
    case 1:
      return {
        route: 'toluene, ortho and para',
        drawn: [TOLUENE, ORTHO_CHLOROTOLUENE, PARA_CHLOROTOLUENE],
      }
    case 2:
      return {
        route: 'separation by melting point',
        drawn: [PARA_CHLOROTOLUENE, ORTHO_CHLOROTOLUENE],
      }
    case 3:
      return { route: 'I2 with HNO3', drawn: [BENZENE, IODOBENZENE] }
    case 4:
      return { route: 'F2 not possible this way', drawn: [BENZENE] }
    default:
      return {
        route: 'Sandmeyer',
        drawn: [ANILINE, BENZENE, CHLOROBENZENE, BROMOBENZENE, IODOBENZENE],
      }
  }
}
