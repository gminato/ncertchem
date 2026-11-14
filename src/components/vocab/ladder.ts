export interface LadderYOptions {
  top: number
  bottom: number
  eMin: number
  eMax: number
}

/**
 * 1 eV expressed in Joules.
 * Standard conversion constant: 1 eV = 1.602e-19 J.
 */
export const EV_IN_JOULES = 1.602e-19

/**
 * Converts energy in Joules to electron-volts (eV).
 */
export function joulesToEv(joules: number): number {
  return joules / EV_IN_JOULES
}

/**
 * Maps energy linearly to an SVG y-coordinate.
 *
 * eMin (lowest energy / ground state) maps exactly to `bottom` (higher y in SVG).
 * eMax (highest energy / excited state) maps exactly to `top` (lower y in SVG).
 *
 * @param energyEv Energy value in eV
 * @param options Diagram bounds and energy extent
 * @returns Mapped SVG y coordinate
 */
export function ladderY(
  energyEv: number,
  { top, bottom, eMin, eMax }: LadderYOptions
): number {
  if (eMax === eMin) {
    return bottom
  }
  const t = (energyEv - eMin) / (eMax - eMin)
  return bottom + t * (top - bottom)
}
