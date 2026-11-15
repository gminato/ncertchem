/**
 * Values printed in NCERT Class 11 Part I, Unit 4 (Chemical Bonding and Molecular Structure),
 * 2026-27 reprint. Each table is transcribed exactly as printed, with the line number in the
 * pdftotext -layout rendering of the unit (kech104-layout.txt) so a reviewer can check it.
 * Where the text layer was damaged, the value was read from the page image instead; those
 * entries are noted at the point of use. NCERT's values are kept here even where standard
 * reference data differ, because students are examined on the printed numbers. Disagreements
 * are listed in the unit report and in the comments below.
 *
 * Symbols are used as keys. Resolve them to Z with `elementBySymbol` from periodic-data.ts.
 */

/** A printed table: its source citation and its rows in printed order. */
export interface NcertTable<T> {
  source: string
  rows: readonly T[]
}

/** One row of Table 4.2 (average bond lengths of single, double and triple bonds). */
export interface BondLengthRow {
  bond: string
  lengthPm: number
}

/** NCERT Table 4.2, Average Bond Lengths for Some Single, Double and Triple Bonds (layout line 555). */
export const NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS: NcertTable<BondLengthRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.2 (Average Bond Lengths for Some Single, Double and Triple Bonds), layout line 555',
  rows: [
    { bond: 'O–H', lengthPm: 96 },
    { bond: 'C–H', lengthPm: 107 },
    { bond: 'N–O', lengthPm: 136 },
    { bond: 'C–O', lengthPm: 143 },
    { bond: 'C–N', lengthPm: 143 },
    { bond: 'C–C', lengthPm: 154 },
    { bond: 'C=O', lengthPm: 121 },
    { bond: 'N=O', lengthPm: 122 },
    { bond: 'C=C', lengthPm: 133 },
    { bond: 'C=N', lengthPm: 128 },
    { bond: 'C≡N', lengthPm: 116 },
    { bond: 'C≡C', lengthPm: 120 },
  ],
}

/** One row of Table 4.3 (bond lengths in common molecules). */
export interface MoleculeBondLengthRow {
  molecule: string
  bond: string
  lengthPm: number
}

/** NCERT Table 4.3, Bond Lengths in Some Common Molecules (layout line 577). */
export const NCERT_TABLE_4_3_MOLECULE_BOND_LENGTHS: NcertTable<MoleculeBondLengthRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.3 (Bond Lengths in Some Common Molecules), layout line 577',
  rows: [
    { molecule: 'H2', bond: 'H – H', lengthPm: 74 },
    { molecule: 'F2', bond: 'F – F', lengthPm: 144 },
    { molecule: 'Cl2', bond: 'Cl – Cl', lengthPm: 199 },
    { molecule: 'Br2', bond: 'Br – Br', lengthPm: 228 },
    { molecule: 'I2', bond: 'I – I', lengthPm: 267 },
    { molecule: 'N2', bond: 'N ≡ N', lengthPm: 109 },
    { molecule: 'O2', bond: 'O = O', lengthPm: 121 },
    { molecule: 'HF', bond: 'H – F', lengthPm: 92 },
    { molecule: 'HCl', bond: 'H – Cl', lengthPm: 127 },
    { molecule: 'HBr', bond: 'H – Br', lengthPm: 141 },
    { molecule: 'HI', bond: 'H – I', lengthPm: 160 },
  ],
}

/**
 * One printed covalent radius in Table 4.4. `bondOrder` is 1 for the plain value and 2 or 3
 * for the values in parentheses. The table footnote says "The values cited are for single
 * bonds, except where otherwise indicated in parenthesis", so the parenthesised number is the
 * bond order the radius applies to.
 */
export interface CovalentRadiusEntry {
  symbol: string
  radiusPm: number
  bondOrder: 1 | 2 | 3
}

/**
 * NCERT Table 4.4, Covalent Radii, r_cov/pm (layout line 595; page image, book p. 108).
 * The printed layout is a periodic-table grid. Read from the page image because the text
 * layer drops the numbers. C, N and O have multiple-bond entries; S has one.
 */
export const NCERT_TABLE_4_4_COVALENT_RADII: NcertTable<CovalentRadiusEntry> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.4 (Covalent Radii, *rcov/pm), layout line 595',
  rows: [
    { symbol: 'H', radiusPm: 37, bondOrder: 1 },
    { symbol: 'C', radiusPm: 77, bondOrder: 1 },
    { symbol: 'C', radiusPm: 67, bondOrder: 2 },
    { symbol: 'C', radiusPm: 60, bondOrder: 3 },
    { symbol: 'N', radiusPm: 74, bondOrder: 1 },
    { symbol: 'N', radiusPm: 65, bondOrder: 2 },
    { symbol: 'N', radiusPm: 55, bondOrder: 3 },
    { symbol: 'O', radiusPm: 66, bondOrder: 1 },
    { symbol: 'O', radiusPm: 57, bondOrder: 2 },
    { symbol: 'F', radiusPm: 64, bondOrder: 1 },
    { symbol: 'Cl', radiusPm: 99, bondOrder: 1 },
    { symbol: 'Br', radiusPm: 114, bondOrder: 1 },
    { symbol: 'I', radiusPm: 133, bondOrder: 1 },
    { symbol: 'P', radiusPm: 110, bondOrder: 1 },
    { symbol: 'S', radiusPm: 104, bondOrder: 1 },
    { symbol: 'S', radiusPm: 95, bondOrder: 2 },
    { symbol: 'As', radiusPm: 121, bondOrder: 1 },
    { symbol: 'Se', radiusPm: 104, bondOrder: 1 },
    { symbol: 'Te', radiusPm: 137, bondOrder: 1 },
    { symbol: 'Sb', radiusPm: 141, bondOrder: 1 },
  ],
}

/** One row of Table 4.5 (dipole moments of selected molecules). */
export interface DipoleMomentRow {
  typeOfMolecule: string
  molecule: string
  /** Dipole moment in debye, as printed. */
  dipoleD: number
  geometry: string
}

/**
 * NCERT Table 4.5, Dipole Moments of Selected Molecules (layout line 865; page image, book
 * p. 112). The printed type column is shown once per group; each row carries its type.
 */
export const NCERT_TABLE_4_5_DIPOLE_MOMENTS: NcertTable<DipoleMomentRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.5 (Dipole Moments of Selected Molecules), layout line 865',
  rows: [
    { typeOfMolecule: 'AB', molecule: 'HF', dipoleD: 1.78, geometry: 'linear' },
    { typeOfMolecule: 'AB', molecule: 'HCl', dipoleD: 1.07, geometry: 'linear' },
    { typeOfMolecule: 'AB', molecule: 'HBr', dipoleD: 0.79, geometry: 'linear' },
    { typeOfMolecule: 'AB', molecule: 'HI', dipoleD: 0.38, geometry: 'linear' },
    { typeOfMolecule: 'AB', molecule: 'H2', dipoleD: 0, geometry: 'linear' },
    { typeOfMolecule: 'AB2', molecule: 'H2O', dipoleD: 1.85, geometry: 'bent' },
    { typeOfMolecule: 'AB2', molecule: 'H2S', dipoleD: 0.95, geometry: 'bent' },
    { typeOfMolecule: 'AB2', molecule: 'CO2', dipoleD: 0, geometry: 'linear' },
    { typeOfMolecule: 'AB3', molecule: 'NH3', dipoleD: 1.47, geometry: 'trigonal pyramidal' },
    { typeOfMolecule: 'AB3', molecule: 'NF3', dipoleD: 0.23, geometry: 'trigonal pyramidal' },
    { typeOfMolecule: 'AB3', molecule: 'BF3', dipoleD: 0, geometry: 'trigonal planar' },
    { typeOfMolecule: 'AB4', molecule: 'CH4', dipoleD: 0, geometry: 'tetrahedral' },
    { typeOfMolecule: 'AB4', molecule: 'CHCl3', dipoleD: 1.04, geometry: 'tetrahedral' },
    { typeOfMolecule: 'AB4', molecule: 'CCl4', dipoleD: 0, geometry: 'tetrahedral' },
  ],
}

/**
 * NCERT's text gives the dipole moments of NH3 and NF3 in SI units as 4.90 × 10⁻³⁰ C m and
 * 0.80 × 10⁻³⁰ C m (book p. 112, page image). 1 D = 3.336 × 10⁻³⁰ C m, so these are 1.47 D
 * and 0.24 D, consistent with Table 4.5 (0.23 D printed) to rounding.
 */
export const NCERT_NH3_NF3_DIPOLE_SI_1E30_CM: { NH3: number; NF3: number } = { NH3: 4.9, NF3: 0.8 }

/** One row of Table 4.6 (electron-pair geometry with no lone pair on the central atom). */
export interface NoLonePairGeometryRow {
  electronPairs: number
  arrangement: string
  molecularGeometry: string
  /** Bond angles printed in the figure, in degrees. */
  anglesDeg: readonly number[]
  examples: readonly string[]
}

/** NCERT Table 4.6, Geometry of Molecules with No Lone Pair on the Central Atom (layout line 970). */
export const NCERT_TABLE_4_6_NO_LONE_PAIR: NcertTable<NoLonePairGeometryRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.6 (Geometry of Molecules in which the Central Atom has No Lone Pair of Electrons), layout line 970',
  rows: [
    { electronPairs: 2, arrangement: 'Linear', molecularGeometry: 'Linear', anglesDeg: [180], examples: ['BeCl2', 'HgCl2'] },
    { electronPairs: 3, arrangement: 'Trigonal planar', molecularGeometry: 'Trigonal planar', anglesDeg: [120], examples: ['BF3'] },
    { electronPairs: 4, arrangement: 'Tetrahedral', molecularGeometry: 'Tetrahedral', anglesDeg: [109.5], examples: ['CH4', 'NH4+'] },
    { electronPairs: 5, arrangement: 'Trigonal bipyramidal', molecularGeometry: 'Trigonal bipyramidal', anglesDeg: [90, 120], examples: ['PCl5'] },
    { electronPairs: 6, arrangement: 'Octahedral', molecularGeometry: 'Octahedral', anglesDeg: [90], examples: ['SF6'] },
  ],
}

/** One row of Table 4.7 (shapes with one or more lone pairs on the central atom). */
export interface LonePairShapeRow {
  /** Molecule type in AB notation, as printed. */
  moleculeType: string
  bondingPairs: number
  lonePairs: number
  /** Arrangement of electron pairs as printed in the figure. */
  arrangement: string
  shape: string
  examples: readonly string[]
}

/**
 * NCERT Table 4.7, Shape (geometry) of Some Simple Molecules/Ions with Central Atoms having
 * One or More Lone Pairs of Electrons (layout line 984; page image, book p. 115).
 *
 * The SO₂ entry is printed with an unusual typesetting (a superscript 2 between S-O and an
 * O₃ subscript); it is read here as SO₂, the standard example for this row. Table 4.8 uses
 * the same molecule with an AB₂E arrangement and 119.5°. Flagged in the unit report.
 */
export const NCERT_TABLE_4_7_LONE_PAIR_SHAPES: NcertTable<LonePairShapeRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.7 (Shape of Some Simple Molecules/Ions with Central Atoms having Lone Pairs), layout line 984',
  rows: [
    { moleculeType: 'AB2E', bondingPairs: 2, lonePairs: 1, arrangement: 'Trigonal planar', shape: 'Bent', examples: ['SO2'] },
    { moleculeType: 'AB3E', bondingPairs: 3, lonePairs: 1, arrangement: 'Tetrahedral', shape: 'Trigonal pyramidal', examples: ['NH3'] },
    { moleculeType: 'AB2E2', bondingPairs: 2, lonePairs: 2, arrangement: 'Tetrahedral', shape: 'Bent', examples: ['H2O'] },
    { moleculeType: 'AB4E', bondingPairs: 4, lonePairs: 1, arrangement: 'Trigonal bipyramidal', shape: 'See saw', examples: ['SF4'] },
    { moleculeType: 'AB3E2', bondingPairs: 3, lonePairs: 2, arrangement: 'Trigonal bipyramidal', shape: 'T-shape', examples: ['ClF3'] },
    { moleculeType: 'AB5E', bondingPairs: 5, lonePairs: 1, arrangement: 'Octahedral', shape: 'Square pyramid', examples: ['BrF5'] },
    { moleculeType: 'AB4E2', bondingPairs: 4, lonePairs: 2, arrangement: 'Octahedral', shape: 'Square planar', examples: ['XeF4'] },
  ],
}

/**
 * One row of Table 4.8 (bond pairs and lone pairs, with the reason for the printed shape).
 * `reasonAngleDeg` is the angle NCERT gives for the shape and `idealAngleDeg` the angle it
 * says it is reduced from.
 */
export interface LonePairReasonRow {
  moleculeType: string
  bondingPairs: number
  lonePairs: number
  shape: string
  example: string
  reasonAngleDeg: number | null
  idealAngleDeg: number | null
}

/**
 * NCERT Table 4.8, Shapes of Molecules containing Bond Pair and Lone Pair (layout line 999;
 * page image, book p. 116). The printed "4" bonding pairs for AB₂E counts each double bond
 * of SO₂ as two pairs; Table 4.7 gives 2 for the same row. Both are kept as printed.
 */
export const NCERT_TABLE_4_8_REASONS: NcertTable<LonePairReasonRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Table 4.8 (Shapes of Molecules containing Bond Pair and Lone Pair), layout line 999',
  rows: [
    { moleculeType: 'AB2E', bondingPairs: 4, lonePairs: 1, shape: 'Bent', example: 'SO2', reasonAngleDeg: 119.5, idealAngleDeg: 120 },
    { moleculeType: 'AB3E', bondingPairs: 3, lonePairs: 1, shape: 'Trigonal pyramidal', example: 'NH3', reasonAngleDeg: 107, idealAngleDeg: 109.5 },
    { moleculeType: 'AB2E2', bondingPairs: 2, lonePairs: 2, shape: 'Bent', example: 'H2O', reasonAngleDeg: 104.5, idealAngleDeg: 109.5 },
    { moleculeType: 'AB4E', bondingPairs: 4, lonePairs: 1, shape: 'See-saw', example: 'SF4', reasonAngleDeg: null, idealAngleDeg: null },
  ],
}

/** A bond enthalpy or energy quoted in NCERT's running text, with its location. */
export interface PrintedQuantity {
  label: string
  value: number
  unit: string
  /** Layout line in kech104-layout.txt (or the page the value was read from, if noted). */
  where: string
}

/**
 * Bond enthalpies and related energies quoted in NCERT's text (Section 4.3.3 and 4.2.1).
 * Values are as printed.
 */
export const NCERT_TEXT_ENTHALPIES: readonly PrintedQuantity[] = [
  { label: 'H–H bond enthalpy, H2(g) → 2H(g)', value: 435.8, unit: 'kJ mol⁻¹', where: 'layout line 592' },
  { label: 'O=O bond enthalpy, O2(g) → 2O(g)', value: 498, unit: 'kJ mol⁻¹', where: 'layout line 598' },
  { label: 'N≡N bond enthalpy, N2(g) → 2N(g)', value: 946.0, unit: 'kJ mol⁻¹', where: 'layout line 600 (text); Fig. 4.21 prints 945' },
  { label: 'H–Cl bond enthalpy, HCl(g) → H(g) + Cl(g)', value: 431.0, unit: 'kJ mol⁻¹', where: 'layout line 605' },
  { label: 'H2O(g) → H(g) + OH(g), first O–H', value: 502, unit: 'kJ mol⁻¹', where: 'book p. 109 (page image)' },
  { label: 'OH(g) → H(g) + O(g), second O–H', value: 427, unit: 'kJ mol⁻¹', where: 'book p. 109 (page image)' },
  { label: 'Average O–H bond enthalpy in water, (502 + 427)/2', value: 464.5, unit: 'kJ mol⁻¹', where: 'book p. 109 (page image)' },
]

/**
 * Bond lengths and bond-order facts quoted in NCERT's text (Section 4.3.4 and 4.3.5), book p. 109.
 */
export const NCERT_TEXT_BOND_LENGTHS: readonly PrintedQuantity[] = [
  { label: 'Normal O–O single bond', value: 148, unit: 'pm', where: 'book p. 109 (page image)' },
  { label: 'Normal O=O double bond', value: 121, unit: 'pm', where: 'book p. 109 (page image)' },
  { label: 'O–O bond in O3 (both bonds)', value: 128, unit: 'pm', where: 'book p. 109 (page image)' },
]

/** NaCl lattice enthalpy as printed in Section 4.2.1 (book p. 107). */
export const NCERT_NACL_LATTICE_ENTHALPY_KJ = 788

/**
 * Enthalpy steps for NaCl quoted in NCERT's text (Section 4.2, book p. 106 page image).
 * Ionisation enthalpy of Na(g), electron gain enthalpy of Cl(g), and their sum.
 */
export const NCERT_NACL_STEPS: readonly PrintedQuantity[] = [
  { label: 'Ionisation enthalpy, Na(g) → Na⁺(g) + e⁻', value: 495.8, unit: 'kJ mol⁻¹', where: 'book p. 106 (page image)' },
  { label: 'Electron gain enthalpy, Cl(g) + e⁻ → Cl⁻(g)', value: -348.7, unit: 'kJ mol⁻¹', where: 'book p. 106 (page image)' },
  { label: 'Sum of the two steps above, as printed', value: 147.1, unit: 'kJ mol⁻¹', where: 'book p. 106 (page image)' },
]

/** One homonuclear diatomic from NCERT Fig. 4.21 (MO occupancy and molecular properties). */
export interface MoDataRow {
  species: string
  /** Bond energy from the bar chart, kJ mol⁻¹, when a bar is drawn. */
  bondEnergyKj: number | null
  /** Bond length from the bar chart, pm, when a bar is drawn. */
  bondLengthPm: number | null
  bondOrder: number
  magnetism: 'Paramagnetic' | 'Diamagnetic' | null
  /** Valence electron configuration as printed. */
  valenceConfiguration: string
  /** Whether the species is drawn with 2s–2p mixing (left half of the figure). */
  withMixing: boolean
}

/**
 * NCERT Fig. 4.21, MO occupancy and molecular properties for B₂ through Ne₂ (layout line 1922;
 * page image, book p. 131). Values are read from the figure. Ne₂ has no bar (bond order 0).
 */
export const NCERT_FIG_4_21_MO_DATA: NcertTable<MoDataRow> = {
  source: 'NCERT Class 11 Part I, Unit 4, Fig. 4.21 (MO occupancy and molecular properties for B2 through Ne2), layout line 1922',
  rows: [
    {
      species: 'B2', bondEnergyKj: 290, bondLengthPm: 159, bondOrder: 1, magnetism: 'Paramagnetic',
      valenceConfiguration: '(π2p)²', withMixing: true,
    },
    {
      species: 'C2', bondEnergyKj: 620, bondLengthPm: 131, bondOrder: 2, magnetism: 'Diamagnetic',
      valenceConfiguration: '(π2p)⁴', withMixing: true,
    },
    {
      species: 'N2', bondEnergyKj: 945, bondLengthPm: 110, bondOrder: 3, magnetism: 'Diamagnetic',
      valenceConfiguration: '(π2p)⁴(σ2p)²', withMixing: true,
    },
    {
      species: 'O2', bondEnergyKj: 498, bondLengthPm: 121, bondOrder: 2, magnetism: 'Paramagnetic',
      valenceConfiguration: '(σ2p)²(π2p)⁴(π*2p)²', withMixing: false,
    },
    {
      species: 'F2', bondEnergyKj: 159, bondLengthPm: 143, bondOrder: 1, magnetism: 'Diamagnetic',
      valenceConfiguration: '(σ2p)²(π2p)⁴(π*2p)⁴', withMixing: false,
    },
    {
      species: 'Ne2', bondEnergyKj: null, bondLengthPm: null, bondOrder: 0, magnetism: null,
      valenceConfiguration: '(σ2p)²(π2p)⁴(π*2p)⁴(σ*2p)²', withMixing: false,
    },
  ],
}

/**
 * Notes on NCERT values that differ from standard reference data. These are kept in the
 * tables above as printed. The standard figures are recalled from common reference tables and
 * were not re-checked against a source in this session, so each one needs verifying before it
 * is shown to a Learner.
 */
export const NCERT_VS_STANDARD_NOTES: readonly string[] = [
  'Table 4.3: F2 bond length 144 pm (standard about 141 pm).',
  'Table 4.2: N=O 122 pm (standard about 115 pm); C–N single 143 pm (standard about 147 pm).',
  'Table 4.4: several radii follow an older single-bond set and differ from modern tables (e.g. H 37 pm vs about 31 pm; N 74 pm vs about 71 pm; F 64 pm vs about 57 pm; Cl 99 pm vs about 102 pm; Br 114 pm vs about 120 pm; I 133 pm vs about 139 pm).',
  'Table 4.5: HF 1.78 D (standard about 1.82); HCl 1.07 D (about 1.08); HBr 0.79 D (about 0.82); HI 0.38 D (about 0.45); H2S 0.95 D (about 0.97).',
  'Section 4.3.3 / 4.3.4: H2O O–H step enthalpies 502 and 427 kJ mol⁻¹ (standard about 499 and 428 kJ mol⁻¹).',
  'Section 4.3.3: H–H bond enthalpy 435.8 kJ mol⁻¹ (standard about 436 kJ mol⁻¹); HCl 431.0 kJ mol⁻¹ (standard about 431.6 kJ mol⁻¹).',
  'Fig. 4.21: C2 bond energy 620 kJ mol⁻¹ and bond length 131 pm (standard about 602 kJ mol⁻¹ and 124 pm).',
  'Fig. 4.21: F2 bond length 143 pm (standard about 141 pm).',
  'Section 4.3.4 says N2 bond enthalpy 946.0 kJ mol⁻¹; Fig. 4.21 prints 945 for the same molecule. This is an internal NCERT inconsistency, not a standard-data difference.',
]
