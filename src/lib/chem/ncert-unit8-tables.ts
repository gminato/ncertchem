/**
 * Tables, Problems and errata for NCERT Class 11 Part II, Unit 8 (Organic Chemistry: Some Basic
 * Principles and Techniques), 2026-27 reprint. Values were read from the page images of
 * kech202.pdf; each entry cites the PDF page (the book page is the PDF page + 255).
 *
 * Problems carry NCERT's printed answer (`printedAnswer`) and the answer recomputed with the models
 * in this folder (`computedAnswer`). A Problem with a `smiles` field is named by iupacName (or
 * checked by the model named in `check`). Where NCERT disagrees with itself the point is listed in
 * NCERT_UNIT8_ERRATA, not corrected in place.
 */

/** A printed table: its source line and rows. */
export interface NcertTable<T> {
  source: string
  rows: readonly T[]
}

/** NCERT Table 8.1 row: a compound and its common (trivial) name. */
export interface CommonNameRow {
  compound: string
  commonName: string
}

/** NCERT Table 8.2 row: an unbranched alkane as printed. */
export interface AlkaneRow {
  name: string
  formula: string
}

/** NCERT Table 8.3 row: an alkane, its alkyl group and the alkyl group's name. */
export interface AlkylRow {
  alkaneFormula: string
  alkaneName: string
  alkylStructure: string
  alkylName: string
}

/** NCERT Table 8.4 row: a class of compounds with its functional group, prefix, suffix and example. */
export interface FunctionalGroupRow {
  className: string
  group: string
  prefix: string
  suffix: string
  example: string
}

/** Table 8.1, Common or Trivial Names of Some Organic Compounds (PDF p. 7). */
export const NCERT_TABLE_8_1_COMMON_NAMES: NcertTable<CommonNameRow> = {
  source: 'NCERT Unit 8, Table 8.1 (Common or Trivial Names of Some Organic Compounds), PDF p. 7',
  rows: [
    { compound: 'CH4', commonName: 'Methane' },
    { compound: 'H3CCH2CH2CH2CH3', commonName: 'n-Butane' },
    { compound: '(H3C)2CHCH3', commonName: 'Isobutane' },
    { compound: '(H3C)4C', commonName: 'Neopentane' },
    { compound: 'H3CCH2CH2OH', commonName: 'n-Propyl alcohol' },
    { compound: 'HCHO', commonName: 'Formaldehyde' },
    { compound: '(H3C)2CO', commonName: 'Acetone' },
    { compound: 'CHCl3', commonName: 'Chloroform' },
    { compound: 'CH3COOH', commonName: 'Acetic acid' },
    { compound: 'C6H6', commonName: 'Benzene' },
    { compound: 'C6H5OCH3', commonName: 'Anisole' },
    { compound: 'C6H5NH2', commonName: 'Aniline' },
    { compound: 'C6H5COCH3', commonName: 'Acetophenone' },
    { compound: 'CH3OCH2CH3', commonName: 'Ethyl methyl ether' },
  ],
}

/** Table 8.2, IUPAC names of some unbranched saturated hydrocarbons, as printed (PDF p. 8). */
export const NCERT_TABLE_8_2_ALKANES: NcertTable<AlkaneRow> = {
  source: 'NCERT Unit 8, Table 8.2 (IUPAC Names of Some Unbranched Saturated Hydrocarbons), PDF p. 8. Printed as C1 to C6, C7 to C10, C20 and C30.',
  rows: [
    { name: 'Methane', formula: 'CH4' },
    { name: 'Ethane', formula: 'C2H6' },
    { name: 'Propane', formula: 'C3H8' },
    { name: 'Butane', formula: 'C4H10' },
    { name: 'Pentane', formula: 'C5H12' },
    { name: 'Hexane', formula: 'C6H14' },
    { name: 'Heptane', formula: 'C7H16' },
    { name: 'Octane', formula: 'C8H18' },
    { name: 'Nonane', formula: 'C9H20' },
    { name: 'Decane', formula: 'C10H22' },
    { name: 'Icosane', formula: 'C20H42' },
    { name: 'Triacontane', formula: 'C30H62' },
  ],
}

/** Table 8.3, Some Alkyl Groups (PDF p. 8). */
export const NCERT_TABLE_8_3_ALKYL_GROUPS: NcertTable<AlkylRow> = {
  source: 'NCERT Unit 8, Table 8.3 (Some Alkyl Groups), PDF p. 8',
  rows: [
    { alkaneFormula: 'CH4', alkaneName: 'Methane', alkylStructure: '-CH3', alkylName: 'Methyl' },
    { alkaneFormula: 'C2H6', alkaneName: 'Ethane', alkylStructure: '-CH2CH3', alkylName: 'Ethyl' },
    { alkaneFormula: 'C3H8', alkaneName: 'Propane', alkylStructure: '-CH2CH2CH3', alkylName: 'Propyl' },
    { alkaneFormula: 'C4H10', alkaneName: 'Butane', alkylStructure: '-CH2CH2CH2CH3', alkylName: 'Butyl' },
    { alkaneFormula: 'C10H22', alkaneName: 'Decane', alkylStructure: '-CH2(CH2)8CH3', alkylName: 'Decyl' },
  ],
}

/** Table 8.4, Some Functional Groups and Classes of Organic Compounds (PDF p. 12). */
export const NCERT_TABLE_8_4_FUNCTIONAL_GROUPS: NcertTable<FunctionalGroupRow> = {
  source: 'NCERT Unit 8, Table 8.4 (Some Functional Groups and Classes of Organic Compounds), PDF p. 12',
  rows: [
    { className: 'Alkanes', group: '-', prefix: '-', suffix: '-ane', example: 'Butane, CH3(CH2)2CH3' },
    { className: 'Alkenes', group: '>C=C<', prefix: '-', suffix: '-ene', example: 'But-1-ene, CH2=CHCH2CH3' },
    { className: 'Alkynes', group: '-C≡C-', prefix: '-', suffix: '-yne', example: 'But-1-yne, CH≡CCH2CH3' },
    { className: 'Arenes', group: '-', prefix: '-', suffix: '-', example: 'Benzene' },
    { className: 'Halides', group: '-X (X=F,Cl,Br,I)', prefix: 'halo-', suffix: '-', example: '1-Bromobutane, CH3(CH2)2CH2Br' },
    { className: 'Alcohols', group: '-OH', prefix: 'hydroxy-', suffix: '-ol', example: 'Butan-2-ol, CH3CH2CHOHCH3' },
    { className: 'Aldehydes', group: '-CHO', prefix: 'formyl or oxo', suffix: '-al', example: 'Butanal, CH3(CH2)2CHO' },
    { className: 'Ketones', group: '>C=O', prefix: 'oxo-', suffix: '-one', example: 'Butan-2-one, CH3CH2COCH3' },
    { className: 'Nitriles', group: '-C≡N', prefix: 'cyano', suffix: 'nitrile', example: 'Pentanenitrile, CH3CH2CH2CH2CN' },
    { className: 'Ethers', group: '-R-O-R-', prefix: 'alkoxy-', suffix: '-', example: 'Ethoxyethane, CH3CH2OCH2CH3' },
    { className: 'Carboxylic acids', group: '-COOH', prefix: 'carboxy', suffix: '-oic acid', example: 'Butanoic acid, CH3(CH2)2CO2H' },
    { className: 'Carboxylate ions', group: '-COO-', prefix: '-', suffix: '-oate', example: 'Sodium butanoate, CH3(CH2)2CO2- Na+' },
    { className: 'Esters', group: '-COOR', prefix: 'alkoxycarbonyl', suffix: '-oate', example: 'Methyl propanoate, CH3CH2COOCH3' },
    { className: 'Acyl halides', group: '-COX (X=F,Cl,Br,I)', prefix: 'halocarbonyl', suffix: '-oyl halide', example: 'Butanoyl chloride, CH3(CH2)2COCl' },
    { className: 'Amines', group: '-NH2, >NH, >N-', prefix: 'amino-', suffix: '-amine', example: 'Butan-2-amine, CH3CHNH2CH2CH3' },
    { className: 'Amides', group: '-CONH2, -CONHR, -CONR2', prefix: '-carbamoyl', suffix: '-amide', example: 'Butanamide, CH3(CH2)2CONH2' },
    { className: 'Nitro compounds', group: '-NO2', prefix: 'nitro', suffix: '-', example: '1-Nitrobutane, CH3(CH2)3NO2' },
    { className: 'Sulphonic acids', group: '-SO3H', prefix: 'sulpho', suffix: 'sulphonic acid', example: 'Methylsulphonic acid, CH3SO3H' },
  ],
}

/** NCERT's order of decreasing priority of principal groups (PDF p. 11). */
export const NCERT_FUNCTIONAL_PRIORITY: readonly string[] = [
  '-COOH',
  '-SO3H',
  '-COOR',
  'COCl',
  '-CONH2',
  '-CN',
  '-CHO',
  '>C=O',
  '-OH',
  '-NH2',
  '>C=C<',
  '-C≡C-',
]

/** NCERT Section 8.7.5 (PDF p. 19): groups that withdraw and donate electrons inductively. */
export const NCERT_INDUCTIVE_GROUPS = {
  source: 'NCERT Unit 8, Section 8.7.5 (Inductive Effect), PDF p. 19',
  electronWithdrawing: ['-NO2', '-CN', '-COOH', '-COOR', '-OAr', 'halogens'],
  electronDonating: ['-CH3', '-C2H5'],
}

/** A qualitative test (Section 8.9.2) with the element, reagent and observation as printed (PDF pp. 29 to 30). */
export interface QualitativeTest {
  element: string
  reagent: string
  observation: string
  species: string
  pdfPage: number
}

/** Lassaigne's test and the detection of each element (Section 8.9.2). */
export const NCERT_LASSAIGNE_TESTS: readonly QualitativeTest[] = [
  { element: 'N', reagent: 'FeSO4, then conc. H2SO4 (Prussian blue)', observation: 'Prussian blue colour', species: 'Fe4[Fe(CN)6]3.xH2O', pdfPage: 30 },
  { element: 'S', reagent: 'Acetic acid and lead acetate', observation: 'Black precipitate', species: 'PbS', pdfPage: 30 },
  { element: 'S', reagent: 'Sodium nitroprusside', observation: 'Violet colour', species: '[Fe(CN)5NOS]4-', pdfPage: 30 },
  { element: 'Cl', reagent: 'Dil. HNO3 then AgNO3', observation: 'White precipitate soluble in NH4OH', species: 'AgCl', pdfPage: 30 },
  { element: 'Br', reagent: 'Dil. HNO3 then AgNO3', observation: 'Yellowish precipitate, sparingly soluble in NH4OH', species: 'AgBr', pdfPage: 30 },
  { element: 'I', reagent: 'Dil. HNO3 then AgNO3', observation: 'Yellow precipitate insoluble in NH4OH', species: 'AgI', pdfPage: 30 },
  { element: 'P', reagent: 'Sodium peroxide, then HNO3 and ammonium molybdate', observation: 'Yellow precipitate', species: '(NH4)3PO4.12MoO3', pdfPage: 30 },
]

/** A quantitative method (Section 8.10) with its formula as printed (PDF pp. 31 to 35). */
export interface QuantitativeMethod {
  element: string
  method: string
  formula: string
  pdfPage: number
}

/** The quantitative methods of Section 8.10. */
export const NCERT_QUANTITATIVE_METHODS: readonly QuantitativeMethod[] = [
  { element: 'C', method: 'Liebig', formula: '%C = 12 x m2 x 100 / (44 x m)', pdfPage: 31 },
  { element: 'H', method: 'Liebig', formula: '%H = 2 x m1 x 100 / (18 x m)', pdfPage: 31 },
  { element: 'N', method: 'Dumas', formula: '%N = 28 x V x 100 / (22400 x m); p1 = p - aqueous tension', pdfPage: 31 },
  { element: 'N', method: 'Kjeldahl', formula: '%N = 14 x M x 2(V - V1/2) x 100 / (1000 x m)', pdfPage: 33 },
  { element: 'X', method: 'Carius', formula: '%X = atomic mass of X x m1 x 100 / (molar mass of AgX x m)', pdfPage: 34 },
  { element: 'S', method: 'Carius', formula: '%S = 32 x m1 x 100 / (233 x m)', pdfPage: 35 },
  { element: 'P', method: 'Ammonium phosphomolybdate', formula: '%P = 31 x m1 x 100 / (1877 x m)', pdfPage: 35 },
  { element: 'P', method: 'Mg2P2O7', formula: '%P = 62 x m1 x 100 / (222 x m)', pdfPage: 35 },
  { element: 'O', method: 'By difference', formula: '%O = 100 - sum of the other elements', pdfPage: 35 },
  { element: 'O', method: 'From CO2 of oxidation', formula: '%O = 32 x m1 x 100 / (88 x m)', pdfPage: 35 },
]

/** One Problem: its printed question and answer, and the answer recomputed with the models. */
export interface Unit8Problem {
  /** NCERT number, e.g. '8.1'. */
  number: string
  /** PDF page of the Problem. */
  pdfPage: number
  /** The question, shortened. */
  question: string
  /** SMILES of the compound the Problem names or asks about, where it is one. */
  smiles?: string
  /** NCERT's printed answer, as text. */
  printedAnswer: string
  /** The recomputed answer, as text. */
  computedAnswer: string
  /** Which model produced computedAnswer, when it is checked by a test. */
  check: 'iupacName' | 'bondCounts' | 'hybridisation' | 'rankIntermediates' | 'classifyReagent' | 'cleavage' | 'electrophilicCentres' | 'quantitative' | 'text'
}

/** Problems 8.1 to 8.24 (PDF pp. 2 to 35). */
export const NCERT_UNIT8_PROBLEMS: readonly Unit8Problem[] = [
  { number: '8.1', pdfPage: 2, question: 'Count sigma and pi bonds in (a) HC≡CCH=CHCH3 and (b) CH2=C=CHCH3', smiles: 'C#CC=CC', printedAnswer: '(a) σC–C 4; σC–H 6; πC=C 1; πC≡C 2. (b) σC–C 3; σC–H 6; πC=C 2.', computedAnswer: 'σC–C 4; σC–H 6; πC=C 1; πC≡C 2', check: 'bondCounts' },
  { number: '8.1b', pdfPage: 2, question: '8.1(b): CH2=C=CHCH3', smiles: 'C=C=CC', printedAnswer: 'σC–C 3; σC–H 6; πC=C 2', computedAnswer: 'σC–C 3; σC–H 6; πC=C 2', check: 'bondCounts' },
  { number: '8.2a', pdfPage: 2, question: 'Hybridisation of carbon in CH3Cl', smiles: 'CCl', printedAnswer: 'sp3', computedAnswer: 'sp3', check: 'hybridisation' },
  { number: '8.2b', pdfPage: 2, question: 'Hybridisation of carbon in (CH3)2CO', smiles: 'CC(C)=O', printedAnswer: 'sp3, sp2', computedAnswer: 'sp3, sp2', check: 'hybridisation' },
  { number: '8.2c', pdfPage: 2, question: 'Hybridisation of carbon in CH3CN', smiles: 'CC#N', printedAnswer: 'sp3, sp', computedAnswer: 'sp3, sp', check: 'hybridisation' },
  { number: '8.2d', pdfPage: 2, question: 'Hybridisation of carbon in HCONH2', smiles: 'NC=O', printedAnswer: 'sp2', computedAnswer: 'sp2', check: 'hybridisation' },
  { number: '8.2e', pdfPage: 2, question: 'Hybridisation of carbon in CH3CH=CHCN', smiles: 'CC=CC#N', printedAnswer: 'sp3, sp2, sp2, sp', computedAnswer: 'sp3, sp2, sp2, sp', check: 'hybridisation' },
  { number: '8.3', pdfPage: 2, question: 'Hybridisation and shape of H2C=O, CH3F, HC≡N', printedAnswer: '(a) sp2, trigonal planar; (b) sp3, tetrahedral; (c) sp, linear', computedAnswer: 'sp2 trigonal planar; sp3 tetrahedral; sp linear', check: 'text' },
  { number: '8.4a', pdfPage: 4, question: 'Expand (a) CH3CH2COCH2CH3 (checked by name)', smiles: 'CCC(=O)CC', printedAnswer: 'drawn structure (page image)', computedAnswer: 'pentan-3-one', check: 'iupacName' },
  { number: '8.4b', pdfPage: 4, question: 'Expand (b) CH3CH=CH(CH2)3CH3 (checked by name)', smiles: 'CC=CCCCC', printedAnswer: 'drawn structure (page image)', computedAnswer: 'hept-2-ene', check: 'iupacName' },
  { number: '8.5', pdfPage: 4, question: 'Condensed to bond-line: (a) HOCH2CH2CH2CH(CH3)CH(CH3)CH3, (b) HOCH(CN)2', smiles: 'OCCCC(C)C(C)C', printedAnswer: '(a) HO(CH2)3CH(CH3)CH(CH3)2; (b) HOCH(CN)2 (drawn)', computedAnswer: '4,5-dimethylhexan-1-ol', check: 'iupacName' },
  { number: '8.6a', pdfPage: 4, question: 'Expand bond-line (a) isopropylcyclohexane', smiles: 'CC(C)C1CCCCC1', printedAnswer: 'drawn', computedAnswer: 'isopropylcyclohexane', check: 'iupacName' },
  { number: '8.6b', pdfPage: 4, question: 'Expand bond-line (b) heptane', smiles: 'CCCCCCC', printedAnswer: 'drawn', computedAnswer: 'heptane', check: 'iupacName' },
  { number: '8.6d', pdfPage: 4, question: 'Expand bond-line (d) 2,3-dimethylbutane', smiles: 'CC(C)C(C)C', printedAnswer: 'drawn', computedAnswer: '2,3-dimethylbutane', check: 'iupacName' },
  { number: '8.7a', pdfPage: 10, question: 'Explain why "2,5,6-trimethyloctane" is the name and not 3,4,7', smiles: 'CC(C)CCC(C)C(C)CC', printedAnswer: '2,5,6-trimethyloctane', computedAnswer: '2,5,6-trimethyloctane', check: 'iupacName' },
  { number: '8.7b', pdfPage: 10, question: 'Explain why "3-ethyl-5-methylheptane" is the name and not 5-ethyl-3-methylheptane', smiles: 'CCC(CC)CC(C)CC', printedAnswer: '3-ethyl-5-methylheptane', computedAnswer: '3-ethyl-5-methylheptane', check: 'iupacName' },
  { number: '8.8i', pdfPage: 11, question: 'IUPAC name of (i) CH3CH2CH(OH)CH2CH2CH(CH3)CH2CH3', smiles: 'CCC(O)CCC(C)CC', printedAnswer: '6-Methyloctan-3-ol', computedAnswer: '6-methyloctan-3-ol', check: 'iupacName' },
  { number: '8.8ii', pdfPage: 11, question: 'IUPAC name of (ii) CH3CH2C(=O)CH2C(=O)CH3', smiles: 'CCC(=O)CC(=O)C', printedAnswer: 'Hexane-2,4-dione', computedAnswer: 'hexane-2,4-dione', check: 'iupacName' },
  { number: '8.8iii', pdfPage: 11, question: 'IUPAC name of (iii) CH3C(=O)CH2CH2CH2COOH', smiles: 'OC(=O)CCCC(C)=O', printedAnswer: '5-Oxohexanoic acid', computedAnswer: '5-oxohexanoic acid', check: 'iupacName' },
  { number: '8.8iv', pdfPage: 11, question: 'IUPAC name of (iv) CH≡C–CH=CH–CH=CH2', smiles: 'C=CC=CC#C', printedAnswer: 'Hexa-1,3-dien-5-yne', computedAnswer: 'hexa-1,3-dien-5-yne', check: 'iupacName' },
  { number: '8.9i', pdfPage: 13, question: 'Structure of 2-chlorohexane', smiles: 'CCCCC(C)Cl', printedAnswer: 'CH3(CH2)3CH(Cl)CH3', computedAnswer: '2-chlorohexane', check: 'iupacName' },
  { number: '8.9ii', pdfPage: 13, question: 'Structure of pent-4-en-2-ol', smiles: 'C=CCC(C)O', printedAnswer: 'CH2=CHCH2CH(OH)CH3', computedAnswer: 'pent-4-en-2-ol', check: 'iupacName' },
  { number: '8.9iii', pdfPage: 13, question: 'Structure of 3-nitrocyclohexene', smiles: 'C1=CC([N+](=O)[O-])CCC1', printedAnswer: 'cyclohexene with NO2 at C-3', computedAnswer: '3-nitrocyclohexene', check: 'iupacName' },
  { number: '8.9iv', pdfPage: 13, question: 'Structure of cyclohex-2-en-1-ol', smiles: 'OC1CCCC=C1', printedAnswer: 'cyclohexene with OH at C-1', computedAnswer: 'cyclohex-2-en-1-ol', check: 'iupacName' },
  { number: '8.9v', pdfPage: 13, question: 'Structure of 6-hydroxyheptanal', smiles: 'CC(O)CCCCC=O', printedAnswer: 'CH3CH(OH)CH2CH2CH2CH2CHO', computedAnswer: '6-hydroxyheptanal', check: 'iupacName' },
  { number: '8.10a', pdfPage: 15, question: 'Structure of o-ethylanisole', smiles: 'CCC1=CC=CC=C1OC', printedAnswer: 'drawn', computedAnswer: '2-ethylanisole', check: 'iupacName' },
  { number: '8.10b', pdfPage: 15, question: 'Structure of p-nitroaniline', smiles: 'NC1=CC=C([N+](=O)[O-])C=C1', printedAnswer: 'drawn', computedAnswer: '4-nitroaniline', check: 'iupacName' },
  { number: '8.10c', pdfPage: 15, question: 'Structure of 2,3-dibromo-1-phenylpentane', smiles: 'CCC(Br)C(Br)CC1=CC=CC=C1', printedAnswer: 'drawn', computedAnswer: '2,3-dibromo-1-phenylpentane', check: 'iupacName' },
  { number: '8.10d', pdfPage: 15, question: 'Structure of 4-ethyl-1-fluoro-2-nitrobenzene', smiles: 'CCC1=CC(=C(C=C1)F)[N+](=O)[O-]', printedAnswer: 'drawn', computedAnswer: '4-ethyl-1-fluoro-2-nitrobenzene', check: 'iupacName' },
  { number: '8.11', pdfPage: 18, question: 'Heterolytic cleavage of (a) CH3–SCH3, (b) CH3–CN, (c) CH3–Cu', printedAnswer: '(a) CH3+ + −SCH3; (b) CH3+ + −CN; (c) CH3− + Cu+', computedAnswer: 'CH3+ + −SCH3; CH3+ + −CN; CH3− + Cu+', check: 'cleavage' },
  { number: '8.12', pdfPage: 18, question: 'Nucleophile or electrophile: HS−, BF3, C2H5O−, (CH3)3N:, Cl+, CH3–C+=O, H2N:−, NO2+', printedAnswer: 'Nucleophiles: HS−, C2H5O−, (CH3)3N:, H2N:−. Electrophiles: BF3, Cl+, CH3C+=O, NO2+', computedAnswer: 'nucleophiles HS−, C2H5O−, (CH3)3N, H2N−; electrophiles BF3, Cl+, CH3C+=O, NO2+', check: 'classifyReagent' },
  { number: '8.13', pdfPage: 18, question: 'Electrophilic centre in CH3CH=O, CH3CN, CH3I', printedAnswer: 'the starred carbons: the C=O carbon, the nitrile carbon, the C bonded to I', computedAnswer: 'carbon 1 of CH3CH=O; carbon 1 of CH3CN; carbon 0 of CH3I', check: 'electrophilicCentres' },
  { number: '8.14', pdfPage: 20, question: 'Which bond is more polar: (a) C–H or C–Br, (b) C–O or C–N, (c) C–O or C–S', printedAnswer: '(a) C–Br; (b) C–O; (c) C–O', computedAnswer: 'C–Br; C–O; C–O (by electronegativity difference)', check: 'text' },
  { number: '8.15', pdfPage: 20, question: 'In which C–C bond of CH3CH2CH2Br is the inductive effect least?', smiles: 'CCCBr', printedAnswer: 'the bond between carbon-3 and hydrogen (NOT a C–C bond; see the errata)', computedAnswer: 'the C2–C3 bond (numbering from Br as in 1-bromopropane: the C–C bond farthest from Br)', check: 'text' },
  { number: '8.16', pdfPage: 21, question: 'Resonance structures of CH3COO−', smiles: 'CC(=O)[O-]', printedAnswer: 'two contributors, related by moving the charge between the oxygens', computedAnswer: '2 contributors', check: 'text' },
  { number: '8.17', pdfPage: 21, question: 'Resonance structures of CH2=CH–CHO and their stability', printedAnswer: 'I > II > III', computedAnswer: 'I > II (III not reconstructed)', check: 'text' },
  { number: '8.18', pdfPage: 21, question: 'Why I and II cannot be major contributors to CH3COOCH3', printedAnswer: 'both have charge separation and an incomplete octet or a carbon with a negative charge', computedAnswer: 'text', check: 'text' },
  { number: '8.19', pdfPage: 23, question: 'Stability of (CH3)3C+, CH3CH2+ and CH3+', printedAnswer: '(CH3)3C+ > CH3CH2+ > CH3+ (more hyperconjugation; the vacant p orbital of CH3+ is perpendicular to the C–H bonds)', computedAnswer: '(CH3)3C+ > CH3CH2+ > CH3+', check: 'rankIntermediates' },
  { number: '8.20', pdfPage: 31, question: 'Carbon and hydrogen from 0.246 g, 0.198 g CO2, 0.1014 g H2O', printedAnswer: 'C 21.95%; H 4.58%', computedAnswer: 'C 21.95%; H 4.58%', check: 'quantitative' },
  { number: '8.21', pdfPage: 32, question: 'Dumas: 0.3 g gives 50 mL N2 at 300 K and 715 mmHg (aqueous tension 15 mmHg)', printedAnswer: 'V(STP) = 41.9 mL; N 17.46%', computedAnswer: 'V(STP) = 41.9 mL; N 17.46%', check: 'quantitative' },
  { number: '8.22', pdfPage: 33, question: 'Kjeldahl: 0.5 g; 10 mL of 1 M H2SO4 neutralised by NH3', printedAnswer: 'N 56.0%', computedAnswer: 'N 56.0%', check: 'quantitative' },
  { number: '8.23', pdfPage: 34, question: 'Carius: 0.15 g gives 0.12 g AgBr', printedAnswer: 'Br 34.04%', computedAnswer: 'Br 34.04%', check: 'quantitative' },
  { number: '8.24', pdfPage: 34, question: 'Sulphur: 0.157 g gives 0.4813 g BaSO4', printedAnswer: 'S 42.10%', computedAnswer: 'S 42.10%', check: 'quantitative' },
]

/** An erratum: where NCERT is wrong or inconsistent, what it prints, what is correct, and why. */
export interface Unit8Erratum {
  where: string
  pdfPage: number
  printed: string
  correct: string
  note: string
}

/** Places where NCERT Unit 8 is wrong or inconsistent. */
export const NCERT_UNIT8_ERRATA: readonly Unit8Erratum[] = [
  {
    where: 'Problem 8.15',
    pdfPage: 20,
    printed: 'Asks for the C–C bond of CH3CH2CH2Br with the least inductive effect; the solution says "the bond between carbon-3 and hydrogen".',
    correct: 'The C2–C3 bond (between the middle CH2 and the terminal CH3; C1 carries the Br, as in 1-bromopropane).',
    note: 'A C–H bond is not a C–C bond. The inductive effect falls off with the number of intervening bonds, so the C–C bond farthest from Br (C2–C3) is least affected. NCERT\'s own numbering (carbon-3 = the CH3) agrees.',
  },
  {
    where: 'Section 8.5.2 (Kjeldahl method), last line of the derivation',
    pdfPage: 33,
    printed: 'Percentage of N = 1.4 x M x 2(V - V/2) / m',
    correct: 'Percentage of N = 1.4 x M x 2(V - V1/2) / m',
    note: 'The subscript 1 on the alkali volume is dropped; the line above it correctly has V1/2.',
  },
]
