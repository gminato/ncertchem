/**
 * Values and data printed in NCERT Class 11 Part II, Unit 7 (Redox Reactions), 2026-27 reprint.
 *
 * Each table and reference reaction is transcribed as printed, with citations to the
 * line numbers in kech201.txt (plain pdftotext extraction).
 * Where NCERT contains typographical, factual, or balancing errors, the printed value is
 * recorded here and the discrepancy is documented in `NCERT_UNIT7_ERRATA`.
 */

import type { NcertTable } from './ncert-unit4-tables'

/** One row of Table 7.1: Standard Electrode Potentials at 298 K. */
export interface ElectrodePotentialRow {
  /** Oxidised form as printed, e.g. "F2(g)", "MnO4- + 8H+". */
  oxidised: string
  /** Reduced form as printed, e.g. "2F-", "Mn2+ + 4H2O". */
  reduced: string
  /** Number of electrons transferred in the reduction half-reaction. */
  electrons: number
  /** LaTeX / mhchem formatted reduction half-equation string. */
  halfEquation: string
  /** Standard reduction potential E° / V at 298 K. */
  e0: number
}

/**
 * NCERT Table 7.1: The Standard Electrode Potentials at 298 K (book p. 251, text line 2042).
 *
 * Ions are present as aqueous species and H2O as liquid; gases and solids are shown by g and s.
 * Listed in NCERT's exact printed order from strongest oxidising agent (F2) to weakest (Li+).
 */
export const NCERT_TABLE_7_1_ELECTRODE_POTENTIALS: NcertTable<ElectrodePotentialRow> = {
  source: 'NCERT Class 11 Part II, Unit 7, Table 7.1 (The Standard Electrode Potentials at 298 K), book p. 251, text line 2042',
  rows: [
    {
      oxidised: 'F2(g)',
      reduced: '2F-',
      electrons: 2,
      halfEquation: '\\ce{F2(g) + 2e- -> 2F-}',
      e0: 2.87,
    },
    {
      oxidised: 'Co3+',
      reduced: 'Co2+',
      electrons: 1,
      halfEquation: '\\ce{Co^{3+} + e- -> Co^{2+}}',
      e0: 1.81,
    },
    {
      oxidised: 'H2O2 + 2H+',
      reduced: '2H2O',
      electrons: 2,
      halfEquation: '\\ce{H2O2 + 2H+ + 2e- -> 2H2O}',
      e0: 1.78,
    },
    {
      oxidised: 'MnO4- + 8H+',
      reduced: 'Mn2+ + 4H2O',
      electrons: 5,
      halfEquation: '\\ce{MnO4- + 8H+ + 5e- -> Mn^{2+} + 4H2O}',
      e0: 1.51,
    },
    {
      oxidised: 'Au3+',
      reduced: 'Au(s)',
      electrons: 3,
      halfEquation: '\\ce{Au^{3+} + 3e- -> Au(s)}',
      e0: 1.4,
    },
    {
      oxidised: 'Cl2(g)',
      reduced: '2Cl-',
      electrons: 2,
      halfEquation: '\\ce{Cl2(g) + 2e- -> 2Cl-}',
      e0: 1.36,
    },
    {
      oxidised: 'Cr2O72- + 14H+',
      reduced: '2Cr3+ + 7H2O',
      electrons: 6,
      halfEquation: '\\ce{Cr2O7^{2-} + 14H+ + 6e- -> 2Cr^{3+} + 7H2O}',
      e0: 1.33,
    },
    {
      oxidised: 'O2(g) + 4H+',
      reduced: '2H2O',
      electrons: 4,
      halfEquation: '\\ce{O2(g) + 4H+ + 4e- -> 2H2O}',
      e0: 1.23,
    },
    {
      oxidised: 'MnO2(s) + 4H+',
      reduced: 'Mn2+ + 2H2O',
      electrons: 2,
      halfEquation: '\\ce{MnO2(s) + 4H+ + 2e- -> Mn^{2+} + 2H2O}',
      e0: 1.23,
    },
    {
      oxidised: 'Br2',
      reduced: '2Br-',
      electrons: 2,
      halfEquation: '\\ce{Br2 + 2e- -> 2Br-}',
      e0: 1.09,
    },
    {
      oxidised: 'NO3- + 4H+',
      reduced: 'NO(g) + 2H2O',
      electrons: 3,
      halfEquation: '\\ce{NO3- + 4H+ + 3e- -> NO(g) + 2H2O}',
      e0: 0.97,
    },
    {
      oxidised: '2Hg2+',
      reduced: 'Hg22+',
      electrons: 2,
      halfEquation: '\\ce{2Hg^{2+} + 2e- -> Hg2^{2+}}',
      e0: 0.92,
    },
    {
      oxidised: 'Ag+',
      reduced: 'Ag(s)',
      electrons: 1,
      halfEquation: '\\ce{Ag+ + e- -> Ag(s)}',
      e0: 0.8,
    },
    {
      oxidised: 'Fe3+',
      reduced: 'Fe2+',
      electrons: 1,
      halfEquation: '\\ce{Fe^{3+} + e- -> Fe^{2+}}',
      e0: 0.77,
    },
    {
      oxidised: 'O2(g) + 2H+',
      reduced: 'H2O2',
      electrons: 2,
      halfEquation: '\\ce{O2(g) + 2H+ + 2e- -> H2O2}',
      e0: 0.68,
    },
    {
      oxidised: 'I2(s)',
      reduced: '2I-',
      electrons: 2,
      halfEquation: '\\ce{I2(s) + 2e- -> 2I-}',
      e0: 0.54,
    },
    {
      oxidised: 'Cu+',
      reduced: 'Cu(s)',
      electrons: 1,
      halfEquation: '\\ce{Cu+ + e- -> Cu(s)}',
      e0: 0.52,
    },
    {
      oxidised: 'Cu2+',
      reduced: 'Cu(s)',
      electrons: 2,
      halfEquation: '\\ce{Cu^{2+} + 2e- -> Cu(s)}',
      e0: 0.34,
    },
    {
      oxidised: 'AgCl(s)',
      reduced: 'Ag(s) + Cl-',
      electrons: 1,
      halfEquation: '\\ce{AgCl(s) + e- -> Ag(s) + Cl-}',
      e0: 0.22,
    },
    {
      oxidised: 'AgBr(s)',
      reduced: 'Ag(s) + Br-',
      electrons: 1,
      halfEquation: '\\ce{AgBr(s) + e- -> Ag(s) + Br-}',
      e0: 0.1,
    },
    {
      oxidised: '2H+',
      reduced: 'H2(g)',
      electrons: 2,
      halfEquation: '\\ce{2H+ + 2e- -> H2(g)}',
      e0: 0.0,
    },
    {
      oxidised: 'Pb2+',
      reduced: 'Pb(s)',
      electrons: 2,
      halfEquation: '\\ce{Pb^{2+} + 2e- -> Pb(s)}',
      e0: -0.13,
    },
    {
      oxidised: 'Sn2+',
      reduced: 'Sn(s)',
      electrons: 2,
      halfEquation: '\\ce{Sn^{2+} + 2e- -> Sn(s)}',
      e0: -0.14,
    },
    {
      oxidised: 'Ni2+',
      reduced: 'Ni(s)',
      electrons: 2,
      halfEquation: '\\ce{Ni^{2+} + 2e- -> Ni(s)}',
      e0: -0.25,
    },
    {
      oxidised: 'Fe2+',
      reduced: 'Fe(s)',
      electrons: 2,
      halfEquation: '\\ce{Fe^{2+} + 2e- -> Fe(s)}',
      e0: -0.44,
    },
    {
      oxidised: 'Cr3+',
      reduced: 'Cr(s)',
      electrons: 3,
      halfEquation: '\\ce{Cr^{3+} + 3e- -> Cr(s)}',
      e0: -0.74,
    },
    {
      oxidised: 'Zn2+',
      reduced: 'Zn(s)',
      electrons: 2,
      halfEquation: '\\ce{Zn^{2+} + 2e- -> Zn(s)}',
      e0: -0.76,
    },
    {
      oxidised: '2H2O',
      reduced: 'H2(g) + 2OH-',
      electrons: 2,
      halfEquation: '\\ce{2H2O + 2e- -> H2(g) + 2OH-}',
      e0: -0.83,
    },
    {
      oxidised: 'Al3+',
      reduced: 'Al(s)',
      electrons: 3,
      halfEquation: '\\ce{Al^{3+} + 3e- -> Al(s)}',
      e0: -1.66,
    },
    {
      oxidised: 'Mg2+',
      reduced: 'Mg(s)',
      electrons: 2,
      halfEquation: '\\ce{Mg^{2+} + 2e- -> Mg(s)}',
      e0: -2.36,
    },
    {
      oxidised: 'Na+',
      reduced: 'Na(s)',
      electrons: 1,
      halfEquation: '\\ce{Na+ + e- -> Na(s)}',
      e0: -2.71,
    },
    {
      oxidised: 'Ca2+',
      reduced: 'Ca(s)',
      electrons: 2,
      halfEquation: '\\ce{Ca^{2+} + 2e- -> Ca(s)}',
      e0: -2.87,
    },
    {
      oxidised: 'K+',
      reduced: 'K(s)',
      electrons: 1,
      halfEquation: '\\ce{K+ + e- -> K(s)}',
      e0: -2.93,
    },
    {
      oxidised: 'Li+',
      reduced: 'Li(s)',
      electrons: 1,
      halfEquation: '\\ce{Li+ + e- -> Li(s)}',
      e0: -3.05,
    },
  ],
}

/** One row of the Period 3 highest oxidation state table. */
export interface Period3OxidationRow {
  group: number
  element: string
  /** Compound formula printed in NCERT. */
  compoundPrinted: string
  /** Chemically correct formula corresponding to the group highest oxidation state. */
  compoundCorrect: string
  /** Highest oxidation state of the group element. */
  highestOxidationState: number
}

/**
 * NCERT Period 3 Highest Oxidation State Table (book p. 241, text lines 630–645).
 * Note: NCERT printed "HClO" for Cl in Group 17 (+7), where HClO4 is the actual +7 compound.
 */
export const NCERT_PERIOD_3_HIGHEST_OXIDATION_STATES: NcertTable<Period3OxidationRow> = {
  source: 'NCERT Class 11 Part II, Unit 7, Period 3 Highest Oxidation State Table, book p. 241, text line 630',
  rows: [
    { group: 1, element: 'Na', compoundPrinted: 'NaCl', compoundCorrect: 'NaCl', highestOxidationState: 1 },
    { group: 2, element: 'Mg', compoundPrinted: 'MgSO4', compoundCorrect: 'MgSO4', highestOxidationState: 2 },
    { group: 13, element: 'Al', compoundPrinted: 'AlF3', compoundCorrect: 'AlF3', highestOxidationState: 3 },
    { group: 14, element: 'Si', compoundPrinted: 'SiCl4', compoundCorrect: 'SiCl4', highestOxidationState: 4 },
    { group: 15, element: 'P', compoundPrinted: 'P4O10', compoundCorrect: 'P4O10', highestOxidationState: 5 },
    { group: 16, element: 'S', compoundPrinted: 'SF6', compoundCorrect: 'SF6', highestOxidationState: 6 },
    { group: 17, element: 'Cl', compoundPrinted: 'HClO', compoundCorrect: 'HClO4', highestOxidationState: 7 },
  ],
}

/** Rational number { num, den } for exact fractional oxidation numbers. */
export interface RationalFraction {
  num: number
  den: number
}

/** One entry describing species with fractional or mixed oxidation states in NCERT. */
export interface FractionalOxidationRow {
  formula: string
  name: string
  average: RationalFraction
  individualStates?: readonly number[]
  stoichiometricComponents?: string
  structureDescription?: string
}

/**
 * NCERT Unit 7 Fractional Oxidation State and Mixed Oxide entries (book pp. 245–246, text lines 1393–1460).
 */
export const NCERT_FRACTIONAL_OXIDATION_SPECIES: readonly FractionalOxidationRow[] = [
  {
    formula: 'C3O2',
    name: 'carbon suboxide',
    average: { num: 4, den: 3 },
    individualStates: [2, 0, 2],
    structureDescription: 'O=C=C*=C=O with terminal carbons +2 and central carbon 0',
  },
  {
    formula: 'Br3O8',
    name: 'tribromooctaoxide',
    average: { num: 16, den: 3 },
    individualStates: [6, 4, 6],
    structureDescription: 'terminal bromines +6 and central bromine +4',
  },
  {
    formula: 'S4O6^2-',
    name: 'tetrathionate ion',
    average: { num: 5, den: 2 },
    individualStates: [5, 0, 0, 5],
    structureDescription: 'two terminal sulphurs +5 and two central sulphurs 0',
  },
  {
    formula: 'Fe3O4',
    name: 'ferrous ferric oxide',
    average: { num: 8, den: 3 },
    stoichiometricComponents: 'FeO·Fe2O3',
    structureDescription: 'stoichiometric mixture of 1 mol FeO (Fe +2) and 1 mol Fe2O3 (Fe +3)',
  },
  {
    formula: 'Mn3O4',
    name: 'trimanganese tetraoxide',
    average: { num: 8, den: 3 },
    stoichiometricComponents: '2MnO·MnO2',
    structureDescription: 'mixed oxide of 2 mol MnO (Mn +2) and 1 mol MnO2 (Mn +4)',
  },
  {
    formula: 'Pb3O4',
    name: 'red lead (minium)',
    average: { num: 8, den: 3 },
    stoichiometricComponents: '2PbO·PbO2',
    structureDescription: 'stoichiometric mixture of 2 mol PbO (Pb +2) and 1 mol PbO2 (Pb +4)',
  },
] as const

/** One row of Problem 7.3 Stock notation answers. */
export interface StockNotationRow {
  formula: string
  metalElement: string
  metalOxidationState: number
  stockRepresentation: string
}

/**
 * NCERT Problem 7.3 Stock notation answers (book p. 241, text lines 685–715).
 */
export const NCERT_PROBLEM_7_3_STOCK_NOTATION: readonly StockNotationRow[] = [
  { formula: 'HAuCl4', metalElement: 'Au', metalOxidationState: 3, stockRepresentation: 'HAu(III)Cl4' },
  { formula: 'Tl2O', metalElement: 'Tl', metalOxidationState: 1, stockRepresentation: 'Tl2(I)O' },
  { formula: 'FeO', metalElement: 'Fe', metalOxidationState: 2, stockRepresentation: 'Fe(II)O' },
  { formula: 'Fe2O3', metalElement: 'Fe', metalOxidationState: 3, stockRepresentation: 'Fe2(III)O3' },
  { formula: 'CuI', metalElement: 'Cu', metalOxidationState: 1, stockRepresentation: 'Cu(I)I' },
  { formula: 'CuO', metalElement: 'Cu', metalOxidationState: 2, stockRepresentation: 'Cu(II)O' },
  { formula: 'MnO', metalElement: 'Mn', metalOxidationState: 2, stockRepresentation: 'Mn(II)O' },
  { formula: 'MnO2', metalElement: 'Mn', metalOxidationState: 4, stockRepresentation: 'Mn(IV)O2' },
] as const

/** One chemical species in a structured redox reaction. */
export interface RedoxReactionSpecies {
  /** Chemical formula string, e.g. "Fe2+", "Cr2O7^2-", "H2O". */
  formula: string
  /** Stoichiometric coefficient (positive integer). */
  coefficient: number
  /** Physical state if specified. */
  state?: 's' | 'l' | 'g' | 'aq'
  /** Ionic charge (net charge on species). */
  charge?: number
}

/** Classification types of redox reactions defined in NCERT Section 7.3.1. */
export type NcertRedoxType =
  | 'combination'
  | 'decomposition'
  | 'metal-displacement'
  | 'non-metal-displacement'
  | 'disproportionation'
  | 'not-redox'
  | 'half-reaction'
  | 'redox'

/** A structured chemical reaction tagged with NCERT metadata. */
export interface StructuredRedoxReaction {
  /** Identifier matching the NCERT equation number, e.g. "7.1", "7.15". */
  id: string
  reactants: readonly RedoxReactionSpecies[]
  products: readonly RedoxReactionSpecies[]
  type: NcertRedoxType
  source: string
  comment?: string
}

/**
 * NCERT Unit 7 Numbered Reactions 7.1 to 7.60.
 */
export const NCERT_UNIT7_REACTIONS: readonly StructuredRedoxReaction[] = [
  {
    id: '7.1',
    reactants: [
      { formula: 'Mg', coefficient: 2, state: 's' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'MgO', coefficient: 2, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.1, text line 72',
  },
  {
    id: '7.2',
    reactants: [
      { formula: 'S', coefficient: 1, state: 's' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'SO2', coefficient: 1, state: 'g' }],
    type: 'combination',
    source: 'NCERT Eq. 7.2, text line 74',
  },
  {
    id: '7.3',
    reactants: [
      { formula: 'CH4', coefficient: 1, state: 'g' },
      { formula: 'O2', coefficient: 2, state: 'g' },
    ],
    products: [
      { formula: 'CO2', coefficient: 1, state: 'g' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    type: 'combination',
    source: 'NCERT Eq. 7.3, text line 93',
  },
  {
    id: '7.4',
    reactants: [
      { formula: 'H2S', coefficient: 2, state: 'g' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [
      { formula: 'S', coefficient: 2, state: 's' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.4, text line 104',
  },
  {
    id: '7.5',
    reactants: [
      { formula: 'Mg', coefficient: 1, state: 's' },
      { formula: 'F2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'MgF2', coefficient: 1, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.5, text line 114',
  },
  {
    id: '7.6',
    reactants: [
      { formula: 'Mg', coefficient: 1, state: 's' },
      { formula: 'Cl2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'MgCl2', coefficient: 1, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.6, text line 118',
  },
  {
    id: '7.7',
    reactants: [
      { formula: 'Mg', coefficient: 1, state: 's' },
      { formula: 'S', coefficient: 1, state: 's' },
    ],
    products: [{ formula: 'MgS', coefficient: 1, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.7, text line 121',
  },
  {
    id: '7.8',
    reactants: [{ formula: 'HgO', coefficient: 2, state: 's' }],
    products: [
      { formula: 'Hg', coefficient: 2, state: 'l' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    type: 'decomposition',
    source: 'NCERT Eq. 7.8, text line 151',
  },
  {
    id: '7.9',
    reactants: [
      { formula: 'FeCl3', coefficient: 2, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    products: [
      { formula: 'FeCl2', coefficient: 2, state: 'aq' },
      { formula: 'HCl', coefficient: 2, state: 'aq' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.9, text line 154',
  },
  {
    id: '7.10',
    reactants: [
      { formula: 'C2H4', coefficient: 1, state: 'g' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'C2H6', coefficient: 1, state: 'g' }],
    type: 'combination',
    source: 'NCERT Eq. 7.10, text line 157',
  },
  {
    id: '7.11',
    reactants: [
      { formula: 'HgCl2', coefficient: 2, state: 'aq' },
      { formula: 'SnCl2', coefficient: 1, state: 'aq' },
    ],
    products: [
      { formula: 'Hg2Cl2', coefficient: 1, state: 's' },
      { formula: 'SnCl4', coefficient: 1, state: 'aq' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.11, text line 160',
  },
  {
    id: '7.12',
    reactants: [
      { formula: 'Na', coefficient: 2, state: 's' },
      { formula: 'Cl2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'NaCl', coefficient: 2, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.12, text line 211',
  },
  {
    id: '7.13',
    reactants: [
      { formula: 'Na', coefficient: 4, state: 's' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'Na2O', coefficient: 2, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.13, text line 213',
  },
  {
    id: '7.14',
    reactants: [
      { formula: 'Na', coefficient: 2, state: 's' },
      { formula: 'S', coefficient: 1, state: 's' },
    ],
    products: [{ formula: 'Na2S', coefficient: 1, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.14, text line 215',
  },
  {
    id: '7.15',
    reactants: [
      { formula: 'Zn', coefficient: 1, state: 's' },
      { formula: 'Cu', coefficient: 1, state: 'aq', charge: 2 },
    ],
    products: [
      { formula: 'Zn', coefficient: 1, state: 'aq', charge: 2 },
      { formula: 'Cu', coefficient: 1, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.15, text line 315',
  },
  {
    id: '7.16',
    reactants: [
      { formula: 'Cu', coefficient: 1, state: 's' },
      { formula: 'Ag', coefficient: 2, state: 'aq', charge: 1 },
    ],
    products: [
      { formula: 'Cu', coefficient: 1, state: 'aq', charge: 2 },
      { formula: 'Ag', coefficient: 2, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.16, text line 346',
  },
  {
    id: '7.17',
    reactants: [
      { formula: 'Co', coefficient: 1, state: 's' },
      { formula: 'Ni', coefficient: 1, state: 'aq', charge: 2 },
    ],
    products: [
      { formula: 'Co', coefficient: 1, state: 'aq', charge: 2 },
      { formula: 'Ni', coefficient: 1, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.17, text line 355',
  },
  {
    id: '7.18',
    reactants: [
      { formula: 'H2', coefficient: 2, state: 'g' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'H2O', coefficient: 2, state: 'l' }],
    type: 'combination',
    source: 'NCERT Eq. 7.18, text line 403',
  },
  {
    id: '7.19',
    reactants: [
      { formula: 'H2', coefficient: 1, state: 's' },
      { formula: 'Cl2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'HCl', coefficient: 2, state: 'g' }],
    type: 'combination',
    source: 'NCERT Eq. 7.19, text line 421',
    comment: 'NCERT prints H2(s), misprint for H2(g)',
  },
  {
    id: '7.20',
    reactants: [
      { formula: 'CH4', coefficient: 1, state: 'g' },
      { formula: 'Cl2', coefficient: 4, state: 'g' },
    ],
    products: [
      { formula: 'CCl4', coefficient: 1, state: 'l' },
      { formula: 'HCl', coefficient: 4, state: 'g' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.20, text line 424',
  },
  {
    id: '7.21',
    reactants: [
      { formula: 'H2', coefficient: 2, state: 'g' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'H2O', coefficient: 2, state: 'l' }],
    type: 'combination',
    source: 'NCERT Eq. 7.21, text line 447',
  },
  {
    id: '7.22',
    reactants: [
      { formula: 'H2', coefficient: 1, state: 's' },
      { formula: 'Cl2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'HCl', coefficient: 2, state: 'g' }],
    type: 'combination',
    source: 'NCERT Eq. 7.22, text line 458',
    comment: 'NCERT prints H2(s), misprint for H2(g)',
  },
  {
    id: '7.23',
    reactants: [
      { formula: 'CH4', coefficient: 1, state: 'g' },
      { formula: 'Cl2', coefficient: 4, state: 'g' },
    ],
    products: [
      { formula: 'CCl4', coefficient: 1, state: 'l' },
      { formula: 'HCl', coefficient: 4, state: 'g' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.23, text line 461',
  },
  {
    id: '7.24',
    reactants: [
      { formula: 'C', coefficient: 1, state: 's' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'CO2', coefficient: 1, state: 'g' }],
    type: 'combination',
    source: 'NCERT Eq. 7.24, text line 815',
  },
  {
    id: '7.25',
    reactants: [
      { formula: 'Mg', coefficient: 3, state: 's' },
      { formula: 'N2', coefficient: 1, state: 'g' },
    ],
    products: [{ formula: 'Mg3N2', coefficient: 1, state: 's' }],
    type: 'combination',
    source: 'NCERT Eq. 7.25, text line 838',
  },
  {
    id: '7.26',
    reactants: [{ formula: 'H2O', coefficient: 2, state: 'l' }],
    products: [
      { formula: 'H2', coefficient: 2, state: 'g' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    type: 'decomposition',
    source: 'NCERT Eq. 7.26, text line 916',
  },
  {
    id: '7.27',
    reactants: [{ formula: 'NaH', coefficient: 2, state: 's' }],
    products: [
      { formula: 'Na', coefficient: 2, state: 's' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'decomposition',
    source: 'NCERT Eq. 7.27, text line 923',
  },
  {
    id: '7.28',
    reactants: [{ formula: 'KClO3', coefficient: 2, state: 's' }],
    products: [
      { formula: 'KCl', coefficient: 2, state: 's' },
      { formula: 'O2', coefficient: 3, state: 'g' },
    ],
    type: 'decomposition',
    source: 'NCERT Eq. 7.28, text line 928',
  },
  {
    id: '7.29',
    reactants: [
      { formula: 'CuSO4', coefficient: 1, state: 'aq' },
      { formula: 'Zn', coefficient: 1, state: 's' },
    ],
    products: [
      { formula: 'Cu', coefficient: 1, state: 's' },
      { formula: 'ZnSO4', coefficient: 1, state: 'aq' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.29, text line 881',
  },
  {
    id: '7.30',
    reactants: [
      { formula: 'V2O5', coefficient: 1, state: 's' },
      { formula: 'Ca', coefficient: 5, state: 's' },
    ],
    products: [
      { formula: 'V', coefficient: 2, state: 's' },
      { formula: 'CaO', coefficient: 5, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.30, text line 904',
  },
  {
    id: '7.31',
    reactants: [
      { formula: 'TiCl4', coefficient: 1, state: 'l' },
      { formula: 'Mg', coefficient: 2, state: 's' },
    ],
    products: [
      { formula: 'Ti', coefficient: 1, state: 's' },
      { formula: 'MgCl2', coefficient: 2, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.31, text line 908',
  },
  {
    id: '7.32',
    reactants: [
      { formula: 'Cr2O3', coefficient: 1, state: 's' },
      { formula: 'Al', coefficient: 2, state: 's' },
    ],
    products: [
      { formula: 'Al2O3', coefficient: 1, state: 's' },
      { formula: 'Cr', coefficient: 2, state: 's' },
    ],
    type: 'metal-displacement',
    source: 'NCERT Eq. 7.32, text line 912',
  },
  {
    id: '7.33',
    reactants: [
      { formula: 'Na', coefficient: 2, state: 's' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    products: [
      { formula: 'NaOH', coefficient: 2, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.33, text line 1006',
  },
  {
    id: '7.34',
    reactants: [
      { formula: 'Ca', coefficient: 1, state: 's' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    products: [
      { formula: 'Ca(OH)2', coefficient: 1, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.34, text line 1011',
  },
  {
    id: '7.35',
    reactants: [
      { formula: 'Mg', coefficient: 1, state: 's' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    products: [
      { formula: 'Mg(OH)2', coefficient: 1, state: 's' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.35, text line 1035',
    comment: 'Introduced as reaction with steam, so water should be H2O(g)',
  },
  {
    id: '7.36',
    reactants: [
      { formula: 'Fe', coefficient: 2, state: 's' },
      { formula: 'H2O', coefficient: 3, state: 'l' },
    ],
    products: [
      { formula: 'Fe2O3', coefficient: 1, state: 's' },
      { formula: 'H2', coefficient: 3, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.36, text line 1040',
    comment: 'Steam should be H2O(g); iron with steam gives Fe3O4: 3Fe + 4H2O(g) -> Fe3O4 + 4H2',
  },
  {
    id: '7.37',
    reactants: [
      { formula: 'Zn', coefficient: 1, state: 's' },
      { formula: 'HCl', coefficient: 2, state: 'aq' },
    ],
    products: [
      { formula: 'ZnCl2', coefficient: 1, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.37, text line 1071',
  },
  {
    id: '7.38',
    reactants: [
      { formula: 'Mg', coefficient: 1, state: 's' },
      { formula: 'HCl', coefficient: 2, state: 'aq' },
    ],
    products: [
      { formula: 'MgCl2', coefficient: 1, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.38, text line 1138',
  },
  {
    id: '7.39',
    reactants: [
      { formula: 'Fe', coefficient: 1, state: 's' },
      { formula: 'HCl', coefficient: 2, state: 'aq' },
    ],
    products: [
      { formula: 'FeCl2', coefficient: 1, state: 'aq' },
      { formula: 'H2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.39, text line 1083',
  },
  {
    id: '7.40',
    reactants: [
      { formula: 'H2O', coefficient: 2, state: 'l' },
      { formula: 'F2', coefficient: 2, state: 'g' },
    ],
    products: [
      { formula: 'HF', coefficient: 4, state: 'aq' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.40, text line 1103',
  },
  {
    id: '7.41',
    reactants: [
      { formula: 'Cl2', coefficient: 1, state: 'g' },
      { formula: 'KBr', coefficient: 2, state: 'aq' },
    ],
    products: [
      { formula: 'KCl', coefficient: 2, state: 'aq' },
      { formula: 'Br2', coefficient: 1, state: 'l' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.41, text line 1127',
  },
  {
    id: '7.41a',
    reactants: [
      { formula: 'Cl2', coefficient: 1, state: 'g' },
      { formula: 'Br', coefficient: 2, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'Cl', coefficient: 2, state: 'aq', charge: -1 },
      { formula: 'Br2', coefficient: 1, state: 'l' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.41a, text line 1157',
  },
  {
    id: '7.42',
    reactants: [
      { formula: 'Cl2', coefficient: 1, state: 'g' },
      { formula: 'KI', coefficient: 2, state: 'aq' },
    ],
    products: [
      { formula: 'KCl', coefficient: 2, state: 'aq' },
      { formula: 'I2', coefficient: 1, state: 's' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.42, text line 1130',
  },
  {
    id: '7.42b',
    reactants: [
      { formula: 'Cl2', coefficient: 1, state: 'g' },
      { formula: 'I', coefficient: 2, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'Cl', coefficient: 2, state: 'aq', charge: -1 },
      { formula: 'I2', coefficient: 1, state: 's' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.42b, text line 1170',
  },
  {
    id: '7.43',
    reactants: [
      { formula: 'Br2', coefficient: 1, state: 'l' },
      { formula: 'I', coefficient: 2, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'Br', coefficient: 2, state: 'aq', charge: -1 },
      { formula: 'I2', coefficient: 1, state: 's' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.43, text line 1191',
  },
  {
    id: '7.44',
    reactants: [{ formula: 'X', coefficient: 2, charge: -1 }],
    products: [{ formula: 'X2', coefficient: 1 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.44, text line 1201',
  },
  {
    id: '7.45',
    reactants: [{ formula: 'H2O2', coefficient: 2, state: 'aq' }],
    products: [
      { formula: 'H2O', coefficient: 2, state: 'l' },
      { formula: 'O2', coefficient: 1, state: 'g' },
    ],
    type: 'disproportionation',
    source: 'NCERT Eq. 7.45, text line 1243',
  },
  {
    id: '7.46',
    reactants: [
      { formula: 'P4', coefficient: 1, state: 's' },
      { formula: 'OH', coefficient: 3, state: 'aq', charge: -1 },
      { formula: 'H2O', coefficient: 3, state: 'l' },
    ],
    products: [
      { formula: 'PH3', coefficient: 1, state: 'g' },
      { formula: 'H2PO2', coefficient: 3, state: 'aq', charge: -1 },
    ],
    type: 'disproportionation',
    source: 'NCERT Eq. 7.46, text line 1259',
  },
  {
    id: '7.47',
    reactants: [
      { formula: 'S8', coefficient: 1, state: 's' },
      { formula: 'OH', coefficient: 12, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'S', coefficient: 4, state: 'aq', charge: -2 },
      { formula: 'S2O3', coefficient: 2, state: 'aq', charge: -2 },
      { formula: 'H2O', coefficient: 6, state: 'l' },
    ],
    type: 'disproportionation',
    source: 'NCERT Eq. 7.47, text line 1291',
  },
  {
    id: '7.48',
    reactants: [
      { formula: 'Cl2', coefficient: 1, state: 'g' },
      { formula: 'OH', coefficient: 2, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'ClO', coefficient: 1, state: 'aq', charge: -1 },
      { formula: 'Cl', coefficient: 1, state: 'aq', charge: -1 },
      { formula: 'H2O', coefficient: 1, state: 'l' },
    ],
    type: 'disproportionation',
    source: 'NCERT Eq. 7.48, text line 1317',
  },
  {
    id: '7.49',
    reactants: [
      { formula: 'F2', coefficient: 2, state: 'g' },
      { formula: 'OH', coefficient: 2, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'F', coefficient: 2, state: 'aq', charge: -1 },
      { formula: 'OF2', coefficient: 1, state: 'g' },
      { formula: 'H2O', coefficient: 1, state: 'l' },
    ],
    type: 'non-metal-displacement',
    source: 'NCERT Eq. 7.49, text line 1298',
    comment: 'Fluorine departure: does not disproportionate',
  },
  {
    id: '7.50',
    reactants: [
      { formula: 'Fe', coefficient: 1, state: 'aq', charge: 2 },
      { formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 },
    ],
    products: [
      { formula: 'Fe', coefficient: 1, state: 'aq', charge: 3 },
      { formula: 'Cr', coefficient: 1, state: 'aq', charge: 3 },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.50, text line 1684',
    comment: 'Unbalanced skeletal equation',
  },
  {
    id: '7.51',
    reactants: [{ formula: 'Fe', coefficient: 1, state: 'aq', charge: 2 }],
    products: [{ formula: 'Fe', coefficient: 1, state: 'aq', charge: 3 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.51, text line 1704',
  },
  {
    id: '7.52',
    reactants: [{ formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 }],
    products: [{ formula: 'Cr', coefficient: 1, state: 'aq', charge: 3 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.52, text line 1710',
  },
  {
    id: '7.53',
    reactants: [{ formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 }],
    products: [{ formula: 'Cr', coefficient: 2, state: 'aq', charge: 3 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.53, text line 1719',
  },
  {
    id: '7.54',
    reactants: [
      { formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 },
      { formula: 'H', coefficient: 14, state: 'aq', charge: 1 },
    ],
    products: [
      { formula: 'Cr', coefficient: 2, state: 'aq', charge: 3 },
      { formula: 'H2O', coefficient: 7, state: 'l' },
    ],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.54, text line 1726',
  },
  {
    id: '7.55',
    reactants: [{ formula: 'Fe', coefficient: 1, state: 'aq', charge: 2 }],
    products: [{ formula: 'Fe', coefficient: 1, state: 'aq', charge: 3 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.55, text line 1736',
  },
  {
    id: '7.56',
    reactants: [
      { formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 },
      { formula: 'H', coefficient: 14, state: 'aq', charge: 1 },
    ],
    products: [
      { formula: 'Cr', coefficient: 2, state: 'aq', charge: 3 },
      { formula: 'H2O', coefficient: 7, state: 'l' },
    ],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.56, text line 1744',
  },
  {
    id: '7.57',
    reactants: [{ formula: 'Fe', coefficient: 6, state: 'aq', charge: 2 }],
    products: [{ formula: 'Fe', coefficient: 6, state: 'aq', charge: 3 }],
    type: 'half-reaction',
    source: 'NCERT Eq. 7.57, text line 1750',
  },
  {
    id: '7.58',
    reactants: [
      { formula: 'Fe', coefficient: 6, state: 'aq', charge: 2 },
      { formula: 'Cr2O7', coefficient: 1, state: 'aq', charge: -2 },
      { formula: 'H', coefficient: 14, state: 'aq', charge: 1 },
    ],
    products: [
      { formula: 'Fe', coefficient: 6, state: 'aq', charge: 3 },
      { formula: 'Cr', coefficient: 2, state: 'aq', charge: 3 },
      { formula: 'H2O', coefficient: 7, state: 'l' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.58, text line 1757',
  },
  {
    id: '7.59',
    reactants: [
      { formula: 'Cu', coefficient: 2, state: 'aq', charge: 2 },
      { formula: 'I', coefficient: 4, state: 'aq', charge: -1 },
    ],
    products: [
      { formula: 'Cu2I2', coefficient: 1, state: 's' },
      { formula: 'I2', coefficient: 1, state: 'aq' },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.59, text line 1884',
  },
  {
    id: '7.60',
    reactants: [
      { formula: 'I2', coefficient: 1, state: 'aq' },
      { formula: 'S2O3', coefficient: 2, state: 'aq', charge: -2 },
    ],
    products: [
      { formula: 'I', coefficient: 2, state: 'aq', charge: -1 },
      { formula: 'S4O6', coefficient: 1, state: 'aq', charge: -2 },
    ],
    type: 'redox',
    source: 'NCERT Eq. 7.60, text line 1890',
  },
  {
    id: 'unnumbered-methane-combustion',
    reactants: [
      { formula: 'CH4', coefficient: 1, state: 'g' },
      { formula: 'O2', coefficient: 2, state: 'g' },
    ],
    products: [
      { formula: 'CO2', coefficient: 1, state: 'g' },
      { formula: 'H2O', coefficient: 2, state: 'l' },
    ],
    type: 'combination',
    source: 'NCERT Section 7.3.1(1), text line 845',
  },
  {
    id: 'unnumbered-caco3-decomposition',
    reactants: [{ formula: 'CaCO3', coefficient: 1, state: 's' }],
    products: [
      { formula: 'CaO', coefficient: 1, state: 's' },
      { formula: 'CO2', coefficient: 1, state: 'g' },
    ],
    type: 'not-redox',
    source: 'NCERT Section 7.3.1(2), text line 865',
    comment: 'Decomposition that is not a redox reaction',
  },
] as const

/** One Problem from NCERT Unit 7 (Problems 7.1 to 7.10). */
export interface NcertProblem {
  problemNumber: number
  lineInKech201: number
  summary: string
  reactions?: readonly string[]
  answerSummary: string
}

/**
 * NCERT Unit 7 Solved Problems 7.1 through 7.10.
 */
export const NCERT_UNIT7_PROBLEMS: readonly NcertProblem[] = [
  {
    problemNumber: 1,
    lineInKech201: 171,
    summary: 'Identify species undergoing oxidation and reduction in classical redox reactions',
    reactions: [
      'H2S(g) + Cl2(g) -> 2HCl(g) + S(s)',
      '3Fe3O4(s) + 8Al(s) -> 9Fe(s) + 4Al2O3(s)',
      '2Na(s) + H2(g) -> 2NaH(s)',
    ],
    answerSummary:
      '(i) H2S is oxidised to S; Cl2 is reduced to HCl. (ii) Al is oxidised to Al2O3; Fe3O4 is reduced to Fe. (iii) Na is oxidised to NaH; H2 is reduced.',
  },
  {
    problemNumber: 2,
    lineInKech201: 268,
    summary: 'Justify that 2Na(s) + H2(g) -> 2NaH(s) is a redox change using half-reactions',
    reactions: ['2Na(s) + H2(g) -> 2NaH(s)'],
    answerSummary:
      'Na+H- is ionic: 2Na(s) -> 2Na+ + 2e- (oxidation half) and H2(g) + 2e- -> 2H- (reduction half); thus sodium is oxidised and hydrogen is reduced.',
  },
  {
    problemNumber: 3,
    lineInKech201: 685,
    summary: 'Using Stock notation, represent HAuCl4, Tl2O, FeO, Fe2O3, CuI, CuO, MnO, MnO2',
    answerSummary:
      'HAu(III)Cl4, Tl2(I)O, Fe(II)O, Fe2(III)O3, Cu(I)I, Cu(II)O, Mn(II)O, Mn(IV)O2.',
  },
  {
    problemNumber: 4,
    lineInKech201: 745,
    summary: 'Justify that 2Cu2O(s) + Cu2S(s) -> 6Cu(s) + SO2(g) is redox; identify oxidant and reductant',
    reactions: ['2Cu2O(s) + Cu2S(s) -> 6Cu(s) + SO2(g)'],
    answerSummary:
      'Cu(+1) is reduced to 0; S(-2) is oxidised to +4. Cu2O acts as oxidant; Cu2S acts as reductant (via sulphur).',
  },
  {
    problemNumber: 5,
    lineInKech201: 1268,
    summary: 'Which species does not show disproportionation: ClO-, ClO2-, ClO3-, ClO4-, and why?',
    answerSummary:
      'ClO4- does not disproportionate because chlorine is in its maximum oxidation state (+7). Others disproportionate forming Cl- and higher oxoanions.',
  },
  {
    problemNumber: 6,
    lineInKech201: 1352,
    summary: 'Classification scheme for redox reactions: N2+O2->2NO, 2Pb(NO3)2->..., NaH+H2O->..., 2NO2+2OH-->...',
    reactions: [
      'N2(g) + O2(g) -> 2NO(g)',
      '2Pb(NO3)2(s) -> 2PbO(s) + 4NO2(g) + O2(g)',
      'NaH(s) + H2O(l) -> NaOH(aq) + H2(g)',
      '2NO2(g) + 2OH-(aq) -> NO2-(aq) + NO3-(aq) + H2O(l)',
    ],
    answerSummary:
      '(a) Combination; (b) Decomposition; (c) Non-metal displacement; (d) Disproportionation.',
  },
  {
    problemNumber: 7,
    lineInKech201: 1449,
    summary: 'Why Pb3O4 + 8HCl -> 3PbCl2 + Cl2 + 4H2O, but Pb3O4 + 4HNO3 -> 2Pb(NO3)2 + PbO2 + 2H2O',
    answerSummary:
      'Pb3O4 is 2PbO·PbO2. PbO2 is an oxidising agent that oxidises Cl- in HCl to Cl2, but cannot oxidise HNO3 (already an oxidant in +5). PbO reacts with both as a basic oxide.',
  },
  {
    problemNumber: 8,
    lineInKech201: 1542,
    summary: 'Balance Cr2O7^2- + SO3^2- -> Cr^3+ + SO4^2- in acid solution by oxidation number method',
    reactions: ['Cr2O72-(aq) + 3SO32-(aq) + 8H+(aq) -> 2Cr3+(aq) + 3SO42-(aq) + 4H2O(l)'],
    answerSummary:
      'Balanced net ionic equation: Cr2O72- + 3SO32- + 8H+ -> 2Cr3+ + 3SO42- + 4H2O.',
  },
  {
    problemNumber: 9,
    lineInKech201: 1621,
    summary: 'Balance MnO4- + Br- -> MnO2 + BrO3- in basic medium by oxidation number method',
    reactions: ['2MnO4-(aq) + Br-(aq) + H2O(l) -> 2MnO2(s) + BrO3-(aq) + 2OH-(aq)'],
    answerSummary:
      'Balanced equation: 2MnO4- + Br- + H2O -> 2MnO2 + BrO3- + 2OH-.',
  },
  {
    problemNumber: 10,
    lineInKech201: 1771,
    summary: 'Balance MnO4- + I- -> MnO2 + I2 in basic medium by half-reaction method',
    reactions: ['2MnO4-(aq) + 6I-(aq) + 4H2O(l) -> 2MnO2(s) + 3I2(s) + 8OH-(aq)'],
    answerSummary:
      'Balanced equation: 2MnO4- + 6I- + 4H2O -> 2MnO2 + 3I2 + 8OH-.',
  },
] as const

/** One erratum in NCERT Unit 7 text or equations. */
export interface NcertErratum {
  where: string
  printed: string
  correct: string
  note: string
}

/**
 * Errata in NCERT Class 11 Unit 7 (Redox Reactions).
 */
export const NCERT_UNIT7_ERRATA: readonly NcertErratum[] = [
  {
    where: 'Eq. 7.35 and 7.36, text lines 1030–1045',
    printed: 'Mg(s) + 2H2O(l) and 2Fe(s) + 3H2O(l)',
    correct: 'Mg(s) + 2H2O(g) and 3Fe(s) + 4H2O(g) -> Fe3O4(s) + 4H2(g)',
    note: 'The text introduces these as reactions "with steam", so water should be in the gaseous state H2O(g), not liquid H2O(l).',
  },
  {
    where: 'Eq. 7.36, text line 1040',
    printed: '2Fe(s) + 3H2O(l) -> Fe2O3(s) + 3H2(g)',
    correct: '3Fe(s) + 4H2O(g) -> Fe3O4(s) + 4H2(g)',
    note: 'Iron reacts with steam at red heat to form magnetic iron oxide (ferrosoferric oxide, Fe3O4), not ferric oxide (Fe2O3).',
  },
  {
    where: 'Eq. 7.19 and Eq. 7.22, text lines 421 and 458',
    printed: 'H2(s) + Cl2(g) -> 2HCl(g)',
    correct: 'H2(g) + Cl2(g) -> 2HCl(g)',
    note: 'Hydrogen is printed with physical state (s) (solid); hydrogen at standard conditions is a gas (g).',
  },
  {
    where: 'Section 7.4, standard state definition, text line 2030',
    printed: 'Gases at 1 atmosphere pressure',
    correct: 'Gases at 1 bar (100 kPa) standard pressure (IUPAC 1982 recommendation)',
    note: 'The modern IUPAC standard pressure is 1 bar. Standard electrode potentials differ by less than 1 mV between 1 atm and 1 bar.',
  },
  {
    where: 'Period 3 highest-oxidation-number table, text line 636',
    printed: 'Compound for Group 17 element Cl with highest oxidation state +7: "HClO"',
    correct: 'HClO4 (perchloric acid)',
    note: 'In hypochlorous acid (HClO), chlorine has oxidation state +1. The oxoacid exhibiting the group highest oxidation state (+7) is perchloric acid (HClO4).',
  },
  {
    where: 'Exercise 7.19(c), text line 2507',
    printed: 'Cl2O7 (g) + H2O2(aq) -> ClO2-(aq) + O2(g) + H+ (in basic medium)',
    correct: 'Cl2O7(g) + 4H2O2(aq) + 2OH-(aq) -> 2ClO2-(aq) + 4O2(g) + 5H2O(l)',
    note: 'In basic medium, free H+ cannot be a product; the equation must be balanced with OH- and H2O.',
  },
  {
    where: 'Exercise 7.19(a), text line 2505',
    printed: 'P4(s) + OH-(aq) -> PH3(g) + HPO2-(aq)',
    correct: 'P4(s) + 3OH-(aq) + 3H2O(l) -> PH3(g) + 3H2PO2-(aq)',
    note: 'Hypophosphite ion is H2PO2-, as correctly printed earlier in equation 7.46. HPO2- is missing a hydrogen atom.',
  },
  {
    where: 'Exercise 7.26, text line 2550',
    printed: 'Using the standard electrode potentials given in the Table 8.1',
    correct: 'Table 7.1',
    note: 'In pre-rationalised NCERT syllabi, Redox Reactions was Unit 8. In the current edition it is Unit 7, but the exercise cross-reference was left as Table 8.1.',
  },
] as const
