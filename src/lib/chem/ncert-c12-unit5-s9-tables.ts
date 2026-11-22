/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5, Section 5.7
 * (Importance and Applications of Coordination Compounds), book pp. 136-137.
 * Facts are stated in the running text; there is no printed table in this section.
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export type ApplicationField = 'analysis' | 'metallurgy' | 'biology' | 'industry' | 'medicine'

export interface CoordinationApplication {
  readonly id: string
  readonly use: string
  readonly field: ApplicationField
  /** Entity or agent as NCERT writes it; null where NCERT names no formula. */
  readonly entity: string | null
  /** mhchem formula for the entity, or null. */
  readonly entityTex: string | null
  readonly metal: string
  /** Oxidation state of the metal in the entity when it is derivable from the printed formula. */
  readonly oxidationState: number | null
  readonly coordinationNumber: number | null
  readonly note: string
}

export const NCERT_APPLICATIONS: readonly CoordinationApplication[] = [
  { id: 'hardness', use: 'Hardness of water by titration with Na2EDTA', field: 'analysis', entity: null, entityTex: null, metal: 'Ca, Mg', oxidationState: 2, coordinationNumber: null, note: 'Ca2+ and Mg2+ form stable EDTA complexes with different stability constants, so they can be estimated selectively.' },
  { id: 'gold', use: 'Extraction of gold', field: 'metallurgy', entity: '[Au(CN)2]-', entityTex: '[Au(CN)2]-', metal: 'Au', oxidationState: 1, coordinationNumber: 2, note: 'Gold combines with cyanide in the presence of oxygen and water; zinc then separates the metal.' },
  { id: 'nickel', use: 'Purification of nickel', field: 'metallurgy', entity: '[Ni(CO)4]', entityTex: '[Ni(CO)4]', metal: 'Ni', oxidationState: 0, coordinationNumber: 4, note: 'Impure nickel is converted to the carbonyl, which decomposes to pure nickel.' },
  { id: 'chlorophyll', use: 'Photosynthesis pigment', field: 'biology', entity: 'chlorophyll', entityTex: null, metal: 'Mg', oxidationState: null, coordinationNumber: null, note: 'Coordination compound of magnesium.' },
  { id: 'haemoglobin', use: 'Oxygen carrier in blood', field: 'biology', entity: 'haemoglobin', entityTex: null, metal: 'Fe', oxidationState: null, coordinationNumber: null, note: 'Red pigment of blood, a coordination compound of iron.' },
  { id: 'b12', use: 'Anti-pernicious anaemia factor', field: 'biology', entity: 'vitamin B12 (cyanocobalamine)', entityTex: null, metal: 'Co', oxidationState: null, coordinationNumber: null, note: 'Coordination compound of cobalt.' },
  { id: 'wilkinson', use: 'Hydrogenation of alkenes', field: 'industry', entity: '[(Ph3P)3RhCl]', entityTex: '[(Ph3P)3RhCl]', metal: 'Rh', oxidationState: null, coordinationNumber: null, note: 'Wilkinson catalyst.' },
  { id: 'silver-plating', use: 'Electroplating with silver', field: 'industry', entity: '[Ag(CN)2]-', entityTex: '[Ag(CN)2]-', metal: 'Ag', oxidationState: 1, coordinationNumber: 2, note: 'Smoother, more even coat than from simple metal ions.' },
  { id: 'gold-plating', use: 'Electroplating with gold', field: 'industry', entity: '[Au(CN)2]-', entityTex: '[Au(CN)2]-', metal: 'Au', oxidationState: 1, coordinationNumber: 2, note: 'Smoother, more even coat than from simple metal ions.' },
  { id: 'hypo', use: 'Fixing black and white film with hypo', field: 'industry', entity: '[Ag(S2O3)2]3-', entityTex: '[Ag(S2O3)2]^3-', metal: 'Ag', oxidationState: 1, coordinationNumber: 2, note: 'Undecomposed AgBr dissolves as this complex ion.' },
  { id: 'cu-fe', use: 'Removal of excess copper and iron', field: 'medicine', entity: 'D-penicillamine, desferrioxime B', entityTex: null, metal: 'Cu, Fe', oxidationState: null, coordinationNumber: null, note: 'Chelating ligands that form coordination compounds with the metals.' },
  { id: 'lead', use: 'Treatment of lead poisoning', field: 'medicine', entity: 'EDTA', entityTex: null, metal: 'Pb', oxidationState: null, coordinationNumber: null, note: 'Chelate therapy.' },
  { id: 'cisplatin', use: 'Inhibiting growth of tumours', field: 'medicine', entity: 'cis-platin', entityTex: null, metal: 'Pt', oxidationState: null, coordinationNumber: null, note: 'Platinum coordination compounds, cis-platin and related compounds.' },
] as const

/** Analytical reagents named by NCERT for colour reactions with metal ions. */
export const NCERT_ANALYTICAL_REAGENTS: readonly string[] = [
  'EDTA',
  'DMG (dimethylglyoxime)',
  'alpha-nitroso-beta-naphthol',
  'cupron',
]
