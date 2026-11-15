/**
 * Values printed in NCERT Class 11 Part I, Unit 5 (Thermodynamics), 2026-27 reprint. Each table
 * is transcribed as printed. Prose and Problem values carry a line number in the plain
 * pdftotext rendering of the unit (kech105.txt, `pdftotext` without `-layout`), so a reviewer
 * can check them. Table values were read from the page images (book pages 147, 149, 154), because
 * the text layer drops the numbers.
 *
 * Units: enthalpies in kJ mol⁻¹ unless the field name says otherwise; entropies in J K⁻¹ mol⁻¹.
 * Where NCERT disagrees with itself, or with Unit 4, the printed value is kept here and the
 * disagreement is recorded in NCERT_UNIT5_PRINTED_CHECKS below. Values are not corrected in place.
 */

import type { NcertTable } from './ncert-unit4-tables'

/** One row of Table 5.1 (standard enthalpies of fusion and vaporisation). */
export interface FusionVaporisationRow {
  substance: string
  /** Melting point, K. */
  meltingPointK: number
  /** Standard enthalpy of fusion, kJ mol⁻¹. */
  fusionKJ: number
  /** Boiling point, K. */
  boilingPointK: number
  /** Standard enthalpy of vaporisation, kJ mol⁻¹. */
  vaporisationKJ: number
}

/**
 * NCERT Table 5.1, Standard Enthalpy Changes of Fusion and Vaporisation (book p. 147; text line
 * 1140). The NaCl and C6H6 rows are printed as shown.
 */
export const NCERT_TABLE_5_1_FUSION_VAPORISATION: NcertTable<FusionVaporisationRow> = {
  source: 'NCERT Class 11 Part I, Unit 5, Table 5.1 (Standard Enthalpy Changes of Fusion and Vaporisation), book p. 147, text line 1140',
  rows: [
    { substance: 'N2', meltingPointK: 63.15, fusionKJ: 0.72, boilingPointK: 77.35, vaporisationKJ: 5.59 },
    { substance: 'NH3', meltingPointK: 195.4, fusionKJ: 5.65, boilingPointK: 239.73, vaporisationKJ: 23.35 },
    { substance: 'HCl', meltingPointK: 159.0, fusionKJ: 1.992, boilingPointK: 188.0, vaporisationKJ: 16.15 },
    { substance: 'CO', meltingPointK: 68.0, fusionKJ: 6.836, boilingPointK: 82.0, vaporisationKJ: 6.04 },
    { substance: 'CH3COCH3', meltingPointK: 177.8, fusionKJ: 5.72, boilingPointK: 329.4, vaporisationKJ: 29.1 },
    { substance: 'CCl4', meltingPointK: 250.16, fusionKJ: 2.5, boilingPointK: 349.69, vaporisationKJ: 30.0 },
    { substance: 'H2O', meltingPointK: 273.15, fusionKJ: 6.01, boilingPointK: 373.15, vaporisationKJ: 40.79 },
    { substance: 'NaCl', meltingPointK: 1081.0, fusionKJ: 28.8, boilingPointK: 1665.0, vaporisationKJ: 170.0 },
    { substance: 'C6H6', meltingPointK: 278.65, fusionKJ: 9.83, boilingPointK: 353.25, vaporisationKJ: 30.8 },
  ],
}

/**
 * One row of Table 5.2 (standard molar enthalpies of formation at 298 K). `species` is the
 * printed label with the state in brackets, ASCII digits, e.g. 'CH4(g)', 'C(graphite)'.
 */
export interface FormationRow {
  species: string
  /** Standard molar enthalpy of formation, kJ mol⁻¹. */
  formationKJ: number
}

/**
 * NCERT Table 5.2, Standard Molar Enthalpies of Formation at 298 K of a Few Selected Substances
 * (book p. 149; text line 1260). Both printed columns are kept in one list, in printed order
 * (left column first). Values are from the page image, checked against the printed text values
 * for H2O(l), CH4(g), C2H5OH(l), CaO(s), CaCO3(s), Fe2O3(s), HBr(g) and CO2(g).
 */
export const NCERT_TABLE_5_2_FORMATION: NcertTable<FormationRow> = {
  source: 'NCERT Class 11 Part I, Unit 5, Table 5.2 (Standard Molar Enthalpies of Formation at 298 K), book p. 149, text line 1260',
  rows: [
    { species: 'Al2O3(s)', formationKJ: -1675.7 },
    { species: 'BaCO3(s)', formationKJ: -1216.3 },
    { species: 'Br2(l)', formationKJ: 0 },
    { species: 'Br2(g)', formationKJ: 30.91 },
    { species: 'CaCO3(s)', formationKJ: -1206.92 },
    { species: 'C(diamond)', formationKJ: 1.89 },
    { species: 'C(graphite)', formationKJ: 0 },
    { species: 'CaO(s)', formationKJ: -635.09 },
    { species: 'CH4(g)', formationKJ: -74.81 },
    { species: 'C2H4(g)', formationKJ: 52.26 },
    { species: 'CH3OH(l)', formationKJ: -238.86 },
    { species: 'C2H5OH(l)', formationKJ: -277.69 },
    { species: 'C6H6(l)', formationKJ: 49.0 },
    { species: 'CO(g)', formationKJ: -110.53 },
    { species: 'CO2(g)', formationKJ: -393.51 },
    { species: 'C2H6(g)', formationKJ: -84.68 },
    { species: 'Cl2(g)', formationKJ: 0 },
    { species: 'C3H8(g)', formationKJ: -103.85 },
    { species: 'n-C4H10(g)', formationKJ: -126.15 },
    { species: 'HgS(s, red)', formationKJ: -58.2 },
    { species: 'H2(g)', formationKJ: 0 },
    { species: 'H2O(g)', formationKJ: -241.82 },
    { species: 'H2O(l)', formationKJ: -285.83 },
    { species: 'HF(g)', formationKJ: -271.1 },
    { species: 'HCl(g)', formationKJ: -92.31 },
    { species: 'HBr(g)', formationKJ: -36.4 },
    { species: 'HI(g)', formationKJ: 26.48 },
    { species: 'KCl(s)', formationKJ: -436.75 },
    { species: 'KBr(s)', formationKJ: -393.8 },
    { species: 'MgO(s)', formationKJ: -601.7 },
    { species: 'Mg(OH)2(s)', formationKJ: -924.54 },
    { species: 'NaF(s)', formationKJ: -573.65 },
    { species: 'NaCl(s)', formationKJ: -411.15 },
    { species: 'NaBr(s)', formationKJ: -361.06 },
    { species: 'NaI(s)', formationKJ: -287.78 },
    { species: 'NH3(g)', formationKJ: -46.11 },
    { species: 'NO(g)', formationKJ: 90.25 },
    { species: 'NO2(g)', formationKJ: 33.18 },
    { species: 'PCl3(l)', formationKJ: -319.7 },
    { species: 'PCl5(s)', formationKJ: -443.5 },
    { species: 'SiO2(s, quartz)', formationKJ: -910.94 },
    { species: 'SnCl2(s)', formationKJ: -325.1 },
    { species: 'SnCl4(l)', formationKJ: -511.3 },
    { species: 'SO2(g)', formationKJ: -296.83 },
    { species: 'SO3(g)', formationKJ: -395.72 },
    { species: 'SiH4(g)', formationKJ: 34 },
    { species: 'SiCl4(g)', formationKJ: -657.0 },
    { species: 'C(g)', formationKJ: 716.68 },
    { species: 'H(g)', formationKJ: 217.97 },
    { species: 'Cl(g)', formationKJ: 121.68 },
    { species: 'Fe2O3(s)', formationKJ: -824.2 },
  ],
}

/**
 * One mean bond enthalpy from Table 5.3(a) (single bonds). The matrix in the table is printed
 * with element `a` as the column heading and element `b` as the row heading. Each unordered pair
 * appears once. Empty cells ("–" in the printed table) are not listed.
 */
export interface SingleBondRow {
  a: string
  b: string
  /** Mean bond enthalpy, kJ mol⁻¹ at 298 K. */
  kJ: number
}

/**
 * NCERT Table 5.3(a), Some Mean Single Bond Enthalpies in kJ mol⁻¹ at 298 K (book p. 154;
 * text line 1814). Read from the matrix image, column by column: column X lists the bonds from
 * H down to X, in the printed row order H, C, N, O, F, Si, P, S, Cl, Br, I. Missing cells are
 * the printed dashes (N–Si, N–S, O–S, O–Br, N–I, F–I, S–I). Counts: 59 bonds.
 */
export const NCERT_TABLE_5_3A_SINGLE_BONDS: NcertTable<SingleBondRow> = {
  source: 'NCERT Class 11 Part I, Unit 5, Table 5.3(a) (Some Mean Single Bond Enthalpies), book p. 154, text line 1814',
  rows: [
    { a: 'H', b: 'H', kJ: 435.8 },
    { a: 'C', b: 'H', kJ: 414 },
    { a: 'C', b: 'C', kJ: 347 },
    { a: 'N', b: 'H', kJ: 389 },
    { a: 'N', b: 'C', kJ: 293 },
    { a: 'N', b: 'N', kJ: 159 },
    { a: 'O', b: 'H', kJ: 464 },
    { a: 'O', b: 'C', kJ: 351 },
    { a: 'O', b: 'N', kJ: 201 },
    { a: 'O', b: 'O', kJ: 138 },
    { a: 'F', b: 'H', kJ: 569 },
    { a: 'F', b: 'C', kJ: 439 },
    { a: 'F', b: 'N', kJ: 272 },
    { a: 'F', b: 'O', kJ: 184 },
    { a: 'F', b: 'F', kJ: 155 },
    { a: 'Si', b: 'H', kJ: 293 },
    { a: 'Si', b: 'C', kJ: 289 },
    { a: 'Si', b: 'O', kJ: 368 },
    { a: 'Si', b: 'F', kJ: 540 },
    { a: 'Si', b: 'Si', kJ: 176 },
    { a: 'P', b: 'H', kJ: 318 },
    { a: 'P', b: 'C', kJ: 264 },
    { a: 'P', b: 'N', kJ: 209 },
    { a: 'P', b: 'O', kJ: 351 },
    { a: 'P', b: 'F', kJ: 490 },
    { a: 'P', b: 'Si', kJ: 213 },
    { a: 'P', b: 'P', kJ: 213 },
    { a: 'S', b: 'H', kJ: 339 },
    { a: 'S', b: 'C', kJ: 259 },
    { a: 'S', b: 'F', kJ: 327 },
    { a: 'S', b: 'Si', kJ: 226 },
    { a: 'S', b: 'P', kJ: 230 },
    { a: 'S', b: 'S', kJ: 213 },
    { a: 'Cl', b: 'H', kJ: 431 },
    { a: 'Cl', b: 'C', kJ: 330 },
    { a: 'Cl', b: 'N', kJ: 201 },
    { a: 'Cl', b: 'O', kJ: 205 },
    { a: 'Cl', b: 'F', kJ: 255 },
    { a: 'Cl', b: 'Si', kJ: 360 },
    { a: 'Cl', b: 'P', kJ: 331 },
    { a: 'Cl', b: 'S', kJ: 251 },
    { a: 'Cl', b: 'Cl', kJ: 243 },
    { a: 'Br', b: 'H', kJ: 368 },
    { a: 'Br', b: 'C', kJ: 276 },
    { a: 'Br', b: 'N', kJ: 243 },
    { a: 'Br', b: 'F', kJ: 197 },
    { a: 'Br', b: 'Si', kJ: 289 },
    { a: 'Br', b: 'P', kJ: 272 },
    { a: 'Br', b: 'S', kJ: 213 },
    { a: 'Br', b: 'Cl', kJ: 218 },
    { a: 'Br', b: 'Br', kJ: 192 },
    { a: 'I', b: 'H', kJ: 297 },
    { a: 'I', b: 'C', kJ: 238 },
    { a: 'I', b: 'O', kJ: 201 },
    { a: 'I', b: 'Si', kJ: 213 },
    { a: 'I', b: 'P', kJ: 213 },
    { a: 'I', b: 'Cl', kJ: 209 },
    { a: 'I', b: 'Br', kJ: 180 },
    { a: 'I', b: 'I', kJ: 151 },
  ],
}

/** One mean multiple bond enthalpy from Table 5.3(b). `order` is 2 (double) or 3 (triple). */
export interface MultipleBondRow {
  a: string
  b: string
  order: 2 | 3
  kJ: number
}

/**
 * NCERT Table 5.3(b), Some Mean Multiple Bond Enthalpies in kJ mol⁻¹ at 298 K (book p. 154;
 * text line 1908).
 */
export const NCERT_TABLE_5_3B_MULTIPLE_BONDS: NcertTable<MultipleBondRow> = {
  source: 'NCERT Class 11 Part I, Unit 5, Table 5.3(b) (Some Mean Multiple Bond Enthalpies), book p. 154, text line 1908',
  rows: [
    { a: 'N', b: 'N', order: 2, kJ: 418 },
    { a: 'N', b: 'N', order: 3, kJ: 946 },
    { a: 'C', b: 'N', order: 2, kJ: 615 },
    { a: 'C', b: 'N', order: 3, kJ: 891 },
    { a: 'C', b: 'C', order: 2, kJ: 611 },
    { a: 'C', b: 'C', order: 3, kJ: 837 },
    { a: 'C', b: 'O', order: 2, kJ: 741 },
    { a: 'C', b: 'O', order: 3, kJ: 1070 },
    { a: 'O', b: 'O', order: 2, kJ: 498 },
  ],
}

/** One row of Table 5.4 (effect of temperature on spontaneity). Signs are '+' or '-'. */
export interface SpontaneityCaseRow {
  deltaH: '+' | '-'
  deltaS: '+' | '-'
  /** Sign of ΔG, or the temperature range in which it has that sign. */
  deltaG: '-' | '+'
  /** Temperature condition printed with the ΔG sign, or 'all'. */
  temperature: 'all' | 'low' | 'high'
  /** NCERT's description, as printed. */
  description: string
}

/**
 * NCERT Table 5.4, Effect of Temperature on Spontaneity of Reactions (book p. 162; text line
 * 2764). The footnote says "low" and "high" are relative to the reaction; they are kept as data
 * here, not as temperatures.
 */
export const NCERT_TABLE_5_4_SPONTANEITY: NcertTable<SpontaneityCaseRow> = {
  source: 'NCERT Class 11 Part I, Unit 5, Table 5.4 (Effect of Temperature on Spontaneity of Reactions), book p. 162, text line 2764',
  rows: [
    { deltaH: '-', deltaS: '+', deltaG: '-', temperature: 'all', description: 'Reaction spontaneous at all temperatures' },
    { deltaH: '-', deltaS: '-', deltaG: '-', temperature: 'low', description: 'Reaction spontaneous at low temperature' },
    { deltaH: '-', deltaS: '-', deltaG: '+', temperature: 'high', description: 'Reaction nonspontaneous at high temperature' },
    { deltaH: '+', deltaS: '+', deltaG: '+', temperature: 'low', description: 'Reaction nonspontaneous at low temperature' },
    { deltaH: '+', deltaS: '+', deltaG: '-', temperature: 'high', description: 'Reaction spontaneous at high temperature' },
    { deltaH: '+', deltaS: '-', deltaG: '+', temperature: 'all', description: 'Reaction nonspontaneous at all temperatures' },
  ],
}

/** One step of the NaCl Born–Haber cycle as NCERT Unit 5 prints it, in formation direction. */
export interface Unit5BornHaberStep {
  label: string
  /** Signed for the formation direction Na(s) + ½Cl2(g) → NaCl(s), kJ mol⁻¹. */
  enthalpyKJ: number
  /** Where the value is printed. */
  source: string
}

/**
 * The NaCl Born–Haber cycle as Unit 5 prints it (Section 5.5(d); text lines 1953–2059), in the
 * formation direction so the steps add to ΔfH(NaCl). The lattice step is NCERT's printed +788
 * for NaCl(s) → Na⁺(g) + Cl⁻(g), reversed here. Unit 4 (ionic.ts) uses a different set of
 * ionisation and electron gain values; both are kept, and the difference is in
 * NCERT_UNIT5_PRINTED_CHECKS.
 */
export const NCERT_UNIT5_NACL_BORN_HABER: readonly Unit5BornHaberStep[] = [
  { label: 'Sublimation, Na(s) → Na(g)', enthalpyKJ: 108.4, source: 'NCERT Unit 5, Section 5.5(d), step 1, text line 1963' },
  { label: 'Dissociation, ½Cl2(g) → Cl(g)', enthalpyKJ: 121, source: 'NCERT Unit 5, Section 5.5(d), step 3, text line 1977 (½ × 242 kJ mol⁻¹)' },
  { label: 'Ionisation, Na(g) → Na⁺(g) + e⁻', enthalpyKJ: 496, source: 'NCERT Unit 5, Section 5.5(d), step 2, text line 1971' },
  { label: 'Electron gain, Cl(g) + e⁻ → Cl⁻(g)', enthalpyKJ: -348.6, source: 'NCERT Unit 5, Section 5.5(d), step 4, text line 1982' },
  { label: 'Lattice formation, Na⁺(g) + Cl⁻(g) → NaCl(s)', enthalpyKJ: -788, source: 'NCERT Unit 5, Section 5.5(d), text line 1953 (+788 for the reverse step)' },
]

/** NCERT's printed standard enthalpy of formation of NaCl(s), kJ mol⁻¹ (text line 2059 implies −411.2; Table 5.2 prints −411.15). */
export const NCERT_UNIT5_NACL_FORMATION_KJ = -411.2

/** One value NCERT prints in a worked Problem or in running text, with its location. */
export interface Unit5PrintedValue {
  /** Problem number, or the section for values in running text. */
  where: string
  quantity: string
  value: number
  unit: string
  /** Line number in kech105.txt. */
  line: number
}

/**
 * Values NCERT prints in the worked Problems and running text, with their line numbers in
 * kech105.txt. These are the inputs to the worked examples in the tests.
 */
export const NCERT_UNIT5_WORKED_VALUES: readonly Unit5PrintedValue[] = [
  { where: 'Problem 5.2', quantity: 'initial volume (ideal gas, 10 atm, 25 °C)', value: 2, unit: 'L', line: 620 },
  { where: 'Problem 5.2', quantity: 'initial pressure', value: 10, unit: 'atm', line: 620 },
  { where: 'Problem 5.2', quantity: 'final volume (expansion into vacuum)', value: 10, unit: 'L', line: 622 },
  { where: 'Problem 5.3', quantity: 'constant external pressure', value: 1, unit: 'atm', line: 649 },
  { where: 'Problem 5.4', quantity: 'amount of ideal gas (reversible expansion)', value: 1, unit: 'mol', line: 654 },
  { where: 'Problem 5.4', quantity: 'printed reversible work magnitude', value: 39.366, unit: 'L atm', line: 674 },
  { where: 'Problem 5.5', quantity: 'ΔvapH of water at 1 bar and 100 °C (printed)', value: 41, unit: 'kJ mol⁻¹', line: 776 },
  { where: 'Problem 5.5', quantity: 'ΔU of vapourisation (printed)', value: 37.904, unit: 'kJ mol⁻¹', line: 801 },
  { where: 'Problem 5.6', quantity: 'mass of graphite burnt', value: 1, unit: 'g', line: 1023 },
  { where: 'Problem 5.6', quantity: 'calorimeter heat capacity', value: 20.7, unit: 'kJ K⁻¹', line: 985 },
  { where: 'Problem 5.6', quantity: 'temperature rise (298 K → 299 K)', value: 1, unit: 'K', line: 1000 },
  { where: 'Problem 5.6', quantity: 'molar mass of carbon (printed)', value: 12.0, unit: 'g mol⁻¹', line: 1010 },
  { where: 'Problem 5.7', quantity: 'mass of water on swimmer', value: 18, unit: 'g', line: 1187 },
  { where: 'Problem 5.7', quantity: 'ΔvapH of water at 298 K (printed)', value: 44.01, unit: 'kJ mol⁻¹', line: 1218 },
  { where: 'Problem 5.7', quantity: 'printed ΔvapU', value: 41.53, unit: 'kJ mol⁻¹', line: 1224 },
  { where: 'Problem 5.8', quantity: 'heat capacity of water', value: 4.2, unit: 'J g⁻¹ °C⁻¹', line: 1228 },
  { where: 'Problem 5.8', quantity: 'ΔfusH of ice (printed in Problem; Table 5.1 prints 6.01)', value: 6.0, unit: 'kJ mol⁻¹', line: 1114 },
  { where: 'Problem 5.8', quantity: 'printed total ΔH = ΔU', value: -13.56, unit: 'kJ mol⁻¹', line: 1246 },
  { where: 'Problem 5.9', quantity: 'printed combustion heat of benzene, liberated', value: 3267, unit: 'kJ mol⁻¹', line: 1600 },
  { where: 'Problem 5.9', quantity: 'printed ΔfH(benzene)', value: -48.51, unit: 'kJ mol⁻¹', line: 1666 },
  { where: 'Section 5.4', quantity: 'printed ΔrH of H2(g) + Br2(l) → 2HBr(g)', value: -178.3, unit: 'kJ mol⁻¹', line: 1323 },
  { where: 'Section 5.5(b)', quantity: 'printed ΔaH of H2 (H2 → 2H)', value: 435.0, unit: 'kJ mol⁻¹', line: 1677 },
  { where: 'Section 5.5(b)', quantity: 'printed bond dissociation enthalpy of Cl2', value: 242, unit: 'kJ mol⁻¹', line: 1721 },
  { where: 'Section 5.5(b)', quantity: 'printed bond dissociation enthalpy of O2', value: 428, unit: 'kJ mol⁻¹', line: 1723 },
  { where: 'Section 5.5(b)', quantity: 'printed ΔaH of CH4 (CH4 → C + 4H)', value: 1665, unit: 'kJ mol⁻¹', line: 1690 },
  { where: 'Section 5.5(c)', quantity: 'printed mean C–H bond enthalpy', value: 416, unit: 'kJ mol⁻¹', line: 1780 },
  { where: 'Section 5.5(d)', quantity: 'printed lattice enthalpy of NaCl(s) → Na⁺(g) + Cl⁻(g)', value: 788, unit: 'kJ mol⁻¹', line: 1953 },
  { where: 'Section 5.5(e)', quantity: 'printed ΔhydH(NaCl)', value: -784, unit: 'kJ mol⁻¹', line: 2087 },
  { where: 'Section 5.5(e)', quantity: 'printed ΔH, HCl(g) + 10 aq.', value: -69.01, unit: 'kJ mol⁻¹', line: 2121 },
  { where: 'Section 5.5(e)', quantity: 'printed ΔH, HCl(g) + 25 aq.', value: -72.03, unit: 'kJ mol⁻¹', line: 2125 },
  { where: 'Section 5.5(e)', quantity: 'printed ΔH, HCl(g) + 40 aq.', value: -72.79, unit: 'kJ mol⁻¹', line: 2127 },
  { where: 'Section 5.5(e)', quantity: 'printed ΔH, HCl(g) + ∞ aq.', value: -74.85, unit: 'kJ mol⁻¹', line: 2129 },
  { where: 'Problem 5.11', quantity: 'ΔrH of 4Fe(s) + 3O2(g) → 2Fe2O3(s)', value: -1648, unit: 'kJ mol⁻¹', line: 2466 },
  { where: 'Problem 5.11', quantity: 'ΔrS of the same reaction', value: -549.4, unit: 'J K⁻¹ mol⁻¹', line: 2466 },
  { where: 'Problem 5.12', quantity: 'Kp for 3/2 O2(g) → O3(g) at 298 K', value: 2.47e-29, unit: 'dimensionless', line: 2843 },
  { where: 'Problem 5.13', quantity: 'ΔrG of 2NH3(g) + CO2(g) ⇌ NH2CONH2(aq) + H2O(l) at 298 K', value: -13.6, unit: 'kJ mol⁻¹', line: 2864 },
  { where: 'Problem 5.14', quantity: 'dissociation of N2O4 at 60 °C', value: 0.5, unit: 'fraction', line: 2876 },
  { where: 'Problem 5.14', quantity: 'temperature (60 °C = 333 K)', value: 333, unit: 'K', line: 2877 },
  { where: 'Problem 5.14', quantity: 'printed ΔrG', value: -763.8, unit: 'kJ mol⁻¹', line: 2933 },
]

/** A place where NCERT disagrees with itself, with Unit 4, or with its own arithmetic. */
export interface Unit5PrintedCheck {
  /** Where the printed value is. */
  where: string
  /** What NCERT prints. */
  printed: string
  /** What the printed numbers give, or what another NCERT location prints. */
  recomputed: string
  /** How serious the disagreement is, as this site uses the note. */
  kind: 'misprint' | 'internal inconsistency' | 'rounding' | 'Unit 4 disagreement'
}

/**
 * Disagreements found while checking Unit 5. The printed values are kept above as NCERT prints
 * them. Each check is also a test (see ncert-unit5-tables.test.ts) so a change to a value is seen.
 */
export const NCERT_UNIT5_PRINTED_CHECKS: readonly Unit5PrintedCheck[] = [
  {
    where: 'Section 5.1.4(a), Problem 5.1 solution (lines 401–406)',
    printed: 'Problem 5.1(iii) gives ΔU = q − w for a closed system where w is work done by the system',
    recomputed: 'Section 5.1.4 and equation 5.1 use the IUPAC convention ΔU = q + w, with w positive when work is done on the system',
    kind: 'internal inconsistency',
  },
  {
    where: 'Section 5.4(b), line 1114; Problem 5.8, line 1228–1246; Table 5.1, line 1140',
    printed: 'ΔfusH(H2O) = 6.00 kJ mol⁻¹ in the text (line 1114) and Problem 5.8',
    recomputed: 'Table 5.1 prints 6.01 kJ mol⁻¹ for the same substance at 273.15 K',
    kind: 'internal inconsistency',
  },
  {
    where: 'Section 5.4(d), line 1323',
    printed: 'H2(g) + Br2(l) → 2HBr(g); ΔrH = −178.3 kJ mol⁻¹',
    recomputed: '2 × ΔfH(HBr, g) = 2 × (−36.40) = −72.8 kJ mol⁻¹ (Table 5.2 and the text on the same page); −178.3 is the CaO + CO2 value',
    kind: 'misprint',
  },
  {
    where: 'Problem 5.6 solution, line 1005',
    printed: 'ΔU for the combustion of 1 g graphite = −20.7 kJ K⁻¹',
    recomputed: 'The quantity is −20.7 kJ (the heat capacity has the units kJ K⁻¹, and ΔT is 1 K)',
    kind: 'misprint',
  },
  {
    where: 'Problem 5.6, lines 1004–1014',
    printed: 'The reaction is printed with CO in the product; the text then says Δng = 0',
    recomputed: 'Δng = 0 holds for C(graphite) + O2(g) → CO2(g), not for CO (Δng = −½); the subscript is not visible in the text layer and was not checked on the page image',
    kind: 'misprint',
  },
  {
    where: 'Problem 5.9 solution, lines 1660–1672',
    printed: 'Reversed combustion, equation (vi), ΔfH = −3267.0 kJ mol⁻¹; sum (iv) ΔfH = −48.51 kJ mol⁻¹',
    recomputed: 'Reversing ΔcH = −3267.0 gives +3267.0; the sum −3218.49 + 3267.0 = +48.51 kJ mol⁻¹, matching ΔfH(C6H6, l) ≈ +49.0 in Table 5.2',
    kind: 'misprint',
  },
  {
    where: 'Problem 5.14 solution, lines 2931–2934',
    printed: 'ΔrG = −(8.314)(333)(2.303)(0.1239) = −763.8 kJ mol⁻¹',
    recomputed: 'The product is −790 J mol⁻¹ = −0.79 kJ mol⁻¹ (exact Kp = 4/3 gives −0.80 kJ mol⁻¹); the printed value has the wrong magnitude and the wrong unit',
    kind: 'misprint',
  },
  {
    where: 'Problem 5.11 solution, lines 2480–2500',
    printed: 'ΔSsurr = 5530 J K⁻¹ mol⁻¹; ΔStotal = 4980.6 J K⁻¹ mol⁻¹',
    recomputed: '1648 000 / 298 = 5530.2; ΔStotal = 4980.8. The printed total comes from the rounded 5530',
    kind: 'rounding',
  },
  {
    where: 'Problem 5.5, line 796–801',
    printed: 'R = 8.3 J mol⁻¹ K⁻¹ for ΔU = ΔH − ΔngRT',
    recomputed: 'Elsewhere in the unit R = 8.314 J mol⁻¹ K⁻¹. With 8.314, ΔU = 37.899 kJ mol⁻¹ (printed 37.904)',
    kind: 'rounding',
  },
  {
    where: 'Section 5.5(c), line 1723; Table 5.3(b), line 1908',
    printed: 'Bond dissociation enthalpy of O2 = 428 kJ mol⁻¹ in the text',
    recomputed: 'Table 5.3(b) prints the O=O mean multiple bond enthalpy as 498 kJ mol⁻¹, and Unit 4 quotes 498',
    kind: 'internal inconsistency',
  },
  {
    where: 'Section 5.5(c), line 1721; Table 5.3(a), line 1814',
    printed: 'Cl2(g) → 2Cl(g) bond dissociation enthalpy = 242 kJ mol⁻¹',
    recomputed: 'Table 5.3(a) prints Cl–Cl = 243 kJ mol⁻¹',
    kind: 'internal inconsistency',
  },
  {
    where: 'Section 5.5(b) line 1677 and 5.5(c) line 1711; Table 5.3(a), line 1814',
    printed: 'H2(g) → 2H(g) = 435.0 kJ mol⁻¹',
    recomputed: 'Table 5.3(a) prints H–H = 435.8 kJ mol⁻¹, and Table 5.2 gives 2 × ΔfH(H, g) = 435.9',
    kind: 'internal inconsistency',
  },
  {
    where: 'Section 5.5(d), Born–Haber, lines 1963–1982 and 2059',
    printed: 'Unit 5: ionisation 496 kJ mol⁻¹, electron gain −348.6 kJ mol⁻¹, dissociation step 121 kJ mol⁻¹',
    recomputed: 'Unit 4 (Section 4.2, book p. 106) prints ionisation 495.8 and electron gain −348.7. Table 5.2 gives Cl(g) = 121.68, so ½Cl2 = 121.68 against the 121 used in the text',
    kind: 'Unit 4 disagreement',
  },
  {
    where: 'Section 5.5(d) lines 2057–2059; Table 5.2',
    printed: 'ΔfH(NaCl) = −411.2 kJ mol⁻¹ (from the cycle)',
    recomputed: 'Table 5.2 prints −411.15 kJ mol⁻¹',
    kind: 'rounding',
  },
  {
    where: 'Section 5.4(b), Table 5.1, line 1157; Problem 5.7, line 1218',
    printed: 'ΔvapH(H2O) = 44.01 kJ mol⁻¹ at 298 K (Problem 5.7); 40.79 kJ mol⁻¹ at 373.15 K (Table 5.1)',
    recomputed: 'Different temperatures, both consistent with the printed values; no disagreement',
    kind: 'rounding',
  },
  {
    where: 'Problem 5.13, line 2864 (reaction printed as image)',
    printed: 'ΔrG = −13.6 kJ mol⁻¹ and log K = 2.38, K = 2.4 × 10²',
    recomputed: '−13.6 × 10³ / (2.303 × 8.314 × 298) = 2.384, K = 2.42 × 10²; consistent',
    kind: 'rounding',
  },
]
