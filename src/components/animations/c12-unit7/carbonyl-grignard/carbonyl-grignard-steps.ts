/**
 * Step data and verified product structures for `carbonyl-reduction-and-grignard`.
 */

import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { displayIupac, unicodeFormula } from '@/lib/chem/c12-u7-s4-alcohol-prep'

export const CARBONYL_GRIGNARD_STEP_COUNT = 4

export interface CarbonylGrignardStepMeta {
  id: 'aldehydes-ketones' | 'carboxylic-acids' | 'grignard-adduct' | 'grignard-hydrolysis'
  badge: string
  tone: 'accent' | 'success' | 'caution'
  title: string
  caption: string
  ariaLabel: string
}

export const CARBONYL_EXAMPLES = {
  ethanal: 'CC=O',
  ethanol: 'CCO',
  propanone: 'CC(=O)C',
  propan2ol: 'CC(O)C',
  methanal: 'C=O',
  tertButanol: 'CC(C)(C)O',
} as const

export const CARBONYL_GRIGNARD_STEPS: readonly CarbonylGrignardStepMeta[] = [
  {
    id: 'aldehydes-ketones',
    badge: 'Carbonyl reduction · ΔC = 0',
    tone: 'accent',
    title: 'Aldehydes give 1° alcohols; ketones give 2° alcohols',
    caption: 'H₂ (Pt/Pd/Ni), NaBH₄ or LiAlH₄ reduces C=O (ΔC = 0).',
    ariaLabel: 'Step 1: Reduction of aldehydes to primary alcohols and ketones to secondary alcohols using catalytic H2, NaBH4, or LiAlH4.',
  },
  {
    id: 'carboxylic-acids',
    badge: 'Carboxylic acids · lab vs industry',
    tone: 'success',
    title: 'Lab LiAlH₄ route vs commercial ester hydrogenation',
    caption: "Lab uses LiAlH₄ / H₂O; industry routes via R'OH ester + H₂.",
    ariaLabel: 'Step 2: Comparison of laboratory reduction of carboxylic acids with LiAlH4 followed by water against commercial esterification and catalytic hydrogenation.',
  },
  {
    id: 'grignard-adduct',
    badge: 'Grignard addition · Step (i)',
    tone: 'accent',
    title: 'Nucleophilic δ⁻R attacks C=O to form an adduct',
    caption: 'δ⁻R attacks carbonyl C(δ⁺), forming a new C-C bond.',
    ariaLabel: 'Step 3: Grignard addition step (i), showing curved arrows from the R-Mg bond to the carbonyl carbon and from C=O pi bond onto oxygen to form the magnesium alkoxide adduct.',
  },
  {
    id: 'grignard-hydrolysis',
    badge: 'Grignard hydrolysis · Step (ii)',
    tone: 'caution',
    title: 'H₂O hydrolysis sets 1°, 2°, or 3° alcohol degree',
    caption: 'HCHO → 1°, other RCHO → 2°, RCOR → 3° alcohol + Mg(OH)X.',
    ariaLabel: 'Step 4: Hydrolysis of magnesium alkoxide adducts with water to release Mg(OH)X and give primary alcohols from methanal, secondary alcohols from other aldehydes, and tertiary alcohols from ketones.',
  },
] as const

export function carbonylExampleSummary(smiles: string): string {
  const name = displayIupac(smiles)
  const formula = unicodeFormula(molecularFormula(parseSmiles(smiles)))
  return `${name} (${formula})`
}
