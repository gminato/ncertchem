/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 3 (Chemical Kinetics), book pp. 62-84.
 * Values are as NCERT prints them unless an NCERT_UNIT3_ERRATA entry says otherwise. Page numbers
 * are book page numbers.
 *
 * Only tabulated data and the rate laws NCERT lists in its running text are kept here. Worked
 * examples, Intext questions and exercises are deliberately not transcribed (see ADR-0001).
 *
 * - Table 3.1 butyl chloride concentrations (Example 3.1 data, 9 points)
 * - Table 3.2 initial rates of NO + O₂ (4 experiments) and the orders deduced from them
 * - Table 3.3 units of the rate constant for zero, first and second order
 * - Table 3.4 integrated rate laws for zero and first order
 * - Named examples in the running text (rate laws, molecularity, mechanism, zero and first order
 *   examples, catalyst facts, collision theory)
 */

/** Superscript minus (U+207B) for negative exponents in unit strings, the site convention. */
const MINUS = '⁻'

/** One row of the butyl chloride data in Table 3.1 (p. 63). */
export interface ButylChloridePoint {
  /** Time, s. */
  readonly tS: number
  /** [C₄H₉Cl], mol L⁻¹. */
  readonly concMolPerL: number
}

/**
 * Concentrations of butyl chloride (C₄H₉Cl) hydrolysed in water, at the times NCERT tabulates
 * (book p. 63, the data columns of its first worked table).
 */
export const NCERT_BUTYL_CHLORIDE: readonly ButylChloridePoint[] = [
  { tS: 0, concMolPerL: 0.1 },
  { tS: 50, concMolPerL: 0.0905 },
  { tS: 100, concMolPerL: 0.082 },
  { tS: 150, concMolPerL: 0.0741 },
  { tS: 200, concMolPerL: 0.0671 },
  { tS: 300, concMolPerL: 0.0549 },
  { tS: 400, concMolPerL: 0.0439 },
  { tS: 700, concMolPerL: 0.021 },
  { tS: 800, concMolPerL: 0.017 },
]

/** Reaction of Table 3.1: C₄H₉Cl + H₂O → C₄H₉OH + HCl (mhchem body, no wrapper). */
export const NCERT_BUTYL_CHLORIDE_CE = 'C4H9Cl + H2O -> C4H9OH + HCl'

export interface NoO2InitialRateRow {
  readonly experiment: number
  /** Initial [NO], mol L⁻¹. */
  readonly noMolPerL: number
  /** Initial [O₂], mol L⁻¹. */
  readonly o2MolPerL: number
  /** Initial rate of formation of NO₂, mol L⁻¹ s⁻¹. */
  readonly initialRate: number
}

/** Table 3.2: initial rate of formation of NO₂ for 2NO(g) + O₂(g) → 2NO₂(g), page 67. */
export const NCERT_NO_O2_INITIAL_RATES: readonly NoO2InitialRateRow[] = [
  { experiment: 1, noMolPerL: 0.3, o2MolPerL: 0.3, initialRate: 0.096 },
  { experiment: 2, noMolPerL: 0.6, o2MolPerL: 0.3, initialRate: 0.384 },
  { experiment: 3, noMolPerL: 0.3, o2MolPerL: 0.6, initialRate: 0.192 },
  { experiment: 4, noMolPerL: 0.6, o2MolPerL: 0.6, initialRate: 0.768 },
]

/** Balanced equation of Table 3.2 (mhchem body). */
export const NCERT_NO_O2_CE = '2NO + O2 -> 2NO2'

/** Rate law NCERT deduces from Table 3.2 (pp. 67): Rate = k[NO]²[O₂]. */
export const NCERT_NO_O2_ORDERS = { NO: 2, O2: 1 } as const

export interface ExperimentalRateLawExample {
  readonly id: string
  /** Reaction, plain Unicode. */
  readonly reaction: string
  /** Same reaction as an mhchem body. */
  readonly ce: string
  /** Experimentally found exponents of each reactant (not the stoichiometric coefficients). */
  readonly exponents: Readonly<Record<string, number>>
  /** Rate law as NCERT writes it, plain Unicode. */
  readonly rateLaw: string
}

/**
 * Experimental rate expressions NCERT lists in the running text of Section 3.2.2 (pp. 67),
 * not worked examples. Exponents differ from the stoichiometric coefficients.
 */
export const NCERT_RATE_LAW_EXAMPLES: readonly ExperimentalRateLawExample[] = [
  {
    id: 'chcl3-cl2',
    reaction: 'CHCl₃ + Cl₂ → CCl₄ + HCl',
    ce: 'CHCl3 + Cl2 -> CCl4 + HCl',
    exponents: { CHCl3: 1, Cl2: 0.5 },
    rateLaw: 'Rate = k[CHCl₃][Cl₂]^(1/2)',
  },
  {
    id: 'ester-hydrolysis',
    reaction: 'CH₃COOC₂H₅ + H₂O → CH₃COOH + C₂H₅OH',
    ce: 'CH3COOC2H5 + H2O -> CH3COOH + C2H5OH',
    exponents: { CH3COOC2H5: 1, H2O: 0 },
    rateLaw: 'Rate = k[CH₃COOC₂H₅][H₂O]⁰',
  },
]

export interface RateConstantUnitRow {
  readonly order: number
  readonly label: string
  /** Units as a Unicode string, e.g. "mol L⁻¹ s⁻¹". */
  readonly units: string
}

/** Table 3.3: units of the rate constant for SI units of mol L⁻¹ and s (p. 69). */
export const NCERT_RATE_CONSTANT_UNITS: readonly RateConstantUnitRow[] = [
  { order: 0, label: 'Zero order reaction', units: 'mol L' + MINUS + '¹ s' + MINUS + '¹' },
  { order: 1, label: 'First order reaction', units: 's' + MINUS + '¹' },
  { order: 2, label: 'Second order reaction', units: 'mol' + MINUS + '¹ L s' + MINUS + '¹' },
]

export interface MolecularityExample {
  readonly id: string
  /** NCERT's name for the class of reaction. */
  readonly ncertName: 'unimolecular' | 'bimolecular' | 'trimolecular'
  readonly reaction: string
  readonly ce: string
  /** Number of reacting species that must collide, as NCERT counts them. */
  readonly molecularity: number
}

/** Molecularity examples named in Section 3.2.4 (pp. 69). */
export const NCERT_MOLECULARITY_EXAMPLES: readonly MolecularityExample[] = [
  {
    id: 'unimolecular-ammonium-nitrite',
    ncertName: 'unimolecular',
    reaction: 'NH₄NO₂ → N₂ + 2H₂O',
    ce: 'NH4NO2 -> N2 + 2H2O',
    molecularity: 1,
  },
  {
    id: 'bimolecular-hi',
    ncertName: 'bimolecular',
    reaction: '2HI → H₂ + I₂',
    ce: '2HI -> H2 + I2',
    molecularity: 2,
  },
  {
    id: 'trimolecular-no-o2',
    ncertName: 'trimolecular',
    reaction: '2NO + O₂ → 2NO₂',
    ce: '2NO + O2 -> 2NO2',
    molecularity: 3,
  },
]

export interface ComplexReactionExample {
  readonly reaction: string
  readonly ce: string
  /** Sum of the stoichiometric coefficients of the reactants, the "apparent" order. */
  readonly apparentOrder: number
  /** The order NCERT says the reaction actually follows. */
  readonly actualOrder: number
}

/** Apparent versus actual order of a complex reaction (p. 70). */
export const NCERT_COMPLEX_EXAMPLE: ComplexReactionExample = {
  reaction: 'KClO₃ + 6FeSO₄ + 3H₂SO₄ → KCl + 3Fe₂(SO₄)₃ + 3H₂O',
  ce: 'KClO3 + 6FeSO4 + 3H2SO4 -> KCl + 3Fe2(SO4)3 + 3H2O',
  apparentOrder: 10,
  actualOrder: 2,
}

export interface MechanismStep {
  readonly ce: string
  readonly reaction: string
  readonly molecularity: number
  readonly slow: boolean
}

export interface TwoStepMechanism {
  readonly overall: string
  readonly overallCe: string
  readonly steps: readonly MechanismStep[]
  /** Species that appears in a step but not in the overall equation. */
  readonly intermediate: string
  /** Rate law NCERT gives for the overall reaction, with the exponents the lib uses. */
  readonly rateLawOrders: Readonly<Record<string, number>>
  readonly rateLaw: string
}

/** H₂O₂ decomposition catalysed by I⁻ in alkaline medium, p. 70. */
export const NCERT_H2O2_IODIDE_MECHANISM: TwoStepMechanism = {
  overall: '2H₂O₂ → 2H₂O + O₂ (I⁻ catalyst, alkaline medium)',
  overallCe: '2H2O2 ->[I-] 2H2O + O2',
  steps: [
    { ce: 'H2O2 + I- -> H2O + IO-', reaction: 'H₂O₂ + I⁻ → H₂O + IO⁻', molecularity: 2, slow: true },
    {
      ce: 'H2O2 + IO- -> H2O + I- + O2',
      reaction: 'H₂O₂ + IO⁻ → H₂O + I⁻ + O₂',
      molecularity: 2,
      slow: false,
    },
  ],
  intermediate: 'IO⁻',
  rateLawOrders: { 'H2O2': 1, 'I-': 1 },
  rateLaw: 'Rate = k[H₂O₂][I⁻]',
}

export interface NamedReactionExample {
  readonly id: string
  readonly reaction: string
  readonly ce: string
  /** Conditions NCERT attaches to the example, as Unicode text. */
  readonly conditions?: string
}

/** Zero order examples NCERT names in Section 3.3.1 (p. 71). */
export const NCERT_ZERO_ORDER_EXAMPLES: readonly NamedReactionExample[] = [
  {
    id: 'nh3-on-platinum',
    reaction: '2NH₃ → N₂ + 3H₂ (hot platinum surface, high pressure)',
    ce: '2NH3 ->[Pt, 1130 K] N2 + 3H2',
    conditions: 'Pt catalyst, 1130 K, high pressure (surface saturated)',
  },
  {
    id: 'hi-on-gold',
    reaction: 'Thermal decomposition of HI on a gold surface',
    ce: '2HI ->[Au] H2 + I2',
  },
]

/** First order examples NCERT names in Section 3.3.2 (pp. 72-75). */
export const NCERT_FIRST_ORDER_EXAMPLES: readonly NamedReactionExample[] = [
  {
    id: 'ethene-hydrogenation',
    reaction: 'Hydrogenation of ethene: C₂H₄ + H₂ → C₂H₆',
    ce: 'C2H4 + H2 -> C2H6',
  },
  {
    id: 'radioactive-decay',
    reaction: 'Natural and artificial radioactive decay (for example radium-226 to radon-222)',
    ce: '^{226}_{88}Ra -> ^{222}_{86}Rn + ^{4}_{2}He',
  },
  {
    id: 'n2o5-decomposition',
    reaction: 'Decomposition of N₂O₅ (dinitrogen pentoxide)',
    ce: 'N2O5 -> 2NO2 + 1/2 O2',
  },
  {
    id: 'pseudo-first-order-ester',
    reaction: 'Hydrolysis of ethyl acetate with excess water (pseudo first order)',
    ce: 'CH3COOC2H5 + H2O -> CH3COOH + C2H5OH',
  },
  {
    id: 'pseudo-first-order-sucrose',
    reaction: 'Inversion of cane sugar (pseudo first order)',
    ce: 'C12H22O11 + H2O ->[H+] C6H12O6 + C6H12O6',
  },
]

export interface IntegratedLawRow {
  readonly order: 0 | 1
  /** Differential rate law, Unicode. */
  readonly differential: string
  /** Integrated rate law, Unicode. */
  readonly integrated: string
  /** Straight-line plot that tests the order. */
  readonly straightLinePlot: string
  /** Half-life, Unicode. */
  readonly halfLife: string
  /** Units of k, Unicode. */
  readonly unitsOfK: string
}

/** Table 3.4: integrated rate laws for zero and first order reactions (p. 77). */
export const NCERT_INTEGRATED_LAWS: readonly IntegratedLawRow[] = [
  {
    order: 0,
    differential: 'd[R]/dt = −k',
    integrated: 'kt = [R]₀ − [R]',
    straightLinePlot: '[R] vs t',
    halfLife: '[R]₀/2k',
    unitsOfK: 'conc time⁻¹ or mol L⁻¹ s⁻¹',
  },
  {
    order: 1,
    differential: 'd[R]/dt = −k[R]',
    integrated: '[R] = [R]₀e^(−kt), or kt = ln([R]₀/[R])',
    straightLinePlot: 'ln[R] vs t',
    halfLife: 'ln 2/k',
    unitsOfK: 'time⁻¹ or s⁻¹',
  },
]

export interface NamedCatalystFact {
  readonly id: string
  readonly text: string
}

/** Catalyst facts from Section 3.4.1 (pp. 81-82), as short statements. */
export const NCERT_CATALYST_FACTS: readonly NamedCatalystFact[] = [
  {
    id: 'mno2-kclo3',
    text: 'MnO₂ catalyses the decomposition of potassium chlorate: 2KClO₃ → 2KCl + 3O₂ (catalyst written above the arrow).',
  },
  {
    id: 'inhibitor',
    text: 'A substance that reduces the rate is an inhibitor, not a catalyst.',
  },
  {
    id: 'alternate-pathway',
    text: 'A catalyst provides an alternate pathway with a lower activation energy, lowering the barrier.',
  },
  {
    id: 'small-amount',
    text: 'A small amount of catalyst can catalyse a large amount of reactant.',
  },
  {
    id: 'delta-g-unchanged',
    text: 'A catalyst does not alter Gibbs energy, ΔG, of a reaction; it catalyses only spontaneous reactions.',
  },
  {
    id: 'equilibrium-faster',
    text: 'A catalyst does not change the equilibrium constant; it speeds up the forward and backward reactions to the same extent so equilibrium is reached sooner.',
  },
]

/** Collision theory facts from Section 3.5 (pp. 82-83). */
export const NCERT_COLLISION_THEORY = {
  developedBy: 'Max Trautz and William Lewis',
  years: '1916-18',
  /** Example reaction NCERT uses for orientation: CH₃Br + OH⁻ → CH₃OH + Br⁻. */
  orientationExample: {
    reaction: 'CH₃Br + OH⁻ → CH₃OH + Br⁻',
    ce: 'CH3Br + OH- -> CH3OH + Br-',
  },
  rateEquationNoSteric: 'Rate = Z_AB e^(−Eₐ/RT)',
  rateEquationWithSteric: 'Rate = P Z_AB e^(−Eₐ/RT)',
} as const

export interface UnitErrata {
  readonly id: string
  /** Where in the book, e.g. "Section 3.5, p. 83". */
  readonly where: string
  /** What NCERT says, in words (no numbers that the Sections quote). */
  readonly ncertSays: string
  /** What is correct. */
  readonly correct: string
}

/**
 * Slips found while transcribing Unit 3. Only confirmed errors are listed. Do not add entries
 * without checking them against the book page and the arithmetic.
 */
export const NCERT_UNIT3_ERRATA: readonly UnitErrata[] = [
  {
    id: 'bromoethane-for-bromomethane',
    where: 'Section 3.5, p. 83 (Fig. 3.12 text)',
    ncertSays: 'Formation of methanol from bromoethane.',
    correct: 'The reaction is CH₃Br + OH⁻ → CH₃OH + Br⁻: the reactant is bromomethane (CH₃Br), not bromoethane.',
  },
  {
    id: 'n2o5-log-term',
    where: 'Section 3.3.2, p. 75 (worked answer for the N₂O₅ total-pressure example)',
    ncertSays: 'The printed log term and the final k for the total-pressure N₂O₅ example are slightly inconsistent with the pressures given.',
    correct: 'Recompute with firstOrderKFromPressure: the log term is about 0.0214, and k is about 4.92 × 10⁻⁴ s⁻¹ (not the printed value).',
  },
]
