import { iupacNameFromSmiles } from './iupac-organic'
import { formulaUnicode, stereocentres, substitute } from './haloalkanes'
import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

/** The substitution mechanisms the Stereo Outcomes simulation can run. */
export type StereoMechanism = 'SN1' | 'SN2'

/** Each molecule the simulation offers. `arms` are the three groups drawn around the carbon, besides the halogen. */
export interface StereoMolecule {
  id: 'chloropentane' | 'bromobutane' | 'benzylic' | 'achiral'
  smiles: string
  /** Name used in the picker. Must equal iupacNameFromSmiles(smiles) (checked in the tests). */
  label: string
  halogen: 'Cl' | 'Br'
  arms: readonly [string, string, string]
  /** SN1 and SN2 offered for this halide. Achiral halides run no comparison. */
  mechanisms: readonly StereoMechanism[]
}

export const STEREO_MOLECULES: readonly StereoMolecule[] = [
  {
    id: 'chloropentane',
    smiles: 'CCCC(C)Cl',
    label: '2-chloropentane',
    halogen: 'Cl',
    arms: ['H', 'CH₃', 'C₃H₇'],
    mechanisms: ['SN2', 'SN1'],
  },
  {
    id: 'bromobutane',
    smiles: 'CCC(C)Br',
    label: '2-bromobutane',
    halogen: 'Br',
    arms: ['H', 'CH₃', 'C₂H₅'],
    mechanisms: ['SN2', 'SN1'],
  },
  {
    id: 'benzylic',
    smiles: 'CC(Br)C1=CC=CC=C1',
    label: '1-bromo-1-phenylethane',
    halogen: 'Br',
    arms: ['H', 'CH₃', 'C₆H₅'],
    mechanisms: ['SN1'],
  },
  {
    id: 'achiral',
    smiles: 'CCC(Cl)CC',
    label: '3-chloropentane',
    halogen: 'Cl',
    arms: ['H', 'C₂H₅', 'C₂H₅'],
    mechanisms: [],
  },
]

export interface StereoModel {
  molecule: StereoMolecule
  graph: MolGraph
  formula: string
  formulaUnicode: string
  /** Atom indices of the stereocentres (from the lib). */
  stereoAtoms: readonly number[]
  /** A chiral halide has at least one stereocentre. */
  chiral: boolean
  /** Product of SN2 or SN1 with hydroxide, from the lib. */
  product: {
    smiles: string
    name: string
    formula: string
    formulaUnicode: string
  }
  /** The name the namer gives the starting halide. */
  name: string
}

export function stereoMolecule(id: StereoMolecule['id']): StereoMolecule {
  const found = STEREO_MOLECULES.find((m) => m.id === id)
  if (!found) throw new RangeError(`stereoMolecule: unknown molecule ${id}`)
  return found
}

export function stereoModel(id: StereoMolecule['id']): StereoModel {
  const molecule = stereoMolecule(id)
  const graph = parseSmiles(molecule.smiles)
  const formula = molecularFormula(graph)
  const stereoAtoms = stereocentres(graph)
  const sub = substitute(molecule.smiles, 'first', 'O')
  if (sub.name === null) throw new RangeError(`stereoModel: no name for the product of ${molecule.label}`)
  return {
    molecule,
    graph,
    formula,
    formulaUnicode: formulaUnicode(formula),
    stereoAtoms,
    chiral: stereoAtoms.length > 0,
    product: {
      smiles: sub.smiles,
      name: sub.name,
      formula: sub.formula,
      formulaUnicode: formulaUnicode(sub.formula),
    },
    name: iupacNameFromSmiles(molecule.smiles),
  }
}

/**
 * The drawn outcome for one mechanism. SN2 gives one inverted product.
 * SN1 on a stereocentre gives an equal mixture of the two mirror-image products.
 */
export function outcomeFor(id: StereoMolecule['id'], mechanism: StereoMechanism): {
  products: readonly { name: string; mirror: boolean }[]
  split: string
  polarimeter: 'rotates' | 'zero'
} {
  const model = stereoModel(id)
  if (!model.chiral) throw new RangeError('outcomeFor: an achiral halide gives no stereo outcome')
  if (!model.molecule.mechanisms.includes(mechanism)) {
    throw new RangeError(`outcomeFor: ${mechanism} is not offered for ${model.molecule.label}`)
  }
  if (mechanism === 'SN2') {
    return { products: [{ name: model.product.name, mirror: false }], split: '100 % inverted', polarimeter: 'rotates' }
  }
  return {
    products: [
      { name: model.product.name, mirror: false },
      { name: model.product.name, mirror: true },
    ],
    split: '50 : 50',
    polarimeter: 'zero',
  }
}

/** Words the polarimeter readout may show. Magnitudes are never given. */
export const POLARIMETER_WORDS = ['rotates', 'opposite sign', 'zero'] as const

/** Plain-language verdict on whether the mirror image can be turned onto the original. */
export function superpositionVerdict(id: StereoMolecule['id']): string {
  const model = stereoModel(id)
  return model.chiral
    ? 'No turn of the mirror image lays all four arms on the original: the molecule is chiral.'
    : 'The mirror image lays on the original: the molecule is achiral, with two identical arms.'
}
