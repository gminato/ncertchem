/**
 * Values printed in NCERT Class 11 Part I, Unit 3 (Classification of Elements and
 * Periodicity in Properties), 2026-27 reprint. Each table is transcribed exactly as printed,
 * with the line number in the pdftotext -layout rendering of the unit, so a reviewer can
 * check it. NCERT's values are kept here even where PubChem differs, because students are
 * examined on the printed numbers. Disagreements are listed in periodic-data.ts and the
 * unit report.
 *
 * Symbols are used as keys. Resolve them to Z with {@link elementBySymbol}.
 */

/** One printed entry: an element symbol and the value printed beside it. */
export interface NcertEntry<T> {
  symbol: string
  value: T
}

/** A printed table: its source citation and its rows in printed order. */
export interface NcertTable<T> {
  source: string
  rows: readonly T[]
}

/** Döbereiner's triad as printed in Table 3.1: three elements with their atomic weights. */
export interface TriadRow {
  low: { symbol: string; atomicWeight: number }
  middle: { symbol: string; atomicWeight: number }
  high: { symbol: string; atomicWeight: number }
}

/** NCERT Table 3.1, Döbereiner's Triads (kech103-layout.txt line 87). */
export const NCERT_TABLE_3_1_TRIADS: NcertTable<TriadRow> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.1 (Dobereiner’s Triads), layout line 87',
  rows: [
    {
      low: { symbol: 'Li', atomicWeight: 7 },
      middle: { symbol: 'Na', atomicWeight: 23 },
      high: { symbol: 'K', atomicWeight: 39 },
    },
    {
      low: { symbol: 'Ca', atomicWeight: 40 },
      middle: { symbol: 'Sr', atomicWeight: 88 },
      high: { symbol: 'Ba', atomicWeight: 137 },
    },
    {
      low: { symbol: 'Cl', atomicWeight: 35.5 },
      middle: { symbol: 'Br', atomicWeight: 80 },
      high: { symbol: 'I', atomicWeight: 127 },
    },
  ],
}

/**
 * Mean of the outer two atomic weights of a triad, the quantity Döbereiner compared with the
 * middle element. Printed Table 3.1 shows the middle element's weight, not this mean.
 */
export function triadMean(row: TriadRow): number {
  return (row.low.atomicWeight + row.high.atomicWeight) / 2
}

/** NCERT Table 3.2, Newlands' Octaves (kech103-layout.txt line 107). Each row is one octave. */
export const NCERT_TABLE_3_2_OCTAVES: NcertTable<readonly NcertEntry<number>[]> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.2 (Newlands’ Octaves), layout line 107',
  rows: [
    [
      { symbol: 'Li', value: 7 },
      { symbol: 'Be', value: 9 },
      { symbol: 'B', value: 11 },
      { symbol: 'C', value: 12 },
      { symbol: 'N', value: 14 },
      { symbol: 'O', value: 16 },
      { symbol: 'F', value: 19 },
    ],
    [
      { symbol: 'Na', value: 23 },
      { symbol: 'Mg', value: 24 },
      { symbol: 'Al', value: 27 },
      { symbol: 'Si', value: 29 },
      { symbol: 'P', value: 31 },
      { symbol: 'S', value: 32 },
      { symbol: 'Cl', value: 35.5 },
    ],
    [
      { symbol: 'K', value: 39 },
      { symbol: 'Ca', value: 40 },
    ],
  ],
}

/** One property row of Table 3.3, with the predicted and found values side by side. */
export interface MendeleevPredictionRow {
  property: string
  ekaAluminium: { predicted: string; gallium: string }
  ekaSilicon: { predicted: string; germanium: string }
}

/**
 * NCERT Table 3.3, Mendeleev's Predictions for Eka-aluminium (gallium) and Eka-silicon
 * (germanium) (kech103-layout.txt line 161). Values are kept as printed strings: NCERT prints
 * "Low" and "High" for two melting points, and units are in the property name.
 */
export const NCERT_TABLE_3_3_MENDELEEV: NcertTable<MendeleevPredictionRow> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.3 (Mendeleev’s Predictions), layout line 161',
  rows: [
    {
      property: 'Atomic weight',
      ekaAluminium: { predicted: '68', gallium: '70' },
      ekaSilicon: { predicted: '72', germanium: '72.6' },
    },
    {
      property: 'Density/(g/cm3)',
      ekaAluminium: { predicted: '5.9', gallium: '5.94' },
      ekaSilicon: { predicted: '5.5', germanium: '5.36' },
    },
    {
      property: 'Melting point/K',
      ekaAluminium: { predicted: 'Low', gallium: '302.93' },
      ekaSilicon: { predicted: 'High', germanium: '1231' },
    },
    {
      property: 'Formula of oxide',
      ekaAluminium: { predicted: 'E2O3', gallium: 'Ga2O3' },
      ekaSilicon: { predicted: 'EO2', germanium: 'GeO2' },
    },
    {
      property: 'Formula of chloride',
      ekaAluminium: { predicted: 'ECl3', gallium: 'GaCl3' },
      ekaSilicon: { predicted: 'ECl4', germanium: 'GeCl4' },
    },
  ],
}

/** One row of Table 3.4, the IUPAC numerical roots. */
export interface IupacRootRow {
  digit: number
  root: string
  abbreviation: string
}

/** NCERT Table 3.4, Notation for IUPAC Nomenclature of Elements (kech103-layout.txt line 309). */
export const NCERT_TABLE_3_4_ROOTS: NcertTable<IupacRootRow> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.4 (Notation for IUPAC Nomenclature), layout line 309',
  rows: [
    { digit: 0, root: 'nil', abbreviation: 'n' },
    { digit: 1, root: 'un', abbreviation: 'u' },
    { digit: 2, root: 'bi', abbreviation: 'b' },
    { digit: 3, root: 'tri', abbreviation: 't' },
    { digit: 4, root: 'quad', abbreviation: 'q' },
    { digit: 5, root: 'pent', abbreviation: 'p' },
    { digit: 6, root: 'hex', abbreviation: 'h' },
    { digit: 7, root: 'sept', abbreviation: 's' },
    { digit: 8, root: 'oct', abbreviation: 'o' },
    { digit: 9, root: 'enn', abbreviation: 'e' },
  ],
}

/** One row of Table 3.5: systematic and official names for Z = 101 to 118. */
export interface Z101To118Row {
  Z: number
  systematicName: string
  systematicSymbol: string
  officialName: string
  officialSymbol: string
}

/**
 * NCERT Table 3.5, Nomenclature of Elements with Atomic Number Above 100
 * (kech103-layout.txt line 335). Two systematic names (Z = 110 and 111) use the doubled
 * consonants NCERT prints; see the note in ncert-unit3-tables.test.ts.
 */
export const NCERT_TABLE_3_5_Z101_118: NcertTable<Z101To118Row> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.5 (Nomenclature of Elements above 100), layout line 335',
  rows: [
    { Z: 101, systematicName: 'Unnilunium', systematicSymbol: 'Unu', officialName: 'Mendelevium', officialSymbol: 'Md' },
    { Z: 102, systematicName: 'Unnilbium', systematicSymbol: 'Unb', officialName: 'Nobelium', officialSymbol: 'No' },
    { Z: 103, systematicName: 'Unniltrium', systematicSymbol: 'Unt', officialName: 'Lawrencium', officialSymbol: 'Lr' },
    { Z: 104, systematicName: 'Unnilquadium', systematicSymbol: 'Unq', officialName: 'Rutherfordium', officialSymbol: 'Rf' },
    { Z: 105, systematicName: 'Unnilpentium', systematicSymbol: 'Unp', officialName: 'Dubnium', officialSymbol: 'Db' },
    { Z: 106, systematicName: 'Unnilhexium', systematicSymbol: 'Unh', officialName: 'Seaborgium', officialSymbol: 'Sg' },
    { Z: 107, systematicName: 'Unnilseptium', systematicSymbol: 'Uns', officialName: 'Bohrium', officialSymbol: 'Bh' },
    { Z: 108, systematicName: 'Unniloctium', systematicSymbol: 'Uno', officialName: 'Hassium', officialSymbol: 'Hs' },
    { Z: 109, systematicName: 'Unnilennium', systematicSymbol: 'Une', officialName: 'Meitnerium', officialSymbol: 'Mt' },
    { Z: 110, systematicName: 'Ununnillium', systematicSymbol: 'Uun', officialName: 'Darmstadtium', officialSymbol: 'Ds' },
    { Z: 111, systematicName: 'Unununnium', systematicSymbol: 'Uuu', officialName: 'Rontgenium', officialSymbol: 'Rg' },
    { Z: 112, systematicName: 'Ununbium', systematicSymbol: 'Uub', officialName: 'Copernicium', officialSymbol: 'Cn' },
    { Z: 113, systematicName: 'Ununtrium', systematicSymbol: 'Uut', officialName: 'Nihonium', officialSymbol: 'Nh' },
    { Z: 114, systematicName: 'Ununquadium', systematicSymbol: 'Uuq', officialName: 'Flerovium', officialSymbol: 'Fl' },
    { Z: 115, systematicName: 'Ununpentium', systematicSymbol: 'Uup', officialName: 'Moscovium', officialSymbol: 'Mc' },
    { Z: 116, systematicName: 'Ununhexium', systematicSymbol: 'Uuh', officialName: 'Livermorium', officialSymbol: 'Lv' },
    { Z: 117, systematicName: 'Ununseptium', systematicSymbol: 'Uus', officialName: 'Tennessine', officialSymbol: 'Ts' },
    { Z: 118, systematicName: 'Ununoctium', systematicSymbol: 'Uuo', officialName: 'Oganesson', officialSymbol: 'Og' },
  ],
}

/**
 * NCERT Table 3.6(a), Atomic Radii/pm Across the Periods (kech103-layout.txt line 684).
 * Printed as two rows: period II then period III.
 */
export const NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.6(a) (Atomic Radii/pm Across the Periods), layout line 684',
  rows: [
    { symbol: 'Li', value: 152 },
    { symbol: 'Be', value: 111 },
    { symbol: 'B', value: 88 },
    { symbol: 'C', value: 77 },
    { symbol: 'N', value: 74 },
    { symbol: 'O', value: 66 },
    { symbol: 'F', value: 64 },
    { symbol: 'Na', value: 186 },
    { symbol: 'Mg', value: 160 },
    { symbol: 'Al', value: 143 },
    { symbol: 'Si', value: 117 },
    { symbol: 'P', value: 110 },
    { symbol: 'S', value: 104 },
    { symbol: 'Cl', value: 99 },
  ],
}

/** NCERT Table 3.6(b), Atomic Radii/pm Down a Family (kech103-layout.txt line 690). */
export const NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.6(b) (Atomic Radii/pm Down a Family), layout line 690',
  rows: [
    { symbol: 'Li', value: 152 },
    { symbol: 'Na', value: 186 },
    { symbol: 'K', value: 231 },
    { symbol: 'Rb', value: 244 },
    { symbol: 'Cs', value: 262 },
    { symbol: 'F', value: 64 },
    { symbol: 'Cl', value: 99 },
    { symbol: 'Br', value: 114 },
    { symbol: 'I', value: 133 },
    { symbol: 'At', value: 140 },
  ],
}

/**
 * Metallic and ionic radii printed in the Section 3.7.2(b) table on anomalous properties
 * (kech103-layout.txt lines 1104 and 1113). The ionic row is labelled "M+/pm" as printed,
 * even though Be and Mg are shown with their 2+ charge in the text.
 */
export const NCERT_ANOMALOUS_PROPERTIES_RADII: NcertTable<{
  symbol: string
  metallicRadiusPm: number
  ionicRadiusPm: number
}> = {
  source: 'NCERT Class 11 Part I, Unit 3, Section 3.7.2(b) radii table, layout lines 1104 and 1113',
  rows: [
    { symbol: 'Li', metallicRadiusPm: 152, ionicRadiusPm: 76 },
    { symbol: 'Be', metallicRadiusPm: 111, ionicRadiusPm: 31 },
    { symbol: 'Na', metallicRadiusPm: 186, ionicRadiusPm: 102 },
    { symbol: 'Mg', metallicRadiusPm: 160, ionicRadiusPm: 72 },
  ],
}

/**
 * Ionic radii printed in the running text of Section 3.7.1(b) (kech103-layout.txt lines 731
 * and 734). These are not in a numbered table.
 */
export const NCERT_IONIC_RADII_IN_TEXT: NcertTable<{ symbol: string; charge: number; radiusPm: number }> = {
  source: 'NCERT Class 11 Part I, Unit 3, Section 3.7.1(b) text, layout lines 731 and 734',
  rows: [
    { symbol: 'F', charge: -1, radiusPm: 136 },
    { symbol: 'Na', charge: 1, radiusPm: 95 },
  ],
}

/**
 * NCERT Table 3.7, Electron Gain Enthalpies (kJ mol⁻¹) of Some Main Group Elements
 * (kech103-layout.txt line 869). Negative values release energy. The asterisk in the printed
 * title refers to NCERT's footnote on the sign convention for electron affinity, not to
 * estimated values.
 */
export const NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.7 (Electron Gain Enthalpies), layout line 869',
  rows: [
    { symbol: 'H', value: -73 },
    { symbol: 'Li', value: -60 },
    { symbol: 'Na', value: -53 },
    { symbol: 'K', value: -48 },
    { symbol: 'Rb', value: -47 },
    { symbol: 'Cs', value: -46 },
    { symbol: 'O', value: -141 },
    { symbol: 'S', value: -200 },
    { symbol: 'Se', value: -195 },
    { symbol: 'Te', value: -190 },
    { symbol: 'Po', value: -174 },
    { symbol: 'F', value: -328 },
    { symbol: 'Cl', value: -349 },
    { symbol: 'Br', value: -325 },
    { symbol: 'I', value: -295 },
    { symbol: 'At', value: -270 },
    { symbol: 'He', value: 48 },
    { symbol: 'Ne', value: 116 },
    { symbol: 'Ar', value: 96 },
    { symbol: 'Kr', value: 96 },
    { symbol: 'Xe', value: 77 },
    { symbol: 'Rn', value: 68 },
  ],
}

/**
 * NCERT Table 3.8(a), Electronegativity Values on the Pauling scale across the periods
 * (kech103-layout.txt line 963).
 */
export const NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.8(a) (Electronegativity Across the Periods), layout line 963',
  rows: [
    { symbol: 'Li', value: 1.0 },
    { symbol: 'Be', value: 1.5 },
    { symbol: 'B', value: 2.0 },
    { symbol: 'C', value: 2.5 },
    { symbol: 'N', value: 3.0 },
    { symbol: 'O', value: 3.5 },
    { symbol: 'F', value: 4.0 },
    { symbol: 'Na', value: 0.9 },
    { symbol: 'Mg', value: 1.2 },
    { symbol: 'Al', value: 1.5 },
    { symbol: 'Si', value: 1.8 },
    { symbol: 'P', value: 2.1 },
    { symbol: 'S', value: 2.5 },
    { symbol: 'Cl', value: 3.0 },
  ],
}

/**
 * NCERT Table 3.8(b), Electronegativity Values on the Pauling scale down a family
 * (kech103-layout.txt line 972).
 */
export const NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.8(b) (Electronegativity Down a Family), layout line 972',
  rows: [
    { symbol: 'Li', value: 1.0 },
    { symbol: 'Na', value: 0.9 },
    { symbol: 'K', value: 0.8 },
    { symbol: 'Rb', value: 0.8 },
    { symbol: 'Cs', value: 0.7 },
    { symbol: 'F', value: 4.0 },
    { symbol: 'Cl', value: 3.0 },
    { symbol: 'Br', value: 2.8 },
    { symbol: 'I', value: 2.5 },
    { symbol: 'At', value: 2.2 },
  ],
}

/** One group column of Table 3.9: hydride and oxide formulas as printed. */
export interface ValenceTrendColumn {
  group: number
  hydrides: readonly string[]
  oxides: readonly string[]
}

/**
 * NCERT Table 3.9, Periodic Trends in Valence of Elements as shown by the Formulas of Their
 * Compounds (kech103-layout.txt line 1054; hydride column for group 2 at non-layout line 2294).
 * Entries are kept as printed, including the combined formulas such as "N2O3, N2O5".
 */
export const NCERT_TABLE_3_9_VALENCE_TRENDS: NcertTable<ValenceTrendColumn> = {
  source: 'NCERT Class 11 Part I, Unit 3, Table 3.9 (Periodic Trends in Valence), layout line 1054',
  rows: [
    { group: 1, hydrides: ['LiH', 'NaH', 'KH'], oxides: ['Li2O', 'Na2O', 'K2O'] },
    { group: 2, hydrides: ['CaH2'], oxides: ['MgO', 'CaO', 'SrO', 'BaO'] },
    { group: 13, hydrides: ['B2H6', 'AlH3'], oxides: ['B2O3', 'Al2O3', 'Ga2O3', 'In2O3'] },
    { group: 14, hydrides: ['CH4', 'SiH4', 'GeH4', 'SnH4'], oxides: ['CO2', 'SiO2', 'GeO2', 'SnO2', 'PbO2'] },
    {
      group: 15,
      hydrides: ['NH3', 'PH3', 'AsH3'],
      oxides: ['N2O3', 'N2O5', 'P4O6', 'P4O10', 'As2O3', 'As2O5', 'Sb2O3', 'Sb2O5', 'Bi2O3'],
    },
    { group: 16, hydrides: ['H2O', 'H2S', 'H2Se', 'H2Te'], oxides: ['SO3', 'SeO3', 'TeO3'] },
    { group: 17, hydrides: ['HF', 'HCl', 'HBr', 'HI'], oxides: ['Cl2O7'] },
  ],
}

/**
 * Ionization enthalpies printed in Problem 3.6 (kech103.txt line 1761): the third-period
 * values and NCERT's predicted value for aluminium.
 */
export const NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES: NcertTable<NcertEntry<number>> = {
  source: 'NCERT Class 11 Part I, Unit 3, Problem 3.6 (kech103.txt line 1761)',
  rows: [
    { symbol: 'Na', value: 496 },
    { symbol: 'Mg', value: 737 },
    { symbol: 'Si', value: 786 },
  ],
}

/** NCERT's answer to Problem 3.6: the value for Al is closer to 575 kJ mol⁻¹ than to 760. */
export const NCERT_PROBLEM_3_6_AL_PREDICTED_KJ_PER_MOL = 575
