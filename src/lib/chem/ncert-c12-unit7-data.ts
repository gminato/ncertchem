/**
 * Class 12 Unit 7 (Alcohols, Phenols and Ethers): the data every Section of the Unit shares.
 *
 * Lead-owned. NCERT's tabulated data and the facts it states (conditions, products, geometries)
 * may be shown and plotted (ADR-0001); NCERT's worked Examples (7.1–7.7), Intext questions
 * (7.1–7.12) and Exercises are excluded. Every number and condition here comes directly from
 * NCERT Class 12 Chemistry Unit 7 (Reprint 2026-27, pp. 193–221).
 *
 * Formulas: `unicode` is for SVG and UI text (real subscripts/superscripts, U+2212 minus where
 * ionic/negative); `ce` is the mhchem source for Prose (`$\ce{...}$`); `smiles` is Kekulé SMILES
 * for `parseSmiles` (the parser does not read aromatic lower-case atoms: benzene is C1=CC=CC=C1).
 */

// ---------------------------------------------------------------------------------------------
// Nomenclature: Table 7.1 (Alcohols), Section 7.2(a)/(b) (Cyclic & Phenols), Table 7.2 (Ethers)
// ---------------------------------------------------------------------------------------------

export interface NcertCompoundName {
  unicode: string
  ce: string
  smiles: string
  /** Common name as NCERT prints it, or null where NCERT prints "—" (no common name listed). */
  common: string | null
  /** Alternative or parenthetical common name printed by NCERT (e.g. "Anisole", "Quinol"). */
  commonAlt?: string
  /** IUPAC name as NCERT prints it (stray PDF hyphenation/spaces cleaned; noted below). */
  iupac: string
  /** Accepted alternative or retained IUPAC name printed by NCERT (e.g. "Anisole"). */
  iupacAlt?: string
}

/** Table 7.1: Common and IUPAC Names of Some Alcohols (NCERT p. 196). */
export const NCERT_TABLE_7_1: readonly NcertCompoundName[] = [
  { unicode: 'CH₃OH', ce: 'CH3OH', smiles: 'CO', common: 'Methyl alcohol', iupac: 'Methanol' },
  { unicode: 'CH₃CH₂CH₂OH', ce: 'CH3CH2CH2OH', smiles: 'CCCO', common: 'n-Propyl alcohol', iupac: 'Propan-1-ol' },
  { unicode: 'CH₃CH(OH)CH₃', ce: 'CH3CH(OH)CH3', smiles: 'CC(O)C', common: 'Isopropyl alcohol', iupac: 'Propan-2-ol' },
  { unicode: 'CH₃CH₂CH₂CH₂OH', ce: 'CH3CH2CH2CH2OH', smiles: 'CCCCO', common: 'n-Butyl alcohol', iupac: 'Butan-1-ol' },
  { unicode: 'CH₃CH(OH)CH₂CH₃', ce: 'CH3CH(OH)CH2CH3', smiles: 'CCC(O)C', common: 'sec-Butyl alcohol', iupac: 'Butan-2-ol' },
  { unicode: 'CH₃CH(CH₃)CH₂OH', ce: 'CH3CH(CH3)CH2OH', smiles: 'CC(C)CO', common: 'Isobutyl alcohol', iupac: '2-Methylpropan-1-ol' },
  { unicode: '(CH₃)₃COH', ce: '(CH3)3COH', smiles: 'CC(C)(C)O', common: 'tert-Butyl alcohol', iupac: '2-Methylpropan-2-ol' },
  { unicode: 'HOCH₂CH₂OH', ce: 'HOCH2CH2OH', smiles: 'OCCO', common: 'Ethylene glycol', iupac: 'Ethane-1,2-diol' },
  { unicode: 'CH₂(OH)CH(OH)CH₂OH', ce: 'CH2(OH)CH(OH)CH2OH', smiles: 'OCC(O)CO', common: 'Glycerol', iupac: 'Propane-1,2,3-triol' },
] as const

/** Section 7.2(a): Cyclic alcohols printed right below Table 7.1 (NCERT p. 196). */
export const NCERT_CYCLIC_ALCOHOLS: readonly NcertCompoundName[] = [
  { unicode: 'C₆H₁₁OH', ce: 'C6H11OH', smiles: 'OC1CCCCC1', common: null, iupac: 'Cyclohexanol' },
  { unicode: 'CH₃C₅H₈OH', ce: 'CH3C5H8OH', smiles: 'CC1CCCC1O', common: null, iupac: '2-Methylcyclopentanol' },
] as const

/** Section 7.2(b): Phenols and dihydroxybenzenes named in nomenclature text (NCERT p. 197). */
export const NCERT_PHENOL_NAMES: readonly NcertCompoundName[] = [
  { unicode: 'C₆H₅OH', ce: 'C6H5OH', smiles: 'OC1=CC=CC=C1', common: 'Phenol', iupac: 'Phenol' },
  { unicode: 'o-CH₃C₆H₄OH', ce: 'o-CH3C6H4OH', smiles: 'CC1=CC=CC=C1O', common: 'o-Cresol', iupac: '2-Methylphenol' },
  { unicode: 'm-CH₃C₆H₄OH', ce: 'm-CH3C6H4OH', smiles: 'CC1=CC=CC(O)=C1', common: 'm-Cresol', iupac: '3-Methylphenol' },
  { unicode: 'p-CH₃C₆H₄OH', ce: 'p-CH3C6H4OH', smiles: 'CC1=CC=C(O)C=C1', common: 'p-Cresol', iupac: '4-Methylphenol' },
  { unicode: 'o-C₆H₄(OH)₂', ce: 'o-C6H4(OH)2', smiles: 'OC1=CC=CC=C1O', common: 'Catechol', iupac: 'Benzene-1,2-diol' },
  { unicode: 'm-C₆H₄(OH)₂', ce: 'm-C6H4(OH)2', smiles: 'OC1=CC=CC(O)=C1', common: 'Resorcinol', iupac: 'Benzene-1,3-diol' },
  { unicode: 'p-C₆H₄(OH)₂', ce: 'p-C6H4(OH)2', smiles: 'OC1=CC=C(O)C=C1', common: 'Hydroquinone', commonAlt: 'Quinol', iupac: 'Benzene-1,4-diol' },
] as const

/** Table 7.2: Common and IUPAC Names of Some Ethers (NCERT p. 197). */
export const NCERT_TABLE_7_2: readonly NcertCompoundName[] = [
  { unicode: 'CH₃OCH₃', ce: 'CH3OCH3', smiles: 'COC', common: 'Dimethyl ether', iupac: 'Methoxymethane' },
  { unicode: 'C₂H₅OC₂H₅', ce: 'C2H5OC2H5', smiles: 'CCOCC', common: 'Diethyl ether', iupac: 'Ethoxyethane' },
  { unicode: 'CH₃OCH₂CH₂CH₃', ce: 'CH3OCH2CH2CH3', smiles: 'COCCC', common: 'Methyl n-propyl ether', iupac: '1-Methoxypropane' },
  { unicode: 'C₆H₅OCH₃', ce: 'C6H5OCH3', smiles: 'COC1=CC=CC=C1', common: 'Methyl phenyl ether', commonAlt: 'Anisole', iupac: 'Methoxybenzene', iupacAlt: 'Anisole' },
  { unicode: 'C₆H₅OCH₂CH₃', ce: 'C6H5OCH2CH3', smiles: 'CCOC1=CC=CC=C1', common: 'Ethyl phenyl ether', commonAlt: 'Phenetole', iupac: 'Ethoxybenzene' },
  { unicode: 'C₆H₅O(CH₂)₆CH₃', ce: 'C6H5O(CH2)6CH3', smiles: 'CCCCCCCOC1=CC=CC=C1', common: 'Heptyl phenyl ether', iupac: '1-Phenoxyheptane' },
  { unicode: 'CH₃OCH(CH₃)₂', ce: 'CH3OCH(CH3)2', smiles: 'COC(C)C', common: 'Methyl isopropyl ether', iupac: '2-Methoxypropane' },
  { unicode: 'C₆H₅OCH₂CH₂CH(CH₃)₂', ce: 'C6H5OCH2CH2CH(CH3)2', smiles: 'CC(C)CCOC1=CC=CC=C1', common: 'Phenyl isopentyl ether', iupac: '3-Methylbutoxybenzene', iupacAlt: '(3-Methylbutoxy)benzene' },
  { unicode: 'CH₃OCH₂CH₂OCH₃', ce: 'CH3OCH2CH2OCH3', smiles: 'COCCOC', common: null, iupac: '1,2-Dimethoxyethane' },
  { unicode: 'C₂H₅O–C₆H₉(CH₃)₂', ce: 'C2H5OC6H9(CH3)2', smiles: 'CCOC1CCCCC1(C)C', common: null, iupac: '2-Ethoxy-1,1-dimethylcyclohexane' },
] as const

// ---------------------------------------------------------------------------------------------
// Section 7.3 / Fig. 7.1: Structures of methanol, phenol and methoxymethane (NCERT pp. 198–199)
// ---------------------------------------------------------------------------------------------

/** Ideal tetrahedral angle cited by NCERT 7.3 as 109°-28′ (109.47°). */
export const TETRAHEDRAL_ANGLE = {
  printed: '109°28′',
  deg: 109 + 28 / 60,
} as const

export interface FunctionalGroupGeometry {
  id: 'methanol' | 'phenol' | 'methoxymethane'
  name: string
  unicode: string
  ce: string
  smiles: string
  carbonHybridisation: 'sp³' | 'sp²'
  coBondLengthPm: number
  /** Printed in Fig. 7.1 only for methanol (96 pm); omitted for phenol and N/A for methoxymethane. */
  ohBondLengthPm: number | null
  bondAngleLabel: 'C–O–H' | 'C–O–C'
  bondAngleDeg: number
  explanation: string
}

/**
 * Exact bond lengths (pm) and bond angles (degrees) printed in Fig. 7.1 (p. 198) and
 * discussed in Section 7.3 (p. 199).
 */
export const NCERT_FIG_7_1_STRUCTURES: readonly FunctionalGroupGeometry[] = [
  {
    id: 'methanol',
    name: 'Methanol',
    unicode: 'CH₃OH',
    ce: 'CH3OH',
    smiles: 'CO',
    carbonHybridisation: 'sp³',
    coBondLengthPm: 142,
    ohBondLengthPm: 96,
    bondAngleLabel: 'C–O–H',
    bondAngleDeg: 108.9,
    explanation: 'Slightly less than the tetrahedral angle (109°28′) due to repulsion between the two unshared electron pairs on oxygen.',
  },
  {
    id: 'phenol',
    name: 'Phenol',
    unicode: 'C₆H₅OH',
    ce: 'C6H5OH',
    smiles: 'OC1=CC=CC=C1',
    carbonHybridisation: 'sp²',
    coBondLengthPm: 136,
    ohBondLengthPm: null,
    bondAngleLabel: 'C–O–H',
    bondAngleDeg: 109,
    explanation: 'C–O bond (136 pm) is shorter than in methanol (142 pm) due to partial double-bond character from conjugation of oxygen lone pair with the aromatic ring and sp² hybridisation of ring carbon.',
  },
  {
    id: 'methoxymethane',
    name: 'Methoxymethane',
    unicode: 'CH₃OCH₃',
    ce: 'CH3OCH3',
    smiles: 'COC',
    carbonHybridisation: 'sp³',
    coBondLengthPm: 141,
    ohBondLengthPm: null,
    bondAngleLabel: 'C–O–C',
    bondAngleDeg: 111.7,
    explanation: 'C–O–C angle (111.7°) is slightly greater than the tetrahedral angle due to repulsive interaction between the two bulky alkyl (–R) groups; C–O length (141 pm) is nearly the same as in alcohols.',
  },
] as const

// ---------------------------------------------------------------------------------------------
// Sections 7.4.3, 7.5 & 7.6.2: Physical properties (NCERT pp. 203–204, 214, 217)
// ---------------------------------------------------------------------------------------------

/** Normal boiling points of methanol and ethanol printed in Section 7.5 (p. 214) and 7.4.3 (p. 204). */
export const NCERT_COMMERCIAL_ALCOHOL_BP_K = {
  methanol: 337,
  ethanol: 351,
} as const

export interface BoilingPointComparisonEntry {
  name: string
  compoundClass: 'alcohol' | 'ether' | 'alkane'
  unicode: string
  ce: string
  smiles: string
  /** Printed molecular mass where given in 7.4.3 (46, 46, 44); null in 7.6.2 where only b.p. is printed. */
  molecularMass: number | null
  bpK: number
  printedBp: string
  section: '7.4.3' | '7.6.2'
}

/**
 * Section 7.4.3 (p. 204): comparable molecular-mass comparison showing intermolecular
 * H-bonding raises the boiling point of ethanol far above methoxymethane and propane.
 */
export const NCERT_7_4_3_BOILING_COMPARISON: readonly BoilingPointComparisonEntry[] = [
  { name: 'Ethanol', compoundClass: 'alcohol', unicode: 'CH₃CH₂OH', ce: 'CH3CH2OH', smiles: 'CCO', molecularMass: 46, bpK: NCERT_COMMERCIAL_ALCOHOL_BP_K.ethanol, printedBp: '351', section: '7.4.3' },
  { name: 'Methoxymethane', compoundClass: 'ether', unicode: 'CH₃OCH₃', ce: 'CH3OCH3', smiles: 'COC', molecularMass: 46, bpK: 248, printedBp: '248', section: '7.4.3' },
  { name: 'Propane', compoundClass: 'alkane', unicode: 'CH₃CH₂CH₃', ce: 'CH3CH2CH3', smiles: 'CCC', molecularMass: 44, bpK: 231, printedBp: '231', section: '7.4.3' },
] as const

/**
 * Section 7.6.2 (p. 217): boiling point comparison of an alkane, ether and alcohol of
 * comparable molar mass (n-pentane vs ethoxyethane vs butan-1-ol).
 */
export const NCERT_7_6_2_BOILING_COMPARISON: readonly BoilingPointComparisonEntry[] = [
  { name: 'n-Pentane', compoundClass: 'alkane', unicode: 'CH₃(CH₂)₃CH₃', ce: 'CH3(CH2)3CH3', smiles: 'CCCCC', molecularMass: null, bpK: 309.1, printedBp: '309.1', section: '7.6.2' },
  { name: 'Ethoxyethane', compoundClass: 'ether', unicode: 'C₂H₅OC₂H₅', ce: 'C2H5OC2H5', smiles: 'CCOCC', molecularMass: null, bpK: 307.6, printedBp: '307.6', section: '7.6.2' },
  { name: 'Butan-1-ol', compoundClass: 'alcohol', unicode: 'CH₃(CH₂)₃OH', ce: 'CH3(CH2)3OH', smiles: 'CCCCO', molecularMass: null, bpK: 390, printedBp: '390', section: '7.6.2' },
] as const

/** All 7 compounds whose boiling points are numerically printed in Unit 7 (7.4.3, 7.5, 7.6.2). */
export const NCERT_UNIT7_BOILING_POINTS_K = [
  { name: 'Methanol', compoundClass: 'alcohol' as const, unicode: 'CH₃OH', ce: 'CH3OH', smiles: 'CO', bpK: NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol, printedBp: '337', section: '7.5' as const },
  ...NCERT_7_4_3_BOILING_COMPARISON.map(({ name, compoundClass, unicode, ce, smiles, bpK, printedBp, section }) => ({ name, compoundClass, unicode, ce, smiles, bpK, printedBp, section })),
  ...NCERT_7_6_2_BOILING_COMPARISON.map(({ name, compoundClass, unicode, ce, smiles, bpK, printedBp, section }) => ({ name, compoundClass, unicode, ce, smiles, bpK, printedBp, section })),
] as const

export interface WaterMiscibilityEntry {
  name: string
  compoundClass: 'ether' | 'alcohol' | 'alkane'
  unicode: string
  ce: string
  smiles: string
  /** Solubility in g per 100 mL water, or null where NCERT states "essentially immiscible". */
  gPer100MlWater: number | null
  printed: string
  hBondsWithWater: boolean
}

/** Section 7.6.2 (p. 217): miscibility with water for ethoxyethane, butan-1-ol and n-pentane. */
export const NCERT_7_6_2_WATER_MISCIBILITY: readonly WaterMiscibilityEntry[] = [
  { name: 'Ethoxyethane', compoundClass: 'ether', unicode: 'C₂H₅OC₂H₅', ce: 'C2H5OC2H5', smiles: 'CCOCC', gPer100MlWater: 7.5, printed: '7.5 g per 100 mL water', hBondsWithWater: true },
  { name: 'Butan-1-ol', compoundClass: 'alcohol', unicode: 'CH₃(CH₂)₃OH', ce: 'CH3(CH2)3OH', smiles: 'CCCCO', gPer100MlWater: 9, printed: '9 g per 100 mL water', hBondsWithWater: true },
  { name: 'n-Pentane', compoundClass: 'alkane', unicode: 'CH₃(CH₂)₃CH₃', ce: 'CH3(CH2)3CH3', smiles: 'CCCCC', gPer100MlWater: null, printed: 'essentially immiscible', hBondsWithWater: false },
] as const

// ---------------------------------------------------------------------------------------------
// Table 7.3 & Section 7.4.4(a): pKa values and acidity orders (NCERT pp. 205–207)
// ---------------------------------------------------------------------------------------------

export interface PkaEntry {
  name: string
  unicode: string
  ce: string
  smiles: string
  pKa: number
  /** Exact decimal format printed in Table 7.3 (e.g. "10.0"). */
  printed: string
  group: 'nitrophenol' | 'phenol' | 'cresol' | 'alcohol'
}

/** Table 7.3: pKa Values of some Phenols and Ethanol (NCERT p. 207). */
export const NCERT_TABLE_7_3: readonly PkaEntry[] = [
  { name: 'o-Nitrophenol', unicode: 'o-O₂N–C₆H₄–OH', ce: 'o-O2N-C6H4-OH', smiles: 'OC1=CC=CC=C1[N+](=O)[O-]', pKa: 7.2, printed: '7.2', group: 'nitrophenol' },
  { name: 'm-Nitrophenol', unicode: 'm-O₂N–C₆H₄–OH', ce: 'm-O2N-C6H4-OH', smiles: 'OC1=CC=CC(=C1)[N+](=O)[O-]', pKa: 8.3, printed: '8.3', group: 'nitrophenol' },
  { name: 'p-Nitrophenol', unicode: 'p-O₂N–C₆H₄–OH', ce: 'p-O2N-C6H4-OH', smiles: 'OC1=CC=C(C=C1)[N+](=O)[O-]', pKa: 7.1, printed: '7.1', group: 'nitrophenol' },
  { name: 'Phenol', unicode: 'C₆H₅–OH', ce: 'C6H5-OH', smiles: 'OC1=CC=CC=C1', pKa: 10.0, printed: '10.0', group: 'phenol' },
  { name: 'o-Cresol', unicode: 'o-CH₃–C₆H₄–OH', ce: 'o-CH3-C6H4-OH', smiles: 'CC1=CC=CC=C1O', pKa: 10.2, printed: '10.2', group: 'cresol' },
  { name: 'm-Cresol', unicode: 'm-CH₃C₆H₄–OH', ce: 'm-CH3C6H4-OH', smiles: 'CC1=CC=CC(O)=C1', pKa: 10.1, printed: '10.1', group: 'cresol' },
  { name: 'p-Cresol', unicode: 'p-CH₃–C₆H₄–OH', ce: 'p-CH3-C6H4-OH', smiles: 'CC1=CC=C(O)C=C1', pKa: 10.2, printed: '10.2', group: 'cresol' },
  { name: 'Ethanol', unicode: 'C₂H₅OH', ce: 'C2H5OH', smiles: 'CCO', pKa: 15.9, printed: '15.9', group: 'alcohol' },
] as const

/** Acidity and reactivity trends explicitly stated in NCERT Unit 7. */
export const NCERT_UNIT7_ORDERS = {
  /** Section 7.4.4(a)(ii), p. 205: +I effect of alkyl groups lowers O–H polarity. */
  alcoholAcidity: 'Primary > Secondary ≫ Tertiary',
  /** Section 7.4.4(a)(ii)–(iii), pp. 206–207. */
  bronstedAcidStrength: 'Phenols > Water > Alcohols',
  /** Section 7.4.4(b)(3), p. 209: ease of dehydration mirrors carbocation stability. */
  alcoholDehydrationEase: 'Tertiary > Secondary > Primary',
  /** Section 7.6.3(1), p. 217: cleavage of ethers by hydrogen halides. */
  etherCleavageHX: 'HI > HBr > HCl',
} as const

// ---------------------------------------------------------------------------------------------
// Reaction conditions, catalysts, temperatures, reagents and products (Sections 7.4–7.6)
// ---------------------------------------------------------------------------------------------

export interface ReactionConditionRecord {
  id: string
  section: '7.4.1' | '7.4.2' | '7.4.4' | '7.5' | '7.6.1' | '7.6.3'
  title: string
  substrate: string
  reagents: string
  catalyst: string | null
  temperatureK: number | [number, number] | null
  pressureAtm: number | [number, number] | null
  conditions: string
  majorProducts: string
  byProducts?: string
  note?: string
}

/** Section 7.4.1: Preparation of Alcohols (NCERT pp. 199–201). */
export const NCERT_7_4_1_ALCOHOL_PREP: readonly ReactionConditionRecord[] = [
  {
    id: 'alkene-acid-hydration',
    section: '7.4.1',
    title: 'Acid-catalysed hydration of alkenes',
    substrate: 'Alkene (e.g. CH₃CH=CH₂)',
    reagents: 'H₂O',
    catalyst: 'H⁺ (acid, e.g. H₂SO₄)',
    temperatureK: null,
    pressureAtm: null,
    conditions: 'H₂O / H⁺ (Markovnikov addition via carbocation)',
    majorProducts: 'Alcohol (e.g. Propan-2-ol)',
  },
  {
    id: 'hydroboration-oxidation',
    section: '7.4.1',
    title: 'Hydroboration–oxidation',
    substrate: 'Alkene (e.g. CH₃CH=CH₂)',
    reagents: '(i) (BH₃)₂ (diborane)  (ii) 3 H₂O₂, OH⁻, H₂O',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) (BH₃)₂  (ii) H₂O₂ / aq. NaOH (anti-Markovnikov hydration)',
    majorProducts: 'Alcohol (e.g. Propan-1-ol)',
    byProducts: 'B(OH)₃',
  },
  {
    id: 'carbonyl-catalytic-hydrogenation',
    section: '7.4.1',
    title: 'Catalytic hydrogenation of aldehydes and ketones',
    substrate: 'Aldehyde (RCHO) or ketone (RCOR′)',
    reagents: 'H₂',
    catalyst: 'Finely divided Pt, Pd or Ni',
    temperatureK: null,
    pressureAtm: null,
    conditions: 'H₂, Pt / Pd / Ni',
    majorProducts: '1° alcohol from aldehyde (RCH₂OH); 2° alcohol from ketone (RCH(OH)R′)',
  },
  {
    id: 'carbonyl-hydride-reduction',
    section: '7.4.1',
    title: 'Hydride reduction of aldehydes and ketones',
    substrate: 'Aldehyde (RCHO) or ketone (RCOR′)',
    reagents: 'NaBH₄ or LiAlH₄',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'NaBH₄ or LiAlH₄',
    majorProducts: '1° alcohol from aldehyde; 2° alcohol from ketone',
  },
  {
    id: 'carboxylic-acid-lialh4',
    section: '7.4.1',
    title: 'Reduction of carboxylic acids with LiAlH₄',
    substrate: 'Carboxylic acid (RCOOH)',
    reagents: '(i) LiAlH₄  (ii) H₂O',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) LiAlH₄  (ii) H₂O (laboratory/special chemicals)',
    majorProducts: 'Primary alcohol (RCH₂OH)',
  },
  {
    id: 'carboxylic-acid-commercial-ester-route',
    section: '7.4.1',
    title: 'Commercial reduction of carboxylic acids via esters',
    substrate: 'Carboxylic acid (RCOOH)',
    reagents: '(i) R′OH  (ii) H₂',
    catalyst: '(i) H⁺  (ii) hydrogenation catalyst',
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) R′OH / H⁺ → RCOOR′  (ii) H₂ / Catalyst',
    majorProducts: 'Primary alcohol (RCH₂OH)',
    byProducts: 'R′OH',
  },
  {
    id: 'grignard-carbonyl',
    section: '7.4.1',
    title: 'Addition of Grignard reagents to aldehydes and ketones',
    substrate: 'HCHO / RCHO / RCOR',
    reagents: '(i) RMgX (or R′MgX)  (ii) H₂O',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) Grignard reagent (adduct formation)  (ii) H₂O hydrolysis',
    majorProducts: 'HCHO → 1° alcohol; other RCHO → 2° alcohol; RCOR → 3° alcohol',
    byProducts: 'Mg(OH)X',
  },
] as const

/** Section 7.4.2: Preparation of Phenols (NCERT pp. 201–202). */
export const NCERT_7_4_2_PHENOL_PREP: readonly ReactionConditionRecord[] = [
  {
    id: 'from-haloarenes',
    section: '7.4.2',
    title: 'From haloarenes (fusion of chlorobenzene)',
    substrate: 'Chlorobenzene (C₆H₅Cl)',
    reagents: '(i) NaOH  (ii) HCl (acidification)',
    catalyst: null,
    temperatureK: 623,
    pressureAtm: 300,
    conditions: '(i) NaOH, 623 K, 300 atm (equation) / 320 atm (text)  (ii) HCl',
    majorProducts: 'Phenol (C₆H₅OH) via sodium phenoxide (C₆H₅ONa)',
    note: 'Text states 320 atmospheric pressure while the equation arrow on p. 202 (and Unit 6) prints 300 atm.',
  },
  {
    id: 'from-benzenesulphonic-acid',
    section: '7.4.2',
    title: 'From benzenesulphonic acid',
    substrate: 'Benzene (C₆H₆)',
    reagents: '(i) Oleum  (ii) molten NaOH (heat)  (iii) H⁺',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) Oleum → C₆H₅SO₃H  (ii) molten NaOH, heat  (iii) H⁺',
    majorProducts: 'Phenol (C₆H₅OH)',
  },
  {
    id: 'from-diazonium-salts',
    section: '7.4.2',
    title: 'From diazonium salts',
    substrate: 'Aniline (C₆H₅NH₂)',
    reagents: '(i) NaNO₂ + HCl  (ii) H₂O (or dilute acid)',
    catalyst: null,
    temperatureK: [273, 278],
    pressureAtm: null,
    conditions: '(i) NaNO₂ + HCl, 273–278 K → C₆H₅N₂⁺Cl⁻  (ii) H₂O, warm',
    majorProducts: 'Phenol (C₆H₅OH)',
    byProducts: 'N₂ + HCl',
  },
  {
    id: 'from-cumene',
    section: '7.4.2',
    title: 'From cumene (industrial manufacture)',
    substrate: 'Cumene (isopropylbenzene)',
    reagents: '(i) O₂ (air)  (ii) H⁺, H₂O (dilute acid)',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: '(i) O₂ (air) → cumene hydroperoxide  (ii) H⁺ / H₂O (dilute acid)',
    majorProducts: 'Phenol (C₆H₅OH)',
    byProducts: 'Acetone (CH₃COCH₃)',
  },
] as const

/** Section 7.4.4(a) & (b): Esterification, Lucas test, Dehydration and Oxidation (NCERT pp. 207–210). */
export const NCERT_7_4_4_ALCOHOL_DEHYDRATION: readonly ReactionConditionRecord[] = [
  {
    id: 'dehydration-primary-ethanol',
    section: '7.4.4',
    title: 'Dehydration of primary alcohol (ethanol)',
    substrate: 'Ethanol (CH₃CH₂OH)',
    reagents: 'Conc. H₂SO₄',
    catalyst: 'H₂SO₄ (protic acid; also H₃PO₄, anhyd. ZnCl₂ or alumina in general)',
    temperatureK: 443,
    pressureAtm: null,
    conditions: 'Conc. H₂SO₄, 443 K',
    majorProducts: 'Ethene (CH₂=CH₂)',
    byProducts: 'H₂O',
    note: '3-step E1 mechanism: Step 1 fast protonation to ethyl oxonium ion; Step 2 slow carbocation formation (RDS); Step 3 deprotonation.',
  },
  {
    id: 'dehydration-secondary-propan2ol',
    section: '7.4.4',
    title: 'Dehydration of secondary alcohol (propan-2-ol)',
    substrate: 'Propan-2-ol (CH₃CH(OH)CH₃)',
    reagents: '85% H₃PO₄',
    catalyst: 'H₃PO₄',
    temperatureK: 440,
    pressureAtm: null,
    conditions: '85% H₃PO₄, 440 K',
    majorProducts: 'Propene (CH₃CH=CH₂)',
    byProducts: 'H₂O',
  },
  {
    id: 'dehydration-tertiary-tbutanol',
    section: '7.4.4',
    title: 'Dehydration of tertiary alcohol (2-methylpropan-2-ol)',
    substrate: '2-Methylpropan-2-ol ((CH₃)₃COH)',
    reagents: '20% H₃PO₄',
    catalyst: 'H₃PO₄',
    temperatureK: 358,
    pressureAtm: null,
    conditions: '20% H₃PO₄, 358 K',
    majorProducts: '2-Methylpropene (CH₂=C(CH₃)CH₃)',
    byProducts: 'H₂O',
  },
] as const

export const NCERT_7_4_4_ALCOHOL_REACTIONS: readonly ReactionConditionRecord[] = [
  {
    id: 'esterification-acid-anhydride',
    section: '7.4.4',
    title: 'Esterification with carboxylic acid or acid anhydride',
    substrate: 'R/Ar–OH + R′COOH or (R′CO)₂O',
    reagents: 'R′COOH or (R′CO)₂O',
    catalyst: 'Conc. H₂SO₄ (H⁺)',
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Small amount of conc. H₂SO₄ (reversible; water removed as formed)',
    majorProducts: 'Ester (R/Ar–OCOR′)',
    byProducts: 'H₂O (from acid) or R′COOH (from anhydride)',
  },
  {
    id: 'esterification-acyl-chloride',
    section: '7.4.4',
    title: 'Esterification with acid chloride',
    substrate: 'R/Ar–OH + R′COCl',
    reagents: 'R′COCl, Pyridine',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Pyridine (base neutralises HCl and shifts equilibrium right)',
    majorProducts: 'Ester (R/Ar–OCOR′)',
    byProducts: 'HCl',
  },
  {
    id: 'aspirin-synthesis',
    section: '7.4.4',
    title: 'Acetylation of salicylic acid (aspirin synthesis)',
    substrate: 'Salicylic acid (2-hydroxybenzoic acid)',
    reagents: '(CH₃CO)₂O',
    catalyst: 'H⁺',
    temperatureK: null,
    pressureAtm: null,
    conditions: '(CH₃CO)₂O, H⁺',
    majorProducts: 'Acetylsalicylic acid (Aspirin)',
    byProducts: 'CH₃COOH',
  },
  {
    id: 'lucas-test',
    section: '7.4.4',
    title: 'Lucas test (reaction with HX)',
    substrate: '1°, 2° or 3° alcohol (ROH)',
    reagents: 'Conc. HCl + anhydrous ZnCl₂ (Lucas reagent)',
    catalyst: 'ZnCl₂',
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Room temperature; turbidity from immiscible R–Cl distinguishes classes',
    majorProducts: 'Alkyl chloride (R–Cl): 3° immediate turbidity; 1° no turbidity at room temperature',
    byProducts: 'H₂O',
  },
  {
    id: 'oxidation-strong-kmno4',
    section: '7.4.4',
    title: 'Strong oxidation with acidified KMnO₄',
    substrate: '1° alcohol (or 3° alcohol at elevated T)',
    reagents: 'Acidified KMnO₄',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Acidified KMnO₄ (elevated T for 3° causes C–C cleavage)',
    majorProducts: '1° → carboxylic acid directly; 3° → mixture of carboxylic acids with fewer carbons',
  },
  {
    id: 'oxidation-cro3-anhydrous',
    section: '7.4.4',
    title: 'Oxidation with CrO₃',
    substrate: '1° alcohol (RCH₂OH) or 2° alcohol (RCH(OH)R′)',
    reagents: 'CrO₃ (anhydrous medium for 1°)',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Anhydrous CrO₃ (isolates aldehyde from 1°; oxidises 2° to ketone)',
    majorProducts: '1° → aldehyde (RCHO); 2° → ketone (RCOR′)',
  },
  {
    id: 'oxidation-pcc',
    section: '7.4.4',
    title: 'Oxidation with pyridinium chlorochromate (PCC)',
    substrate: '1° alcohol (e.g. CH₃CH=CHCH₂OH)',
    reagents: 'PCC (complex of CrO₃ with pyridine and HCl)',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'PCC (selective oxidation without attacking C=C double bond)',
    majorProducts: 'Aldehyde in good yield (e.g. CH₃CH=CHCHO)',
  },
  {
    id: 'dehydrogenation-cu-573k',
    section: '7.4.4',
    title: 'Vapour-phase catalytic action of heated copper at 573 K',
    substrate: '1°, 2° or 3° alcohol vapours',
    reagents: 'Heated Cu',
    catalyst: 'Cu',
    temperatureK: 573,
    pressureAtm: null,
    conditions: 'Pass alcohol vapours over heated Cu at 573 K',
    majorProducts: '1° → aldehyde (dehydrogenation); 2° → ketone (dehydrogenation); 3° (CH₃)₃COH → 2-methylpropene (dehydration)',
  },
] as const

/** Section 7.4.4(c): Reactions of Phenols (NCERT pp. 211–213). */
export const NCERT_7_4_4_PHENOL_REACTIONS: readonly ReactionConditionRecord[] = [
  {
    id: 'phenol-dilute-nitration',
    section: '7.4.4',
    title: 'Nitration with dilute HNO₃',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: 'Dilute HNO₃',
    catalyst: null,
    temperatureK: 298,
    pressureAtm: null,
    conditions: 'Dilute HNO₃, 298 K; ortho and para separated by steam distillation',
    majorProducts: 'o-Nitrophenol (steam volatile, intramolecular H-bond) + p-Nitrophenol (intermolecular H-bond)',
  },
  {
    id: 'phenol-conc-nitration',
    section: '7.4.4',
    title: 'Nitration with concentrated HNO₃ (picric acid)',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: 'Conc. HNO₃ (modern: conc. H₂SO₄ then conc. HNO₃)',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Conc. HNO₃ (poor yield); or via phenol-2,4-disulphonic acid with conc. H₂SO₄ then conc. HNO₃',
    majorProducts: '2,4,6-Trinitrophenol (Picric acid)',
  },
  {
    id: 'phenol-bromination-cs2',
    section: '7.4.4',
    title: 'Monobromination in low-polarity solvent',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: 'Br₂ in CS₂ (or CHCl₃)',
    catalyst: null,
    temperatureK: 273,
    pressureAtm: null,
    conditions: 'Br₂ in CS₂ or CHCl₃, 273 K (no Lewis acid required)',
    majorProducts: 'p-Bromophenol (Major) + o-Bromophenol (Minor)',
  },
  {
    id: 'phenol-bromine-water',
    section: '7.4.4',
    title: 'Tribromination with bromine water',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: '3 Br₂ (bromine water)',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Aqueous bromine water',
    majorProducts: '2,4,6-Tribromophenol (white precipitate)',
    byProducts: '3 HBr',
  },
  {
    id: 'kolbe-reaction',
    section: '7.4.4',
    title: "Kolbe's reaction",
    substrate: 'Phenol (C₆H₅OH)',
    reagents: '(i) NaOH  (ii) CO₂  (iii) H⁺',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Phenol + NaOH → sodium phenoxide, then (i) CO₂  (ii) H⁺',
    majorProducts: '2-Hydroxybenzoic acid (Salicylic acid)',
  },
  {
    id: 'reimer-tiemann',
    section: '7.4.4',
    title: 'Reimer–Tiemann reaction',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: '(i) CHCl₃ + aq. NaOH  (ii) NaOH  (iii) H⁺',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'CHCl₃ + aq. NaOH (substituted benzal chloride intermediate), alkali hydrolysis, H⁺',
    majorProducts: 'Salicylaldehyde (2-hydroxybenzaldehyde)',
  },
  {
    id: 'phenol-zinc-dust',
    section: '7.4.4',
    title: 'Reduction with zinc dust',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: 'Zn dust',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Heating with zinc dust',
    majorProducts: 'Benzene (C₆H₆)',
    byProducts: 'ZnO',
  },
  {
    id: 'phenol-oxidation-chromic',
    section: '7.4.4',
    title: 'Oxidation with chromic acid',
    substrate: 'Phenol (C₆H₅OH)',
    reagents: 'Na₂Cr₂O₇, H₂SO₄',
    catalyst: null,
    temperatureK: null,
    pressureAtm: null,
    conditions: 'Na₂Cr₂O₇ + H₂SO₄ (chromic acid)',
    majorProducts: 'Benzoquinone (p-benzoquinone, conjugated diketone)',
  },
] as const

/** Section 7.5: Commercially Important Alcohols (NCERT p. 214). */
export const NCERT_7_5_COMMERCIAL_ALCOHOLS = {
  methanol: {
    name: 'Methanol',
    historicalName: 'Wood spirit',
    unicode: 'CH₃OH',
    ce: 'CH3OH',
    smiles: 'CO',
    bpK: NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol,
    equation: 'CO + 2 H₂ → CH₃OH',
    catalyst: 'ZnO–Cr₂O₃',
    pressureAtm: [200, 300] as const,
    temperatureK: [573, 673] as const,
    biologicalOxidation: 'Oxidised in the body to methanal (HCHO) then methanoic acid (HCOOH), causing blindness/death; treated by IV infusion of diluted ethanol.',
  },
  ethanol: {
    name: 'Ethanol',
    unicode: 'C₂H₅OH',
    ce: 'C2H5OH',
    smiles: 'CCO',
    bpK: NCERT_COMMERCIAL_ALCOHOL_BP_K.ethanol,
    fermentationSteps: [
      {
        enzyme: 'Invertase',
        substrate: 'Sucrose (C₁₂H₂₂O₁₁) + H₂O',
        products: 'Glucose (C₆H₁₂O₆) + Fructose (C₆H₁₂O₆)',
        equation: 'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆',
      },
      {
        enzyme: 'Zymase',
        source: 'Yeast (anaerobic conditions)',
        substrate: 'Glucose / Fructose (C₆H₁₂O₆)',
        products: '2 Ethanol (C₂H₅OH) + 2 CO₂',
        equation: 'C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂',
      },
    ] as const,
    zymaseInhibitionPercent: 14,
    denaturingAgents: ['Copper sulphate (gives colour)', 'Pyridine (foul-smelling liquid)'] as const,
    industrialAlternative: 'Hydration of ethene (Section 7.4.1)',
  },
} as const

/** Section 7.6.1: Preparation of Ethers (NCERT pp. 215–216). */
export const NCERT_7_6_1_ETHER_PREP = {
  ethanolDehydrationBranching: [
    {
      temperatureK: 413,
      reagent: 'H₂SO₄',
      pathway: 'SN2 (bimolecular nucleophilic substitution; primary unhindered alcohols only)',
      majorProduct: 'Ethoxyethane (C₂H₅OC₂H₅)',
    },
    {
      temperatureK: 443,
      reagent: 'H₂SO₄',
      pathway: 'Elimination (2° and 3° alcohols also undergo elimination to alkenes)',
      majorProduct: 'Ethene (CH₂=CH₂)',
    },
  ] as const,
  williamsonSynthesis: {
    generalEquation: 'R–X + R′–O⁻Na⁺ → R–O–R′ + NaX',
    mechanism: 'SN2 attack of alkoxide ion on primary alkyl halide',
    successfulExample: {
      reactants: '(CH₃)₃C–O⁻Na⁺ + CH₃–Br',
      product: '(CH₃)₃C–O–CH₃ + NaBr (tert-butyl methyl ether / 2-methoxy-2-methylpropane)',
      reason: 'Alkyl halide (CH₃Br) is primary, so SN2 substitution succeeds even with a tertiary alkoxide.',
    },
    eliminationPitfall: {
      reactants: '(CH₃)₃C–Br + CH₃O⁻Na⁺',
      product: 'CH₂=C(CH₃)₂ (2-Methylpropene) + NaBr + CH₃OH',
      reason: 'Alkoxides are strong bases; with a tertiary alkyl halide, elimination is the sole reaction and no ether is formed.',
    },
    arylEtherRoute: {
      reactants: 'Phenol + NaOH → Sodium phenoxide, then + R–X',
      product: 'Alkyl aryl ether (C₆H₅–O–R)',
    },
  } as const,
} as const

/** Section 7.6.3(1): Cleavage of C–O bond in ethers by HI / HBr (NCERT pp. 217–219). */
export const NCERT_7_6_3_CLEAVAGE_CASES = [
  {
    id: 'symmetrical-dialkyl',
    etherType: 'Symmetrical dialkyl ether',
    example: 'R–O–R + excess conc. HI / HBr (high T)',
    mechanism: 'SN2 cleavage (second equivalent converts R–OH to R–X)',
    products: '2 R–X + H₂O',
  },
  {
    id: 'mixed-primary-secondary',
    etherType: 'Mixed ether with 1° / 2° alkyl groups',
    example: 'CH₃–O–CH₂CH₃ + conc. HI',
    mechanism: 'SN2: I⁻ attacks the less substituted (lower) alkyl carbon',
    products: 'CH₃I + CH₃CH₂OH (excess HI at high T gives CH₃I + CH₃CH₂I + H₂O)',
  },
  {
    id: 'mixed-with-tertiary',
    etherType: 'Mixed ether with a tertiary alkyl group',
    example: '(CH₃)₃C–O–CH₃ + HI',
    mechanism: 'SN1: departure of CH₃OH forms stable (CH₃)₃C⁺ carbocation',
    products: 'CH₃OH + (CH₃)₃C–I (tertiary alkyl halide)',
  },
  {
    id: 'alkyl-aryl-anisole',
    etherType: 'Alkyl aryl ether (anisole)',
    example: 'C₆H₅–O–CH₃ + HI',
    mechanism: 'O–CH₃ breaks because aryl C is sp² with partial double-bond character; phenol resists nucleophilic substitution',
    products: 'Phenol (C₆H₅OH) + CH₃I',
  },
] as const

/** Section 7.6.3(2): Electrophilic aromatic substitution of anisole (NCERT pp. 219–220). */
export const NCERT_7_6_3_ANISOLE_EAS = [
  {
    id: 'anisole-bromination',
    reactionType: 'Halogenation (Bromination)',
    reagents: 'Br₂ in ethanoic acid (CH₃COOH)',
    catalyst: null,
    majorProduct: 'p-Bromoanisole (4-bromoanisole)',
    majorYieldPercent: 90,
    minorProduct: 'o-Bromoanisole (2-bromoanisole)',
    note: 'Proceeds even in the absence of FeBr₃ catalyst due to strong ring activation by –OCH₃.',
  },
  {
    id: 'anisole-fc-alkylation',
    reactionType: 'Friedel–Crafts alkylation',
    reagents: 'CH₃Cl in CS₂',
    catalyst: 'Anhydrous AlCl₃',
    majorProduct: '4-Methoxytoluene',
    majorYieldPercent: null,
    minorProduct: '2-Methoxytoluene',
  },
  {
    id: 'anisole-fc-acylation',
    reactionType: 'Friedel–Crafts acylation',
    reagents: 'CH₃COCl (ethanoyl chloride)',
    catalyst: 'Anhydrous AlCl₃',
    majorProduct: '4-Methoxyacetophenone',
    majorYieldPercent: null,
    minorProduct: '2-Methoxyacetophenone',
  },
  {
    id: 'anisole-nitration',
    reactionType: 'Nitration',
    reagents: 'Conc. H₂SO₄ + conc. HNO₃',
    catalyst: null,
    majorProduct: '4-Nitroanisole',
    majorYieldPercent: null,
    minorProduct: '2-Nitroanisole',
  },
] as const

// ---------------------------------------------------------------------------------------------
// Things NCERT leaves loose or inconsistent across pages (explicit editorial rulings)
// ---------------------------------------------------------------------------------------------

export const NCERT_UNIT7_NOTES = [
  {
    id: 'chlorobenzene-pressure-300-vs-320',
    note: 'Section 7.4.2 running text (p. 202) states 623 K and 320 atmospheric pressure, whereas the reaction arrow below it (and Unit 6) prints 623 K and 300 atm.',
  },
  {
    id: 'no-printed-bp-propan1ol-butane',
    note: 'Section 7.4.3 draws propan-1-ol for H-bonding with water (p. 204) and Example 7.3 compares n-butane qualitatively, without printing boiling points for either compound. Only the 7 boiling points printed in 7.4.3, 7.5 and 7.6.2 are tabulated here.',
  },
  {
    id: 'fig-7-1-phenol-oh-omitted',
    note: 'Fig. 7.1 (p. 198) prints an O–H bond length only for methanol (96 pm); none is printed for phenol.',
  },
  {
    id: 'table-7-1-and-7-2-spacing',
    note: 'NCERT prints "Propane -1, 2, 3-triol" in Table 7.1 and "3- Methylbutoxybenzene" in Table 7.2 with stray typesetting spaces; clean spacing is stored here (IUPAC brackets give (3-methylbutoxy)benzene).',
  },
  {
    id: 'phenol-pka-million-times',
    note: 'Table 7.3 prints pKa 10.0 for phenol and 15.9 for ethanol (ΔpKa = 5.9); NCERT summarizes this as phenol being a million times more acidic than ethanol.',
  },
  {
    id: 'table-7-3-cresol-tie',
    note: 'In Table 7.3, o-cresol and p-cresol share pKa 10.2, both weaker acids than m-cresol (10.1) and phenol (10.0).',
  },
] as const
