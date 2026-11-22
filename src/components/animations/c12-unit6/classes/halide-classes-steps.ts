import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { classifyHalide, classifyHalideSmiles, formulaUnicode, type HalideClass } from '@/lib/chem/haloalkanes'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'

/**
 * The molecules of each Step of the `halide-classes` Scrolly. Every molecule is the Section's own
 * (not an NCERT example). Names, formulas and classes are computed from the libs at render time.
 */
export const HALIDE_STEPS: readonly (readonly string[])[] = [
  // 1. A primary bromide on the 2-methylbutane frame.
  ['BrCC(C)CC'],
  // 2. The same frame with the bromine moved to C3 (2°) and C2 (3°).
  ['CC(C)C(Br)C', 'CCC(C)(Br)C'],
  // 3. Allylic: the halogen carbon sits next to a C=C.
  ['CC=CCBr'],
  // 4. Benzylic: the halogen carbon sits next to a ring, at 1°, 2° and 3° degree.
  ['BrCC1=CC=CC=C1', 'CC(Cl)C1=CC=CC=C1', 'CC(C)(Br)C1=CC=CC=C1'],
  // 5. Vinylic (C–X on a C=C) and aryl (C–X on the ring).
  ['C=C(C)Cl', 'CCC1=CC(Br)=CC=C1'],
  // 6. Geminal, vicinal and polyhalogen.
  ['CCC(Cl)(Cl)C', 'CC(C)C(Br)CBr', 'CC(Cl)(Cl)Cl'],
]

export interface HalideDescription {
  smiles: string
  graph: MolGraph
  /** IUPAC name from iupacNameFromSmiles. */
  name: string
  /** Molecular formula with Unicode subscripts, e.g. C₅H₁₁Br. */
  formula: string
  /** Class of the molecule, e.g. "1° alkyl halide" or "vicinal dihalide". */
  classLabel: string
  /** Atoms to wash: the halogen-bearing carbons and any deciding neighbour. */
  highlight: number[]
}

const HALOGEN_ELEMENTS = new Set(['F', 'Cl', 'Br', 'I'])

function monoLabel(c: HalideClass): string {
  switch (c.kind) {
    case 'alkyl':
      return c.degree === 'methyl' ? 'methyl halide' : `${c.degree ?? ''} alkyl halide`
    case 'allylic':
      return 'allylic halide'
    case 'benzylic':
      return `${c.degree ?? ''} benzylic halide`
    case 'vinylic':
      return 'vinylic halide'
    case 'aryl':
      return 'aryl halide'
  }
}

function multiLabel(smiles: string): string {
  const r = classifyHalideSmiles(smiles)
  if (r.dihalide === 'geminal') return 'geminal dihalide'
  if (r.dihalide === 'vicinal') return 'vicinal dihalide'
  return r.count >= 3 ? 'polyhalogen compound' : 'dihalide'
}

/** Describes one molecule of the Section from the libs (name, formula, class, highlight). */
export function describeHalide(smiles: string): HalideDescription {
  const graph = parseSmiles(smiles)
  const halogens = graph.atoms.flatMap((atom, i) => (HALOGEN_ELEMENTS.has(atom.element) ? [i] : []))
  if (halogens.length === 0) throw new RangeError(`No halogen in ${smiles}`)

  const classes = halogens.map((i) => classifyHalide(graph, i))
  let classLabel: string
  let highlight: number[]
  if (halogens.length === 1) {
    const c = classes[0]
    classLabel = monoLabel(c)
    highlight = [c.carbon, c.decidingNeighbour].filter((x): x is number => x !== null)
  } else {
    classLabel = multiLabel(smiles)
    highlight = [...new Set(classes.map((c) => c.carbon))]
  }

  return {
    smiles,
    graph,
    name: iupacNameFromSmiles(smiles),
    formula: formulaUnicode(molecularFormula(graph)),
    classLabel,
    highlight,
  }
}

/** The molecules of a Step, clamped to the Step range. */
export function describeStep(step: number): HalideDescription[] {
  const index = Math.min(Math.max(0, Math.floor(step)), HALIDE_STEPS.length - 1)
  return HALIDE_STEPS[index].map(describeHalide)
}
