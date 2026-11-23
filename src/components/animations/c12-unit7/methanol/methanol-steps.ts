/**
 * Data and step definitions for the `methanol-syngas-route` Scrolly animation
 * (Class 12 Unit 7, Section 7.5: Methanol).
 */

import { COMMERCIAL_BPS, METHANOL_WINDOW } from '@/lib/chem/c12-u7-s10-alcohols'
import { parseSmiles } from '@/lib/chem/molecule-parse'

export const METHANOL_STEP_COUNT = 4

export const METHANOL_SMILES = {
  methanol: 'CO',
  formaldehyde: 'C=O',
  formicAcid: 'O=CO',
  ethanol: 'CCO',
} as const

export const METHANOL_STEP_LABELS: readonly string[] = [
  'Historical destructive distillation of wood replaced by modern CO plus 2 H2 synthesis gas feed.',
  'Catalytic hydrogenation of CO and 2 H2 over a ZnO-Cr2O3 bed at 200 to 300 atm and 573 to 673 K yields CH3OH.',
  'Methanol boils at 337 K below ethanol at 351 K, and body oxidation to HCHO and HCOOH causes blindness or death.',
  'Colourless methanol liquid splits into paint and varnish solvent use and its chief role making formaldehyde.',
]

export const METHANOL_STEP_TITLES: readonly string[] = [
  'Wood spirit to synthesis gas',
  'Hydrogenation over ZnO-Cr₂O₃',
  'Boiling point and toxicity',
  'Industrial destinations',
]

export const METHANOL_CONDITIONS = {
  catalyst: 'ZnO-Cr₂O₃',
  pressureLabel: `${METHANOL_WINDOW.optimalPressureMinAtm}-${METHANOL_WINDOW.optimalPressureMaxAtm} atm`,
  temperatureLabel: `${METHANOL_WINDOW.optimalTemperatureMinK}-${METHANOL_WINDOW.optimalTemperatureMaxK} K`,
  methanolBpK: COMMERCIAL_BPS.methanolK,
  ethanolBpK: COMMERCIAL_BPS.ethanolK,
  deltaBpK: COMMERCIAL_BPS.deltaK,
} as const

export function validateMethanolStepMolecules() {
  return Object.entries(METHANOL_SMILES).map(([key, smiles]) => ({
    key,
    smiles,
    graph: parseSmiles(smiles),
  }))
}
