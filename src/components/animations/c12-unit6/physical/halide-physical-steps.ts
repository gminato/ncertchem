import {
  ALKYL_HALIDE_BOILING_POINTS_K,
  NCERT_BROMOBUTANE_ISOMER_BP_K,
  NCERT_DICHLOROBENZENE_K,
  NCERT_TABLE_6_3,
  PARENT_ALKANE_BOILING_POINTS_K,
  ROOM_TEMPERATURE_K,
  WATER_DENSITY_G_PER_ML,
  type AlkylGroup,
  type Halogen,
} from '@/lib/chem/ncert-c12-unit6-data'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** Number of Steps in the halide-physical Scrolly (P6 Prose). */
export const HALIDE_STEP_COUNT = 5

/** Top of the boiling-point axis (K). Every b.p. bar in the Section uses this scale. */
export const BP_AXIS_MAX_K = 400

/** Gases are the halides and parents that boil below room temperature (298 K). */
export const GAS_BELOW_K = ROOM_TEMPERATURE_K

export const ALKYL_ORDER: readonly AlkylGroup[] = ['methyl', 'ethyl', 'n-propyl']
export const HALOGEN_ORDER: readonly Halogen[] = ['F', 'Cl', 'Br', 'I']

/** Family formula shown under each group of bars (X = halogen). */
export const FAMILY_LABEL: Readonly<Record<AlkylGroup, string>> = {
  methyl: 'CH₃X',
  ethyl: 'CH₃CH₂X',
  'n-propyl': 'CH₃CH₂CH₂X',
}

export interface AlkylBpGroup {
  alkyl: AlkylGroup
  parent: { unicode: string; bpK: number }
  halides: Array<{ halogen: Halogen; unicode: string; bpK: number }>
}

/** Step 1 data: for each alkyl group, the parent alkane and the four halides (standard data). */
export function alkylBpGroups(): AlkylBpGroup[] {
  return ALKYL_ORDER.map((alkyl) => ({
    alkyl,
    parent: PARENT_ALKANE_BOILING_POINTS_K[alkyl],
    halides: HALOGEN_ORDER.map((halogen) => {
      const row = ALKYL_HALIDE_BOILING_POINTS_K.find((r) => r.alkyl === alkyl && r.halogen === halogen)
      if (!row) throw new Error(`No boiling point for ${alkyl} ${halogen}`)
      return { halogen, unicode: row.unicode, bpK: row.bpK }
    }),
  }))
}

/** True when a boiling point puts the substance in the gas bar style (gas at 298 K). */
export function isGasAtRoomTemperature(bpK: number): boolean {
  return bpK < GAS_BELOW_K
}

/** Step 2 data: the three C₄H₉Br isomers, NCERT's printed boiling points, with their graphs. */
export const BROMOBUTANES: ReadonlyArray<{
  name: string
  unicode: string
  smiles: string
  bpK: number
  graph: MolGraph
}> = NCERT_BROMOBUTANE_ISOMER_BP_K.map((row) => ({ ...row, graph: parseSmiles(row.smiles) }))

/** Step 3 data: the dichlorobenzenes, NCERT's printed b.p. and m.p. */
export const DICHLOROBENZENES: ReadonlyArray<{
  isomer: string
  name: string
  smiles: string
  bpK: number
  mpK: number
  graph: MolGraph
}> = NCERT_DICHLOROBENZENE_K.map((row) => ({ ...row, graph: parseSmiles(row.smiles) }))

/** Step 4 data: the Table 6.3 liquids, each with a flag for whether it floats on water. */
export const LAYERING_LIQUIDS = NCERT_TABLE_6_3.map((row) => ({
  ...row,
  floats: row.densityGPerMl < WATER_DENSITY_G_PER_ML,
}))

/** Step 5 drawings: one haloalkane placed in water and in an organic solvent. */
export const SOLVENT_HALOALKANE = { smiles: 'CCCBr', graph: parseSmiles('CCCBr') }
