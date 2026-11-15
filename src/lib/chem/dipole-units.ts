/**
 * Dipole moment units for NCERT Class 11 Unit 4, Section 4.3.6. NCERT gives dipole moments in
 * debye (D) and gives the conversion 1 D = 3.33564 × 10⁻³⁰ C m (C is coulomb, m is metre).
 * Only the three values NCERT prints in coulomb metres are shown in SI, so a Learner sees the
 * book's own numbers and no derived ones.
 */

/** 1 debye in coulomb metres, as printed in NCERT Section 4.3.6 (book p. 111). */
export const DEBYE_IN_CM = 3.33564e-30

/** Converts a dipole moment in debye to coulomb metres. */
export function debyeToCm(debye: number): number {
  return debye * DEBYE_IN_CM
}

/**
 * Dipole moments that NCERT prints in coulomb metres, in units of 10⁻³⁰ C m (as printed).
 * H₂O: 6.17 (book p. 111). NH₃ and NF₃: 4.90 and 0.80 (book p. 112).
 */
export const NCERT_PRINTED_SI_DIPOLES: Readonly<Record<string, number>> = {
  H2O: 6.17,
  NH3: 4.9,
  NF3: 0.8,
}

/**
 * The SI value NCERT prints for a molecule, as a display string such as "6.17 × 10⁻³⁰ C m",
 * or null when NCERT does not print one for it.
 */
export function printedSiDipole(molecule: string): string | null {
  const value = NCERT_PRINTED_SI_DIPOLES[molecule]
  return value === undefined ? null : `${value.toFixed(2)} × 10⁻³⁰ C m`
}
