/**
 * Pure chemistry models and NCERT-grounded data helpers for Class 12 Unit 7 Section 7.5
 * ("Some Commercially Important Alcohols").
 *
 * All printed temperatures, pressures, boiling points, enzyme pathways, inhibition limits,
 * and denaturing agents are imported from `ncert-c12-unit7-data.ts`.
 */

import {
  NCERT_7_5_COMMERCIAL_ALCOHOLS,
  NCERT_COMMERCIAL_ALCOHOL_BP_K,
} from './ncert-c12-unit7-data'

export const COMMERCIAL_BPS = {
  methanolK: NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol,
  ethanolK: NCERT_COMMERCIAL_ALCOHOL_BP_K.ethanol,
  deltaK: NCERT_COMMERCIAL_ALCOHOL_BP_K.ethanol - NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol,
} as const

export const METHANOL_WINDOW = {
  pressureMinAtm: 50,
  pressureMaxAtm: 350,
  pressureStepAtm: 10,
  optimalPressureMinAtm: NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.pressureAtm[0],
  optimalPressureMaxAtm: NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.pressureAtm[1],
  defaultPressureAtm: 250,
  temperatureMinK: 350,
  temperatureMaxK: 750,
  temperatureStepK: 10,
  optimalTemperatureMinK: NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.temperatureK[0],
  optimalTemperatureMaxK: NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.temperatureK[1],
  defaultTemperatureK: 620,
} as const

export const FERMENTATION_LIMITS = {
  zymaseInhibitionPercent: NCERT_7_5_COMMERCIAL_ALCOHOLS.ethanol.zymaseInhibitionPercent,
  maxTheoreticalPercent: 18,
  gaugeMaxPercent: 20,
  airLeakOxidationFraction: 0.65,
} as const

export type MethanolCatalyst = 'none' | 'zno-cr2o3'

export interface MethanolReactorInput {
  catalyst: MethanolCatalyst
  pressureAtm: number
  temperatureK: number
}

export interface MethanolReactorResult {
  conversionPercent: number
  inOptimalPressure: boolean
  inOptimalTemperature: boolean
  isOptimal: boolean
  status: string
  diagnostic: string
  equation: string
  byProduct: string
  bpK: number
  uses: string
  safetyNote: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Evaluates catalytic hydrogenation of CO to methanol over ZnO-Cr2O3.
 * Peaks at 90-95% inside 200-300 atm and 573-673 K; drops steeply outside either window
 * and falls to 0% without the catalyst.
 */
export function evaluateMethanolReactor(input: MethanolReactorInput): MethanolReactorResult {
  const p = clamp(input.pressureAtm, METHANOL_WINDOW.pressureMinAtm, METHANOL_WINDOW.pressureMaxAtm)
  const t = clamp(input.temperatureK, METHANOL_WINDOW.temperatureMinK, METHANOL_WINDOW.temperatureMaxK)

  const inOptimalPressure =
    p >= METHANOL_WINDOW.optimalPressureMinAtm && p <= METHANOL_WINDOW.optimalPressureMaxAtm
  const inOptimalTemperature =
    t >= METHANOL_WINDOW.optimalTemperatureMinK && t <= METHANOL_WINDOW.optimalTemperatureMaxK

  const base = {
    inOptimalPressure,
    inOptimalTemperature,
    isOptimal: input.catalyst === 'zno-cr2o3' && inOptimalPressure && inOptimalTemperature,
    equation: 'CO(g) + 2 H₂(g) → CH₃OH(l)',
    byProduct: 'None (direct combination of 3 mol gas to 1 mol CH₃OH)',
    bpK: COMMERCIAL_BPS.methanolK,
    uses: 'Solvent in paints & varnishes; chiefly for making formaldehyde (HCHO)',
    safetyNote: 'Highly poisonous: oxidised in body to HCHO and HCOOH (blindness / death).',
  }

  if (input.catalyst === 'none') {
    return {
      ...base,
      conversionPercent: 0,
      status: 'Inactive, no catalyst',
      diagnostic: 'Without ZnO-Cr₂O₃, CO and H₂ do not hydrogenate at an appreciable rate.',
    }
  }

  // Pressure factor: 3 mol gas -> 1 mol product strongly favours 200-300 atm.
  let pFactor: number
  if (inOptimalPressure) {
    // 0.97 at 200 atm rising gently to 1.00 at 300 atm
    pFactor = 0.97 + 0.03 * ((p - 200) / 100)
  } else if (p < METHANOL_WINDOW.optimalPressureMinAtm) {
    const frac = (p - 50) / (200 - 50) // 0 at 50 atm, 1 at 200 atm
    pFactor = 0.22 + 0.68 * Math.pow(frac, 1.35)
  } else {
    // Above 300 atm: slight drop / mechanical over-compression penalty
    const over = (p - 300) / 50
    pFactor = 0.96 - 0.14 * over
  }

  // Temperature factor: below 573 K sluggish kinetics; above 673 K equilibrium reverses.
  let tFactor: number
  if (inOptimalTemperature) {
    // Peak near 623 K (1.00), >= 0.98 throughout 573-673 K
    const dist = Math.abs(t - 623) / 50
    tFactor = 1.0 - 0.02 * dist * dist
  } else if (t < METHANOL_WINDOW.optimalTemperatureMinK) {
    const frac = (t - 350) / (573 - 350)
    tFactor = 0.08 + 0.78 * Math.pow(frac, 1.8)
  } else {
    const over = (t - 673) / (750 - 673)
    tFactor = 0.92 - 0.36 * over
  }

  const conversionPercent = Math.round(clamp(95 * pFactor * tFactor, 0, 95))

  let status = 'Optimal window, high yield'
  let diagnostic = 'Both pressure (200-300 atm) and temperature (573-673 K) match the NCERT ZnO-Cr₂O₃ operating band.'

  if (!inOptimalPressure && !inOptimalTemperature) {
    status = 'Off-optimal P and T'
    diagnostic =
      p < 200
        ? 'Low pressure disfavours gas-mole contraction (3 mol → 1 mol) and temperature is outside 573-673 K.'
        : 'Pressure exceeds 300 atm and temperature is outside the 573-673 K band.'
  } else if (!inOptimalPressure) {
    status = p < 200 ? 'Low pressure, low yield' : 'Excess pressure, >300 atm'
    diagnostic =
      p < 200
        ? 'Increasing pressure toward 200-300 atm shifts equilibrium toward fewer gas moles (CH₃OH).'
        : 'Operating above 300 atm exceeds the NCERT 200-300 atm synthesis range.'
  } else if (!inOptimalTemperature) {
    status = t < 573 ? 'Too cool, sluggish rate' : 'Too hot, >673 K'
    diagnostic =
      t < 573
        ? 'Below 573 K, surface activation on ZnO-Cr₂O₃ is too slow for commercial output.'
        : 'Above 673 K, excessive heat opposes the exothermic hydrogenation equilibrium.'
  }

  return {
    ...base,
    conversionPercent,
    status,
    diagnostic,
  }
}

export type FermentationFeedstock = 'sucrose' | 'grape-juice'
export type FermentationSeal = 'anaerobic' | 'air-leak'

export interface FermentationInput {
  feedstock: FermentationFeedstock
  invertasePresent: boolean
  seal: FermentationSeal
  batchProgress: number
}

export interface FermentationResult {
  hexosesReady: boolean
  ethanolPercent: number
  ethanoicAcidPercent: number
  zymaseInhibited: boolean
  co2Rate: number
  zymaseStatus: string
  tasteStatus: string
  equation: string
  byProduct: string
  bpK: number
  diagnostic: string
}

/**
 * Evaluates two-enzyme ethanol fermentation (invertase + zymase), including the 14% inhibition
 * threshold and air-leak oxidation to ethanoic acid (CH3COOH).
 */
export function evaluateFermentation(input: FermentationInput): FermentationResult {
  const progress = clamp(input.batchProgress, 0, 100)
  const hexosesReady = input.feedstock === 'grape-juice' || input.invertasePresent
  const baseBp = COMMERCIAL_BPS.ethanolK

  if (!hexosesReady) {
    return {
      hexosesReady: false,
      ethanolPercent: 0,
      ethanoicAcidPercent: 0,
      zymaseInhibited: false,
      co2Rate: 0,
      zymaseStatus: 'Starved (No hexose sugars)',
      tasteStatus: 'Unfermented sugar syrup',
      equation: 'C₁₂H₂₂O₁₁ + H₂O —(No Invertase)→ No reaction',
      byProduct: 'No CO₂ evolved',
      bpK: baseBp,
      diagnostic: 'Zymase cannot ferment sucrose directly; invertase is needed first to hydrolyse sucrose into glucose and fructose.',
    }
  }

  const theoreticalPercent = (progress / 100) * FERMENTATION_LIMITS.maxTheoreticalPercent
  const rawFormed = Math.min(FERMENTATION_LIMITS.zymaseInhibitionPercent, theoreticalPercent)
  const zymaseInhibited =
    input.seal === 'anaerobic' && theoreticalPercent >= FERMENTATION_LIMITS.zymaseInhibitionPercent

  if (input.seal === 'air-leak') {
    const acidFormed = Number((rawFormed * FERMENTATION_LIMITS.airLeakOxidationFraction).toFixed(1))
    const remainingEthanol = Number((rawFormed - acidFormed).toFixed(1))
    return {
      hexosesReady: true,
      ethanolPercent: remainingEthanol,
      ethanoicAcidPercent: acidFormed,
      zymaseInhibited: false,
      co2Rate: progress > 0 ? 0.25 : 0,
      zymaseStatus: progress > 0 ? 'Disrupted by air (O₂ present)' : 'Ready (Seal open to air)',
      tasteStatus: progress > 0 ? 'Sour / Spoiled (Ethanoic acid)' : 'Exposed to air',
      equation: 'C₂H₅OH + O₂ → CH₃COOH + H₂O',
      byProduct: progress > 0 ? `CH₃COOH (${acidFormed}% acid formed)` : 'None yet',
      bpK: baseBp,
      diagnostic:
        progress > 0
          ? 'Oxygen from the air leak oxidises ethanol to ethanoic acid (CH₃COOH), spoiling the taste.'
          : 'With the seal open, any ethanol formed will be oxidised by air to ethanoic acid.',
    }
  }

  const ethanolPercent = Number(rawFormed.toFixed(1))
  const co2Rate = progress === 0 ? 0 : zymaseInhibited ? 0 : 0.4 + 0.6 * (progress / 80)

  let zymaseStatus = 'Active (Anaerobic)'
  let diagnostic = 'Zymase ferments glucose and fructose anaerobically to ethanol and CO₂ bubbles.'
  if (progress === 0) {
    zymaseStatus = 'Ready (0% progress)'
    diagnostic = 'Increase batch progress to observe anaerobic fermentation and CO₂ evolution.'
  } else if (zymaseInhibited) {
    zymaseStatus = 'Inhibited (>14%)'
    diagnostic =
      'Alcohol concentration has reached the 14% threshold; zymase is inhibited and fermentation stops.'
  }

  const eqPrefix =
    input.feedstock === 'sucrose'
      ? 'C₁₂H₂₂O₁₁ + H₂O →(Invertase) 2 C₆H₁₂O₆ →(Zymase) 4 C₂H₅OH + 4 CO₂'
      : 'C₆H₁₂O₆ —(Zymase, yeast)→ 2 C₂H₅OH + 2 CO₂'

  return {
    hexosesReady: true,
    ethanolPercent,
    ethanoicAcidPercent: 0,
    zymaseInhibited,
    co2Rate: clamp(co2Rate, 0, 1),
    zymaseStatus,
    tasteStatus: progress > 0 ? 'Fresh / Wine' : 'Unfermented must',
    equation: eqPrefix,
    byProduct:
      progress === 0
        ? 'No CO₂ evolved yet'
        : zymaseInhibited
          ? 'CO₂ evolution halted at 14% limit'
          : 'CO₂ gas escaping via one-way airlock',
    bpK: baseBp,
    diagnostic,
  }
}

export type CommercialAlcoholChoice = 'methanol' | 'ethanol'
export type EthanolRoute = 'fermentation' | 'ethene-hydration'

export interface PropertiesInput {
  alcohol: CommercialAlcoholChoice
  ethanolRoute: EthanolRoute
  hasCopperSulphate: boolean
  hasPyridine: boolean
}

export interface PropertiesResult {
  alcohol: CommercialAlcoholChoice
  name: string
  formula: string
  bpK: number
  equation: string
  byProduct: string
  liquidTint: 'clear' | 'blue'
  hasOdourVapour: boolean
  isDenatured: boolean
  isFullyDenatured: boolean
  safetyBadge: string
  toxicityNote: string
  uses: string
}

/**
 * Evaluates physical properties, production routes, physiological effects, and denaturation
 * status for commercial methanol and ethanol.
 */
export function evaluateDenaturationAndProperties(input: PropertiesInput): PropertiesResult {
  if (input.alcohol === 'methanol') {
    return {
      alcohol: 'methanol',
      name: 'Methanol',
      formula: 'CH₃OH',
      bpK: COMMERCIAL_BPS.methanolK,
      equation: 'CO + 2 H₂ —(ZnO-Cr₂O₃, 200-300 atm, 573-673 K)→ CH₃OH',
      byProduct: 'Body oxidises CH₃OH → HCHO → HCOOH',
      liquidTint: 'clear',
      hasOdourVapour: false,
      isDenatured: false,
      isFullyDenatured: false,
      safetyBadge: 'Severely Poisonous (Blindness / Death)',
      toxicityNote: 'Even small amounts cause blindness; larger amounts can cause death.',
      uses: 'Solvent in paints & varnishes; chiefly for making formaldehyde (HCHO)',
    }
  }

  const equation =
    input.ethanolRoute === 'fermentation'
      ? 'C₆H₁₂O₆ —(Zymase)→ 2 C₂H₅OH + 2 CO₂'
      : 'CH₂=CH₂ + H₂O —(H⁺, Sec. 7.4)→ CH₃CH₂OH'

  const byProduct =
    input.ethanolRoute === 'fermentation'
      ? 'CO₂ gas (from anaerobic fermentation)'
      : 'None (direct acid-catalysed alkene hydration)'

  const isFullyDenatured = input.hasCopperSulphate && input.hasPyridine
  const isDenatured = input.hasCopperSulphate || input.hasPyridine

  let safetyBadge = 'Pure Ethanol (Unmarked — CNS Depressant)'
  if (isFullyDenatured) {
    safetyBadge = 'Denatured Alcohol: Unfit for Drinking'
  } else if (input.hasCopperSulphate) {
    safetyBadge = 'Coloured Blue (Add Pyridine for Full Denaturation)'
  } else if (input.hasPyridine) {
    safetyBadge = 'Foul Odour Added (Add CuSO₄ for Full Denaturation)'
  }

  return {
    alcohol: 'ethanol',
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    bpK: COMMERCIAL_BPS.ethanolK,
    equation,
    byProduct,
    liquidTint: input.hasCopperSulphate ? 'blue' : 'clear',
    hasOdourVapour: input.hasPyridine,
    isDenatured,
    isFullyDenatured,
    safetyBadge,
    toxicityNote:
      'Acts on central nervous system (impairs judgment, causes nausea/unconsciousness, can stop breathing).',
    uses: 'Solvent in paint industry and feedstock for preparing carbon compounds',
  }
}
