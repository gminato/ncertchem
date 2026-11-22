import {
  ALKYL_HALIDE_BOILING_POINTS_K,
  HALOGENS,
  NCERT_TABLE_6_3,
  PARENT_ALKANE_BOILING_POINTS_K,
  ROOM_TEMPERATURE_K,
  WATER_DENSITY_G_PER_ML,
  type AlkylGroup,
  type Halogen,
} from './ncert-c12-unit6-data'

export const ALKYL_GROUPS: readonly AlkylGroup[] = ['methyl', 'ethyl', 'n-propyl']
export const HALIDE_HALOGENS: readonly Halogen[] = HALOGENS

export type Phase = 'gas' | 'liquid'

export interface HalideProperties {
  alkyl: AlkylGroup
  halogen: Halogen
  unicode: string
  /** Standard boiling point, K (ALKYL_HALIDE_BOILING_POINTS_K: standard data, not printed by NCERT). */
  bpK: number
  /** Gas below the room-temperature line (298 K), liquid above it. */
  phase: Phase
  parent: { unicode: string; bpK: number }
  /** Table 6.3 density, or null when the compound is not in the table. */
  density: { gPerMl: number; printed: string } | null
  /** Where the liquid settles in water: null when there is no density. */
  layer: 'sinks' | 'floats' | null
}

/** Properties of one alkyl halide R–X for the Halide Properties Lab. Throws for an unknown pair. */
export function halideProperties(alkyl: AlkylGroup, halogen: Halogen): HalideProperties {
  const entry = ALKYL_HALIDE_BOILING_POINTS_K.find((e) => e.alkyl === alkyl && e.halogen === halogen)
  if (!entry) throw new Error(`No boiling point for ${alkyl} ${halogen}`)
  const parent = PARENT_ALKANE_BOILING_POINTS_K[alkyl]
  const row = NCERT_TABLE_6_3.find((r) => r.ce === entry.ce)
  const density = row ? { gPerMl: row.densityGPerMl, printed: row.printed } : null
  return {
    alkyl,
    halogen,
    unicode: entry.unicode,
    bpK: entry.bpK,
    phase: entry.bpK < ROOM_TEMPERATURE_K ? 'gas' : 'liquid',
    parent: { unicode: parent.unicode, bpK: parent.bpK },
    density,
    layer: density ? (density.gPerMl > WATER_DENSITY_G_PER_ML ? 'sinks' : 'floats') : null,
  }
}
