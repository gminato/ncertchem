/**
 * Quantitative concentration measures for solutions (Class 12, Unit 1, Section 1.2).
 * Covers all seven NCERT concentration expressions plus temperature-dependent
 * thermal expansion of aqueous solutions so molarity M(T) can be contrasted
 * directly against temperature-invariant mass-based scales (mass %, ppm, x, m).
 */

export const WATER_MOLAR_MASS_G_PER_MOL = 18.015;
export const WATER_DENSITY_25C_G_PER_ML = 0.99705;
export const REFERENCE_TEMP_C = 25;
/** Volumetric thermal expansion coefficient of water around 25 °C (K^-1). */
export const WATER_THERMAL_EXPANSION_PER_K = 0.000257;

export type SolutePresetId =
  | 'ethanol'
  | 'glucose'
  | 'urea'
  | 'naoh'
  | 'ethylene-glycol'
  | 'ki';

export interface SolutePreset {
  id: SolutePresetId;
  name: string;
  formula: string;
  molarMassGPerMol: number;
  /** Effective apparent density in aqueous solution at 25 °C (g mL^-1). */
  apparentDensityGPerMl: number;
  defaultSoluteMassG: number;
  defaultSolventMassG: number;
}

export const SOLUTE_PRESETS: Record<SolutePresetId, SolutePreset> = {
  ethanol: {
    id: 'ethanol',
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    molarMassGPerMol: 46.07,
    apparentDensityGPerMl: 0.789,
    defaultSoluteMassG: 23,
    defaultSolventMassG: 250,
  },
  glucose: {
    id: 'glucose',
    name: 'Glucose',
    formula: 'C₆H₁₂O₆',
    molarMassGPerMol: 180.16,
    apparentDensityGPerMl: 1.58,
    defaultSoluteMassG: 45,
    defaultSolventMassG: 250,
  },
  urea: {
    id: 'urea',
    name: 'Urea',
    formula: 'NH₂CONH₂',
    molarMassGPerMol: 60.06,
    apparentDensityGPerMl: 1.34,
    defaultSoluteMassG: 30,
    defaultSolventMassG: 250,
  },
  naoh: {
    id: 'naoh',
    name: 'Sodium hydroxide',
    formula: 'NaOH',
    molarMassGPerMol: 40.0,
    apparentDensityGPerMl: 2.45,
    defaultSoluteMassG: 20,
    defaultSolventMassG: 250,
  },
  'ethylene-glycol': {
    id: 'ethylene-glycol',
    name: 'Ethylene glycol',
    formula: 'C₂H₆O₂',
    molarMassGPerMol: 62.07,
    apparentDensityGPerMl: 1.113,
    defaultSoluteMassG: 31,
    defaultSolventMassG: 250,
  },
  ki: {
    id: 'ki',
    name: 'Potassium iodide',
    formula: 'KI',
    molarMassGPerMol: 166.0,
    apparentDensityGPerMl: 4.1,
    defaultSoluteMassG: 40,
    defaultSolventMassG: 250,
  },
};

export const CONVERTER_PRESET_IDS: readonly SolutePresetId[] = [
  'ethanol',
  'glucose',
  'urea',
  'naoh',
] as const;

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number`);
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number`);
  }
}

/** (i) Mass percentage (w/w): (mass of solute / total mass of solution) × 100. */
export function massPercent(soluteG: number, solutionG: number): number {
  assertNonNegative(soluteG, 'soluteG');
  assertPositive(solutionG, 'solutionG');
  return (soluteG / solutionG) * 100;
}

/** (ii) Volume percentage (V/V): (volume of solute / total volume of solution) × 100. */
export function volumePercent(soluteMl: number, solutionMl: number): number {
  assertNonNegative(soluteMl, 'soluteMl');
  assertPositive(solutionMl, 'solutionMl');
  return (soluteMl / solutionMl) * 100;
}

/** (iii) Mass by volume percentage (w/V): mass of solute (g) per 100 mL of solution. */
export function massByVolumePercent(soluteG: number, solutionMl: number): number {
  assertNonNegative(soluteG, 'soluteG');
  assertPositive(solutionMl, 'solutionMl');
  return (soluteG / solutionMl) * 100;
}

/** (iv) Parts per million (ppm): (parts of component / total parts) × 10^6. */
export function partsPerMillion(solutePart: number, totalPart: number): number {
  assertNonNegative(solutePart, 'solutePart');
  assertPositive(totalPart, 'totalPart');
  return (solutePart / totalPart) * 1e6;
}

/** (v) Mole fractions for an arbitrary multi-component solution; always sums to 1. */
export function moleFractions(molesList: readonly number[]): number[] {
  if (molesList.length === 0) {
    throw new RangeError('molesList must contain at least one component');
  }
  let total = 0;
  for (let i = 0; i < molesList.length; i += 1) {
    assertNonNegative(molesList[i], `molesList[${i}]`);
    total += molesList[i];
  }
  assertPositive(total, 'total moles');
  return molesList.map((n) => n / total);
}

/** (vi) Molarity M (mol L^-1): moles of solute per litre of solution. */
export function molarityFromMass(
  soluteG: number,
  molarMassGPerMol: number,
  solutionVolumeL: number,
): number {
  assertNonNegative(soluteG, 'soluteG');
  assertPositive(molarMassGPerMol, 'molarMassGPerMol');
  assertPositive(solutionVolumeL, 'solutionVolumeL');
  return soluteG / molarMassGPerMol / solutionVolumeL;
}

/** (vii) Molality m (mol kg^-1): moles of solute per kilogram of solvent. */
export function molalityFromMass(
  soluteG: number,
  molarMassGPerMol: number,
  solventMassKg: number,
): number {
  assertNonNegative(soluteG, 'soluteG');
  assertPositive(molarMassGPerMol, 'molarMassGPerMol');
  assertPositive(solventMassKg, 'solventMassKg');
  return soluteG / molarMassGPerMol / solventMassKg;
}

/**
 * Estimates aqueous solution density at 25 °C (g mL^-1) using an additive
 * apparent-volume model between solute and water.
 */
export function estimateAqueousDensity25(
  soluteMassG: number,
  solventMassG: number,
  apparentSoluteDensityGPerMl: number,
): number {
  assertNonNegative(soluteMassG, 'soluteMassG');
  assertPositive(solventMassG, 'solventMassG');
  assertPositive(apparentSoluteDensityGPerMl, 'apparentSoluteDensityGPerMl');
  const totalMassG = soluteMassG + solventMassG;
  const approxVolMl =
    soluteMassG / apparentSoluteDensityGPerMl +
    solventMassG / WATER_DENSITY_25C_G_PER_ML;
  return totalMassG / approxVolMl;
}

export interface ConvertAllMeasuresInput {
  soluteMassG: number;
  solventMassG: number;
  soluteMolarMass: number;
  solventMolarMass?: number;
  densityGPerMl?: number;
  tempC?: number;
}

export interface ConcentrationMeasures {
  soluteMassG: number;
  solventMassG: number;
  solutionMassG: number;
  soluteMoles: number;
  solventMoles: number;
  totalMoles: number;
  tempC: number;
  expansionFactor: number;
  densityAt25GPerMl: number;
  densityAtTempGPerMl: number;
  volumeAt25Ml: number;
  volumeAtTempMl: number;
  volumeAtTempL: number;
  /** Mass % (w/w) — temperature-independent. */
  massPercent: number;
  /** Mass by volume % (w/V) — depends on temperature via V(T). */
  massByVolumePercent: number;
  /** Mass-based parts per million (ppm) — temperature-independent. */
  ppm: number;
  /** Solute mole fraction x_2 — temperature-independent. */
  moleFractionSolute: number;
  /** Solvent mole fraction x_1 — temperature-independent. */
  moleFractionSolvent: number;
  /** Molality m (mol kg^-1) — temperature-independent. */
  molality: number;
  /** Molarity M(T) (mol L^-1) — depends on temperature via V(T). */
  molarity: number;
  /** Reference molarity M(25 °C) (mol L^-1). */
  molarityAt25: number;
}

/**
 * Computes all concentration measures simultaneously for a binary solution,
 * applying linear volumetric thermal expansion around 25 °C (β = 0.000257 K^-1)
 * so volume-based measures (M, w/V %) shift with temperature while mass-based
 * measures (mass %, ppm, x, m) stay strictly invariant.
 */
export function convertAllMeasures(
  input: ConvertAllMeasuresInput,
): ConcentrationMeasures {
  const {
    soluteMassG,
    solventMassG,
    soluteMolarMass,
    solventMolarMass = WATER_MOLAR_MASS_G_PER_MOL,
    densityGPerMl = WATER_DENSITY_25C_G_PER_ML,
    tempC = REFERENCE_TEMP_C,
  } = input;

  assertNonNegative(soluteMassG, 'soluteMassG');
  assertPositive(solventMassG, 'solventMassG');
  assertPositive(soluteMolarMass, 'soluteMolarMass');
  assertPositive(solventMolarMass, 'solventMolarMass');
  assertPositive(densityGPerMl, 'densityGPerMl');
  if (!Number.isFinite(tempC)) {
    throw new RangeError('tempC must be a finite number');
  }

  const solutionMassG = soluteMassG + solventMassG;
  const soluteMoles = soluteMassG / soluteMolarMass;
  const solventMoles = solventMassG / solventMolarMass;
  const totalMoles = soluteMoles + solventMoles;

  const [xSolute, xSolvent] = moleFractions([soluteMoles, solventMoles]);

  const expansionFactor = 1 + WATER_THERMAL_EXPANSION_PER_K * (tempC - REFERENCE_TEMP_C);
  if (expansionFactor <= 0) {
    throw new RangeError('Temperature produces non-positive expansion factor');
  }

  const volumeAt25Ml = solutionMassG / densityGPerMl;
  const volumeAtTempMl = volumeAt25Ml * expansionFactor;
  const volumeAtTempL = volumeAtTempMl / 1000;
  const densityAtTempGPerMl = densityGPerMl / expansionFactor;

  const wPercent = massPercent(soluteMassG, solutionMassG);
  const wvPercent = massByVolumePercent(soluteMassG, volumeAtTempMl);
  const ppmVal = partsPerMillion(soluteMassG, solutionMassG);
  const mVal = molalityFromMass(soluteMassG, soluteMolarMass, solventMassG / 1000);
  const m25Val = molarityFromMass(soluteMassG, soluteMolarMass, volumeAt25Ml / 1000);
  const mTempVal = molarityFromMass(soluteMassG, soluteMolarMass, volumeAtTempL);

  return {
    soluteMassG,
    solventMassG,
    solutionMassG,
    soluteMoles,
    solventMoles,
    totalMoles,
    tempC,
    expansionFactor,
    densityAt25GPerMl: densityGPerMl,
    densityAtTempGPerMl,
    volumeAt25Ml,
    volumeAtTempMl,
    volumeAtTempL,
    massPercent: wPercent,
    massByVolumePercent: wvPercent,
    ppm: ppmVal,
    moleFractionSolute: xSolute,
    moleFractionSolvent: xSolvent,
    molality: mVal,
    molarity: mTempVal,
    molarityAt25: m25Val,
  };
}
