/** A nuclide given by atomic number Z and mass number A. */
export interface Nuclide {
  /** Atomic number Z (number of protons) */
  Z: number
  /** Mass number A (protons + neutrons) */
  A: number
}

/** Particle counts for one atomic species (NCERT Class 11, Unit 2, equation 2.4 and Problems 2.1-2.2). */
export interface NucleonCounts {
  protons: number
  neutrons: number
  electrons: number
}

/** Symbol and name for an element, keyed by atomic number. */
export interface ElementNameEntry {
  symbol: string
  name: string
}

/**
 * Symbols and names for elements with Z = 1 to 36 (the range used for electronic
 * configurations). Overlapping entries agree with ELEMENTS in elements.ts.
 */
export const ELEMENT_NAMES_Z: Readonly<Record<number, ElementNameEntry>> = {
  1: { symbol: 'H', name: 'Hydrogen' },
  2: { symbol: 'He', name: 'Helium' },
  3: { symbol: 'Li', name: 'Lithium' },
  4: { symbol: 'Be', name: 'Beryllium' },
  5: { symbol: 'B', name: 'Boron' },
  6: { symbol: 'C', name: 'Carbon' },
  7: { symbol: 'N', name: 'Nitrogen' },
  8: { symbol: 'O', name: 'Oxygen' },
  9: { symbol: 'F', name: 'Fluorine' },
  10: { symbol: 'Ne', name: 'Neon' },
  11: { symbol: 'Na', name: 'Sodium' },
  12: { symbol: 'Mg', name: 'Magnesium' },
  13: { symbol: 'Al', name: 'Aluminium' },
  14: { symbol: 'Si', name: 'Silicon' },
  15: { symbol: 'P', name: 'Phosphorus' },
  16: { symbol: 'S', name: 'Sulphur' },
  17: { symbol: 'Cl', name: 'Chlorine' },
  18: { symbol: 'Ar', name: 'Argon' },
  19: { symbol: 'K', name: 'Potassium' },
  20: { symbol: 'Ca', name: 'Calcium' },
  21: { symbol: 'Sc', name: 'Scandium' },
  22: { symbol: 'Ti', name: 'Titanium' },
  23: { symbol: 'V', name: 'Vanadium' },
  24: { symbol: 'Cr', name: 'Chromium' },
  25: { symbol: 'Mn', name: 'Manganese' },
  26: { symbol: 'Fe', name: 'Iron' },
  27: { symbol: 'Co', name: 'Cobalt' },
  28: { symbol: 'Ni', name: 'Nickel' },
  29: { symbol: 'Cu', name: 'Copper' },
  30: { symbol: 'Zn', name: 'Zinc' },
  31: { symbol: 'Ga', name: 'Gallium' },
  32: { symbol: 'Ge', name: 'Germanium' },
  33: { symbol: 'As', name: 'Arsenic' },
  34: { symbol: 'Se', name: 'Selenium' },
  35: { symbol: 'Br', name: 'Bromine' },
  36: { symbol: 'Kr', name: 'Krypton' },
}

/**
 * Returns the numbers of protons, neutrons and electrons for a species.
 * Neutrons = A − Z. Electrons = Z − charge (the charge is 0 for a neutral atom,
 * negative for an anion, positive for a cation).
 *
 * @param Z Atomic number (integer ≥ 1)
 * @param A Mass number (integer ≥ Z)
 * @param charge Ionic charge (integer, default 0)
 * @throws {RangeError} If Z, A or charge are not valid integers, A < Z, or the
 *   electron count would be negative
 */
export function nucleons(Z: number, A: number, charge = 0): NucleonCounts {
  if (!Number.isInteger(Z) || Z < 1) {
    throw new RangeError(`Atomic number Z must be an integer ≥ 1 (received ${Z})`)
  }
  if (!Number.isInteger(A) || A < Z) {
    throw new RangeError(`Mass number A must be an integer ≥ Z (received A = ${A}, Z = ${Z})`)
  }
  if (!Number.isInteger(charge)) {
    throw new RangeError(`Charge must be an integer (received ${charge})`)
  }
  const electrons = Z - charge
  if (electrons < 0) {
    throw new RangeError(`Charge ${charge} removes more electrons than Z = ${Z} provides`)
  }
  return { protons: Z, neutrons: A - Z, electrons }
}

/**
 * True when two nuclides are isotopes: same Z, different A.
 */
export function areIsotopes(a: Nuclide, b: Nuclide): boolean {
  return a.Z === b.Z && a.A !== b.A
}

/**
 * True when two nuclides are isobars: same A, different Z.
 */
export function areIsobars(a: Nuclide, b: Nuclide): boolean {
  return a.A === b.A && a.Z !== b.Z
}
