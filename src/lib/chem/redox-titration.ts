/**
 * Redox titration stoichiometry, equivalence calculations, and indicator state tracking
 * based on NCERT Class 11 Part II Unit 7 (Section 7.3.3: Redox Reactions as the Basis for Titrations).
 */

/** Supported standard NCERT redox titration types. */
export type RedoxTitrationType =
  | 'permanganate-fe'
  | 'permanganate-oxalate'
  | 'dichromate-fe'
  | 'iodometric-cu-thiosulphate'

/** Stoichiometric specification for a redox titration reaction. */
export interface RedoxTitrationStoichiometry {
  /** Chemical formula of the titrant species (in burette). */
  readonly titrant: string
  /** Chemical formula of the analyte species (in conical flask). */
  readonly analyte: string
  /** Moles of titrant required per mole of analyte (n_titrant / n_analyte). */
  readonly titrantPerAnalyteRatio: number
  /** LaTeX mhchem equation for the primary redox reaction. */
  readonly equation: string
  /** Type or name of indicator employed. */
  readonly indicator: string
}

/**
 * NCERT Section 7.3.3 titration stoichiometries:
 * 1. Permanganate–Fe2+ (1 : 5, self-indicator)
 * 2. Permanganate–oxalate (2 : 5, self-indicator)
 * 3. Dichromate–Fe2+ (1 : 6, diphenylamine internal redox indicator)
 * 4. Iodometric Cu2+ with thiosulphate (net 1 : 1, starch indicator)
 */
export const REDOX_TITRATIONS: Record<RedoxTitrationType, RedoxTitrationStoichiometry> = {
  'permanganate-fe': {
    titrant: 'MnO4-',
    analyte: 'Fe2+',
    titrantPerAnalyteRatio: 1 / 5,
    equation: '\\ce{MnO4- + 5Fe^{2+} + 8H+ -> Mn^{2+} + 5Fe^{3+} + 4H2O}',
    indicator: 'self (MnO4-)',
  },
  'permanganate-oxalate': {
    titrant: 'MnO4-',
    analyte: 'C2O4^2-',
    titrantPerAnalyteRatio: 2 / 5,
    equation: '\\ce{2MnO4- + 5C2O4^{2-} + 16H+ -> 2Mn^{2+} + 10CO2 + 8H2O}',
    indicator: 'self (MnO4-)',
  },
  'dichromate-fe': {
    titrant: 'Cr2O7^2-',
    analyte: 'Fe2+',
    titrantPerAnalyteRatio: 1 / 6,
    equation: '\\ce{Cr2O7^{2-} + 6Fe^{2+} + 14H+ -> 2Cr^{3+} + 6Fe^{3+} + 7H2O}',
    indicator: 'diphenylamine',
  },
  'iodometric-cu-thiosulphate': {
    titrant: 'S2O3^2-',
    analyte: 'Cu2+',
    titrantPerAnalyteRatio: 1.0,
    equation:
      '\\ce{2Cu^{2+} + 4I- -> Cu2I2(s) + I2}; \\ce{I2 + 2S2O3^{2-} -> 2I- + S4O6^{2-}}',
    indicator: 'starch',
  },
}

/** Parameters required to compute titration state from concentrations. */
export interface TitrationParams {
  /** Titration reaction type. */
  titrationType: RedoxTitrationType
  /** Molarity of titrant in mol / L. */
  titrantMolarity: number
  /** Molarity of analyte in mol / L. */
  analyteMolarity: number
  /** Initial volume of analyte solution in mL. */
  analyteVolumeMl: number
}

/** Instantaneous state of a redox titration. */
export interface TitrationState {
  /** Volume of titrant added so far in mL. */
  addedMl: number
  /** Equivalence volume of titrant in mL. */
  equivalenceVolumeMl: number
  /** Progress fraction (addedMl / equivalenceVolumeMl). */
  progressFraction: number
  /** True when added volume is strictly less than equivalence volume. */
  isBeforeEquivalence: boolean
  /** True when added volume is within experimental tolerance of equivalence point. */
  isAtEquivalence: boolean
  /** True when added volume is strictly past equivalence volume. */
  isPastEquivalence: boolean
  /** Moles of unreacted analyte remaining. */
  remainingAnalyteMoles: number
  /** Moles of excess titrant present in solution past equivalence. */
  excessTitrantMoles: number
  /** Visual indicator color / appearance. */
  indicatorColor: string
  /** Human-readable explanation of current state. */
  description: string
}

/**
 * Calculates the stoichiometric equivalence volume in mL for a redox titration.
 *
 * @param titrantMolarity Concentration of titrant solution (M or mol/L).
 * @param analyteMolarity Concentration of analyte solution (M or mol/L).
 * @param analyteVolumeMl Volume of analyte solution in conical flask (mL).
 * @param titrationTypeOrRatio Either a recognised RedoxTitrationType or a custom molar ratio (n_titrant / n_analyte).
 * @returns Equivalence volume in mL.
 * @throws RangeError if concentrations or volumes are non-positive or titration type is invalid.
 */
export function equivalenceVolume(
  titrantMolarity: number,
  analyteMolarity: number,
  analyteVolumeMl: number,
  titrationTypeOrRatio: RedoxTitrationType | number,
): number {
  if (titrantMolarity <= 0) {
    throw new RangeError(`Titrant molarity must be positive; got ${titrantMolarity}`)
  }
  if (analyteMolarity <= 0) {
    throw new RangeError(`Analyte molarity must be positive; got ${analyteMolarity}`)
  }
  if (analyteVolumeMl <= 0) {
    throw new RangeError(`Analyte volume must be positive; got ${analyteVolumeMl}`)
  }

  let ratio: number
  if (typeof titrationTypeOrRatio === 'number') {
    if (titrationTypeOrRatio <= 0) {
      throw new RangeError(`Titrant-to-analyte ratio must be positive; got ${titrationTypeOrRatio}`)
    }
    ratio = titrationTypeOrRatio
  } else {
    const entry = REDOX_TITRATIONS[titrationTypeOrRatio]
    if (!entry) {
      throw new RangeError(`Unknown redox titration type: "${titrationTypeOrRatio}"`)
    }
    ratio = entry.titrantPerAnalyteRatio
  }

  const analyteMoles = (analyteMolarity * analyteVolumeMl) / 1000
  const requiredTitrantMoles = analyteMoles * ratio
  return (requiredTitrantMoles / titrantMolarity) * 1000
}

/**
 * Helper to determine indicator color based on titration type and stage.
 */
const SUPERSCRIPT_DIGITS: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }

/** An amount in mol written for students: "2.50 × 10⁻⁴ mol", never "2.500e-4". */
function formatMoles(mol: number): string {
  if (mol === 0) return '0 mol'
  const [mantissa, exponent] = mol.toExponential(2).split('e')
  const sup = String(Number(exponent)).split('').map((c) => SUPERSCRIPT_DIGITS[c] ?? c).join('')
  return Number(exponent) === 0 ? `${mantissa} mol` : `${mantissa} × 10${sup} mol`
}

function getIndicatorColor(
  type: RedoxTitrationType,
  isBefore: boolean,
  isAt: boolean,
  _isPast: boolean,
  progress: number,
): string {
  switch (type) {
    case 'permanganate-fe':
    case 'permanganate-oxalate':
      // KMnO4 is self-indicating: colourless before end point, first lasting faint pink at/after
      return isBefore ? 'colourless' : 'first lasting pink'

    case 'dichromate-fe':
      // Diphenylamine: nearly colourless at the start (a trace of Fe2+ green), turning green as
      // Cr3+ forms during the titration; intense diphenylamine blue at/after the end point.
      if (!isBefore) return 'diphenylamine blue'
      return progress < 0.05 ? 'nearly colourless' : 'green'

    case 'iodometric-cu-thiosulphate':
      // Iodine (as I3-) is brown at first and fades to pale yellow as thiosulphate removes it.
      // Starch is added near the end (pale yellow) and gives blue-black, which disappears at the
      // end point. This model assumes starch is added at 75% of the equivalence volume.
      if (!isBefore) return 'colourless'
      return progress < 0.75 ? 'iodine brown' : 'starch blue'
  }
}

/**
 * Evaluates the instantaneous chemical and visual state of a redox titration.
 *
 * Supports two signatures:
 * 1. Detailed: `titrationState(addedMl, params)`
 * 2. Simplified: `titrationState(addedMl, equivalenceVolumeMl, titrationType, initialAnalyteMoles?)`
 *
 * @param addedMl Volume of titrant added in mL.
 * @param arg2 TitrationParams object OR equivalenceVolumeMl number.
 * @param arg3 Optional titrationType if arg2 was a number.
 * @param arg4 Optional initialAnalyteMoles if arg2 was a number.
 * @returns TitrationState object.
 * @throws RangeError if addedMl is negative or equivalence volume is non-positive.
 */
export function titrationState(
  addedMl: number,
  arg2: TitrationParams | number,
  arg3?: RedoxTitrationType,
  arg4?: number,
): TitrationState {
  if (addedMl < 0) {
    throw new RangeError(`Added titrant volume cannot be negative; got ${addedMl}`)
  }

  let eqVol: number
  let type: RedoxTitrationType
  let initialAnalyteMoles: number
  let titrantMolarity: number

  if (typeof arg2 === 'object') {
    const params = arg2
    eqVol = equivalenceVolume(
      params.titrantMolarity,
      params.analyteMolarity,
      params.analyteVolumeMl,
      params.titrationType,
    )
    type = params.titrationType
    initialAnalyteMoles = (params.analyteMolarity * params.analyteVolumeMl) / 1000
    titrantMolarity = params.titrantMolarity
  } else {
    eqVol = arg2
    if (eqVol <= 0) {
      throw new RangeError(`Equivalence volume must be positive; got ${eqVol}`)
    }
    if (!arg3 || !REDOX_TITRATIONS[arg3]) {
      throw new RangeError(`Invalid redox titration type: "${arg3}"`)
    }
    type = arg3
    initialAnalyteMoles = arg4 ?? 1.0
    const ratio = REDOX_TITRATIONS[type].titrantPerAnalyteRatio
    const eqTitrantMoles = initialAnalyteMoles * ratio
    titrantMolarity = (eqTitrantMoles / eqVol) * 1000
  }

  const EPSILON = 1e-6
  const progressFraction = addedMl / eqVol
  const isAtEquivalence = Math.abs(addedMl - eqVol) <= EPSILON
  const isBeforeEquivalence = !isAtEquivalence && addedMl < eqVol
  const isPastEquivalence = !isAtEquivalence && addedMl > eqVol

  let remainingAnalyteMoles = 0
  let excessTitrantMoles = 0

  if (isBeforeEquivalence) {
    const consumed = (addedMl / eqVol) * initialAnalyteMoles
    remainingAnalyteMoles = Math.max(0, initialAnalyteMoles - consumed)
  } else if (isPastEquivalence) {
    const excessVolMl = addedMl - eqVol
    excessTitrantMoles = (excessVolMl * titrantMolarity) / 1000
  }

  const indicatorColor = getIndicatorColor(
    type,
    isBeforeEquivalence,
    isAtEquivalence,
    isPastEquivalence,
    addedMl / eqVol,
  )

  let description: string
  if (isBeforeEquivalence) {
    description = `Titration in progress (${(progressFraction * 100).toFixed(1)}% of equivalence). Remaining analyte: ${formatMoles(remainingAnalyteMoles)}. Indicator: ${indicatorColor}.`
  } else if (isAtEquivalence) {
    description = `Stoichiometric equivalence point reached (${eqVol.toFixed(2)} mL). All analyte consumed. Indicator: ${indicatorColor}.`
  } else {
    description = `Past equivalence point (${(progressFraction * 100).toFixed(1)}%). Excess titrant: ${formatMoles(excessTitrantMoles)}. Indicator: ${indicatorColor}.`
  }

  return {
    addedMl,
    equivalenceVolumeMl: eqVol,
    progressFraction,
    isBeforeEquivalence,
    isAtEquivalence,
    isPastEquivalence,
    remainingAnalyteMoles,
    excessTitrantMoles,
    indicatorColor,
    description,
  }
}
