/**
 * NCERT Class 12 Part II, Unit 8 (Aldehydes, Ketones and Carboxylic Acids): the data the Unit's Sections may show.
 * Lead-owned: Section agents read it and never edit it. Every value is as NCERT prints it (lech203, Reprint 2026-27);
 * structures that NCERT prints only as images are written here as Kekulé SMILES.
 */
import { iupacNameFromSmiles } from './iupac-organic'
import { canonicalKey, parseSmiles } from './molecule-parse'

export interface NamedCompound {
  /** Kekulé SMILES, drawn with the organic components. */
  smiles: string
  common: string
  /** IUPAC name exactly as NCERT prints it (capitalised as in the table). */
  iupac: string
}

/** Table 8.1: common and IUPAC names of some aldehydes and ketones. */
export const TABLE_8_1_ALDEHYDES: readonly NamedCompound[] = [
  { smiles: 'C=O', common: 'Formaldehyde', iupac: 'Methanal' },
  { smiles: 'CC=O', common: 'Acetaldehyde', iupac: 'Ethanal' },
  { smiles: 'CC(C)C=O', common: 'Isobutyraldehyde', iupac: '2-Methylpropanal' },
  { smiles: 'CC1CCCC(C1)C=O', common: 'γ-Methylcyclohexanecarbaldehyde', iupac: '3-Methylcyclohexanecarbaldehyde' },
  { smiles: 'CC(OC)C=O', common: 'α-Methoxypropionaldehyde', iupac: '2-Methoxypropanal' },
  { smiles: 'CCCCC=O', common: 'Valeraldehyde', iupac: 'Pentanal' },
  { smiles: 'C=CC=O', common: 'Acrolein', iupac: 'Prop-2-enal' },
  { smiles: 'O=CC1=CC=CC=C1C=O', common: 'Phthaldehyde', iupac: 'Benzene-1,2-dicarbaldehyde' },
  { smiles: 'O=CC1=CC(Br)=CC=C1', common: 'm-Bromobenzaldehyde', iupac: '3-Bromobenzaldehyde' },
]

export const TABLE_8_1_KETONES: readonly NamedCompound[] = [
  { smiles: 'CC(=O)CCC', common: 'Methyl n-propyl ketone', iupac: 'Pentan-2-one' },
  { smiles: 'CC(C)C(=O)C(C)C', common: 'Diisopropyl ketone', iupac: '2,4-Dimethylpentan-3-one' },
  { smiles: 'CC1CCCCC1=O', common: 'α-Methylcyclohexanone', iupac: '2-Methylcyclohexanone' },
  { smiles: 'CC(C)=CC(C)=O', common: 'Mesityl oxide', iupac: '4-Methylpent-3-en-2-one' },
]

/** Table 8.3: names and structures of some carboxylic acids. */
export const TABLE_8_3_ACIDS: readonly NamedCompound[] = [
  { smiles: 'OC=O', common: 'Formic acid', iupac: 'Methanoic acid' },
  { smiles: 'CC(O)=O', common: 'Acetic acid', iupac: 'Ethanoic acid' },
  { smiles: 'CCC(O)=O', common: 'Propionic acid', iupac: 'Propanoic acid' },
  { smiles: 'CCCC(O)=O', common: 'Butyric acid', iupac: 'Butanoic acid' },
  { smiles: 'CC(C)C(O)=O', common: 'Isobutyric acid', iupac: '2-Methylpropanoic acid' },
  { smiles: 'OC(=O)C(O)=O', common: 'Oxalic acid', iupac: 'Ethanedioic acid' },
  { smiles: 'OC(=O)CC(O)=O', common: 'Malonic acid', iupac: 'Propanedioic acid' },
  { smiles: 'OC(=O)CCC(O)=O', common: 'Succinic acid', iupac: 'Butanedioic acid' },
  { smiles: 'OC(=O)CCCC(O)=O', common: 'Glutaric acid', iupac: 'Pentanedioic acid' },
  { smiles: 'OC(=O)CCCCC(O)=O', common: 'Adipic acid', iupac: 'Hexanedioic acid' },
  { smiles: 'OC(=O)CC(CC(O)=O)C(O)=O', common: 'Tricarballylic acid or carballylic acid', iupac: 'Propane-1,2,3-tricarboxylic acid' },
  { smiles: 'OC(=O)C1=CC=CC=C1', common: 'Benzoic acid', iupac: 'Benzenecarboxylic acid (Benzoic acid)' },
  { smiles: 'OC(=O)CC1=CC=CC=C1', common: 'Phenylacetic acid', iupac: '2-Phenylethanoic acid' },
  { smiles: 'OC(=O)C1=CC=CC=C1C(O)=O', common: 'Phthalic acid', iupac: 'Benzene-1,2-dicarboxylic acid' },
]

/** Table 8.2: N-substituted derivatives >C=N–Z formed with H₂N–Z. Product names are class names, not IUPAC names. */
export interface Table82Row {
  z: string
  reagent: string
  /** The reagent's formula as students see it (Unicode). */
  reagentFormula: string
  product: string
}

export const TABLE_8_2_DERIVATIVES: readonly Table82Row[] = [
  { z: '−H', reagent: 'Ammonia', reagentFormula: 'NH₃', product: 'Imine' },
  { z: '−R', reagent: 'Amine', reagentFormula: 'R–NH₂', product: 'Substituted imine (Schiff’s base)' },
  { z: '−OH', reagent: 'Hydroxylamine', reagentFormula: 'H₂N–OH', product: 'Oxime' },
  { z: '−NH₂', reagent: 'Hydrazine', reagentFormula: 'H₂N–NH₂', product: 'Hydrazone' },
  { z: '−NHC₆H₅', reagent: 'Phenylhydrazine', reagentFormula: 'H₂N–NHC₆H₅', product: 'Phenylhydrazone' },
  { z: '−NHC₆H₃(NO₂)₂', reagent: '2,4-Dinitrophenylhydrazine', reagentFormula: 'H₂N–NHC₆H₃(NO₂)₂', product: '2,4-Dinitrophenylhydrazone' },
  { z: '−NHCONH₂', reagent: 'Semicarbazide', reagentFormula: 'H₂N–NHCONH₂', product: 'Semicarbazone' },
]

/** NCERT's footnote to Table 8.2. */
export const DNP_NOTE = '2,4-DNP derivatives are yellow, orange or red solids, useful for characterisation of aldehydes and ketones.'

/** Section 8.3: boiling points of compounds of molecular mass 58 and 60, in NCERT's order (increasing b.p.). */
export interface BoilingPointRow {
  name: string
  smiles: string
  bpK: number
  molarMass: number
  /** The strongest attraction between molecules, as NCERT explains the order. */
  attraction: 'van der Waals' | 'dipole–dipole (weak)' | 'dipole–dipole' | 'hydrogen bonding'
}

export const CARBONYL_BOILING_POINTS: readonly BoilingPointRow[] = [
  { name: 'n-Butane', smiles: 'CCCC', bpK: 273, molarMass: 58, attraction: 'van der Waals' },
  { name: 'Methoxyethane', smiles: 'COCC', bpK: 281, molarMass: 60, attraction: 'dipole–dipole (weak)' },
  { name: 'Propanal', smiles: 'CCC=O', bpK: 322, molarMass: 58, attraction: 'dipole–dipole' },
  { name: 'Acetone', smiles: 'CC(C)=O', bpK: 329, molarMass: 58, attraction: 'dipole–dipole' },
  { name: 'Propan-1-ol', smiles: 'CCCO', bpK: 370, molarMass: 60, attraction: 'hydrogen bonding' },
]

/** Section 8.9.1: pKa values NCERT prints. `approx` marks the values NCERT gives as approximate (~). */
export interface PkaRow {
  name: string
  formula: string
  smiles: string
  pKa: number
  approx?: boolean
}

export const PKA_VALUES: readonly PkaRow[] = [
  { name: 'Hydrochloric acid', formula: 'HCl', smiles: 'Cl', pKa: -7.0 },
  { name: 'Trifluoroacetic acid', formula: 'CF₃COOH', smiles: 'FC(F)(F)C(O)=O', pKa: 0.23 },
  { name: '4-Nitrobenzoic acid', formula: 'O₂NC₆H₄COOH', smiles: 'OC(=O)C1=CC=C(C=C1)[N+]([O-])=O', pKa: 3.41 },
  { name: 'Benzoic acid', formula: 'C₆H₅COOH', smiles: 'OC(=O)C1=CC=CC=C1', pKa: 4.19 },
  { name: '4-Methoxybenzoic acid', formula: 'CH₃OC₆H₄COOH', smiles: 'COC1=CC=C(C=C1)C(O)=O', pKa: 4.46 },
  { name: 'Acetic acid', formula: 'CH₃COOH', smiles: 'CC(O)=O', pKa: 4.76 },
  { name: 'Phenol', formula: 'C₆H₅OH', smiles: 'OC1=CC=CC=C1', pKa: 10 },
  { name: 'Ethanol', formula: 'C₂H₅OH', smiles: 'CCO', pKa: 16, approx: true },
]

export type PkaBand = 'strong' | 'moderately strong' | 'weak' | 'extremely weak'

/** NCERT's bands: strong pKa < 1, moderately strong 1–5, weak 5–15, extremely weak > 15. */
export function pkaBand(pKa: number): PkaBand {
  if (pKa < 1) return 'strong'
  if (pKa <= 5) return 'moderately strong'
  if (pKa <= 15) return 'weak'
  return 'extremely weak'
}

/** Groups in increasing order of their acid-strengthening effect (NCERT: Ph < I < Br < Cl < F < CN < NO₂ < CF₃). */
export const SUBSTITUENT_ACIDITY_ORDER = ['Ph', 'I', 'Br', 'Cl', 'F', 'CN', 'NO₂', 'CF₃'] as const

/**
 * NCERT's acids ordered by acidity, STRONGEST FIRST (NCERT writes them with ">" and an arrow pointing to the stronger
 * end; it prints no pKa for most of them, so show the order only, never invented values).
 */
export const ACID_STRENGTH_SERIES: readonly { formula: string; smiles: string }[] = [
  { formula: 'CF₃COOH', smiles: 'FC(F)(F)C(O)=O' },
  { formula: 'CCl₃COOH', smiles: 'ClC(Cl)(Cl)C(O)=O' },
  { formula: 'CHCl₂COOH', smiles: 'ClC(Cl)C(O)=O' },
  { formula: 'NO₂CH₂COOH', smiles: 'OC(=O)C[N+]([O-])=O' },
  { formula: 'NC–CH₂COOH', smiles: 'N#CCC(O)=O' },
  { formula: 'FCH₂COOH', smiles: 'FCC(O)=O' },
  { formula: 'ClCH₂COOH', smiles: 'ClCC(O)=O' },
  { formula: 'BrCH₂COOH', smiles: 'BrCC(O)=O' },
  { formula: 'HCOOH', smiles: 'OC=O' },
  { formula: 'ClCH₂CH₂COOH', smiles: 'ClCCC(O)=O' },
  { formula: 'C₆H₅COOH', smiles: 'OC(=O)C1=CC=CC=C1' },
  { formula: 'C₆H₅CH₂COOH', smiles: 'OC(=O)CC1=CC=CC=C1' },
  { formula: 'CH₃COOH', smiles: 'CC(O)=O' },
  { formula: 'CH₃CH₂COOH', smiles: 'CCC(O)=O' },
]

/** Section 8.2: reagents and conditions as NCERT prints them over the arrows (checked on the page images). */
export const CARBONYL_PREPARATIONS = {
  dehydrogenation: { reagent: 'alcohol vapour over Ag or Cu', note: 'suits volatile alcohols; industrial' },
  ozonolysis: { reagent: 'O₃, then Zn dust and H₂O' },
  alkyneHydration: { reagent: 'H₂O with H₂SO₄ and HgSO₄', note: 'ethyne gives acetaldehyde; all other alkynes give ketones' },
  rosenmund: { name: 'Rosenmund reduction', reagent: 'H₂, Pd–BaSO₄', from: 'acyl chloride' },
  stephen: { name: 'Stephen reaction', reagent: 'SnCl₂ + HCl, then H₃O⁺', from: 'nitrile', via: 'imine RCH=NH' },
  dibalNitrile: { reagent: '1. AlH(i-Bu)₂ (DIBAL-H)  2. H₂O', from: 'nitrile', via: 'imine' },
  dibalEster: { reagent: '1. DIBAL-H  2. H₂O', from: 'ester' },
  etard: { name: 'Etard reaction', reagent: 'CrO₂Cl₂ in CS₂, then H₃O⁺', from: 'toluene', via: 'chromium complex' },
  chromicOxide: { reagent: 'CrO₃ in (CH₃CO)₂O at 273–283 K, then H₃O⁺ and heat', from: 'toluene', via: 'benzylidene diacetate' },
  sideChainChlorination: { reagent: 'Cl₂/hν, then H₂O at 373 K', from: 'toluene', via: 'benzal chloride', note: 'commercial method for benzaldehyde' },
  gattermanKoch: { name: 'Gatterman–Koch reaction', reagent: 'CO, HCl with anhydrous AlCl₃/CuCl', from: 'benzene' },
  dialkylcadmium: { reagent: 'R₂Cd (from CdCl₂ and a Grignard reagent)', from: 'acyl chloride', gives: 'ketone' },
  nitrileGrignard: { reagent: 'Grignard reagent, then hydrolysis', from: 'nitrile', gives: 'ketone' },
  friedelCraftsAcylation: { name: 'Friedel-Crafts acylation', reagent: 'acid chloride with anhydrous AlCl₃', from: 'benzene', gives: 'ketone' },
} as const

/**
 * Names the IUPAC namer cannot make (it rejects methanal, ring carbaldehydes, substituted aromatic aldehydes and acids,
 * anhydrides, oximes and hydrazones). Values are NCERT's names where NCERT prints one, otherwise lead-checked IUPAC
 * names. Use unit8Name(); never type a name the namer refuses.
 */
const NAME_OVERRIDES: readonly [string, string][] = [
  ['C=O', 'methanal'],
  ['CC1CCCC(C1)C=O', '3-methylcyclohexanecarbaldehyde'],
  ['O=CC1=CC=CC=C1C=O', 'benzene-1,2-dicarbaldehyde'],
  ['O=CC1=CC(Br)=CC=C1', '3-bromobenzaldehyde'],
  ['O=CC1=CC=CC(=C1)[N+]([O-])=O', '3-nitrobenzaldehyde'],
  ['O=CC1=CC=C(C=C1)[N+]([O-])=O', '4-nitrobenzaldehyde'],
  ['CC1=CC=C(C=O)C=C1', '4-methylbenzaldehyde'],
  ['OC(=O)CC(CC(O)=O)C(O)=O', 'propane-1,2,3-tricarboxylic acid'],
  ['OC(=O)C1=CC=CC=C1C(O)=O', 'benzene-1,2-dicarboxylic acid'],
  ['OC(=O)C1=CC=C(C=C1)[N+]([O-])=O', '4-nitrobenzoic acid'],
  ['OC(=O)C1=CC=CC(=C1)[N+]([O-])=O', '3-nitrobenzoic acid'],
  ['COC1=CC=C(C=C1)C(O)=O', '4-methoxybenzoic acid'],
  ['CC1=CC=C(C=C1)C(O)=O', '4-methylbenzoic acid'],
  ['ClC(=O)C1=CC=CC=C1', 'benzoyl chloride'],
  ['N#CC1=CC=CC=C1', 'benzonitrile'],
  ['O=C(C1=CC=CC=C1)C1=CC=CC=C1', 'benzophenone (diphenylmethanone)'],
  ['CC(=O)OC(C)=O', 'ethanoic anhydride'],
]

const OVERRIDE_BY_KEY = new Map(NAME_OVERRIDES.map(([s, n]) => [canonicalKey(parseSmiles(s)), n]))

/** The name to show for a molecule: a lead-checked override where the namer has a gap, else iupacNameFromSmiles. */
export function unit8Name(smiles: string): string {
  return OVERRIDE_BY_KEY.get(canonicalKey(parseSmiles(smiles))) ?? iupacNameFromSmiles(smiles)
}

/**
 * Slips and traps in NCERT's Unit 8 and in its extracted text. Never repeat a slip; read through the traps.
 */
export const NCERT_UNIT8_NOTES: readonly string[] = [
  'Text layer: Greek letters come out as Latin ones (σ → s, π → p, α → a, β → b, γ → g, α′ → a¢) and sp² as "sp" with a stray "2" nearby. Read a page image when a symbol matters.',
  'Text layer: every equation, structure and the condition text over arrows are images; they are missing or scrambled in the text. CARBONYL_PREPARATIONS holds the 8.2 conditions read off the page images.',
  'Example 8.2 says "n-Pentane" but its formula CH₃CH₂CH₂CH₃ is butane. Examples may not be used anyway; never repeat the slip.',
  'The 8.9.1 acid series is introduced as "increasing acidity" but is written strongest first with ">". ACID_STRENGTH_SERIES is strongest first; say "strongest to weakest" when you show it.',
  'NCERT prints pKa values only for HCl, CF₃COOH, benzoic, acetic, 4-methoxybenzoic and 4-nitrobenzoic acids, phenol and ethanol (~16). Never invent pKa values for the rest of the series.',
  'NCERT spells the reaction "Gatterman–Koch" and "Etard" (no accent). Use NCERT\'s spelling.',
  'Grignard addition to carbonyls is only referred to Unit 7 in 8.4; Section 8.4 does not re-teach it.',
]
