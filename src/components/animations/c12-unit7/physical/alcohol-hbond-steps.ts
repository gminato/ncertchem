/**
 * Step metadata and NCERT-verified data for the `alcohol-hbond-boiling` Scrolly animation.
 */

import {
  BOILING_COMPARISON_SETS,
  BP_GAP_ETHANOL_METHOXYMETHANE_K,
  ROOM_TEMP_K,
  getBoilingSet,
} from '@/lib/chem/c12-u7-s6-physical'

export const ALCOHOL_HBOND_STEP_COUNT = 4

export const ALCOHOL_HBOND_STEP_TITLES: readonly string[] = [
  'Intermolecular O-H···O hydrogen bonding in alcohols and phenols',
  'Comparable mass (44-46 u): ethanol boils 103 K above methoxymethane',
  'Increasing carbon chain length raises boiling point from 337 K to 390 K',
  'Chain branching in C₄H₁₀O shrinks surface contact and lowers boiling point',
]

export const COMPARABLE_MASS_BARS = getBoilingSet('comparable-mass').compounds
export const CHAIN_LENGTH_BARS = getBoilingSet('chain-length').compounds
export const BRANCHING_ISOMERS = getBoilingSet('branching').compounds
export const HBOND_ROOM_TEMP_K = ROOM_TEMP_K
export const HBOND_ETHANOL_ETHER_GAP_K = BP_GAP_ETHANOL_METHOXYMETHANE_K
export const HBOND_SETS_COUNT = BOILING_COMPARISON_SETS.length
