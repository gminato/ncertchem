import { molecularFormula, parseSmiles } from './molecule-parse'
import { formulaUnicode } from './haloalkanes'
import { iupacNameFromSmiles } from './iupac-organic'

/**
 * Model for the Haloarene Maker Simulation (Unit 6, Section 5, NCERT 6.5). Every structure is a SMILES that
 * parseSmiles reads; every name is iupacNameFromSmiles of that SMILES; every formula is molecularFormula.
 * Ring labels (substituents at ring positions 1 to 6, clockwise from the top) are the drawing's only extra input.
 */

export type StartId = 'benzene' | 'toluene' | 'aniline' | 'p-toluidine'
export type RouteId = 'cl2' | 'br2' | 'i2' | 'f2' | 'cu-cl' | 'cu-br' | 'ki'

export interface RingLabel {
  /** Ring position, 1 to 6 (1 is the top vertex). */
  position: number
  label: string
}

export interface HaloSpecies {
  smiles: string
  name: string
  formula: string
  labels: readonly RingLabel[]
}

export interface HaloProduct extends HaloSpecies {
  /** 'single' for one product; 'ortho' and 'para' for the two direct-halogenation products of toluene. */
  role: 'single' | 'ortho' | 'para'
}

export type HaloOutcome =
  | {
      kind: 'products'
      /** Text over the arrow: the reagent. */
      reagent: string
      /** Text under the arrow: the catalyst, oxidant or condition. */
      condition: string
      /** The Sandmeyer route passes through a diazonium salt. */
      viaDiazonium: boolean
      products: readonly HaloProduct[]
      /** One sentence for the readout. */
      note: string
    }
  | { kind: 'verdict'; message: string }

const START_SMILES: Record<StartId, { smiles: string; labels: readonly RingLabel[] }> = {
  benzene: { smiles: 'C1=CC=CC=C1', labels: [] },
  toluene: { smiles: 'CC1=CC=CC=C1', labels: [{ position: 1, label: 'CH₃' }] },
  aniline: { smiles: 'NC1=CC=CC=C1', labels: [{ position: 1, label: 'NH₂' }] },
  'p-toluidine': {
    smiles: 'CC1=CC=C(N)C=C1',
    labels: [
      { position: 1, label: 'CH₃' },
      { position: 4, label: 'NH₂' },
    ],
  },
}

/** Products keyed by SMILES, with the ring labels the drawing uses. */
const PRODUCT_LABELS: Record<string, readonly RingLabel[]> = {
  'ClC1=CC=CC=C1': [{ position: 1, label: 'Cl' }],
  'BrC1=CC=CC=C1': [{ position: 1, label: 'Br' }],
  'IC1=CC=CC=C1': [{ position: 1, label: 'I' }],
  'CC1=CC=CC=C1Cl': [
    { position: 1, label: 'CH₃' },
    { position: 2, label: 'Cl' },
  ],
  'CC1=CC=C(Cl)C=C1': [
    { position: 1, label: 'CH₃' },
    { position: 4, label: 'Cl' },
  ],
  'CC1=CC=CC=C1Br': [
    { position: 1, label: 'CH₃' },
    { position: 2, label: 'Br' },
  ],
  'CC1=CC=C(Br)C=C1': [
    { position: 1, label: 'CH₃' },
    { position: 4, label: 'Br' },
  ],
  'CC1=CC=CC=C1I': [
    { position: 1, label: 'CH₃' },
    { position: 2, label: 'I' },
  ],
  'CC1=CC=C(I)C=C1': [
    { position: 1, label: 'CH₃' },
    { position: 4, label: 'I' },
  ],
}

/** The starting arene or amine as a drawable species. */
export function startSpecies(id: StartId): HaloSpecies {
  const { smiles, labels } = START_SMILES[id]
  return speciesOf(smiles, labels)
}

function speciesOf(smiles: string, labels: readonly RingLabel[]): HaloSpecies {
  const g = parseSmiles(smiles)
  return {
    smiles,
    name: iupacNameFromSmiles(smiles),
    formula: formulaUnicode(molecularFormula(g)),
    labels,
  }
}

function product(smiles: string, role: HaloProduct['role'] = 'single'): HaloProduct {
  const labels = PRODUCT_LABELS[smiles]
  if (!labels) throw new Error(`No ring labels for ${smiles}`)
  return { ...speciesOf(smiles, labels), role }
}

/** Direct halogenation of an arene: one product for benzene, ortho and para for toluene. */
function directProducts(start: StartId, halogen: 'Cl' | 'Br' | 'I'): HaloProduct[] {
  if (start === 'benzene') {
    const smiles = { Cl: 'ClC1=CC=CC=C1', Br: 'BrC1=CC=CC=C1', I: 'IC1=CC=CC=C1' }[halogen]
    return [product(smiles)]
  }
  const ortho = { Cl: 'CC1=CC=CC=C1Cl', Br: 'CC1=CC=CC=C1Br', I: 'CC1=CC=CC=C1I' }[halogen]
  const para = { Cl: 'CC1=CC=C(Cl)C=C1', Br: 'CC1=CC=C(Br)C=C1', I: 'CC1=CC=C(I)C=C1' }[halogen]
  return [product(ortho, 'ortho'), product(para, 'para')]
}

/** Sandmeyer products: the amine's ring carries the new halogen where the NH₂ was. */
function sandmeyerProducts(start: StartId, halogen: 'Cl' | 'Br' | 'I'): HaloProduct[] {
  if (start === 'aniline') {
    const smiles = { Cl: 'ClC1=CC=CC=C1', Br: 'BrC1=CC=CC=C1', I: 'IC1=CC=CC=C1' }[halogen]
    return [product(smiles)]
  }
  const para = { Cl: 'CC1=CC=C(Cl)C=C1', Br: 'CC1=CC=C(Br)C=C1', I: 'CC1=CC=C(I)C=C1' }[halogen]
  return [product(para)]
}

const DIRECT: Record<'cl2' | 'br2' | 'i2', { halogen: 'Cl' | 'Br' | 'I'; reagent: string; condition: string; note: string }> = {
  cl2: {
    halogen: 'Cl',
    reagent: 'Cl₂',
    condition: 'Fe or FeCl₃',
    note: 'Chlorine needs a Lewis acid (Fe or FeCl₃) to polarise it. Toluene gives ortho and para isomers.',
  },
  br2: {
    halogen: 'Br',
    reagent: 'Br₂',
    condition: 'Fe or FeCl₃',
    note: 'Bromine works the same way as chlorine: a Lewis acid catalyst is needed.',
  },
  i2: {
    halogen: 'I',
    reagent: 'I₂',
    condition: 'HNO₃ removes HI',
    note: 'Iodination is reversible. The oxidiser turns the HI back into I₂, so the reaction goes on.',
  },
}

/**
 * What the bench shows for a starting material and a route. Fluorine is never drawn as a product; a halogenation
 * route needs an arene, and a Sandmeyer route needs an amine.
 */
export function haloareneOutcome(start: StartId, route: RouteId): HaloOutcome {
  const isArene = start === 'benzene' || start === 'toluene'
  if (route === 'f2') {
    return { kind: 'verdict', message: 'Not possible this way: fluorine is too reactive, so no fluoroarene is made by direct fluorination.' }
  }
  if (route === 'cl2' || route === 'br2' || route === 'i2') {
    if (!isArene) {
      return { kind: 'verdict', message: 'Start from benzene or toluene for direct halogenation. An amine goes through the Sandmeyer route.' }
    }
    const d = DIRECT[route]
    return {
      kind: 'products',
      reagent: d.reagent,
      condition: d.condition,
      viaDiazonium: false,
      products: directProducts(start, d.halogen),
      note: d.note,
    }
  }
  if (isArene) {
    return { kind: 'verdict', message: 'Start from an amine: the Sandmeyer route first turns a primary aromatic amine into a diazonium salt.' }
  }
  const halogen = route === 'cu-cl' ? 'Cl' : route === 'cu-br' ? 'Br' : 'I'
  const condition = route === 'cu-cl' ? 'Cu₂Cl₂ / HCl' : route === 'cu-br' ? 'Cu₂Br₂ / HBr' : 'KI, no copper'
  return {
    kind: 'products',
    reagent: 'NaNO₂ + HCl, cold',
    condition,
    viaDiazonium: true,
    products: sandmeyerProducts(start, halogen),
    note: 'The diazonium salt loses N₂ gas as the halogen takes its place.',
  }
}
