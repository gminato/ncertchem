/**
 * Values, problems and errata for NCERT Class 11 Part I, Unit 6 (Equilibrium), 2026-27 reprint.
 *
 * Each table is transcribed as printed. Table values were read from the page images (the text
 * layer of the PDF drops minus signs, superscripts and exponents), and each entry cites the PDF
 * page it came from, plus the line of the plain pdftotext rendering (kech106.txt) where useful.
 *
 * Problems 6.1 to 6.28 carry NCERT's printed answer (`printedAnswer`) and the answer recomputed
 * with the models in this folder (`computedAnswer`). Where NCERT is wrong or inconsistent the
 * disagreement is listed in NCERT_UNIT6_ERRATA, not corrected in place.
 *
 * Units: concentrations in mol L⁻¹ unless the field says otherwise; pressures in bar; Kp in bar^Δn.
 */

import type { NcertTable } from './ncert-unit4-tables'

/** One row of Table 6.2: initial and equilibrium concentrations (×10⁻² mol L⁻¹) for H2 + I2 ⇌ 2HI at 731 K. */
export interface HydrogenIodineRow {
  experiment: number
  initial: { h2: number; i2: number; hi: number }
  equilibrium: { h2: number; i2: number; hi: number }
}

/** NCERT Table 6.2, Initial and Equilibrium Concentrations of H2, I2 and HI (PDF p. 8; text line 762). */
export const NCERT_TABLE_6_2_H2_I2_HI: NcertTable<HydrogenIodineRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.2 (Initial and Equilibrium Concentrations of H2, I2 and HI), PDF p. 8, text line 762. Concentrations in units of 10⁻² mol L⁻¹.',
  rows: [
    { experiment: 1, initial: { h2: 2.4, i2: 1.38, hi: 0 }, equilibrium: { h2: 1.14, i2: 0.12, hi: 2.52 } },
    { experiment: 2, initial: { h2: 2.4, i2: 1.68, hi: 0 }, equilibrium: { h2: 0.92, i2: 0.2, hi: 2.96 } },
    { experiment: 3, initial: { h2: 2.44, i2: 1.98, hi: 0 }, equilibrium: { h2: 0.77, i2: 0.31, hi: 3.34 } },
    { experiment: 4, initial: { h2: 2.46, i2: 1.76, hi: 0 }, equilibrium: { h2: 0.92, i2: 0.22, hi: 3.08 } },
    { experiment: 5, initial: { h2: 0, i2: 0, hi: 3.04 }, equilibrium: { h2: 0.345, i2: 0.345, hi: 2.35 } },
    { experiment: 6, initial: { h2: 0, i2: 0, hi: 7.58 }, equilibrium: { h2: 0.86, i2: 0.86, hi: 5.86 } },
  ],
}

/** One row of Table 6.3: the trial expressions evaluated from Table 6.2 (concentrations in mol L⁻¹). */
export interface TrialExpressionRow {
  experiment: number
  /** [HI]eq / ([H2]eq [I2]eq), as printed. */
  firstTrial: number
  /** [HI]eq² / ([H2]eq [I2]eq), as printed; this is the constant Kc. */
  kc: number
}

/** NCERT Table 6.3, Expression Involving the Equilibrium Concentration of Reactants (PDF p. 9). */
export const NCERT_TABLE_6_3_TRIAL_EXPRESSIONS: NcertTable<TrialExpressionRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.3 (Expression Involving the Equilibrium Concentration of Reactants), PDF p. 9',
  rows: [
    { experiment: 1, firstTrial: 1840, kc: 46.4 },
    { experiment: 2, firstTrial: 1610, kc: 47.6 },
    { experiment: 3, firstTrial: 1400, kc: 46.7 },
    { experiment: 4, firstTrial: 1520, kc: 46.9 },
    { experiment: 5, firstTrial: 1970, kc: 46.4 },
    { experiment: 6, firstTrial: 790, kc: 46.4 },
  ],
}

/** One row of Table 6.4: how K changes when a reaction is reversed or its coefficients are multiplied or divided. */
export interface KTransformRow {
  /** The relation as printed, e.g. 'reverse reaction', 'reaction multiplied by n'. */
  relation: string
  /** The new constant in terms of Kc: 'Kc', '1/Kc', 'Kc^n', 'Kc^(1/n)'. */
  newConstant: string
  /** Operation to pass to transformK in equilibrium.ts. */
  operation: 'reverse' | 'multiply' | 'divide'
}

/** NCERT Table 6.4, Relations between Equilibrium Constants for a General Reaction and its Multiples (PDF p. 10). */
export const NCERT_TABLE_6_4_K_TRANSFORMS: NcertTable<KTransformRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.4 (Relations between Equilibrium Constants for a General Reaction and its Multiples), PDF p. 10',
  rows: [
    { relation: 'reverse reaction (c C + d D ⇌ a A + b B)', newConstant: '1/Kc', operation: 'reverse' },
    { relation: 'coefficients multiplied by n (na A + nb B ⇌ nc C + nd D)', newConstant: 'Kc^n', operation: 'multiply' },
    { relation: 'coefficients divided by n (equivalently multiplied by 1/n)', newConstant: 'Kc^(1/n)', operation: 'divide' },
  ],
}

/** One row of Table 6.5 (Kp): an equilibrium and its Kp at one temperature. */
export interface KpRow {
  reaction: string
  temperatureK: number
  kp: number
}

/**
 * NCERT Table 6.5 (first table of that number), Equilibrium Constants Kp for a Few Selected
 * Reactions (PDF p. 11). The same number is used on PDF p. 28 for a table of pH values; see
 * NCERT_UNIT6_ERRATA.
 */
export const NCERT_TABLE_6_5_KP: NcertTable<KpRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.5 (Equilibrium Constants, Kp for a Few Selected Reactions), PDF p. 11',
  rows: [
    { reaction: 'N2(g) + 3H2(g) ⇌ 2NH3(g)', temperatureK: 298, kp: 6.8e5 },
    { reaction: 'N2(g) + 3H2(g) ⇌ 2NH3(g)', temperatureK: 400, kp: 41 },
    { reaction: 'N2(g) + 3H2(g) ⇌ 2NH3(g)', temperatureK: 500, kp: 3.6e-2 },
    { reaction: '2SO2(g) + O2(g) ⇌ 2SO3(g)', temperatureK: 298, kp: 4.0e24 },
    { reaction: '2SO2(g) + O2(g) ⇌ 2SO3(g)', temperatureK: 500, kp: 2.5e10 },
    { reaction: '2SO2(g) + O2(g) ⇌ 2SO3(g)', temperatureK: 700, kp: 3.0e4 },
    { reaction: 'N2O4(g) ⇌ 2NO2(g)', temperatureK: 298, kp: 0.98 },
    { reaction: 'N2O4(g) ⇌ 2NO2(g)', temperatureK: 400, kp: 47.9 },
    { reaction: 'N2O4(g) ⇌ 2NO2(g)', temperatureK: 500, kp: 1700 },
  ],
}

/** One row of the pH table (the second table numbered 6.5, PDF p. 28). */
export interface PhRow {
  fluid: string
  /** pH as printed. `approximate` marks values printed with a tilde. */
  pH: number
  approximate: boolean
}

/** Second table numbered 6.5: The pH of Some Common Substances (PDF p. 28, text line 3047). */
export const NCERT_TABLE_6_5_PH: NcertTable<PhRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, second Table 6.5 (The pH of Some Common Substances), PDF p. 28, text line 3047',
  rows: [
    { fluid: 'Saturated solution of NaOH', pH: 15, approximate: true },
    { fluid: '0.1 M NaOH solution', pH: 13, approximate: false },
    { fluid: 'Lime water', pH: 10.5, approximate: false },
    { fluid: 'Milk of magnesia', pH: 10, approximate: false },
    { fluid: 'Egg white, sea water', pH: 7.8, approximate: false },
    { fluid: 'Human blood', pH: 7.4, approximate: false },
    { fluid: 'Milk', pH: 6.8, approximate: false },
    { fluid: 'Human saliva', pH: 6.4, approximate: false },
    { fluid: 'Black coffee', pH: 5.0, approximate: false },
    { fluid: 'Tomato juice', pH: 4.2, approximate: true },
    { fluid: 'Soft drinks and vinegar', pH: 3.0, approximate: true },
    { fluid: 'Lemon juice', pH: 2.2, approximate: true },
    { fluid: 'Gastric juice', pH: 1.2, approximate: true },
    { fluid: '1 M HCl solution', pH: 0, approximate: true },
    { fluid: 'Concentrated HCl', pH: -1.0, approximate: true },
  ],
}

/** One row of Table 6.6 (weak acids, Ka at 298 K). */
export interface AcidConstantRow {
  name: string
  formula: string
  ka: number
}

/** NCERT Table 6.6, The Ionization Constants of Some Selected Weak Acids at 298 K (PDF p. 28, text line 3151). */
export const NCERT_TABLE_6_6_KA: NcertTable<AcidConstantRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.6 (The Ionization Constants of Some Selected Weak Acids at 298 K), PDF p. 28, text line 3151',
  rows: [
    { name: 'Hydrofluoric acid', formula: 'HF', ka: 3.5e-4 },
    { name: 'Nitrous acid', formula: 'HNO2', ka: 4.5e-4 },
    { name: 'Formic acid', formula: 'HCOOH', ka: 1.8e-4 },
    { name: 'Niacin', formula: 'C5H4NCOOH', ka: 1.5e-5 },
    { name: 'Acetic acid', formula: 'CH3COOH', ka: 1.74e-5 },
    { name: 'Benzoic acid', formula: 'C6H5COOH', ka: 6.5e-5 },
    { name: 'Hypochlorous acid', formula: 'HClO', ka: 3.0e-8 },
    { name: 'Hydrocyanic acid', formula: 'HCN', ka: 4.9e-10 },
    { name: 'Phenol', formula: 'C6H5OH', ka: 1.3e-10 },
  ],
}

/** One row of Table 6.7 (weak bases, Kb at 298 K). */
export interface BaseConstantRow {
  name: string
  formula: string
  kb: number
}

/** NCERT Table 6.7, The Values of the Ionization Constant of Some Weak Bases at 298 K (PDF p. 30, text line 3420). */
export const NCERT_TABLE_6_7_KB: NcertTable<BaseConstantRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.7 (The Values of the Ionization Constant of Some Weak Bases at 298 K), PDF p. 30, text line 3420',
  rows: [
    { name: 'Dimethylamine', formula: '(CH3)2NH', kb: 5.4e-4 },
    { name: 'Triethylamine', formula: '(C2H5)3N', kb: 6.45e-5 },
    { name: 'Ammonia', formula: 'NH3 or NH4OH', kb: 1.77e-5 },
    { name: 'Quinine', formula: '(a plant product)', kb: 1.1e-6 },
    { name: 'Pyridine', formula: 'C5H5N', kb: 1.77e-9 },
    { name: 'Aniline', formula: 'C6H5NH2', kb: 4.27e-10 },
    { name: 'Urea', formula: 'CO(NH2)2', kb: 1.3e-14 },
  ],
}

/** One row of Table 6.8 (polyprotic acids, 298 K). `ka1` may be 'very large' (sulphuric acid). */
export interface PolyproticRow {
  name: string
  ka1: number | 'very large'
  ka2: number | null
  ka3: number | null
}

/** NCERT Table 6.8, The Ionization Constants of Some Common Polyprotic Acids (298 K) (PDF p. 33, text line 3739). */
export const NCERT_TABLE_6_8_POLYPROTIC: NcertTable<PolyproticRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.8 (The Ionization Constants of Some Common Polyprotic Acids, 298 K), PDF p. 33, text line 3739',
  rows: [
    { name: 'Oxalic acid', ka1: 5.9e-2, ka2: 6.4e-5, ka3: null },
    { name: 'Ascorbic acid', ka1: 7.4e-4, ka2: 1.6e-12, ka3: null },
    { name: 'Sulphurous acid', ka1: 1.7e-2, ka2: 6.4e-8, ka3: null },
    { name: 'Sulphuric acid', ka1: 'very large', ka2: 1.2e-2, ka3: null },
    { name: 'Carbonic acid', ka1: 4.3e-7, ka2: 5.6e-11, ka3: null },
    { name: 'Citric acid', ka1: 7.4e-4, ka2: 1.7e-5, ka3: 4.0e-7 },
    { name: 'Phosphoric acid', ka1: 7.5e-3, ka2: 6.2e-8, ka3: 4.2e-13 },
  ],
}

/** One row of Table 6.9 (solubility product constants at 298 K). */
export interface KspRow {
  name: string
  formula: string
  ksp: number
}

/** NCERT Table 6.9, The Solubility Product Constants, Ksp of Some Common Ionic Salts at 298 K (PDF p. 38, text line 4314). */
export const NCERT_TABLE_6_9_KSP: NcertTable<KspRow> = {
  source: 'NCERT Class 11 Part I, Unit 6, Table 6.9 (The Solubility Product Constants, Ksp of Some Common Ionic Salts at 298 K), PDF p. 38, text line 4314',
  rows: [
    { name: 'Silver Bromide', formula: 'AgBr', ksp: 5.0e-13 },
    { name: 'Silver Carbonate', formula: 'Ag2CO3', ksp: 8.1e-12 },
    { name: 'Silver Chromate', formula: 'Ag2CrO4', ksp: 1.1e-12 },
    { name: 'Silver Chloride', formula: 'AgCl', ksp: 1.8e-10 },
    { name: 'Silver Iodide', formula: 'AgI', ksp: 8.3e-17 },
    { name: 'Silver Sulphate', formula: 'Ag2SO4', ksp: 1.4e-5 },
    { name: 'Aluminium Hydroxide', formula: 'Al(OH)3', ksp: 1.3e-33 },
    { name: 'Barium Chromate', formula: 'BaCrO4', ksp: 1.2e-10 },
    { name: 'Barium Fluoride', formula: 'BaF2', ksp: 1.0e-6 },
    { name: 'Barium Sulphate', formula: 'BaSO4', ksp: 1.1e-10 },
    { name: 'Calcium Carbonate', formula: 'CaCO3', ksp: 2.8e-9 },
    { name: 'Calcium Fluoride', formula: 'CaF2', ksp: 5.3e-9 },
    { name: 'Calcium Hydroxide', formula: 'Ca(OH)2', ksp: 5.5e-6 },
    { name: 'Calcium Oxalate', formula: 'CaC2O4', ksp: 4.0e-9 },
    { name: 'Calcium Sulphate', formula: 'CaSO4', ksp: 9.1e-6 },
    { name: 'Cadmium Hydroxide', formula: 'Cd(OH)2', ksp: 2.5e-14 },
    { name: 'Cadmium Sulphide', formula: 'CdS', ksp: 8.0e-27 },
    { name: 'Chromic Hydroxide', formula: 'Cr(OH)3', ksp: 6.3e-31 },
    { name: 'Cuprous Bromide', formula: 'CuBr', ksp: 5.3e-9 },
    { name: 'Cupric Carbonate', formula: 'CuCO3', ksp: 1.4e-10 },
    { name: 'Cuprous Chloride', formula: 'CuCl', ksp: 1.7e-6 },
    { name: 'Cupric Hydroxide', formula: 'Cu(OH)2', ksp: 2.2e-20 },
    { name: 'Cuprous Iodide', formula: 'CuI', ksp: 1.1e-12 },
    { name: 'Cupric Sulphide', formula: 'CuS', ksp: 6.3e-36 },
    { name: 'Ferrous Carbonate', formula: 'FeCO3', ksp: 3.2e-11 },
    { name: 'Ferrous Hydroxide', formula: 'Fe(OH)2', ksp: 8.0e-16 },
    { name: 'Ferric Hydroxide', formula: 'Fe(OH)3', ksp: 1.0e-38 },
    { name: 'Ferrous Sulphide', formula: 'FeS', ksp: 6.3e-18 },
    { name: 'Mercurous Bromide', formula: 'Hg2Br2', ksp: 5.6e-23 },
    { name: 'Mercurous Chloride', formula: 'Hg2Cl2', ksp: 1.3e-18 },
    { name: 'Mercurous Iodide', formula: 'Hg2I2', ksp: 4.5e-29 },
    { name: 'Mercurous Sulphate', formula: 'Hg2SO4', ksp: 7.4e-7 },
    { name: 'Mercuric Sulphide', formula: 'HgS', ksp: 4.0e-53 },
    { name: 'Magnesium Carbonate', formula: 'MgCO3', ksp: 3.5e-8 },
    { name: 'Magnesium Fluoride', formula: 'MgF2', ksp: 6.5e-9 },
    { name: 'Magnesium Hydroxide', formula: 'Mg(OH)2', ksp: 1.8e-11 },
    { name: 'Magnesium Oxalate', formula: 'MgC2O4', ksp: 7.0e-7 },
    { name: 'Manganese Carbonate', formula: 'MnCO3', ksp: 1.8e-11 },
    { name: 'Manganese Sulphide', formula: 'MnS', ksp: 2.5e-13 },
    { name: 'Nickel Hydroxide', formula: 'Ni(OH)2', ksp: 2.0e-15 },
    { name: 'Nickel Sulphide', formula: 'NiS', ksp: 4.7e-5 },
    { name: 'Lead Bromide', formula: 'PbBr2', ksp: 4.0e-5 },
    { name: 'Lead Carbonate', formula: 'PbCO3', ksp: 7.4e-14 },
    { name: 'Lead Chloride', formula: 'PbCl2', ksp: 1.6e-5 },
    { name: 'Lead Fluoride', formula: 'PbF2', ksp: 7.7e-8 },
    { name: 'Lead Hydroxide', formula: 'Pb(OH)2', ksp: 1.2e-15 },
    { name: 'Lead Iodide', formula: 'PbI2', ksp: 7.1e-9 },
    { name: 'Lead Sulphate', formula: 'PbSO4', ksp: 1.6e-8 },
    { name: 'Lead Sulphide', formula: 'PbS', ksp: 8.0e-28 },
    { name: 'Stannous Hydroxide', formula: 'Sn(OH)2', ksp: 1.4e-28 },
    { name: 'Stannous Sulphide', formula: 'SnS', ksp: 1.0e-25 },
    { name: 'Strontium Carbonate', formula: 'SrCO3', ksp: 1.1e-10 },
    { name: 'Strontium Fluoride', formula: 'SrF2', ksp: 2.5e-9 },
    { name: 'Strontium Sulphate', formula: 'SrSO4', ksp: 3.2e-7 },
    { name: 'Thallous Bromide', formula: 'TlBr', ksp: 3.4e-6 },
    { name: 'Thallous Chloride', formula: 'TlCl', ksp: 1.7e-4 },
    { name: 'Thallous Iodide', formula: 'TlI', ksp: 6.5e-8 },
    { name: 'Zinc Carbonate', formula: 'ZnCO3', ksp: 1.4e-11 },
    { name: 'Zinc Hydroxide', formula: 'Zn(OH)2', ksp: 1.0e-15 },
    { name: 'Zinc Sulphide', formula: 'ZnS', ksp: 1.6e-24 },
  ],
}

/** One NCERT Problem: its data in brief, the printed answer, and the answer recomputed here. */
export interface NcertProblem {
  /** NCERT numbering, e.g. '6.1'. */
  number: string
  /** PDF page on which the problem's solution is printed. */
  pdfPage: number
  /** One-line summary of the data, written for this site. */
  summary: string
  /** The answer NCERT prints. */
  printedAnswer: string
  /** The answer from the models in this folder, with the same rounding as NCERT where possible. */
  computedAnswer: string
}

/** NCERT in-text Problems 6.1 to 6.28 (Unit 6). */
export const NCERT_UNIT6_PROBLEMS: readonly NcertProblem[] = [
  {
    number: '6.1',
    pdfPage: 10,
    summary: 'NH3 at equilibrium at 500 K: [N2] = 1.5×10⁻² M, [H2] = 3.0×10⁻² M, [NH3] = 1.2×10⁻² M; find Kc for N2 + 3H2 ⇌ 2NH3.',
    printedAnswer: 'Kc = 3.55 × 10²',
    computedAnswer: 'Kc = 3.56 × 10²',
  },
  {
    number: '6.2',
    pdfPage: 10,
    summary: 'N2 = 3.0×10⁻³ M, O2 = 4.2×10⁻³ M, NO = 2.8×10⁻³ M at 800 K; find Kc for N2 + O2 ⇌ 2NO.',
    printedAnswer: 'Kc = 0.622',
    computedAnswer: 'Kc = 0.622',
  },
  {
    number: '6.3',
    pdfPage: 11,
    summary: 'PCl3 = 1.59 M, Cl2 = 1.59 M and PCl5 = 1.41 M at 500 K; find Kc for the reaction as stated (PCl3 + Cl2 ⇌ PCl5).',
    printedAnswer: 'Kc = 1.79 (solution writes the reaction as PCl5 ⇌ PCl3 + Cl2)',
    computedAnswer: 'Kc = 0.56 for PCl3 + Cl2 ⇌ PCl5 (1.79 is the constant for PCl5 ⇌ PCl3 + Cl2)',
  },
  {
    number: '6.4',
    pdfPage: 12,
    summary: 'CO + H2O ⇌ CO2 + H2 with Kc = 4.24 at 800 K; start with 0.10 M CO and 0.10 M H2O.',
    printedAnswer: '[CO2] = [H2] = 0.067 M; [CO] = [H2O] = 0.033 M',
    computedAnswer: '[CO2] = [H2] = 0.067 M; [CO] = [H2O] = 0.033 M',
  },
  {
    number: '6.5',
    pdfPage: 12,
    summary: '2NOCl ⇌ 2NO + Cl2 has Kc = 3.75×10⁻⁶ at 1069 K; find Kp.',
    printedAnswer: 'Kp = 0.033 (with Δn = +1)',
    computedAnswer: 'Kp = 3.3 × 10⁻⁴ bar (with Δn = +1)',
  },
  {
    number: '6.6',
    pdfPage: 13,
    summary: 'CO2 + C(s) ⇌ 2CO with Kp = 3.0 at 1000 K; start with p(CO2) = 0.48 bar and p(CO) = 0 bar.',
    printedAnswer: 'p(CO) = 0.66 bar; p(CO2) = 0.15 bar',
    computedAnswer: 'p(CO) = 0.67 bar; p(CO2) = 0.147 bar (NCERT rounds x to 0.33 first)',
  },
  {
    number: '6.7',
    pdfPage: 15,
    summary: '2A ⇌ B + C with Kc = 2×10⁻³; [A] = [B] = [C] = 3×10⁻⁴ M. Which way does it proceed?',
    printedAnswer: 'Qc = 1 > Kc, so the reaction proceeds in the reverse direction',
    computedAnswer: 'Qc = 1 > Kc, so the reaction proceeds in the reverse direction',
  },
  {
    number: '6.8',
    pdfPage: 16,
    summary: '13.8 g N2O4 in 1 L at 400 K; total pressure at equilibrium 9.15 bar. Find Kc, Kp and partial pressures.',
    printedAnswer: 'Kc = 2.6; Kp = 85.87; p(N2O4) = 0.81 bar; p(NO2) = 8.34 bar',
    computedAnswer: 'Kc = 2.58 (NCERT prints 2.6, from R = 0.083); Kp = 85.9; p(N2O4) = 0.81 bar; p(NO2) = 8.34 bar',
  },
  {
    number: '6.9',
    pdfPage: 16,
    summary: '3.00 mol PCl5 in 1 L at 380 K with Kc = 1.80; find the equilibrium composition.',
    printedAnswer: '[PCl5] = 1.41 M; [PCl3] = [Cl2] = 1.59 M',
    computedAnswer: '[PCl5] = 1.41 M; [PCl3] = [Cl2] = 1.59 M',
  },
  {
    number: '6.10',
    pdfPage: 17,
    summary: 'ΔG° = 13.8 kJ mol⁻¹ for glucose phosphorylation at 298 K; find Kc.',
    printedAnswer: 'Kc = 3.81 × 10⁻³',
    computedAnswer: 'Kc = 3.81 × 10⁻³',
  },
  {
    number: '6.11',
    pdfPage: 17,
    summary: 'Kc = 2×10¹³ for sucrose hydrolysis at 300 K; find ΔG° at 300 K.',
    printedAnswer: 'ΔG° = −7.64 × 10⁴ J mol⁻¹',
    computedAnswer: 'ΔG° = −7.64 × 10⁴ J mol⁻¹',
  },
  {
    number: '6.12',
    pdfPage: 24,
    summary: 'Conjugate bases of HF, H2SO4 and HCO3⁻.',
    printedAnswer: 'F⁻, HSO4⁻, CO3²⁻',
    computedAnswer: 'F⁻, HSO4⁻, CO3²⁻',
  },
  {
    number: '6.13',
    pdfPage: 24,
    summary: 'Conjugate acids of NH2⁻, NH3 and HCOO⁻.',
    printedAnswer: 'NH3, NH4⁺, HCOOH',
    computedAnswer: 'NH3, NH4⁺, HCOOH',
  },
  {
    number: '6.14',
    pdfPage: 24,
    summary: 'H2O, HCO3⁻, HSO4⁻ and NH3 each act as Brønsted acid and base; give the conjugate partners.',
    printedAnswer: 'H2O: H3O⁺ / OH⁻; HCO3⁻: H2CO3 / CO3²⁻; HSO4⁻: H2SO4 / SO4²⁻; NH3: NH4⁺ / NH2⁻',
    computedAnswer: 'H2O: H3O⁺ / OH⁻; HCO3⁻: H2CO3 / CO3²⁻; HSO4⁻: H2SO4 / SO4²⁻; NH3: NH4⁺ / NH2⁻',
  },
  {
    number: '6.15',
    pdfPage: 25,
    summary: 'Classify OH⁻, F⁻, H⁺ and BCl3 as Lewis acids or bases.',
    printedAnswer: 'OH⁻ and F⁻ are Lewis bases; H⁺ and BCl3 are Lewis acids',
    computedAnswer: 'OH⁻ and F⁻ are Lewis bases; H⁺ and BCl3 are Lewis acids',
  },
  {
    number: '6.16',
    pdfPage: 27,
    summary: '[H3O⁺] = 3.8×10⁻³ M in a soft drink; find pH.',
    printedAnswer: 'pH = 2.42',
    computedAnswer: 'pH = 2.42',
  },
  {
    number: '6.17',
    pdfPage: 27,
    summary: 'pH of 1.0×10⁻⁸ M HCl, including the water contribution.',
    printedAnswer: 'pH = 6.98',
    computedAnswer: 'pH = 6.98',
  },
  {
    number: '6.18',
    pdfPage: 29,
    summary: 'HF with Ka = 3.2×10⁻⁴ in 0.02 M solution; find α, the species concentrations and pH.',
    printedAnswer: 'α = 0.12; [H3O⁺] = [F⁻] = 2.4×10⁻³ M; [HF] = 17.6×10⁻³ M; pH = 2.62',
    computedAnswer: 'α = 0.119; [H3O⁺] = [F⁻] = 2.37×10⁻³ M; [HF] = 17.6×10⁻³ M; pH = 2.62',
  },
  {
    number: '6.19',
    pdfPage: 30,
    summary: 'pH of 0.1 M monobasic acid is 4.50; find [H⁺], [A⁻], [HA], Ka and pKa.',
    printedAnswer: '[H⁺] = [A⁻] = 3.16×10⁻⁵ M; [HA] ≈ 0.1 M; Ka = 1.0×10⁻⁸; pKa = 8',
    computedAnswer: '[H⁺] = [A⁻] = 3.16×10⁻⁵ M; [HA] ≈ 0.1 M; Ka = 1.0×10⁻⁸; pKa = 8.00',
  },
  {
    number: '6.20',
    pdfPage: 30,
    summary: 'pH and percent dissociation of 0.08 M HOCl, with Ka = 2.5×10⁻⁵ as printed in the problem.',
    printedAnswer: 'pH = 2.85; percent dissociation = 1.76 %',
    computedAnswer: 'pH = 2.85; percent dissociation = 1.77 % (with the printed Ka). With Table 6.6 Ka = 3.0×10⁻⁸: [H⁺] = 4.9×10⁻⁵ M, pH = 4.31, 0.061 %',
  },
  {
    number: '6.21',
    pdfPage: 31,
    summary: 'Hydrazine 0.004 M has pH 9.7; find Kb and pKb.',
    printedAnswer: 'Kb = 8.96 × 10⁻⁷; pKb = 6.04',
    computedAnswer: 'Kb = 6.3 × 10⁻⁷; pKb = 6.20 (antilog(−9.7) = 2.0×10⁻¹⁰, not 1.67×10⁻¹⁰)',
  },
  {
    number: '6.22',
    pdfPage: 31,
    summary: 'Buffer of 0.2 M NH4Cl and 0.1 M NH3 with pKb = 4.75; find pH.',
    printedAnswer: '[OH⁻] = 0.88×10⁻⁵ M; [H⁺] = 1.12×10⁻⁹ M; pH = 8.95',
    computedAnswer: '[OH⁻] = 0.885×10⁻⁵ M; [H⁺] = 1.13×10⁻⁹ M; pH = 8.95',
  },
  {
    number: '6.23',
    pdfPage: 32,
    summary: 'Degree of ionization and pH of 0.05 M NH3 (Kb from Table 6.7); Ka of NH4⁺.',
    printedAnswer: 'α = 0.018; [OH⁻] = 9.4×10⁻⁴ M; [H⁺] = 1.06×10⁻¹¹ M; pH = 10.97; Ka(NH4⁺) = 5.64×10⁻¹⁰',
    computedAnswer: 'α = 0.0188 (1.9 %); [OH⁻] = 9.4×10⁻⁴ M; [H⁺] = 1.06×10⁻¹¹ M; pH = 10.97; Ka(NH4⁺) = 5.65×10⁻¹⁰',
  },
  {
    number: '6.24',
    pdfPage: 34,
    summary: 'pH of 0.10 M NH3 (Kb = 1.77×10⁻⁵), and after 50.0 mL of it is treated with 25.0 mL of 0.10 M HCl.',
    printedAnswer: 'pH = 11.12 before; pH = 9.24 after',
    computedAnswer: 'pH = 11.12 before; pH = 9.25 after',
  },
  {
    number: '6.25',
    pdfPage: 35,
    summary: 'pH of ammonium acetate with pKa(CH3COOH) = 4.76 and pKb(NH4OH) = 4.75.',
    printedAnswer: 'pH = 7.005',
    computedAnswer: 'pH = 7.005',
  },
  {
    number: '6.26',
    pdfPage: 38,
    summary: 'Molar solubility of A2X3 with Ksp = 1.1×10⁻²³ in pure water.',
    printedAnswer: 'S = 1.0 × 10⁻⁵ mol L⁻¹',
    computedAnswer: 'S = 1.00 × 10⁻⁵ mol L⁻¹',
  },
  {
    number: '6.27',
    pdfPage: 38,
    summary: 'Ksp(Ni(OH)2) = 2.0×10⁻¹⁵ and Ksp(AgCN) = 6×10⁻¹⁷; which salt is more soluble?',
    printedAnswer: 'S(AgCN) = 7.8×10⁻⁹ M; S(Ni(OH)2) = 0.58×10⁻⁴ M; Ni(OH)2 is more soluble',
    computedAnswer: 'S(AgCN) = 7.7×10⁻⁹ M; S(Ni(OH)2) = 7.9×10⁻⁶ M; Ni(OH)2 is more soluble',
  },
  {
    number: '6.28',
    pdfPage: 39,
    summary: 'Molar solubility of Ni(OH)2 (Ksp = 2.0×10⁻¹⁵) in 0.10 M NaOH.',
    printedAnswer: 'S = 2.0 × 10⁻¹³ M',
    computedAnswer: 'S = 2.0 × 10⁻¹³ M',
  },
]

/** One disagreement between NCERT and the recomputed values, or inside NCERT itself. */
export interface NcertErratum {
  /** Where it appears: table or problem, PDF page and text line where known. */
  where: string
  printed: string
  correct: string
  note: string
}

/**
 * Every place NCERT Unit 6 is wrong or inconsistent, found by re-solving each Problem and checking
 * each equation and table against the others. PDF pages are given so each entry can be checked
 * against the page image.
 */
export const NCERT_UNIT6_ERRATA: readonly NcertErratum[] = [
  {
    where: 'Two tables numbered "Table 6.5", PDF p. 11 and PDF p. 28',
    printed: 'Table 6.5 is used for both the Kp values (PDF p. 11) and the pH of common substances (PDF p. 28); the text refers to "Table 6.5 (page 195)" for pH.',
    correct: 'Number the Kp table 6.5 and the pH table 6.5a (or renumber both); the Kp table is not the pH table.',
    note: 'Duplicate table number. The pH table is printed on book page 195.',
  },
  {
    where: 'Problem 6.20, PDF p. 30, against Table 6.6, PDF p. 28',
    printed: 'Ka(HOCl) = 2.5 × 10⁻⁵ in the Problem',
    correct: 'Ka(HOCl) = 3.0 × 10⁻⁸ in Table 6.6; with it, [H⁺] = 4.9 × 10⁻⁵ M, pH = 4.31, 0.061 % dissociation',
    note: 'The Problem is self-consistent with its own Ka but disagrees with the table printed two pages earlier. The printed pH 2.85 is the answer for 2.5 × 10⁻⁵ only.',
  },
  {
    where: 'Problem 6.3, PDF pp. 11–12',
    printed: 'The Problem asks for Kc of PCl3 + Cl2 ⇌ PCl5; the solution writes PCl5 ⇌ PCl3 + Cl2 and gives Kc = 1.79',
    correct: 'For PCl3 + Cl2 ⇌ PCl5, Kc = [PCl5]/([PCl3][Cl2]) = 1.41/(1.59 × 1.59) = 0.56',
    note: '1.79 is the constant for the reverse reaction. Both values are consistent with each other; the direction written in the Problem and the answer disagree.',
  },
  {
    where: 'Problem 6.5, PDF p. 12',
    printed: 'Kp = 0.033',
    correct: 'Kp = Kc(RT)^Δn = 3.75 × 10⁻⁶ × (0.0831 × 1069) = 3.3 × 10⁻⁴ bar',
    note: 'The stated Δn = +1 is right for 2NOCl ⇌ 2NO + Cl2, but the printed value is 100 times too large.',
  },
  {
    where: 'Problem 6.21, PDF p. 31',
    printed: '[H⁺] = antilog(−9.7) = 1.67 × 10⁻¹⁰; Kb = 8.96 × 10⁻⁷; pKb = 6.04',
    correct: '[H⁺] = 10^(−9.7) = 2.0 × 10⁻¹⁰; [OH⁻] = 5.0 × 10⁻⁵; Kb = 6.3 × 10⁻⁷; pKb = 6.20',
    note: 'antilog(−9.7) is 2.0 × 10⁻¹⁰; 1.67 × 10⁻¹⁰ corresponds to pH 9.78, not 9.7.',
  },
  {
    where: 'Problem 6.24, PDF p. 34',
    printed: '[H⁺] = 0.56 × 10⁻⁹ M, pH = 9.24',
    correct: 'pH = −log(0.56 × 10⁻⁹) = 9.25; from Kw/Kb directly, pH = 9.25',
    note: 'The printed pH does not follow from the printed [H⁺].',
  },
  {
    where: 'Problem 6.27, PDF p. 38',
    printed: 'S(Ni(OH)2) = 0.58 × 10⁻⁴ M',
    correct: 'Ksp = 4S³ = 2.0 × 10⁻¹⁵ gives S = 7.9 × 10⁻⁶ M',
    note: 'Substituting 0.58 × 10⁻⁴ back gives Ksp ≈ 7.8 × 10⁻¹³, not 2 × 10⁻¹⁵. The conclusion (Ni(OH)2 is more soluble) still holds.',
  },
  {
    where: 'Problem 6.27, PDF p. 38, Ksp of AgCN',
    printed: '"6 × 0–17"',
    correct: '6 × 10⁻¹⁷',
    note: 'Typographical error in the exponent.',
  },
  {
    where: 'Problem 6.1, PDF p. 10',
    printed: '0.355 × 10³ = 3.55 × 10²',
    correct: '1.44 × 10⁻⁴ / 4.05 × 10⁻⁷ = 3.56 × 10²',
    note: 'Rounding is truncated instead of rounded.',
  },
  {
    where: 'Problem 6.6, PDF p. 13',
    printed: 'x = 0.33, so p(CO) = 0.66 bar and p(CO2) = 0.15 bar',
    correct: 'x = 0.3326, so p(CO) = 0.67 bar and p(CO2) = 0.147 bar',
    note: 'Rounding x before substitution. The answer agrees to within the rounding.',
  },
  {
    where: 'Problem 6.8, PDF p. 16',
    printed: 'R = 0.083 bar L mol⁻¹ K⁻¹',
    correct: 'R = 0.0831 bar L mol⁻¹ K⁻¹ (as in Section 6.4.1, PDF p. 11)',
    note: 'Inconsistent value of R within the unit. The effect on Kc is below 0.2 %.',
  },
  {
    where: 'Problem 6.18, PDF p. 29, against Table 6.6, PDF p. 28',
    printed: 'Ka(HF) = 3.2 × 10⁻⁴ in the Problem; Table 6.6 gives 3.5 × 10⁻⁴',
    correct: 'Use one value throughout; with 3.5 × 10⁻⁴, α = 0.12 still',
    note: 'Two values for the same constant in the same unit. The printed answer is unaffected to two figures.',
  },
  {
    where: 'Problem 6.23, PDF p. 32',
    printed: 'α = 0.018',
    correct: 'α = √(1.77 × 10⁻⁵ / 0.05) = 0.0188',
    note: 'Rounds to 0.019, not 0.018. The printed [OH⁻] = 9.4 × 10⁻⁴ M follows from the unrounded value.',
  },
  {
    where: 'Problem 6.20, PDF p. 30',
    printed: 'Percent dissociation = 1.76 %',
    correct: '1.41 × 10⁻³ / 0.08 = 1.77 %',
    note: 'Rounding of the printed [H⁺] before dividing.',
  },
]
