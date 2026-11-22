/**
 * Data for the three transition series that NCERT Class 12 Unit 4 only draws as figures (melting
 * points, Fig. 4.1; enthalpies of atomisation, Fig. 4.2; atomic radii, Fig. 4.3), plus two facts
 * NCERT states in running text that Section 4 needs. Added by the lead; every value names its source.
 *
 * Rules for Sections (see SCRATCH/u4/common.md, ruling R9):
 * - 3d numbers come from Table 4.2 (`NCERT_FIRST_SERIES_PROPERTIES`) wherever Table 4.2 has them.
 * - 4d/5d metallic radii come from `HEAVY_SERIES_METALLIC_RADII_PM` (12-coordinate metallic radii).
 * - 4d/5d enthalpies of atomisation are READ OFF NCERT Fig. 4.2 and are approximate (±10 kJ mol⁻¹):
 *   show them as a curve or with "≈", never as exact data.
 * - Melting points for all three series come from PubChem (`SERIES_MELTING_POINTS_K`).
 */

export type HeavySeries = '4d' | '5d'

/** Group 3 → 12 members of each series, in order. */
export const SERIES_MEMBERS = {
  '3d': ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'],
  '4d': ['Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd'],
  '5d': ['La', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg'],
} as const

/**
 * Metallic radii (12-coordinate where available), pm, for the 4d and 5d series. Source: the "Metallic"
 * column of Wikipedia, "Atomic radii of the elements (data page)", read 2026-11-22 (values as quoted
 * there from Greenwood & Earnshaw, Chemistry of the Elements). Zr 160 and Hf 159 agree with NCERT p. 94.
 * Use Table 4.2 for the 3d series (NCERT prints slightly different 3d values, e.g. Mn 137).
 */
export const HEAVY_SERIES_METALLIC_RADII_PM: Readonly<Record<HeavySeries, readonly number[]>> = {
  '4d': [180, 160, 146, 139, 136, 134, 134, 137, 144, 151],
  '5d': [187, 159, 146, 139, 137, 135, 135.5, 138.5, 144, 151],
}

/**
 * Enthalpies of atomisation, kJ mol⁻¹, read off NCERT Fig. 4.2 (p. 93) by the lead at 110 dpi and
 * rounded to the nearest 5. APPROXIMATE (±10). The 3d curve of that figure matches Table 4.2, which
 * Sections must use for 3d numbers.
 */
export const FIG_4_2_ATOMISATION_APPROX_KJ: Readonly<Record<HeavySeries, readonly number[]>> = {
  '4d': [425, 610, 720, 660, 575, 635, 550, 375, 280, 110],
  '5d': [425, 610, 780, 845, 775, 785, 670, 550, 375, 60],
}

/** Uncertainty of the values read off Fig. 4.2, kJ mol⁻¹. */
export const FIG_4_2_READING_UNCERTAINTY_KJ = 10

/**
 * Melting points, K, for groups 3–12 of the three series. Source: PubChem periodic table snapshot
 * (src/lib/chem/data/pubchem-periodic-table.json, column MeltingPoint), as used by periodic-data.ts.
 */
export const SERIES_MELTING_POINTS_K: Readonly<Record<'3d' | '4d' | '5d', readonly number[]>> = {
  '3d': [1814, 1941, 2183, 2180, 1519, 1811, 1768, 1728, 1357.77, 692.68],
  '4d': [1795, 2128, 2750, 2896, 2430, 2607, 2237, 1828.05, 1234.93, 594.22],
  '5d': [1191, 2506, 3290, 3695, 3459, 3306, 2719, 2041.55, 1337.33, 234.32],
}

/** Kelvin to degrees Celsius. */
export function kelvinToCelsius(k: number): number {
  return k - 273.15
}

/**
 * NCERT p. 96: down group 6 the highest state (+6) becomes MORE stable: Cr(VI), as dichromate in acid,
 * is a strong oxidising agent, whereas MoO₃ and WO₃ are not. NCERT gives no fuller Mo/W state lists:
 * don't invent them.
 */
export const GROUP_6_HIGHEST_STATE = [
  { symbol: 'Cr', state: 6, species: 'Cr₂O₇²⁻', strongOxidant: true },
  { symbol: 'Mo', state: 6, species: 'MoO₃', strongOxidant: false },
  { symbol: 'W', state: 6, species: 'WO₃', strongOxidant: false },
] as const

/**
 * A p-block element whose common oxidation states differ by two (NCERT p. 96 contrasts this with the
 * unit steps of transition metals). Tin: +2 and +4 (NCERT Class 11 Unit 11, group 14). Chlorine is NOT
 * used: it also shows +4 and +6 (ClO₂, Cl₂O₆).
 */
export const P_BLOCK_STEP_OF_TWO_EXAMPLE = { symbol: 'Sn', states: [2, 4] } as const

/** Notes on NCERT figures and table cells that Sections must not repeat (add to NCERT_UNIT4_ERRATA's spirit). */
export const NCERT_UNIT4_FIGURE_NOTES = [
  {
    id: 'fig-4-3-schematic',
    where: 'Fig. 4.3, p. 94',
    note: 'The radius axis is labelled "Radius/nm" with ticks 12–19; the values are in units of 10 pm (120–190 pm). The curves are schematic and do not match Table 4.2 (e.g. Mn). Do not read numbers off it.',
  },
  {
    id: 'table-4-2-sc-ti-density',
    where: 'Table 4.2, p. 94, density row',
    note: 'NCERT prints Sc 3.43 and Ti 4.1 g cm⁻³; PubChem gives 2.99 and 4.5. Quote densities only from V to Zn, or describe the Ti → Cu rise qualitatively.',
  },
] as const
