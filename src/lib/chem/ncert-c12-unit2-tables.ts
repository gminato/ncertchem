/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 2 (Electrochemistry), book pp. 36-58.
 * Every number here is transcribed from the NCERT page images; values are as printed unless a
 * field or NCERT_UNIT2_ERRATA entry says otherwise. Page references are book page numbers.
 *
 * - Table 2.1 standard electrode potentials at 298 K (34 rows)
 * - Table 2.2 conductivity of selected materials (17 rows)
 * - Table 2.3 KCl conductivity and molar conductivity (3 rows)
 * - Table 2.4 limiting molar conductivities of ions at 298 K (10 rows)
 * - Example 2.6 KCl molar conductivity versus concentration (4 rows)
 * - Batteries, fuel cell and corrosion descriptions (Sec. 2.6 to 2.8)
 */

/** Faraday constant as NCERT gives it in its text (Examples 2.3 and 2.10). */
export const FARADAY = 96487
/** Rounded Faraday constant, used in some NCERT worked answers. */
export const FARADAY_ROUNDED = 96500
/** Gas constant, J K⁻¹ mol⁻¹. */
export const GAS_CONSTANT_J = 8.314
/** NCERT's 298 K Nernst slope, 0.059 V (2.303RT/F at 298 K rounded to 0.059). */
export const NERNST_SLOPE_298 = 0.059
/** Temperature NCERT uses for all tabulated data, K. */
export const T_REFERENCE_K = 298

export interface StandardPotentialRow {
  readonly id: string
  /** Reaction, oxidised form + n e⁻ → reduced form, plain text. */
  readonly reaction: string
  /** Same reaction as an mhchem `\ce{}` body (without the wrapper). */
  readonly ce: string
  readonly electrons: number
  /** E° / V at 298 K. */
  readonly e0: number
  /** True when the reduced form is an elemental metal, Mⁿ⁺ + ne⁻ → M(s). */
  readonly reducedFormIsMetal: boolean
}

/** Table 2.1, in NCERT's order (strongest oxidising agent first). */
export const NCERT_STANDARD_POTENTIALS: readonly StandardPotentialRow[] = [
  { id: 'F2/F-', reaction: 'F₂(g) + 2e⁻ → 2F⁻', ce: 'F2(g) + 2e- -> 2F-', electrons: 2, e0: 2.87, reducedFormIsMetal: false },
  { id: 'Co3+/Co2+', reaction: 'Co³⁺ + e⁻ → Co²⁺', ce: 'Co^{3+} + e- -> Co^{2+}', electrons: 1, e0: 1.81, reducedFormIsMetal: false },
  { id: 'H2O2/H2O', reaction: 'H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O', ce: 'H2O2 + 2H+ + 2e- -> 2H2O', electrons: 2, e0: 1.78, reducedFormIsMetal: false },
  { id: 'MnO4-/Mn2+', reaction: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', ce: 'MnO4^- + 8H+ + 5e- -> Mn^{2+} + 4H2O', electrons: 5, e0: 1.51, reducedFormIsMetal: false },
  { id: 'Au3+/Au', reaction: 'Au³⁺ + 3e⁻ → Au(s)', ce: 'Au^{3+} + 3e- -> Au(s)', electrons: 3, e0: 1.4, reducedFormIsMetal: true },
  { id: 'Cl2/Cl-', reaction: 'Cl₂(g) + 2e⁻ → 2Cl⁻', ce: 'Cl2(g) + 2e- -> 2Cl-', electrons: 2, e0: 1.36, reducedFormIsMetal: false },
  { id: 'Cr2O7 2-/Cr3+', reaction: 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O', ce: 'Cr2O7^{2-} + 14H+ + 6e- -> 2Cr^{3+} + 7H2O', electrons: 6, e0: 1.33, reducedFormIsMetal: false },
  { id: 'O2/H2O', reaction: 'O₂(g) + 4H⁺ + 4e⁻ → 2H₂O', ce: 'O2(g) + 4H+ + 4e- -> 2H2O', electrons: 4, e0: 1.23, reducedFormIsMetal: false },
  { id: 'MnO2/Mn2+', reaction: 'MnO₂(s) + 4H⁺ + 2e⁻ → Mn²⁺ + 2H₂O', ce: 'MnO2(s) + 4H+ + 2e- -> Mn^{2+} + 2H2O', electrons: 2, e0: 1.23, reducedFormIsMetal: false },
  { id: 'Br2/Br-', reaction: 'Br₂ + 2e⁻ → 2Br⁻', ce: 'Br2 + 2e- -> 2Br-', electrons: 2, e0: 1.09, reducedFormIsMetal: false },
  { id: 'NO3-/NO', reaction: 'NO₃⁻ + 4H⁺ + 3e⁻ → NO(g) + 2H₂O', ce: 'NO3- + 4H+ + 3e- -> NO(g) + 2H2O', electrons: 3, e0: 0.97, reducedFormIsMetal: false },
  { id: 'Hg2+/Hg2 2+', reaction: '2Hg²⁺ + 2e⁻ → Hg₂²⁺', ce: '2Hg^{2+} + 2e- -> Hg2^{2+}', electrons: 2, e0: 0.92, reducedFormIsMetal: false },
  { id: 'Ag+/Ag', reaction: 'Ag⁺ + e⁻ → Ag(s)', ce: 'Ag^+ + e- -> Ag(s)', electrons: 1, e0: 0.8, reducedFormIsMetal: true },
  { id: 'Fe3+/Fe2+', reaction: 'Fe³⁺ + e⁻ → Fe²⁺', ce: 'Fe^{3+} + e- -> Fe^{2+}', electrons: 1, e0: 0.77, reducedFormIsMetal: false },
  { id: 'O2/H2O2', reaction: 'O₂(g) + 2H⁺ + 2e⁻ → H₂O₂', ce: 'O2(g) + 2H+ + 2e- -> H2O2', electrons: 2, e0: 0.68, reducedFormIsMetal: false },
  { id: 'I2/I-', reaction: 'I₂ + 2e⁻ → 2I⁻', ce: 'I2 + 2e- -> 2I-', electrons: 2, e0: 0.54, reducedFormIsMetal: false },
  { id: 'Cu+/Cu', reaction: 'Cu⁺ + e⁻ → Cu(s)', ce: 'Cu^+ + e- -> Cu(s)', electrons: 1, e0: 0.52, reducedFormIsMetal: true },
  { id: 'Cu2+/Cu', reaction: 'Cu²⁺ + 2e⁻ → Cu(s)', ce: 'Cu^{2+} + 2e- -> Cu(s)', electrons: 2, e0: 0.34, reducedFormIsMetal: true },
  { id: 'AgCl/Ag', reaction: 'AgCl(s) + e⁻ → Ag(s) + Cl⁻', ce: 'AgCl(s) + e- -> Ag(s) + Cl-', electrons: 1, e0: 0.22, reducedFormIsMetal: false },
  { id: 'AgBr/Ag', reaction: 'AgBr(s) + e⁻ → Ag(s) + Br⁻', ce: 'AgBr(s) + e- -> Ag(s) + Br-', electrons: 1, e0: 0.1, reducedFormIsMetal: false },
  { id: 'H+/H2', reaction: '2H⁺ + 2e⁻ → H₂(g)', ce: '2H+ + 2e- -> H2(g)', electrons: 2, e0: 0.0, reducedFormIsMetal: false },
  { id: 'Pb2+/Pb', reaction: 'Pb²⁺ + 2e⁻ → Pb(s)', ce: 'Pb^{2+} + 2e- -> Pb(s)', electrons: 2, e0: -0.13, reducedFormIsMetal: true },
  { id: 'Sn2+/Sn', reaction: 'Sn²⁺ + 2e⁻ → Sn(s)', ce: 'Sn^{2+} + 2e- -> Sn(s)', electrons: 2, e0: -0.14, reducedFormIsMetal: true },
  { id: 'Ni2+/Ni', reaction: 'Ni²⁺ + 2e⁻ → Ni(s)', ce: 'Ni^{2+} + 2e- -> Ni(s)', electrons: 2, e0: -0.25, reducedFormIsMetal: true },
  { id: 'Fe2+/Fe', reaction: 'Fe²⁺ + 2e⁻ → Fe(s)', ce: 'Fe^{2+} + 2e- -> Fe(s)', electrons: 2, e0: -0.44, reducedFormIsMetal: true },
  { id: 'Cr3+/Cr', reaction: 'Cr³⁺ + 3e⁻ → Cr(s)', ce: 'Cr^{3+} + 3e- -> Cr(s)', electrons: 3, e0: -0.74, reducedFormIsMetal: true },
  { id: 'Zn2+/Zn', reaction: 'Zn²⁺ + 2e⁻ → Zn(s)', ce: 'Zn^{2+} + 2e- -> Zn(s)', electrons: 2, e0: -0.76, reducedFormIsMetal: true },
  { id: 'H2O/H2', reaction: '2H₂O + 2e⁻ → H₂(g) + 2OH⁻', ce: '2H2O + 2e- -> H2(g) + 2OH-', electrons: 2, e0: -0.83, reducedFormIsMetal: false },
  { id: 'Al3+/Al', reaction: 'Al³⁺ + 3e⁻ → Al(s)', ce: 'Al^{3+} + 3e- -> Al(s)', electrons: 3, e0: -1.66, reducedFormIsMetal: true },
  { id: 'Mg2+/Mg', reaction: 'Mg²⁺ + 2e⁻ → Mg(s)', ce: 'Mg^{2+} + 2e- -> Mg(s)', electrons: 2, e0: -2.36, reducedFormIsMetal: true },
  { id: 'Na+/Na', reaction: 'Na⁺ + e⁻ → Na(s)', ce: 'Na^+ + e- -> Na(s)', electrons: 1, e0: -2.71, reducedFormIsMetal: true },
  { id: 'Ca2+/Ca', reaction: 'Ca²⁺ + 2e⁻ → Ca(s)', ce: 'Ca^{2+} + 2e- -> Ca(s)', electrons: 2, e0: -2.87, reducedFormIsMetal: true },
  { id: 'K+/K', reaction: 'K⁺ + e⁻ → K(s)', ce: 'K^+ + e- -> K(s)', electrons: 1, e0: -2.93, reducedFormIsMetal: true },
  { id: 'Li+/Li', reaction: 'Li⁺ + e⁻ → Li(s)', ce: 'Li^+ + e- -> Li(s)', electrons: 1, e0: -3.05, reducedFormIsMetal: true },
]

export interface ConductivityMaterialRow {
  readonly material: string
  readonly group: 'conductor' | 'insulator' | 'aqueous' | 'semiconductor'
  /** Conductivity as printed, S m⁻¹. See NCERT_UNIT2_ERRATA for the two printing problems. */
  readonly sPerM: number
  /** The value exactly as NCERT prints it. */
  readonly printed: string
  /**
   * The value to SHOW students, S m⁻¹. Equal to `sPerM` except for the metals, whose printed
   * 10³ exponent is a misprint for 10⁷ (copper is 5.9 × 10⁷ S m⁻¹), and graphite, whose exponent
   * is missing: `null` means "don't show a number for this row".
   */
  readonly displaySPerM: number | null
}

/** Table 2.2 (book p. 44), 298.15 K. */
export const NCERT_CONDUCTIVITY_MATERIALS: readonly ConductivityMaterialRow[] = [
  { material: 'Sodium', group: 'conductor', sPerM: 2.1e3, printed: '2.1×10³', displaySPerM: 2.1e7 },
  { material: 'Copper', group: 'conductor', sPerM: 5.9e3, printed: '5.9×10³', displaySPerM: 5.9e7 },
  { material: 'Silver', group: 'conductor', sPerM: 6.2e3, printed: '6.2×10³', displaySPerM: 6.2e7 },
  { material: 'Gold', group: 'conductor', sPerM: 4.5e3, printed: '4.5×10³', displaySPerM: 4.5e7 },
  { material: 'Iron', group: 'conductor', sPerM: 1.0e3, printed: '1.0×10³', displaySPerM: 1.0e7 },
  { material: 'Graphite', group: 'conductor', sPerM: 12, printed: '1.2×10', displaySPerM: null },
  { material: 'Glass', group: 'insulator', sPerM: 1.0e-16, printed: '1.0×10⁻¹⁶', displaySPerM: 1.0e-16 },
  { material: 'Teflon', group: 'insulator', sPerM: 1.0e-18, printed: '1.0×10⁻¹⁸', displaySPerM: 1.0e-18 },
  { material: 'Pure water', group: 'aqueous', sPerM: 3.5e-5, printed: '3.5×10⁻⁵', displaySPerM: 3.5e-5 },
  { material: '0.1 M HCl', group: 'aqueous', sPerM: 3.91, printed: '3.91', displaySPerM: 3.91 },
  { material: '0.01 M KCl', group: 'aqueous', sPerM: 0.14, printed: '0.14', displaySPerM: 0.14 },
  { material: '0.01 M NaCl', group: 'aqueous', sPerM: 0.12, printed: '0.12', displaySPerM: 0.12 },
  { material: '0.1 M HAc', group: 'aqueous', sPerM: 0.047, printed: '0.047', displaySPerM: 0.047 },
  { material: '0.01 M HAc', group: 'aqueous', sPerM: 0.016, printed: '0.016', displaySPerM: 0.016 },
  { material: 'CuO', group: 'semiconductor', sPerM: 1e-7, printed: '1×10⁻⁷', displaySPerM: 1e-7 },
  { material: 'Si', group: 'semiconductor', sPerM: 1.5e-2, printed: '1.5×10⁻²', displaySPerM: 1.5e-2 },
  { material: 'Ge', group: 'semiconductor', sPerM: 2.0, printed: '2.0', displaySPerM: 2.0 },
]

export interface KClConductivityRow {
  /** Concentration, mol L⁻¹. */
  readonly molPerL: number
  /** Concentration, mol m⁻³. */
  readonly molPerM3: number
  /** Conductivity κ, S cm⁻¹. */
  readonly kappaScmInv: number
  /** Conductivity κ, S m⁻¹. */
  readonly kappaSmInv: number
  /** Molar conductivity Λm, S cm² mol⁻¹. */
  readonly lambdaScm2: number
  /** Molar conductivity Λm, S m² mol⁻¹ (as printed, 111.3×10⁻⁴ etc.). */
  readonly lambdaSm2: number
}

/** Table 2.3 (book p. 47), KCl at 298.15 K. */
export const NCERT_KCL_CONDUCTIVITY: readonly KClConductivityRow[] = [
  { molPerL: 1.0, molPerM3: 1000, kappaScmInv: 0.1113, kappaSmInv: 11.13, lambdaScm2: 111.3, lambdaSm2: 111.3e-4 },
  { molPerL: 0.1, molPerM3: 100.0, kappaScmInv: 0.0129, kappaSmInv: 1.29, lambdaScm2: 129.0, lambdaSm2: 129.0e-4 },
  { molPerL: 0.01, molPerM3: 10.0, kappaScmInv: 0.00141, kappaSmInv: 0.141, lambdaScm2: 141.0, lambdaSm2: 141.0e-4 },
]

export interface LimitingIonRow {
  readonly id: 'H+' | 'Na+' | 'K+' | 'Ca2+' | 'Mg2+' | 'OH-' | 'Cl-' | 'Br-' | 'CH3COO-' | 'SO4_2-'
  readonly formula: string
  readonly charge: number
  /** λ° / S cm² mol⁻¹ at 298 K. */
  readonly lambda0Scm2: number
}

/** Table 2.4 (book p. 50), limiting molar conductivities of ions in water at 298 K. */
export const NCERT_LIMITING_ION_CONDUCTIVITY: readonly LimitingIonRow[] = [
  { id: 'H+', formula: 'H⁺', charge: 1, lambda0Scm2: 349.6 },
  { id: 'Na+', formula: 'Na⁺', charge: 1, lambda0Scm2: 50.1 },
  { id: 'K+', formula: 'K⁺', charge: 1, lambda0Scm2: 73.5 },
  { id: 'Ca2+', formula: 'Ca²⁺', charge: 2, lambda0Scm2: 119.0 },
  { id: 'Mg2+', formula: 'Mg²⁺', charge: 2, lambda0Scm2: 106.0 },
  { id: 'OH-', formula: 'OH⁻', charge: -1, lambda0Scm2: 199.1 },
  { id: 'Cl-', formula: 'Cl⁻', charge: -1, lambda0Scm2: 76.3 },
  { id: 'Br-', formula: 'Br⁻', charge: -1, lambda0Scm2: 78.1 },
  { id: 'CH3COO-', formula: 'CH₃COO⁻', charge: -1, lambda0Scm2: 40.9 },
  { id: 'SO4_2-', formula: 'SO₄²⁻', charge: -2, lambda0Scm2: 160.0 },
]

/** Example 2.6 (book p. 48): KCl molar conductivity at 298 K. */
export const NCERT_EXAMPLE_2_6_KCL = [
  { c: 0.000198, lambdaScm2: 148.61 },
  { c: 0.000309, lambdaScm2: 148.29 },
  { c: 0.000521, lambdaScm2: 147.81 },
  { c: 0.000989, lambdaScm2: 147.09 },
] as const

/** NCERT's graphical reading for Example 2.6, S cm² mol⁻¹ and S cm² mol⁻¹ (mol L⁻¹)^-½. */
export const NCERT_EXAMPLE_2_6_GRAPH = { lambda0Scm2: 150.0, A: 87.46 } as const

export interface BatteryEntry {
  readonly id: 'dry-cell' | 'mercury-cell' | 'lead-storage' | 'nickel-cadmium'
  readonly name: string
  readonly kind: 'primary' | 'secondary'
  readonly electrolyte: string
  /** Anode half-reaction as an mhchem body, or null when NCERT does not give it. */
  readonly anodeCe: string | null
  /** Cathode half-reaction as an mhchem body, or null when NCERT does not give it. */
  readonly cathodeCe: string | null
  /** Overall discharge reaction as an mhchem body. */
  readonly overallCe: string
  /** Recharge reaction (secondary cells only), mhchem body. */
  readonly rechargeCe: string | null
  /** Voltage NCERT states, V; null when NCERT does not state one. */
  readonly ncertVoltage: number | null
  /** How the overall reaction was obtained. */
  readonly overallSource: 'NCERT' | 'derived from NCERT half-reactions'
  readonly bookPage: number
}

/** Sec. 2.6 (book pp. 54-56). */
export const NCERT_BATTERIES: readonly BatteryEntry[] = [
  {
    id: 'dry-cell',
    name: 'Dry cell (Leclanché)',
    kind: 'primary',
    electrolyte: 'Moist paste of NH4Cl and ZnCl2',
    anodeCe: 'Zn(s) -> Zn^{2+} + 2e-',
    cathodeCe: 'MnO2 + NH4^+ + e- -> MnO(OH) + NH3',
    overallCe: 'Zn + 2MnO2 + 2NH4^+ -> Zn^{2+} + 2MnO(OH) + 2NH3',
    rechargeCe: null,
    ncertVoltage: 1.5,
    overallSource: 'derived from NCERT half-reactions',
    bookPage: 54,
  },
  {
    id: 'mercury-cell',
    name: 'Mercury cell',
    kind: 'primary',
    electrolyte: 'Paste of KOH and ZnO',
    anodeCe: 'Zn(Hg) + 2OH^- -> ZnO(s) + H2O + 2e-',
    cathodeCe: 'HgO + H2O + 2e- -> Hg(l) + 2OH^-',
    overallCe: 'Zn(Hg) + HgO(s) -> ZnO(s) + Hg(l)',
    rechargeCe: null,
    ncertVoltage: 1.35,
    overallSource: 'NCERT',
    bookPage: 54,
  },
  {
    id: 'lead-storage',
    name: 'Lead storage battery',
    kind: 'secondary',
    electrolyte: '38% H2SO4 solution',
    anodeCe: 'Pb(s) + SO4^{2-} -> PbSO4(s) + 2e-',
    cathodeCe: 'PbO2(s) + SO4^{2-} + 4H+ + 2e- -> PbSO4(s) + 2H2O',
    overallCe: 'Pb(s) + PbO2(s) + 2H2SO4 -> 2PbSO4(s) + 2H2O',
    rechargeCe: '2PbSO4(s) + 2H2O -> Pb(s) + PbO2(s) + 2H2SO4',
    ncertVoltage: null,
    overallSource: 'NCERT',
    bookPage: 55,
  },
  {
    id: 'nickel-cadmium',
    name: 'Nickel–cadmium cell',
    kind: 'secondary',
    electrolyte: 'Sodium or potassium hydroxide (moist, in a jelly-roll arrangement)',
    anodeCe: null,
    cathodeCe: null,
    overallCe: 'Cd(s) + 2Ni(OH)3(s) -> CdO(s) + 2Ni(OH)2(s) + H2O(l)',
    rechargeCe: null,
    ncertVoltage: null,
    overallSource: 'NCERT',
    bookPage: 56,
  },
]

/** Sec. 2.7 (book pp. 56-57). */
export const NCERT_FUEL_CELL = {
  name: 'Hydrogen–oxygen fuel cell (Apollo programme)',
  electrodes: 'Porous carbon electrodes with finely divided Pt or Pd catalyst',
  electrolyte: 'Concentrated aqueous NaOH',
  anodeCe: '2H2(g) + 4OH^- -> 4H2O(l) + 4e-',
  cathodeCe: 'O2(g) + 2H2O(l) + 4e- -> 4OH^-',
  overallCe: '2H2(g) + O2(g) -> 2H2O(l)',
  efficiencyPercent: 70,
  thermalPlantEfficiencyPercent: 40,
  bookPage: 56,
} as const

/** Sec. 2.8 (book p. 57). */
export const NCERT_CORROSION = {
  rustFormula: 'Fe₂O₃·xH₂O',
  anodeCe: 'Fe(s) -> Fe^{2+} + 2e-',
  anodeE0: -0.44,
  cathodeCe: 'O2(g) + 4H^+ + 4e- -> 2H2O(l)',
  cathodeE0: 1.23,
  overallCe: '2Fe(s) + O2(g) + 4H^+ -> 2Fe^{2+} + 2H2O(l)',
  overallE0Cell: 1.67,
  atmosphericOxidationCe: '2Fe^{2+} + 2H2O + 1/2O2 -> Fe2O3(s) + 4H^+',
  preventionMethods: [
    'Cover the surface with paint or a chemical such as bisphenol',
    'Coat with a less reactive or self-protecting metal (Sn, Zn)',
    'Sacrificial electrode of a more active metal (Mg, Zn)',
  ],
  bookPage: 57,
} as const

export interface UnitTwoErrata {
  readonly id: string
  readonly bookPage: number
  readonly where: string
  readonly printed: string
  readonly correction: string
}

/** NCERT slips found while transcribing Unit 2. Section agents must avoid repeating them. */
export const NCERT_UNIT2_ERRATA: readonly UnitTwoErrata[] = [
  {
    id: 'F-value',
    bookPage: 40,
    where: 'Examples 2.3 and 2.10, and the text',
    printed: 'F = 96487 C mol⁻¹ in the text',
    correction: 'Examples 2.3 and 2.10 use 96487. No worked example in Examples 2.1–2.10 uses 96500. Use FARADAY = 96487; label any 96500 result as rounded.',
  },
  {
    id: 'ex2.3-missing-digit',
    bookPage: 40,
    where: 'Example 2.3',
    printed: 'ΔrG° = −21227 J mol⁻¹',
    correction: '2 × 1.1 V × 96487 C mol⁻¹ = −212271 J mol⁻¹ (−212.27 kJ mol⁻¹), as NCERT states on the next line.',
  },
  {
    id: 'ex2.7-table-ref',
    bookPage: 50,
    where: 'Example 2.7',
    printed: '"data given in Table 3.4"',
    correction: 'Means Table 2.4 (limiting ion conductivities).',
  },
  {
    id: 'table2.2-graphite-exponent',
    bookPage: 44,
    where: 'Table 2.2, Graphite',
    printed: '1.2×10 S m⁻¹ (no exponent)',
    correction: 'Exponent is missing in print. Stored as printed (12); it is almost certainly 1.2×10⁴ S m⁻¹. Check before use.',
  },
  {
    id: 'table2.2-metal-exponent',
    bookPage: 44,
    where: 'Table 2.2, Sodium, Copper, Silver, Gold, Iron',
    printed: 'Exponent printed as 10³ (e.g. Cu 5.9×10³ S m⁻¹)',
    correction: 'Metals conduct at about 10⁷ S m⁻¹ (Cu ≈ 5.9×10⁷). Stored as printed; flag for review before showing values.',
  },
  {
    id: 'ex2.6-graph-vs-fit',
    bookPage: 48,
    where: 'Example 2.6',
    printed: 'Λ°m = 150.0 S cm² mol⁻¹ and A = 87.46 from the graph',
    correction: 'Least-squares fit of the four printed points gives Λ°m ≈ 149.8 and A ≈ 87.4. The graph reading is within about 0.2 of this.',
  },
  {
    id: 'eq2.36-2.37-sign',
    bookPage: 53,
    where: 'Eqs. 2.36 and 2.37 (anode reactions)',
    printed: '2H₂O → O₂ + 4H⁺ + 4e⁻ with E° = +1.23 V (and Cl⁻ → ½Cl₂ + e⁻ with +1.36 V)',
    correction: 'Values are the reduction potentials of the reverse reactions. As written, the oxidation potentials are −1.23 V and −1.36 V. The comparison NCERT makes still holds with reduction values.',
  },
  {
    id: 'ex2.9-units',
    bookPage: 50,
    where: 'Example 2.9',
    printed: 'Ka = 1.78 × 10⁻⁵ mol L⁻¹',
    correction: 'Ka is dimensionless. The value 1.78 × 10⁻⁵ is correct.',
  },
  {
    id: 'ex2.10-molar-mass',
    bookPage: 52,
    where: 'Example 2.10',
    printed: 'Mass of Cu from 63 g mol⁻¹',
    correction: 'Uses 63 g mol⁻¹ (Cu is 63.5). Answer 0.2938 g follows from 63; quote it with that rounding.',
  },
]
