/**
 * Class 12 Unit 6 (Haloalkanes and Haloarenes): the data every Section of the Unit shares.
 *
 * Lead-owned. NCERT's tabulated data and the facts it states (conditions, products) may be
 * shown and plotted (ADR-0001); NCERT's worked Examples, Intext questions and Exercises may not.
 * Each export says where its numbers come from. Values NCERT only draws (Fig. 6.1) come from a
 * standard data source and say so.
 *
 * Formulas: `unicode` is for SVG and UI text (real subscripts, U+2212 minus); `ce` is the
 * mhchem source for Prose (`$\ce{...}$`); `smiles` is Kekulé SMILES for parseSmiles (the parser
 * does not read aromatic lower-case atoms: write benzene as C1=CC=CC=C1).
 */

export type Halogen = 'F' | 'Cl' | 'Br' | 'I'
export const HALOGENS: readonly Halogen[] = ['F', 'Cl', 'Br', 'I']

// ---------------------------------------------------------------------------------------------
// Table 6.1: common and IUPAC names of some halides
// ---------------------------------------------------------------------------------------------

export interface HalideName {
  unicode: string
  ce: string
  smiles: string
  common: string
  /** IUPAC name as NCERT prints it (capitalised as a name at the start of a line). */
  iupac: string
  /** A second name NCERT also accepts, or the current IUPAC form where NCERT's is older. */
  iupacAlt?: string
}

export const NCERT_TABLE_6_1: readonly HalideName[] = [
  { unicode: 'CH₃CH₂CH(Cl)CH₃', ce: 'CH3CH2CH(Cl)CH3', smiles: 'CCC(Cl)C', common: 'sec-Butyl chloride', iupac: '2-Chlorobutane' },
  { unicode: '(CH₃)₃CCH₂Br', ce: '(CH3)3CCH2Br', smiles: 'CC(C)(C)CBr', common: 'neo-Pentyl bromide', iupac: '1-Bromo-2,2-dimethylpropane' },
  { unicode: '(CH₃)₃CBr', ce: '(CH3)3CBr', smiles: 'CC(C)(C)Br', common: 'tert-Butyl bromide', iupac: '2-Bromo-2-methylpropane' },
  { unicode: 'CH₂=CHCl', ce: 'CH2=CHCl', smiles: 'C=CCl', common: 'Vinyl chloride', iupac: 'Chloroethene' },
  // NCERT prints "3-Bromopropene"; the current IUPAC form (and iupac-organic's output) is 3-bromoprop-1-ene.
  { unicode: 'CH₂=CHCH₂Br', ce: 'CH2=CHCH2Br', smiles: 'C=CCBr', common: 'Allyl bromide', iupac: '3-Bromopropene', iupacAlt: '3-Bromoprop-1-ene' },
  { unicode: 'o-ClC₆H₄CH₃', ce: 'o-ClC6H4CH3', smiles: 'CC1=CC=CC=C1Cl', common: 'o-Chlorotoluene', iupac: '1-Chloro-2-methylbenzene', iupacAlt: '2-Chlorotoluene' },
  { unicode: 'C₆H₅CH₂Cl', ce: 'C6H5CH2Cl', smiles: 'ClCC1=CC=CC=C1', common: 'Benzyl chloride', iupac: 'Chlorophenylmethane' },
  { unicode: 'CH₂Cl₂', ce: 'CH2Cl2', smiles: 'ClCCl', common: 'Methylene chloride', iupac: 'Dichloromethane' },
  { unicode: 'CHCl₃', ce: 'CHCl3', smiles: 'ClC(Cl)Cl', common: 'Chloroform', iupac: 'Trichloromethane' },
  { unicode: 'CHBr₃', ce: 'CHBr3', smiles: 'BrC(Br)Br', common: 'Bromoform', iupac: 'Tribromomethane' },
  { unicode: 'CCl₄', ce: 'CCl4', smiles: 'ClC(Cl)(Cl)Cl', common: 'Carbon tetrachloride', iupac: 'Tetrachloromethane' },
  { unicode: 'CH₃CH₂CH₂F', ce: 'CH3CH2CH2F', smiles: 'CCCF', common: 'n-Propyl fluoride', iupac: '1-Fluoropropane' },
] as const

// ---------------------------------------------------------------------------------------------
// Table 6.2: C–X bond lengths, bond enthalpies and dipole moments (CH₃–X)
// ---------------------------------------------------------------------------------------------

export interface CarbonHalogenBond {
  halogen: Halogen
  unicode: string
  ce: string
  lengthPm: number
  enthalpyKjPerMol: number
  dipoleDebye: number
}

export const NCERT_TABLE_6_2: readonly CarbonHalogenBond[] = [
  { halogen: 'F', unicode: 'CH₃–F', ce: 'CH3-F', lengthPm: 139, enthalpyKjPerMol: 452, dipoleDebye: 1.847 },
  { halogen: 'Cl', unicode: 'CH₃–Cl', ce: 'CH3-Cl', lengthPm: 178, enthalpyKjPerMol: 351, dipoleDebye: 1.86 },
  { halogen: 'Br', unicode: 'CH₃–Br', ce: 'CH3-Br', lengthPm: 193, enthalpyKjPerMol: 293, dipoleDebye: 1.83 },
  { halogen: 'I', unicode: 'CH₃–I', ce: 'CH3-I', lengthPm: 214, enthalpyKjPerMol: 234, dipoleDebye: 1.636 },
] as const

/** Dipole moments to NCERT's printed precision (Table 6.2 prints 1.847, 1.860, 1.830, 1.636). */
export function formatDipole(debye: number): string {
  return `${debye.toFixed(3)} D`
}

/**
 * NCERT 6.7.2 compares a C–Cl bond in a haloalkane (177 pm) with one in a haloarene (169 pm).
 * These are NCERT's running-text "typical" values; Table 6.2's CH₃–Cl is 178 pm. Use this pair
 * only for the haloalkane/haloarene comparison and Table 6.2 everywhere else.
 */
export const C_CL_BOND_LENGTH_COMPARISON_PM = { haloalkane: 177, haloarene: 169 } as const

// ---------------------------------------------------------------------------------------------
// Physical properties (6.6)
// ---------------------------------------------------------------------------------------------

export type AlkylGroup = 'methyl' | 'ethyl' | 'n-propyl'

export interface AlkylHalideBoilingPoint {
  alkyl: AlkylGroup
  halogen: Halogen
  unicode: string
  ce: string
  /** Normal boiling point in K, rounded to the nearest kelvin. */
  bpK: number
}

/**
 * Boiling points of the alkyl halides NCERT Fig. 6.1 draws as bars (Cl, Br, I) plus the
 * fluorides (for NCERT's order RI > RBr > RCl > RF). Fig. 6.1 prints no values: these are
 * standard data (CRC Handbook / PubChem, °C + 273.15, rounded) and agree with the bar heights.
 * Show them as data with the source "standard data", never as "NCERT values".
 */
export const ALKYL_HALIDE_BOILING_POINTS_K: readonly AlkylHalideBoilingPoint[] = [
  { alkyl: 'methyl', halogen: 'F', unicode: 'CH₃F', ce: 'CH3F', bpK: 195 },
  { alkyl: 'methyl', halogen: 'Cl', unicode: 'CH₃Cl', ce: 'CH3Cl', bpK: 249 },
  { alkyl: 'methyl', halogen: 'Br', unicode: 'CH₃Br', ce: 'CH3Br', bpK: 277 },
  { alkyl: 'methyl', halogen: 'I', unicode: 'CH₃I', ce: 'CH3I', bpK: 316 },
  { alkyl: 'ethyl', halogen: 'F', unicode: 'CH₃CH₂F', ce: 'CH3CH2F', bpK: 235 },
  { alkyl: 'ethyl', halogen: 'Cl', unicode: 'CH₃CH₂Cl', ce: 'CH3CH2Cl', bpK: 285 },
  { alkyl: 'ethyl', halogen: 'Br', unicode: 'CH₃CH₂Br', ce: 'CH3CH2Br', bpK: 312 },
  { alkyl: 'ethyl', halogen: 'I', unicode: 'CH₃CH₂I', ce: 'CH3CH2I', bpK: 345 },
  { alkyl: 'n-propyl', halogen: 'F', unicode: 'CH₃CH₂CH₂F', ce: 'CH3CH2CH2F', bpK: 271 },
  { alkyl: 'n-propyl', halogen: 'Cl', unicode: 'CH₃CH₂CH₂Cl', ce: 'CH3CH2CH2Cl', bpK: 320 },
  { alkyl: 'n-propyl', halogen: 'Br', unicode: 'CH₃CH₂CH₂Br', ce: 'CH3CH2CH2Br', bpK: 344 },
  { alkyl: 'n-propyl', halogen: 'I', unicode: 'CH₃CH₂CH₂I', ce: 'CH3CH2CH2I', bpK: 376 },
] as const

/**
 * Boiling points of the PARENT hydrocarbons (standard data, K). NCERT's claim is that halides
 * boil well above the hydrocarbons they come from; compare a halide only with its parent
 * (CH₃Cl with CH₄), never with a "hydrocarbon of comparable molar mass" chosen by hand.
 */
export const PARENT_ALKANE_BOILING_POINTS_K: Readonly<Record<AlkylGroup, { unicode: string; ce: string; bpK: number }>> = {
  methyl: { unicode: 'CH₄', ce: 'CH4', bpK: 112 },
  ethyl: { unicode: 'CH₃CH₃', ce: 'CH3CH3', bpK: 185 },
  'n-propyl': { unicode: 'CH₃CH₂CH₃', ce: 'CH3CH2CH3', bpK: 231 },
}

/** Room temperature used for "gas at room temperature" (NCERT Fig. 6.1 marks CH₃Cl, CH₃Br, C₂H₅Cl as gases). */
export const ROOM_TEMPERATURE_K = 298

/** NCERT 6.6: isomeric bromobutanes (b.p. printed by NCERT). Branching lowers the boiling point. */
export const NCERT_BROMOBUTANE_ISOMER_BP_K = [
  { name: '1-Bromobutane', unicode: 'CH₃CH₂CH₂CH₂Br', smiles: 'CCCCBr', bpK: 375 },
  { name: '2-Bromobutane', unicode: 'CH₃CH₂CH(Br)CH₃', smiles: 'CCC(Br)C', bpK: 364 },
  { name: '2-Bromo-2-methylpropane', unicode: '(CH₃)₃CBr', smiles: 'CC(C)(C)Br', bpK: 346 },
] as const

/** NCERT 6.6: dichlorobenzenes (b.p. and m.p. printed by NCERT). The para isomer melts highest (symmetry, packing). */
export const NCERT_DICHLOROBENZENE_K = [
  { isomer: 'ortho', name: '1,2-Dichlorobenzene', smiles: 'ClC1=CC=CC=C1Cl', bpK: 453, mpK: 256 },
  { isomer: 'meta', name: '1,3-Dichlorobenzene', smiles: 'ClC1=CC=CC(Cl)=C1', bpK: 446, mpK: 249 },
  { isomer: 'para', name: '1,4-Dichlorobenzene', smiles: 'ClC1=CC=C(Cl)C=C1', bpK: 448, mpK: 323 },
] as const

/** Table 6.3: densities of some haloalkanes, g mL⁻¹ (NCERT's printed precision). Water is 1.00 for comparison. */
export const NCERT_TABLE_6_3 = [
  { unicode: 'n-C₃H₇Cl', ce: 'CH3CH2CH2Cl', densityGPerMl: 0.89, printed: '0.89' },
  { unicode: 'n-C₃H₇Br', ce: 'CH3CH2CH2Br', densityGPerMl: 1.335, printed: '1.335' },
  { unicode: 'n-C₃H₇I', ce: 'CH3CH2CH2I', densityGPerMl: 1.747, printed: '1.747' },
  { unicode: 'CH₂Cl₂', ce: 'CH2Cl2', densityGPerMl: 1.336, printed: '1.336' },
  { unicode: 'CHCl₃', ce: 'CHCl3', densityGPerMl: 1.489, printed: '1.489' },
  { unicode: 'CCl₄', ce: 'CCl4', densityGPerMl: 1.595, printed: '1.595' },
] as const
export const WATER_DENSITY_G_PER_ML = 1.0

// ---------------------------------------------------------------------------------------------
// Table 6.4: nucleophilic substitution of alkyl halides R–X
// ---------------------------------------------------------------------------------------------

export interface NucleophileRow {
  reagent: string
  /** The nucleophile (Unicode). NCERT prints "H" for LiAlH₄: it is the hydride ion H⁻. */
  nucleophile: string
  product: string
  productClass: string
  /** Groups that can attack through two different atoms (6.7.1). */
  ambident?: { attacksThrough: 'C' | 'N' | 'O'; note: string }
}

export const NCERT_TABLE_6_4: readonly NucleophileRow[] = [
  { reagent: 'NaOH (KOH)', nucleophile: 'HO⁻', product: 'ROH', productClass: 'Alcohol' },
  { reagent: 'H₂O', nucleophile: 'H₂O', product: 'ROH', productClass: 'Alcohol' },
  { reagent: 'NaOR′', nucleophile: 'R′O⁻', product: 'ROR′', productClass: 'Ether' },
  { reagent: 'NaI', nucleophile: 'I⁻', product: 'R–I', productClass: 'Alkyl iodide' },
  { reagent: 'NH₃', nucleophile: 'NH₃', product: 'RNH₂', productClass: 'Primary amine' },
  { reagent: 'R′NH₂', nucleophile: 'R′NH₂', product: 'RNHR′', productClass: 'Secondary amine' },
  { reagent: 'R′R″NH', nucleophile: 'R′R″NH', product: 'RNR′R″', productClass: 'Tertiary amine' },
  { reagent: 'KCN', nucleophile: '⁻C≡N', product: 'RCN', productClass: 'Nitrile (cyanide)', ambident: { attacksThrough: 'C', note: 'KCN is ionic: the free cyanide ion attacks through carbon (C–C bond is stronger than C–N)' } },
  { reagent: 'AgCN', nucleophile: 'Ag–C≡N:', product: 'RNC', productClass: 'Isonitrile (isocyanide)', ambident: { attacksThrough: 'N', note: 'AgCN is mainly covalent: carbon is tied up with silver, so nitrogen\'s lone pair attacks' } },
  { reagent: 'KNO₂', nucleophile: 'O=N–O⁻', product: 'R–O–N=O', productClass: 'Alkyl nitrite', ambident: { attacksThrough: 'O', note: 'attack through oxygen' } },
  { reagent: 'AgNO₂', nucleophile: 'Ag–O–N=O', product: 'R–NO₂', productClass: 'Nitroalkane', ambident: { attacksThrough: 'N', note: 'attack through nitrogen' } },
  { reagent: 'R′COOAg', nucleophile: 'R′COO⁻', product: 'R′COOR', productClass: 'Ester' },
  { reagent: 'LiAlH₄', nucleophile: 'H⁻', product: 'RH', productClass: 'Hydrocarbon' },
  { reagent: 'R′⁻M⁺', nucleophile: 'R′⁻', product: 'RR′', productClass: 'Alkane' },
] as const

// ---------------------------------------------------------------------------------------------
// Mechanisms (6.7.1)
// ---------------------------------------------------------------------------------------------

/**
 * NCERT Fig. 6.3: relative rates of SN2 reaction (steric effects). NCERT prints 0 for tert-butyl:
 * it means "too slow to measure" — display it as "≈ 0" or "negligible", never as a measured zero.
 */
export const NCERT_FIG_6_3_SN2_RELATIVE_RATE = [
  { substrate: 'Methyl', degree: 'methyl', unicode: 'CH₃–X', relativeRate: 30, display: '30' },
  { substrate: 'Ethyl', degree: '1°', unicode: 'CH₃CH₂–X', relativeRate: 1, display: '1' },
  { substrate: 'Isopropyl', degree: '2°', unicode: '(CH₃)₂CH–X', relativeRate: 0.02, display: '0.02' },
  { substrate: 'tert-Butyl', degree: '3°', unicode: '(CH₃)₃C–X', relativeRate: 0, display: '≈ 0' },
] as const

/** NCERT 6.7.1 orders (state them as NCERT does). */
export const NCERT_REACTIVITY_ORDERS = {
  sn2Substrate: 'methyl > primary > secondary > tertiary',
  sn1Substrate: 'tertiary > secondary > primary > methyl',
  /** For both SN1 and SN2. NCERT writes R–I > R–Br > R–Cl >> R–F. */
  halogen: 'R–I > R–Br > R–Cl ≫ R–F',
  alcoholsWithHX: 'tertiary > secondary > primary',
  boilingPointSameAlkyl: 'RI > RBr > RCl > RF',
} as const

/** NCERT 6.7.1 (elimination): 2-bromopentane with alcoholic KOH (NCERT's printed percentages). */
export const NCERT_ZAITSEV_2_BROMOPENTANE = {
  substrate: { name: '2-Bromopentane', smiles: 'CCCC(Br)C' },
  products: [
    { name: 'Pent-2-ene', smiles: 'CCC=CC', percent: 81, major: true },
    { name: 'Pent-1-ene', smiles: 'CCCC=C', percent: 19, major: false },
  ],
} as const

// ---------------------------------------------------------------------------------------------
// Haloarenes (6.5, 6.7.2)
// ---------------------------------------------------------------------------------------------

/**
 * NCERT 6.7.2: replacing Cl by OH gets easier as –NO₂ groups are added ortho/para to Cl.
 * Conditions as NCERT prints them (T in K). Step (ii) H⁺ acidifies the phenoxide.
 */
export const NCERT_HALOARENE_HYDROLYSIS = [
  { substrate: 'Chlorobenzene', smiles: 'ClC1=CC=CC=C1', product: 'Phenol', nitroGroups: 0, reagent: 'NaOH', temperatureK: 623, pressureAtm: 300, conditions: '(i) NaOH, 623 K, 300 atm  (ii) H⁺' },
  { substrate: '1-Chloro-4-nitrobenzene', smiles: 'ClC1=CC=C(C=C1)[N+](=O)[O-]', product: '4-Nitrophenol', nitroGroups: 1, reagent: 'NaOH', temperatureK: 443, pressureAtm: null, conditions: '(i) NaOH, 443 K  (ii) H⁺' },
  { substrate: '1-Chloro-2,4-dinitrobenzene', smiles: 'ClC1=C(C=C(C=C1)[N+](=O)[O-])[N+](=O)[O-]', product: '2,4-Dinitrophenol', nitroGroups: 2, reagent: 'NaOH', temperatureK: 368, pressureAtm: null, conditions: '(i) NaOH, 368 K  (ii) H⁺' },
  { substrate: '2-Chloro-1,3,5-trinitrobenzene', smiles: 'ClC1=C(C=C(C=C1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]', product: '2,4,6-Trinitrophenol', nitroGroups: 3, reagent: 'H₂O', temperatureK: null, pressureAtm: null, conditions: 'warm H₂O' },
] as const

// ---------------------------------------------------------------------------------------------
// Things NCERT gets wrong or leaves loose (never repeat a slip; follow the ruling)
// ---------------------------------------------------------------------------------------------

export const NCERT_UNIT6_NOTES = [
  { id: 'fig-6-1-no-values', note: 'Fig. 6.1 draws boiling points as bars with no printed values. ALKYL_HALIDE_BOILING_POINTS_K holds standard data that matches the bars; label it "standard data".' },
  { id: 'c-cl-177-vs-178', note: 'NCERT 6.7.2 says a haloalkane C–Cl bond is 177 pm; Table 6.2 gives CH₃–Cl as 178 pm. Use 178 pm with Table 6.2 and the 177/169 pm pair only in the haloalkane vs haloarene comparison, as typical values.' },
  { id: 'table-6-1-3-bromopropene', note: 'Table 6.1 prints "3-Bromopropene" for allyl bromide; the current IUPAC name is 3-bromoprop-1-ene. Either may be shown; say they name the same compound if both appear.' },
  { id: 'table-6-4-hydride', note: 'Table 6.4 prints the LiAlH₄ nucleophile as "H"; it is the hydride ion H⁻.' },
  { id: 'fig-6-3-zero', note: 'Fig. 6.3 prints the tert-butyl SN2 relative rate as 0: show "≈ 0" (negligible), never as an exact zero.' },
  { id: 'dipole-not-monotonic', note: 'Table 6.2 dipole moments are not monotonic: CH₃–Cl (1.860 D) is the largest and CH₃–I (1.636 D) the smallest. Never say the dipole moment rises or falls steadily from F to I.' },
] as const
