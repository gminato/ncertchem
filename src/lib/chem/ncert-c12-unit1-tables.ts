/**
 * Reference constants from NCERT Class 12 Chemistry Part I, Unit 1 (Solutions):
 * - Table 1.1: The nine binary solution types by solute/solvent phase
 * - Table 1.2: Henry's law constants (K_H in kbar) for gases in water
 * - Table 1.3: Molal boiling-point elevation (K_b) and freezing-point depression (K_f) constants
 * - Table 1.4: Experimental van't Hoff factors (i) for strong electrolytes at 0.1 m, 0.01 m, 0.001 m
 */

export type PhysicalPhase = 'gas' | 'liquid' | 'solid'

export interface SolutionTypeEntry {
  readonly id: string
  readonly category: 'Gaseous' | 'Liquid' | 'Solid'
  readonly solutePhase: PhysicalPhase
  readonly solventPhase: PhysicalPhase
  readonly example: string
  readonly solventName: string
  readonly soluteName: string
}

/** Table 1.1: Nine binary solution types classified by solute and solvent physical state. */
export const NCERT_SOLUTION_TYPES: readonly SolutionTypeEntry[] = [
  {
    id: 'gas-gas',
    category: 'Gaseous',
    solutePhase: 'gas',
    solventPhase: 'gas',
    example: 'Oxygen in nitrogen (air)',
    soluteName: 'O₂',
    solventName: 'N₂',
  },
  {
    id: 'liquid-gas',
    category: 'Gaseous',
    solutePhase: 'liquid',
    solventPhase: 'gas',
    example: 'Chloroform vapour in nitrogen',
    soluteName: 'CHCl₃',
    solventName: 'N₂',
  },
  {
    id: 'solid-gas',
    category: 'Gaseous',
    solutePhase: 'solid',
    solventPhase: 'gas',
    example: 'Camphor in nitrogen',
    soluteName: 'Camphor',
    solventName: 'N₂',
  },
  {
    id: 'gas-liquid',
    category: 'Liquid',
    solutePhase: 'gas',
    solventPhase: 'liquid',
    example: 'Dissolved oxygen in water',
    soluteName: 'O₂',
    solventName: 'Water',
  },
  {
    id: 'liquid-liquid',
    category: 'Liquid',
    solutePhase: 'liquid',
    solventPhase: 'liquid',
    example: 'Ethanol in water',
    soluteName: 'Ethanol',
    solventName: 'Water',
  },
  {
    id: 'solid-liquid',
    category: 'Liquid',
    solutePhase: 'solid',
    solventPhase: 'liquid',
    example: 'Glucose in water',
    soluteName: 'Glucose',
    solventName: 'Water',
  },
  {
    id: 'gas-solid',
    category: 'Solid',
    solutePhase: 'gas',
    solventPhase: 'solid',
    example: 'Hydrogen in palladium',
    soluteName: 'H₂',
    solventName: 'Pd',
  },
  {
    id: 'liquid-solid',
    category: 'Solid',
    solutePhase: 'liquid',
    solventPhase: 'solid',
    example: 'Mercury amalgam with sodium',
    soluteName: 'Hg',
    solventName: 'Na',
  },
  {
    id: 'solid-solid',
    category: 'Solid',
    solutePhase: 'solid',
    solventPhase: 'solid',
    example: 'Copper dissolved in gold',
    soluteName: 'Cu',
    solventName: 'Au',
  },
] as const

export interface HenryConstantEntry {
  readonly id: string
  readonly gas: string
  readonly formula: string
  readonly temperatureK: number
  /** Henry's law constant K_H in kbar (p = K_H * x). */
  readonly khKbar: number
}

/** Table 1.2: Selected Henry's law constants (K_H / kbar) for gases in water. */
export const NCERT_HENRY_CONSTANTS: readonly HenryConstantEntry[] = [
  { id: 'he-293', gas: 'Helium', formula: 'He', temperatureK: 293, khKbar: 144.97 },
  { id: 'h2-293', gas: 'Hydrogen', formula: 'H₂', temperatureK: 293, khKbar: 69.16 },
  { id: 'n2-293', gas: 'Nitrogen', formula: 'N₂', temperatureK: 293, khKbar: 76.48 },
  { id: 'n2-303', gas: 'Nitrogen', formula: 'N₂', temperatureK: 303, khKbar: 88.84 },
  { id: 'o2-293', gas: 'Oxygen', formula: 'O₂', temperatureK: 293, khKbar: 34.86 },
  { id: 'o2-303', gas: 'Oxygen', formula: 'O₂', temperatureK: 303, khKbar: 46.82 },
  { id: 'ar-298', gas: 'Argon', formula: 'Ar', temperatureK: 298, khKbar: 40.3 },
  { id: 'co2-298', gas: 'Carbon dioxide', formula: 'CO₂', temperatureK: 298, khKbar: 1.67 },
  { id: 'hcho-298', gas: 'Formaldehyde', formula: 'HCHO', temperatureK: 298, khKbar: 1.83e-5 },
  { id: 'ch4-298', gas: 'Methane', formula: 'CH₄', temperatureK: 298, khKbar: 0.413 },
  { id: 'vcm-298', gas: 'Vinyl chloride', formula: 'C₂H₃Cl', temperatureK: 298, khKbar: 0.611 },
] as const

export interface SolventColligativeEntry {
  readonly id: string
  readonly name: string
  readonly formula: string
  readonly molarMassGPerMol: number
  /** Pure solvent normal boiling point in K. */
  readonly boilingPointK: number
  /** Ebullioscopic constant K_b in K kg mol⁻¹. */
  readonly kb: number
  /** Pure solvent normal freezing point in K. */
  readonly freezingPointK: number
  /** Cryoscopic constant K_f in K kg mol⁻¹. */
  readonly kf: number
}

/** Table 1.3: Boiling/freezing points and K_b, K_f constants for nine solvents. */
export const NCERT_SOLVENT_CONSTANTS: readonly SolventColligativeEntry[] = [
  { id: 'water', name: 'Water', formula: 'H₂O', molarMassGPerMol: 18.015, boilingPointK: 373.15, kb: 0.52, freezingPointK: 273.0, kf: 1.86 },
  { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', molarMassGPerMol: 46.07, boilingPointK: 351.5, kb: 1.20, freezingPointK: 155.7, kf: 1.99 },
  { id: 'cyclohexane', name: 'Cyclohexane', formula: 'C₆H₁₂', molarMassGPerMol: 84.16, boilingPointK: 353.74, kb: 2.79, freezingPointK: 279.55, kf: 20.00 },
  { id: 'benzene', name: 'Benzene', formula: 'C₆H₆', molarMassGPerMol: 78.11, boilingPointK: 353.3, kb: 2.53, freezingPointK: 278.6, kf: 5.12 },
  { id: 'chloroform', name: 'Chloroform', formula: 'CHCl₃', molarMassGPerMol: 119.38, boilingPointK: 334.4, kb: 3.63, freezingPointK: 209.6, kf: 4.79 },
  { id: 'ccl4', name: 'Carbon tetrachloride', formula: 'CCl₄', molarMassGPerMol: 153.82, boilingPointK: 350.0, kb: 5.03, freezingPointK: 250.5, kf: 31.8 },
  { id: 'cs2', name: 'Carbon disulphide', formula: 'CS₂', molarMassGPerMol: 76.14, boilingPointK: 319.4, kb: 2.34, freezingPointK: 164.2, kf: 3.83 },
  { id: 'ether', name: 'Diethyl ether', formula: '(C₂H₅)₂O', molarMassGPerMol: 74.12, boilingPointK: 307.8, kb: 2.02, freezingPointK: 156.9, kf: 1.79 },
  { id: 'acetic-acid', name: 'Acetic acid', formula: 'CH₃COOH', molarMassGPerMol: 60.05, boilingPointK: 391.1, kb: 2.93, freezingPointK: 290.0, kf: 3.90 },
] as const

export interface VantHoffSaltEntry {
  readonly id: string
  readonly formula: string
  readonly name: string
  readonly ionsOnCompleteDissociation: number
  readonly iAt01m: number
  readonly iAt001m: number
  readonly iAt0001m: number
  readonly iComplete: number
}

/** Table 1.4: Measured van't Hoff factor i at three molalities vs complete dissociation limit. */
export const NCERT_VANT_HOFF_SALTS: readonly VantHoffSaltEntry[] = [
  { id: 'nacl', formula: 'NaCl', name: 'Sodium chloride', ionsOnCompleteDissociation: 2, iAt01m: 1.87, iAt001m: 1.94, iAt0001m: 1.97, iComplete: 2.00 },
  { id: 'kcl', formula: 'KCl', name: 'Potassium chloride', ionsOnCompleteDissociation: 2, iAt01m: 1.85, iAt001m: 1.94, iAt0001m: 1.98, iComplete: 2.00 },
  { id: 'mgso4', formula: 'MgSO₄', name: 'Magnesium sulphate', ionsOnCompleteDissociation: 2, iAt01m: 1.21, iAt001m: 1.53, iAt0001m: 1.82, iComplete: 2.00 },
  { id: 'k2so4', formula: 'K₂SO₄', name: 'Potassium sulphate', ionsOnCompleteDissociation: 3, iAt01m: 2.32, iAt001m: 2.70, iAt0001m: 2.84, iComplete: 3.00 },
] as const

/** Ideal gas constant in L bar K⁻¹ mol⁻¹, standard in NCERT Class 12 Unit 1 osmotic pressure calculations. */
export const GAS_CONSTANT_L_BAR = 0.08314
