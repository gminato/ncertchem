/**
 * The model behind the First law lab (NCERT Class 11 Unit 5, Section 5.1.4).
 *
 * The Learner's gas is one mole of a monatomic ideal gas in a cylinder with a frictionless piston.
 * Its internal energy depends only on temperature, U = (3/2) n R T + constant, so the heat capacity
 * at constant volume is C_V = (3/2) n R. The model keeps two independent books, the energy ledger
 * (q and w, added up action by action) and the temperature, so the first law can be checked on the
 * screen: q + w must equal C_V × ΔT.
 *
 * Sign convention (IUPAC, as Section 5.1.4): q is positive when heat enters the system, and w is
 * positive when work is done on it. ΔU = q + w.
 *
 * Piston moves are quick: no heat has time to cross, so q = 0 for a move, and the work is
 * w = −p_ext ΔV against a constant external pressure set by the weights (Section 5.2.1).
 */

import { JOULE_PER_LITRE_BAR, R_J_PER_MOL_K, R_LITRE_BAR_PER_MOL_K } from './pv-work'
import { STATE_FUNCTION_DEMO_PATHS, deltaU, type ThermoPath } from './thermo-first-law'

/** Amount of gas, mol. */
export const LAB_MOLES = 1

/** Heat capacity at constant volume of the monatomic ideal gas, J K⁻¹: C_V = (3/2) n R. */
export const LAB_CV_J_PER_K = 1.5 * LAB_MOLES * R_J_PER_MOL_K

/** Starting temperature, K. */
export const LAB_T_START_K = 300

/** Starting pressure, bar. The starting volume follows from pV = nRT. */
export const LAB_P_START_BAR = 1

/** Starting volume, litres: n R T / p. */
export const LAB_V_START_L = (LAB_MOLES * R_LITRE_BAR_PER_MOL_K * LAB_T_START_K) / LAB_P_START_BAR

/** The cylinder's inner volume range, litres. A move that would leave this range is refused. */
export const LAB_V_MIN_L = 10
export const LAB_V_MAX_L = 50

/** One press of the flame or the cooler moves this much heat, J. */
export const LAB_HEAT_STEP_J = 200

/** External pressure set by the weights, bar. */
export const LAB_P_EXT_MIN_BAR = 0.5
export const LAB_P_EXT_MAX_BAR = 2
export const LAB_P_EXT_STEP_BAR = 0.1

/** The energy ledger and the temperature of the gas, from the start of the lab. */
export interface LabState {
  /** Volume of the gas, litres. */
  volumeL: number
  /** Temperature of the gas, K. */
  temperatureK: number
  /** Heat added to the gas since the start, J. */
  q: number
  /** Work done on the gas since the start, J. */
  w: number
}

export type PistonResult =
  | { ok: true; state: LabState; workJ: number }
  | { ok: false; reason: string }

/** The starting state: 300 K, 1 bar, and an empty ledger. */
export function initialLabState(): LabState {
  return {
    volumeL: LAB_V_START_L,
    temperatureK: LAB_T_START_K,
    q: 0,
    w: 0,
  }
}

/** Pressure of the gas, bar: p = n R T / V. */
export function gasPressureBar(state: LabState): number {
  return (LAB_MOLES * R_LITRE_BAR_PER_MOL_K * state.temperatureK) / state.volumeL
}

/** ΔU since the start, from the ledger: q + w (equation 5.1), J. */
export function ledgerDeltaU(state: LabState): number {
  return deltaU(state.q, state.w)
}

/** ΔU since the start, from the temperature: C_V (T − T_start), J. For an ideal gas the two must agree. */
export function temperatureDeltaU(state: LabState): number {
  return LAB_CV_J_PER_K * (state.temperatureK - LAB_T_START_K)
}

/**
 * Adds heat at constant volume (the piston is held). The temperature rises by q / C_V, and the
 * ledger records q with no work. A negative `heatJ` removes heat.
 */
export function applyHeat(state: LabState, heatJ: number): LabState {
  if (!Number.isFinite(heatJ)) {
    throw new RangeError(`heat must be a finite number of joules (received ${heatJ})`)
  }
  return {
    ...state,
    temperatureK: state.temperatureK + heatJ / LAB_CV_J_PER_K,
    q: state.q + heatJ,
  }
}

/**
 * Lets the piston move until the gas is in mechanical equilibrium with the external pressure
 * p_ext. With q = 0 the energy balance is C_V (T_f − T_i) = −p_ext (V_f − V_i), and the
 * equilibrium condition is p_ext = n R T_f / V_f. Eliminating T_f gives, with C_V = (3/2) n R,
 *
 *   V_f = (p_ext V_i + C_V T_i) / (2.5 p_ext)
 *
 * taking the pressure in bar, the volume in litres and C_V in L bar K⁻¹. The work is
 * w = −p_ext (V_f − V_i), converted to J.
 *
 * @returns the new state, or a reason why the piston cannot move that far
 * @throws {RangeError} If the external pressure is not positive and finite
 */
export function movePiston(state: LabState, pExtBar: number): PistonResult {
  if (!Number.isFinite(pExtBar) || pExtBar <= 0) {
    throw new RangeError(`external pressure must be positive in bar (received ${pExtBar})`)
  }
  const cvLitreBar = LAB_CV_J_PER_K / JOULE_PER_LITRE_BAR
  const volumeF = (pExtBar * state.volumeL + cvLitreBar * state.temperatureK) / (2.5 * pExtBar)
  if (!(volumeF >= LAB_V_MIN_L && volumeF <= LAB_V_MAX_L)) {
    return {
      ok: false,
      reason: `The piston would stop at ${volumeF.toFixed(1)} L, outside the cylinder (${LAB_V_MIN_L} to ${LAB_V_MAX_L} L). Choose a pressure nearer to the gas pressure.`,
    }
  }
  const temperatureF = (pExtBar * volumeF) / (LAB_MOLES * R_LITRE_BAR_PER_MOL_K)
  const workLitreBar = -pExtBar * (volumeF - state.volumeL)
  const workJ = workLitreBar * JOULE_PER_LITRE_BAR
  return {
    ok: true,
    state: {
      volumeL: volumeF,
      temperatureK: temperatureF,
      q: state.q,
      w: state.w + workJ,
    },
    workJ,
  }
}

/** A route that the two-paths demo takes from state A to state B. */
export interface RouteEnd {
  path: ThermoPath
  /** ΔU = q + w along this route, J. */
  deltaUJ: number
  /** Temperature at B, K, from ΔU = C_V ΔT. The same for every route. */
  endTemperatureK: number
}

/**
 * The two routes of the two-paths demo, with the state B each one reaches. The demo uses the
 * routes from the thermodynamics foundation: one churns the gas with no heat (q = 0), the other
 * adds heat and churns less. Both keep the volume fixed, so both end at the same temperature.
 */
export function twoPathEnds(startK: number = LAB_T_START_K): readonly [RouteEnd, RouteEnd] {
  const end = (path: ThermoPath): RouteEnd => {
    const dU = deltaU(path.q, path.w)
    return { path, deltaUJ: dU, endTemperatureK: startK + dU / LAB_CV_J_PER_K }
  }
  return [end(STATE_FUNCTION_DEMO_PATHS[0]), end(STATE_FUNCTION_DEMO_PATHS[1])]
}
