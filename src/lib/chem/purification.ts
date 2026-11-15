/**
 * Purification models for NCERT Class 11 Unit 8 (Section 8.8): chromatographic Rf, fractional
 * distillation of an ideal binary mixture, theoretical plates, steam distillation, distillation
 * under reduced pressure and differential extraction.
 *
 * Antoine constants (log10 P/mmHg = A - B / (C + T/°C)) are the NIST values for benzene and
 * toluene (valid about 6 to 136 °C) and for water (100 to 374 °C).
 */

/** Antoine constants, pressure in mmHg and temperature in °C. */
export interface Antoine {
  name: string
  A: number
  B: number
  C: number
}

/** Benzene, Antoine constants A = 6.90565, B = 1211.033, C = 220.79 (mmHg, °C). */
export const BENZENE_ANTOINE: Antoine = { name: 'benzene', A: 6.90565, B: 1211.033, C: 220.79 }

/** Toluene, Antoine constants A = 6.95464, B = 1344.8, C = 219.482 (mmHg, °C). */
export const TOLUENE_ANTOINE: Antoine = { name: 'toluene', A: 6.95464, B: 1344.8, C: 219.482 }

/** Water above 100 °C, Antoine constants A = 8.14019, B = 1810.94, C = 244.485 (mmHg, °C). */
export const WATER_ANTOINE_HIGH: Antoine = { name: 'water', A: 8.14019, B: 1810.94, C: 244.485 }

/** Vapour pressure in mmHg of a liquid at a temperature in °C. */
function vapourPressure(liquid: Antoine, tC: number): number {
  return 10 ** (liquid.A - liquid.B / (liquid.C + tC))
}

/** Solves f(t) = 0 for t in [lo, hi] by bisection, where f decreases with t. */
function bisect(f: (t: number) => number, lo: number, hi: number): number {
  let a = lo
  let b = hi
  for (let k = 0; k < 200; k++) {
    const mid = (a + b) / 2
    if (f(mid) > 0) {
      a = mid
    } else {
      b = mid
    }
  }
  return (a + b) / 2
}

/**
 * Rf value in paper or thin-layer chromatography (NCERT 8.8.5): distance moved by the spot over
 * distance moved by the solvent front.
 *
 * @throws {RangeError} If the distances are not positive, or the spot is beyond the solvent front
 */
export function rf(distanceSpot: number, distanceSolvent: number): number {
  if (!(distanceSolvent > 0) || !(distanceSpot > 0)) {
    throw new RangeError('Distances must be positive')
  }
  if (distanceSpot > distanceSolvent) {
    throw new RangeError('The spot cannot move further than the solvent front')
  }
  return distanceSpot / distanceSolvent
}

/** Result of distilling an ideal binary mixture at one composition. */
export interface DistillationPoint {
  /** Boiling point of the mixture at 760 mmHg, in °C. */
  boilingPointC: number
  /** Boiling point of the mixture at 760 mmHg, in K. */
  boilingPointK: number
  /** Mole fraction of liquid A in the vapour that first comes off. */
  vapourFractionA: number
}

/**
 * Boiling point and vapour composition of an ideal (Raoult's law) binary mixture at 760 mmHg
 * (NCERT 8.8.3). P = x_A P_A + (1 - x_A) P_B; the vapour has y_A = x_A P_A / P.
 *
 * @param x mole fraction of liquid A in the liquid, 0 to 1
 * @throws {RangeError} If x is outside 0 to 1
 */
export function fractionalDistillation(liquidA: Antoine, liquidB: Antoine, x: number): DistillationPoint {
  if (!(x >= 0 && x <= 1)) {
    throw new RangeError('Mole fraction must be between 0 and 1')
  }
  const total = (t: number): number => {
    const pA = vapourPressure(liquidA, t)
    const pB = vapourPressure(liquidB, t)
    return x * pA + (1 - x) * pB - 760
  }
  const tC = bisect((t) => -total(t), 0, 300)
  const yA = (x * vapourPressure(liquidA, tC)) / 760
  return { boilingPointC: tC, boilingPointK: tC + 273.15, vapourFractionA: yA }
}

/**
 * Number of theoretical plates of a fractionating column: column length over the height
 * equivalent to a theoretical plate (same units).
 *
 * @throws {RangeError} If either is not positive
 */
export function theoreticalPlates(columnLength: number, heightEquivalentPerPlate: number): number {
  if (!(columnLength > 0) || !(heightEquivalentPerPlate > 0)) {
    throw new RangeError('Column length and plate height must be positive')
  }
  return columnLength / heightEquivalentPerPlate
}

/**
 * Steam distillation (NCERT 8.8.4): a water-immiscible liquid boils when its vapour pressure plus
 * that of water equals the external pressure, so the mixture boils below the boiling point of
 * water. Returns the temperature (K) at which p_water + p_organic = pressure.
 */
export function steamDistillation(
  water: Antoine,
  organic: Antoine,
  pressureMmHg: number,
): { boilingPointK: number; belowWaterBoilingPoint: boolean } {
  if (!(pressureMmHg > 0)) {
    throw new RangeError('Pressure must be positive')
  }
  const f = (t: number): number => vapourPressure(water, t) + vapourPressure(organic, t) - pressureMmHg
  const tC = bisect((t) => -f(t), 0, 150)
  return { boilingPointK: tC + 273.15, belowWaterBoilingPoint: tC < 100 }
}

/**
 * Boiling point under reduced pressure from the Clausius-Clapeyron relation (NCERT 8.8.3):
 * 1/T2 = 1/T1 - R ln(P2 / P1) / dH, with R = 8.314 J K⁻¹ mol⁻¹.
 *
 * @param normalBoilingK boiling point T1 at pressure P1 (760 mmHg) in K
 * @param pressureMmHg P2 in mmHg
 * @param enthalpyJPerMol enthalpy of vaporisation dH in J mol⁻¹
 * @returns the boiling point in K at P2
 */
export function reducedPressureBoilingPoint(
  normalBoilingK: number,
  pressureMmHg: number,
  enthalpyJPerMol: number,
): number {
  if (!(pressureMmHg > 0) || !(normalBoilingK > 0) || !(enthalpyJPerMol > 0)) {
    throw new RangeError('Temperature, pressure and enthalpy must be positive')
  }
  const R = 8.314
  const invT2 = 1 / normalBoilingK - (R * Math.log(pressureMmHg / 760)) / enthalpyJPerMol
  return 1 / invT2
}

/**
 * Fraction of a solute left in the aqueous phase after n extractions with a fresh organic portion
 * each time (NCERT 8.8.4, differential extraction). With partition ratio K = [solute]org /
 * [solute]aq, each extraction leaves V_aq / (V_aq + K V_org) of the solute behind.
 *
 * @param partitionK distribution coefficient K
 * @param aqueousVolume volume of the aqueous phase
 * @param organicVolumePerPortion volume of each organic portion
 * @param extractions number of extractions, a positive integer
 */
export function partitionExtraction(
  partitionK: number,
  aqueousVolume: number,
  organicVolumePerPortion: number,
  extractions: number,
): number {
  if (!Number.isInteger(extractions) || extractions < 1) {
    throw new RangeError('Number of extractions must be a positive integer')
  }
  if (!(partitionK > 0) || !(aqueousVolume > 0) || !(organicVolumePerPortion > 0)) {
    throw new RangeError('K and volumes must be positive')
  }
  const perStep = aqueousVolume / (aqueousVolume + partitionK * organicVolumePerPortion)
  return perStep ** extractions
}
