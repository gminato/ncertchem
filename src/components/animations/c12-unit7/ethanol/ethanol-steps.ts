/**
 * Data and step definitions for the `ethanol-fermentation-pathway` Scrolly animation
 * (Class 12 Unit 7, Section 7.5: Ethanol).
 */

import { COMMERCIAL_BPS, FERMENTATION_LIMITS } from '@/lib/chem/c12-u7-s10-alcohols'
import { parseSmiles } from '@/lib/chem/molecule-parse'

export const ETHANOL_STEP_COUNT = 5

export const ETHANOL_SMILES = {
  ethanol: 'CCO',
  ethanoicAcid: 'CC(=O)O',
  ethene: 'C=C',
  pyridine: 'C1=CC=NC=C1',
} as const

export const ETHANOL_STEP_LABELS: readonly string[] = [
  'Invertase hydrolyses sucrose and water into glucose and fructose.',
  'Under anaerobic conditions, zymase converts hexoses into ethanol and rising carbon dioxide bubbles.',
  'Once ethanol concentration reaches 14 percent, zymase is inhibited and fermentation stops.',
  'If air leaks into the vat, oxygen oxidises ethanol to ethanoic acid and spoils the taste.',
  'Industrial ethanol from fermentation or ethene hydration is denatured with copper sulphate and pyridine.',
]

export const ETHANOL_STEP_TITLES: readonly string[] = [
  'Invertase hydrolyses sucrose',
  'Zymase ferments without air',
  'The 14 percent inhibition limit',
  'Air leak oxidises ethanol to acid',
  'Production routes and denaturation',
]

export const ETHANOL_FACTS = {
  inhibitionPercent: FERMENTATION_LIMITS.zymaseInhibitionPercent,
  ethanolBpK: COMMERCIAL_BPS.ethanolK,
  denaturants: ['Copper sulphate (blue colour)', 'Pyridine (foul odour)'] as const,
} as const

export function validateEthanolStepMolecules() {
  return Object.entries(ETHANOL_SMILES).map(([key, smiles]) => ({
    key,
    smiles,
    graph: parseSmiles(smiles),
  }))
}
