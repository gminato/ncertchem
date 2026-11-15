/**
 * Morse potential for a diatomic bond: the energy of two atoms as a function of
 * their separation. Zero means the atoms are infinitely far apart. The minimum
 * sits at the bond length, and its depth is the bond dissociation energy.
 */

export interface MorseParams {
  /** Equilibrium bond length, in pm. */
  re: number
  /** Well depth (bond dissociation energy), in kJ/mol. Positive. */
  de: number
  /** Width parameter, in pm⁻¹. Larger means a narrower well. */
  a: number
}

/** H–H: bond length 74 pm, bond enthalpy 435.8 kJ/mol (NCERT). */
export const H2_MORSE: MorseParams = { re: 74, de: 435.8, a: 0.0194 }

/** Energy (kJ/mol) at separation r (pm). Equals -de at r = re, and 0 as r grows large. */
export function morseEnergy(r: number, { re, de, a }: MorseParams): number {
  const x = 1 - Math.exp(-a * (r - re))
  return de * (x * x - 1)
}

/** Samples the curve from r0 to r1 (pm) at evenly spaced points. */
export function morseCurve(params: MorseParams, r0: number, r1: number, samples = 96): { r: number; e: number }[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const r = r0 + ((r1 - r0) * i) / samples
    return { r, e: morseEnergy(r, params) }
  })
}
