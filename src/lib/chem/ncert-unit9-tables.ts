/**
 * Tables, conditions, bond data, Problems, Exercises and errata for NCERT Class 11 Part II, Unit 9
 * (Hydrocarbons), 2026-27 reprint. Values were read from the page images of kech203.pdf; each entry
 * cites the PDF page (the book page is the PDF page + 294).
 *
 * The data here is what NCERT prints. Where NCERT is inconsistent or wrong the point is recorded in
 * NCERT_UNIT9_ERRATA and the data is kept as printed, not corrected in place. The computed answers
 * come from the models in this folder.
 */

/** A printed table: its source line and rows. */
export interface NcertTable<T> {
  source: string
  rows: readonly T[]
}

/** Table 9.1 row: a compound as printed, with its IUPAC name and the remark NCERT gives. */
export interface NomenclatureRow {
  label: string
  printedName: string
  smiles: string
  remark: string
}

/** Table 9.2 (alkanes) row: a homologue or isomer with its molecular mass and its boiling and melting points. */
export interface AlkaneBoilingRow {
  formula: string
  name: string
  molecularMass: number
  boilingPointK: number
  meltingPointK: number
}

/** Table 9.2 (alkynes, printed under the same number) row. */
export interface AlkynameRow {
  n: number
  formula: string
  structure: string
  commonName: string
  iupacName: string
}

/** A bond datum NCERT states: quantity, value, unit, the page and the sentence it comes from. */
export interface BondDatum {
  quantity: string
  value: number
  unit: string
  pdfPage: number
  statedAs: string
}

/** A reaction condition NCERT gives (catalyst, temperature, pressure or reagent), keyed by reaction id. */
export interface ReactionCondition {
  id: string
  text: string
  pdfPage: number
  example: string
}

/** A group NCERT lists as ortho/para or meta directing (9.5.6). */
export interface DirectingGroup {
  group: string
  effect: 'activating' | 'deactivating'
  directs: 'ortho-para' | 'meta'
  pdfPage: number
}

/** A polynuclear hydrocarbon NCERT names as carcinogenic (9.6). */
export interface CarcinogenRow {
  name: string
  pdfPage: number
}

/** A Problem in the text (9.1 to 9.14) with its printed answer and the answer computed here. */
export interface Unit9Problem {
  number: string
  pdfPage: number
  question: string
  printedAnswer: string
  computedAnswer: string
  check: 'iupacName' | 'model' | 'text'
}

/** An end-of-unit Exercise (9.1 to 9.25) with its question summary and the answer computed here where a model applies. */
export interface Unit9Exercise {
  number: string
  pdfPage: number
  question: string
  computedAnswer: string
  check: 'iupacName' | 'model' | 'text'
}

/** An erratum: where NCERT is wrong or inconsistent, what it prints and what is correct. */
export interface Unit9Erratum {
  where: string
  pdfPage: number
  printed: string
  correct: string
  note: string
}

/** Every condition NCERT gives for a reaction (9.x equations and text), keyed by an id the models use. */
export const NCERT_UNIT9_CONDITIONS: readonly ReactionCondition[] = [
  { id: 'hydrogenation', text: 'finely divided Pt, Pd or Ni (Ni needs higher temperature and pressure)', pdfPage: 6, example: 'ethene + H2 (9.1)' },
  { id: 'lindlar', text: 'Pd/C partly deactivated with poisons (Lindlar catalyst): cis-alkene', pdfPage: 15, example: 'alkyne + H2 (9.30)' },
  { id: 'sodium-ammonia', text: 'Na in liquid NH3: trans-alkene', pdfPage: 15, example: 'alkyne + H2 (9.31)' },
  { id: 'zinc-acid', text: 'Zn and dilute HCl (or Zn alone for dihalides)', pdfPage: 6, example: 'alkyl halide + H2 (9.4)' },
  { id: 'wurtz', text: 'Na in dry ether (free from moisture)', pdfPage: 7, example: 'alkyl halide + Na (9.7, 9.8)' },
  { id: 'sodalime', text: 'soda lime (NaOH and CaO), heated', pdfPage: 7, example: 'sodium ethanoate + NaOH (9.8 text)' },
  { id: 'kolbe', text: 'electrolysis of aqueous sodium or potassium salt of the acid', pdfPage: 7, example: 'sodium ethanoate (9.9)' },
  { id: 'halogenation', text: 'diffused sunlight or UV light, or 573 to 773 K', pdfPage: 8, example: 'CH4 + Cl2 (9.10)' },
  { id: 'combustion', text: 'excess air or oxygen (complete combustion)', pdfPage: 9, example: 'CH4 + O2 (9.17)' },
  { id: 'incomplete-combustion', text: 'insufficient air or oxygen (carbon black)', pdfPage: 10, example: 'CH4 (9.20)' },
  { id: 'methanol', text: 'Cu, 523 K, 100 atm', pdfPage: 10, example: 'CH4 to CH3OH (9.21)' },
  { id: 'methanal', text: 'Mo2O3, heat', pdfPage: 10, example: 'CH4 to HCHO (9.22)' },
  { id: 'ethanoic-acid', text: '(CH3COO)2Mn, heat', pdfPage: 10, example: 'ethane to ethanoic acid (9.23)' },
  { id: 'tertiary-oxidation', text: 'KMnO4 oxidation', pdfPage: 10, example: '2-methylpropane to 2-methylpropan-2-ol (9.24)' },
  { id: 'isomerisation', text: 'anhydrous AlCl3 and HCl gas', pdfPage: 10, example: 'n-hexane (9.25)' },
  { id: 'aromatisation', text: '773 K, 10 to 20 atm, Cr2O3, V2O5 or Mo2O3', pdfPage: 10, example: 'n-hexane to benzene (9.26)' },
  { id: 'steam-reforming', text: '1273 K, Ni', pdfPage: 10, example: 'CH4 with steam (9.27)' },
  { id: 'pyrolysis', text: '773 K (hexane); 973 K with Pt, Pd or Ni (dodecane)', pdfPage: 10, example: '9.28, 9.29' },
  { id: 'dehydrohalogenation', text: 'alcoholic KOH, heat', pdfPage: 15, example: 'alkyl halide to alkene (9.34)' },
  { id: 'dehydration', text: 'concentrated H2SO4, heat', pdfPage: 16, example: 'ethanol to ethene (9.37)' },
  { id: 'dehalogenation', text: 'Zn', pdfPage: 16, example: 'vicinal dihalide (9.35, 9.36)' },
  { id: 'hx-addition', text: 'HCl, HBr or HI (no solvent)', pdfPage: 17, example: 'propene + HBr (9.42)' },
  { id: 'peroxide', text: 'benzoyl peroxide (organic peroxide): anti-Markovnikov, HBr only', pdfPage: 18, example: 'propene + HBr (9.43)' },
  { id: 'x2-addition', text: 'CCl4 solvent (bromine solution decolourised)', pdfPage: 17, example: 'ethene + Br2 (9.38)' },
  { id: 'h2so4-addition', text: 'cold concentrated H2SO4', pdfPage: 19, example: 'ethene + H2SO4 (9.44)' },
  { id: 'hydration', text: 'dilute H2SO4 (H+) and water', pdfPage: 19, example: '2-methylpropene (9.46)' },
  { id: 'baeyer', text: 'dilute aqueous KMnO4, cold', pdfPage: 19, example: 'ethene to ethane-1,2-diol (9.47)' },
  { id: 'acidic-permanganate', text: 'acidic KMnO4 (oxidation to ketones and/or acids)', pdfPage: 19, example: '2-methylpropene (9.49), but-2-ene (9.50)' },
  { id: 'ozonolysis', text: 'ozone, then Zn and water', pdfPage: 19, example: 'propene (9.51)' },
  { id: 'polymerisation', text: 'high temperature and pressure with a catalyst', pdfPage: 20, example: 'ethene (9.53)' },
  { id: 'alkyne-h2', text: 'H2 with Pt, Pd or Ni (alkene, then alkane)', pdfPage: 23, example: 'ethyne (9.62)' },
  { id: 'alkyne-hx', text: 'HX, Markovnikov addition twice gives the gem-dihalide', pdfPage: 23, example: 'ethyne + HBr (9.65)' },
  { id: 'alkyne-hydration', text: 'Hg2+ and H+ (dilute H2SO4) at 333 K', pdfPage: 23, example: 'ethyne (9.67)' },
  { id: 'calcium-carbide', text: 'calcium carbide with water', pdfPage: 21, example: 'CaC2 (9.57)' },
  { id: 'lime-kiln', text: 'heat (calcination of limestone)', pdfPage: 21, example: 'CaCO3 (9.55)' },
  { id: 'alkyne-from-dihalide', text: 'alcoholic KOH, then NaNH2', pdfPage: 22, example: 'vicinal dihalide to ethyne (text, p. 316)' },
  { id: 'acetylide-sodium', text: 'Na, or NaNH2 (sodamide)', pdfPage: 22, example: 'ethyne (9.59, 9.60, 9.61)' },
  { id: 'cyclic-polymerisation', text: 'red hot iron tube, 873 K', pdfPage: 24, example: 'ethyne to benzene (9.69)' },
  { id: 'nitration', text: 'concentrated HNO3 and concentrated H2SO4 (nitrating mixture), heated', pdfPage: 28, example: 'benzene (9.72)' },
  { id: 'chlorination-lewis', text: 'Cl2 with anhydrous AlCl3 or FeCl3 (a Lewis acid)', pdfPage: 28, example: 'benzene (9.73)' },
  { id: 'bromination-lewis', text: 'Br2 with FeBr3 or AlCl3 (a Lewis acid)', pdfPage: 28, example: 'benzene (text, p. 322)' },
  { id: 'sulphonation', text: 'fuming sulphuric acid (oleum), heat', pdfPage: 28, example: 'benzene (9.74)' },
  { id: 'alkylation', text: 'anhydrous AlCl3 with an alkyl chloride', pdfPage: 28, example: 'benzene + CH3Cl (9.75)' },
  { id: 'acylation', text: 'anhydrous AlCl3 with an acyl chloride or acid anhydride, heat', pdfPage: 29, example: 'benzene (9.77, 9.78)' },
  { id: 'chlorination-excess', text: 'excess Cl2, anhydrous AlCl3, dark and cold', pdfPage: 29, example: 'benzene to hexachlorobenzene (9.79)' },
  { id: 'benzene-hydrogenation', text: 'Ni, heat', pdfPage: 30, example: 'benzene to cyclohexane (9.80)' },
  { id: 'benzene-uv-chlorination', text: 'ultraviolet light (three Cl2 add to benzene)', pdfPage: 30, example: 'benzene to BHC (9.81)' },
  { id: 'phenol-zinc', text: 'zinc dust, heat', pdfPage: 28, example: 'phenol to benzene (9.71)' },
  { id: 'benzoate-decarboxylation', text: 'sodalime (CaO), heat', pdfPage: 27, example: 'sodium benzoate (9.70)' },
  { id: 'arene-combustion', text: 'burns with a sooty flame in air', pdfPage: 30, example: 'benzene (9.82)' },
]

/** The condition text of a reaction id, or a RangeError if NCERT gives no such condition. */
export function conditionFor(id: string): ReactionCondition {
  const found = NCERT_UNIT9_CONDITIONS.find((c) => c.id === id)
  if (!found) throw new RangeError(`No NCERT condition is recorded for "${id}"`)
  return found
}

/** Bond data NCERT states in Unit 9, each with its page. Where the statements disagree see NCERT_UNIT9_ERRATA. */
export const NCERT_UNIT9_BOND_DATA: readonly BondDatum[] = [
  { quantity: 'C–C bond length (alkanes)', value: 154, unit: 'pm', pdfPage: 2, statedAs: 'C–C bond length 154 pm (Unit 8, quoted in 9.2)' },
  { quantity: 'C–H bond length (alkanes)', value: 112, unit: 'pm', pdfPage: 2, statedAs: 'C–H bond length 112 pm (Unit 8, quoted in 9.2)' },
  { quantity: 'C–C bond enthalpy', value: 348, unit: 'kJ mol-1', pdfPage: 12, statedAs: 'C–C bond enthalpy 348 kJ mol-1 (9.3.1, comparison with ethene)' },
  { quantity: 'C=C bond length', value: 134, unit: 'pm', pdfPage: 12, statedAs: 'C=C bond length (134 pm) in 9.3.1; Fig. 9.5(c) also prints 134 pm' },
  { quantity: 'C=C bond length', value: 133, unit: 'pm', pdfPage: 21, statedAs: 'C=C bond length (133 pm) in 9.4.2 (ethyne comparison)' },
  { quantity: 'C=C bond enthalpy', value: 681, unit: 'kJ mol-1', pdfPage: 12, statedAs: 'C=C bond enthalpy 681 kJ mol-1 (9.3.1)' },
  { quantity: 'C=C sigma bond enthalpy', value: 397, unit: 'kJ mol-1', pdfPage: 12, statedAs: 'sigma part of C=C, about 397 kJ mol-1 (9.3.1)' },
  { quantity: 'C=C pi bond enthalpy', value: 284, unit: 'kJ mol-1', pdfPage: 12, statedAs: 'pi part of C=C, about 284 kJ mol-1 (9.3.1)' },
  { quantity: 'C≡C bond length', value: 120, unit: 'pm', pdfPage: 21, statedAs: 'C≡C bond length 120 pm (9.4.2)' },
  { quantity: 'C≡C bond enthalpy', value: 823, unit: 'kJ mol-1', pdfPage: 21, statedAs: 'C≡C bond enthalpy 823 kJ mol-1 (9.4.2)' },
  { quantity: 'benzene C–C bond length', value: 139, unit: 'pm', pdfPage: 27, statedAs: 'all six C–C bonds of benzene 139 pm (9.5.2)' },
  { quantity: 'C–H bond length in ethene', value: 110, unit: 'pm', pdfPage: 13, statedAs: 'C–H 110 pm in Fig. 9.5(c)' },
  { quantity: 'ethane torsional barrier', value: 12.5, unit: 'kJ mol-1', pdfPage: 12, statedAs: 'energy difference between staggered and eclipsed ethane 12.5 kJ mol-1 (9.2.4)' },
  { quantity: 'ethane rotation barrier range', value: 1, unit: 'kJ mol-1 (to 20)', pdfPage: 11, statedAs: 'hindered by a small energy barrier of 1 to 20 kJ mol-1 (9.2.4)' },
  { quantity: 'C–H bond angle in ethyne', value: 180, unit: 'degrees', pdfPage: 21, statedAs: 'H–C–C bond angle 180 degrees (9.4.2)' },
  { quantity: 'methane H–C–H bond angle', value: 109.5, unit: 'degrees', pdfPage: 2, statedAs: 'All H–C–H bond angles 109.5 degrees (9.2)' },
]

/** Table 9.1, Nomenclature of a few organic compounds (PDF p. 5). */
export const NCERT_TABLE_9_1_NOMENCLATURE: NcertTable<NomenclatureRow> = {
  source: 'NCERT Unit 9, Table 9.1 (Nomenclature of a Few Organic Compounds), PDF p. 5',
  rows: [
    { label: '(a)', printedName: '4-Ethyl-2-methylhexane', smiles: 'CC(C)CC(CC)CC', remark: 'Lowest sum and alphabetical arrangement' },
    { label: '(b)', printedName: '3,3-Diethyl-5-isopropyl-4-methyloctane', smiles: 'CCC(CC)(CC)C(C)C(C(C)C)CCC', remark: 'Lowest sum and alphabetical arrangement' },
    { label: '(c)', printedName: '5-sec-Butyl-4-isopropyldecane', smiles: 'CCCC(C(C)C)C(C(C)CC)CCCCC', remark: 'sec is not considered while arranging alphabetically; isopropyl is taken as one word' },
    { label: '(d)', printedName: '5-(2,2-Dimethylpropyl)nonane', smiles: 'CCCCC(CC(C)(C)C)CCCC', remark: 'Further numbering to the substituents of the side chain' },
    { label: '(e)', printedName: '3-Ethyl-5-methylheptane', smiles: 'CCC(CC)CC(C)CC', remark: 'Alphabetical priority order' },
  ],
}

/** Table 9.2 (alkanes) (PDF p. 8). Its number is printed twice in the book: see NCERT_UNIT9_ERRATA. */
export const NCERT_TABLE_9_2_ALKANES: NcertTable<AlkaneBoilingRow> = {
  source: 'NCERT Unit 9, Table 9.2 (Variation of Melting Point and Boiling Point in Alkanes), PDF p. 8',
  rows: [
    { formula: 'CH4', name: 'Methane', molecularMass: 16, boilingPointK: 111.0, meltingPointK: 90.5 },
    { formula: 'C2H6', name: 'Ethane', molecularMass: 30, boilingPointK: 184.4, meltingPointK: 101.0 },
    { formula: 'C3H8', name: 'Propane', molecularMass: 44, boilingPointK: 230.9, meltingPointK: 85.3 },
    { formula: 'C4H10', name: 'Butane', molecularMass: 58, boilingPointK: 272.4, meltingPointK: 134.6 },
    { formula: 'C4H10', name: '2-Methylpropane', molecularMass: 58, boilingPointK: 261.0, meltingPointK: 114.7 },
    { formula: 'C5H12', name: 'Pentane', molecularMass: 72, boilingPointK: 309.1, meltingPointK: 143.3 },
    { formula: 'C5H12', name: '2-Methylbutane', molecularMass: 72, boilingPointK: 300.9, meltingPointK: 113.1 },
    { formula: 'C5H12', name: '2,2-Dimethylpropane', molecularMass: 72, boilingPointK: 282.5, meltingPointK: 256.4 },
    { formula: 'C6H14', name: 'Hexane', molecularMass: 86, boilingPointK: 341.9, meltingPointK: 178.5 },
    { formula: 'C7H16', name: 'Heptane', molecularMass: 100, boilingPointK: 371.4, meltingPointK: 182.4 },
    { formula: 'C8H18', name: 'Octane', molecularMass: 114, boilingPointK: 398.7, meltingPointK: 216.2 },
    { formula: 'C9H20', name: 'Nonane', molecularMass: 128, boilingPointK: 423.8, meltingPointK: 222.0 },
    { formula: 'C10H22', name: 'Decane', molecularMass: 142, boilingPointK: 447.1, meltingPointK: 243.3 },
    { formula: 'C20H42', name: 'Eicosane', molecularMass: 282, boilingPointK: 615.0, meltingPointK: 309.7 },
  ],
}

/** The alkyne table printed as "Table 9.2" (PDF p. 20). Its number duplicates Table 9.2 of the alkanes. */
export const NCERT_TABLE_9_2_ALKYNES: NcertTable<AlkynameRow> = {
  source: 'NCERT Unit 9, Table 9.2 (Common and IUPAC Names of Alkynes, CnH2n-2), printed under the same number as the alkane table; PDF p. 20',
  rows: [
    { n: 2, formula: 'C2H2', structure: 'H-C≡CH', commonName: 'Acetylene', iupacName: 'Ethyne' },
    { n: 3, formula: 'C3H4', structure: 'CH3-C≡CH', commonName: 'Methylacetylene', iupacName: 'Propyne' },
    { n: 4, formula: 'C4H6', structure: 'CH3CH2-C≡CH', commonName: 'Ethylacetylene', iupacName: 'But-1-yne' },
    { n: 4, formula: 'C4H6', structure: 'CH3-C≡C-CH3', commonName: 'Dimethylacetylene', iupacName: 'But-2-yne' },
  ],
}

/** The directing groups of NCERT 9.5.6 (PDF pp. 24 to 25; book pp. 324 to 325). */
export const NCERT_ORIENTING_GROUPS: readonly DirectingGroup[] = [
  { group: '-OH', effect: 'activating', directs: 'ortho-para', pdfPage: 30 },
  { group: '-NH2', effect: 'activating', directs: 'ortho-para', pdfPage: 30 },
  { group: '-NHR', effect: 'activating', directs: 'ortho-para', pdfPage: 30 },
  { group: '-NHCOCH3', effect: 'activating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-OCH3', effect: 'activating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-CH3', effect: 'activating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-C2H5', effect: 'activating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-F', effect: 'deactivating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-Cl', effect: 'deactivating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-Br', effect: 'deactivating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-I', effect: 'deactivating', directs: 'ortho-para', pdfPage: 31 },
  { group: '-NO2', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-CN', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-CHO', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-COR', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-COOH', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-COOR', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
  { group: '-SO3H', effect: 'deactivating', directs: 'meta', pdfPage: 31 },
]

/** The polynuclear hydrocarbons NCERT names in its box (9.6, PDF p. 31). */
export const NCERT_CARCINOGENS: readonly CarcinogenRow[] = [
  { name: '1,2-Benzanthracene', pdfPage: 31 },
  { name: '3-Methylcholanthrene', pdfPage: 31 },
  { name: '1,2-Benzpyrene', pdfPage: 31 },
  { name: '1,2,5,6-Dibenzanthracene', pdfPage: 31 },
  { name: '9,10-Dimethyl-1,2-benzanthracene', pdfPage: 31 },
]

/** Errata: the places where NCERT is wrong or inconsistent, each with its page. */
export const NCERT_UNIT9_ERRATA: readonly Unit9Erratum[] = [
  {
    where: 'Equation (9.1), ethene + H2',
    pdfPage: 6,
    printed: 'CH2=CH2 + H2 (Pt/Pd/Ni) → CH3–CH3, labelled "Propane (9.1)"',
    correct: 'labelled "Ethane"',
    note: 'The product CH3–CH3 is ethane (C2H6); propane is C3H8.',
  },
  {
    where: 'Equation (9.2), propene + H2',
    pdfPage: 6,
    printed: 'Reactant "CH3–CH=CH2 + H2" labelled "Propane"',
    correct: 'the reactant is labelled "Propene"; propane is the product (CH3–CH2–CH3)',
    note: 'CH3–CH=CH2 is propene. Propane is the product of the reaction, not the alkene.',
  },
  {
    where: 'Equation (9.3), propyne + H2 to propane',
    pdfPage: 6,
    printed: 'CH3–C≡CH + H2 → CH3–CH2–CH3 (one H2)',
    correct: 'CH3–C≡CH + 2 H2 → CH3–CH2–CH3 (two H2, Pt/Pd/Ni)',
    note: 'Propyne (C3H4) needs two molecules of H2 to give propane (C3H8). The equation is unbalanced in hydrogen as printed.',
  },
  {
    where: 'Equation (9.7), reactant of the Wurtz reaction',
    pdfPage: 7,
    printed: '"Bromomenthane" (bromomethane is the reactant)',
    correct: 'Bromomethane',
    note: 'Typing error in the name of CH3Br.',
  },
  {
    where: 'Equation (9.24), name of the product',
    pdfPage: 10,
    printed: '"2-Methylpropane-2-01"',
    correct: '2-Methylpropan-2-ol',
    note: 'The suffix is "-ol" (alcohol), printed as "-01".',
  },
  {
    where: 'Equation (9.25), formula of n-hexane',
    pdfPage: 10,
    printed: '"CH3(CH)2)4CH3"',
    correct: 'CH3(CH2)4CH3',
    note: 'Unbalanced brackets and a missing "2" in the CH2 groups; the formula of n-hexane is C6H14.',
  },
  {
    where: 'Equation (9.45) and the name printed under it',
    pdfPage: 19,
    printed: 'CH3–CH(OSO2OH)–CH3 named "Propyl hydrogen sulphate"',
    correct: 'propan-2-yl hydrogen sulphate (isopropyl hydrogen sulphate); propyl hydrogen sulphate would be CH3CH2CH2OSO2OH',
    note: 'The product of Markovnikov addition of H2SO4 to propene is the secondary alkyl sulphate. "Propyl" names the primary isomer.',
  },
  {
    where: 'Equation (9.55), calcination of calcium carbonate',
    pdfPage: 21,
    printed: 'CaCO3 → CaO + O2',
    correct: 'CaCO3 → CaO + CO2',
    note: 'The gas released on heating limestone is carbon dioxide, not oxygen.',
  },
  {
    where: 'C=C bond length, Section 9.3.1 (PDF p. 12) and Sections 9.4.2 and 9.5.2',
    pdfPage: 12,
    printed: 'p. 12: "The double bond is shorter in bond length (134 pm) than the C–C single bond (154 pm)"; p. 21: "shorter (120 pm) than those of C=C (133 pm) and C–C (154 pm)"; p. 27: "C—C double bond (133 pm)"',
    correct: 'one value for C=C (134 pm or 133 pm) in all three places',
    note: 'Two values are printed for the same bond length. Fig. 9.5(c) on PDF p. 13 also prints 134 pm.',
  },
  {
    where: 'C–H bond length, PDF p. 2 and Fig. 9.5(c) on PDF p. 13',
    pdfPage: 2,
    printed: 'p. 2: "154 pm and 112 pm respectively (Unit 8)"; p. 13, Fig. 9.5(c) label: "110 pm" on the C–H of ethene',
    correct: 'the book gives 112 pm and 110 pm for C–H without saying which carbon each refers to',
    note: 'Two C–H lengths are printed; the book states no reason for the difference.',
  },
  {
    where: 'Boiling point of butane, PDF p. 2 (text) and Table 9.2, PDF p. 8',
    pdfPage: 2,
    printed: 'p. 2: "Butane (n- butane), (b.p. 273 K)"; p. 8, Table 9.2: butane b.p. 272.4 K',
    correct: '272.4 K (Table 9.2)',
    note: 'The two values disagree in the rounding. Table 9.2 is the more precise source.',
  },
  {
    where: 'Table 9.2 numbering (two tables under one number)',
    pdfPage: 8,
    printed: 'p. 8: "Table 9.2 Variation of Melting Point and Boiling Point in Alkanes"; p. 20: "Table 9.2 Common and IUPAC Names of Alkynes (CnH2n–2)"',
    correct: 'the alkyne table should have its own number',
    note: 'The number is printed twice. The alkane table is cited in the text as Table 9.2 (PDF p. 8).',
  },
  {
    where: 'Problem 9.7 (i), name of the first alkene',
    pdfPage: 13,
    printed: '"2,8-dimethyl-3,6-decadiene"',
    correct: '2,8-dimethyldeca-3,6-diene',
    note: 'IUPAC puts the double-bond locants into the stem ("deca-3,6-diene"). The structure is right.',
  },
  {
    where: 'Problem 9.7 (iii), name of the given alkene',
    pdfPage: 13,
    printed: '"2-n-Propylpent-1-ene"',
    correct: '2-Propylpent-1-ene (IUPAC drops the n- prefix on a substituent)',
    note: 'Minor.',
  },
]

/**
 * The in-text Problems 9.1 to 9.14 of Unit 9. `printedAnswer` is what the PDF prints where the text extract
 * gives it; where the solution is only in the page image it says so. `computedAnswer` comes from the models in
 * this folder (names from iupacName, products from hydrocarbon-reactions, counts from countsOf) and is
 * checked by ncert-unit9-tables.test.ts. `check` says how it was obtained: 'iupacName', 'model' or 'text'.
 */
export const NCERT_UNIT9_PROBLEMS: readonly Unit9Problem[] = [
  {
    number: '9.1',
    pdfPage: 3,
    question: 'Chain isomers of alkanes with molecular formula C6H14, with IUPAC names.',
    printedAnswer: 'n-hexane; 2-methylpentane; 3-methylpentane; 2,3-dimethylbutane; 2,2-dimethylbutane (PDF p. 3).',
    computedAnswer: 'hexane; 2-methylpentane; 3-methylpentane; 2,2-dimethylbutane; 2,3-dimethylbutane (five chain isomers)',
    check: 'iupacName',
  },
  {
    number: '9.2',
    pdfPage: 4,
    question: 'Isomeric C5H11 alkyl groups, and the alcohols formed by putting –OH on each carbon of the chain.',
    printedAnswer: 'pentan-1-ol; pentan-2-ol; pentan-3-ol; 3-methylbutan-1-ol; 2-methylbutan-1-ol; 2-methylbutan-2-ol; 2,2-dimethylpropan-1-ol; 3-methylbutan-2-ol (PDF p. 4).',
    computedAnswer: 'pentan-1-ol; pentan-2-ol; pentan-3-ol; 2-methylbutan-1-ol; 3-methylbutan-1-ol; 3-methylbutan-2-ol; 2-methylbutan-2-ol; 2,2-dimethylpropan-1-ol (eight alcohols)',
    check: 'iupacName',
  },
  {
    number: '9.3',
    pdfPage: 5,
    question: 'IUPAC names of (i) (CH3)3C–CH2C(CH3)3, (ii) (CH3)2C(C2H5)2, (iii) tetra-tert-butylmethane.',
    printedAnswer: '(i) 2,2,4,4-Tetramethylpentane; (ii) 3,3-Dimethylpentane; (iii) 3,3-Di-tert-butyl-2,2,4,4-tetramethylpentane',
    computedAnswer: '(i) 2,2,4,4-tetramethylpentane; (ii) 3,3-dimethylpentane; (iii) 3,3-ditert-butyl-2,2,4,4-tetramethylpentane (the namer omits the hyphen and brackets of "di-tert-butyl"; same molecule)',
    check: 'iupacName',
  },
  {
    number: '9.4',
    pdfPage: 6,
    question: 'Structural formulas of 3,4,4,5-tetramethylheptane and 2,5-dimethylhexane.',
    printedAnswer: '(i) CH3CH2CH(CH3)C(CH3)2CH(CH3)CH2CH3 (numbering from the end that gives the lower locant to ethyl); (ii) (CH3)2CHCH2CH2CH(CH3)2',
    computedAnswer: '(i) 3,4,4,5-tetramethylheptane; (ii) 2,5-dimethylhexane (both names reproduced from the printed structures)',
    check: 'iupacName',
  },
  {
    number: '9.5',
    pdfPage: 6,
    question: 'Write structures for 2-ethylpentane and 5-ethyl-3-methylheptane and say why the names are incorrect.',
    printedAnswer: 'Names printed as incorrect; correct names: 3-methylhexane (i) and 3-ethyl-5-methylheptane (ii).',
    computedAnswer: '(i) the structure is 3-methylhexane (a longer chain exists; 2-ethylpentane is not the name); (ii) the structure is 3-ethyl-5-methylheptane (ethyl gets the lower locant at the first point of difference)',
    check: 'iupacName',
  },
  {
    number: '9.6',
    pdfPage: 7,
    question: 'Sodium salt of which acid gives propane, and the equation.',
    printedAnswer: 'Butanoic acid: CH3CH2CH2COONa + NaOH with soda lime (CaO) gives CH3CH2CH3 + Na2CO3.',
    computedAnswer: 'Sodium butanoate (sodium salt of butanoic acid): \\ce{CH3CH2CH2COONa + NaOH -> CH3CH2CH3 + Na2CO3}',
    check: 'model',
  },
  {
    number: '9.7',
    pdfPage: 13,
    question: 'IUPAC names of four polyenes/alkenes (i) (CH3)2CH–CH=CH–CH2–CH=CH–CH(C2H5)CH3, (ii) octa-tetraene, (iii) CH2=C(CH2CH2CH3)2, (iv) CH3CH(CH2CH2CH2CH3)CH=C(CH2CH3)CH2CH(CH3)CH3.',
    printedAnswer: '(i) 2,8-dimethyl-3,6-decadiene; (ii) 1,3,5,7-octatetraene; (iii) 2-n-propylpent-1-ene; (iv) 4-ethyl-2,6-dimethyldec-4-ene',
    computedAnswer: '(i) 2,8-dimethyldeca-3,6-diene; (ii) octa-1,3,5,7-tetraene; (iii) 2-propylpent-1-ene; (iv) 4-ethyl-2,6-dimethyldec-4-ene',
    check: 'iupacName',
  },
  {
    number: '9.8',
    pdfPage: 13,
    question: 'Number of σ and π bonds in the four structures of Problem 9.7.',
    printedAnswer: '(i) σ 33, π 2; (ii) σ 17, π 4; (iii) σ 23, π 1; (iv) σ 41, π 1',
    computedAnswer: '(i) σ 33, π 2; (ii) σ 17, π 4; (iii) σ 23, π 1; (iv) σ 41, π 1 (σ = heavy-atom bonds + C–H bonds; π = bond order − 1, summed)',
    check: 'model',
  },
  {
    number: '9.9',
    pdfPage: 14,
    question: 'Structures and IUPAC names of the structural isomers of alkenes with formula C5H10.',
    printedAnswer: 'pent-1-ene; pent-2-ene; 2-methylbut-2-ene; 3-methylbut-1-ene; 2-methylbut-1-ene (PDF p. 14).',
    computedAnswer: 'pent-1-ene; pent-2-ene (cis and trans); 2-methylbut-1-ene; 2-methylbut-2-ene; 3-methylbut-1-ene (five structural isomers)',
    check: 'iupacName',
  },
  {
    number: '9.10',
    pdfPage: 15,
    question: 'Cis and trans isomers of (i) CHCl=CHCl and (ii) C2H5C(CH3)=C(CH3)C2H5, with names.',
    printedAnswer: 'Cis and trans structures drawn and named (solution on PDF p. 15; the names printed are the cis/trans-1,2-dichloroethene and 3,4-dimethylhex-3-ene).',
    computedAnswer: '(i) cis-1,2-dichloroethene and trans-1,2-dichloroethene; (ii) cis- and trans-3,4-dimethylhex-3-ene (the namer does not place the cis/trans label for this alkene; see report)',
    check: 'model',
  },
  {
    number: '9.11',
    pdfPage: 15,
    question: 'Which of the given compounds show cis-trans isomerism; (i) is (CH3)2C=CH–C2H5.',
    printedAnswer: '(iii) and (iv) show cis-trans isomerism. In (i) and (ii) two identical groups are attached to one doubly bonded carbon (PDF p. 15).',
    computedAnswer: '(i) (CH3)2C=CH–C2H5 = 2-methylpent-2-ene: no cis-trans isomerism, because C-2 carries two methyl groups',
    check: 'model',
  },
  {
    number: '9.12',
    pdfPage: 18,
    question: 'IUPAC names of the products of HBr addition to hex-1-ene (i) without peroxide and (ii) with peroxide.',
    printedAnswer: '(i) 2-bromohexane (Markovnikov); (ii) 1-bromohexane (peroxide effect)',
    computedAnswer: '(i) 2-bromohexane (major, Markovnikov); (ii) 1-bromohexane (major, peroxide effect)',
    check: 'model',
  },
  {
    number: '9.13',
    pdfPage: 21,
    question: 'Isomers of the fifth member of the alkyne series (C6H10): structures, names and the type of isomerism.',
    printedAnswer: 'hex-1-yne; hex-2-yne; hex-3-yne; 3-methylpent-1-yne; 4-methylpent-1-yne; 4-methylpent-2-yne; 3,3-dimethylbut-1-yne (PDF p. 21).',
    computedAnswer: 'hex-1-yne; hex-2-yne; hex-3-yne; 3-methylpent-1-yne; 4-methylpent-1-yne; 4-methylpent-2-yne; 3,3-dimethylbut-1-yne (seven; structural isomers: chain and position isomerism)',
    check: 'iupacName',
  },
  {
    number: '9.14',
    pdfPage: 24,
    question: 'How to convert ethanoic acid into benzene.',
    printedAnswer: 'Ethanoic acid → sodium ethanoate → methane (soda lime) → ethyne (electric arc) → benzene (red-hot iron tube, 873 K).',
    computedAnswer: 'CH3COOH → CH3COONa → CH4 (decarboxylate, model) → C2H2 (arc; not modelled) → C6H6 (cyclicPolymerise, model): three steps modelled, one not',
    check: 'model',
  },
]

/**
 * The end-of-unit Exercises 9.1 to 9.25 (PDF pp. 32–33). `computedAnswer` is the model's answer where a model
 * applies (check 'model' or 'iupacName'); otherwise it is a short textbook answer (check 'text').
 */
export const NCERT_UNIT9_EXERCISES: readonly Unit9Exercise[] = [
  { number: '9.1', pdfPage: 32, question: 'How does ethane form during chlorination of methane?', computedAnswer: 'Free radicals: two CH3• radicals (from Cl• abstraction) combine to give CH3CH3.', check: 'text' },
  { number: '9.2', pdfPage: 32, question: 'IUPAC names of the seven hydrocarbons (a) to (g).', computedAnswer: '(a) 2-methylbut-2-ene; (b) pent-1-en-3-yne; (c) buta-1,3-diene; (d) 4-phenylbut-1-ene (iupacName gives 1-phenylbut-3-ene: namer error, see report); (e) 2-methylphenol; (f) 5-(2-methylpropyl)decane (printed as isobutyl); (g) 4-ethyldeca-1,5,8-triene', check: 'iupacName' },
  { number: '9.3', pdfPage: 32, question: 'Structural formulas and IUPAC names of all isomers of (a) C4H8 with one double bond and (b) C5H8 with one triple bond.', computedAnswer: '(a) but-1-ene; but-2-ene (cis and trans); 2-methylprop-1-ene. (b) pent-1-yne; pent-2-yne; 3-methylbut-1-yne', check: 'iupacName' },
  { number: '9.4', pdfPage: 32, question: 'IUPAC names of the ozonolysis products of (i) pent-2-ene, (ii) 3,4-dimethylhept-3-ene, (iii) 2-ethylbut-1-ene, (iv) 1-phenylbut-1-ene.', computedAnswer: '(i) ethanal + propanal; (ii) butan-2-one + pentan-2-one; (iii) methanal + pentan-3-one; (iv) benzaldehyde + propanal (the aromatic ring is kept)', check: 'model' },
  { number: '9.5', pdfPage: 33, question: 'An alkene A on ozonolysis gives a mixture of ethanal and pentan-3-one. Structure and IUPAC name of A.', computedAnswer: '3-ethylpent-2-ene (ozonolysisReverse)', check: 'model' },
  { number: '9.6', pdfPage: 33, question: 'Alkene A has three C–C and eight C–H σ bonds and one C–C π bond; on ozonolysis it gives two moles of an aldehyde of molar mass 44 u. Name A.', computedAnswer: 'but-2-ene (two CH3CHO, molar mass 44 u, from ozonolysisReverse)', check: 'model' },
  { number: '9.7', pdfPage: 33, question: 'Propanal and pentan-3-one are the ozonolysis products of an alkene. Its structure?', computedAnswer: '3-ethylhex-3-ene (ozonolysisReverse)', check: 'model' },
  { number: '9.8', pdfPage: 33, question: 'Combustion equations of (i) butane, (ii) pentene, (iii) hexyne, (iv) toluene.', computedAnswer: '\\ce{2CH3CH2CH2CH3 + 13O2 -> 8CO2 + 10H2O}; \\ce{CH2=CHCH2CH3 + 6O2 -> 4CO2 + 4H2O}; \\ce{CH3CH2CH2C#CH + 7O2 -> 5CO2 + 4H2O}; \\ce{C7H8 + 9O2 -> 7CO2 + 4H2O}', check: 'model' },
  { number: '9.9', pdfPage: 33, question: 'Draw cis and trans hex-2-ene. Which isomer has the higher b.p. and why?', computedAnswer: 'cis-hex-2-ene has the higher boiling point: its bent shape gives a net dipole, so the intermolecular attraction is larger (text reasoning)', check: 'text' },
  { number: '9.10', pdfPage: 33, question: 'Why is benzene extraordinarily stable though it contains three double bonds?', computedAnswer: 'Its six π electrons are delocalised over the ring (resonance), which lowers the energy: 6 π electrons = 4n+2 with n = 1.', check: 'text' },
  { number: '9.11', pdfPage: 33, question: 'What are the necessary conditions for a system to be aromatic?', computedAnswer: 'Cyclic, fully conjugated (every ring atom in a p-orbital π system) and 4n+2 π electrons (Hückel rule), with a planar ring.', check: 'text' },
  { number: '9.12', pdfPage: 33, question: 'Explain why the three given systems (i) methylene-cyclohexadiene, (ii) five-membered ring, (iii) cyclooctatetraene are not aromatic.', computedAnswer: '(i) not fully conjugated: sp3 ring carbon; (ii) not fully conjugated: sp3 CH2 carbon; (iii) 8 π electrons (4n), tub-shaped and non-planar, so non-aromatic. Verdicts from huckel().', check: 'model' },
  { number: '9.13', pdfPage: 33, question: 'Conversion of benzene into (i) p-nitrobromobenzene, (ii) m-nitrochlorobenzene, (iii) p-nitrotoluene, (iv) acetophenone.', computedAnswer: '(i) bromination, then nitration (Br is o/p): p-nitrobromobenzene; (ii) nitration, then chlorination (NO2 is m-directing): m-nitrochlorobenzene; (iii) Friedel–Crafts methylation (CH3Cl/AlCl3), then nitration: p-nitrotoluene; (iv) Friedel–Crafts acetylation (CH3COCl/AlCl3): acetophenone', check: 'model' },
  { number: '9.14', pdfPage: 33, question: 'Number of carbon atoms and H atoms bonded to each carbon in H3C–CH2–C(CH3)2–CH2–CH(CH3)2.', computedAnswer: '9 carbons: 5 primary CH3 (3 H each), 2 secondary CH2 (2 H each), 1 tertiary CH (1 H), 1 quaternary C (0 H); total 20 H', check: 'model' },
  { number: '9.15', pdfPage: 33, question: 'What effect does branching of an alkane chain have on its boiling point?', computedAnswer: 'Branching lowers the boiling point: the more compact molecule has less surface contact (see alkane-properties.ts)', check: 'model' },
  { number: '9.16', pdfPage: 33, question: 'HBr + propene gives 2-bromopropane, with benzoyl peroxide 1-bromopropane: explain with mechanism.', computedAnswer: 'Markovnikov (ionic): the 2° carbocation is more stable, so 2-bromopropane. Peroxide (radical): the 2° radical is more stable than the 1° one, but Br• adds to the CH2 end, so 1-bromopropane.', check: 'model' },
    { number: '9.17', pdfPage: 33, question: 'Products of ozonolysis of 1,2-dimethylbenzene (o-xylene); how does the result support the Kekulé structure?', computedAnswer: 'Form I (the C=C between the two methyl-bearing carbons is double) gives biacetyl and two glyoxal; form II gives two methylglyoxal and glyoxal. Summed over both forms: glyoxal : methylglyoxal : biacetyl = 3 : 2 : 1, which is the evidence that both Kekulé structures contribute (ozonolysisOfArene).', check: 'model' },
  { number: '9.18', pdfPage: 33, question: 'Arrange benzene, n-hexane and ethyne in decreasing order of acidic behaviour, with reason.', computedAnswer: 'ethyne > benzene > n-hexane: the sp C–H of ethyne holds its electrons close to the nucleus (50% s character); see alkyneAcidity.', check: 'text' },
  { number: '9.19', pdfPage: 33, question: 'Why does benzene undergo electrophilic substitution easily and nucleophilic substitution with difficulty?', computedAnswer: 'The electron-rich π cloud attracts electrophiles; a nucleophile is repelled by the same electron cloud, so nucleophilic attack is difficult.', check: 'text' },
  { number: '9.20', pdfPage: 33, question: 'How would you convert (i) ethyne, (ii) ethene, (iii) hexane into benzene?', computedAnswer: '(i) 3 C2H2 → C6H6 (cyclicPolymerise); (ii) CH2=CH2 + Br2 → CH2BrCH2Br, then alcoholic KOH/NaNH2 → C2H2, then as (i); (iii) C6H14 → C6H6 + 4H2 (aromatise)', check: 'model' },
  { number: '9.21', pdfPage: 33, question: 'Write structures of all the alkenes which on hydrogenation give 2-methylbutane.', computedAnswer: '3-methylbut-1-ene; 2-methylbut-1-ene; 2-methylbut-2-ene (each hydrogenates to 2-methylbutane)', check: 'model' },
  { number: '9.22', pdfPage: 33, question: 'Order of decreasing reactivity towards E+: (a) chlorobenzene, 2,4-dinitrochlorobenzene, p-nitrochlorobenzene; (b) toluene, p-nitrotoluene, p-dinitrobenzene.', computedAnswer: '(a) chlorobenzene > p-nitrochlorobenzene > 2,4-dinitrochlorobenzene; (b) toluene > p-nitrotoluene > p-dinitrobenzene (relativeNitrationRate)', check: 'model' },
  { number: '9.23', pdfPage: 33, question: 'Out of benzene, m-dinitrobenzene and toluene, which will undergo nitration most easily, and why?', computedAnswer: 'Toluene: the CH3 group activates the ring; m-dinitrobenzene is strongly deactivated by two NO2 groups.', check: 'model' },
  { number: '9.24', pdfPage: 33, question: 'Name a Lewis acid other than anhydrous AlCl3 that can be used in the ethylation of benzene.', computedAnswer: 'Anhydrous FeCl3 (also BF3 or other Lewis acids).', check: 'text' },
  { number: '9.25', pdfPage: 33, question: 'Why is the Wurtz reaction not preferred for alkanes with an odd number of carbons? Illustrate.', computedAnswer: 'Two different halides give a mixture: CH3Br + CH3CH2Br gives ethane, propane and butane (wurtz model).', check: 'model' },
]
