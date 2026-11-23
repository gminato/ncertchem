/**
 * Class 12 Unit 7, Section 7.4.3: Physical Properties of Alcohols and Phenols.
 *
 * Pure data models, phase rules and accessible summaries built on the shared Unit 7 NCERT
 * dataset (`ncert-c12-unit7-data.ts`). Unprinted boiling points are never invented.
 */

import {
  NCERT_7_4_3_BOILING_COMPARISON,
  NCERT_7_6_2_BOILING_COMPARISON,
  NCERT_7_6_2_WATER_MISCIBILITY,
  NCERT_COMMERCIAL_ALCOHOL_BP_K,
  NCERT_PHENOL_NAMES,
  NCERT_TABLE_7_1,
} from './ncert-c12-unit7-data'
import { parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

export const ROOM_TEMP_K = 298
export const BP_TEMP_MIN_K = 200
export const BP_TEMP_MAX_K = 420

export type SimMode = 'boiling' | 'solubility'
export type BoilingSetId = 'comparable-mass' | 'chain-length' | 'branching'
export type IntermolecularForceKind = 'h-bond' | 'dipole' | 'dispersion'
export type ShapeKind =
  | 'linear-short'
  | 'bent-ether'
  | 'alkane-short'
  | 'linear-long'
  | 'branched-secondary'
  | 'compact-tertiary'

export interface BoilingCompound {
  id: string
  name: string
  formula: string
  smiles: string
  graph: MolGraph
  compoundClass: 'alcohol' | 'ether' | 'alkane'
  molecularMassU: number | null
  molecularMassLabel: string
  bpK: number | null
  bpLabel: string
  forceKind: IntermolecularForceKind
  forcesSummary: string
  shapeKind: ShapeKind
  surfaceContactRating: 1 | 2 | 3
  surfaceContactLabel: string
  rankInSet: 1 | 2 | 3
  note: string
}

export interface BoilingComparisonSet {
  id: BoilingSetId
  label: string
  subtitle: string
  compounds: readonly BoilingCompound[]
}

function mustFind<T>(items: readonly T[], predicate: (item: T) => boolean, label: string): T {
  const found = items.find(predicate)
  if (!found) throw new Error(`Missing NCERT dataset entry: ${label}`)
  return found
}

const propaneEntry = mustFind(NCERT_7_4_3_BOILING_COMPARISON, (c) => c.name === 'Propane', 'Propane')
const methoxymethaneEntry = mustFind(NCERT_7_4_3_BOILING_COMPARISON, (c) => c.name === 'Methoxymethane', 'Methoxymethane')
const ethanolEntry = mustFind(NCERT_7_4_3_BOILING_COMPARISON, (c) => c.name === 'Ethanol', 'Ethanol')
const butan1OlBpEntry = mustFind(NCERT_7_6_2_BOILING_COMPARISON, (c) => c.name === 'Butan-1-ol', 'Butan-1-ol BP')
const butan1OlName = mustFind(NCERT_TABLE_7_1, (c) => c.iupac === 'Butan-1-ol', 'Butan-1-ol name')
const butan2OlName = mustFind(NCERT_TABLE_7_1, (c) => c.iupac === 'Butan-2-ol', 'Butan-2-ol name')
const tertButanolName = mustFind(NCERT_TABLE_7_1, (c) => c.iupac === '2-Methylpropan-2-ol', '2-Methylpropan-2-ol name')
const propan1OlName = mustFind(NCERT_TABLE_7_1, (c) => c.iupac === 'Propan-1-ol', 'Propan-1-ol name')
const methanolName = mustFind(NCERT_TABLE_7_1, (c) => c.iupac === 'Methanol', 'Methanol name')
const phenolName = mustFind(NCERT_PHENOL_NAMES, (c) => c.iupac === 'Phenol', 'Phenol name')
const butan1OlMisc = mustFind(NCERT_7_6_2_WATER_MISCIBILITY, (c) => c.name === 'Butan-1-ol', 'Butan-1-ol miscibility')
const nPentaneMisc = mustFind(NCERT_7_6_2_WATER_MISCIBILITY, (c) => c.name === 'n-Pentane', 'n-Pentane miscibility')

export const BP_GAP_ETHANOL_METHOXYMETHANE_K = ethanolEntry.bpK - methoxymethaneEntry.bpK
export const BP_GAP_ETHANOL_PROPANE_K = ethanolEntry.bpK - propaneEntry.bpK
export const BP_GAP_METHANOL_METHOXYMETHANE_K =
  NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol - methoxymethaneEntry.bpK

const PROPANE_COMPOUND: BoilingCompound = {
  id: 'propane',
  name: propaneEntry.name,
  formula: propaneEntry.unicode,
  smiles: propaneEntry.smiles,
  graph: parseSmiles(propaneEntry.smiles),
  compoundClass: 'alkane',
  molecularMassU: propaneEntry.molecularMass,
  molecularMassLabel: `${propaneEntry.molecularMass} u`,
  bpK: propaneEntry.bpK,
  bpLabel: `${propaneEntry.bpK} K`,
  forceKind: 'dispersion',
  forcesSummary: 'Weak van der Waals dispersion only',
  shapeKind: 'alkane-short',
  surfaceContactRating: 2,
  surfaceContactLabel: 'Nonpolar 3-carbon chain',
  rankInSet: 1,
  note: 'No polar O-H or C-O bond; boils far below 298 K.',
}

const METHOXYMETHANE_COMPOUND: BoilingCompound = {
  id: 'methoxymethane',
  name: methoxymethaneEntry.name,
  formula: methoxymethaneEntry.unicode,
  smiles: methoxymethaneEntry.smiles,
  graph: parseSmiles(methoxymethaneEntry.smiles),
  compoundClass: 'ether',
  molecularMassU: methoxymethaneEntry.molecularMass,
  molecularMassLabel: `${methoxymethaneEntry.molecularMass} u`,
  bpK: methoxymethaneEntry.bpK,
  bpLabel: `${methoxymethaneEntry.bpK} K`,
  forceKind: 'dipole',
  forcesSummary: 'C-O dipole-dipole + dispersion (no O-H donor)',
  shapeKind: 'bent-ether',
  surfaceContactRating: 2,
  surfaceContactLabel: 'Polar C-O-C ether without O-H donor',
  rankInSet: 2,
  note: 'Same 46 u mass as ethanol, yet boils 103 K lower because ether molecules cannot donate O-H···O H-bonds.',
}

const ETHANOL_COMPOUND: BoilingCompound = {
  id: 'ethanol',
  name: ethanolEntry.name,
  formula: ethanolEntry.unicode,
  smiles: ethanolEntry.smiles,
  graph: parseSmiles(ethanolEntry.smiles),
  compoundClass: 'alcohol',
  molecularMassU: ethanolEntry.molecularMass,
  molecularMassLabel: `${ethanolEntry.molecularMass} u`,
  bpK: ethanolEntry.bpK,
  bpLabel: `${ethanolEntry.bpK} K`,
  forceKind: 'h-bond',
  forcesSummary: 'Intermolecular O-H···O H-bonds + dispersion',
  shapeKind: 'linear-short',
  surfaceContactRating: 2,
  surfaceContactLabel: '2-carbon chain + polar -OH bridge',
  rankInSet: 3,
  note: 'Intermolecular O-H···O hydrogen bonds keep ethanol liquid at 298 K until 351 K.',
}

const METHANOL_COMPOUND: BoilingCompound = {
  id: 'methanol',
  name: methanolName.iupac,
  formula: methanolName.unicode,
  smiles: methanolName.smiles,
  graph: parseSmiles(methanolName.smiles),
  compoundClass: 'alcohol',
  molecularMassU: null,
  molecularMassLabel: 'Not tabulated in 7.4.3',
  bpK: NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol,
  bpLabel: `${NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol} K`,
  forceKind: 'h-bond',
  forcesSummary: 'Intermolecular O-H···O H-bonds + 1-C dispersion',
  shapeKind: 'linear-short',
  surfaceContactRating: 1,
  surfaceContactLabel: 'Shortest alkyl tail (1 carbon)',
  rankInSet: 1,
  note: 'Smallest alkyl chain gives minimal van der Waals contact alongside O-H···O hydrogen bonding.',
}

const BUTAN_1_OL_CHAIN: BoilingCompound = {
  id: 'butan-1-ol',
  name: butan1OlBpEntry.name,
  formula: butan1OlName.unicode,
  smiles: butan1OlName.smiles,
  graph: parseSmiles(butan1OlName.smiles),
  compoundClass: 'alcohol',
  molecularMassU: null,
  molecularMassLabel: 'Not tabulated in 7.4.3',
  bpK: butan1OlBpEntry.bpK,
  bpLabel: `${butan1OlBpEntry.bpK} K`,
  forceKind: 'h-bond',
  forcesSummary: 'Intermolecular O-H···O H-bonds + strong 4-C dispersion',
  shapeKind: 'linear-long',
  surfaceContactRating: 3,
  surfaceContactLabel: 'Extended 4-carbon chain (high surface area)',
  rankInSet: 3,
  note: 'Four-carbon chain adds substantial van der Waals contact on top of O-H···O H-bonding.',
}

const BUTAN_2_OL_BRANCH: BoilingCompound = {
  id: 'butan-2-ol',
  name: butan2OlName.iupac,
  formula: butan2OlName.unicode,
  smiles: butan2OlName.smiles,
  graph: parseSmiles(butan2OlName.smiles),
  compoundClass: 'alcohol',
  molecularMassU: null,
  molecularMassLabel: 'C₄H₁₀O isomer',
  bpK: null,
  bpLabel: 'Qualitative trend (< 390 K)',
  forceKind: 'h-bond',
  forcesSummary: 'O-H···O H-bonds + moderate branched dispersion',
  shapeKind: 'branched-secondary',
  surfaceContactRating: 2,
  surfaceContactLabel: 'Moderate contact area (2° branched chain)',
  rankInSet: 2,
  note: 'Branching at C-2 trims surface area compared with straight-chain butan-1-ol.',
}

const TERT_BUTANOL_BRANCH: BoilingCompound = {
  id: '2-methylpropan-2-ol',
  name: tertButanolName.iupac,
  formula: tertButanolName.unicode,
  smiles: tertButanolName.smiles,
  graph: parseSmiles(tertButanolName.smiles),
  compoundClass: 'alcohol',
  molecularMassU: null,
  molecularMassLabel: 'C₄H₁₀O isomer',
  bpK: null,
  bpLabel: 'Qualitative trend (lowest of C₄ isomers)',
  forceKind: 'h-bond',
  forcesSummary: 'O-H···O H-bonds + weakest compact dispersion',
  shapeKind: 'compact-tertiary',
  surfaceContactRating: 1,
  surfaceContactLabel: 'Smallest contact area (compact 3° sphere)',
  rankInSet: 1,
  note: 'Compact spherical skeleton leaves the least surface-to-surface contact and the lowest boiling point among the three isomers.',
}

export const BOILING_COMPARISON_SETS: readonly BoilingComparisonSet[] = [
  {
    id: 'comparable-mass',
    label: 'Comparable Mass (44-46 u)',
    subtitle: 'Same mass class, dramatic jump from intermolecular O-H···O H-bonding',
    compounds: [PROPANE_COMPOUND, METHOXYMETHANE_COMPOUND, ETHANOL_COMPOUND],
  },
  {
    id: 'chain-length',
    label: 'Chain Length',
    subtitle: 'Adding -CH₂- units strengthens van der Waals dispersion forces',
    compounds: [
      METHANOL_COMPOUND,
      { ...ETHANOL_COMPOUND, rankInSet: 2 },
      BUTAN_1_OL_CHAIN,
    ],
  },
  {
    id: 'branching',
    label: 'Branching (C₄ Isomers)',
    subtitle: 'Compact branching shrinks molecular surface area and weakens dispersion',
    compounds: [BUTAN_1_OL_CHAIN, BUTAN_2_OL_BRANCH, TERT_BUTANOL_BRANCH],
  },
] as const

export interface PhaseResult {
  state: 'liquid' | 'gas' | 'transition'
  label: string
  isVapour: boolean
}

export function phaseAtTemperature(compound: BoilingCompound, temperatureK: number): PhaseResult {
  if (compound.bpK !== null) {
    if (temperatureK >= compound.bpK) {
      return {
        state: 'gas',
        label: `Gas (vapour) at ${temperatureK} K (≥ ${compound.bpK} K)`,
        isVapour: true,
      }
    }
    return {
      state: 'liquid',
      label: `Liquid at ${temperatureK} K (< ${compound.bpK} K)`,
      isVapour: false,
    }
  }

  if (temperatureK <= ROOM_TEMP_K) {
    return {
      state: 'liquid',
      label: `Liquid at ${temperatureK} K (exact b.p. unprinted, < 390 K)`,
      isVapour: false,
    }
  }
  if (temperatureK < butan1OlBpEntry.bpK) {
    return {
      state: 'transition',
      label: `Below 390 K upper bound at ${temperatureK} K (exact b.p. unprinted)`,
      isVapour: false,
    }
  }
  return {
    state: 'gas',
    label: `Gas (vapour) at ${temperatureK} K (≥ 390 K upper bound)`,
    isVapour: true,
  }
}

export interface SolubilityCompound {
  id: string
  name: string
  formula: string
  smiles: string
  graph: MolGraph
  kind: 'alcohol' | 'phenol' | 'alkane'
  carbonCount: number
  hBondsWithWater: number
  hydrophilicScore: number
  hydrophobicScore: number
  statusLabel: string
  quantitativeTag: string
  forcesSummary: string
  note: string
}

export const SOLUBILITY_COMPOUNDS: readonly SolubilityCompound[] = [
  {
    id: 'methanol',
    name: methanolName.iupac,
    formula: methanolName.unicode,
    smiles: methanolName.smiles,
    graph: parseSmiles(methanolName.smiles),
    kind: 'alcohol',
    carbonCount: 1,
    hBondsWithWater: 3,
    hydrophilicScore: 95,
    hydrophobicScore: 15,
    statusLabel: 'Miscible in all proportions',
    quantitativeTag: '100% miscible',
    forcesSummary: '3 O-H···O bridges to H₂O + tiny 1-C tail',
    note: 'Single methyl group causes negligible disruption to water’s hydrogen-bonded network.',
  },
  {
    id: 'ethanol',
    name: ethanolEntry.name,
    formula: ethanolEntry.unicode,
    smiles: ethanolEntry.smiles,
    graph: parseSmiles(ethanolEntry.smiles),
    kind: 'alcohol',
    carbonCount: 2,
    hBondsWithWater: 3,
    hydrophilicScore: 90,
    hydrophobicScore: 28,
    statusLabel: 'Miscible in all proportions',
    quantitativeTag: '100% miscible',
    forcesSummary: '3 O-H···O bridges to H₂O + small 2-C tail',
    note: 'Hydrophilic -OH hydration easily dominates the two-carbon ethyl group.',
  },
  {
    id: 'propan-1-ol',
    name: propan1OlName.iupac,
    formula: propan1OlName.unicode,
    smiles: propan1OlName.smiles,
    graph: parseSmiles(propan1OlName.smiles),
    kind: 'alcohol',
    carbonCount: 3,
    hBondsWithWater: 3,
    hydrophilicScore: 82,
    hydrophobicScore: 45,
    statusLabel: 'Miscible (larger propyl tail)',
    quantitativeTag: 'Miscible',
    forcesSummary: '3 O-H···O bridges to H₂O + 3-C hydrophobic tail',
    note: 'Polar -OH accepts two water protons via its lone pairs and donates its own H to water.',
  },
  {
    id: 'butan-1-ol',
    name: butan1OlMisc.name,
    formula: butan1OlName.unicode,
    smiles: butan1OlName.smiles,
    graph: parseSmiles(butan1OlName.smiles),
    kind: 'alcohol',
    carbonCount: 4,
    hBondsWithWater: 3,
    hydrophilicScore: 55,
    hydrophobicScore: 76,
    statusLabel: butan1OlMisc.printed,
    quantitativeTag: `${butan1OlMisc.gPer100MlWater} g / 100 mL`,
    forcesSummary: 'O-H···O bridges opposed by bulky 4-C exclusion zone',
    note: 'At four carbons, hydrophobic disruption limits solubility to 9 g per 100 mL of water.',
  },
  {
    id: 'phenol',
    name: phenolName.iupac,
    formula: phenolName.unicode,
    smiles: phenolName.smiles,
    graph: parseSmiles(phenolName.smiles),
    kind: 'phenol',
    carbonCount: 6,
    hBondsWithWater: 3,
    hydrophilicScore: 52,
    hydrophobicScore: 84,
    statusLabel: 'Limited solubility',
    quantitativeTag: 'Limited',
    forcesSummary: 'O-H···O bridges opposed by 6-C hydrophobic phenyl ring',
    note: 'The large planar benzene ring pushes surrounding H₂O molecules apart, lowering solubility.',
  },
  {
    id: 'n-pentane',
    name: nPentaneMisc.name,
    formula: nPentaneMisc.unicode,
    smiles: nPentaneMisc.smiles,
    graph: parseSmiles(nPentaneMisc.smiles),
    kind: 'alkane',
    carbonCount: 5,
    hBondsWithWater: 0,
    hydrophilicScore: 0,
    hydrophobicScore: 98,
    statusLabel: nPentaneMisc.printed,
    quantitativeTag: 'Immiscible',
    forcesSummary: 'Dispersion only (zero H-bonds with H₂O)',
    note: 'Lacks any polar -OH group, so water prefers its own H-bonded network and excludes n-pentane.',
  },
] as const

export function getBoilingSet(id: BoilingSetId): BoilingComparisonSet {
  return BOILING_COMPARISON_SETS.find((s) => s.id === id) ?? BOILING_COMPARISON_SETS[0]
}

export function getBoilingCompound(setId: BoilingSetId, compoundId: string): BoilingCompound {
  const set = getBoilingSet(setId)
  return set.compounds.find((c) => c.id === compoundId) ?? set.compounds[set.compounds.length - 1]
}

export function getSolubilityCompound(id: string): SolubilityCompound {
  return SOLUBILITY_COMPOUNDS.find((c) => c.id === id) ?? SOLUBILITY_COMPOUNDS[0]
}

export function boilingSummary(
  set: BoilingComparisonSet,
  compound: BoilingCompound,
  temperatureK: number
): string {
  const phase = phaseAtTemperature(compound, temperatureK)
  return `${set.label}: ${compound.name} (${compound.formula}), boiling point ${compound.bpLabel}. ${phase.label}. Dominant forces: ${compound.forcesSummary}.`
}

export function solubilitySummary(compound: SolubilityCompound): string {
  return `Water solubility: ${compound.name} (${compound.formula}), ${compound.statusLabel}. ${compound.forcesSummary}.`
}
