import {
  NCERT_SOLVENT_CONSTANTS,
  type SolventColligativeEntry,
} from './ncert-c12-unit1-tables'

/** Universal gas constant R in J K⁻¹ mol⁻¹ (NCERT Class 12 Unit 1, eqs. 1.37–1.38). */
export const GAS_CONSTANT_J = 8.314

export interface NonElectrolyteSolute {
  readonly id: 'glucose' | 'sucrose' | 'urea' | 'ethylene-glycol'
  readonly name: string
  readonly formula: string
  readonly molarMassGPerMol: number
}

/** Four non-volatile, non-electrolyte solutes with contrasting molar masses. */
export const NON_ELECTROLYTE_SOLUTES: readonly NonElectrolyteSolute[] = [
  { id: 'glucose', name: 'Glucose', formula: 'C₆H₁₂O₆', molarMassGPerMol: 180.16 },
  { id: 'sucrose', name: 'Sucrose', formula: 'C₁₂H₂₂O₁₁', molarMassGPerMol: 342.3 },
  { id: 'urea', name: 'Urea', formula: 'NH₂CONH₂', molarMassGPerMol: 60.06 },
  { id: 'ethylene-glycol', name: 'Ethylene glycol', formula: 'C₂H₆O₂', molarMassGPerMol: 62.07 },
] as const

export interface RelativeLoweringInput {
  /** Moles of non-volatile solute, n₂ (mol). */
  nSolute: number
  /** Moles of volatile solvent, n₁ (mol). */
  nSolvent: number
}

export interface RelativeLoweringResult {
  /** Exact relative lowering of vapour pressure: Δp₁ / p₁⁰ = x₂ = n₂ / (n₁ + n₂). */
  exact: number
  /** Dilute-solution approximation (n₂ ≪ n₁): Δp₁ / p₁⁰ ≈ n₂ / n₁. */
  diluteApproximation: number
  /** Solvent mole fraction x₁ = n₁ / (n₁ + n₂). */
  solventMoleFraction: number
}

/**
 * Relative lowering of vapour pressure for a non-volatile, non-electrolyte solute
 * (NCERT Class 12 Unit 1, eqs. 1.25–1.27).
 */
export function relativeLoweringVapourPressure({
  nSolute,
  nSolvent,
}: RelativeLoweringInput): RelativeLoweringResult {
  if (!Number.isFinite(nSolute) || nSolute < 0) {
    throw new RangeError('nSolute must be a finite non-negative number')
  }
  if (!Number.isFinite(nSolvent) || nSolvent <= 0) {
    throw new RangeError('nSolvent must be a finite positive number')
  }

  const totalMoles = nSolvent + nSolute
  return {
    exact: nSolute / totalMoles,
    diluteApproximation: nSolute / nSolvent,
    solventMoleFraction: nSolvent / totalMoles,
  }
}

export interface MolarMassRlVpInput {
  /** Mass of solute, w₂ (g). */
  w2G: number
  /** Mass of solvent, w₁ (g). */
  w1G: number
  /** Molar mass of solvent, M₁ (g mol⁻¹). */
  m1GPerMol: number
  /** Vapour pressure of pure solvent, p₁⁰ (any consistent pressure unit). */
  p1Zero: number
  /** Vapour pressure of solution, p₁ (same unit as p₁⁰). */
  pSolution: number
}

/**
 * Molar mass of a non-volatile solute from relative vapour-pressure lowering
 * in the dilute limit (NCERT eq. 1.28):
 * M₂ = (w₂ · M₁ / w₁) · (p₁⁰ / (p₁⁰ − p₁))
 */
export function molarMassFromRlVp({
  w2G,
  w1G,
  m1GPerMol,
  p1Zero,
  pSolution,
}: MolarMassRlVpInput): number {
  if (!Number.isFinite(w2G) || w2G <= 0) {
    throw new RangeError('w2G must be a finite positive number')
  }
  if (!Number.isFinite(w1G) || w1G <= 0) {
    throw new RangeError('w1G must be a finite positive number')
  }
  if (!Number.isFinite(m1GPerMol) || m1GPerMol <= 0) {
    throw new RangeError('m1GPerMol must be a finite positive number')
  }
  if (!Number.isFinite(p1Zero) || p1Zero <= 0) {
    throw new RangeError('p1Zero must be a finite positive number')
  }
  if (!Number.isFinite(pSolution) || pSolution < 0 || pSolution >= p1Zero) {
    throw new RangeError('pSolution must satisfy 0 <= pSolution < p1Zero')
  }

  const deltaP = p1Zero - pSolution
  return ((w2G * m1GPerMol) / w1G) * (p1Zero / deltaP)
}

export interface BoilingElevationInput {
  /** Ebullioscopic constant K_b (K kg mol⁻¹). */
  kb: number
  /** Molality of solute m (mol kg⁻¹). */
  molality: number
}

/** Boiling-point elevation ΔT_b = K_b · m (NCERT eq. 1.30). */
export function boilingPointElevation({ kb, molality }: BoilingElevationInput): number {
  if (!Number.isFinite(kb) || kb <= 0) {
    throw new RangeError('kb must be a finite positive number')
  }
  if (!Number.isFinite(molality) || molality < 0) {
    throw new RangeError('molality must be a finite non-negative number')
  }
  return kb * molality
}

export interface MolarMassBoilingInput {
  /** Ebullioscopic constant K_b (K kg mol⁻¹). */
  kb: number
  /** Mass of solute w₂ (g). */
  w2G: number
  /** Mass of solvent w₁ (g). */
  w1G: number
  /** Observed boiling-point elevation ΔT_b (K). */
  deltaTb: number
}

/**
 * Molar mass of a non-volatile solute from boiling-point elevation (NCERT eq. 1.33):
 * M₂ = (1000 · w₂ · K_b) / (ΔT_b · w₁)
 */
export function molarMassFromBoiling({
  kb,
  w2G,
  w1G,
  deltaTb,
}: MolarMassBoilingInput): number {
  if (!Number.isFinite(kb) || kb <= 0) {
    throw new RangeError('kb must be a finite positive number')
  }
  if (!Number.isFinite(w2G) || w2G <= 0) {
    throw new RangeError('w2G must be a finite positive number')
  }
  if (!Number.isFinite(w1G) || w1G <= 0) {
    throw new RangeError('w1G must be a finite positive number')
  }
  if (!Number.isFinite(deltaTb) || deltaTb <= 0) {
    throw new RangeError('deltaTb must be a finite positive number')
  }

  return (1000 * w2G * kb) / (deltaTb * w1G)
}

export interface FreezingDepressionInput {
  /** Cryoscopic constant K_f (K kg mol⁻¹). */
  kf: number
  /** Molality of solute m (mol kg⁻¹). */
  molality: number
}

/** Freezing-point depression ΔT_f = K_f · m (NCERT eq. 1.34). */
export function freezingPointDepression({ kf, molality }: FreezingDepressionInput): number {
  if (!Number.isFinite(kf) || kf <= 0) {
    throw new RangeError('kf must be a finite positive number')
  }
  if (!Number.isFinite(molality) || molality < 0) {
    throw new RangeError('molality must be a finite non-negative number')
  }
  return kf * molality
}

export interface MolarMassFreezingInput {
  /** Cryoscopic constant K_f (K kg mol⁻¹). */
  kf: number
  /** Mass of solute w₂ (g). */
  w2G: number
  /** Mass of solvent w₁ (g). */
  w1G: number
  /** Observed freezing-point depression ΔT_f (K). */
  deltaTf: number
}

/**
 * Molar mass of a non-volatile solute from freezing-point depression (NCERT eq. 1.36):
 * M₂ = (1000 · w₂ · K_f) / (ΔT_f · w₁)
 */
export function molarMassFromFreezing({
  kf,
  w2G,
  w1G,
  deltaTf,
}: MolarMassFreezingInput): number {
  if (!Number.isFinite(kf) || kf <= 0) {
    throw new RangeError('kf must be a finite positive number')
  }
  if (!Number.isFinite(w2G) || w2G <= 0) {
    throw new RangeError('w2G must be a finite positive number')
  }
  if (!Number.isFinite(w1G) || w1G <= 0) {
    throw new RangeError('w1G must be a finite positive number')
  }
  if (!Number.isFinite(deltaTf) || deltaTf <= 0) {
    throw new RangeError('deltaTf must be a finite positive number')
  }

  return (1000 * w2G * kf) / (deltaTf * w1G)
}

export interface KbFromEnthalpyInput {
  /** Solvent molar mass M₁ (g mol⁻¹). */
  molarMassGPerMol: number
  /** Pure solvent normal boiling point T_b⁰ (K). */
  tbK: number
  /** Molar enthalpy of vaporisation Δ_vap H (J mol⁻¹). */
  deltaHvapJPerMol: number
}

/**
 * Thermodynamic relation for the ebullioscopic constant K_b (NCERT eq. 1.38):
 * K_b = (R · M₁ · T_b²) / (1000 · Δ_vap H)
 */
export function kbFromEnthalpy({
  molarMassGPerMol,
  tbK,
  deltaHvapJPerMol,
}: KbFromEnthalpyInput): number {
  if (!Number.isFinite(molarMassGPerMol) || molarMassGPerMol <= 0) {
    throw new RangeError('molarMassGPerMol must be a finite positive number')
  }
  if (!Number.isFinite(tbK) || tbK <= 0) {
    throw new RangeError('tbK must be a finite positive number')
  }
  if (!Number.isFinite(deltaHvapJPerMol) || deltaHvapJPerMol <= 0) {
    throw new RangeError('deltaHvapJPerMol must be a finite positive number')
  }

  return (GAS_CONSTANT_J * molarMassGPerMol * tbK * tbK) / (1000 * deltaHvapJPerMol)
}

export interface KfFromEnthalpyInput {
  /** Solvent molar mass M₁ (g mol⁻¹). */
  molarMassGPerMol: number
  /** Pure solvent normal freezing point T_f⁰ (K). */
  tfK: number
  /** Molar enthalpy of fusion Δ_fus H (J mol⁻¹). */
  deltaHfusJPerMol: number
}

/**
 * Thermodynamic relation for the cryoscopic constant K_f (NCERT eq. 1.37):
 * K_f = (R · M₁ · T_f²) / (1000 · Δ_fus H)
 */
export function kfFromEnthalpy({
  molarMassGPerMol,
  tfK,
  deltaHfusJPerMol,
}: KfFromEnthalpyInput): number {
  if (!Number.isFinite(molarMassGPerMol) || molarMassGPerMol <= 0) {
    throw new RangeError('molarMassGPerMol must be a finite positive number')
  }
  if (!Number.isFinite(tfK) || tfK <= 0) {
    throw new RangeError('tfK must be a finite positive number')
  }
  if (!Number.isFinite(deltaHfusJPerMol) || deltaHfusJPerMol <= 0) {
    throw new RangeError('deltaHfusJPerMol must be a finite positive number')
  }

  return (GAS_CONSTANT_J * molarMassGPerMol * tfK * tfK) / (1000 * deltaHfusJPerMol)
}

/** Look up a solvent from NCERT Table 1.3 by id. */
export function getSolventConstant(id: string): SolventColligativeEntry {
  const entry = NCERT_SOLVENT_CONSTANTS.find((s) => s.id === id)
  if (!entry) {
    throw new RangeError(`Unknown solvent id: ${id}`)
  }
  return entry
}

export interface ThermalColligativeState {
  readonly solvent: SolventColligativeEntry
  readonly solute: NonElectrolyteSolute
  readonly molality: number
  /** Relative vapour-pressure lowering Δp₁ / p₁⁰ = x₂ (exact). */
  readonly rlvpExact: number
  /** Dilute approximation n₂ / n₁. */
  readonly rlvpDilute: number
  readonly deltaTb: number
  readonly solutionBoilingK: number
  readonly deltaTf: number
  readonly solutionFreezingK: number
  readonly pureLiquidRangeK: number
  readonly solutionLiquidRangeK: number
  /** Grams of solute dissolved per 1 kg of solvent. */
  readonly soluteMassGPerKgSolvent: number
}

/**
 * Compute the complete thermal colligative state for a dilute non-electrolyte
 * solution at a given molality in one of the NCERT Table 1.3 solvents.
 */
export function computeThermalColligativeState(
  solvent: SolventColligativeEntry,
  solute: NonElectrolyteSolute,
  molality: number
): ThermalColligativeState {
  const safeMolality = Math.max(0, molality)
  const nSolventPerKg = 1000 / solvent.molarMassGPerMol
  const rlvp = relativeLoweringVapourPressure({
    nSolute: safeMolality,
    nSolvent: nSolventPerKg,
  })
  const deltaTb = boilingPointElevation({ kb: solvent.kb, molality: safeMolality })
  const deltaTf = freezingPointDepression({ kf: solvent.kf, molality: safeMolality })
  const solutionBoilingK = solvent.boilingPointK + deltaTb
  const solutionFreezingK = solvent.freezingPointK - deltaTf
  const pureLiquidRangeK = solvent.boilingPointK - solvent.freezingPointK
  const solutionLiquidRangeK = solutionBoilingK - solutionFreezingK

  return {
    solvent,
    solute,
    molality: safeMolality,
    rlvpExact: rlvp.exact,
    rlvpDilute: rlvp.diluteApproximation,
    deltaTb,
    solutionBoilingK,
    deltaTf,
    solutionFreezingK,
    pureLiquidRangeK,
    solutionLiquidRangeK,
    soluteMassGPerKgSolvent: safeMolality * solute.molarMassGPerMol,
  }
}
