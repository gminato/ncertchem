/**
 * Step metadata and NCERT-verified solubility data for `alcohol-water-solubility`.
 */

import { getSolubilityCompound } from '@/lib/chem/c12-u7-s6-physical'

export const ALCOHOL_SOLUBILITY_STEP_COUNT = 3

export const ALCOHOL_SOLUBILITY_STEP_TITLES: readonly string[] = [
  'Propan-1-ol forms three hydrogen bonds with surrounding water molecules',
  'Methanol and ethanol mix with water in all proportions',
  'Larger butyl chains and phenyl rings exclude water and reduce solubility',
]

export const SOLUBILITY_STEP_COMPOUNDS = [
  getSolubilityCompound('propan-1-ol'),
  getSolubilityCompound('methanol'),
  getSolubilityCompound('ethanol'),
  getSolubilityCompound('butan-1-ol'),
  getSolubilityCompound('phenol'),
] as const
