/**
 * Percentage composition of organic compounds by the NCERT Class 11 Unit 8 methods (Section 8.10).
 * Every function returns a percentage by mass and checks that the sample mass is positive.
 */

function checkMass(mass: number): void {
  if (!(mass > 0)) {
    throw new RangeError('Sample mass must be positive')
  }
}

/**
 * Carbon by Liebig's method (NCERT 8.10.1): %C = 12 x m2 x 100 / (44 x m), where m2 is the mass of
 * CO2 formed and m the mass of the sample.
 */
export function percentCarbon(mCO2: number, mSample: number): number {
  checkMass(mSample)
  return (12 * mCO2 * 100) / (44 * mSample)
}

/**
 * Hydrogen by Liebig's method (NCERT 8.10.1): %H = 2 x m1 x 100 / (18 x m), where m1 is the mass
 * of H2O formed.
 */
export function percentHydrogen(mH2O: number, mSample: number): number {
  checkMass(mSample)
  return (2 * mH2O * 100) / (18 * mSample)
}

/** Standard molar volume of an ideal gas at STP in mL, the basis of NCERT's 22400 mL. */
const MOLAR_VOLUME_STP_ML = 22400

/** Nitrogen mass per mole of N2, 28 g. */
const N2_MOLAR_MASS = 28

/**
 * Nitrogen by Dumas' method from a volume already at STP (NCERT 8.10.2): %N = 28 V x 100 /
 * (22400 x m), with V in mL.
 */
export function percentNitrogenDumasAtSTP(vSTPml: number, mSample: number): number {
  checkMass(mSample)
  return (N2_MOLAR_MASS * vSTPml * 100) / (MOLAR_VOLUME_STP_ML * mSample)
}

/**
 * Nitrogen by Dumas' method from a measured volume (NCERT 8.10.2): the gas is collected over
 * potassium hydroxide, so the pressure of the nitrogen is p1 = p - aqueous tension. The volume at
 * STP is V1 x p1 x 273 / (760 x T) and %N = 28 V x 100 / (22400 x m).
 */
export function percentNitrogenDumas(input: {
  volumeMl: number
  temperatureK: number
  pressureMmHg: number
  aqueousTensionMmHg: number
  sampleMass: number
}): number {
  const { volumeMl, temperatureK, pressureMmHg, aqueousTensionMmHg, sampleMass } = input
  checkMass(sampleMass)
  const p1 = pressureMmHg - aqueousTensionMmHg
  if (!(p1 > 0) || !(temperatureK > 0)) {
    throw new RangeError('Nitrogen pressure (p - aqueous tension) and temperature must be positive')
  }
  const vSTP = (p1 * volumeMl * 273) / (760 * temperatureK)
  return percentNitrogenDumasAtSTP(vSTP, sampleMass)
}

/**
 * Nitrogen by Kjeldahl's method (NCERT 8.10.2 (ii)). The acid absorbs the ammonia, and the excess
 * acid is titrated with alkali of the same molarity M. NH3 absorbed is 2 (V - V1/2) mL of molarity
 * M, so grams of N = 14 x M x 2 (V - V1/2) / 1000 and %N = 14 M 2 (V - V1/2) x 100 / (1000 m).
 * The form used by NCERT assumes the acid and the alkali have the same molarity.
 *
 * @param input.volumeAcid V, mL of acid taken (NCERT's V)
 * @param input.volumeAlkali V1, mL of alkali used in the back titration (0 when none is used)
 */
export function percentNitrogenKjeldahl(input: {
  molarity: number
  volumeAcid: number
  volumeAlkali: number
  sampleMass: number
}): number {
  const { molarity, volumeAcid, volumeAlkali, sampleMass } = input
  checkMass(sampleMass)
  const acidConsumed = volumeAcid - volumeAlkali / 2
  if (acidConsumed < 0) {
    throw new RangeError('Alkali volume cannot exceed twice the acid volume')
  }
  const gramsN = (14 * molarity * 2 * acidConsumed) / 1000
  return (gramsN * 100) / sampleMass
}

/**
 * Halogen by Carius' method (NCERT 8.10.3): %X = atomic mass of X x m1 x 100 / (molar mass of AgX
 * x m), where m1 is the mass of AgX formed.
 */
export function percentHalogen(input: { massAgX: number; atomicMassX: number; sampleMass: number }): number {
  const { massAgX, atomicMassX, sampleMass } = input
  checkMass(sampleMass)
  const molarMassAgX = 108 + atomicMassX
  return (atomicMassX * massAgX * 100) / (molarMassAgX * sampleMass)
}

/** Sulphur by Carius' method (NCERT 8.10.4): %S = 32 x m1 x 100 / (233 x m), m1 the mass of BaSO4. */
export function percentSulphur(mBaSO4: number, mSample: number): number {
  checkMass(mSample)
  return (32 * mBaSO4 * 100) / (233 * mSample)
}

/**
 * Phosphorus as ammonium phosphomolybdate (NCERT 8.10.5): %P = 31 x m1 x 100 / (1877 x m), with
 * 1877 the molar mass of (NH4)3PO4.12MoO3.
 */
export function percentPhosphorusAmmoniumMolybdate(mPrecipitate: number, mSample: number): number {
  checkMass(mSample)
  return (31 * mPrecipitate * 100) / (1877 * mSample)
}

/**
 * Phosphorus as Mg2P2O7 (NCERT 8.10.5): %P = 62 x m1 x 100 / (222 x m), with 222 the molar mass of
 * Mg2P2O7 and 62 the mass of the two phosphorus atoms in it.
 */
export function percentPhosphorusMgPyrophosphate(mMg2P2O7: number, mSample: number): number {
  checkMass(mSample)
  return (62 * mMg2P2O7 * 100) / (222 * mSample)
}

/**
 * Oxygen from the CO2 formed when the oxygen is converted to carbon dioxide (NCERT 8.10.6):
 * %O = 32 x m1 x 100 / (88 x m), where m1 is the mass of CO2.
 */
export function percentOxygenFromCO2(mCO2: number, mSample: number): number {
  checkMass(mSample)
  return (32 * mCO2 * 100) / (88 * mSample)
}

/** Oxygen by difference (NCERT 8.10.6): 100 minus the percentages of all other elements. */
export function percentOxygenByDifference(others: Record<string, number>): number {
  const total = Object.values(others).reduce((sum, value) => sum + value, 0)
  return 100 - total
}
