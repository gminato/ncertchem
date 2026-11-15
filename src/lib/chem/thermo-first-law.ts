/**
 * The first law of thermodynamics, for NCERT Class 11 Unit 5, Section 5.1 (system, surroundings,
 * state functions and internal energy).
 *
 * Sign convention (IUPAC, as NCERT Section 5.1.4 states it): q is positive when heat is given to
 * the system, and w is positive when work is done on the system. Then ΔU = q + w. A system that
 * does work on its surroundings has w < 0. NCERT's Problem 5.1 solution (iii) writes q − w,
 * which is the older convention in which w is work done by the system; see the printed checks in
 * ncert-unit5-tables.ts.
 */

/** Tolerance, in the same units as the inputs, for comparing two values of a state function. */
const STATE_FUNCTION_TOLERANCE = 1e-9

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value})`)
  }
}

/**
 * Change in internal energy from heat and work, ΔU = q + w (equation 5.1).
 *
 * @param q Heat given to the system, positive when absorbed (any energy unit, used as given).
 * @param w Work done on the system, positive when done on it (same unit as q).
 * @throws {RangeError} If q or w is not a finite number
 */
export function deltaU(q: number, w: number): number {
  assertFinite('q', q)
  assertFinite('w', w)
  return q + w
}

/**
 * Change in internal energy for an adiabatic change, where no heat crosses the wall (q = 0).
 * ΔU = w_ad (NCERT Section 5.1.4(a)).
 *
 * @throws {RangeError} If w is not a finite number
 */
export function adiabaticDeltaU(w: number): number {
  assertFinite('w', w)
  return w
}

/**
 * Change in internal energy for an isolated system, where neither heat nor work crosses the
 * boundary. ΔU = 0 (NCERT Section 5.1.4(c)).
 */
export function isolatedDeltaU(): number {
  return 0
}

/** One route between two states, with the heat and work exchanged along it. */
export interface ThermoPath {
  name: string
  /** Heat given to the system along this path. */
  q: number
  /** Work done on the system along this path. */
  w: number
}

/**
 * Two routes from state A to state B that exchange different amounts of heat and work. Both
 * deliver ΔU = 1000 J, so the demo shows that U is a state function while q and w are not.
 * Numbers are in joules. NCERT's demo uses 1 kJ of work and an equal temperature change (Section
 * 5.1.4(a)); the heat-and-work route here is an illustration with the same ΔU.
 */
export const STATE_FUNCTION_DEMO_PATHS: readonly [ThermoPath, ThermoPath] = [
  { name: 'Adiabatic churning (w only)', q: 0, w: 1000 },
  { name: 'Heat and work together', q: 600, w: 400 },
]

/**
 * Whether two routes between the same two states give the same ΔU, which they must if U is a
 * state function. The routes are compared by their ΔU = q + w, not by q or w.
 *
 * @throws {RangeError} If either path has a non-finite q or w
 */
export function pathsGiveSameDeltaU(a: ThermoPath, b: ThermoPath): boolean {
  return Math.abs(deltaU(a.q, a.w) - deltaU(b.q, b.w)) < STATE_FUNCTION_TOLERANCE
}

/**
 * Whether two routes differ in q or w, even when their ΔU agrees. This is the other half of the
 * demo: the path quantities depend on the route.
 */
export function pathsDifferInHeatOrWork(a: ThermoPath, b: ThermoPath): boolean {
  return Math.abs(a.q - b.q) > STATE_FUNCTION_TOLERANCE || Math.abs(a.w - b.w) > STATE_FUNCTION_TOLERANCE
}
