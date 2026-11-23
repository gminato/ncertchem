import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, neighbours } from '@/lib/chem/molecule-parse'
import { classifyOxyGraph, oxyFormulaUnicode, type OxyClassification } from '@/lib/chem/c12-u7-s1-classification'

export interface AlcoholPanelSpec {
  id: string
  smiles: string
  name: string
  formula: string
  badge: string
  classLabel: string
  subLabel?: string
  caution?: boolean
}

export interface AlcoholPanelData extends AlcoholPanelSpec {
  graph: MolGraph
  classification: OxyClassification
  /** Direct carbon neighbour indices of the first C–OH carbon (for 1°/2°/3° numbering). */
  directCarbonNeighbours: number[]
}

export const ALCOHOL_STEPS: readonly (readonly AlcoholPanelSpec[])[] = [
  // Step 0: Hydroxyl count — mono-, di-, trihydric
  [
    {
      id: 'ethanol-mono',
      smiles: 'CCO',
      name: 'ethanol',
      formula: 'C₂H₅OH',
      badge: '1 × –OH',
      classLabel: 'Monohydric',
    },
    {
      id: 'diol',
      smiles: 'OCCO',
      name: 'ethane-1,2-diol',
      formula: 'HOCH₂–CH₂OH',
      badge: '2 × –OH',
      classLabel: 'Dihydric',
    },
    {
      id: 'triol',
      smiles: 'OCC(O)CO',
      name: 'propane-1,2,3-triol',
      formula: 'CH₂(OH)CH(OH)CH₂OH',
      badge: '3 × –OH',
      classLabel: 'Trihydric',
    },
  ],
  // Step 1: 1°, 2°, 3° monohydric sp³ alkyl alcohols
  [
    {
      id: 'alkyl-1',
      smiles: 'CCO',
      name: 'ethanol',
      formula: '–CH₂–OH',
      badge: '1 C neighbour',
      classLabel: 'Primary (1°)',
    },
    {
      id: 'alkyl-2',
      smiles: 'CC(O)C',
      name: 'propan-2-ol',
      formula: '>CH–OH',
      badge: '2 C neighbours',
      classLabel: 'Secondary (2°)',
    },
    {
      id: 'alkyl-3',
      smiles: 'CC(C)(C)O',
      name: '2-methylpropan-2-ol',
      formula: '>C–OH',
      badge: '3 C neighbours',
      classLabel: 'Tertiary (3°)',
    },
  ],
  // Step 2: Allylic 1°, 2°, 3°
  [
    {
      id: 'allylic-1',
      smiles: 'C=CCO',
      name: 'prop-2-en-1-ol',
      formula: 'CH₂=CH–CH₂–OH',
      badge: 'sp³ C–OH next to C=C',
      classLabel: '1° allylic',
    },
    {
      id: 'allylic-2',
      smiles: 'C=CC(O)C',
      name: 'but-3-en-2-ol',
      formula: 'CH₂=CH–CH(OH)CH₃',
      badge: 'sp³ C–OH next to C=C',
      classLabel: '2° allylic',
    },
    {
      id: 'allylic-3',
      smiles: 'C=CC(C)(O)C',
      name: '2-methylbut-3-en-2-ol',
      formula: 'CH₂=CH–C(OH)(CH₃)₂',
      badge: 'sp³ C–OH next to C=C',
      classLabel: '3° allylic',
    },
  ],
  // Step 3: Benzylic 1°, 2°, 3° vs non-benzylic spacer
  [
    {
      id: 'benzylic-1',
      smiles: 'OCC1=CC=CC=C1',
      name: 'phenylmethanol',
      formula: 'C₆H₅–CH₂–OH',
      badge: 'Ring next door',
      classLabel: '1° benzylic',
    },
    {
      id: 'benzylic-2',
      smiles: 'CC(O)C1=CC=CC=C1',
      name: '1-phenylethan-1-ol',
      formula: 'C₆H₅–CH(OH)–CH₃',
      badge: 'Ring next door',
      classLabel: '2° benzylic',
    },
    {
      id: 'benzylic-3',
      smiles: 'CC(C)(O)C1=CC=CC=C1',
      name: '2-phenylpropan-2-ol',
      formula: 'C₆H₅–C(OH)(CH₃)₂',
      badge: 'Ring next door',
      classLabel: '3° benzylic',
    },
    {
      id: 'spacer-non-benzylic',
      smiles: 'CC(O)CC1=CC=CC=C1',
      name: '1-phenylpropan-2-ol',
      formula: 'C₆H₅–CH₂–CH(OH)CH₃',
      badge: '–CH₂– spacer breaks link',
      classLabel: '2° aliphatic (not benzylic)',
      caution: true,
    },
  ],
  // Step 4: Allylic sp³ vs Vinylic sp² (ethenol)
  [
    {
      id: 'ref-allylic',
      smiles: 'C=CCO',
      name: 'prop-2-en-1-ol',
      formula: 'CH₂=CH–CH₂–OH',
      badge: 'sp³ carbon (4 single bonds)',
      classLabel: 'Allylic (sp³ C–OH)',
    },
    {
      id: 'vinylic-ethenol',
      smiles: 'C=CO',
      name: 'ethenol',
      formula: 'CH₂=CH–OH',
      badge: 'sp² carbon (trigonal planar 120°)',
      classLabel: 'Vinylic (sp² C–OH)',
    },
  ],
] as const

export function clampAlcoholStep(step: number): number {
  return Math.min(Math.max(0, Math.floor(step)), ALCOHOL_STEPS.length - 1)
}

export function describeAlcoholPanel(spec: AlcoholPanelSpec): AlcoholPanelData {
  const graph = parseSmiles(spec.smiles)
  const classification = classifyOxyGraph(graph)
  const c = classification.carbonIndices[0]
  const directCarbonNeighbours =
    c !== undefined
      ? neighbours(graph, c)
          .filter((nb) => graph.atoms[nb.atom].element === 'C')
          .map((nb) => nb.atom)
      : []
  return {
    ...spec,
    formula: spec.formula || oxyFormulaUnicode(spec.smiles),
    graph,
    classification,
    directCarbonNeighbours,
  }
}

export function describeAlcoholStep(step: number): AlcoholPanelData[] {
  return ALCOHOL_STEPS[clampAlcoholStep(step)].map(describeAlcoholPanel)
}
