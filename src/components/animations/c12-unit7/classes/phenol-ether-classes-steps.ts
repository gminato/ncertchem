import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { classifyOxyGraph, type OxyClassification } from '@/lib/chem/c12-u7-s1-classification'

export interface PhenolEtherPanelSpec {
  id: string
  smiles: string
  name: string
  formula: string
  badge: string
  classLabel: string
  symmetrical?: boolean
}

export interface PhenolEtherPanelData extends PhenolEtherPanelSpec {
  graph: MolGraph
  classification: OxyClassification
}

export const PHENOL_ETHER_STEPS: readonly (readonly PhenolEtherPanelSpec[])[] = [
  // Step 0: Monohydric phenols (phenol and 2-methylphenol)
  [
    {
      id: 'phenol',
      smiles: 'OC1=CC=CC=C1',
      name: 'phenol',
      formula: 'C₆H₅OH',
      badge: '1 × –OH on ring',
      classLabel: 'Monohydric phenol',
    },
    {
      id: '2-methylphenol',
      smiles: 'CC1=CC=CC=C1O',
      name: '2-methylphenol',
      formula: 'o-CH₃C₆H₄OH',
      badge: '1 × –OH + 1 × –CH₃',
      classLabel: 'Monohydric phenol',
    },
  ],
  // Step 1: Dihydric & Trihydric phenols
  [
    {
      id: 'benzene-1,2-diol',
      smiles: 'OC1=CC=CC=C1O',
      name: 'benzene-1,2-diol',
      formula: 'o-C₆H₄(OH)₂',
      badge: '2 × –OH on ring',
      classLabel: 'Dihydric phenol',
    },
    {
      id: 'benzene-1,2,3-triol',
      smiles: 'OC1=CC=CC(O)=C1O',
      name: 'benzene-1,2,3-triol',
      formula: '1,2,3-C₆H₃(OH)₃',
      badge: '3 × –OH on ring',
      classLabel: 'Trihydric phenol',
    },
  ],
  // Step 2: Simple (symmetrical) ether
  [
    {
      id: 'diethyl-ether',
      smiles: 'CCOCC',
      name: 'diethyl ether',
      formula: 'C₂H₅OC₂H₅',
      badge: 'R₁ = R₂ (both C₂H₅)',
      classLabel: 'Simple (symmetrical) ether',
      symmetrical: true,
    },
  ],
  // Step 3: Mixed (unsymmetrical) ethers
  [
    {
      id: 'ethyl-methyl-ether',
      smiles: 'CCOC',
      name: 'ethyl methyl ether',
      formula: 'C₂H₅OCH₃',
      badge: 'R₁ ≠ R₂ (C₂H₅ vs CH₃)',
      classLabel: 'Mixed (unsymmetrical) ether',
      symmetrical: false,
    },
    {
      id: 'ethyl-phenyl-ether',
      smiles: 'CCOC1=CC=CC=C1',
      name: 'ethyl phenyl ether',
      formula: 'C₂H₅OC₆H₅',
      badge: 'R₁ ≠ R₂ (C₂H₅ vs C₆H₅)',
      classLabel: 'Mixed (unsymmetrical) ether',
      symmetrical: false,
    },
  ],
] as const

export function clampPhenolEtherStep(step: number): number {
  return Math.min(Math.max(0, Math.floor(step)), PHENOL_ETHER_STEPS.length - 1)
}

export function describePhenolEtherPanel(spec: PhenolEtherPanelSpec): PhenolEtherPanelData {
  const graph = parseSmiles(spec.smiles)
  return {
    ...spec,
    graph,
    classification: classifyOxyGraph(graph),
  }
}

export function describePhenolEtherStep(step: number): PhenolEtherPanelData[] {
  return PHENOL_ETHER_STEPS[clampPhenolEtherStep(step)].map(describePhenolEtherPanel)
}
