/**
 * Pressure–volume work for NCERT Class 11 Unit 5, Section 5.2.1 (Work). Covers irreversible
 * expansion against a constant external pressure (Problems 5.2 and 5.3), free expansion into
 * vacuum, reversible isothermal expansion of an ideal gas (Problem 5.4), and a stepwise expansion
 * that converges to the reversible work as the number of steps grows.
 *
 * Sign convention (IUPAC, as Section 5.1.4): w is positive when work is done on the system. For
 * an expansion w is negative, w = −p_ex ΔV.
 *
 * Units: pressures in bar, volumes in litres, so p × V is in litre-bar (L bar). 1 L bar = 100 J.
 * Results are returned in both L bar and J. NCERT's worked answers are in L atm; use
 * litreAtmFromJoule to compare with them (1 L atm = 101.325 J).
 */

/** Joules per litre-bar. Exact: 1 bar = 10⁵ Pa and 1 L = 10⁻³ m³. */
export const JOULE_PER_LITRE_BAR = 100

/** Joules per litre-atmosphere, 101.325 (1 atm = 1.01325 bar). */
export const JOULE_PER_LITRE_ATM = 101.325

/** Bar per atmosphere. NCERT's Problem 5.3 uses 1 atm; this site converts with this factor. */
export const BAR_PER_ATM = 1.01325

/**
 * Gas constant in J mol⁻¹ K⁻¹, as used in NCERT Unit 5 (Problems 5.7, 5.12, 5.14). Problem 5.5
 * uses 8.3; see ncert-unit5-tables.ts for that rounding.
 */
export const R_J_PER_MOL_K = 8.314

/** Gas constant in L bar mol⁻¹ K⁻¹, which is R_J_PER_MOL_K / 100. */
export const R_LITRE_BAR_PER_MOL_K = R_J_PER_MOL_K / JOULE_PER_LITRE_BAR

/** The coefficient NCERT writes in front of log: 2.303 ≈ ln 10. */
const NCERT_LN10 = 2.303

/** Work in both units. Negative means the system did work on its surroundings. */
export interface Work {
  litreBar: number
  joule: number
}

/** Work from a value in L bar. */
export function workFromLitreBar(litreBar: number): Work {
  assertFinite('work', litreBar)
  // Adding 0 turns a negative zero into a plain zero.
  const value = litreBar + 0
  return { litreBar: value, joule: value * JOULE_PER_LITRE_BAR }
}

/** Work from a value in joules. */
export function workFromJoule(joule: number): Work {
  assertFinite('work', joule)
  return { litreBar: joule / JOULE_PER_LITRE_BAR + 0, joule: joule + 0 }
}

/** Convert joules to litre-atmospheres, the unit NCERT uses for Problems 5.2 to 5.4. */
export function litreAtmFromJoule(joule: number): number {
  assertFinite('work', joule)
  return joule / JOULE_PER_LITRE_ATM
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value})`)
  }
}

function assertPositiveVolume(name: string, volumeL: number): void {
  if (!Number.isFinite(volumeL) || volumeL <= 0) {
    throw new RangeError(`${name} must be a positive volume in litres (received ${volumeL})`)
  }
}

/**
 * Work for an expansion or compression against a constant external pressure, in one step:
 * w = −p_ex (V_f − V_i) (equation 5.2). Problems 5.2 and 5.3 use this with p_ex = 1 atm.
 *
 * @param pExternalBar External pressure in bar, zero or positive.
 * @param initialVolumeL Initial volume in litres.
 * @param finalVolumeL Final volume in litres.
 * @throws {RangeError} If a pressure or volume is invalid
 */
export function irreversibleConstantPressureWork(
  pExternalBar: number,
  initialVolumeL: number,
  finalVolumeL: number,
): Work {
  if (!Number.isFinite(pExternalBar) || pExternalBar < 0) {
    throw new RangeError(`external pressure must be zero or positive (received ${pExternalBar})`)
  }
  assertPositiveVolume('initial volume', initialVolumeL)
  assertPositiveVolume('final volume', finalVolumeL)
  return workFromLitreBar(-pExternalBar * (finalVolumeL - initialVolumeL))
}

/**
 * Work for free expansion of an ideal gas into vacuum (p_ex = 0), w = 0 (Section 5.2.1). This is
 * true whether the expansion is reversible or not.
 */
export function freeExpansionWork(): Work {
  return workFromLitreBar(0)
}

/**
 * Work for a reversible isothermal expansion or compression of an ideal gas, in NCERT's form
 * w_rev = −2.303 nRT log₁₀(V_f / V_i) (equation 5.5). Here the log is base ten, as NCERT writes it.
 *
 * @param moles Amount of gas, mol, positive.
 * @param temperatureK Temperature in kelvin, positive.
 * @param initialVolumeL Initial volume in litres.
 * @param finalVolumeL Final volume in litres.
 * @throws {RangeError} If an amount, temperature or volume is invalid
 */
export function reversibleIsothermalWork(
  moles: number,
  temperatureK: number,
  initialVolumeL: number,
  finalVolumeL: number,
): Work {
  if (!Number.isFinite(moles) || moles <= 0) {
    throw new RangeError(`amount must be positive (received ${moles})`)
  }
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`temperature must be positive in kelvin (received ${temperatureK})`)
  }
  assertPositiveVolume('initial volume', initialVolumeL)
  assertPositiveVolume('final volume', finalVolumeL)
  const joule = -NCERT_LN10 * moles * R_J_PER_MOL_K * temperatureK * Math.log10(finalVolumeL / initialVolumeL)
  return workFromJoule(joule)
}

/** Work from a stepwise expansion, with the number of steps used. */
export interface SteppedWork extends Work {
  steps: number
}

/**
 * Work for an isothermal expansion carried out in N equal volume steps. At each step the external
 * pressure is set to the gas pressure at the end of that step, p = nRT / V_k, and the volume rises
 * by ΔV = (V_f − V_i) / N. The sum Σ p_k ΔV converges to the reversible work as N grows, which
 * is the basis for an animation of the reversible limit (NCERT Figure 5.5(b) and 5.5(c)).
 *
 * For N = 1 this is the one-step irreversible expansion against the final pressure.
 *
 * @param steps Number of steps, an integer of 1 or more.
 * @throws {RangeError} If an input is invalid
 */
export function steppedIsothermalWork(
  moles: number,
  temperatureK: number,
  initialVolumeL: number,
  finalVolumeL: number,
  steps: number,
): SteppedWork {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`steps must be an integer of 1 or more (received ${steps})`)
  }
  if (!Number.isFinite(moles) || moles <= 0) {
    throw new RangeError(`amount must be positive (received ${moles})`)
  }
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`temperature must be positive in kelvin (received ${temperatureK})`)
  }
  assertPositiveVolume('initial volume', initialVolumeL)
  assertPositiveVolume('final volume', finalVolumeL)

  const nRT = moles * R_LITRE_BAR_PER_MOL_K * temperatureK
  const dV = (finalVolumeL - initialVolumeL) / steps
  let litreBar = 0
  for (let k = 1; k <= steps; k++) {
    const volumeEnd = initialVolumeL + k * dV
    const pExternal = nRT / volumeEnd
    litreBar -= pExternal * dV
  }
  return { ...workFromLitreBar(litreBar), steps }
}
