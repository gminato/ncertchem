/**
 * Model for the Section 5 simulation: nucleophilic addition to a carbonyl compound.
 * Every molecule is a Kekulé SMILES checked by its test; names come from unit8Name().
 */
import { unit8Name } from './ncert-c12-unit8-data'
import { molecularFormula, parseSmiles } from './molecule-parse'

export type CarbonylKind = 'aldehyde' | 'ketone'
export type NucleophileId = 'cyanide' | 'bisulphite'

export interface Carbonyl {
  id: 'methanal' | 'ethanal' | 'propanone' | 'butanone'
  label: string
  kind: CarbonylKind
  smiles: string
}

/** The four carbonyl compounds on offer: two aldehydes and two ketones. */
export const CARBONYLS: readonly Carbonyl[] = [
  { id: 'methanal', label: 'Methanal', kind: 'aldehyde', smiles: 'C=O' },
  { id: 'ethanal', label: 'Ethanal', kind: 'aldehyde', smiles: 'CC=O' },
  { id: 'propanone', label: 'Propan-2-one', kind: 'ketone', smiles: 'CC(C)=O' },
  { id: 'butanone', label: 'Butan-2-one', kind: 'ketone', smiles: 'CCC(C)=O' },
]

/** Cyanohydrin (HCN adduct) of each carbonyl compound. */
const CYANOHYDRIN_SMILES: Record<Carbonyl['id'], string> = {
  methanal: 'OCC#N',
  ethanal: 'CC(O)C#N',
  propanone: 'CC(C)(O)C#N',
  butanone: 'CCC(C)(O)C#N',
}

/** Tetrahedral alkoxide after cyanide adds to the carbonyl carbon (the negative charge sits on O). */
const ALKOXIDE_SMILES: Record<Carbonyl['id'], string> = {
  methanal: '[O-]CC#N',
  ethanal: '[O-]C(C)C#N',
  propanone: '[O-]C(C)(C)C#N',
  butanone: '[O-]C(C)(CC)C#N',
}

export function carbonylById(id: Carbonyl['id']): Carbonyl {
  const c = CARBONYLS.find((x) => x.id === id)
  if (!c) throw new Error(`unknown carbonyl ${id}`)
  return c
}

/** The cyanohydrin SMILES for a carbonyl compound. */
export function cyanohydrinSmiles(id: Carbonyl['id']): string {
  return CYANOHYDRIN_SMILES[id]
}

/** The alkoxide SMILES (the tetrahedral intermediate) for a carbonyl compound. */
export function alkoxideSmiles(id: Carbonyl['id']): string {
  return ALKOXIDE_SMILES[id]
}

/** The IUPAC-style name the namer gives a SMILES (via unit8Name). */
export function nameOf(smiles: string): string {
  return unit8Name(smiles)
}

/** Formula of a SMILES, for display (C₂H₄O style). */
export function formulaOf(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}

export interface Verdict {
  /** Speed of the addition for this carbonyl. */
  rate: 'faster' | 'slower'
  /** Whether the equilibrium favours the adduct (only meaningful for bisulphite). */
  favoured: 'favoured' | 'not favoured' | null
  /** One sentence, in NCERT's reasoning. */
  reason: string
}

/**
 * Qualitative verdict. Aldehydes are faster than ketones with either nucleophile.
 * Bisulphite addition lies right for most aldehydes and left for most ketones.
 */
export function verdict(carbonyl: Carbonyl, nucleophile: NucleophileId): Verdict {
  const aldehyde = carbonyl.kind === 'aldehyde'
  const rate = aldehyde ? 'faster' : 'slower'
  if (nucleophile === 'cyanide') {
    return {
      rate,
      favoured: null,
      reason: aldehyde
        ? 'One alkyl group leaves the approach less crowded and the carbonyl carbon more electrophilic.'
        : 'Two alkyl groups crowd the approach and lower the electrophilicity of the carbonyl carbon more than one does.',
    }
  }
  return {
    rate,
    favoured: aldehyde ? 'favoured' : 'not favoured',
    reason: aldehyde
      ? 'The equilibrium lies to the right for most aldehydes.'
      : 'The equilibrium lies to the left for most ketones, because of steric hindrance.',
  }
}
