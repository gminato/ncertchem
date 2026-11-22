import { iupacNameFromSmiles } from './iupac-organic'
import { classifyHalideSmiles, formulaUnicode, substitute, type HalideClass } from './haloalkanes'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { NCERT_FIG_6_3_SN2_RELATIVE_RATE } from './ncert-c12-unit6-data'

/** The two substitution mechanisms the Substitution Race compares. */
export type Mechanism = 'SN2' | 'SN1'

/** The substrates a learner can pick. Kind and degree come from classifyHalideSmiles. */
export type SubstrateId = 'methyl' | 'primary' | 'secondary' | 'tertiary' | 'allylic' | 'benzylic'

export interface RaceSubstrate {
  id: SubstrateId
  smiles: string
  name: string
  formula: string
  halogen: HalideClass['halogen']
  kind: HalideClass['kind']
  degree: HalideClass['degree']
  product: { smiles: string; name: string }
}

const SUBSTRATE_SMILES: readonly { id: SubstrateId; smiles: string }[] = [
  { id: 'methyl', smiles: 'CBr' },
  { id: 'primary', smiles: 'CCBr' },
  { id: 'secondary', smiles: 'CC(C)Br' },
  { id: 'tertiary', smiles: 'CC(C)(C)Br' },
  { id: 'allylic', smiles: 'C=CCBr' },
  { id: 'benzylic', smiles: 'ClCC1=CC=CC=C1' },
]

/** Each substrate with its name, formula, classification and the alcohol it gives with HO⁻. */
export function raceSubstrates(): RaceSubstrate[] {
  return SUBSTRATE_SMILES.map(({ id, smiles }) => {
    const cls = classifyHalideSmiles(smiles).halides[0]
    if (!cls) throw new Error(`no halogen in ${smiles}`)
    const product = substitute(smiles, 'first', 'O')
    if (!product.name) throw new Error(`no product name for ${smiles}`)
    return {
      id,
      smiles,
      name: iupacNameFromSmiles(smiles),
      formula: formulaUnicode(molecularFormula(parseSmiles(smiles))),
      halogen: cls.halogen,
      kind: cls.kind,
      degree: cls.degree,
      product: { smiles: product.smiles, name: product.name },
    }
  })
}

/**
 * Rate multiplier from the rate law. SN2: rate = k[RX][Nu⁻]; SN1: rate = k[RX] (the nucleophile
 * is not in the rate law, so its multiplier is ignored).
 */
export function rateFactor(mechanism: Mechanism, substrateMultiplier: number, nucleophileMultiplier: number): number {
  return mechanism === 'SN2' ? substrateMultiplier * nucleophileMultiplier : substrateMultiplier
}

export function rateLaw(mechanism: Mechanism): string {
  return mechanism === 'SN2' ? 'rate = k[RX][Nu⁻]' : 'rate = k[RX]'
}

/** The Fig. 6.3 relative SN2 rate of an alkyl halide; null for allylic and benzylic halides (not in the figure). */
export function fig63Entry(kind: HalideClass['kind'], degree: HalideClass['degree']): (typeof NCERT_FIG_6_3_SN2_RELATIVE_RATE)[number] | null {
  if (kind !== 'alkyl' || degree === null) return null
  return NCERT_FIG_6_3_SN2_RELATIVE_RATE.find((row) => row.degree === degree) ?? null
}
