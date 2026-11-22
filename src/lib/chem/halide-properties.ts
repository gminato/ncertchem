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

/** The Table 6.3 liquids, by their condensed formula (the `ce` key of NCERT_TABLE_6_3). */
export const TABLE_6_3_LIQUIDS: readonly string[] = NCERT_TABLE_6_3.map((r) => r.ce)

/** Halogen whose colour tone a Table 6.3 liquid takes (its heavier halogen; chlorine for the chloromethanes). */
const TABLE_6_3_HALOGEN: Readonly<Record<string, Halogen>> = {
  CH3CH2CH2Cl: 'Cl',
  CH3CH2CH2Br: 'Br',
  CH3CH2CH2I: 'I',
  CH2Cl2: 'Cl',
  CHCl3: 'Cl',
  CCl4: 'Cl',
}

export type Phase = 'gas' | 'liquid'

export interface HalideProperties {
  unicode: string
  /** The halogen whose tone the drawing uses. */
  halogen: Halogen
  /** Standard boiling point, K (ALKYL_HALIDE_BOILING_POINTS_K: standard data, not printed by NCERT). Null when this lab has no value. */
  bpK: number | null
  /** Gas below the room-temperature line (298 K), liquid above it. Null when there is no boiling point. */
  phase: Phase | null
  /** The parent alkane of an R–X compound. Null for a Table 6.3 liquid. */
  parent: { unicode: string; bpK: number } | null
  /** Table 6.3 density, or null when the compound is not in the table. */
  density: { gPerMl: number; printed: string } | null
  /** Where the liquid settles in water: null when there is no density. */
  layer: 'sinks' | 'floats' | null
}

function densityOf(ce: string): HalideProperties['density'] {
  const row = NCERT_TABLE_6_3.find((r) => r.ce === ce)
  return row ? { gPerMl: row.densityGPerMl, printed: row.printed } : null
}

function layerOf(density: HalideProperties['density']): HalideProperties['layer'] {
  return density ? (density.gPerMl > WATER_DENSITY_G_PER_ML ? 'sinks' : 'floats') : null
}

/** Properties of one alkyl halide R–X for the Halide Properties Lab. Throws for an unknown pair. */
export function halideProperties(alkyl: AlkylGroup, halogen: Halogen): HalideProperties {
  const entry = ALKYL_HALIDE_BOILING_POINTS_K.find((e) => e.alkyl === alkyl && e.halogen === halogen)
  if (!entry) throw new Error(`No boiling point for ${alkyl} ${halogen}`)
  const parent = PARENT_ALKANE_BOILING_POINTS_K[alkyl]
  const density = densityOf(entry.ce)
  return {
    unicode: entry.unicode,
    halogen,
    bpK: entry.bpK,
    phase: entry.bpK < ROOM_TEMPERATURE_K ? 'gas' : 'liquid',
    parent: { unicode: parent.unicode, bpK: parent.bpK },
    density,
    layer: layerOf(density),
  }
}

/** Properties of one Table 6.3 liquid. This lab has no boiling point for these, so bpK, phase and parent are null. Throws for an unknown formula. */
export function table63Liquid(ce: string): HalideProperties {
  const row = NCERT_TABLE_6_3.find((r) => r.ce === ce)
  const halogen = TABLE_6_3_HALOGEN[ce]
  if (!row || !halogen) throw new Error(`${ce} is not a Table 6.3 liquid`)
  const density = densityOf(ce)
  return { unicode: row.unicode, halogen, bpK: null, phase: null, parent: null, density, layer: layerOf(density) }
}
