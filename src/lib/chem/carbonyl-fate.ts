/**
 * Which reaction from Section 9 (Cannizzaro, ring substitution) a carbonyl compound gives under a
 * condition, and the products it gives. Pure model; the Simulation draws what this returns.
 *
 * Every drawn molecule is a Kekulé SMILES read by parseSmiles. Names come from unit8Name, never typed here.
 */
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'

export type CarbonylId = 'methanal' | 'ethanal' | 'benzaldehyde' | 'acetophenone'
export type ConditionId = 'dilute-alkali' | 'conc-alkali' | 'nitrating-mix'
export type Outcome = 'cannizzaro' | 'meta-substitution' | 'none'

export interface Carbonyl {
  id: CarbonylId
  smiles: string
  /** True for an aldehyde (C=O at the end of a chain or on a ring). False for a ketone. */
  aldehyde: boolean
  /** True when a hydrogen sits on the carbon next to C=O. */
  alphaH: boolean
  aromatic: boolean
  /** Text drawn for the molecule: a condensed formula hides no carbon (R-C6). Skeletal when absent. */
  condensed?: string
}

export const CARBONYLS: readonly Carbonyl[] = [
  { id: 'methanal', smiles: 'C=O', condensed: 'HCHO', aldehyde: true, alphaH: false, aromatic: false },
  { id: 'ethanal', smiles: 'CC=O', condensed: 'CH₃CHO', aldehyde: true, alphaH: true, aromatic: false },
  { id: 'benzaldehyde', smiles: 'O=CC1=CC=CC=C1', aldehyde: true, alphaH: false, aromatic: true },
  { id: 'acetophenone', smiles: 'CC(=O)C1=CC=CC=C1', aldehyde: false, alphaH: true, aromatic: true },
]

export const CONDITIONS: readonly { id: ConditionId; label: string }[] = [
  { id: 'dilute-alkali', label: 'Dilute NaOH' },
  { id: 'conc-alkali', label: 'Conc. NaOH, heat' },
  { id: 'nitrating-mix', label: 'Conc. HNO₃/H₂SO₄' },
]

export function carbonylById(id: CarbonylId): Carbonyl {
  const c = CARBONYLS.find((x) => x.id === id)
  if (!c) throw new Error(`unknown carbonyl ${id}`)
  return c
}

/** Cannizzaro needs an aldehyde with no alpha-H and concentrated alkali; meta substitution needs an aromatic C=O and the nitrating mix. */
export function outcomeOf(c: Carbonyl, condition: ConditionId): Outcome {
  if (condition === 'conc-alkali' && c.aldehyde && !c.alphaH) return 'cannizzaro'
  if (condition === 'nitrating-mix' && c.aromatic) return 'meta-substitution'
  return 'none'
}

export interface Product {
  /** Role in the reaction, used for the caption. */
  role: 'reduced' | 'oxidised' | 'nitro'
  smiles: string
  /** Text drawn instead of a skeletal drawing, for molecules the drawing hides (C6). */
  condensed?: string
  /** Expected molecular formula, asserted in the tests against molecularFormula. */
  formula: string
  /** Name to show, or null for salts and nitro products the namer cannot name (R24). */
  name: string | null
}

export const CANNIZZARO_PRODUCTS: Readonly<Partial<Record<CarbonylId, readonly Product[]>>> = {
  methanal: [
    { role: 'reduced', smiles: 'CO', condensed: 'CH₃OH', formula: 'CH4O', name: 'methanol' },
    { role: 'oxidised', smiles: 'O=C[O-]', condensed: 'HCOO⁻Na⁺', formula: 'CHO2-', name: null },
  ],
  benzaldehyde: [
    { role: 'reduced', smiles: 'OCC1=CC=CC=C1', condensed: 'C₆H₅CH₂OH', formula: 'C7H8O', name: 'phenylmethanol' },
    { role: 'oxidised', smiles: 'O=C([O-])C1=CC=CC=C1', condensed: 'C₆H₅COO⁻Na⁺', formula: 'C7H5O2-', name: null },
  ],
}

export const NITRO_PRODUCTS: Readonly<Partial<Record<CarbonylId, Product>>> = {
  benzaldehyde: { role: 'nitro', smiles: 'O=CC1=CC=CC(=C1)[N+]([O-])=O', formula: 'C7H5NO3', name: '3-nitrobenzaldehyde' },
  acetophenone: { role: 'nitro', smiles: 'CC(=O)C1=CC(=CC=C1)[N+]([O-])=O', formula: 'C8H7NO3', name: null },
}

/** The products to draw for a carbonyl under a condition (empty when the outcome is none). */
export function productsOf(c: Carbonyl, condition: ConditionId): readonly Product[] {
  const outcome = outcomeOf(c, condition)
  if (outcome === 'cannizzaro') return CANNIZZARO_PRODUCTS[c.id] ?? []
  if (outcome === 'meta-substitution') {
    const p = NITRO_PRODUCTS[c.id]
    return p ? [p] : []
  }
  return []
}

/** The name shown for the starting carbonyl: the namer's name, or a lead-checked override. */
export function carbonylName(c: Carbonyl): string {
  return unit8Name(c.smiles)
}

/**
 * Caption lines for a carbonyl with alpha-H under concentrated alkali: no Cannizzaro reaction.
 * Joined with spaces they read as one sentence; the lines fit the Simulation's panel.
 */
export function alphaHydrogenCaption(c: Carbonyl): readonly string[] {
  const name = carbonylName(c)
  const cap = name.charAt(0).toUpperCase() + name.slice(1)
  return [
    `${cap} has α-hydrogens, so it does not undergo`,
    'the Cannizzaro reaction. With dilute alkali it gives',
    'the aldol reaction instead (Section 8.4.4).',
  ]
}

/** Molecular formula of a SMILES, from molecularFormula. */
export function formulaOf(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}
