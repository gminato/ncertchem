/**
 * Physical constants used in atomic physics and spectral calculations,
 * aligned with NCERT Class 11 Chemistry, Unit 2 ("Structure of Atom").
 */

/**
 * Bohr energy constant (called R_H in NCERT Class 11, Unit 2).
 * Unit: Joules (J)
 */
export const RH_JOULES = 2.18e-18

/**
 * Rydberg constant for hydrogen (NCERT Class 11, Unit 2).
 * Unit: cm⁻¹
 */
export const RYDBERG_CM = 109677

/**
 * Radius of the first stationary state / Bohr radius (a₀ in NCERT Class 11, Unit 2).
 * Unit: picometers (pm)
 */
export const BOHR_RADIUS_PM = 52.9

/**
 * Planck's constant (h in NCERT Class 11, Unit 2).
 * Unit: Joule-seconds (J·s)
 */
export const PLANCK = 6.626e-34

/**
 * Speed of light in vacuum (c in NCERT Class 11, Unit 2).
 * Unit: meters per second (m/s)
 */
export const SPEED_OF_LIGHT = 3.0e8

/**
 * Avogadro constant as used in NCERT Class 11 Unit 1 calculations (6.022 × 10²³ mol⁻¹).
 * The exact defined value is 6.02214076e23 mol⁻¹ (AVOGADRO_EXACT); NCERT's rounded
 * value is used here so that worked examples reproduce the textbook numbers.
 * Unit: mol⁻¹
 */
export const AVOGADRO = 6.022e23

/**
 * One atomic mass unit in grams (1 u = 1.66056 × 10⁻²⁴ g).
 * Unit: g
 */
export const AMU_GRAMS = 1.66056e-24

/**
 * Electron rest mass (m_e in NCERT Class 11, Unit 2, equation 2.2).
 * NCERT's worked values use 9.1094 × 10⁻³¹ kg (Table 2.1 lists 9.109382 × 10⁻³¹ kg,
 * the more precise CODATA value; the rounded value is used here so that
 * worked examples reproduce the textbook numbers).
 * Unit: kilograms (kg)
 */
export const ELECTRON_MASS_KG = 9.1094e-31

/**
 * Magnitude of the electron charge (e in NCERT Class 11, Unit 2, section 2.1.3).
 * Unit: coulombs (C)
 */
export const ELEMENTARY_CHARGE_C = 1.602176e-19

/**
 * Charge-to-mass ratio of the electron, e/m_e (NCERT Class 11, Unit 2, equation 2.1).
 * Unit: C kg⁻¹
 */
export const ELECTRON_CHARGE_TO_MASS = 1.75882e11

/**
 * Proton rest mass (NCERT Class 11, Unit 2, Table 2.1).
 * Unit: kilograms (kg)
 */
export const PROTON_MASS_KG = 1.6726216e-27

/**
 * Neutron rest mass (NCERT Class 11, Unit 2, Table 2.1).
 * Unit: kilograms (kg)
 */
export const NEUTRON_MASS_KG = 1.674927e-27

/**
 * Joules per electronvolt. NCERT Class 11, Unit 2 uses 1 eV = 1.6020 × 10⁻¹⁹ J
 * (in its exercises); the exact SI-defined value is 1.602176634 × 10⁻¹⁹ J.
 * The NCERT rounded value is used here so that worked examples match the textbook.
 * Unit: J per eV
 */
export const EV_JOULES = 1.602e-19
