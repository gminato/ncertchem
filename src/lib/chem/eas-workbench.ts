/**
 * The model of the electrophilic substitution workbench (Section 9.5.5): seven reactions of benzene
 * that NCERT gives (five substitutions, the addition of Cl₂ in UV light and the hydrogenation), each
 * with its equation, condition, electrophile, σ-complex and product from the lib. The workbench asks
 * the learner to put the four mechanism stages of a substitution in order; the order is checked here.
 */

import type { MolGraph } from './molecule-graph'
import { addChlorineUV, addHydrogenToBenzene, electrophilicSubstitution, type Reaction } from './hydrocarbon-reactions'
import { equationTerms, formulaText, methylCation, sigmaContributors, substitutionOfBenzene, subscriptDigits, type EasKind } from './eas-mechanism'
import { molecularFormula, parseSmiles } from './molecule-parse'

export type WorkbenchId = 'nitration' | 'chlorination' | 'sulphonation' | 'alkylation' | 'acylation' | 'bhc' | 'hydrogenation'

/** The four stages of a substitution, in the order the mechanism runs. */
export const MECHANISM_STAGES = ['generate', 'attack', 'deprotonate', 'restore'] as const
export type MechanismStage = (typeof MECHANISM_STAGES)[number]

export const STAGE_LABEL: Record<MechanismStage, string> = {
  generate: 'Make the electrophile',
  attack: 'The ring attacks it: a σ-complex forms',
  deprotonate: 'A base removes H⁺ from the sp³ carbon',
  restore: 'The aromatic ring is restored',
}

/** The stages in the order a substitution runs. */
export function correctStageOrder(): MechanismStage[] {
  return [...MECHANISM_STAGES]
}

/** True when the learner's order is the mechanism's order. */
export function isMechanismOrder(order: readonly string[]): boolean {
  return order.length === MECHANISM_STAGES.length && order.every((s, i) => s === MECHANISM_STAGES[i])
}

export interface WorkbenchReaction {
  id: WorkbenchId
  label: string
  kind: 'substitution' | 'addition'
  /** The reaction as the lib writes it (mhchem), with the lib's condition. */
  equation: string
  conditions: string
  /** Species above and below the arrow, from the equation terms: reagents (benzene excluded) and by-products. */
  reagents: string[]
  byproducts: string[]
  /** The electrophile name and formula (substitutions only). */
  electrophile?: { name: string; formula: string; generation: string }
  /** The anion that takes the proton from the σ-complex, e.g. HSO₄⁻ or AlCl₄⁻ (substitutions only). */
  base?: string
  /** The σ-complex drawn in the workbench: the first contributor (the + on ortho position 1). */
  sigma?: MolGraph
  sigmaFormula?: string
  product: { graph: MolGraph; name: string; formula: string }
  /** The lib's reason for the reaction. */
  why: string
}

const BENZENE = 'C1=CC=CC=C1'

/** The reagent of each substitution: the group that is added to benzene (for the alkyl and acyl kinds). */
const SUBSTITUTION_R: Partial<Record<EasKind, string>> = {
  alkylation: 'CCl',
  acylation: 'CC(=O)Cl',
}

function baseOf(reaction: Reaction): string {
  const eq = reaction.electrophile?.equation
  if (!eq) return ''
  const anion = equationTerms(eq).products.find((t) => t.endsWith('-'))
  return anion ? formulaText(anion.replace(/^\d+/, '')) : ''
}

/**
 * The electrophile as the workbench names it. The lib's generic alkyl and acyl electrophiles (R⁺, RCO⁺) are
 * named for the group the reaction uses: CH₃⁺ for chloromethane, and the acylium ion of ethanoyl chloride.
 */
function electrophileFor(kind: EasKind, lib: { name: string; formula: string; equation: string }): NonNullable<WorkbenchReaction['electrophile']> {
  const generation = electrophileEquationText(lib.equation)
  if (kind === 'alkylation') return { name: 'methyl cation', formula: formulaText(molecularFormula(methylCation())), generation }
  if (kind === 'acylation') return { name: 'acylium ion (ethanoyl cation)', formula: formulaText('C2H3O+'), generation }
  return { name: lib.name, formula: formulaText(lib.formula), generation }
}

/** The species that the base becomes when it has taken the proton from the σ-complex (the lib's bases only). */
const PROTONATED_BASE: Record<string, string> = {
  'HSO₄⁻': 'H₂SO₄',
  'AlCl₄⁻': 'AlCl₃ + HCl',
}

/** What a base becomes when it takes H⁺ from the σ-complex, e.g. HSO₄⁻ gives H₂SO₄. Throws for a base not in the table. */
export function protonatedBase(base: string): string {
  const found = PROTONATED_BASE[base]
  if (!found) throw new RangeError(`No protonated form is recorded for ${base}`)
  return found
}

/** Plain text (a condition, or a sentence from the lib) with its formulas written with real subscripts: HNO3 gives HNO₃. */
export function subscriptFormulas(text: string): string {
  return text.replace(/([A-Za-z)])(\d+)/g, (_m, letter: string, digits: string) => letter + subscriptDigits(digits))
}

/** A whole equation as plain text with real subscripts: "C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O" (from the lib's mhchem). */
export function reactionText(equation: string): string {
  return electrophileEquationText(equation)
}

function substitution(id: WorkbenchId, kind: EasKind, label: string): WorkbenchReaction {
  const R = SUBSTITUTION_R[kind] ? parseSmiles(SUBSTITUTION_R[kind]!) : undefined
  const reaction = substitutionOfBenzene(kind, R)
  const product = reaction.products[0]
  const terms = equationTerms(reaction.equation)
  const electrophile = reaction.electrophile!
  const sigma = sigmaContributors(kind, R)[0]
  return {
    id,
    label,
    kind: 'substitution',
    equation: reaction.equation,
    conditions: reaction.conditions,
    reagents: terms.reactants.filter((t) => t !== 'C6H6').map(formulaText),
    byproducts: terms.products.filter((t) => t !== product.formula).map(formulaText),
    electrophile: electrophileFor(kind, electrophile),
    base: baseOf(reaction),
    sigma,
    sigmaFormula: formulaText(molecularFormula(sigma)),
    product: { graph: product.graph, name: product.name, formula: formulaText(product.formula) },
    why: reaction.why,
  }
}

/** The electrophile's generation equation as text with real subscripts and charges (from the lib's mhchem). */
export function electrophileEquationText(equation: string): string {
  const { reactants, products } = equationTerms(equation)
  return `${reactants.map(formulaText).join(' + ')} → ${products.map(formulaText).join(' + ')}`
}

function addition(id: WorkbenchId, label: string, reaction: Reaction): WorkbenchReaction {
  const product = reaction.products[0]
  const terms = equationTerms(reaction.equation)
  return {
    id,
    label,
    kind: 'addition',
    equation: reaction.equation,
    conditions: reaction.conditions,
    reagents: terms.reactants.filter((t) => t !== 'C6H6').map(formulaText),
    byproducts: terms.products.filter((t) => t !== product.formula).map(formulaText),
    product: { graph: product.graph, name: product.name, formula: formulaText(product.formula) },
    why: reaction.why,
  }
}

/** The seven reactions of the workbench, in the order the buttons show them. */
export function workbenchReactions(): WorkbenchReaction[] {
  const benzene = parseSmiles(BENZENE)
  return [
    substitution('nitration', 'nitration', 'Nitration'),
    substitution('chlorination', 'chlorination', 'Halogenation'),
    substitution('sulphonation', 'sulphonation', 'Sulphonation'),
    substitution('alkylation', 'alkylation', 'Friedel–Crafts alkylation'),
    substitution('acylation', 'acylation', 'Friedel–Crafts acylation'),
    addition('bhc', 'Addition of Cl₂ in UV light', addChlorineUV(benzene)),
    addition('hydrogenation', 'Hydrogenation', addHydrogenToBenzene(benzene)),
  ]
}
