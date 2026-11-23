import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'

/** Kekulé SMILES for every molecule the Scrolly draws from a SMILES (names come from the namer). */
export const SMILES = {
  ethanal: 'CC=O',
  hydroxybutanal: 'CC(O)CC=O',
  butenal: 'CC=CC=O',
  water: 'O',
  propanal: 'CCC=O',
  isobutanal: 'CC(C)C=O',
  aldolPropanal: 'CCC(O)C(C)C=O',
  aldolIsobutanal: 'CC(C)(C=O)C(O)C(C)C',
  /** Propanal's α-carbon attacks 2-methylpropanal. */
  crossPropanalNucleophile: 'CC(C=O)C(O)C(C)C',
  /** 2-Methylpropanal's α-carbon attacks propanal. */
  crossIsobutanalNucleophile: 'CC(C)(C=O)C(O)CC',
} as const

export const ETHANAL: MolGraph = parseSmiles(SMILES.ethanal)
export const HYDROXYBUTANAL: MolGraph = parseSmiles(SMILES.hydroxybutanal)
export const BUTENAL: MolGraph = parseSmiles(SMILES.butenal)
export const WATER: MolGraph = parseSmiles(SMILES.water)

/**
 * Carbanion of ethanal, CH₂⁻–CH=O: the negative charge sits on the α-carbon. Built by hand
 * because the SMILES reader is Kekulé-only and the carbanion has no name to print.
 */
export const CARBANION: MolGraph = {
  atoms: [
    { element: 'C', hCount: 2, charge: -1 },
    { element: 'C', hCount: 1 },
    { element: 'O', hCount: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 2 },
  ],
}

/** Resonance form of the carbanion, CH₂=CH–O⁻: the charge sits on the carbonyl oxygen. */
export const ENOLATE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 2 },
    { element: 'C', hCount: 1 },
    { element: 'O', hCount: 0, charge: -1 },
  ],
  bonds: [
    { a: 0, b: 1, order: 2 },
    { a: 1, b: 2, order: 1 },
  ],
}

/** The 2 × 2 product grid of Step 6: rows are the nucleophile, columns the electrophile. */
export const GRID: readonly { smiles: string; graph: MolGraph }[] = [
  { smiles: SMILES.aldolPropanal, graph: parseSmiles(SMILES.aldolPropanal) },
  { smiles: SMILES.crossIsobutanalNucleophile, graph: parseSmiles(SMILES.crossIsobutanalNucleophile) },
  { smiles: SMILES.crossPropanalNucleophile, graph: parseSmiles(SMILES.crossPropanalNucleophile) },
  { smiles: SMILES.aldolIsobutanal, graph: parseSmiles(SMILES.aldolIsobutanal) },
]

export const GRID_NAMES: readonly string[] = GRID.map((c) => unit8Name(c.smiles))

/** What each Step draws: the molecules (in drawing order) and how many curved arrows it carries. */
export const STEP_TARGETS: readonly { molecules: readonly MolGraph[]; curvedArrows: number }[] = [
  { molecules: [ETHANAL], curvedArrows: 0 },
  { molecules: [CARBANION, ENOLATE], curvedArrows: 2 },
  { molecules: [CARBANION, ETHANAL], curvedArrows: 2 },
  { molecules: [HYDROXYBUTANAL, WATER], curvedArrows: 0 },
  { molecules: [HYDROXYBUTANAL, BUTENAL, WATER], curvedArrows: 0 },
  { molecules: GRID.map((c) => c.graph), curvedArrows: 0 },
]
